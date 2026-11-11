import React from 'react';
import { 
  X, 
  Sparkles, 
  Clock, 
  User, 
  Send, 
  CheckSquare, 
  Calendar as CalendarIcon, 
  ArrowRight,
  ShieldAlert,
  GitBranch
} from 'lucide-react';
import clsx from 'clsx';
import { PriorityBadge, StatusBadge, CategoryBadge } from '../common/Badge';

export const EmailDetail = ({ email, onClose, onProcess, onNavigateWorkflow, isProcessing }) => {
  if (!email) return null;

  return (
    <div className="glass-panel rounded-xl p-5 border border-surface-border space-y-5 h-full flex flex-col justify-between">
      
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-surface-border">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <PriorityBadge priority={email.priority} />
              <CategoryBadge category={email.category} />
              <StatusBadge status={email.status} />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white leading-snug">{email.subject}</h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sender / Meta info */}
        <div className="py-3 text-xs space-y-1.5 text-slate-400 border-b border-surface-border">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-300 font-medium">
              <User className="w-3.5 h-3.5 text-primary-400" />
              From: <span className="text-white">{email.sender}</span>
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-500">
              <Clock className="w-3 h-3" />
              {new Date(email.received_at).toLocaleString()}
            </span>
          </div>
          <p>To: <span className="text-slate-300">{email.recipient}</span></p>
          {email.thread_id && <p className="font-mono text-[10px] text-slate-500">Thread ID: {email.thread_id}</p>}
        </div>

        {/* Body Content */}
        <div className="mt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Raw Email Body</h4>
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs sm:text-sm text-slate-200 whitespace-pre-wrap font-sans leading-relaxed max-h-72 overflow-y-auto">
            {email.body}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-4 border-t border-surface-border flex items-center justify-between gap-3">
        {email.workflows_count > 0 ? (
          <button
            onClick={() => onNavigateWorkflow(email.id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors"
          >
            <GitBranch className="w-4 h-4 text-primary-400" />
            <span>View LangGraph Workflow Runs ({email.workflows_count})</span>
          </button>
        ) : (
          <span className="text-xs text-slate-500">No workflow runs yet.</span>
        )}

        <button
          onClick={() => onProcess(email.id)}
          disabled={isProcessing}
          className={clsx(
            'flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-xs shadow-glow-primary transition-all active:scale-95',
            isProcessing ? 'bg-primary-900 cursor-not-allowed animate-pulse' : 'bg-primary-600 hover:bg-primary-500'
          )}
        >
          <Sparkles className="w-4 h-4" />
          <span>{isProcessing ? 'Agent Running...' : 'Trigger LangGraph'}</span>
        </button>
      </div>

    </div>
  );
};
