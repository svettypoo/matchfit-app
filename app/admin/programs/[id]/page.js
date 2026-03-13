'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ProgramDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAssign, setShowAssign] = useState(false);
  const [players, setPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/programs/${id}`);
        if (res.ok) setProgram(await res.json());
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function loadPlayers() {
    const user = JSON.parse(localStorage.getItem('mf_user') || '{}');
    try {
      const res = await fetch(`/api/teams?coach_id=${user.id}&include_players=true`);
      if (res.ok) {
        const data = await res.json();
        const allPlayers = (data.teams || []).flatMap(t => (t.players || []).map(p => ({ ...p, team_name: t.name })));
        setPlayers(allPlayers);
      }
    } catch (err) {
      console.error(err);
    }
    setShowAssign(true);
  }

  async function assignProgram() {
    setAssigning(true);
    try {
      await fetch(`/api/programs/${id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_ids: selectedPlayers }),
      });
      setShowAssign(false);
      setSelectedPlayers([]);
    } catch (err) {
      console.error(err);
    }
    setAssigning(false);
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><svg className="animate-spin h-10 w-10 text-green-600" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>;
  }

  const schedule = program?.schedule || {};
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600 mb-1 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{program?.name || 'Program'}</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={loadPlayers}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700">
            Assign to Players
          </button>
          <button className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50">
            Edit
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div><span className="text-xs text-gray-500 block">Duration</span><span className="font-medium">{program?.duration_weeks} weeks</span></div>
        <div><span className="text-xs text-gray-500 block">Phase</span><span className="font-medium capitalize">{program?.phase}</span></div>
        <div><span className="text-xs text-gray-500 block">Difficulty</span><span className="font-medium capitalize">{program?.difficulty}</span></div>
        <div><span className="text-xs text-gray-500 block">Assigned</span><span className="font-medium">{program?.assigned_players?.length || 0} players</span></div>
      </div>

      {/* Assigned Players */}
      {program?.assigned_players?.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-3">Assigned Players</h3>
          <div className="flex flex-wrap gap-2">
            {program.assigned_players.map(p => (
              <span key={p.id} className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">{p.name}</span>
            ))}
          </div>
        </div>
      )}

      {/* Schedule */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Weekly Schedule</h2>
        {DAYS.map(day => {
          const dayData = schedule[day];
          if (!dayData?.active) return (
            <div key={day} className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between border border-gray-200">
              <span className="text-sm text-gray-400">{day}</span>
              <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">Rest</span>
            </div>
          );
          return (
            <div key={day} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{day}: {dayData.name || 'Workout'}</h3>
                <span className="text-xs text-gray-500">{dayData.exercises?.length || 0} exercises</span>
              </div>
              <div className="space-y-2">
                {dayData.exercises?.map((ex, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <span className="text-sm font-medium text-gray-700">{ex.name}</span>
                      {ex.muscle_groups && (
                        <div className="flex gap-1 mt-0.5">
                          {ex.muscle_groups.map(mg => (
                            <span key={mg} className="text-xs bg-green-50 text-green-600 px-1.5 rounded">{mg}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">{ex.sets}x{ex.reps} | Rest {ex.rest}s</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Assign Modal */}
      {showAssign && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[70vh] flex flex-col">
            <h3 className="font-bold text-gray-900 mb-3">Assign to Players</h3>
            <div className="flex-1 overflow-y-auto space-y-2">
              {players.map(p => (
                <button key={p.id}
                  onClick={() => setSelectedPlayers(prev =>
                    prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id]
                  )}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${
                    selectedPlayers.includes(p.id) ? 'bg-green-50 border-2 border-green-500' : 'bg-gray-50 border-2 border-transparent'
                  }`}>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedPlayers.includes(p.id) ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
                  }`}>
                    {selectedPlayers.includes(p.id) && '✓'}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-gray-500">{p.team_name}</div>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowAssign(false)} className="flex-1 py-2 bg-gray-100 rounded-lg font-medium">Cancel</button>
              <button onClick={assignProgram} disabled={selectedPlayers.length === 0 || assigning}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg font-medium disabled:opacity-50">
                {assigning ? 'Assigning...' : `Assign (${selectedPlayers.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
