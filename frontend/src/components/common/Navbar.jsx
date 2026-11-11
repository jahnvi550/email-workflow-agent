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
  ArrowRight
} from 'lucide-react';
import clsx from 'clsx';
import { getNotifications, markNotificationRead, markAllNotificationsRead, getSettings, updateSettings } from '../../services/api';

export const Navbar = ({ onOpenSimulate, onSelectWorkflow, onNavigateTab }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [settings, setSettings] = useState({
    llm_provider: 'mock',
    autopilot_enabled: false,
  });
  const [backendHealthy, setBackendHealthy] = useState(true);

  const fetchNotifs = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
      setBackendHealthy(true);
    } catch (e) {
      setBackendHealthy(false);
    }
  };

  const fetchSettingsData = async () => {
    try {
      const data = await getSettings();
      setSettings(data);
    } catch (e) {}
  };

  useEffect(() => {
    fetchNotifs();
    fetchSettingsData();
    const interval = setInterval(fetchNotifs, 10000);
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
    if (notif.metadata?.workflow_id && onSelectWorkflow) {
      onSelectWorkflow(notif.metadata.workflow_id);
      setIsNotifOpen(false);
    }
  };

  const getProviderInfo = () => {
    switch (settings.llm_provider) {
      case 'groq': return { label: 'Groq (Llama 3.3 70B)', color: 'text-amber-400', badge: 'Cloud LPU' };
      case 'openai': return { label: 'OpenAI (GPT-4o-mini)', color: 'text-emerald-400', badge: 'Cloud API' };
      case 'ollama': return { label: 'Ollama (Local Llama 3)', color: 'text-cyan-400', badge: 'Local GPU' };
      default: return { label: 'Smart Mock NLP', color: 'text-indigo-400', badge: '0-Key Free' };
    }
  };

  const providerInfo = getProviderInfo();

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-surface-border/80 bg-[#070a13]/85 backdrop-blur-2xl">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Branding & Tag */}
        <div className="flex items-center gap-4">
          <div 
            onClick={() => onNavigateTab && onNavigateTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-600 via-primary-500 to-accent-cyan p-0.5 shadow-glow-primary group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-[#0d1322] rounded-[14px] flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary-400 group-hover:text-primary-300 transition-colors" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-lg tracking-tight text-white group-hover:text-primary-300 transition-colors">
                  EmailFlow<span className="text-primary-400">Agent</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-primary-500/20 to-accent-cyan/20 text-primary-300 border border-primary-500/30">
                  BATCH-05
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block font-medium">
                LangGraph StateGraph Task Orchestrator
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden md:block" />

          {/* Active LLM Provider Pill */}
          <div 
            onClick={() => onNavigateTab && onNavigateTab('settings')}
            className="hidden lg:flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800/90 text-xs hover:border-primary-500/50 cursor-pointer transition-all shadow-inner"
            title="Click to configure LLM provider settings"
          >
            <Cpu className={clsx('w-3.5 h-3.5', providerInfo.color)} />
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">Provider:</span>
              <span className="font-bold text-slate-200">{providerInfo.label}</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                {providerInfo.badge}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Autopilot Switch, Simulate CTA & Notifications */}
        <div className="flex items-center gap-3">
          
          {/* Autopilot Switch */}
          <button
            onClick={handleToggleAutopilot}
            className={clsx(
              'hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all duration-200',
              settings.autopilot_enabled
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/50 shadow-glow-emerald'
                : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
            )}
            title={settings.autopilot_enabled ? "Autopilot Active: Auto-executes high-confidence tasks" : "HITL Guard Active: Requires human sign-off"}
          >
            {settings.autopilot_enabled ? (
              <>
                <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                <span>Autopilot: ON</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>HITL Safety Mode</span>
              </>
            )}
          </button>

          {/* Simulate Email Quick CTA */}
          <button
            onClick={onOpenSimulate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-600 via-primary-500 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white text-xs font-bold shadow-glow-primary hover:shadow-indigo-500/30 transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4 animate-spin-slow" />
            <span>Simulate Email</span>
          </button>

          {/* Notification Bell Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-glow-rose animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Drawer */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-2xl glass-panel border border-surface-border shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">Notifications & Alerts</span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-300 text-xs font-bold border border-primary-500/30">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 font-semibold"
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
                            ? 'bg-slate-900/40 border-slate-800/80 text-slate-400'
                            : 'bg-primary-950/40 border-primary-500/40 text-slate-200 hover:bg-primary-900/40 shadow-sm'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold text-white">{n.title}</p>
                          <span className="text-[10px] text-slate-500 shrink-0 font-mono">
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

          {/* Backend Status Dot */}
          <div className="flex items-center gap-2 pl-2">
            <span className={clsx(
              'w-2.5 h-2.5 rounded-full',
              backendHealthy ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)] animate-pulse' : 'bg-rose-500'
            )} />
            <span className="text-[11px] font-semibold text-slate-400 hidden xl:inline">
              {backendHealthy ? 'API Online' : 'API Offline'}
            </span>
          </div>

        </div>
      </div>
    </header>
  );
};
