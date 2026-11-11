import React, { useState } from 'react';
import { 
  Code, 
  Copy, 
  Check, 
  Terminal, 
  ShieldAlert, 
  Activity, 
  ChevronDown, 
  ChevronUp,
  Clock,
  Layers
} from 'lucide-react';
import clsx from 'clsx';

export const AgentReasoning = ({ workflow }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('json'); // 'json' | 'logs' | 'entities'
  const [isExpanded, setIsExpanded] = useState(true);

  if (!workflow) return null;

  const handleCopy = () => {
    const dataToCopy = {
      workflow_id: workflow.id,
      intent_category: workflow.intent_category,
      priority: workflow.priority,
      confidence_score: workflow.confidence_score,
      risk_level: workflow.risk_level,
      draft_reply: workflow.draft_reply,
      proposed_meeting: workflow.proposed_meeting,
      extracted_plan: workflow.extracted_plan,
      human_modifications: workflow.human_modifications,
      execution_logs: workflow.execution_logs,
    };
    navigator.clipboard.writeText(JSON.stringify(dataToCopy, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const confidencePct = Math.round((workflow.confidence_score || 0.9) * 100);

  return (
    <div className="glass-panel rounded-xl border border-surface-border overflow-hidden">
      
      {/* Accordion Header */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-5 py-3.5 bg-slate-900/60 border-b border-surface-border flex items-center justify-between cursor-pointer hover:bg-slate-900 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-primary-600/20 text-primary-400 border border-primary-500/30">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Agent Reasoning, Risk Analysis & Execution Logs
            </h4>
            <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
              <span>Category: <strong className="text-slate-200">{workflow.intent_category || 'N/A'}</strong></span>
              <span>•</span>
              <span>Risk: <strong className={clsx(
                workflow.risk_level === 'HIGH' ? 'text-rose-400' :
                workflow.risk_level === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'
              )}>{workflow.risk_level}</strong></span>
              <span>•</span>
              <span>Confidence: <strong className="text-primary-400">{confidencePct}%</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-5 space-y-4">
          
          {/* Sub Navigation */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('json')}
                className={clsx(
                  'px-3 py-1 rounded-lg text-xs font-semibold transition-all',
                  activeTab === 'json' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-slate-200'
                )}
              >
                Structured JSON State
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={clsx(
                  'px-3 py-1 rounded-lg text-xs font-semibold transition-all',
                  activeTab === 'logs' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-slate-200'
                )}
              >
                Step Execution Logs ({(workflow.execution_logs || []).length})
              </button>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>
          </div>

          {/* JSON View */}
          {activeTab === 'json' && (
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-80 select-all">
              {JSON.stringify({
                intent_category: workflow.intent_category,
                priority: workflow.priority,
                confidence_score: workflow.confidence_score,
                risk_level: workflow.risk_level,
                hitl_pending: workflow.is_hitl_pending,
                planned_actions: workflow.extracted_plan,
                draft_reply: workflow.draft_reply,
                proposed_meeting: workflow.proposed_meeting,
                human_modifications: workflow.human_modifications
              }, null, 2)}
            </pre>
          )}

          {/* Logs View */}
          {activeTab === 'logs' && (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {(workflow.execution_logs || []).length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No execution logs recorded.</p>
              ) : (
                (workflow.execution_logs || []).map((log, i) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 flex items-start justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-primary-300">{log.node}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                          {log.status}
                        </span>
                      </div>
                      <p className="text-slate-300 font-sans">{log.details}</p>
                    </div>

                    <div className="text-right shrink-0 text-[10px] text-slate-500">
                      <div>{log.timestamp?.split(' ')[1] || log.timestamp}</div>
                      {log.duration_ms !== undefined && (
                        <span className="font-mono text-emerald-400">{log.duration_ms}ms</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
};
