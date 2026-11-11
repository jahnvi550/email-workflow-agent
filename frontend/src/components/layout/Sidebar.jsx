import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Inbox, 
  CheckSquare, 
  GitBranch, 
  Calendar, 
  ShieldAlert, 
  BarChart3, 
  Settings, 
  Radio, 
  Sparkles, 
  Zap, 
  Activity 
} from 'lucide-react';
import clsx from 'clsx';
import { NavLink, useLocation } from 'react-router-dom';
import { getEmails, getWorkflows } from '../../services/api';

export const Sidebar = () => {
  const location = useLocation();
  const [unprocessedCount, setUnprocessedCount] = useState(0);
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0);

  const fetchBadgeCounts = async () => {
    try {
      const [emailsData, workflowsData] = await Promise.all([
        getEmails({ status: 'UNPROCESSED' }).catch(() => []),
        getWorkflows({ state: 'PENDING_APPROVAL' }).catch(() => [])
      ]);
      setUnprocessedCount(Array.isArray(emailsData) ? emailsData.length : 0);
      setPendingApprovalCount(Array.isArray(workflowsData) ? workflowsData.length : 0);
    } catch (e) {}
  };

  useEffect(() => {
    fetchBadgeCounts();
    const interval = setInterval(fetchBadgeCounts, 15000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  const navItems = [
    {
      to: '/',
      name: 'Command Center',
      icon: LayoutDashboard,
      badge: null,
      exact: true
    },
    {
      to: '/inbox',
      name: 'Live Mailbox',
      icon: Inbox,
      badge: unprocessedCount > 0 ? `${unprocessedCount} new` : null,
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
    },
    {
      to: '/tasks',
      name: 'Kanban Tasks',
      icon: CheckSquare,
      badge: null
    },
    {
      to: '/workflows',
      name: 'Workflow Canvas',
      icon: GitBranch,
      badge: null
    },
    {
      to: '/calendar',
      name: 'Smart Calendar',
      icon: Calendar,
      badge: null
    },
    {
      to: '/approvals',
      name: 'HITL Approvals',
      icon: ShieldAlert,
      badge: pendingApprovalCount > 0 ? `${pendingApprovalCount} pending` : null,
      badgeColor: 'badge-high animate-pulse'
    },
    {
      to: '/analytics',
      name: 'ROI & Analytics',
      icon: BarChart3,
      badge: null
    },
    {
      to: '/settings',
      name: 'Settings & Account',
      icon: Settings,
      badge: null
    },
  ];

  return (
    <aside className="w-64 glass-panel border-r border-slate-800/80 bg-[#0a0f1d]/95 flex flex-col justify-between p-4 shrink-0 min-h-[calc(100vh-4rem)]">
      
      {/* Navigation List */}
      <div className="space-y-6">
        <div>
          <div className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Autonomous Workspaces
          </div>
          <nav className="space-y-1">
            {navItems.slice(0, 6).map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  className={({ isActive }) => clsx(
                    'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 group',
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-glow-primary'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                  )}
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <Icon className={clsx('w-4 h-4', isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400 transition-colors')} />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className={clsx(
                          'px-2 py-0.5 rounded-full text-[10px] font-bold font-mono',
                          isActive ? 'bg-white/20 text-white' : item.badgeColor
                        )}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div>
          <div className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Telemetry & Controls
          </div>
          <nav className="space-y-1">
            {navItems.slice(6).map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => clsx(
                    'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 group',
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-glow-primary'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                  )}
                >
                  {({ isActive }) => (
                    <div className="flex items-center gap-3">
                      <Icon className={clsx('w-4 h-4', isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400 transition-colors')} />
                      <span>{item.name}</span>
                    </div>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer System Status Card */}
      <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            Zero-Touch Sync Daemon
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          APScheduler continuous mailbox worker active.
        </p>
      </div>

    </aside>
  );
};

