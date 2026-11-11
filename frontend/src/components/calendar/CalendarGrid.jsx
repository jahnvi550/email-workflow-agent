import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  Video, 
  ExternalLink, 
  Plus, 
  Trash2, 
  MapPin,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import clsx from 'clsx';
import { createCalendarEvent } from '../../services/api';

export const CalendarGrid = ({ 
  events = [], 
  onDeleteEvent, 
  onRefresh, 
  onSelectEmail 
}) => {
  const [viewMode, setViewMode] = useState('upcoming'); // 'upcoming' | 'weekly'
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newAttendee, setNewAttendee] = useState('client@example.com');

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newStart) return;
    try {
      const startTime = new Date(newStart);
      const endTime = new Date(startTime.getTime() + 45 * 60000);

      await createCalendarEvent({
        title: newTitle,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        attendees: [newAttendee, 'user@organization.com'],
        location: 'Google Meet',
        status: 'CONFIRMED'
      });
      setNewTitle('');
      setNewStart('');
      setIsAddingEvent(false);
      onRefresh();
    } catch (err) {
      alert(`Failed to schedule event: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Header Bar */}
      <div className="glass-panel rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Automated Calendar & Sync</h3>
            <p className="text-xs text-slate-400">Synchronized meetings extracted and scheduled from incoming email workflows.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddingEvent(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-glow-emerald transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Book Meeting</span>
          </button>

          <button
            onClick={onRefresh}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Inline Create Event Form */}
      {isAddingEvent && (
        <form onSubmit={handleCreateSubmit} className="glass-panel p-4 rounded-xl border border-emerald-500/50 space-y-3 animate-in fade-in duration-200">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Schedule New Meeting</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Meeting Subject / Title..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
              required
            />
            <input
              type="datetime-local"
              value={newStart}
              onChange={(e) => setNewStart(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
              required
            />
            <input
              type="email"
              placeholder="Attendee Email"
              value={newAttendee}
              onChange={(e) => setNewAttendee(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddingEvent(false)}
              className="px-3 py-1 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1 rounded bg-emerald-600 text-white text-xs font-semibold shadow-glow-emerald"
            >
              Save Meeting
            </button>
          </div>
        </form>
      )}

      {/* Events Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.length === 0 ? (
          <div className="col-span-full glass-panel p-12 text-center text-slate-500 text-xs rounded-2xl">
            No calendar meetings scheduled yet. Trigger an email preset to auto-book!
          </div>
        ) : (
          events.map((event) => {
            const startDate = new Date(event.start_time);
            const endDate = new Date(event.end_time);

            return (
              <div
                key={event.id}
                className="glass-card rounded-2xl p-5 border border-surface-border bg-slate-900/60 hover:bg-slate-900/90 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  
                  {/* Top Status & Date */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {event.status}
                    </span>
                    
                    <span className="text-xs font-semibold text-slate-300">
                      {startDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  {/* Title & Time */}
                  <div className="mt-3">
                    <h4 className="text-sm font-bold text-white line-clamp-1">{event.title}</h4>
                    <p className="flex items-center gap-1.5 text-xs text-primary-400 font-mono mt-1">
                      <Clock className="w-3.5 h-3.5" />
                      {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC
                    </p>
                  </div>

                  {/* Attendees */}
                  {event.attendees && event.attendees.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Attendees:</span>
                      <div className="flex items-center gap-1 flex-wrap">
                        {event.attendees.map((att, i) => (
                          <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700 truncate max-w-[180px]">
                            {att}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Source Email */}
                  {event.email_subject && (
                    <div className="mt-3 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => onSelectEmail && onSelectEmail(event.email_id)}
                        className="text-[11px] text-primary-400 hover:text-primary-300 flex items-center gap-1 truncate max-w-full"
                        title={`Source: ${event.email_subject}`}
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span className="truncate">Email: {event.email_subject}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Bottom Actions: Meet Link & Delete */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  {event.meeting_link ? (
                    <a
                      href={event.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 text-xs font-semibold transition-colors"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Join Meet</span>
                    </a>
                  ) : (
                    <span className="text-xs text-slate-500">No meeting link</span>
                  )}

                  <button
                    onClick={() => onDeleteEvent(event.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                    title="Cancel event"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
