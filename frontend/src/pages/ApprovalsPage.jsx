import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCw, 
  AlertTriangle, 
  Check, 
  Sparkles, 
  Inbox, 
  UserCheck 
} from 'lucide-react';
import clsx from 'clsx';
import { HITLApprovalCard } from '../components/approvals/HITLApprovalCard';
import { PriorityBadge, StatusBadge } from '../components/common/Badge';
import { getWorkflows, approveWorkflow, rejectWorkflow } from '../services/api';

export const ApprovalsPage = () => {
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [historyWorkflows, setHistoryWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchApprovalsData = async () => {
    try {
      setLoading(true);
      const [pendingData, allData] = await Promise.all([
        getWorkflows({ state: 'PENDING_APPROVAL' }).catch(() => []),
        getWorkflows({ limit: 20 }).catch(() => [])
      ]);
      setWorkflows(pendingData || []);
      if (pendingData && pendingData.length > 0) {
        if (!selectedWorkflow || !pendingData.find(w => w.id === selectedWorkflow.id)) {
          setSelectedWorkflow(pendingData[0]);
        }
      } else {
        setSelectedWorkflow(null);
      }
      setHistoryWorkflows((allData || []).filter(w => w.state === 'COMPLETED' || w.state === 'REJECTED'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovalsData();
    const interval = setInterval(fetchApprovalsData, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (workflowId, payload) => {
    setIsSubmitting(true);
    try {
      await approveWorkflow(workflowId, payload);
      await fetchApprovalsData();
    } catch (e) {
      alert(`Approval failed: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (workflowId, payload) => {
    setIsSubmitting(true);
    try {
      await rejectWorkflow(workflowId, payload);
      await fetchApprovalsData();
    } catch (e) {
      alert(`Rejection failed: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-white">
      
      {/* Header Card - Black & White Theme */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-neutral-800 bg-[#0a0a0c] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white text-black p-0.5 shadow-glow-primary flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Human-In-The-Loop (HITL) Safety Gate
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-white text-black">
                {workflows.length} ACTION REQUIRED
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Deterministic verification checkpoint for outbound emails, calendar commitments, and high-impact operations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 flex items-center gap-2 font-bold">
            <Clock className="w-4 h-4 text-white" />
            <span>Pending Sign-Off: <strong className="text-white font-mono">{workflows.length}</strong></span>
          </div>

          <button
            onClick={fetchApprovalsData}
            className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Review Section */}
      {workflows.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Pending Approval Items List */}
          <div className="lg:col-span-4 space-y-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 block px-1">
              Pending Queue ({workflows.length})
            </span>

            <div className="space-y-2.5 max-h-[650px] overflow-y-auto pr-1">
              {workflows.map((wf) => {
                const isSelected = selectedWorkflow?.id === wf.id;
                return (
                  <div
                    key={wf.id}
                    onClick={() => setSelectedWorkflow(wf)}
                    className={clsx(
                      'p-4 rounded-2xl border cursor-pointer transition-all duration-200 text-left relative',
                      isSelected
                        ? 'border-white bg-white text-black shadow-glow-primary'
                        : 'border-neutral-800 bg-[#0c0c0e] hover:border-neutral-600 text-white'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={clsx("text-xs font-bold truncate max-w-[180px]", isSelected ? "text-black" : "text-white")}>
                        {wf.email_subject || 'Email Workflow'}
                      </span>
                      <PriorityBadge priority={wf.priority} />
                    </div>

                    <p className={clsx("text-[11px] line-clamp-2 leading-relaxed mb-2", isSelected ? "text-neutral-700" : "text-neutral-400")}>
                      {wf.email_sender}
                    </p>

                    <div className={clsx("pt-2 border-t flex items-center justify-between text-[10px]", isSelected ? "border-neutral-300 text-black" : "border-neutral-800 text-neutral-400")}>
                      <span className="font-mono font-bold">
                        {Math.round((wf.confidence_score || 0.9) * 100)}% Confidence
                      </span>
                      <span className="font-mono">
                        {new Date(wf.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Selected Workflow HITL Studio */}
          <div className="lg:col-span-8">
            {selectedWorkflow && (
              <HITLApprovalCard
                workflow={selectedWorkflow}
                onApprove={handleApprove}
                onReject={handleReject}
                isSubmitting={isSubmitting}
              />
            )}
          </div>

        </div>
      ) : (
        /* Empty State */
        <div className="glass-panel rounded-3xl p-16 text-center border border-neutral-800 bg-[#0a0a0c] space-y-4">
          <div className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center mx-auto shadow-glow-primary">
            <ShieldCheck className="w-8 h-8 text-black" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-extrabold text-white">All Safety Gates Clear</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              There are no pending workflows awaiting human review. Incoming emails with high confidence are processed autonomously according to your permission policies.
            </p>
          </div>
        </div>
      )}

      {/* Recent Approvals & Audit History */}
      <div className="glass-panel rounded-2xl p-6 border border-neutral-800 bg-[#0a0a0c] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-white" />
            Recent Human Decision Log
          </h3>
          <span className="text-[11px] text-neutral-500 font-mono">{historyWorkflows.length} Records</span>
        </div>

        <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
          {historyWorkflows.length === 0 ? (
            <p className="text-xs text-neutral-500 py-6 text-center">No decisions recorded yet.</p>
          ) : (
            historyWorkflows.slice(0, 8).map((wf) => (
              <div
                key={wf.id}
                className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-neutral-700 bg-neutral-900 text-white shrink-0">
                    {wf.state}
                  </span>
                  <span className="text-white font-medium truncate">
                    {wf.email_subject || 'Email Workflow'}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-[10px] text-neutral-400 font-mono">
                  <span>{wf.email_sender}</span>
                  <span>•</span>
                  <span>{new Date(wf.updated_at || wf.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
