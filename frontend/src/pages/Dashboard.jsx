import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  CheckSquare, 
  Clock, 
  ShieldAlert, 
  Sparkles, 
  ArrowRight, 
  Zap, 
  Activity,
  Layers,
  ChevronRight,
  TrendingUp,
  Cpu,
  Bot,
  Video,
  Send,
  Sliders,
  CheckCircle2,
  FileCode2,
  GitBranch,
  FileText,
  PlusCircle,
  Radio,
  ArrowUpRight
} from 'lucide-react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { MetricGrid } from '../components/dashboard/MetricGrid';
import { QuickNavCards } from '../components/dashboard/QuickNavCards';
import { LiveActivityFeed } from '../components/dashboard/LiveActivityFeed';
import { HITLApprovalCard } from '../components/approvals/HITLApprovalCard';
import { ReportDownloadModal } from '../components/common/ReportDownloadModal';
import { ImportEmailModal } from '../components/inbox/ImportEmailModal';
import { 
  getDashboardSummary, 
  getWorkflows, 
  approveWorkflow, 
  rejectWorkflow,
  simulateEmail
} from '../services/api';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [pendingWorkflows, setPendingWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [simulatingPreset, setSimulatingPreset] = useState(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [sumData, wfData] = await Promise.all([
        getDashboardSummary().catch(() => ({ metrics: {}, time_saved: {}, category_distribution: [], recent_activity_logs: [] })),
        getWorkflows({ state: 'PENDING_APPROVAL', limit: 5 }).catch(() => [])
      ]);
      setSummary(sumData);
      setPendingWorkflows(wfData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (workflowId, payload) => {
    setIsSubmitting(true);
    try {
      await approveWorkflow(workflowId, payload);
      await fetchDashboardData();
    } catch (e) {
      alert(`Approval error: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (workflowId, payload) => {
    setIsSubmitting(true);
    try {
      await rejectWorkflow(workflowId, payload);
      await fetchDashboardData();
    } catch (e) {
      alert(`Rejection error: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickPreset = async (presetId) => {
    setSimulatingPreset(presetId);
    try {
      const res = await simulateEmail({ preset_id: presetId, auto_process: true });
      await fetchDashboardData();
      if (res.workflow_id) {
        navigate('/workflows');
      }
    } catch (e) {
      alert(`Simulation error: ${e.message}`);
    } finally {
      setSimulatingPreset(null);
    }
  };

  const metrics = summary?.metrics || {};
  const timeSaved = summary?.time_saved || { total_hours_saved: 0.0, triage_time_reduction_percent: 92.5 };
  const totalEmails = metrics.emails_processed?.value || 0;

  return (
    <div className="space-y-8 text-slate-100">
      
      {/* Hero Welcome Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-700/80 bg-gradient-to-br from-[#0c1326] via-[#0d101f] to-[#080c16] relative overflow-hidden shadow-2xl">
        
        {/* Subtle Ambient Glow Effect */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                LangGraph StateGraph Engine Active
              </span>
              <span className="text-xs text-slate-400 font-mono">Live Multi-Agent Pipeline</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Intelligent Email-to-Workflow <br className="hidden sm:inline"/>
              <span className="gradient-text-indigo font-display">& Task Orchestration</span>
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-1">
              Autonomous multi-agent system transforming unstructured emails into structured intent, actionable Kanban tasks with subtasks, calendar bookings, and contextual replies with Human-in-the-Loop safety gates.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={() => setIsImportOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-glow-primary transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-white" />
              <span>Ingest Real Email</span>
            </button>

            <button
              onClick={() => setIsReportOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs transition-colors"
            >
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Executive Report</span>
            </button>
          </div>
        </div>

        {/* Live Architecture Topology Bar */}
        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            Live LangGraph Multi-Agent Orchestration Topology
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {[
              { step: '01', name: 'Email Ingestion', node: 'IMAP & Raw Normalizer', icon: Mail, color: 'text-indigo-400' },
              { step: '02', name: 'Classification', node: 'classify_and_extract', icon: Cpu, color: 'text-violet-400' },
              { step: '03', name: 'Action Planning', node: 'plan_orchestration', icon: Sliders, color: 'text-cyan-400' },
              { step: '04', name: 'Risk Safety Gate', node: 'evaluate_risk_and_hitl', icon: ShieldAlert, color: 'text-amber-400' },
              { step: '05', name: 'Human HITL Studio', node: 'human_approval_gate', icon: Bot, color: 'text-rose-400' },
              { step: '06', name: 'Tools Execution', node: 'execute_actions', icon: CheckCircle2, color: 'text-emerald-400' },
            ].map((node, i) => {
              const NodeIcon = node.icon;
              return (
                <div key={i} className="p-3 rounded-2xl border border-slate-800/90 bg-slate-950/70 text-left flex flex-col justify-between hover:border-indigo-500/40 transition-all">
                  <div className="flex items-center justify-between mb-1.5">
                    <NodeIcon className={clsx('w-4 h-4', node.color)} />
                    <span className="font-mono text-[10px] text-slate-500 font-bold">{node.step}</span>
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-200 block leading-tight">{node.name}</span>
                    <span className="font-mono text-[9px] text-slate-400 block truncate mt-0.5">{node.node}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 4 KPI Summary Cards */}
      <MetricGrid metrics={metrics} pendingCount={pendingWorkflows.length} />

      {/* Quick Scenario Preset Ingestion Tray + 6 Sub-Pages Cards */}
      <QuickNavCards 
        onQuickSimulate={handleQuickPreset}
        simulatingPreset={simulatingPreset}
      />

      {/* Pending HITL Approval Studio (If any active) */}
      {pendingWorkflows.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              Human-in-the-Loop Safety Approvals ({pendingWorkflows.length} Pending)
            </h2>
            <button
              onClick={() => navigate('/approvals')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
            >
              <span>View full approval center</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <HITLApprovalCard
            workflow={pendingWorkflows[0]}
            onApprove={handleApprove}
            onReject={handleReject}
            isSubmitting={isSubmitting}
          />
        </div>
      )}

      {/* Category Analytics & Live Audit Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Category Breakdown & ROI */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-5 bg-[#0c1222]">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Categorical Distribution
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Automated classification taxonomy</p>
          </div>

          <div className="space-y-3 pt-1">
            {totalEmails === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-slate-950/60 border border-slate-800/80 text-slate-400 text-xs">
                Workspace is clean. Ingest or sync emails to view categorical intent breakdown.
              </div>
            ) : (
              (summary?.category_distribution || []).map((cat, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-200 font-semibold">{cat.name}</span>
                    <span className="text-slate-400 font-mono text-[11px]">{cat.value} emails</span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div 
                      className="h-full rounded-full transition-all duration-500 bg-indigo-500"
                      style={{ 
                        width: `${Math.min(100, (cat.value / totalEmails) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Time Saved ROI Metric Box */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Triage Efficiency Speedup</span>
              <span className="text-sm font-extrabold text-emerald-400 font-mono">+{timeSaved.triage_time_reduction_percent || 92.5}%</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              LangGraph agent reduced manual triage, meeting booking, and task staging by {timeSaved.total_hours_saved || 0.0} hours.
            </p>
          </div>
        </div>

        {/* Real-Time Live Audit Log Feed */}
        <div className="lg:col-span-2">
          <LiveActivityFeed logs={summary?.recent_activity_logs || []} />
        </div>

      </div>

      {/* Modals */}
      <ReportDownloadModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />

      <ImportEmailModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={() => fetchDashboardData()}
      />

    </div>
  );
};

