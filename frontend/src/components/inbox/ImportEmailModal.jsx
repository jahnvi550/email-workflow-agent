import React, { useState } from 'react';
import { 
  Mail, 
  UploadCloud, 
  FileText, 
  Sparkles, 
  X, 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  Zap, 
  Sliders,
  FileCode2,
  Inbox
} from 'lucide-react';
import clsx from 'clsx';
import { importRawEmail } from '../../services/api';

export const ImportEmailModal = ({ isOpen, onClose, onImportSuccess }) => {
  const [tab, setTab] = useState('compose'); // 'compose' | 'raw'
  const [sender, setSender] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [rawText, setRawText] = useState('');
  const [autoProcess, setAutoProcess] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setRawText(content);
        setTab('raw');
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      let payload = {};
      if (tab === 'compose') {
        if (!sender.trim() || !subject.trim() || !body.trim()) {
          throw new Error('Please enter sender email, subject, and email body.');
        }
        payload = {
          raw_content: body,
          sender: sender.trim(),
          subject: subject.trim(),
          auto_process: autoProcess
        };
      } else {
        if (!rawText.trim()) {
          throw new Error('Please paste raw email headers & body or upload a .eml file.');
        }
        payload = {
          raw_content: rawText,
          auto_process: autoProcess
        };
      }

      const res = await importRawEmail(payload);
      if (onImportSuccess) {
        onImportSuccess(res);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to ingest email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-2xl rounded-3xl border border-slate-700/60 bg-[#0c1222] shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 p-0.5 shadow-glow-primary flex items-center justify-center">
              <Inbox className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">Ingest Real Email / RFC822</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  REAL-TIME PIPELINE
                </span>
              </div>
              <p className="text-xs text-slate-400">Directly ingest real incoming emails or import raw .EML payloads for autonomous AI orchestration.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          
          {/* Tabs */}
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-950 border border-slate-800">
            <button
              type="button"
              onClick={() => setTab('compose')}
              className={clsx(
                'flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2',
                tab === 'compose'
                  ? 'bg-indigo-600 text-white shadow-glow-primary'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              <Mail className="w-4 h-4" />
              <span>Compose / Custom Ingest</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('raw')}
              className={clsx(
                'flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2',
                tab === 'raw'
                  ? 'bg-indigo-600 text-white shadow-glow-primary'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              <FileCode2 className="w-4 h-4" />
              <span>Paste Raw RFC822 / .EML</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {tab === 'compose' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Sender Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="client.alex@partnercompany.com"
                    value={sender}
                    onChange={(e) => setSender(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Subject Line *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Urgent: Payment Gateway Migration Review"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Email Body Content *</label>
                <textarea
                  required
                  rows={6}
                  placeholder={`Hi Team,\n\nPlease complete the following action items by tomorrow 3 PM:\n1. Audit the database connection pool.\n2. Review the updated SLA agreement.\n3. Schedule a 30-min strategy sync.\n\nBest regards,\nAlex`}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-sans leading-relaxed"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Raw RFC822 Message / EML Content</label>
                
                <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-indigo-300 border border-indigo-500/30 transition-colors">
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload .EML File</span>
                  <input type="file" accept=".eml,.txt,.msg" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              <textarea
                rows={8}
                placeholder={`From: director@partner.com\nTo: user@organization.com\nSubject: Q3 Security Audit & Tasks\nDate: Mon, 03 Sep 2026 14:00:00 +0000\n\nTeam,\nPlease ensure the following deliverables are signed off by Friday 5 PM:\n1. Review the cloud security redline\n2. Prepare latency benchmarks`}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
              />
            </div>
          )}

          {/* Options */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-indigo-400" />
              <div>
                <span className="text-xs font-bold text-white">Auto-Trigger Multi-Agent Workflow</span>
                <p className="text-[11px] text-slate-400">Classify intent, extract exact tasks & meetings, and calculate priorities instantly.</p>
              </div>
            </div>

            <input
              type="checkbox"
              checked={autoProcess}
              onChange={(e) => setAutoProcess(e.target.checked)}
              className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
            />
          </div>

          {/* Footer actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-glow-primary transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>{isSubmitting ? 'Ingesting & Orchestrating...' : 'Ingest & Run Workflow'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
