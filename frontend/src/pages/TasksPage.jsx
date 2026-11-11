import React, { useState, useEffect } from 'react';
import { 
  Kanban as KanbanIcon, 
  RefreshCw, 
  CheckCircle2, 
  Layers,
  Sparkles,
  CheckSquare,
  Clock,
  AlertCircle,
  PlusCircle,
  Mail
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { KanbanBoard } from '../components/tasks/KanbanBoard';
import { getTasks, updateTask, deleteTask } from '../services/api';

export const TasksPage = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await getTasks();
      setTasks(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleMoveStatus = async (taskId, newStatus) => {
    try {
      await updateTask(taskId, { status: newStatus });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (e) {
      alert(`Status update failed: ${e.message}`);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (e) {
      alert(`Delete failed: ${e.message}`);
    }
  };

  const handleSelectEmail = (emailId) => {
    navigate('/inbox');
  };

  const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;
  const todoCount = tasks.filter(t => t.status === 'TODO').length;
  const inProgressCount = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const urgentCount = tasks.filter(t => t.priority === 'URGENT').length;

  return (
    <div className="space-y-6 text-slate-100">
      
      {/* Header Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-slate-700/80 bg-[#0c1222] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 p-0.5 shadow-glow-primary flex items-center justify-center">
            <KanbanIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                AI Task Manager & Kanban Board
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                4 STAGES
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Exact actionable tasks with subtasks and effort decomposed from real email threads.
            </p>
          </div>
        </div>

        {/* Mini KPI Chips */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
            <span className="text-slate-400">To Do:</span> <strong className="text-slate-200 font-mono">{todoCount}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
            <span className="text-slate-400">In Progress:</span> <strong className="text-indigo-400 font-mono">{inProgressCount}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
            <span className="text-slate-400">Completed:</span> <strong className="text-emerald-400 font-mono">{completedCount}</strong>
          </div>
          {urgentCount > 0 && (
            <div className="px-3 py-1.5 rounded-xl badge-urgent text-xs font-bold animate-pulse">
              🚨 {urgentCount} Urgent
            </div>
          )}
        </div>
      </div>

      {/* Empty State when zero tasks */}
      {tasks.length === 0 && !loading && (
        <div className="glass-panel rounded-3xl p-10 text-center border border-slate-800 space-y-4 bg-[#0c1222]">
          <div className="w-16 h-16 rounded-3xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto shadow-glow-primary">
            <CheckSquare className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-white">No Tasks Extracted Yet</h3>
            <p className="text-xs text-slate-400">
              Your task board is clear. Ingest incoming emails or compose a message to have LangGraph decompose bulleted action items into tasks.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/inbox')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-glow-primary transition-all"
            >
              <Mail className="w-4 h-4" />
              <span>Go to Mailbox</span>
            </button>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <KanbanBoard
        tasks={tasks}
        onMoveStatus={handleMoveStatus}
        onDeleteTask={handleDeleteTask}
        onSelectEmail={handleSelectEmail}
        onRefresh={fetchTasks}
      />

    </div>
  );
};

