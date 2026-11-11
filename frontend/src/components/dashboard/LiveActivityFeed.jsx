import React from 'react';
import { Activity, Radio } from 'lucide-react';
import clsx from 'clsx';

export const LiveActivityFeed = ({ logs = [] }) => {
  return (
    <div className="glass-panel rounded-2xl p-6 border border-neutral-800 bg-[#0a0a0c] space-y-4 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
            <Activity className="w-4 h-4 text-white" />
            Backend Real Execution & Audit Trail
          </h3>
          <p className="text-[11px] text-neutral-400 mt-0.5">Persistent database log of all automated tool executions and reviewer decisions</p>
        </div>
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono bg-neutral-900 text-white border border-neutral-700">
          <Radio className="w-3 h-3 text-white animate-pulse" />
          Audit Stream
        </span>
      </div>

      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
        {logs.length === 0 ? (
          <p className="text-xs text-neutral-500 py-8 text-center">No activity logged yet. Connect a mailbox or run a workflow to see the real audit trail.</p>
        ) : (
          logs.map((log) => (
            <div 
              key={log.id}
              className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 flex items-center justify-between gap-3 text-xs transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 border bg-neutral-900 text-white border-neutral-700">
                  {log.action}
                </span>
                <span className="text-neutral-200 truncate font-medium">
                  {log.details?.title || log.details?.subject || log.details?.feedback || JSON.stringify(log.details)}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0 text-[10px] text-neutral-500 font-mono">
                <span className="px-1.5 py-0.5 rounded bg-black text-neutral-400 border border-neutral-800">
                  {log.actor}
                </span>
                <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
