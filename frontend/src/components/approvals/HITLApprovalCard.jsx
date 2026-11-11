import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert,
  Check, 
  X, 
  Edit3, 
  Send, 
  Calendar, 
  CheckSquare, 
  Mail, 
  MessageSquare,
  AlertTriangle,
  RefreshCw,
  Plus,
  Trash2,
  Video,
  Sparkles,
  User,
  Clock,
  Tag,
  Wand2,
  CheckCircle2,
  Lock
} from 'lucide-react';
import clsx from 'clsx';
import { PriorityBadge } from '../common/Badge';
import { refineWorkflowDraft } from '../../services/api';

export const HITLApprovalCard = ({ workflow, onApprove, onReject, isSubmitting }) => {
  if (!workflow || !workflow.is_hitl_pending) return null;

  // Editable local state initialized from workflow proposal
  const [feedback, setFeedback] = useState('');
  
  // Draft Reply edits
  const [replyBody, setReplyBody] = useState(workflow.draft_reply?.body || '');
  const [replySubject, setReplySubject] = useState(workflow.draft_reply?.subject || '');
  const [replyTone, setReplyTone] = useState(workflow.draft_reply?.tone || 'Professional');
  
  // Refine with AI state
  const [customRefinePrompt, setCustomRefinePrompt] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [refineSuccessMsg, setRefineSuccessMsg] = useState('');

  // Meeting edits
  const [hasMeeting, setHasMeeting] = useState(Boolean(workflow.proposed_meeting));
  const [meetingTitle, setMeetingTitle] = useState(workflow.proposed_meeting?.title || 'Synchronous Follow-up');
  const [meetingStart, setMeetingStart] = useState(
    workflow.proposed_meeting?.start_time ? workflow.proposed_meeting.start_time.slice(0, 16) : ''
  );

  // Task edits
  const [tasks, setTasks] = useState(
    workflow.extracted_plan && Array.isArray(workflow.extracted_plan) 
      ? workflow.extracted_plan.filter(a => a.action_type === 'CREATE_TASK').map(a => a.parameters || {})
      : []
  );

  // Check if security guardrail flagged this workflow
  const isSecurityFlagged = Boolean(
    workflow.risk_level === 'HIGH' && 
    (workflow.intent_category === 'Urgent Escalation' || 
     (workflow.execution_logs && workflow.execution_logs.some(l => l.status === 'WARNING' || l.details?.includes('Security') || l.details?.includes('injection'))))
  );

  const handleTaskChange = (index, field, value) => {
    const updated = [...tasks];
    updated[index] = { ...updated[index], [field]: value };
    setTasks(updated);
  };

  const handleAddTask = () => {
    setTasks([
      ...tasks,
      {
        title: 'New Action Item',
        description: 'Added during human-in-the-loop review.',
        priority: 'MEDIUM',
        assignee: 'AI Agent',
        tags: ['Manual-Review']
      }
    ]);
  };

  const handleDeleteTask = (index) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const handleRefineDraft = async (instruction, toneToApply) => {
    if (!instruction) return;
    setIsRefining(true);
    setRefineSuccessMsg('');
    try {
      const res = await refineWorkflowDraft(workflow.id, {
        instruction,
        tone: toneToApply || replyTone,
        current_body: replyBody
      });
      if (res && res.body) {
        setReplyBody(res.body);
        if (res.subject) setReplySubject(res.subject);
        if (res.tone) setReplyTone(res.tone);
        setRefineSuccessMsg(`Draft updated: ${instruction}`);
        setTimeout(() => setRefineSuccessMsg(''), 4000);
      }
    } catch (err) {
      alert(`AI Refinement failed: ${err.message}`);
    } finally {
      setIsRefining(false);
      setCustomRefinePrompt('');
    }
  };

  const handleApprove = () => {
    const payload = {
      action: 'APPROVE',
      feedback_notes: feedback || 'Approved with human verification.',
      modified_draft_reply: {
        recipient: workflow.draft_reply?.recipient || workflow.email_sender,
        subject: replySubject,
        body: replyBody,
        tone: replyTone
      },
      modified_tasks: tasks,
      modified_meeting: hasMeeting ? {
        title: meetingTitle,
        start_time: meetingStart ? `${meetingStart}:00` : undefined,
        attendees: [workflow.email_sender || 'sender@example.com'],
        is_required: true,
        location: 'Google Meet'
      } : null
    };

    onApprove(workflow.id, payload);
  };

  const handleReject = () => {
    onReject(workflow.id, {
      action: 'REJECT',
      feedback_notes: feedback || 'Rejected by human operator.'
    });
  };

  const quickReasonChips = [
    "Looks good! Approved.",
    "Adjusted task deadlines.",
    "Refined draft reply wording.",
    "Meeting rescheduled."
  ];

  const refinePresets = [
    { label: "👔 Executive Formal", instruction: "Rewrite to sound executive, polished and formal" },
    { label: "⚡ Ultra Concise", instruction: "Make it extremely brief, direct, and under 3 sentences" },
    { label: "❤️ Empathetic & Solution", instruction: "Show deep empathy, acknowledge any inconvenience, and reassure with proactive steps" },
    { label: "🚨 Urgent Escalation", instruction: "Direct, high-urgency acknowledging incident commander status" },
    { label: "📅 Add Calendar Link", instruction: "Add a calendar link for synchronous follow-up" }
  ];

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-7 border-2 border-white/40 bg-[#0a0a0c] text-white shadow-2xl space-y-6 relative overflow-hidden">
      
      {/* Security Banner if flagged */}
      {isSecurityFlagged && (
        <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-extrabold uppercase tracking-wider text-amber-300">Security Guardrail Active:</span>
              <span className="ml-1.5 text-neutral-300">High-risk or prompt injection guardrails enforced mandatory human gate review before outbound actions.</span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold shrink-0">
            HIGH RISK GATE
          </span>
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-800">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-white text-black shadow-glow-primary flex items-center justify-center shrink-0">
            <ShieldCheck className="w-7 h-7 text-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-extrabold text-white tracking-tight">Human-in-the-Loop Approval Studio</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-white text-black tracking-wider">
                Action Required
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Review, edit AI proposals, and approve execution for: <strong className="text-white font-semibold">"{workflow.email_subject || 'Email Workflow'}"</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          <PriorityBadge priority={workflow.priority} />
          <div className="px-3 py-1 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono text-neutral-300">
            Model Conf: <strong className="text-white">{Math.round((workflow.confidence_score || 0.9) * 100)}%</strong>
          </div>
        </div>
      </div>

      {/* 3-Column Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1: Tasks Studio */}
        <div className="space-y-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-white" />
                1. Decomposed Tasks ({tasks.length})
              </span>
              <button
                onClick={handleAddTask}
                className="text-xs text-white hover:text-neutral-300 flex items-center gap-1 font-bold bg-neutral-900 px-2 py-0.5 rounded-lg border border-neutral-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Task
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {tasks.length === 0 ? (
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-center text-xs text-neutral-500">
                  No task items extracted.
                </div>
              ) : (
                tasks.map((task, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2.5 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={task.title || ''}
                        onChange={(e) => handleTaskChange(idx, 'title', e.target.value)}
                        placeholder="Task Title"
                        className="w-full bg-black px-2.5 py-1.5 rounded-lg border border-neutral-700 text-xs font-bold text-white focus:border-white focus:outline-none"
                      />
                      <button
                        onClick={() => handleDeleteTask(idx)}
                        className="text-neutral-500 hover:text-white p-1 rounded-md transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={task.priority || 'MEDIUM'}
                        onChange={(e) => handleTaskChange(idx, 'priority', e.target.value)}
                        className="bg-black px-2.5 py-1 rounded-lg border border-neutral-700 text-[11px] font-semibold text-neutral-200 focus:outline-none"
                      >
                        <option value="URGENT">URGENT</option>
                        <option value="HIGH">HIGH</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="LOW">LOW</option>
                      </select>

                      <input
                        type="text"
                        value={task.assignee || 'AI Agent'}
                        onChange={(e) => handleTaskChange(idx, 'assignee', e.target.value)}
                        placeholder="Assignee"
                        className="flex-1 bg-black px-2.5 py-1 rounded-lg border border-neutral-700 text-[11px] text-neutral-200 focus:outline-none font-medium"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Column 2: Calendar Studio */}
        <div className="space-y-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-white" />
                2. Calendar Booking
              </span>
              <label className="flex items-center gap-1.5 text-xs text-neutral-300 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasMeeting}
                  onChange={(e) => setHasMeeting(e.target.checked)}
                  className="w-4 h-4 accent-white rounded"
                />
                Schedule Call
              </label>
            </div>

            {hasMeeting ? (
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3 text-xs shadow-sm">
                <div>
                  <label className="text-[11px] font-bold text-neutral-400 block mb-1">Meeting Title</label>
                  <input
                    type="text"
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                    className="w-full bg-black px-3 py-1.5 rounded-lg border border-neutral-700 text-xs font-bold text-white focus:border-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-neutral-400 block mb-1">Start Time (UTC)</label>
                  <input
                    type="datetime-local"
                    value={meetingStart}
                    onChange={(e) => setMeetingStart(e.target.value)}
                    className="w-full bg-black px-3 py-1.5 rounded-lg border border-neutral-700 text-xs text-white focus:border-white focus:outline-none"
                  />
                </div>

                <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-[11px] text-neutral-300 flex items-center gap-2">
                  <Video className="w-4 h-4 text-white shrink-0" />
                  <span>Google Meet room will be generated & invited</span>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-neutral-950 border border-dashed border-neutral-800 text-center text-xs text-neutral-500">
                No meeting requested for this workflow. Check the box above to schedule one.
              </div>
            )}
          </div>
        </div>

        {/* Column 3: AI Draft Reply Studio with Refine with AI */}
        <div className="space-y-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                <Mail className="w-4 h-4 text-white" />
                3. AI Draft Reply
              </span>
              
              <div className="flex items-center gap-1 bg-black p-0.5 rounded-lg border border-neutral-800 text-[10px]">
                {['Professional', 'Urgent', 'Cordial'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setReplyTone(t)}
                    className={clsx(
                      'px-2 py-0.5 rounded-md font-semibold transition-colors',
                      replyTone === t ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2.5 text-xs shadow-sm">
              <div>
                <label className="text-[11px] font-bold text-neutral-400 block mb-1">Subject</label>
                <input
                  type="text"
                  value={replySubject}
                  onChange={(e) => setReplySubject(e.target.value)}
                  className="w-full bg-black px-3 py-1.5 rounded-lg border border-neutral-700 text-xs font-bold text-white focus:border-white focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-neutral-400">Email Body</label>
                  {refineSuccessMsg && (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 animate-fade-in">
                      <CheckCircle2 className="w-3 h-3" /> {refineSuccessMsg}
                    </span>
                  )}
                </div>
                <textarea
                  rows={4}
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  className="w-full bg-black p-2.5 rounded-lg border border-neutral-700 text-xs text-neutral-200 focus:border-white focus:outline-none font-sans leading-relaxed resize-none"
                />
              </div>

              {/* ✨ Refine with AI Interactive Bar */}
              <div className="pt-2 border-t border-neutral-800/80 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-white">
                  <Wand2 className="w-3.5 h-3.5 text-white" />
                  <span>Refine with AI:</span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {refinePresets.map((p, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      disabled={isRefining}
                      onClick={() => handleRefineDraft(p.instruction, p.label.split(' ')[1])}
                      className="px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-700 hover:border-white text-[10px] text-neutral-300 hover:text-white transition-all disabled:opacity-50"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 mt-1">
                  <input
                    type="text"
                    value={customRefinePrompt}
                    onChange={(e) => setCustomRefinePrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customRefinePrompt.trim()) {
                        e.preventDefault();
                        handleRefineDraft(customRefinePrompt.trim());
                      }
                    }}
                    placeholder="Custom instruction (e.g. mention refund policy)..."
                    className="flex-1 bg-black px-2.5 py-1 rounded-md border border-neutral-700 text-[11px] text-white placeholder-neutral-500 focus:outline-none focus:border-white"
                  />
                  <button
                    type="button"
                    disabled={isRefining || !customRefinePrompt.trim()}
                    onClick={() => handleRefineDraft(customRefinePrompt.trim())}
                    className="px-2.5 py-1 rounded-md bg-white hover:bg-neutral-200 text-black font-bold text-[11px] flex items-center gap-1 disabled:opacity-40 transition-all"
                  >
                    {isRefining ? <RefreshCw className="w-3 h-3 animate-spin text-black" /> : <Sparkles className="w-3 h-3 text-black" />}
                    <span>Apply</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Quick Reason Chips & Reviewer Comments */}
      <div className="pt-4 border-t border-neutral-800 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-neutral-400 font-bold uppercase">Quick Comments:</span>
          {quickReasonChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => setFeedback(chip)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <input
            type="text"
            placeholder="Add reviewer notes or reasoning for audit log..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full sm:flex-1 px-4 py-2.5 rounded-xl bg-black border border-neutral-700 text-xs text-white placeholder-neutral-500 focus:border-white focus:outline-none"
          />

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={handleReject}
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-neutral-700 hover:bg-neutral-900 text-neutral-300 text-xs font-bold transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              <span>Reject Workflow</span>
            </button>

            <button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-7 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-black shadow-glow-primary transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin text-black" />
              ) : (
                <Check className="w-4 h-4 text-black" />
              )}
              <span>Approve & Dispatch</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
