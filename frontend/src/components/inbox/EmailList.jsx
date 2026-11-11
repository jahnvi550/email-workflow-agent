import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Sparkles, 
  Star, 
  Trash2, 
  Calendar, 
  CheckSquare, 
  GitBranch, 
  ArrowRight,
  RefreshCw,
  Mail
} from 'lucide-react';
import clsx from 'clsx';
import { PriorityBadge, StatusBadge, CategoryBadge } from '../common/Badge';

export const EmailList = ({ 
  emails = [], 
  selectedEmail, 
  onSelectEmail, 
  onProcessEmail, 
  onToggleStar, 
  onDeleteEmail,
  onRefresh,
  processingEmailId 
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  const filteredEmails = emails.filter((e) => {
    const matchesSearch = 
      e.subject.toLowerCase().includes(search.toLowerCase()) ||
      e.sender.toLowerCase().includes(search.toLowerCase()) ||
      e.body.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || e.category === categoryFilter;
    const matchesPriority = priorityFilter === 'ALL' || e.priority === priorityFilter;

    return matchesSearch && matchesCategory && matchesPriority;
  });

  const categories = ['ALL', 'Urgent Escalation', 'Meeting Request', 'Contract Review', 'Academic Request', 'Bug Report', 'Task Assignment'];

  return (
    <div className="space-y-4">
      
      {/* Search & Filter Header */}
      <div className="glass-panel rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        
        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search emails, senders, content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
            {categories.slice(0, 4).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={clsx(
                  'px-2.5 py-1 rounded-md transition-all font-medium whitespace-nowrap',
                  categoryFilter === cat
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                {cat === 'ALL' ? 'All Categories' : cat}
              </button>
            ))}
          </div>

          <button
            onClick={onRefresh}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Email Item Rows */}
      <div className="space-y-2">
        {filteredEmails.length === 0 ? (
          <div className="glass-panel rounded-xl p-12 text-center">
            <Mail className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-slate-300">No emails found</h4>
            <p className="text-xs text-slate-500 mt-1">Try changing search keywords or simulate new incoming emails.</p>
          </div>
        ) : (
          filteredEmails.map((email) => {
            const isSelected = selectedEmail?.id === email.id;
            const isProcessing = processingEmailId === email.id;

            return (
              <div
                key={email.id}
                onClick={() => onSelectEmail(email)}
                className={clsx(
                  'glass-card rounded-xl p-4 cursor-pointer transition-all duration-200 border',
                  isSelected 
                    ? 'border-primary-500/80 bg-primary-950/20 shadow-glow-primary' 
                    : 'border-surface-border hover:border-slate-600 bg-surface/60'
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  
                  {/* Left: Star, Sender, Subject & Snippet */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStar(email.id, !email.is_starred);
                      }}
                      className="mt-0.5 text-slate-500 hover:text-amber-400 transition-colors"
                    >
                      <Star className={clsx('w-4 h-4', email.is_starred && 'text-amber-400 fill-amber-400')} />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-sm text-white truncate max-w-xs">{email.sender}</span>
                        <PriorityBadge priority={email.priority} />
                        <CategoryBadge category={email.category} />
                        <StatusBadge status={email.status} />
                      </div>

                      <h4 className="text-xs font-semibold text-slate-200 truncate">{email.subject}</h4>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{email.body}</p>
                    </div>
                  </div>

                  {/* Right: Metrics Badges & Action Trigger */}
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    
                    {/* Tasks & Meetings count chips */}
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      {email.tasks_count > 0 && (
                        <span className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          <CheckSquare className="w-3 h-3 text-indigo-400" />
                          {email.tasks_count}
                        </span>
                      )}
                      {email.calendar_events_count > 0 && (
                        <span className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          <Calendar className="w-3 h-3 text-emerald-400" />
                          {email.calendar_events_count}
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] text-slate-500">
                      {new Date(email.received_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>

                    {/* Process Action */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onProcessEmail(email.id);
                      }}
                      disabled={isProcessing}
                      className={clsx(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm',
                        isProcessing
                          ? 'bg-primary-900/50 text-primary-300 cursor-not-allowed animate-pulse'
                          : email.status === 'PROCESSED'
                          ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                          : 'bg-primary-600 hover:bg-primary-500 text-white shadow-glow-primary'
                      )}
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Orchestrating...</span>
                        </>
                      ) : email.status === 'PROCESSED' ? (
                        <>
                          <GitBranch className="w-3 h-3 text-emerald-400" />
                          <span>Re-Run Agent</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" />
                          <span>Run Agent</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteEmail(email.id);
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-md hover:bg-slate-800 transition-colors"
                      title="Delete Email"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
