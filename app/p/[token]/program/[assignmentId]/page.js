'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function PublicProgramView() {
  const { token, assignmentId } = useParams();
  const router = useRouter();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedDays, setExpandedDays] = useState({});

  useEffect(() => {
    fetch(`/api/public/${token}/program/${assignmentId}`)
      .then(res => {
        if (!res.ok) throw new Error('Program not found');
        return res.json();
      })
      .then(data => {
        setProgram(data);
        setLoading(false);
        // Auto-expand first incomplete day
        if (data.days) {
          const firstIncomplete = data.days.find(d => !d.completed);
          if (firstIncomplete) {
            setExpandedDays({ [firstIncomplete.id]: true });
          }
        }
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [token, assignmentId]);

  const toggleDay = (dayId) => {
    setExpandedDays(prev => ({ ...prev, [dayId]: !prev[dayId] }));
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
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Program Not Found</h2>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  const { info, days, progress } = program;
  const completedDays = progress?.completed_days || 0;
  const totalDays = days?.length || 0;
  const pct = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.push(`/p/${token}`)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to Profile
      </button>

      {/* Program Header */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">{info.name}</h1>
        {info.description && (
          <p className="text-sm text-gray-500 mt-1">{info.description}</p>
        )}
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          {info.duration_weeks && (
            <span className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              {info.duration_weeks} weeks
            </span>
          )}
          <span className="flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            {completedDays} / {totalDays} days
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-600">Progress</span>
            <span className="text-xs font-bold text-emerald-600">{pct}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Program Days */}
      <div className="space-y-2">
        {days?.map((day, index) => (
          <div key={day.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Day Header */}
            <button
              onClick={() => toggleDay(day.id)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  day.completed
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {day.completed ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{day.title || `Day ${index + 1}`}</h3>
                  <p className="text-xs text-gray-500">{day.exercises?.length || 0} exercises</p>
                </div>
              </div>
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className={`transform transition-transform ${expandedDays[day.id] ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Day Exercises (Expanded) */}
            {expandedDays[day.id] && (
              <div className="border-t border-gray-100 px-4 pb-4">
                <div className="space-y-2 mt-3">
                  {day.exercises?.map((exercise, ei) => (
                    <div key={ei} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                      {exercise.image_url ? (
                        <img
                          src={exercise.image_url}
                          alt={exercise.name}
                          className="w-10 h-10 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                            <path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14" />
                            <path d="M2 20h20" />
                          </svg>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{exercise.name}</p>
                        <p className="text-xs text-gray-500">
                          {exercise.sets && `${exercise.sets} sets`}
                          {exercise.reps && ` x ${exercise.reps} reps`}
                          {exercise.duration && ` - ${exercise.duration}s`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Start Workout Button */}
                {!day.completed && (
                  <button
                    onClick={() => router.push(`/p/${token}/workout/${day.id}`)}
                    className="w-full mt-4 bg-emerald-600 text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    Start Workout
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
