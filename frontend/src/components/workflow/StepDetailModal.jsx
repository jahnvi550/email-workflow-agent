import React from 'react';
import { X, Code2, Clock, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import clsx from 'clsx';

export const StepDetailModal = ({ isOpen, onClose, step }) => {
  if (!isOpen || !step) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-2xl rounded-3xl border border-surface-border p-6 shadow-2xl space-y-5 relative max-h-[85vh] flex flex-col justify-between">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary-600/20 text-primary-400 border border-primary-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                LangGraph Step Inspector: <span className="text-primary-400">{step.node_name}</span>
              </h3>
              <p className="text-xs text-slate-400">Step execution telemetry and state mutations</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Metadata */}
        <div className="grid grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase">Status</span>
            <span className="text-emerald-400 font-bold">{step.status}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase">Duration</span>
            <span className="text-white font-bold">{step.duration_ms || 0} ms</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase">Recorded At</span>
            <span className="text-slate-300 truncate block">
              {step.created_at ? new Date(step.created_at).toLocaleTimeString() : 'Live'}
            </span>
          </div>
        </div>

        {/* State Preview */}
        <div className="space-y-3 overflow-y-auto pr-1 max-h-[45vh]">
          {step.input_state && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                Input State Preview
              </label>
              <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto">
                {JSON.stringify(step.input_state, null, 2)}
              </pre>
            </div>
          )}

          {step.output_state && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                Output State Preview
              </label>
              <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto">
                {JSON.stringify(step.output_state, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-surface-border flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
};
