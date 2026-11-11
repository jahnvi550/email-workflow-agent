import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  Cpu, 
  Sliders, 
  ShieldAlert, 
  ShieldCheck,
  UserCheck, 
  Wrench, 
  CheckCheck,
  Zap,
  ChevronRight,
  Code2,
  Info,
  Lock
} from 'lucide-react';
import clsx from 'clsx';

export const VisualPipeline = ({ workflow }) => {
  const [selectedNodeId, setSelectedNodeId] = useState('security_guardrail');

  if (!workflow) {
    return (
      <div className="glass-panel rounded-3xl p-8 text-center text-slate-500 text-xs border border-slate-800 bg-[#0c1222]">
        Select an orchestration run to inspect the LangGraph execution pipeline.
      </div>
    );
  }

  const nodes = [
    {
      id: 'security_guardrail',
      name: 'Security Guardrail',
      description: 'Adversarial & Injection Check',
      icon: ShieldCheck,
      color: 'text-indigo-400',
      summary: workflow.risk_level === 'HIGH' && workflow.intent_category === 'Urgent Escalation'
        ? 'High-risk security guardrail triggered. Verified input and routed to mandatory human verification gate.'
        : 'Adversarial prompt injection & safety guardrail check passed cleanly.'
    },
    {
      id: 'classify_and_extract',
      name: 'Classify & Extract',
      description: 'Intent, Entities & Action Items',
      icon: Cpu,
      color: 'text-violet-400',
      summary: `Classified as '${workflow.intent_category || 'General'}' with ${Math.round((workflow.confidence_score || 0.9) * 100)}% model confidence.`
    },
    {
      id: 'plan_orchestration',
      name: 'Plan Orchestration',
      description: 'Multi-Step Action Pipeline',
      icon: Sliders,
      color: 'text-cyan-400',
      summary: `Synthesized ${(workflow.extracted_plan || []).length} automated tool execution steps.`
    },
    {
      id: 'evaluate_risk_and_hitl',
      name: 'Risk & Safety Eval',
      description: 'Confidence & Gate Policy',
      icon: ShieldAlert,
      color: 'text-amber-400',
      summary: `Evaluated risk as ${workflow.risk_level} with ${workflow.is_hitl_pending ? 'MANDATORY HITL GATE' : 'AUTOPILOT BYPASS'}.`
    },
    {
      id: 'human_approval_gate',
      name: 'HITL Checkpoint Gate',
      description: workflow.is_hitl_pending ? 'Awaiting Human Approval' : (workflow.human_modifications ? 'Human Approved' : 'Autopilot Passed'),
      icon: UserCheck,
      color: 'text-rose-400',
      isGate: true,
      summary: workflow.is_hitl_pending 
        ? 'Workflow paused. Waiting for human operator review & sign-off.' 
        : (workflow.human_modifications ? 'Human verified and modified proposal.' : 'Autopilot verified execution criteria.')
    },
    {
      id: 'execute_actions',
      name: 'Tool Execution',
      description: 'Tasks, Calendar, SMTP Tools',
      icon: Wrench,
      color: 'text-emerald-400',
      summary: 'TaskTool, CalendarTool, and EmailTool (Live SMTP / Staged) executed.'
    },
    {
      id: 'finalize_summary',
      name: 'Finalize & Audit',
      description: 'Metrics & Audit Log',
      icon: CheckCheck,
      color: 'text-indigo-300',
      summary: 'Workflow state committed to audit history.'
    },
  ];

  const getNodeState = (nodeId) => {
    const isFailed = workflow.state === 'FAILED';
    const isRejected = workflow.state === 'REJECTED';
    const isPendingApproval = workflow.state === 'PENDING_APPROVAL';
    const isCompleted = workflow.state === 'COMPLETED';

    const step = (workflow.steps || []).find(s => s.node_name === nodeId);

    if (nodeId === 'human_approval_gate') {
      if (isPendingApproval) return 'PAUSED_HITL';
      if (isRejected) return 'REJECTED';
      if (isCompleted || workflow.human_modifications) return 'COMPLETED';
      return 'BYPASSED';
    }

    if (step) return step.status || 'COMPLETED';
    if (isCompleted) return 'COMPLETED';
    if (workflow.current_node === nodeId) return 'ACTIVE';
    return 'PENDING';
  };

  const getStepDuration = (nodeId) => {
    const step = (workflow.steps || []).find(s => s.node_name === nodeId);
    return step?.duration_ms;
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];
  const selectedStepData = (workflow.steps || []).find(s => s.node_name === selectedNodeId);

  return (
    <div className="glass-panel rounded-3xl p-6 border border-slate-700/80 space-y-5 bg-[#0c1222] shadow-2xl text-slate-100">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-glow-primary">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              LangGraph StateGraph Execution Pipeline
            </h3>
            <p className="text-[11px] text-slate-400">Click any node to inspect discrete step mutations, security checks, and telemetry</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-xs">
          <span className="font-mono text-slate-400 text-[11px] bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
            RUN ID: <strong className="text-white">{workflow.id.slice(0, 8)}...</strong>
          </span>
          <span className={clsx(
            'px-3 py-1 rounded-full font-black uppercase text-[10px] tracking-wider border shadow-sm font-mono',
            workflow.state === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-glow-emerald' :
            workflow.state === 'PENDING_APPROVAL' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse shadow-glow-amber' :
            workflow.state === 'REJECTED' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-glow-rose' :
            'bg-slate-800 text-slate-300 border-slate-700'
          )}>
            {workflow.state}
          </span>
        </div>
      </div>

      {/* 7 Nodes Interactive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-1">
        {nodes.map((node, index) => {
          const state = getNodeState(node.id);
          const duration = getStepDuration(node.id);
          const Icon = node.icon;
          const isSelected = selectedNodeId === node.id;

          const isNodeActive = state === 'ACTIVE' || state === 'PAUSED_HITL';
          const isNodeCompleted = state === 'COMPLETED' || state === 'BYPASSED' || state === 'PASSED';
          const isNodePaused = state === 'PAUSED_HITL';
          const isNodeRejected = state === 'REJECTED';

          return (
            <div
              key={node.id}
              onClick={() => setSelectedNodeId(node.id)}
              className={clsx(
                'p-3.5 rounded-2xl border flex flex-col justify-between cursor-pointer transition-all duration-200 relative overflow-hidden',
                isSelected ? 'ring-2 ring-indigo-500 scale-[1.02] border-indigo-400 shadow-glow-primary' : '',
                isNodePaused ? 'bg-amber-950/30 border-amber-500/70 shadow-glow-amber animate-pulse' :
                isNodeRejected ? 'bg-rose-950/30 border-rose-500/60 shadow-glow-rose' :
                isNodeCompleted ? 'bg-slate-900/70 border-slate-800 hover:border-indigo-500/40' :
                isNodeActive ? 'bg-indigo-950/30 border-indigo-500 shadow-glow-primary' :
                'bg-slate-950/50 border-slate-800 text-slate-500 hover:border-slate-700'
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={clsx(
                    'p-1.5 rounded-xl border',
                    isNodePaused ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' :
                    isNodeRejected ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' :
                    isNodeCompleted ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' :
                    isNodeActive ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400' :
                    'bg-slate-900 border-slate-800 text-slate-500'
                  )}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  
                  <span className="text-[10px] font-mono font-bold text-slate-500">
                    0{index + 1}
                  </span>
                </div>

                <h4 className={clsx(
                  'text-xs font-bold tracking-tight',
                  isNodeCompleted ? 'text-white' :
                  isNodePaused ? 'text-amber-300' :
                  isNodeRejected ? 'text-rose-300' :
                  isNodeActive ? 'text-indigo-300' : 'text-slate-400'
                )}>
                  {node.name}
                </h4>

                <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {node.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                {duration !== undefined ? (
                  <span className="text-emerald-400 font-mono font-bold">{duration}ms</span>
                ) : (
                  <span className="text-slate-500 font-mono">{isNodePaused ? 'Human Hold' : 'Pending'}</span>
                )}
                
                {isNodeCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                {isNodePaused && <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />}
                {isNodeRejected && <AlertCircle className="w-3.5 h-3.5 text-rose-400" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Node Inspector Drawer */}
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-indigo-400">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white uppercase text-[11px]">Selected Node Inspector: <span className="text-indigo-300 underline font-semibold">{selectedNode.name}</span></span>
            <p className="text-slate-400 text-xs mt-0.5">{selectedNode.summary}</p>
          </div>
        </div>

        {selectedStepData && (
          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400 shrink-0 self-end sm:self-center">
            <span>Execution Status: <strong className="text-emerald-400">{selectedStepData.status}</strong></span>
            <span>•</span>
            <span>Duration: <strong className="text-white">{selectedStepData.duration_ms}ms</strong></span>
          </div>
        )}
      </div>

    </div>
  );
};

