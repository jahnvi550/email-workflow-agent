import React, { useState, useEffect } from 'react';
import { 
  Inbox as InboxIcon, 
  Sparkles, 
  RefreshCw, 
  Filter, 
  Search,
  CheckCircle2,
  Zap,
  Radio,
  Play,
  Mail,
  Flame,
  CheckCheck,
  PlusCircle,
  UploadCloud,
  FileCode2
} from 'lucide-react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { EmailList } from '../components/inbox/EmailList';
import { EmailViewer } from '../components/inbox/EmailViewer';
import { ImportEmailModal } from '../components/inbox/ImportEmailModal';
import { 
  getEmails, 
  processEmailWorkflow, 
  updateEmailFlags, 
  deleteEmail,
  autoTriageAllEmails,
  autoIngestRandomEmail
} from '../services/api';

export const InboxPage = () => {
  const navigate = useNavigate();
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingEmailId, setProcessingEmailId] = useState(null);
  const [isAutoTriaging, setIsAutoTriaging] = useState(false);
  const [autoTriageSuccessMsg, setAutoTriageSuccessMsg] = useState(null);
  const [autoGenerateOnSelect, setAutoGenerateOnSelect] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const data = await getEmails();
      setEmails(data || []);
      if (data && data.length > 0 && !selectedEmail) {
        setSelectedEmail(data[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
    const interval = setInterval(fetchEmails, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleProcessEmail = async (emailId, forceRestart = false) => {
    setProcessingEmailId(emailId);
    try {
      const res = await processEmailWorkflow(emailId, forceRestart);
      await fetchEmails();
      const updated = emails.find(e => e.id === emailId);
      if (updated) {
        setSelectedEmail({ ...updated, status: 'PROCESSED' });
      }
      setAutoTriageSuccessMsg(`Workflow auto-generated successfully (${res.workflow_state}).`);
      setTimeout(() => setAutoTriageSuccessMsg(null), 4000);
    } catch (e) {
      alert(`Workflow trigger failed: ${e.message}`);
    } finally {
      setProcessingEmailId(null);
    }
  };

  const handleSelectEmail = (email) => {
    setSelectedEmail(email);
    if (autoGenerateOnSelect && email.status === 'UNPROCESSED') {
      handleProcessEmail(email.id, false);
    }
  };

  const handleAutoTriageAll = async () => {
    setIsAutoTriaging(true);
    try {
      const res = await autoTriageAllEmails();
      setAutoTriageSuccessMsg(res.message);
      await fetchEmails();
      setTimeout(() => setAutoTriageSuccessMsg(null), 4000);
    } catch (e) {
      alert(`Auto-triage failed: ${e.message}`);
    } finally {
      setIsAutoTriaging(false);
    }
  };

  const handleAutoIngestOne = async () => {
    try {
      const res = await autoIngestRandomEmail();
      await fetchEmails();
      if (res.workflow_id) {
        navigate('/workflows');
      }
    } catch (e) {
      alert(`Auto-ingest error: ${e.message}`);
    }
  };

  const handleToggleStar = async (emailId, isStarred) => {
    try {
      await updateEmailFlags(emailId, { is_starred: isStarred });
      setEmails(prev => prev.map(e => e.id === emailId ? { ...e, is_starred: isStarred } : e));
    } catch (e) {}
  };

  const handleDeleteEmail = async (emailId) => {
    if (!window.confirm('Are you sure you want to delete this email?')) return;
    try {
      await deleteEmail(emailId);
      setEmails(prev => prev.filter(e => e.id !== emailId));
      if (selectedEmail?.id === emailId) {
        setSelectedEmail(null);
      }
    } catch (e) {
      alert(`Delete failed: ${e.message}`);
    }
  };

  const unprocessedCount = emails.filter(e => e.status === 'UNPROCESSED').length;

  return (
    <div className="space-y-6 text-slate-100">
      
      {/* Top Header Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-slate-700/80 bg-[#0c1222] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 p-0.5 shadow-glow-primary flex items-center justify-center">
            <InboxIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Live Mailbox & Ingestion Hub
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                LIVE INGESTION
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Continuous background polling daemon reading incoming emails with LangGraph task & workflow decomposition.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          
          {/* Ingest Real Email Button */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-glow-primary transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Ingest / Compose</span>
          </button>

          {/* Auto Generate on Selection Toggle */}
          <button
            onClick={() => setAutoGenerateOnSelect(!autoGenerateOnSelect)}
            className={clsx(
              "flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-bold transition-all shadow-sm",
              autoGenerateOnSelect 
                ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/40 shadow-glow-primary" 
                : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
            )}
            title="When active, selecting an unprocessed email immediately triggers LangGraph workflow generation"
          >
            <Zap className={clsx("w-3.5 h-3.5", autoGenerateOnSelect ? "text-indigo-400" : "text-slate-500")} />
            <span>Auto-Gen: {autoGenerateOnSelect ? 'ON' : 'OFF'}</span>
          </button>

          {/* 1-Click Auto Triage All Unprocessed */}
          {unprocessedCount > 0 && (
            <button
              onClick={handleAutoTriageAll}
              disabled={isAutoTriaging}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 font-extrabold text-xs transition-all active:scale-95 disabled:opacity-50"
            >
              {isAutoTriaging ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Sparkles className="w-4 h-4 text-indigo-400" />
              )}
              <span>Auto-Triage All ({unprocessedCount})</span>
            </button>
          )}

          <button
            onClick={fetchEmails}
            className="p-2 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            title="Refresh Inbox"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Auto Triage Success Toast Alert */}
      {autoTriageSuccessMsg && (
        <div className="p-4 rounded-2xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-200 text-xs flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCheck className="w-5 h-5 text-indigo-400" />
            <span className="font-bold">{autoTriageSuccessMsg}</span>
          </div>
          <button
            onClick={() => navigate('/workflows')}
            className="px-3 py-1 rounded-xl bg-indigo-600 text-white font-bold text-[11px] hover:bg-indigo-500 transition-colors shadow-glow-primary"
          >
            View in Workflows →
          </button>
        </div>
      )}

      {/* Empty State Helper when 0 emails */}
      {emails.length === 0 && !loading && (
        <div className="glass-panel rounded-3xl p-10 text-center border border-slate-800 space-y-4 bg-[#0c1222]">
          <div className="w-16 h-16 rounded-3xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto shadow-glow-primary">
            <Mail className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-white">Your Mailbox is 100% Clean</h3>
            <p className="text-xs text-slate-400">
              Zero pending messages. Ingest a real email or connect your IMAP mailbox (Gmail, Outlook) to start automated AI task extraction.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-glow-primary transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Ingest / Compose Real Email</span>
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs transition-colors"
            >
              <span>Connect IMAP / Gmail</span>
            </button>
          </div>
        </div>
      )}

      {/* Grid: Email List + Detail Drawer */}
      {emails.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Email Table / List */}
          <div className={selectedEmail ? "lg:col-span-7" : "lg:col-span-12"}>
            <EmailList
              emails={emails}
              selectedEmail={selectedEmail}
              onSelectEmail={handleSelectEmail}
              onProcessEmail={handleProcessEmail}
              onToggleStar={handleToggleStar}
              onDeleteEmail={handleDeleteEmail}
              onRefresh={fetchEmails}
              processingEmailId={processingEmailId}
            />
          </div>

          {/* Selected Email Inspector Drawer */}
          {selectedEmail && (
            <div className="lg:col-span-5 sticky top-20">
              <EmailViewer
                email={selectedEmail}
                onClose={() => setSelectedEmail(null)}
                onProcess={handleProcessEmail}
                isProcessing={processingEmailId === selectedEmail.id}
              />
            </div>
          )}

        </div>
      )}

      {/* Ingest Modal */}
      <ImportEmailModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={() => fetchEmails()}
      />

    </div>
  );
};

