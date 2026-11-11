import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Sparkles, 
  Bell, 
  CheckCircle, 
  Cpu, 
  ShieldCheck, 
  Zap, 
  Send, 
  CheckCheck, 
  ExternalLink, 
  ChevronDown, 
  Activity, 
  Layers, 
  ArrowRight, 
  RefreshCw, 
  Radio, 
  User as UserIcon, 
  LogIn,
  Mail
} from 'lucide-react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { 
  getNotifications, 
  markNotificationRead, 
  markAllNotificationsRead, 
  getSettings, 
  updateSettings, 
  getSyncStatus, 
  triggerSyncNow, 
  getCurrentUser 
} from '../../services/api';

export const Navbar = ({ onOpenSimulate, onOpenLogin, onOpenReport, onOpenImport }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [settings, setSettings] = useState({
    llm_provider: 'mock',
    autopilot_enabled: false,
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [syncStatus, setSyncStatus] = useState({ is_syncing: true, last_synced_at: null });
  const [isSyncingNow, setIsSyncingNow] = useState(false);
  const [backendHealthy, setBackendHealthy] = useState(true);

  const fetchNavbarData = async () => {
    try {
      const [notifsData, settingsData, syncData, userData] = await Promise.all([
        getNotifications().catch(() => ({ notifications: [], unread_count: 0 })),
        getSettings().catch(() => ({ llm_provider: 'mock', autopilot_enabled: false })),
        getSyncStatus().catch(() => ({ is_syncing: true, last_synced_at: null })),
        getCurrentUser().catch(() => null)
      ]);
      setNotifications(notifsData.notifications || []);
      setUnreadCount(notifsData.unread_count || 0);
      setSettings(settingsData);
      setSyncStatus(syncData);
      setCurrentUser(userData);
      setBackendHealthy(true);
    } catch (e) {
      setBackendHealthy(false);
    }
  };

  useEffect(() => {
    fetchNavbarData();
    const interval = setInterval(fetchNavbarData, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleAutopilot = async () => {
    try {
      const updated = await updateSettings({ autopilot_enabled: !settings.autopilot_enabled });
      setSettings(updated);
    } catch (e) {
      console.error('Failed to toggle autopilot:', e);
    }
  };

  const handleTriggerSync = async () => {
    setIsSyncingNow(true);
    try {
      await triggerSyncNow();
      await fetchNavbarData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncingNow(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) {}
  };

  const handleNotifClick = async (notif) => {
    if (!notif.is_read) {
      try {
        await markNotificationRead(notif.id);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      } catch (e) {}
    }
    setIsNotifOpen(false);
    if (notif.type === 'HITL_REQUEST') {
      navigate('/approvals');
    } else if (notif.metadata?.workflow_id) {
      navigate('/workflows');
    }
  };

  const getProviderInfo = () => {
    switch (settings.llm_provider) {
      case 'groq':
        return { name: 'Groq LPU', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
      case 'openai':
        return { name: 'OpenAI GPT-4o', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
      case 'ollama':
        return { name: 'Local Ollama', color: 'bg-violet-500/15 text-violet-300 border-violet-500/30' };
      default:
        return { name: 'Smart Mock NLP', color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' };
    }
  };

  const provider = getProviderInfo();

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 bg-[#080c16]/90 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        
        {/* Brand & Active Model Badge */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 p-0.5 flex items-center justify-center shadow-glow-primary">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-sm font-display tracking-tight text-white flex items-center gap-1.5">
                EmailFlow<span className="text-indigo-400">Agent</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono block -mt-0.5">
                LangGraph StateGraph • Multi-Agent
              </span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-800">
            <span className={clsx('px-2.5 py-0.5 rounded-full text-[10px] font-mono border flex items-center gap-1.5 font-bold', provider.color)}>
              <Cpu className="w-3 h-3" />
              {provider.name}
            </span>

            {/* Continuous Live Background Sync Daemon Status */}
            <div 
              onClick={handleTriggerSync}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-slate-900/90 text-slate-300 border border-slate-700/80 hover:border-indigo-500/50 transition-colors cursor-pointer"
              title="Click to trigger immediate email sync pass"
            >
              <Radio className={clsx('w-3 h-3 text-emerald-400', isSyncingNow && 'animate-spin')} />
              <span>{isSyncingNow ? 'Reading Mailbox...' : 'Live Sync: Active'}</span>
            </div>
          </div>
        </div>

        {/* Action Controls & Quick Buttons */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          
          {/* Autopilot Switch */}
          <button
            onClick={handleToggleAutopilot}
            className={clsx(
              'hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all',
              settings.autopilot_enabled
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 font-bold shadow-glow-primary'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
            )}
            title="Autopilot skips Human Approval when model confidence exceeds threshold"
          >
            <Zap className={clsx('w-3.5 h-3.5', settings.autopilot_enabled ? 'text-indigo-400 fill-current' : 'text-slate-500')} />
            <span>Autopilot: {settings.autopilot_enabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Ingest / Import Email CTA */}
          <button
            onClick={onOpenImport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all active:scale-95"
            title="Compose or Import Raw RFC822 / EML Email"
          >
            <Mail className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Ingest Email</span>
          </button>

          {/* Download Report CTA */}
          <button
            onClick={onOpenReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-glow-primary transition-all active:scale-95"
            title="Download PDF Executive Report or CSVs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Report</span>
          </button>

          {/* Notification Bell Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Drawer */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-2xl glass-panel border border-slate-700/80 shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200 bg-[#0d1322]">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">Notifications & Alerts</span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="mt-2.5 max-h-72 overflow-y-auto space-y-2 pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 py-8">No notifications yet.</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotifClick(n)}
                        className={clsx(
                          'p-3 rounded-xl border text-left cursor-pointer transition-all',
                          n.is_read
                            ? 'bg-slate-950/60 border-slate-900 text-slate-400'
                            : 'bg-slate-900/90 border-slate-700 text-white hover:bg-slate-800 shadow-sm'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold text-slate-200">{n.title}</p>
                          <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-300 line-clamp-2 leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Connected Mailbox Pill */}
          <div 
            onClick={onOpenLogin}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-white cursor-pointer transition-all shadow-sm"
            title="Click to Connect or Switch Real Email Account"
          >
            <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-slate-200 leading-tight">
                {currentUser?.email ? (
                  <span className="truncate max-w-[130px] block">{currentUser.email}</span>
                ) : (
                  <span>Connect Mailbox</span>
                )}
              </div>
              <div className="text-[9px] text-slate-400 font-mono leading-none mt-0.5">
                {currentUser?.provider === 'REAL_IMAP' ? 'Live IMAP Connected' : 'IMAP / Gmail'}
              </div>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};

