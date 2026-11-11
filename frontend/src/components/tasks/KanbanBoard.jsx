import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Layers,
  Sparkles,
  RefreshCw,
  ListTodo,
  Timer
} from 'lucide-react';
import clsx from 'clsx';
import { TaskCard } from './TaskCard';
import { createTask } from '../../services/api';

export const KanbanBoard = ({ 
  tasks = [], 
  onMoveStatus, 
  onDeleteTask, 
  onSelectEmail,
  onRefresh
}) => {
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  const [newAssignee, setNewAssignee] = useState('AI Agent');
  const [newEffort, setNewEffort] = useState('2h');
  const [newSubtasks, setNewSubtasks] = useState('');

  const columns = [
    { id: 'TODO', title: 'To Do', color: 'border-slate-800 bg-slate-900/30 text-slate-300' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: 'border-indigo-500/30 bg-indigo-950/15 text-indigo-300' },
    { id: 'UNDER_REVIEW', title: 'Under Review', color: 'border-amber-500/30 bg-amber-950/15 text-amber-300' },
    { id: 'COMPLETED', title: 'Completed', color: 'border-emerald-500/30 bg-emerald-950/15 text-emerald-300' },
  ];

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = 
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase())) ||
      (t.assignee && t.assignee.toLowerCase().includes(search.toLowerCase()));

    const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;

    return matchesSearch && matchesPriority;
  });

  const handleCreateTaskSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const parsedSubtasks = newSubtasks
        ? newSubtasks.split('\n').map(s => s.trim()).filter(Boolean)
        : [];

      await createTask({
        title: newTitle,
        priority: newPriority,
        assignee: newAssignee,
        status: 'TODO',
        estimated_hours: newEffort,
        subtasks: parsedSubtasks,
        tags: ['Manual-Task']
      });
      setNewTitle('');
      setNewSubtasks('');
      setIsAddingTask(false);
      onRefresh();
    } catch (err) {
      alert(`Failed to create task: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Top Toolbar */}
      <div className="glass-panel rounded-2xl p-3 sm:p-4 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0c1222]">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks, assignees, subtasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent Only</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>

          <button
            onClick={() => setIsAddingTask(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-glow-primary transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>

          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            title="Refresh Kanban"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Inline Create Form */}
      {isAddingTask && (
        <form onSubmit={handleCreateTaskSubmit} className="glass-panel p-5 rounded-2xl border border-indigo-500/40 space-y-3 bg-[#0d1428] shadow-2xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Create Structured Task Item
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">LangGraph Task Schema</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              type="text"
              required
              placeholder="Task Title (e.g. Audit API Rate Limits)..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="sm:col-span-2 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
              autoFocus
            />
            
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-700 text-xs text-white focus:outline-none"
            >
              <option value="URGENT">URGENT</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Assignee"
                value={newAssignee}
                onChange={(e) => setNewAssignee(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none"
              />
              <input
                type="text"
                placeholder="2h"
                value={newEffort}
                onChange={(e) => setNewEffort(e.target.value)}
                className="w-16 px-2 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none text-center font-mono"
                title="Estimated Effort (e.g. 2h, 4h)"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Subtasks (one per line):</label>
            <textarea
              rows={2}
              placeholder="Check database query logs&#10;Verify caching policies&#10;Send team summary"
              value={newSubtasks}
              onChange={(e) => setNewSubtasks(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-sans"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setIsAddingTask(false)}
              className="px-4 py-1.5 text-xs text-slate-400 hover:text-white rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-glow-primary transition-all active:scale-95"
            >
              Save Task
            </button>
          </div>
        </form>
      )}

      {/* 4 Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter(t => t.status === col.id);

          return (
            <div
              key={col.id}
              className={clsx(
                'glass-panel rounded-3xl p-4 border flex flex-col justify-between min-h-[550px] shadow-lg',
                col.color
              )}
            >
              <div>
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-200">
                    {col.title}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-slate-950/80 text-slate-300 border border-slate-700/80">
                    {colTasks.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1">
                  {colTasks.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-slate-800/80 rounded-2xl text-slate-500 text-xs">
                      No tasks in this column
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onMoveStatus={onMoveStatus}
                        onDelete={onDeleteTask}
                        onSelectEmail={onSelectEmail}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Bottom Quick Add */}
              <button
                onClick={() => setIsAddingTask(true)}
                className="mt-3 w-full py-2.5 rounded-2xl border border-dashed border-slate-700/70 hover:border-indigo-500/60 hover:bg-slate-900/60 text-slate-400 hover:text-indigo-300 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            </div>
          );
        })}
      </div>

    </div>
  );
};

