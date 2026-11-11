import React, { useState, useEffect } from 'react';
import { 
  GitBranch, 
  RefreshCw, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  ChevronRight, 
  Filter, 
  User, 
  Zap, 
  Flame, 
  Check,
  Mail,
  Sparkles,
  Play
} from 'lucide-react';
import clsx from 'clsx';
import { VisualPipeline } from '../components/workflow/VisualPipeline';
import { HITLApprovalCard } from '../components/approvals/HITLApprovalCard';
import { AgentReasoning } from '../components/workflow/AgentReasoning';
import { PriorityBadge, StatusBadge } from '../components/common/Badge';
import { 
  getWorkflows, 
  getWorkflowById, 
  approveWorkflow, 
  rejectWorkflow,
  getEmails,
  processEmailWorkflow
} from '../services/api';

export const WorkflowsPage = () => {
  const [workflows, setWorkflows] = useState([]);
  const [emails, setEmails] = useState([]);
  const [selectedEmailForGen, setSelectedEmailForGen] = useState('');
  const [activeWorkflow, setActiveWorkflow] = useState(null);
  const [stateFilter, setStateFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genSuccessMsg, setGenSuccessMsg] = useState('');

  const fetchWorkflowsAndEmails = async () => {
    try {
      setLoading(true);
      const [wfData, emailData] = await Promise.all([
        getWorkflows().catch(() => []),
        getEmails().catch(() => [])
      ]);
      
      setWorkflows(wfData || []);
      setEmails(emailData || []);

      if (emailData && emailData.length > 0 && !selectedEmailForGen) {
        setSelectedEmailForGen(emailData[0].id);
      }

      if (wfData && wfData.length > 0) {
        if (!activeWorkflow) {
          const pending = wfData.find(w => w.is_hitl_pending);
          setActiveWorkflow(pending || wfData[0]);
        } else {
          const refreshed = wfData.find(w => w.id === activeWorkflow.id);
          if (refreshed) setActiveWorkflow(refreshed);
        }
      } else {
        setActiveWorkflow(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflowsAndEmails();
    const interval = setInterval(fetchWorkflowsAndEmails, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectWorkflow = async (workflow) => {
    try {
      const full = await getWorkflowById(workflow.id);
      setActiveWorkflow(full);
    } catch {
      setActiveWorkflow(workflow);
    }
  };

  const handleAutoGenerateForEmail = async (emailIdToProcess) => {
    const targetId = emailIdToProcess || selectedEmailForGen;
    if (!targetId) return;

    setIsGenerating(true);
    setGenSuccessMsg('');
    try {
      const res = await processEmailWorkflow(targetId, true);
      const updatedWorkflows = await getWorkflows();
      setWorkflows(updatedWorkflows || []);

      if (res.workflow_id) {
        const newWf = await getWorkflowById(res.workflow_id);
        setActiveWorkflow(newWf);
      } else if (updatedWorkflows.length > 0) {
        setActiveWorkflow(updatedWorkflows[0]);
      }

      const emailObj = emails.find(e => e.id === targetId);
      setGenSuccessMsg(`Workflow auto-generated for "${emailObj?.subject || 'Selected Email'}"!`);
      setTimeout(() => setGenSuccessMsg(''), 4500);
    } catch (e) {
      alert(`Workflow generation failed: ${e.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = async (workflowId, payload) => {
    setIsSubmitting(true);
    try {
      const updated = await approveWorkflow(workflowId, payload);
      setActiveWorkflow(updated);
      await fetchWorkflowsAndEmails();
    } catch (e) {
      alert(`Approval failed: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (workflowId, payload) => {
    setIsSubmitting(true);
    try {
      const updated = await rejectWorkflow(workflowId, payload);
      setActiveWorkflow(updated);
      await fetchWorkflowsAndEmails();
    } catch (e) {
      alert(`Rejection failed: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredWorkflows = workflows.filter(w => {
    if (stateFilter === 'ALL') return true;
    return w.state === stateFilter;
  });

  return (
    <div className="space-y-6 text-slate-100">
      
      {/* Top Header Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-slate-700/80 bg-[#0c1222] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 p-0.5 shadow-glow-primary flex items-center justify-center shrink-0">
            <GitBranch className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                LangGraph StateGraph & Workflow Canvas
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                STATEGRAPH STUDIO
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Real-time multi-agent execution pipeline displaying discrete state mutations and tool telemetry.
            </p>
          </div>
        </div>

        {/* Action Controls & Filter Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All States ({workflows.length})</option>
            <option value="PENDING_APPROVAL">Pending HITL Approval</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
            <option value="RUNNING">Running</option>
          </select>

          <button
            onClick={fetchWorkflowsAndEmails}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            title="Refresh Workflows"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Auto-Generate Workflow Toolbar for Selected Email */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800 bg-[#0d1428] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div className="w-full md:w-auto">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">
              Run Workflow for Email:
            </h4>
            <p className="text-[11px] text-slate-400">Select any incoming email to execute a fresh LangGraph orchestration run</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select
            value={selectedEmailForGen}
            onChange={(e) => setSelectedEmailForGen(e.target.value)}
            className="flex-1 md:w-80 bg-slate-950 px-3 py-2 rounded-xl border border-slate-700 text-xs font-semibold text-white truncate focus:outline-none focus:border-indigo-500 font-sans"
          >
            {emails.length === 0 ? (
              <option value="">No emails available in inbox</option>
            ) : (
              emails.map((e) => (
                <option key={e.id} value={e.id}>
                  [{e.priority}] {e.subject.slice(0, 45)}... ({e.sender.split('@')[0]})
                </option>
              ))
            )}
          </select>

          <button
            onClick={() => handleAutoGenerateForEmail()}
            disabled={isGenerating || !selectedEmailForGen}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-glow-primary transition-all active:scale-95 disabled:opacity-50 shrink-0"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white text-white" />
                <span>Auto-Generate Workflow</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generation Toast Alert */}
      {genSuccessMsg && (
        <div className="p-4 rounded-2xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-200 text-xs flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="font-bold">{genSuccessMsg}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">100% Automated</span>
        </div>
      )}

      {/* Main Grid: Workflows List (Left) + Pipeline Visualizer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Workflow Runs Selector */}
        <div className="lg:col-span-4 space-y-2.5 max-h-[850px] overflow-y-auto pr-1">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block px-1 mb-1">
            Orchestration Runs ({filteredWorkflows.length})
          </span>

          {filteredWorkflows.length === 0 ? (
            <div className="glass-panel p-8 text-center text-xs text-slate-500 rounded-3xl bg-[#0c1222] border border-slate-800">
              No workflow runs stored yet. Ingest an email or compose a message to trigger autonomous pipelines.
            </div>
          ) : (
            filteredWorkflows.map((wf) => {
              const isSelected = activeWorkflow?.id === wf.id;
              return (
                <div
                  key={wf.id}
                  onClick={() => handleSelectWorkflow(wf)}
                  className={clsx(
                    'p-4 rounded-2xl border cursor-pointer transition-all duration-200 text-left',
                    isSelected
                      ? 'border-indigo-500/80 bg-indigo-950/40 text-white shadow-glow-primary'
                      : 'border-slate-800 bg-[#0d1324]/80 hover:border-slate-700'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold truncate max-w-[180px] text-white">
                      {wf.email_subject || 'Email Workflow'}
                    </span>
                    <PriorityBadge priority={wf.priority} />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="truncate max-w-[140px]">
                      {wf.email_sender || 'sender@example.com'}
                    </span>
                    <span className="font-mono text-[10px]">
                      {new Date(wf.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                    <StatusBadge status={wf.state} />
                    <span className="text-[10px] font-mono font-bold text-slate-300">
                      {Math.round((wf.confidence_score || 0.9) * 100)}% conf
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Visual Pipeline & Detailed Inspectors */}
        <div className="lg:col-span-8 space-y-6">
          {activeWorkflow ? (
            <>
              {/* Interactive Pipeline Nodes */}
              <VisualPipeline workflow={activeWorkflow} />

              {/* Pending Approval Banner / Action Card */}
              {activeWorkflow.is_hitl_pending && (
                <HITLApprovalCard
                  workflow={activeWorkflow}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  isSubmitting={isSubmitting}
                />
              )}

              {/* Reasoning, JSON State & Audit Logs */}
              <AgentReasoning workflow={activeWorkflow} />
            </>
          ) : (
            <div className="glass-panel p-12 text-center text-slate-500 text-xs rounded-3xl bg-[#0c1222] border border-slate-800">
              Select an orchestration run from the left panel to inspect the LangGraph execution pipeline.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

