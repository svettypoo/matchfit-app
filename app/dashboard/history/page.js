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
            <div className="animate-spin text-3xl mb-2">&#9917;</div>
            <p className="text-gray-500 text-sm">Loading history...</p>
          </div>
        ) : workouts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-2">&#128221;</div>
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
