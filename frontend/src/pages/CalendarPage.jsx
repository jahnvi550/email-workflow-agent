import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  RefreshCw, 
  Video, 
  Clock, 
  Sparkles, 
  Users, 
  Plus 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CalendarGrid } from '../components/calendar/CalendarGrid';
import { getCalendarEvents, deleteCalendarEvent, createCalendarEvent } from '../services/api';

export const CalendarPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await getCalendarEvents();
      setEvents(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Cancel this scheduled meeting?')) return;
    try {
      await deleteCalendarEvent(eventId);
      setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (e) {
      alert(`Delete failed: ${e.message}`);
    }
  };

  const handleSelectEmail = (emailId) => {
    navigate('/inbox');
  };

  return (
    <div className="space-y-6 text-white">
      
      {/* Header Card - Black & White Theme */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-neutral-800 bg-[#0a0a0c] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white text-black p-0.5 shadow-glow-primary flex items-center justify-center">
            <CalendarIcon className="w-6 h-6 text-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Smart Calendar & Meeting Dispatcher
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-white text-black">
                GOOGLE MEET SYNC
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Synchronized calendar agendas with automated Google Meet video room invitations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 flex items-center gap-2">
            <Video className="w-4 h-4 text-white" />
            <span>Scheduled: <strong className="text-white font-mono">{events.length} Meetings</strong></span>
          </div>

          <button
            onClick={fetchEvents}
            className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <CalendarGrid
        events={events}
        onDeleteEvent={handleDeleteEvent}
        onRefresh={fetchEvents}
        onSelectEmail={handleSelectEmail}
      />

    </div>
  );
};
