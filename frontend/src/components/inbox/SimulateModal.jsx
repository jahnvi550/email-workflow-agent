import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Mail, 
  PenTool, 
  Check, 
  Send,
  Zap,
  Flame,
  FileCode,
  GraduationCap,
  Scale,
  Bug,
  Users,
  DollarSign,
  MessageSquare
} from 'lucide-react';
import clsx from 'clsx';
import { getSimulationPresets, simulateEmail } from '../../services/api';
import { PriorityBadge, CategoryBadge } from '../common/Badge';

export const SimulateModal = ({ isOpen, onClose, onSuccess }) => {
  const [presets, setPresets] = useState([]);
  const [activeTab, setActiveTab] = useState('presets'); // 'presets' | 'custom'
  const [selectedPresetId, setSelectedPresetId] = useState('p0-outage');
  const [autoProcess, setAutoProcess] = useState(true);
  const [loading, setLoading] = useState(false);

  // Custom Form State
  const [customSender, setCustomSender] = useState('client.vip@enterprise.com');
  const [customSubject, setCustomSubject] = useState('Urgent: Production Database Timeout during peak load');
  const [customBody, setCustomBody] = useState(`Hi Team,\n\nWe are experiencing severe database connection pool exhaustion on our primary Postgres instance.\n\nCould we jump on a quick 30-minute sync at 3:00 PM today to review the failover metrics and deploy the connection pool patch?\n\nThanks,\nVIP Client Team`);

  useEffect(() => {
    if (isOpen) {
      getSimulationPresets()
        .then(data => {
          setPresets(data || []);
          if (data && data.length > 0) setSelectedPresetId(data[0].id);
        })
        .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSimulate = async () => {
    setLoading(true);
    try {
      if (activeTab === 'presets') {
        await simulateEmail({
          preset_id: selectedPresetId,
          auto_process: autoProcess
        });
      } else {
        await simulateEmail({
          custom_sender: customSender,
          custom_subject: customSubject,
          custom_body: customBody,
          auto_process: autoProcess
        });
      }
      onSuccess();
      onClose();
    } catch (e) {
      alert(`Simulation failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const selectedPreset = presets.find(p => p.id === selectedPresetId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-2xl rounded-2xl border border-surface-border shadow-2xl p-6 relative max-h-[90vh] flex flex-col justify-between">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-surface-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary-600/20 text-primary-400 border border-primary-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Simulate Incoming Email</h3>
              <p className="text-xs text-slate-400">Trigger deterministic presets or craft custom prompts for LangGraph.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mt-4 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('presets')}
            className={clsx(
              'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all',
              activeTab === 'presets' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>10 Business & Academic Presets</span>
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={clsx(
              'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all',
              activeTab === 'custom' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Custom Email Prompt Composer</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="my-4 overflow-y-auto pr-1 max-h-[50vh] space-y-4">
          
          {activeTab === 'presets' ? (
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Select Simulation Scenario:
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {presets.map((p) => {
                  const isSelected = selectedPresetId === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPresetId(p.id)}
                      className={clsx(
                        'p-3 rounded-xl border cursor-pointer transition-all duration-200 text-left',
                        isSelected
                          ? 'border-primary-500 bg-primary-950/30 shadow-glow-primary'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-white truncate max-w-[180px]">{p.title}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-primary-400 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <PriorityBadge priority={p.priority} />
                        <CategoryBadge category={p.category} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Preset Preview Box */}
              {selectedPreset && (
                <div className="mt-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                  <div className="text-slate-400 font-semibold mb-1">
                    Subject: <span className="text-slate-200">{selectedPreset.subject}</span>
                  </div>
                  <p className="text-slate-400 line-clamp-3 leading-relaxed">{selectedPreset.body}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Sender Email</label>
                <input
                  type="email"
                  value={customSender}
                  onChange={(e) => setCustomSender(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Email Subject</label>
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Raw Email Body</label>
                <textarea
                  rows={4}
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:border-primary-500 focus:outline-none font-sans"
                />
              </div>
            </div>
          )}

          {/* Auto Process Toggle */}
          <div className="pt-2 flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent-cyan" />
              <div>
                <span className="text-xs font-semibold text-white">Auto-Trigger LangGraph Workflow</span>
                <p className="text-[11px] text-slate-400">Instantly execute intent extraction, task planning, and HITL gate.</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={autoProcess}
              onChange={(e) => setAutoProcess(e.target.checked)}
              className="w-4 h-4 accent-primary-600 rounded cursor-pointer"
            />
          </div>

        </div>

        {/* Footer CTA */}
        <div className="pt-4 border-t border-surface-border flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSimulate}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-semibold text-xs shadow-glow-primary transition-all active:scale-95 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{loading ? 'Simulating & Ingesting...' : 'Inject Email'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
