'use client';
import { useRouter } from 'next/navigation';

export default function WorkoutCard({ workout }) {
  const router = useRouter();

  if (!workout) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
        <svg className="w-10 h-10 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
        <h3 className="font-bold text-gray-800">No Workout Today</h3>
        <p className="text-sm text-gray-500 mt-1">Contact your coach for a program assignment.</p>
      </div>
    );
  }

  const isCompleted = workout.status === 'completed';
  const isRest = workout.name?.toLowerCase().includes('rest');

  if (isRest) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 text-center">
        <svg className="w-10 h-10 text-blue-400 mx-auto" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>
        <h3 className="font-bold text-gray-800">Rest Day</h3>
        <p className="text-sm text-gray-500 mt-1">Recovery is part of training. Stretch, hydrate, and rest up!</p>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center"><svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg></div>
          <div>
            <h3 className="font-bold text-gray-800">{workout.name}</h3>
            <p className="text-xs text-green-600">Completed! +{workout.xp_earned || 50} XP</p>
          </div>
        </div>
        <div className="flex gap-4 text-sm text-gray-600">
          <span>{workout.duration_minutes || '?'} min</span>
          <span>{Math.round(workout.completion_pct || 0)}% completed</span>
          {workout.rpe_reported && <span>RPE: {workout.rpe_reported}/10</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-green-200 rounded-2xl p-6 animate-pulse-glow">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center"><svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg></div>
        <div>
          <h3 className="font-bold text-gray-800 text-lg">{workout.name}</h3>
          <p className="text-xs text-gray-500">{workout.exercise_count || '?'} exercises</p>
        </div>
      </div>
      <button
        onClick={() => router.push(`/dashboard/workout/${workout.id}`)}
        className="w-full py-3 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
      >
        Start Workout
      </button>
    </div>
  );
}
