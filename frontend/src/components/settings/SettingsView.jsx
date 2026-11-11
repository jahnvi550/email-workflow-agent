import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Cpu, 
  Key, 
  Zap, 
  ShieldCheck, 
  Check, 
  RefreshCw, 
  Terminal, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle, 
  Server, 
  User, 
  Mail, 
  Radio, 
  LogIn 
} from 'lucide-react';
import clsx from 'clsx';
import { getSettings, updateSettings, testLLMConnection, getCurrentUser } from '../../services/api';
import { LoginModal } from '../common/LoginModal';

export const SettingsView = () => {
  const [settings, setSettings] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Form State
  const [provider, setProvider] = useState('mock');
  const [groqKey, setGroqKey] = useState('');
  const [groqModel, setGroqModel] = useState('llama-3.3-70b-versatile');
  const [openaiKey, setOpenaiKey] = useState('');
  const [openaiModel, setOpenaiModel] = useState('gpt-4o-mini');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState('llama3');
  const [autopilot, setAutopilot] = useState(false);
  const [threshold, setThreshold] = useState(0.85);
  const [requireHitlHighRisk, setRequireHitlHighRisk] = useState(true);

  // Connectivity Test State
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const [data, user] = await Promise.all([
        getSettings(),
        getCurrentUser().catch(() => null)
      ]);
      setSettings(data);
      setCurrentUser(user);
      setProvider(data.llm_provider || 'mock');
      setGroqModel(data.groq_model || 'llama-3.3-70b-versatile');
      setOpenaiModel(data.openai_model || 'gpt-4o-mini');
      setOllamaUrl(data.ollama_base_url || 'http://localhost:11434');
      setOllamaModel(data.ollama_model || 'llama3');
      setAutopilot(data.autopilot_enabled || false);
      setThreshold(data.confidence_threshold || 0.85);
      setRequireHitlHighRisk(data.require_hitl_on_high_risk ?? true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        llm_provider: provider,
        groq_model: groqModel,
        openai_model: openaiModel,
        ollama_base_url: ollamaUrl,
        ollama_model: ollamaModel,
        autopilot_enabled: autopilot,
        confidence_threshold: parseFloat(threshold),
        require_hitl_on_high_risk: requireHitlHighRisk
      };
      if (groqKey.trim()) payload.groq_api_key = groqKey.trim();
      if (openaiKey.trim()) payload.openai_api_key = openaiKey.trim();

      const updated = await updateSettings(payload);
      setSettings(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      alert(`Save failed: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testLLMConnection({
        provider,
        api_key: provider === 'groq' ? (groqKey || undefined) : (openaiKey || undefined),
        model: provider === 'groq' ? groqModel : (provider === 'openai' ? openaiModel : ollamaModel),
        base_url: provider === 'ollama' ? ollamaUrl : undefined
      });
      setTestResult(res);
    } catch (e) {
      setTestResult({ success: false, message: e.message });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className="glass-panel p-12 text-center text-neutral-400 text-xs">Loading system configurations...</div>;
  }

  const providersList = [
    { id: 'mock', name: 'Built-in Smart Mock LLM', badge: 'Zero Keys / Free', desc: 'Deterministic NLP & heuristic extraction with 0ms latency.' },
    { id: 'groq', name: 'Groq Cloud', badge: 'Llama 3.3 70B Ultra-Fast', desc: 'Hardware accelerated LPU inference for high throughput.' },
    { id: 'openai', name: 'OpenAI', badge: 'GPT-4o & GPT-4o-mini', desc: 'Industry-standard structured outputs & reasoning.' },
    { id: 'ollama', name: 'Local Ollama', badge: 'Private On-Premise', desc: 'Runs directly on your local workstation without external egress.' },
  ];

  return (
    <div className="space-y-6 max-w-4xl text-white">
      
      {/* Header */}
      <div className="glass-panel rounded-2xl p-5 border border-neutral-800 bg-[#0a0a0c] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white text-black flex items-center justify-center shadow-glow-primary">
            <Cpu className="w-5 h-5 text-black" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">System Settings & Integrations</h2>
            <p className="text-xs text-neutral-400">Configure language model inference backends, connected email accounts, and automated HITL gates.</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-black shadow-glow-primary transition-all active:scale-95 disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin text-black" /> : savedSuccess ? <Check className="w-4 h-4 text-black" /> : <SettingsIcon className="w-4 h-4 text-black" />}
          <span>{saving ? 'Saving...' : savedSuccess ? 'Saved Changes!' : 'Save Settings'}</span>
        </button>
      </div>

      {/* 0. Connected Mailbox & Account Login */}
      <div className="glass-panel rounded-2xl p-6 border border-neutral-800 bg-[#0a0a0c] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
            <Mail className="w-4 h-4 text-white" />
            Connected Live Email Account
          </h3>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono bg-neutral-900 text-white border border-neutral-700">
            <Radio className="w-3 h-3 text-white animate-pulse" />
            Live Sync Ready
          </span>
        </div>

        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white text-black p-0.5 shrink-0 flex items-center justify-center shadow-glow-primary">
              <Mail className="w-6 h-6 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{currentUser?.full_name || 'Connected Real Mailbox'}</span>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-neutral-900 text-neutral-300 border border-neutral-700">
                  {currentUser?.provider === 'REAL_IMAP' ? 'LIVE IMAP' : 'CONNECTED'}
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">{currentUser?.email || 'No real account connected yet'}</p>
            </div>
          </div>

          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-black transition-all shadow-sm shrink-0"
          >
            <LogIn className="w-3.5 h-3.5 text-black" />
            <span>Connect / Change Email</span>
          </button>
        </div>
      </div>

      {/* 1. Provider Selection */}
      <div className="glass-panel rounded-2xl p-6 border border-neutral-800 bg-[#0a0a0c] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
            <Server className="w-4 h-4 text-white" />
            1. Select Active LLM Provider
          </h3>
          <span className="text-xs text-neutral-500">Changes apply to all new workflow runs immediately</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {providersList.map((p) => {
            const isSelected = provider === p.id;
            return (
              <div
                key={p.id}
                onClick={() => setProvider(p.id)}
                className={clsx(
                  'p-4 rounded-xl border cursor-pointer transition-all duration-200 text-left',
                  isSelected
                    ? 'border-white bg-white text-black shadow-glow-primary'
                    : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={clsx("text-sm font-bold", isSelected ? "text-black" : "text-white")}>{p.name}</span>
                  <span className={clsx(
                    'px-2 py-0.5 rounded text-[10px] font-semibold border',
                    isSelected ? 'bg-black text-white border-black' : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                  )}>
                    {p.badge}
                  </span>
                </div>
                <p className={clsx("text-xs mt-1 leading-relaxed", isSelected ? "text-neutral-700" : "text-neutral-400")}>{p.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. API Keys & Provider Details */}
      <div className="glass-panel rounded-2xl p-6 border border-neutral-800 bg-[#0a0a0c] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
            <Key className="w-4 h-4 text-white" />
            2. Provider Credentials & Parameters
          </h3>
          
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-700 text-xs font-semibold transition-colors"
          >
            <RefreshCw className={clsx('w-3.5 h-3.5', testing && 'animate-spin')} />
            <span>{testing ? 'Testing...' : 'Test Connection & Ping'}</span>
          </button>
        </div>

        {/* Test Result Callout */}
        {testResult && (
          <div className={clsx(
            'p-3.5 rounded-xl border text-xs flex items-center justify-between animate-in fade-in duration-200',
            testResult.success
              ? 'bg-neutral-900 border-white text-white'
              : 'bg-neutral-950 border-neutral-700 text-neutral-300'
          )}>
            <div className="flex items-center gap-2">
              {testResult.success ? <CheckCircle2 className="w-4 h-4 text-white" /> : <AlertTriangle className="w-4 h-4 text-neutral-400" />}
              <span>{testResult.message}</span>
            </div>
            {testResult.latency_ms !== undefined && (
              <span className="font-mono font-bold">{testResult.latency_ms}ms</span>
            )}
          </div>
        )}

        {/* Fields based on provider */}
        {provider === 'mock' && (
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 leading-relaxed">
            💡 <strong>Smart Mock NLP Engine Active:</strong> No API keys or network connection required. The engine uses deterministic regex, date extraction heuristics, and action plan synthesizers to produce production-grade results with zero fees.
          </div>
        )}

        {provider === 'groq' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                Groq API Key {settings?.groq_api_key_configured && <span className="text-white font-mono">(Key Configured ✓)</span>}
              </label>
              <input
                type="password"
                placeholder={settings?.groq_api_key_configured ? "••••••••••••••••••••••••••••" : "gsk_..."}
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-black border border-neutral-700 text-xs text-white focus:outline-none focus:border-white font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">Model Name</label>
              <input
                type="text"
                value={groqModel}
                onChange={(e) => setGroqModel(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-black border border-neutral-700 text-xs text-white focus:outline-none focus:border-white font-mono"
              />
            </div>
          </div>
        )}

        {provider === 'openai' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                OpenAI API Key {settings?.openai_api_key_configured && <span className="text-white font-mono">(Key Configured ✓)</span>}
              </label>
              <input
                type="password"
                placeholder={settings?.openai_api_key_configured ? "••••••••••••••••••••••••••••" : "sk-proj-..."}
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-black border border-neutral-700 text-xs text-white focus:outline-none focus:border-white font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">Model Name</label>
              <input
                type="text"
                value={openaiModel}
                onChange={(e) => setOpenaiModel(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-black border border-neutral-700 text-xs text-white focus:outline-none focus:border-white font-mono"
              />
            </div>
          </div>
        )}

        {provider === 'ollama' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">Ollama Host URL</label>
              <input
                type="text"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-black border border-neutral-700 text-xs text-white focus:outline-none focus:border-white font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">Local Model Tag</label>
              <input
                type="text"
                value={ollamaModel}
                onChange={(e) => setOllamaModel(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-black border border-neutral-700 text-xs text-white focus:outline-none focus:border-white font-mono"
              />
            </div>
          </div>
        )}

      </div>

      {/* 3. Autopilot & HITL Safety Thresholds */}
      <div className="glass-panel rounded-2xl p-6 border border-neutral-800 bg-[#0a0a0c] space-y-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-white" />
          3. Autopilot & Human-in-the-Loop Policies
        </h3>

        <div className="space-y-4">
          
          {/* Autopilot Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-950 border border-neutral-800">
            <div>
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-white" />
                Enable Autonomous Autopilot Mode
              </span>
              <p className="text-xs text-neutral-400 mt-0.5">
                Automatically execute action plans without pausing at the Human Gate when confidence exceeds threshold.
              </p>
            </div>
            <input
              type="checkbox"
              checked={autopilot}
              onChange={(e) => setAutopilot(e.target.checked)}
              className="w-5 h-5 accent-white rounded cursor-pointer"
            />
          </div>

          {/* Confidence Slider */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-200">Autopilot Confidence Cutoff Threshold</span>
              <span className="font-mono font-bold text-white text-sm">{Math.round(threshold * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="0.99"
              step="0.01"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full accent-white cursor-pointer"
            />
            <p className="text-[11px] text-neutral-500">
              Any extraction scored below {Math.round(threshold * 100)}% will automatically trigger the Human Approval Gate.
            </p>
          </div>

          {/* High-Risk Forced HITL */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Always Require HITL for High-Risk Emails
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                Mandatory human review for outages, legal SOWs, billing issues, even if Autopilot is enabled.
              </p>
            </div>
            <input
              type="checkbox"
              checked={requireHitlHighRisk}
              onChange={(e) => setRequireHitlHighRisk(e.target.checked)}
              className="w-5 h-5 accent-indigo-500 rounded cursor-pointer"
            />
          </div>

        </div>

      </div>

      {/* 4. Danger Zone: Data Management & Clean Purge */}
      <div className="glass-panel rounded-3xl p-6 border border-rose-500/30 bg-[#120a14] space-y-4 shadow-2xl">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-300">
              4. Workspace Reset & Clean Slate
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Purge all simulated or ingested emails, extracted tasks, calendar meetings, and LangGraph workflow history.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/80 border border-rose-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-slate-200 block">Reset Database to 100% Clean Zero-Data State</span>
            <span className="text-[11px] text-slate-400">Permanently clears emails, tasks, workflows, and calendar syncs from SQLite.</span>
          </div>

          <button
            onClick={async () => {
              if (window.confirm('Are you sure you want to purge all emails, tasks, workflows, and events? This action cannot be undone.')) {
                try {
                  const { purgeWorkspaceData } = await import('../../services/api');
                  const res = await purgeWorkspaceData();
                  alert(res.message || 'Workspace purged cleanly.');
                  window.location.reload();
                } catch (e) {
                  alert(`Purge error: ${e.message}`);
                }
              }
            }}
            className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all shrink-0"
          >
            Purge All Data & Reset
          </button>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={() => fetchSettings()}
      />

    </div>
  );
};

