import React from 'react';
import { 
  LayoutDashboard, 
  Inbox, 
  GitBranch, 
  Kanban, 
  Calendar as CalendarIcon, 
  Settings,
  Sparkles,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Cpu,
  Activity
} from 'lucide-react';
import clsx from 'clsx';

export const Sidebar = ({ activeTab, setActiveTab, counts = {} }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, desc: 'KPIs & Live Orchestration' },
    { id: 'inbox', label: 'Email Inbox', icon: Inbox, desc: 'Raw Ingestion Stream', count: counts.unprocessedEmails, countColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    { id: 'workflows', label: 'Agent Workflows', icon: GitBranch, desc: 'LangGraph StateGraph & HITL', count: counts.pendingHITL, countColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse' },
    { id: 'tasks', label: 'Kanban Tasks', icon: Kanban, desc: 'Extracted Action Items', count: counts.activeTasks },
    { id: 'calendar', label: 'Calendar & Sync', icon: CalendarIcon, desc: 'Scheduled Meetings', count: counts.upcomingMeetings },
    { id: 'settings', label: 'LLM & Policies', icon: Settings, desc: 'Provider Vault & Autopilot' },
  ];

  return (
    <aside className="w-64 shrink-0 glass-panel border-r border-surface-border min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 hidden md:flex">
      
      {/* Navigation Links */}
      <div className="space-y-2">
        <div className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
          Agentic Workspace
        </div>
        
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={clsx(
                  'w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all duration-200 group text-left relative overflow-hidden',
                  isActive
                    ? 'bg-gradient-to-r from-primary-600/30 via-primary-600/20 to-transparent text-white border border-primary-500/50 shadow-glow-primary'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 border border-transparent'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    'p-2 rounded-xl border transition-colors',
                    isActive ? 'bg-primary-600 text-white border-primary-400/50 shadow-sm' : 'bg-slate-900 border-slate-800 text-slate-400 group-hover:text-slate-200 group-hover:border-slate-700'
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs block leading-tight">{item.label}</span>
                    <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">{item.desc}</span>
                  </div>
                </div>
                
                {item.count !== undefined && item.count > 0 && (
                  <span className={clsx(
                    'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border',
                    item.countColor || 'bg-slate-800 text-slate-300 border-slate-700'
                  )}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer System Status Card */}
      <div className="rounded-2xl p-4 bg-gradient-to-b from-slate-900/90 to-[#070a13] border border-slate-800/90 text-xs shadow-inner space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-primary-400 font-bold text-[11px] uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5" />
            Agent Engine
          </span>
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            100% Ready
          </span>
        </div>
        
        <p className="text-slate-400 text-[11px] leading-relaxed">
          StateGraph with checkpoint interruptions & risk safety gates.
        </p>

        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>Batch 05 CSE</span>
          <span>v1.0.0 Prod</span>
        </div>
      </div>

    </aside>
  );
};
