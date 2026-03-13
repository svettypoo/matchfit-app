'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function NewProgramPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [basics, setBasics] = useState({
    name: '', duration_weeks: 4, phase: 'general', difficulty: 'medium',
  });
  const [schedule, setSchedule] = useState(
    DAYS.reduce((acc, d) => ({ ...acc, [d]: { active: false, name: '', exercises: [] } }), {})
  );
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [activeDay, setActiveDay] = useState(null);
  const [showExerciseSearch, setShowExerciseSearch] = useState(false);

  async function searchExercises(q) {
    setExerciseSearch(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const res = await fetch(`/api/exercises?search=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.exercises || []);
      }
    } catch (err) {
      console.error(err);
    }
  }

  function addExerciseToDay(day, exercise) {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        exercises: [...prev[day].exercises, { ...exercise, sets: 3, reps: 10, duration: '', rest: 60, rpe_target: 7, notes: '' }],
      },
    }));
    setShowExerciseSearch(false);
    setExerciseSearch('');
  }

  function removeExercise(day, idx) {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        exercises: prev[day].exercises.filter((_, i) => i !== idx),
      },
    }));
  }

  function updateExercise(day, idx, field, value) {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        exercises: prev[day].exercises.map((ex, i) => i === idx ? { ...ex, [field]: value } : ex),
      },
    }));
  }

  function moveExercise(day, idx, direction) {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= schedule[day].exercises.length) return;
    setSchedule(prev => {
      const exercises = [...prev[day].exercises];
      [exercises[idx], exercises[newIdx]] = [exercises[newIdx], exercises[idx]];
      return { ...prev, [day]: { ...prev[day], exercises } };
    });
  }

  async function saveProgram() {
    setSaving(true);
    const user = JSON.parse(localStorage.getItem('mf_user') || '{}');
    try {
      const res = await fetch('/api/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...basics, schedule, coach_id: user.id }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/admin/programs/${data.id}`);
      }
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600 mb-1 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Create Program</h1>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step === s ? 'bg-green-600 text-white' : step > s ? 'bg-green-200 text-green-700' : 'bg-gray-200 text-gray-400'
            }`}>{s}</div>
          ))}
        </div>
      </div>

      {/* Step 1: Basics */}
      {step === 1 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Program Basics</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Program Name</label>
            <input type="text" value={basics.name} onChange={e => setBasics(b => ({ ...b, name: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="e.g. Pre-Season Strength Phase" required />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (weeks)</label>
              <input type="number" value={basics.duration_weeks} onChange={e => setBasics(b => ({ ...b, duration_weeks: parseInt(e.target.value) || 1 }))}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none" min="1" max="52" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phase</label>
              <select value={basics.phase} onChange={e => setBasics(b => ({ ...b, phase: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none">
                <option value="general">General</option>
                <option value="pre-season">Pre-Season</option>
                <option value="in-season">In-Season</option>
                <option value="off-season">Off-Season</option>
                <option value="recovery">Recovery</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <select value={basics.difficulty} onChange={e => setBasics(b => ({ ...b, difficulty: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
          <button onClick={() => setStep(2)} disabled={!basics.name}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">
            Next: Build Schedule
          </button>
        </div>
      )}

      {/* Step 2: Schedule Builder */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Weekly Schedule</h2>
          <div className="grid lg:grid-cols-7 gap-3">
            {DAYS.map(day => (
              <div key={day} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-3 py-2 bg-gray-50 border-b flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{day.slice(0, 3)}</span>
                  <button
                    onClick={() => setSchedule(prev => ({
                      ...prev,
                      [day]: { ...prev[day], active: !prev[day].active },
                    }))}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center text-xs ${
                      schedule[day].active ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
                    }`}>
                    {schedule[day].active && '✓'}
                  </button>
                </div>
                {schedule[day].active && (
                  <div className="p-2 space-y-2">
                    <input
                      type="text"
                      value={schedule[day].name}
                      onChange={e => setSchedule(prev => ({ ...prev, [day]: { ...prev[day], name: e.target.value } }))}
                      className="w-full text-xs px-2 py-1 border rounded"
                      placeholder="Workout name"
                    />
                    {schedule[day].exercises.map((ex, i) => (
                      <div key={i} className="bg-gray-50 rounded p-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-medium truncate">{ex.name}</span>
                          <button onClick={() => removeExercise(day, i)} className="text-red-400 hover:text-red-600 ml-1">x</button>
                        </div>
                        <div className="flex gap-1 mt-1">
                          <input type="number" value={ex.sets} onChange={e => updateExercise(day, i, 'sets', parseInt(e.target.value))}
                            className="w-10 text-center border rounded py-0.5" placeholder="S" />
                          <span className="text-gray-400">x</span>
                          <input type="number" value={ex.reps} onChange={e => updateExercise(day, i, 'reps', parseInt(e.target.value))}
                            className="w-10 text-center border rounded py-0.5" placeholder="R" />
                        </div>
                        <div className="flex gap-1 mt-1">
                          <button onClick={() => moveExercise(day, i, -1)} className="text-gray-400 hover:text-gray-600 text-xs">&#9650;</button>
                          <button onClick={() => moveExercise(day, i, 1)} className="text-gray-400 hover:text-gray-600 text-xs">&#9660;</button>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => { setActiveDay(day); setShowExerciseSearch(true); }}
                      className="w-full text-xs text-green-600 font-medium py-1 border border-dashed border-green-300 rounded hover:bg-green-50">
                      + Add Exercise
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="px-6 py-3 bg-gray-100 rounded-lg font-medium">Back</button>
            <button onClick={() => setStep(3)} className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">
              Next: Review
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Review Program</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div><span className="text-sm text-gray-500">Name:</span> <span className="font-medium">{basics.name}</span></div>
              <div><span className="text-sm text-gray-500">Duration:</span> <span className="font-medium">{basics.duration_weeks} weeks</span></div>
              <div><span className="text-sm text-gray-500">Phase:</span> <span className="font-medium capitalize">{basics.phase}</span></div>
              <div><span className="text-sm text-gray-500">Difficulty:</span> <span className="font-medium capitalize">{basics.difficulty}</span></div>
            </div>
            <h3 className="font-medium text-gray-700 mb-2">Weekly Overview</h3>
            <div className="space-y-2">
              {DAYS.filter(d => schedule[d].active).map(day => (
                <div key={day} className="bg-gray-50 rounded-lg p-3">
                  <div className="font-medium text-sm text-gray-900">{day}: {schedule[day].name || 'Unnamed'}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {schedule[day].exercises.length} exercises: {schedule[day].exercises.map(e => e.name).join(', ') || 'None'}
                  </div>
                </div>
              ))}
              {DAYS.filter(d => !schedule[d].active).length > 0 && (
                <div className="text-xs text-gray-400">
                  Rest days: {DAYS.filter(d => !schedule[d].active).map(d => d.slice(0, 3)).join(', ')}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="px-6 py-3 bg-gray-100 rounded-lg font-medium">Back</button>
            <button onClick={saveProgram} disabled={saving}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Program'}
            </button>
          </div>
        </div>
      )}

      {/* Exercise Search Modal */}
      {showExerciseSearch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[70vh] flex flex-col">
            <h3 className="font-bold text-gray-900 mb-3">Add Exercise — {activeDay}</h3>
            <input
              type="text" value={exerciseSearch} onChange={e => searchExercises(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none mb-3"
              placeholder="Search exercises..." autoFocus
            />
            <div className="flex-1 overflow-y-auto space-y-2">
              {searchResults.map(ex => (
                <button key={ex.id} onClick={() => addExerciseToDay(activeDay, ex)}
                  className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-green-50 transition-all">
                  <div className="font-medium text-sm text-gray-900">{ex.name}</div>
                  <div className="text-xs text-gray-500">{ex.category} | {ex.muscle_groups?.join(', ')}</div>
                </button>
              ))}
              {exerciseSearch.length >= 2 && searchResults.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No exercises found</p>
              )}
            </div>
            <button onClick={() => setShowExerciseSearch(false)}
              className="mt-3 w-full py-2 bg-gray-100 rounded-lg font-medium">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
