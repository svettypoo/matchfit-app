'use client';

import { useState, useEffect } from 'react';
import BottomNav from '../../../components/BottomNav';

const RPE_COLORS = {
  1: 'bg-green-100 text-green-700', 2: 'bg-green-100 text-green-700',
  3: 'bg-green-200 text-green-800', 4: 'bg-yellow-100 text-yellow-700',
  5: 'bg-yellow-100 text-yellow-700', 6: 'bg-yellow-200 text-yellow-800',
  7: 'bg-orange-100 text-orange-700', 8: 'bg-orange-200 text-orange-800',
  9: 'bg-red-100 text-red-700', 10: 'bg-red-200 text-red-800',
};

export default function HistoryPage() {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    async function load() {
      const user = JSON.parse(localStorage.getItem('mf_user') || '{}');
      try {
        const res = await fetch(`/api/players/${user.id}/history`);
        if (res.ok) {
          const data = await res.json();
          setWorkouts(data.workouts || []);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, []);

  function formatDuration(seconds) {
    const m = Math.floor(seconds / 60);
    return `${m} min`;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b px-4 py-3">
        <h1 className="font-bold text-lg text-gray-900">Workout History</h1>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {loading ? (
          <div className="text-center py-12">
            <svg className="animate-spin h-8 w-8 text-green-600 mx-auto mb-2" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            <p className="text-gray-500 text-sm">Loading history...</p>
          </div>
        ) : workouts.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" /></svg>
            <p className="text-gray-500">No workouts completed yet</p>
            <p className="text-gray-400 text-sm">Your completed workouts will appear here</p>
          </div>
        ) : (
          workouts.map(w => (
            <div key={w.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <button onClick={() => setExpanded(expanded === w.id ? null : w.id)}
                className="w-full text-left px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-400">{new Date(w.completed_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                  <div className="font-semibold text-gray-900 text-sm">{w.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">{w.completion_pct || 100}% complete</span>
                    <span className="text-xs text-gray-400">|</span>
                    <span className="text-xs text-gray-500">{w.duration ? formatDuration(w.duration) : '--'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {w.rpe && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RPE_COLORS[w.rpe] || 'bg-gray-100 text-gray-600'}`}>
                      RPE {w.rpe}
                    </span>
                  )}
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded === w.id ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {expanded === w.id && w.exercises && (
                <div className="border-t border-gray-100 px-4 py-3 space-y-2">
                  {w.exercises.map((ex, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{ex.name}</span>
                      <span className="text-gray-400">{ex.sets_completed || ex.sets}x{ex.reps}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <BottomNav active="home" />
    </div>
  );
}
