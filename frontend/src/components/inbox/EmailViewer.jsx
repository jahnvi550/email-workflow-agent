import React from 'react';
import { 
  X, 
  Mail, 
  User, 
  Calendar, 
  Zap, 
  Sparkles, 
  CheckSquare, 
  Send, 
  Clock, 
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Tag,
  RefreshCw,
  GitBranch,
  CheckCircle2,
  Lock
} from 'lucide-react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { PriorityBadge, CategoryBadge, StatusBadge } from '../common/Badge';

export const EmailViewer = ({ 
  email, 
  onClose, 
  onProcess, 
  isProcessing 
}) => {
  const navigate = useNavigate();
  if (!email) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  };

  const isProcessed = email.status === 'PROCESSED' || (email.workflows_count && email.workflows_count > 0);

  return (
    <div className="glass-panel rounded-3xl p-6 border border-slate-700/80 bg-[#0c1222] space-y-6 shadow-2xl text-slate-100 animate-in fade-in slide-in-from-right-4 duration-200">
      
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <PriorityBadge priority={email.priority} />
            {email.category && <CategoryBadge category={email.category} />}
            <StatusBadge status={email.status} />
          </div>
          <h3 className="text-base font-extrabold text-white leading-snug">
            {email.subject}
          </h3>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Metadata Bar */}
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">From:</span>
          <span className="font-semibold text-white font-mono truncate max-w-[240px]">{email.sender}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">To:</span>
          <span className="text-slate-300 font-mono truncate max-w-[240px]">{email.recipient}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Received:</span>
          <span className="text-slate-400 font-mono">{formatDate(email.received_at)}</span>
        </div>
      </div>

      {/* Raw Email Body */}
      <div className="space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-indigo-400" />
            <span>Message Content</span>
          </div>
          {isProcessed && (
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> LangGraph Orchestrated
            </span>
          )}
        </div>
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans max-h-56 overflow-y-auto">
          {email.body}
        </div>
      </div>

      {/* Workflow Stats Badge Bar */}
      {isProcessed && (
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-around text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <CheckSquare className="w-4 h-4 text-indigo-400" />
            <span><strong>{email.tasks_count || 1}</strong> Tasks Extracted</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span><strong>{email.calendar_events_count || 0}</strong> Calendar</span>
          </div>
        </div>
      )}

      {/* Actions & Workflows Controls */}
      <div className="pt-2 border-t border-slate-800 space-y-2.5">
        {!isProcessed ? (
          <button
            onClick={() => onProcess(email.id, false)}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-glow-primary transition-all active:scale-95 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Auto-Generating LangGraph Workflow...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-white" />
                <span>⚡ Auto-Generate Workflow for Email</span>
              </>
            )}
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => navigate('/workflows')}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-glow-primary transition-all active:scale-95"
              >
                <GitBranch className="w-4 h-4 text-white" />
                <span>Inspect in StateGraph</span>
              </button>
              <button
                onClick={() => navigate('/tasks')}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 text-xs font-bold transition-colors"
              >
                <CheckSquare className="w-4 h-4 text-indigo-400" />
                <span>View Tasks</span>
              </button>
            </div>

            <button
              onClick={() => onProcess(email.id, true)}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white text-[11px] font-semibold transition-colors disabled:opacity-50"
            >
              <RefreshCw className={clsx('w-3 h-3', isProcessing && 'animate-spin')} />
              <span>{isProcessing ? 'Re-Generating Workflow...' : '🔄 Re-Generate Workflow (Fresh LangGraph Run)'}</span>
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

