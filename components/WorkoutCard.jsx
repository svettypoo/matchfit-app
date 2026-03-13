'use client';
import { useRouter } from 'next/navigation';

export default function WorkoutCard({ workout }) {
  const router = useRouter();

  if (!workout) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
        <div className="text-4xl mb-2">{'\u{1F3C8}'}</div>
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
        <div className="text-4xl mb-2">{'\u{1F634}'}</div>
        <h3 className="font-bold text-gray-800">Rest Day</h3>
        <p className="text-sm text-gray-500 mt-1">Recovery is part of training. Stretch, hydrate, and rest up!</p>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-2xl">{'\u{2705}'}</div>
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
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-2xl">{'\u{1F4AA}'}</div>
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
