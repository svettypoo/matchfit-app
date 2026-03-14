'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ProgramDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null); // { dayIdx, exIdx }
  const [showAssign, setShowAssign] = useState(false);
  const [players, setPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [assigning, setAssigning] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [assignResult, setAssignResult] = useState(null);

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

  const days = program?.mf_program_days || [];

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
    setAssignResult(null);
    try {
      const res = await fetch(`/api/programs/${id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_ids: selectedPlayers, start_date: startDate }),
      });
      const data = await res.json();
      if (res.ok) {
        setAssignResult({ success: true, data });
        setTimeout(() => { setShowAssign(false); setSelectedPlayers([]); setAssignResult(null); }, 2000);
      } else {
        setAssignResult({ success: false, error: data.error });
      }
    } catch (err) {
      setAssignResult({ success: false, error: err.message });
    }
    setAssigning(false);
  }

  async function saveExerciseEdit(dayIdx, exIdx, updates) {
    setSaving(true);
    const day = days[dayIdx];
    const pe = day.mf_program_exercises[exIdx];
    try {
      const res = await fetch(`/api/programs/${id}/exercises/${pe.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        // Update local state
        const updated = { ...program };
        Object.assign(updated.mf_program_days[dayIdx].mf_program_exercises[exIdx], updates);
        setProgram(updated);
        setEditingExercise(null);
      }
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  }

  async function removeExercise(dayIdx, exIdx) {
    const pe = days[dayIdx].mf_program_exercises[exIdx];
    try {
      await fetch(`/api/programs/${id}/exercises/${pe.id}`, { method: 'DELETE' });
      const updated = { ...program };
      updated.mf_program_days[dayIdx].mf_program_exercises.splice(exIdx, 1);
      setProgram(updated);
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><svg className="animate-spin h-10 w-10 text-green-600" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600 mb-1 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{program?.name || 'Program'}</h1>
          {program?.description && <p className="text-sm text-gray-500 mt-1">{program.description}</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={loadPlayers}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700">
            Assign to Players
          </button>
          <button onClick={() => setEditing(!editing)}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${editing ? 'bg-amber-500 text-white' : 'border border-gray-300 hover:bg-gray-50'}`}>
            {editing ? 'Done Editing' : 'Edit Exercises'}
          </button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div><span className="text-xs text-gray-500 block">Duration</span><span className="font-medium">{program?.duration_weeks || 4} weeks</span></div>
        <div><span className="text-xs text-gray-500 block">Phase</span><span className="font-medium capitalize">{program?.phase_type || program?.phase || '--'}</span></div>
        <div><span className="text-xs text-gray-500 block">Difficulty</span><span className="font-medium capitalize">{program?.difficulty || '--'}</span></div>
        <div><span className="text-xs text-gray-500 block">Days/Week</span><span className="font-medium">{days.length}</span></div>
        <div><span className="text-xs text-gray-500 block">Total Exercises</span><span className="font-medium">{days.reduce((s, d) => s + (d.mf_program_exercises?.length || 0), 0)}</span></div>
      </div>

      {/* Equipment Summary */}
      {(() => {
        const allEquipment = new Set();
        days.forEach(d => (d.mf_program_exercises || []).forEach(pe => {
          (pe.mf_exercises?.equipment || []).forEach(eq => allEquipment.add(eq));
        }));
        if (allEquipment.size === 0) return null;
        return (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Required Equipment</h3>
            <div className="flex flex-wrap gap-1.5">
              {[...allEquipment].sort().map(eq => (
                <span key={eq} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-100">{eq}</span>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Training Days */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Training Schedule</h2>

        {days.length === 0 ? (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
            <p className="text-gray-400">No training days configured yet.</p>
            <p className="text-sm text-gray-400 mt-1">Generate a plan from the Assessments page or create days manually.</p>
          </div>
        ) : (
          days.map((day, dayIdx) => {
            const exercises = day.mf_program_exercises || [];
            return (
              <div key={day.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Day Header */}
                <div className="px-4 py-3 bg-green-50 border-b border-green-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{day.name || `Day ${day.sort_order + 1}`}</h3>
                    <span className="text-xs text-gray-500">
                      {day.day_of_week !== null && day.day_of_week !== undefined ? DAY_NAMES[day.day_of_week] : ''}
                      {day.focus ? ` — ${day.focus}` : ''}
                    </span>
                  </div>
                  <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">{exercises.length} exercises</span>
                </div>

                {/* Exercise List */}
                <div className="divide-y divide-gray-50">
                  {exercises.map((pe, exIdx) => {
                    const ex = pe.mf_exercises || {};
                    const isEditing = editingExercise?.dayIdx === dayIdx && editingExercise?.exIdx === exIdx;

                    return (
                      <div key={pe.id} className={`px-4 py-3 ${isEditing ? 'bg-amber-50' : 'hover:bg-gray-50'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xs font-bold text-gray-400 w-5">{exIdx + 1}</span>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">{ex.name || 'Unknown Exercise'}</div>
                              <div className="flex gap-1 mt-0.5 flex-wrap">
                                {ex.category && <span className="text-xs bg-blue-50 text-blue-600 px-1.5 rounded">{ex.category}</span>}
                                {ex.difficulty && <span className="text-xs bg-purple-50 text-purple-600 px-1.5 rounded">{ex.difficulty}</span>}
                                {(ex.muscle_groups || []).map(mg => (
                                  <span key={mg} className="text-xs bg-green-50 text-green-600 px-1.5 rounded">{mg}</span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {!isEditing && (
                              <span className="text-sm text-gray-600">
                                {pe.sets}×{pe.reps}{pe.weight_kg ? ` @ ${pe.weight_kg}kg` : ''} | Rest {pe.rest_sec || 60}s
                              </span>
                            )}
                            {editing && !isEditing && (
                              <div className="flex gap-1">
                                <button onClick={() => setEditingExercise({ dayIdx, exIdx })}
                                  className="p-1 text-gray-400 hover:text-blue-600">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                                </button>
                                <button onClick={() => removeExercise(dayIdx, exIdx)}
                                  className="p-1 text-gray-400 hover:text-red-600">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Inline Edit Form */}
                        {isEditing && (
                          <ExerciseEditForm
                            exercise={pe}
                            onSave={(updates) => saveExerciseEdit(dayIdx, exIdx, updates)}
                            onCancel={() => setEditingExercise(null)}
                            saving={saving}
                          />
                        )}

                        {pe.notes && !isEditing && (
                          <p className="text-xs text-gray-400 mt-1 ml-8 italic">{pe.notes}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Assign Modal */}
      {showAssign && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[80vh] flex flex-col">
            <h3 className="font-bold text-gray-900 mb-1">Assign Program</h3>
            <p className="text-sm text-gray-500 mb-4">Select players and start date</p>

            {/* Start Date */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" />
            </div>

            {/* Player List */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {players.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No players found. Add players to your teams first.</p>
              ) : players.map(p => (
                <button key={p.id}
                  onClick={() => setSelectedPlayers(prev =>
                    prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id]
                  )}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${
                    selectedPlayers.includes(p.id) ? 'bg-green-50 border-2 border-green-500' : 'bg-gray-50 border-2 border-transparent'
                  }`}>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center text-xs ${
                    selectedPlayers.includes(p.id) ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
                  }`}>
                    {selectedPlayers.includes(p.id) && '✓'}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-gray-500">{p.team_name} {p.position ? `— ${p.position}` : ''}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Result Message */}
            {assignResult && (
              <div className={`mb-3 px-3 py-2 rounded-lg text-sm ${assignResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {assignResult.success
                  ? `Assigned to ${assignResult.data.assignments?.length} player(s) with ${assignResult.data.assignments?.[0]?.workouts_generated || 0} workouts scheduled`
                  : `Error: ${assignResult.error}`}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => { setShowAssign(false); setAssignResult(null); }} className="flex-1 py-2 bg-gray-100 rounded-lg font-medium">Cancel</button>
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

function ExerciseEditForm({ exercise, onSave, onCancel, saving }) {
  const [sets, setSets] = useState(exercise.sets || 3);
  const [reps, setReps] = useState(exercise.reps || 10);
  const [weight, setWeight] = useState(exercise.weight_kg || '');
  const [rest, setRest] = useState(exercise.rest_sec || 60);
  const [rpe, setRpe] = useState(exercise.rpe_target || 7);
  const [notes, setNotes] = useState(exercise.notes || '');

  return (
    <div className="mt-3 ml-8 p-3 bg-white rounded-lg border border-amber-200 space-y-3">
      <div className="grid grid-cols-5 gap-2">
        <div>
          <label className="text-xs text-gray-500">Sets</label>
          <input type="number" value={sets} onChange={e => setSets(+e.target.value)} min={1} max={10}
            className="w-full px-2 py-1 border rounded text-sm text-center" />
        </div>
        <div>
          <label className="text-xs text-gray-500">Reps</label>
          <input type="number" value={reps} onChange={e => setReps(+e.target.value)} min={1} max={50}
            className="w-full px-2 py-1 border rounded text-sm text-center" />
        </div>
        <div>
          <label className="text-xs text-gray-500">Weight (kg)</label>
          <input type="number" value={weight} onChange={e => setWeight(e.target.value ? +e.target.value : '')} min={0}
            className="w-full px-2 py-1 border rounded text-sm text-center" />
        </div>
        <div>
          <label className="text-xs text-gray-500">Rest (s)</label>
          <input type="number" value={rest} onChange={e => setRest(+e.target.value)} min={10} max={300} step={10}
            className="w-full px-2 py-1 border rounded text-sm text-center" />
        </div>
        <div>
          <label className="text-xs text-gray-500">RPE</label>
          <input type="number" value={rpe} onChange={e => setRpe(+e.target.value)} min={1} max={10}
            className="w-full px-2 py-1 border rounded text-sm text-center" />
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-500">Notes</label>
        <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g., Focus on form"
          className="w-full px-2 py-1 border rounded text-sm" />
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-3 py-1 text-sm text-gray-600 rounded hover:bg-gray-100">Cancel</button>
        <button onClick={() => onSave({ sets, reps, weight_kg: weight || null, rest_sec: rest, rpe_target: rpe, notes: notes || null })}
          disabled={saving} className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
