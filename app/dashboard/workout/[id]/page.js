'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ConfettiEffect from '../../../../components/ConfettiEffect';

const RPE_LABELS = ['Rest', 'Very Light', 'Light', 'Moderate', 'Somewhat Hard', 'Hard', 'Harder', 'Very Hard', 'Max Effort', 'Absolute Max'];

export default function WorkoutExecutionPage() {
  const router = useRouter();
  const { id } = useParams();
  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [expandedExercise, setExpandedExercise] = useState(0);
  const [setLogs, setSetLogs] = useState({});
  const [restTimer, setRestTimer] = useState(0);
  const [rpe, setRpe] = useState(6);
  const [completed, setCompleted] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [newBadges, setNewBadges] = useState([]);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [skipTarget, setSkipTarget] = useState(null);
  const [skipReason, setSkipReason] = useState('');
  const [showInstructions, setShowInstructions] = useState(null);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef(null);
  const restRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/workouts/${id}`);
        if (res.ok) {
          const data = await res.json();
          setWorkout(data);

          const exercises = data.mf_program_days?.mf_program_exercises || [];
          const logs = {};
          exercises.forEach((pe, i) => {
            const ex = pe.mf_exercises;
            const existingLog = data.exercise_logs?.find(l => l.exercise_id === ex?.id);
            const numSets = pe.sets || ex?.default_sets || 3;
            const defaultReps = pe.reps || ex?.default_reps || 10;
            const defaultWeight = pe.weight_kg || ex?.default_weight_kg || '';

            if (existingLog && !existingLog.skipped) {
              const repsArr = Array.isArray(existingLog.completed_reps) ? existingLog.completed_reps : [];
              const weightArr = Array.isArray(existingLog.weight_used) ? existingLog.weight_used : [];
              logs[i] = Array(numSets).fill(null).map((_, si) => ({
                done: true,
                reps: repsArr[si] || defaultReps,
                weight: weightArr[si] || defaultWeight || '',
                duration: existingLog.duration_sec || '',
              }));
            } else {
              logs[i] = Array(numSets).fill(null).map(() => ({
                done: false,
                reps: defaultReps,
                weight: defaultWeight || '',
                duration: ex?.default_duration_sec || '',
              }));
            }
          });
          setSetLogs(logs);

          if (data.status === 'completed') {
            setCompleted(true);
            setXpEarned(data.xp_earned || 0);
          }
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();

    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => {
      clearInterval(timerRef.current);
      clearInterval(restRef.current);
    };
  }, [id]);

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }

  const exercises = workout?.mf_program_days?.mf_program_exercises || [];

  function toggleSet(exIdx, setIdx) {
    setSetLogs(prev => {
      const updated = { ...prev };
      updated[exIdx] = [...updated[exIdx]];
      updated[exIdx][setIdx] = { ...updated[exIdx][setIdx], done: !updated[exIdx][setIdx].done };
      return updated;
    });
    const ex = exercises[exIdx];
    const restSec = ex?.rest_sec || ex?.mf_exercises?.default_rest_sec || 60;
    if (!setLogs[exIdx]?.[setIdx]?.done) {
      startRestTimer(restSec);
    }
  }

  function updateSetField(exIdx, setIdx, field, value) {
    setSetLogs(prev => {
      const updated = { ...prev };
      updated[exIdx] = [...updated[exIdx]];
      updated[exIdx][setIdx] = { ...updated[exIdx][setIdx], [field]: value };
      return updated;
    });
  }

  function addSet(exIdx) {
    setSetLogs(prev => {
      const updated = { ...prev };
      const lastSet = updated[exIdx]?.[updated[exIdx].length - 1];
      updated[exIdx] = [...updated[exIdx], {
        done: false,
        reps: lastSet?.reps || 10,
        weight: lastSet?.weight || '',
        duration: lastSet?.duration || '',
      }];
      return updated;
    });
  }

  function removeSet(exIdx) {
    setSetLogs(prev => {
      const updated = { ...prev };
      if (updated[exIdx]?.length > 1) {
        updated[exIdx] = updated[exIdx].slice(0, -1);
      }
      return updated;
    });
  }

  function startRestTimer(seconds) {
    setRestTimer(seconds);
    clearInterval(restRef.current);
    restRef.current = setInterval(() => {
      setRestTimer(prev => {
        if (prev <= 1) { clearInterval(restRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  function skipExercise() {
    setShowSkipModal(false);
    if (skipTarget !== null) {
      setSetLogs(prev => {
        const updated = { ...prev };
        updated[skipTarget] = updated[skipTarget]?.map(s => ({ ...s, done: false, skipped: true }));
        return updated;
      });
      const nextIdx = exercises.findIndex((_, i) => i > skipTarget && !setLogs[i]?.every(s => s.done || s.skipped));
      if (nextIdx >= 0) setExpandedExercise(nextIdx);
    }
    setSkipTarget(null);
    setSkipReason('');
  }

  async function completeWorkout() {
    if (saving) return;
    setSaving(true);
    clearInterval(timerRef.current);

    try {
      for (let i = 0; i < exercises.length; i++) {
        const pe = exercises[i];
        const ex = pe.mf_exercises;
        if (!ex) continue;

        const sets = setLogs[i] || [];
        const isSkipped = sets.every(s => s.skipped);
        const completedSets = sets.filter(s => s.done).length;
        const completedReps = sets.map(s => parseInt(s.reps) || 0);
        const weightUsed = sets.map(s => parseFloat(s.weight) || null);
        const hasWeight = weightUsed.some(w => w != null);

        await fetch(`/api/workouts/${id}/log`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exercise_id: ex.id,
            completed_sets: completedSets,
            completed_reps: completedReps,
            weight_used: hasWeight ? weightUsed : null,
            duration_sec: ex.is_timed ? (parseInt(sets[0]?.duration) || ex.default_duration_sec) : null,
            skipped: isSkipped,
            skip_reason: isSkipped ? (skipReason || 'Skipped') : null,
          }),
        });
      }

      const totalSets = Object.values(setLogs).flat().length;
      const doneSets = Object.values(setLogs).flat().filter(s => s.done).length;
      const completionPct = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0;

      const res = await fetch(`/api/workouts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          completion_pct: completionPct,
          rpe_reported: rpe,
          duration_minutes: Math.ceil(elapsed / 60),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setXpEarned(data.xp_earned || 50);
        setNewBadges(data.new_badges || []);
      }
    } catch (err) {
      console.error(err);
    }
    setCompleted(true);
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-green-600" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4 relative overflow-hidden">
        <ConfettiEffect />
        <div className="text-center animate-bounce-in relative z-10 w-full max-w-sm">
          <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Workout Complete!</h1>
          <p className="text-gray-500 mb-6">Duration: {formatTime(elapsed)}</p>
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
            <div className="text-5xl font-bold text-green-600 mb-1">+{xpEarned}</div>
            <div className="text-sm text-gray-500 mb-3">XP Earned</div>
            {newBadges.length > 0 && (
              <div className="border-t pt-3 mt-3">
                <div className="text-sm font-medium text-gray-700 mb-2">New Badges Earned!</div>
                {newBadges.map((b, i) => (
                  <div key={i} className="inline-block bg-yellow-50 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium mx-1">{b.name}</div>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <button onClick={() => router.push('/dashboard')} className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700">Back to Dashboard</button>
            <button onClick={() => router.push('/dashboard/progress')} className="w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200">View Progress</button>
          </div>
        </div>
      </div>
    );
  }

  const programName = workout?.mf_program_days?.mf_programs?.name || '';
  const dayName = workout?.mf_program_days?.name || 'Workout';
  const allDone = exercises.length > 0 && exercises.every((_, i) => setLogs[i]?.every(s => s.done || s.skipped));

  return (
    <div className="min-h-screen bg-gray-50 pb-44">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="min-w-0 flex-1">
          <h1 className="font-bold text-gray-900 truncate text-sm">{dayName}</h1>
          <p className="text-xs text-gray-500 truncate">{programName}</p>
        </div>
        <div className="flex items-center gap-3 ml-3">
          <span className="font-mono text-lg text-green-600 font-bold tabular-nums">{formatTime(elapsed)}</span>
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      {/* Rest Timer */}
      {restTimer > 0 && (
        <div className="bg-blue-600 text-white px-4 py-3 text-center">
          <div className="text-xs font-medium opacity-80">REST TIMER</div>
          <div className="text-3xl font-bold font-mono tabular-nums">{formatTime(restTimer)}</div>
          <button onClick={() => { clearInterval(restRef.current); setRestTimer(0); }}
            className="mt-1 text-xs underline opacity-80 hover:opacity-100">Skip Rest</button>
        </div>
      )}

      {/* Progress bar */}
      <div className="bg-white px-4 py-2 border-b">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>{exercises.filter((_, i) => setLogs[i]?.every(s => s.done || s.skipped)).length} / {exercises.length} exercises</span>
          <span>{Math.round((exercises.filter((_, i) => setLogs[i]?.every(s => s.done || s.skipped)).length / Math.max(exercises.length, 1)) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-green-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(exercises.filter((_, i) => setLogs[i]?.every(s => s.done || s.skipped)).length / Math.max(exercises.length, 1)) * 100}%` }} />
        </div>
      </div>

      <div className="p-4 space-y-3">
        {exercises.map((pe, i) => {
          const ex = pe.mf_exercises;
          if (!ex) return null;
          const sets = setLogs[i] || [];
          const allSetsDone = sets.every(s => s.done || s.skipped);
          const isExpanded = expandedExercise === i;
          const hasWeight = ex.default_weight_kg || pe.weight_kg;
          const isTimedEx = ex.is_timed;

          return (
            <div key={i} className={`bg-white rounded-xl shadow-sm overflow-hidden border ${allSetsDone ? 'border-green-300 bg-green-50/30' : 'border-gray-100'}`}>
              <button
                onClick={() => setExpandedExercise(isExpanded ? -1 : i)}
                className="w-full px-4 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${allSetsDone ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {allSetsDone ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    ) : i + 1}
                  </div>
                  <div className="text-left min-w-0">
                    <div className="font-semibold text-gray-900 text-sm truncate">{ex.name}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1.5 flex-wrap">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${{ strength: 'bg-red-100 text-red-700', speed: 'bg-blue-100 text-blue-700', agility: 'bg-purple-100 text-purple-700', ball_work: 'bg-green-100 text-green-700', flexibility: 'bg-pink-100 text-pink-700', core: 'bg-amber-100 text-amber-700', plyometrics: 'bg-orange-100 text-orange-700', recovery: 'bg-teal-100 text-teal-700' }[ex.category] || 'bg-gray-100 text-gray-600'}`}>{ex.category?.replace('_', ' ')}</span>
                      {ex.exercise_type !== 'independent' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-700">{ex.exercise_type}</span>
                      )}
                      <span>{isTimedEx ? `${sets.length}x ${pe.duration_sec || ex.default_duration_sec || '?'}s` : `${sets.length}x${pe.reps || ex.default_reps || '?'}`}{hasWeight ? ` @ ${pe.weight_kg || ex.default_weight_kg}kg` : ''}</span>
                    </div>
                  </div>
                </div>
                <svg className={`w-5 h-5 text-gray-400 transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                  {/* Instructions */}
                  {(ex.instructions || ex.tips || ex.description) && (
                    <div>
                      <button onClick={() => setShowInstructions(showInstructions === i ? null : i)}
                        className="text-xs text-green-600 font-medium flex items-center gap-1 hover:text-green-700">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" /></svg>
                        {showInstructions === i ? 'Hide Instructions' : 'View Instructions'}
                      </button>
                      {showInstructions === i && (
                        <div className="mt-2 bg-green-50 rounded-lg p-3 text-sm space-y-2 border border-green-200">
                          {ex.description && <p className="text-gray-700 text-xs">{ex.description}</p>}
                          {ex.instructions && (
                            <div>
                              <div className="font-medium text-gray-800 text-xs mb-1">Steps:</div>
                              <div className="text-gray-600 whitespace-pre-line text-xs">{ex.instructions}</div>
                            </div>
                          )}
                          {ex.tips && (
                            <div className="bg-yellow-50 rounded p-2 border border-yellow-200">
                              <div className="font-medium text-yellow-800 text-xs">Tips:</div>
                              <div className="text-yellow-700 text-xs">{ex.tips}</div>
                            </div>
                          )}
                          {ex.primary_muscles?.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              <span className="text-xs text-gray-500">Muscles:</span>
                              {ex.primary_muscles.map(m => (
                                <span key={m} className="px-1.5 py-0.5 bg-red-50 text-red-600 rounded text-[10px]">{m}</span>
                              ))}
                              {ex.secondary_muscles?.map(m => (
                                <span key={m} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px]">{m}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Set Header */}
                  <div className="flex items-center gap-3 text-xs text-gray-400 font-medium px-1">
                    <span className="w-7"></span>
                    <span className="w-7 text-center">SET</span>
                    {isTimedEx ? (
                      <span className="flex-1 text-center">DURATION (s)</span>
                    ) : (
                      <>
                        <span className="flex-1 text-center">REPS</span>
                        {(hasWeight || sets.some(s => s.weight)) && <span className="flex-1 text-center">KG</span>}
                      </>
                    )}
                  </div>

                  {/* Set Logging */}
                  <div className="space-y-2">
                    {sets.map((set, si) => (
                      <div key={si} className={`flex items-center gap-3 rounded-lg p-2 ${set.done ? 'bg-green-50' : set.skipped ? 'bg-gray-100 opacity-50' : 'bg-gray-50'}`}>
                        <button
                          onClick={() => toggleSet(i, si)}
                          className={`w-7 h-7 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${set.done ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-green-400'}`}
                        >
                          {set.done && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                        </button>
                        <span className="text-xs text-gray-500 w-7 shrink-0 font-medium text-center">{si + 1}</span>

                        {isTimedEx ? (
                          <input type="number" value={set.duration} onChange={e => updateSetField(i, si, 'duration', e.target.value)}
                            className="flex-1 text-center text-sm py-1.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" placeholder="sec" />
                        ) : (
                          <>
                            <input type="number" value={set.reps} onChange={e => updateSetField(i, si, 'reps', e.target.value)}
                              className="flex-1 text-center text-sm py-1.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" placeholder="Reps" />
                            {(hasWeight || sets.some(s => s.weight)) && (
                              <input type="number" step="0.5" value={set.weight} onChange={e => updateSetField(i, si, 'weight', e.target.value)}
                                className="flex-1 text-center text-sm py-1.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" placeholder="kg" />
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add/Remove/Skip */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <button onClick={() => addSet(i)} className="text-xs text-green-600 font-medium hover:text-green-700 flex items-center gap-0.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                        Add Set
                      </button>
                      {sets.length > 1 && (
                        <button onClick={() => removeSet(i)} className="text-xs text-gray-400 font-medium hover:text-gray-600 flex items-center gap-0.5">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" /></svg>
                          Remove
                        </button>
                      )}
                    </div>
                    <button onClick={() => { setSkipTarget(i); setShowSkipModal(true); }}
                      className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-0.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061A1.125 1.125 0 0 1 3 16.811V8.69ZM12.75 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061a1.125 1.125 0 0 1-1.683-.977V8.69Z" /></svg>
                      Skip
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 space-y-3 z-30">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-700">Perceived Exertion (RPE)</span>
            <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded">{rpe}/10 - {RPE_LABELS[rpe - 1]}</span>
          </div>
          <input type="range" min="1" max="10" value={rpe} onChange={e => setRpe(parseInt(e.target.value))} className="w-full accent-green-600 h-2" />
        </div>
        <button onClick={completeWorkout} disabled={saving}
          className={`w-full py-3.5 font-semibold rounded-xl transition-all text-lg ${allDone ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20' : 'bg-green-600/80 text-white/90'} disabled:opacity-50`}>
          {saving ? 'Saving...' : 'Complete Workout'}
        </button>
      </div>

      {/* Skip Modal */}
      {showSkipModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-gray-900 mb-3">Skip Exercise?</h3>
            <p className="text-sm text-gray-500 mb-3">Why are you skipping {exercises[skipTarget]?.mf_exercises?.name}?</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {['Injury', 'No equipment', 'Too tired', 'Time constraint'].map(reason => (
                <button key={reason} onClick={() => setSkipReason(reason)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium ${skipReason === reason ? 'bg-red-100 text-red-700 ring-1 ring-red-300' : 'bg-gray-100 text-gray-600'}`}>{reason}</button>
              ))}
            </div>
            <textarea value={skipReason} onChange={e => setSkipReason(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg resize-none h-16 mb-4 text-sm" placeholder="Or type your reason..." />
            <div className="flex gap-3">
              <button onClick={() => { setShowSkipModal(false); setSkipTarget(null); }} className="flex-1 py-2 bg-gray-100 rounded-lg font-medium text-sm">Cancel</button>
              <button onClick={skipExercise} className="flex-1 py-2 bg-red-500 text-white rounded-lg font-medium text-sm">Skip</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
