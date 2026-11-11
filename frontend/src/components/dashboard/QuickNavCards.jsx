import React from 'react';
import { 
  Inbox, 
  CheckSquare, 
  GitBranch, 
  Calendar, 
  ShieldAlert, 
  BarChart3, 
  ArrowRight,
  Zap,
  Sparkles
} from 'lucide-react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';

export const QuickNavCards = ({ onQuickSimulate, simulatingPreset }) => {
  const navigate = useNavigate();

  const subPages = [
    {
      title: 'Live Mailbox',
      desc: 'Real-time triaged emails with AI priority and category tags.',
      path: '/inbox',
      icon: Inbox,
      badge: 'Live Stream'
    },
    {
      title: 'Kanban Tasks',
      desc: 'Actionable Kanban boards populated automatically from email content.',
      path: '/tasks',
      icon: CheckSquare,
      badge: '4 Stages'
    },
    {
      title: 'Workflow Canvas',
      desc: 'Interactive step-by-step visual LangGraph state transition graph.',
      path: '/workflows',
      icon: GitBranch,
      badge: 'StateGraph'
    },
    {
      title: 'Smart Calendar',
      desc: 'Automated meeting agendas and Google Meet room dispatching.',
      path: '/calendar',
      icon: Calendar,
      badge: 'Meet Ready'
    },
    {
      title: 'HITL Approvals',
      desc: 'Review, edit, and approve high-stakes draft replies and emergency fixes.',
      path: '/approvals',
      icon: ShieldAlert,
      badge: 'Safety Gate'
    },
    {
      title: 'ROI & Analytics',
      desc: 'Time saved ROI metrics, classification breakdowns, and velocity stats.',
      path: '/analytics',
      icon: BarChart3,
      badge: 'Telemetry'
    }
  ];

  const presets = [
    { id: 'urgent-server-down', label: '🚨 Server Outage P0', sub: 'Production Fix by 2 PM' },
    { id: 'client-q3-strategy', label: '📊 Q3 Strategy Sync', sub: 'Client Meeting Request' },
    { id: 'final-project-report', label: '🎓 Final Project Report', sub: 'Committee Deadline' },
    { id: 'vendor-sow', label: '⚖️ SOW Legal Redline', sub: 'Contract Sign-off' },
    { id: 'bug-triage', label: '🐛 Memory Leak Hotfix', sub: 'Critical WebKit Bug' },
    { id: 'interview-loop', label: '💼 Candidate Interview', sub: 'Lead AI Engineer' },
  ];

  return (
    <div className="space-y-6 text-white">
      
      {/* 1-Click Simulation Tray */}
      <div className="glass-panel rounded-2xl p-5 border border-neutral-800 bg-[#0a0a0c] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
            <Zap className="w-4 h-4 text-white" />
            1-Click Scenario Injector & Test Lab
          </span>
          <span className="text-[11px] text-neutral-400">Click to inject test emergency or client email & trigger automated LangGraph agent</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {presets.map((item) => (
            <button
              key={item.id}
              onClick={() => onQuickSimulate(item.id)}
              disabled={simulatingPreset === item.id}
              className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-white text-left transition-all text-xs group disabled:opacity-50"
            >
              <div className="font-extrabold text-xs text-white group-hover:scale-105 transition-transform duration-200">
                {simulatingPreset === item.id ? 'Orchestrating...' : item.label}
              </div>
              <div className="text-[10px] text-neutral-400 mt-1 line-clamp-1">{item.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 6 Sub-Pages Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subPages.map((page, idx) => {
          const Icon = page.icon;
          return (
            <div
              key={idx}
              onClick={() => navigate(page.path)}
              className="glass-panel rounded-2xl p-5 border border-neutral-800 bg-[#0a0a0c] hover:border-white/50 cursor-pointer transition-all duration-200 group flex flex-col justify-between shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-white text-black group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5 text-black" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-neutral-900 text-neutral-300 border border-neutral-800">
                    {page.badge}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-neutral-200 transition-colors">
                  {page.title}
                </h4>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  {page.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400 group-hover:text-white transition-colors">
                <span className="font-semibold text-[11px]">Open Workspace</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
