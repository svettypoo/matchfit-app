'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '../../../components/BottomNav';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarPage() {
  const router = useRouter();
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [workouts, setWorkouts] = useState({});
  const [selectedDay, setSelectedDay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ completed: 0, total: 0, streak: 0 });

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  useEffect(() => {
    async function load() {
      const user = JSON.parse(localStorage.getItem('mf_user') || '{}');
      try {
        const res = await fetch(`/api/players/${user.id}/calendar?year=${year}&month=${month + 1}`);
        if (res.ok) {
          const data = await res.json();
          setWorkouts(data.days || {});
          setStats(data.stats || { completed: 0, total: 0, streak: 0 });
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

  function getStatusColor(day) {
    const dateStr = getDateStr(day);
    const w = workouts[dateStr];
    if (!w) return '';
    if (w.status === 'completed') return 'bg-green-500 text-white';
    if (w.status === 'missed') return 'bg-red-400 text-white';
    if (w.status === 'upcoming') return 'bg-blue-400 text-white';
    if (w.status === 'rest') return 'bg-gray-300 text-gray-600';
    return '';
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b px-4 py-3">
        <h1 className="font-bold text-lg text-gray-900">Calendar</h1>
      </div>

      {/* Stats Bar */}
      <div className="px-4 py-3 flex gap-3">
        <div className="flex-1 bg-green-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-green-700">{stats.completed}/{stats.total}</div>
          <div className="text-xs text-green-600">This Month</div>
        </div>
        <div className="flex-1 bg-orange-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-orange-600">{stats.streak}</div>
          <div className="text-xs text-orange-500">Day Streak</div>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="px-4 flex items-center justify-between py-2">
        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100">
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="font-semibold text-gray-900">{MONTHS[month]} {year}</h2>
        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100">
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="px-4">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const dateStr = getDateStr(day);
            const isToday = dateStr === todayStr;
            const statusColor = getStatusColor(day);
            return (
              <button
                key={i}
                onClick={() => setSelectedDay(dateStr === selectedDay ? null : dateStr)}
                className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all ${statusColor || 'hover:bg-gray-100 text-gray-700'} ${
                  isToday ? 'ring-2 ring-green-500 ring-offset-1' : ''
                } ${selectedDay === dateStr ? 'ring-2 ring-blue-500' : ''}`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Detail */}
      {selectedDay && workouts[selectedDay] && (
        <div className="px-4 mt-4 animate-slide-up">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">{workouts[selectedDay].name || 'Workout'}</h3>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                workouts[selectedDay].status === 'completed' ? 'bg-green-100 text-green-700' :
                workouts[selectedDay].status === 'missed' ? 'bg-red-100 text-red-700' :
                workouts[selectedDay].status === 'rest' ? 'bg-gray-100 text-gray-600' :
                'bg-blue-100 text-blue-700'
              }`}>
                {workouts[selectedDay].status}
              </span>
            </div>
            {workouts[selectedDay].exercises_count && (
              <p className="text-sm text-gray-500">{workouts[selectedDay].exercises_count} exercises</p>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="px-4 mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-500" />Completed</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-400" />Missed</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-blue-400" />Upcoming</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-gray-300" />Rest</div>
      </div>

      <BottomNav active="calendar" />
    </div>
  );
}
