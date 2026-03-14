'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function PublicWorkoutExecution() {
  const { token, workoutId } = useParams();
  const router = useRouter();
  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exerciseLogs, setExerciseLogs] = useState({});
  const [completed, setCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [workoutDbId, setWorkoutDbId] = useState(null);

  useEffect(() => {
    // Fetch workout details (program day exercises)
    fetch(`/api/public/${token}/program/${workoutId}?day_only=true`)
      .then(res => {
        if (!res.ok) throw new Error('Workout not found');
        return res.json();
      })
      .then(data => {
        setWorkout(data);
        setLoading(false);
        // Start the workout
        startWorkout(data.day_id || workoutId);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [token, workoutId]);

  const startWorkout = async (dayId) => {
    try {
      const res = await fetch(`/api/public/${token}/workout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program_day_id: dayId, action: 'start' }),
      });
      if (res.ok) {
        const data = await res.json();
        setWorkoutDbId(data.workout_id);
      }
    } catch (e) {
      console.error('Failed to start workout:', e);
    }
  };

  const exercises = workout?.exercises || [];
  const currentExercise = exercises[currentExerciseIndex];

  const updateLog = (field, delta) => {
    const key = currentExercise.id;
    setExerciseLogs(prev => {
      const current = prev[key] || { sets: currentExercise.sets || 3, reps: currentExercise.reps || 10, weight: 0 };
      const newVal = Math.max(0, (current[field] || 0) + delta);
      return { ...prev, [key]: { ...current, [field]: newVal } };
    });
  };

  const getLog = (field) => {
    if (!currentExercise) return 0;
    const log = exerciseLogs[currentExercise.id];
    if (log && log[field] !== undefined) return log[field];
    if (field === 'sets') return currentExercise.sets || 3;
    if (field === 'reps') return currentExercise.reps || 10;
    return 0;
  };

  const logExercise = async () => {
    if (!currentExercise) return;
    const log = exerciseLogs[currentExercise.id] || {};
    try {
      await fetch(`/api/public/${token}/workout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_day_id: workoutId,
          action: 'log',
          exercise_id: currentExercise.exercise_id || currentExercise.id,
          sets: log.sets || currentExercise.sets || 3,
          reps: log.reps || currentExercise.reps || 10,
          weight: log.weight || 0,
          duration: log.duration || currentExercise.duration || null,
          workout_id: workoutDbId,
        }),
      });
    } catch (e) {
      console.error('Failed to log exercise:', e);
    }
  };

  const handleCompleteExercise = async () => {
    await logExercise();
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
    }
  };

  const handleCompleteWorkout = async () => {
    setSubmitting(true);
    await logExercise();
    try {
      await fetch(`/api/public/${token}/workout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_day_id: workoutId,
          action: 'complete',
          workout_id: workoutDbId,
        }),
      });
      setCompleted(true);
    } catch (e) {
      console.error('Failed to complete workout:', e);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M15 9l-6 6M9 9l6 6" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Workout Not Found</h2>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  // Completion Screen
  if (completed) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Workout Complete!</h1>
        <p className="text-gray-500 mb-2">Great job finishing today&apos;s workout.</p>

        {/* Summary */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mt-6 text-left">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Summary</h3>
          <div className="space-y-2">
            {exercises.map((ex, i) => {
              const log = exerciseLogs[ex.id] || {};
              return (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 truncate">{ex.name}</span>
                  <span className="text-gray-500 shrink-0 ml-2">
                    {log.sets || ex.sets || 3}x{log.reps || ex.reps || 10}
                    {(log.weight || 0) > 0 && ` @ ${log.weight}kg`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <button
            onClick={() => router.push(`/p/${token}`)}
            className="w-full bg-emerald-600 text-white font-semibold py-3 rounded-xl text-sm hover:bg-emerald-700 transition-colors"
          >
            Back to Profile
          </button>
          <button
            onClick={() => router.push(`/p/${token}?create=1`)}
            className="w-full bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl text-sm hover:bg-gray-200 transition-colors"
          >
            Create Free Account
          </button>
        </div>
      </div>
    );
  }

  // Exercise Execution
  const isLast = currentExerciseIndex === exercises.length - 1;

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Progress Indicator */}
      <div className="flex items-center gap-1 mb-6">
        {exercises.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= currentExerciseIndex ? 'bg-emerald-500' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      <p className="text-xs text-gray-500 mb-4 text-center">
        Exercise {currentExerciseIndex + 1} of {exercises.length}
      </p>

      {/* Exercise Card */}
      {currentExercise && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Exercise Image */}
          {currentExercise.image_url ? (
            <div className="aspect-video bg-gray-100 relative">
              <img
                src={currentExercise.image_url}
                alt={currentExercise.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="aspect-video bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.5" opacity="0.5">
                <path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14" />
                <path d="M2 20h20" />
                <path d="M14 12H10" />
              </svg>
            </div>
          )}

          <div className="p-5">
            <h2 className="text-lg font-bold text-gray-900">{currentExercise.name}</h2>
            {currentExercise.description && (
              <p className="text-sm text-gray-500 mt-1">{currentExercise.description}</p>
            )}
            {currentExercise.instructions && (
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">{currentExercise.instructions}</p>
            )}

            {/* Set/Rep/Weight Controls */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              {/* Sets */}
              <div className="text-center">
                <label className="text-xs text-gray-500 font-medium">Sets</label>
                <div className="flex items-center justify-center gap-2 mt-1.5">
                  <button
                    onClick={() => updateLog('sets', -1)}
                    className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    -
                  </button>
                  <span className="text-xl font-bold text-gray-900 w-8 text-center">{getLog('sets')}</span>
                  <button
                    onClick={() => updateLog('sets', 1)}
                    className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 hover:bg-emerald-200 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Reps */}
              <div className="text-center">
                <label className="text-xs text-gray-500 font-medium">Reps</label>
                <div className="flex items-center justify-center gap-2 mt-1.5">
                  <button
                    onClick={() => updateLog('reps', -1)}
                    className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    -
                  </button>
                  <span className="text-xl font-bold text-gray-900 w-8 text-center">{getLog('reps')}</span>
                  <button
                    onClick={() => updateLog('reps', 1)}
                    className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 hover:bg-emerald-200 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Weight */}
              <div className="text-center">
                <label className="text-xs text-gray-500 font-medium">Weight (kg)</label>
                <div className="flex items-center justify-center gap-2 mt-1.5">
                  <button
                    onClick={() => updateLog('weight', -2.5)}
                    className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    -
                  </button>
                  <span className="text-xl font-bold text-gray-900 w-8 text-center">{getLog('weight')}</span>
                  <button
                    onClick={() => updateLog('weight', 2.5)}
                    className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 hover:bg-emerald-200 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-6">
              {isLast ? (
                <button
                  onClick={handleCompleteWorkout}
                  disabled={submitting}
                  className="w-full bg-emerald-600 text-white font-semibold py-3 rounded-xl text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Complete Workout
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleCompleteExercise}
                  className="w-full bg-emerald-600 text-white font-semibold py-3 rounded-xl text-sm hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                >
                  Complete Exercise
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
