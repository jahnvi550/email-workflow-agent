import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  X, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Layers, 
  Calendar, 
  Database,
  ArrowDownToLine,
  Table,
  ShieldCheck,
  Zap,
  TrendingUp,
  Award
} from 'lucide-react';
import clsx from 'clsx';
import { getExecutiveReportData, getCsvExportUrl } from '../../services/api';

export const ReportDownloadModal = ({ isOpen, onClose }) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getExecutiveReportData();
      setReportData(data);
    } catch (e) {
      console.error('Failed to load report data:', e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handlePrintPDF = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    if (!reportData) return;
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emailflow_workspace_report_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const summary = reportData?.executive_summary || {
    total_emails_triaged: 0,
    total_tasks_automated: 0,
    completed_tasks: 0,
    active_meetings_scheduled: 0,
    total_hours_saved: 0.0,
    sla_compliance_rate: '99.4%',
    autonomous_confidence_avg: '94.2%'
  };

  const tasks = reportData?.tasks || [];
  const emails = reportData?.emails || [];
  const meetings = reportData?.meetings || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-4xl max-h-[90vh] rounded-3xl border border-slate-700/60 bg-[#0c1222] shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 p-0.5 shadow-glow-primary flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">Executive Intelligence & ROI Report</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  EXPORT SUITE
                </span>
              </div>
              <p className="text-xs text-slate-400">Download formatted intelligence reports, CSV raw logs, and executive telemetry.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintPDF}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-glow-primary transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Quick Export Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            
            {/* 1. Tasks CSV */}
            <a
              href={getCsvExportUrl('tasks')}
              download
              className="glass-card p-4 rounded-2xl border border-slate-800 hover:border-indigo-500/40 flex items-center justify-between group cursor-pointer transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                  <Table className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">Tasks Breakdown (CSV)</h4>
                  <p className="text-[11px] text-slate-400 font-mono">{tasks.length} task records</p>
                </div>
              </div>
              <ArrowDownToLine className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 group-hover:translate-y-0.5 transition-all" />
            </a>

            {/* 2. Emails CSV */}
            <a
              href={getCsvExportUrl('emails')}
              download
              className="glass-card p-4 rounded-2xl border border-slate-800 hover:border-indigo-500/40 flex items-center justify-between group cursor-pointer transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">Emails Triage (CSV)</h4>
                  <p className="text-[11px] text-slate-400 font-mono">{emails.length} email records</p>
                </div>
              </div>
              <ArrowDownToLine className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 group-hover:translate-y-0.5 transition-all" />
            </a>

            {/* 3. JSON Data Dump */}
            <button
              onClick={handleDownloadJSON}
              className="glass-card p-4 rounded-2xl border border-slate-800 hover:border-indigo-500/40 flex items-center justify-between group cursor-pointer transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-violet-500/15 text-violet-400 border border-violet-500/30">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-violet-300 transition-colors">Full Dump (JSON)</h4>
                  <p className="text-[11px] text-slate-400 font-mono">Structured schema</p>
                </div>
              </div>
              <ArrowDownToLine className="w-4 h-4 text-slate-400 group-hover:text-violet-400 group-hover:translate-y-0.5 transition-all" />
            </button>

          </div>

          {/* Executive KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Emails Triaged</span>
              <div className="text-xl font-extrabold text-white mt-0.5 font-mono">{summary.total_emails_triaged}</div>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3 h-3" /> Auto-triaged
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Tasks Automated</span>
              <div className="text-xl font-extrabold text-indigo-400 mt-0.5 font-mono">{summary.total_tasks_automated}</div>
              <span className="text-[10px] text-slate-400 font-mono mt-1">
                {summary.completed_tasks} completed
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Hours Saved</span>
              <div className="text-xl font-extrabold text-emerald-400 mt-0.5 font-mono">{summary.total_hours_saved}h</div>
              <span className="text-[10px] text-slate-400 font-mono mt-1">
                vs manual triage
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">SLA Compliance</span>
              <div className="text-xl font-extrabold text-amber-400 mt-0.5 font-mono">{summary.sla_compliance_rate}</div>
              <span className="text-[10px] text-slate-400 font-mono mt-1">
                Zero task drop
              </span>
            </div>
          </div>

          {/* Tasks Table Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Table className="w-4 h-4 text-indigo-400" />
                Active Extracted Tasks & Priority Breakdown
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">Showing {tasks.length} items</span>
            </div>

            {tasks.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-950/60 border border-slate-800 text-slate-400 text-xs">
                No tasks available. Ingest an email to generate automated tasks and populate this report.
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-mono text-[11px]">
                      <th className="py-2.5 px-4 font-semibold">TASK TITLE</th>
                      <th className="py-2.5 px-3 font-semibold">PRIORITY</th>
                      <th className="py-2.5 px-3 font-semibold">EFFORT</th>
                      <th className="py-2.5 px-3 font-semibold">STATUS</th>
                      <th className="py-2.5 px-3 font-semibold">ASSIGNEE</th>
                      <th className="py-2.5 px-3 font-semibold">DEADLINE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                    {tasks.slice(0, 8).map((t, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-2.5 px-4 font-medium text-slate-200">
                          <div className="max-w-[280px] truncate">{t.title}</div>
                          {t.priority_reason && (
                            <div className="text-[10px] text-slate-400 truncate mt-0.5">{t.priority_reason}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={clsx(
                            'px-2 py-0.5 rounded text-[10px] font-bold font-mono',
                            t.priority === 'URGENT' && 'badge-urgent',
                            t.priority === 'HIGH' && 'badge-high',
                            t.priority === 'MEDIUM' && 'badge-medium',
                            t.priority === 'LOW' && 'badge-low'
                          )}>
                            {t.priority}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-300">{t.estimated_hours || '1h'}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-300">{t.status}</td>
                        <td className="py-2.5 px-3 text-slate-300 text-[11px]">{t.assignee}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">{t.deadline}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Scheduled Meetings Preview */}
          {meetings.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                Scheduled Calendar Syncs
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {meetings.slice(0, 4).map((m, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-200 truncate">{m.title}</span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        {m.location}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-400">{m.start_time} - {m.end_time}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/60 text-xs text-slate-400">
          <span className="font-mono text-[11px]">Generated: {reportData?.generated_at || 'Just now'}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
