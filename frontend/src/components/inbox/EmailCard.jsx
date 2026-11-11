import React from 'react';
import { Mail, Star, Trash2, ArrowRight, Clock, Zap } from 'lucide-react';
import clsx from 'clsx';
import { PriorityBadge, CategoryBadge, StatusBadge } from '../common/Badge';

export const EmailCard = ({ 
  email, 
  isSelected, 
  onSelect, 
  onProcess, 
  onToggleStar, 
  onDelete, 
  isProcessing 
}) => {
  const formatReceivedDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
  };

  return (
    <div
      onClick={() => onSelect(email)}
      className={clsx(
        'glass-card rounded-2xl p-4 border transition-all duration-200 cursor-pointer text-left relative overflow-hidden',
        isSelected
          ? 'border-primary-500 bg-primary-950/30 shadow-glow-primary'
          : email.status === 'UNPROCESSED'
          ? 'border-cyan-500/40 bg-cyan-950/10 hover:border-cyan-500/70 hover:bg-slate-900/90'
          : 'border-surface-border bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={clsx(
            'w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0',
            email.status === 'UNPROCESSED' 
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
              : 'bg-slate-800 text-slate-300 border border-slate-700'
          )}>
            {email.sender ? email.sender.charAt(0).toUpperCase() : 'M'}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white truncate">{email.sender}</h4>
            <p className="text-[10px] text-slate-400 font-mono">{formatReceivedDate(email.received_at)}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleStar(email.id, !email.is_starred);
            }}
            className={clsx(
              'p-1.5 rounded-lg transition-colors',
              email.is_starred ? 'text-amber-400 bg-amber-400/10' : 'text-slate-500 hover:text-slate-300'
            )}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(email.id);
            }}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Subject & Preview */}
      <div className="mt-2.5 space-y-1">
        <div className="text-xs font-bold text-white line-clamp-1 flex items-center gap-2">
          {email.status === 'UNPROCESSED' && (
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-ping" />
          )}
          <span>{email.subject}</span>
        </div>
        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
          {email.body}
        </p>
      </div>

      {/* Badges and Actions */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <PriorityBadge priority={email.priority} />
          {email.category && <CategoryBadge category={email.category} />}
          <StatusBadge status={email.status} />
        </div>

        {email.status === 'UNPROCESSED' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onProcess(email.id);
            }}
            disabled={isProcessing}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold shadow-glow-cyan transition-all active:scale-95 disabled:opacity-50"
          >
            <Zap className="w-3 h-3" />
            <span>{isProcessing ? 'Triaging...' : 'Triage Now'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
