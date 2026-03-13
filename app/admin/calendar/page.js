'use client';

import { useState, useEffect } from 'react';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const EVENT_TYPES = [
  { id: 'workout', label: 'Workout', color: 'bg-green-500' },
  { id: 'game', label: 'Game', color: 'bg-blue-500' },
  { id: 'rest', label: 'Rest', color: 'bg-gray-400' },
  { id: 'assessment', label: 'Assessment', color: 'bg-purple-500' },
];

export default function TeamCalendarPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [events, setEvents] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [newEvent, setNewEvent] = useState({ type: 'workout', title: '', details: '' });

  useEffect(() => {
    async function load() {
      const user = JSON.parse(localStorage.getItem('mf_user') || '{}');
      try {
        const res = await fetch(`/api/coach/calendar?coach_id=${user.id}&year=${year}&month=${month + 1}`);
        if (res.ok) {
          const data = await res.json();
          setEvents(data.events || {});
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, [year, month]);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function getDateStr(day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  async function addEvent(e) {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('mf_user') || '{}');
    try {
      await fetch('/api/coach/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newEvent, date: selectedDay, coach_id: user.id }),
      });
      setShowAdd(false);
      setNewEvent({ type: 'workout', title: '', details: '' });
      // Reload
      const res = await fetch(`/api/coach/calendar?coach_id=${user.id}&year=${year}&month=${month + 1}`);
      if (res.ok) setEvents((await res.json()).events || {});
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Team Calendar</h1>
      </div>

      {/* Month Nav */}
      <div className="flex items-center justify-between">
        <button onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }}
          className="p-2 hover:bg-gray-100 rounded-lg">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h2 className="font-semibold text-lg">{MONTHS[month]} {year}</h2>
        <button onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }}
          className="p-2 hover:bg-gray-100 rounded-lg">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-gray-500">
        {EVENT_TYPES.map(t => (
          <div key={t.id} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded ${t.color}`} />{t.label}
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={i} className="aspect-square" />;
            const dateStr = getDateStr(day);
            const dayEvents = events[dateStr] || [];
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            return (
              <button key={i} onClick={() => { setSelectedDay(dateStr); if (dayEvents.length === 0) setShowAdd(true); }}
                className={`aspect-square rounded-lg p-1 text-sm flex flex-col items-center hover:bg-gray-50 transition-all ${
                  isToday ? 'ring-2 ring-green-500' : ''
                }`}>
                <span className="font-medium text-gray-700">{day}</span>
                <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                  {dayEvents.map((ev, j) => {
                    const type = EVENT_TYPES.find(t => t.id === ev.type);
                    return <div key={j} className={`w-1.5 h-1.5 rounded-full ${type?.color || 'bg-gray-300'}`} />;
                  })}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Events */}
      {selectedDay && events[selectedDay]?.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">{new Date(selectedDay + 'T12:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
            <button onClick={() => setShowAdd(true)} className="text-sm text-green-600 font-medium">+ Add</button>
          </div>
          <div className="space-y-2">
            {events[selectedDay].map((ev, i) => {
              const type = EVENT_TYPES.find(t => t.id === ev.type);
              return (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className={`w-3 h-8 rounded-full ${type?.color || 'bg-gray-300'}`} />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{ev.title}</div>
                    {ev.details && <div className="text-xs text-gray-500">{ev.details}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="font-bold text-gray-900 mb-4">Add Event — {selectedDay}</h3>
            <form onSubmit={addEvent} className="space-y-4">
              <div className="flex gap-2">
                {EVENT_TYPES.map(t => (
                  <button key={t.id} type="button" onClick={() => setNewEvent(e => ({ ...e, type: t.id }))}
                    className={`flex-1 py-2 text-sm rounded-lg font-medium ${
                      newEvent.type === t.id ? `${t.color} text-white` : 'bg-gray-100 text-gray-600'
                    }`}>{t.label}</button>
                ))}
              </div>
              <input type="text" value={newEvent.title} onChange={e => setNewEvent(ev => ({ ...ev, title: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none" placeholder="Event title" required />
              <textarea value={newEvent.details} onChange={e => setNewEvent(ev => ({ ...ev, details: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none h-20 resize-none" placeholder="Details (optional)" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-3 bg-gray-100 rounded-lg font-medium">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
