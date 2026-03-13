'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ConfettiEffect from '../../../../components/ConfettiEffect';

const RPE_FACES = ['&#128564;', '&#128578;', '&#128515;', '&#128556;', '&#128548;', '&#128553;', '&#128555;', '&#128561;', '&#129327;', '&#129396;'];

export default function WorkoutExecutionPage() {
  const router = useRouter();
  const { id } = useParams();
  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [expandedExercise, setExpandedExercise] = useState(0);
  const [setLogs, setSetLogs] = useState({});
  const [restTimer, setRestTimer] = useState(0);
  const [rpe, setRpe] = useState(5);
  const [completed, setCompleted] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [skipReason, setSkipReason] = useState('');
  const [showSkipModal, setShowSkipModal] = useState(false);
  const timerRef = useRef(null);
  const restRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/workouts/${id}`);
        if (res.ok) {
          const data = await res.json();
          setWorkout(data);
          const logs = {};
          data.exercises?.forEach((ex, i) => {
            logs[i] = Array(ex.sets || 3).fill(null).map(() => ({ done: false, reps: ex.reps || 10, weight: '' }));
          });
          setSetLogs(logs);
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

  function toggleSet(exIdx, setIdx) {
    setSetLogs(prev => {
      const updated = { ...prev };
      updated[exIdx] = [...updated[exIdx]];
      updated[exIdx][setIdx] = { ...updated[exIdx][setIdx], done: !updated[exIdx][setIdx].done };
      return updated;
    });
    // Start rest timer when completing a set
    const ex = workout.exercises[exIdx];
    if (!setLogs[exIdx]?.[setIdx]?.done && ex.rest_seconds) {
      startRestTimer(ex.rest_seconds);
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
    if (currentExercise < (workout?.exercises?.length || 0) - 1) {
      setCurrentExercise(c => c + 1);
      setExpandedExercise(currentExercise + 1);
    }
  }

  async function completeWorkout() {
    clearInterval(timerRef.current);
    const user = JSON.parse(localStorage.getItem('mf_user') || '{}');
    try {
      const res = await fetch(`/api/workouts/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: user.id, rpe, duration: elapsed, set_logs: setLogs }),
      });
      if (res.ok) {
        const data = await res.json();
        setXpEarned(data.xp_earned || 50);
      }
    } catch (err) {
      console.error(err);
    }
    setCompleted(true);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin text-4xl">&#9917;</div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4 relative overflow-hidden">
        <ConfettiEffect />
        <div className="text-center animate-bounce-in relative z-10">
          <div className="text-7xl mb-4">&#127881;</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Workout Complete!</h1>
          <p className="text-gray-500 mb-6">Duration: {formatTime(elapsed)}</p>

          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 inline-block">
            <div className="text-4xl mb-2">+{xpEarned} XP</div>
            <div className="text-sm text-gray-500">Experience earned</div>
          </div>

          <div className="space-y-3">
            <button onClick={() => router.push('/dashboard')}
              className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg">
              Back to Dashboard
            </button>
            <button onClick={() => router.push('/dashboard/history')}
              className="w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-lg">
              View History
            </button>
          </div>
        </div>
      </div>
    );
  }

  const exercises = workout?.exercises || [];
  const allDone = exercises.every((_, i) => setLogs[i]?.every(s => s.done));

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <h1 className="font-bold text-gray-900 truncate">{workout?.name || 'Workout'}</h1>
        <div className="flex items-center gap-4">
          <span className="font-mono text-lg text-green-600 font-bold">{formatTime(elapsed)}</span>
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Rest Timer */}
      {restTimer > 0 && (
        <div className="bg-blue-600 text-white px-4 py-3 text-center">
          <div className="text-sm font-medium">Rest Timer</div>
          <div className="text-3xl font-bold font-mono">{formatTime(restTimer)}</div>
        </div>
      )}

      <div className="p-4 space-y-3">
        {exercises.map((ex, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <button
              onClick={() => setExpandedExercise(expandedExercise === i ? -1 : i)}
              className="w-full px-4 py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  setLogs[i]?.every(s => s.done) ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {setLogs[i]?.every(s => s.done) ? '✓' : i + 1}
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900 text-sm">{ex.name}</div>
                  <div className="text-xs text-gray-500">{ex.sets || 3} sets x {ex.reps || 10} reps</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {ex.muscle_groups?.map(mg => (
                  <span key={mg} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{mg}</span>
                ))}
                <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedExercise === i ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {expandedExercise === i && (
              <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                {/* Video Placeholder */}
                <div className="bg-green-50 rounded-lg h-40 flex items-center justify-center border border-green-200">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                    <span className="text-sm text-green-600 font-medium">Demo Video</span>
                  </div>
                </div>

                {/* Set Logging */}
                <div className="space-y-2">
                  {setLogs[i]?.map((set, si) => (
                    <div key={si} className="flex items-center gap-3 bg-gray-50 rounded-lg p-2">
                      <button
                        onClick={() => toggleSet(i, si)}
                        className={`w-7 h-7 rounded-md border-2 flex items-center justify-center transition-all ${
                          set.done ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
                        }`}
                      >
                        {set.done && '✓'}
                      </button>
                      <span className="text-sm text-gray-500 w-12">Set {si + 1}</span>
                      <input
                        type="number"
                        value={set.reps}
                        onChange={e => updateSetField(i, si, 'reps', e.target.value)}
                        className="w-16 text-center text-sm py-1 border rounded-md"
                        placeholder="Reps"
                      />
                      <span className="text-xs text-gray-400">reps</span>
                      <input
                        type="number"
                        value={set.weight}
                        onChange={e => updateSetField(i, si, 'weight', e.target.value)}
                        className="w-16 text-center text-sm py-1 border rounded-md"
                        placeholder="kg"
                      />
                      <span className="text-xs text-gray-400">kg</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => { setShowSkipModal(true); setCurrentExercise(i); }}
                  className="text-sm text-gray-400 hover:text-gray-600"
                >
                  Skip exercise
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom bar with RPE and Complete */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">How hard was it? (RPE)</span>
            <span className="text-lg" dangerouslySetInnerHTML={{ __html: RPE_FACES[rpe - 1] }} />
          </div>
          <input type="range" min="1" max="10" value={rpe} onChange={e => setRpe(parseInt(e.target.value))}
            className="w-full accent-green-600" />
          <div className="flex justify-between text-xs text-gray-400">
            <span>Easy</span><span>Max Effort</span>
          </div>
        </div>
        <button onClick={completeWorkout}
          className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all">
          Complete Workout
        </button>
      </div>

      {/* Skip Modal */}
      {showSkipModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-gray-900 mb-3">Skip Exercise?</h3>
            <textarea value={skipReason} onChange={e => setSkipReason(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg resize-none h-20 mb-4"
              placeholder="Reason (optional)..." />
            <div className="flex gap-3">
              <button onClick={() => setShowSkipModal(false)} className="flex-1 py-2 bg-gray-100 rounded-lg font-medium">Cancel</button>
              <button onClick={skipExercise} className="flex-1 py-2 bg-red-500 text-white rounded-lg font-medium">Skip</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
