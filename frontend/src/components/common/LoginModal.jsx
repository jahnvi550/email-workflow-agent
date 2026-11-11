import React, { useState } from 'react';
import { 
  Bot, 
  ShieldCheck, 
  Zap, 
  User, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  Mail, 
  X, 
  RefreshCw, 
  Server, 
  Key, 
  Info, 
  Check, 
  AlertTriangle,
  FileCheck
} from 'lucide-react';
import clsx from 'clsx';
import { connectRealEmail, testImapCredentials } from '../../services/api';

export const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [realEmail, setRealEmail] = useState('');
  const [realPassword, setRealPassword] = useState('');
  const [realFullName, setRealFullName] = useState('');
  const [imapPreset, setImapPreset] = useState('gmail');
  const [customServer, setCustomServer] = useState('imap.gmail.com');
  const [customPort, setCustomPort] = useState(993);
  const [fetchLimit, setFetchLimit] = useState(5);
  
  // User Consent / Permission state
  const [hasUserConsent, setHasUserConsent] = useState(true);
  
  const [testStatus, setTestStatus] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handlePresetChange = (preset) => {
    setImapPreset(preset);
    if (preset === 'gmail') {
      setCustomServer('imap.gmail.com');
      setCustomPort(993);
    } else if (preset === 'outlook') {
      setCustomServer('outlook.office365.com');
      setCustomPort(993);
    } else if (preset === 'yahoo') {
      setCustomServer('imap.mail.yahoo.com');
      setCustomPort(993);
    }
  };

  const handleTestImap = async () => {
    if (!realEmail || !realPassword) {
      setTestStatus({ success: false, message: 'Please enter both your email address and password / App Password first.' });
      return;
    }
    setIsTesting(true);
    setTestStatus(null);
    try {
      const res = await testImapCredentials({
        email: realEmail,
        password: realPassword,
        imap_server: customServer,
        imap_port: parseInt(customPort, 10),
        fetch_limit: 1
      });
      setTestStatus({ success: true, message: res.message || 'IMAP Connection Verified Successfully!' });
    } catch (e) {
      setTestStatus({ success: false, message: e.message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleRealEmailSubmit = async (e) => {
    e.preventDefault();
    if (!realEmail || !realPassword) {
      setTestStatus({ success: false, message: 'Please enter both email and password / App Password.' });
      return;
    }
    if (!hasUserConsent) {
      setTestStatus({ success: false, message: 'Please grant mailbox reading permission to allow AI workflow orchestration.' });
      return;
    }

    setLoading(true);
    setTestStatus(null);
    try {
      const res = await connectRealEmail({
        email: realEmail,
        password: realPassword,
        full_name: realFullName || realEmail.split('@')[0],
        imap_server: customServer,
        imap_port: parseInt(customPort, 10),
        fetch_limit: parseInt(fetchLimit, 10)
      });
      if (onLoginSuccess) {
        onLoginSuccess({
          email: realEmail,
          full_name: realFullName || realEmail.split('@')[0],
          provider: 'REAL_IMAP'
        });
      }
      if (onClose) onClose();
    } catch (err) {
      setTestStatus({ success: false, message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
      
      <div className="glass-panel w-full max-w-xl rounded-3xl border border-white/20 shadow-2xl p-7 relative overflow-hidden space-y-5 bg-[#0a0a0c] text-white">
        
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Top Header */}
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-white text-black p-0.5 mx-auto flex items-center justify-center shadow-glow-primary">
            <Mail className="w-6 h-6 text-black" />
          </div>

          <h2 className="text-2xl font-black font-display text-white tracking-tight">
            Connect Real Email Account
          </h2>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            Autonomous LangGraph Multi-Agent Orchestrator. Connect your real mailbox to automatically read emails and orchestrate tasks & workflows.
          </p>
        </div>

        {/* FORM: CONNECT REAL LIVE EMAIL */}
        <form onSubmit={handleRealEmailSubmit} className="space-y-4 pt-1">
          
          {/* Provider Preset Bar */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 block">
              Select Email Provider:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'gmail', label: 'Gmail', icon: '✉️' },
                { id: 'outlook', label: 'Outlook / 365', icon: '📬' },
                { id: 'yahoo', label: 'Yahoo Mail', icon: '📨' },
                { id: 'custom', label: 'Custom IMAP', icon: '⚙️' }
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handlePresetChange(item.id)}
                  className={clsx(
                    'py-2 px-2 rounded-xl border text-[11px] font-bold transition-all text-center flex items-center justify-center gap-1.5',
                    imapPreset === item.id
                      ? 'border-white bg-white text-black shadow-sm'
                      : 'border-neutral-800 bg-neutral-900/80 text-neutral-300 hover:border-neutral-600'
                  )}
                >
                  <span>{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Email & Password Input Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-neutral-200 block mb-1">Your Email Address</label>
              <input
                type="email"
                required
                placeholder="e.g. yourname@gmail.com"
                value={realEmail}
                onChange={(e) => setRealEmail(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-black border border-neutral-700 text-xs text-white placeholder-neutral-500 focus:border-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-200 block mb-1">
                {imapPreset === 'gmail' ? 'Google App Password (16-char)' : 'Email Password'}
              </label>
              <input
                type="password"
                required
                placeholder={imapPreset === 'gmail' ? '16-character App Password' : '••••••••••••'}
                value={realPassword}
                onChange={(e) => setRealPassword(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-black border border-neutral-700 text-xs text-white placeholder-neutral-500 focus:border-white focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* IMAP Server & Port */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-[11px] font-semibold text-neutral-400 block mb-1">IMAP Server Host</label>
              <input
                type="text"
                value={customServer}
                onChange={(e) => setCustomServer(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-black border border-neutral-800 text-xs text-neutral-200 font-mono focus:border-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-neutral-400 block mb-1">Port (SSL)</label>
              <input
                type="number"
                value={customPort}
                onChange={(e) => setCustomPort(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-black border border-neutral-800 text-xs text-neutral-200 font-mono focus:border-white focus:outline-none"
              />
            </div>
          </div>

          {/* Helpful instructions for Gmail App Passwords */}
          {imapPreset === 'gmail' && (
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-white">
                <Info className="w-3.5 h-3.5 text-white shrink-0" />
                <span>How to get a Gmail App Password:</span>
              </div>
              <p className="text-[10px] text-neutral-400 leading-relaxed">
                Go to Google Account Security $\to$ Turn on <strong>2-Step Verification</strong> $\to$ Search <strong>App Passwords</strong> $\to$ Create one named "EmailAgent" and paste the 16-character code above.
              </p>
            </div>
          )}

          {/* User Permission & Consent Gate */}
          <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-start gap-3">
            <input
              type="checkbox"
              id="userConsentCheck"
              checked={hasUserConsent}
              onChange={(e) => setHasUserConsent(e.target.checked)}
              className="w-4 h-4 mt-0.5 accent-white rounded cursor-pointer shrink-0"
            />
            <label htmlFor="userConsentCheck" className="text-xs text-neutral-300 leading-relaxed cursor-pointer select-none">
              <strong className="text-white">Grant AI Agent Permission to Access & Process Mailbox</strong>
              <span className="block text-[10px] text-neutral-400 mt-0.5">
                Authorizes the LangGraph multi-agent orchestrator to fetch incoming emails, extract tasks with deadlines, schedule meetings, and stage draft replies.
              </span>
            </label>
          </div>

          {/* Test Status Banner */}
          {testStatus && (
            <div className={clsx(
              'p-3 rounded-xl border text-xs flex items-center justify-between',
              testStatus.success ? 'bg-neutral-900 border-white text-white' : 'bg-neutral-950 border-neutral-700 text-neutral-200'
            )}>
              <div className="flex items-center gap-2">
                {testStatus.success ? <CheckCircle2 className="w-4 h-4 text-white" /> : <AlertTriangle className="w-4 h-4 text-neutral-400" />}
                <span>{testStatus.message}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleTestImap}
              disabled={isTesting || loading}
              className="px-4 py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Server className="w-4 h-4" />}
              <span>{isTesting ? 'Verifying...' : 'Test Connection'}</span>
            </button>

            <button
              type="submit"
              disabled={loading || !hasUserConsent}
              className="flex-1 py-3 rounded-2xl bg-white hover:bg-neutral-200 text-black font-extrabold text-xs shadow-glow-primary transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin text-black" /> : <ArrowRight className="w-4 h-4 text-black" />}
              <span>{loading ? 'Connecting Mailbox & Reading Emails...' : 'Connect Live Mailbox & Read Emails'}</span>
            </button>
          </div>

        </form>

        <div className="text-center text-[10px] text-neutral-500 font-mono">
          Batch-05 • Department of Computer Science & Engineering (Allied Branches)
        </div>

      </div>

    </div>
  );
};
