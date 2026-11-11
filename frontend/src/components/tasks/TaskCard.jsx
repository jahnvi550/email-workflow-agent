import React, { useState } from 'react';
import { 
  Calendar, 
  User, 
  Tag, 
  Trash2, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  ListTodo,
  CheckSquare2,
  Square,
  Sparkles,
  Zap,
  Timer
} from 'lucide-react';
import clsx from 'clsx';
import { PriorityBadge } from '../common/Badge';

export const TaskCard = ({ task, onMoveStatus, onDelete, onSelectEmail, onToggleSubtask }) => {
  const [completedSubtasks, setCompletedSubtasks] = useState({});

  const statusTransitions = {
    TODO: { prev: null, next: 'IN_PROGRESS' },
    IN_PROGRESS: { prev: 'TODO', next: 'UNDER_REVIEW' },
    UNDER_REVIEW: { prev: 'IN_PROGRESS', next: 'COMPLETED' },
    COMPLETED: { prev: 'UNDER_REVIEW', next: null },
  };

  const currentTransition = statusTransitions[task.status] || { prev: null, next: null };

  const formatDeadline = (deadlineStr) => {
    if (!deadlineStr) return null;
    try {
      const d = new Date(deadlineStr);
      const now = new Date();
      const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
      let label = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      let isUrgent = diffDays <= 1;
      return { label, diffDays, isUrgent };
    } catch {
      return null;
    }
  };

  const deadlineInfo = formatDeadline(task.deadline);
  const subtasks = task.subtasks || [];

  const handleSubtaskClick = (subtask, idx) => {
    setCompletedSubtasks(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  return (
    <div className="glass-card rounded-2xl p-4 border border-slate-800/90 bg-[#0d1324]/85 hover:border-indigo-500/40 transition-all space-y-3 shadow-lg">
      
      {/* Top row: Priority & Estimated Hours & Delete */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <PriorityBadge priority={task.priority} />
          {task.estimated_hours && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              <Timer className="w-3 h-3" />
              {task.estimated_hours}
            </span>
          )}
        </div>
        
        <button
          onClick={() => onDelete(task.id)}
          className="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-slate-800 transition-colors"
          title="Delete task"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Title & Priority Reasoning */}
      <div>
        <h4 className="text-xs font-bold text-white leading-snug">{task.title}</h4>
        
        {task.priority_reason && (
          <div className="mt-1 flex items-start gap-1 text-[10px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg leading-tight">
            <Sparkles className="w-3 h-3 shrink-0 mt-0.5 text-amber-400" />
            <span className="line-clamp-2">{task.priority_reason}</span>
          </div>
        )}

        {task.description && !task.priority_reason && (
          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      {/* Subtasks Checklist */}
      {subtasks.length > 0 && (
        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span className="flex items-center gap-1 font-bold text-slate-300">
              <ListTodo className="w-3 h-3 text-indigo-400" /> Subtasks
            </span>
            <span>
              {Object.values(completedSubtasks).filter(Boolean).length}/{subtasks.length}
            </span>
          </div>

          <div className="space-y-1 pt-0.5">
            {subtasks.map((st, idx) => {
              const isChecked = !!completedSubtasks[idx];
              return (
                <div
                  key={idx}
                  onClick={() => handleSubtaskClick(st, idx)}
                  className="flex items-center gap-1.5 text-[11px] text-slate-300 hover:text-white cursor-pointer group select-none"
                >
                  {isChecked ? (
                    <CheckSquare2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 shrink-0" />
                  )}
                  <span className={clsx('truncate', isChecked && 'line-through text-slate-500')}>
                    {st}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {task.tags.map((tag, idx) => (
            <span key={idx} className="px-2 py-0.5 rounded text-[10px] bg-slate-800/80 text-slate-300 border border-slate-700/60 font-mono">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Meta: Assignee & Deadline */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <User className="w-3 h-3 text-indigo-400" />
          <span className="text-slate-300 font-medium truncate max-w-[100px]">{task.assignee}</span>
        </span>

        {deadlineInfo && (
          <span className={clsx(
            'flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded',
            deadlineInfo.isUrgent ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-slate-400'
          )}>
            <Clock className="w-3 h-3" />
            {deadlineInfo.label}
          </span>
        )}
      </div>

      {/* Source Email link & Status Transition Buttons */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1">
        {task.email_subject ? (
          <button
            onClick={() => onSelectEmail && onSelectEmail(task.email_id)}
            className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 truncate max-w-[120px]"
            title={`Source Email: ${task.email_subject}`}
          >
            <ExternalLink className="w-3 h-3 shrink-0" />
            <span className="truncate">{task.email_subject}</span>
          </button>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-1">
          {currentTransition.prev && (
            <button
              onClick={() => onMoveStatus(task.id, currentTransition.prev)}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-0.5"
              title={`Move back to ${currentTransition.prev}`}
            >
              <ArrowLeft className="w-3 h-3" />
            </button>
          )}

          {currentTransition.next && (
            <button
              onClick={() => onMoveStatus(task.id, currentTransition.next)}
              className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-glow-primary transition-all active:scale-95"
              title={`Move to ${currentTransition.next}`}
            >
              <span>Move</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

    </div>
  );
};

