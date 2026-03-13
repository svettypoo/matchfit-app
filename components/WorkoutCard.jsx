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
  const dayName = workout.mf_program_days?.name || 'Workout';
  const programName = workout.mf_program_days?.mf_programs?.name || '';
  const exercises = workout.mf_program_days?.mf_program_exercises || [];
  const exerciseCount = exercises.length;
  const categories = [...new Set(exercises.map(e => e.mf_exercises?.category).filter(Boolean))];
  const hasPartner = exercises.some(e => e.mf_exercises?.exercise_type === 'partner' || e.mf_exercises?.exercise_type === 'group');

  if (isCompleted) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-800">{dayName}</h3>
            <p className="text-xs text-green-600">Completed! +{workout.xp_earned || 50} XP</p>
          </div>
        </div>
        <div className="flex gap-4 text-sm text-gray-600">
          <span>{workout.duration_minutes || '?'} min</span>
          <span>{Math.round(workout.completion_pct || 0)}%</span>
          {workout.rpe_reported && <span>RPE: {workout.rpe_reported}/10</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-green-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-lg truncate">{dayName}</h3>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {programName && <span className="truncate">{programName}</span>}
            <span>{exerciseCount} exercises</span>
          </div>
        </div>
      </div>

      <div className="mb-3 space-y-1">
        {exercises.slice(0, 4).map((pe, i) => {
          const ex = pe.mf_exercises;
          if (!ex) return null;
          return (
            <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
              <span className="truncate">{ex.name}</span>
              <span className="text-gray-400 ml-auto shrink-0">
                {ex.is_timed ? `${pe.duration_sec || ex.default_duration_sec}s` : `${pe.sets || ex.default_sets}x${pe.reps || ex.default_reps}`}
                {(pe.weight_kg || ex.default_weight_kg) ? ` @ ${pe.weight_kg || ex.default_weight_kg}kg` : ''}
              </span>
            </div>
          );
        })}
        {exerciseCount > 4 && <div className="text-xs text-gray-400">+{exerciseCount - 4} more</div>}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {categories.slice(0, 3).map(cat => (
          <span key={cat} className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${{ strength: 'bg-red-100 text-red-700', speed: 'bg-blue-100 text-blue-700', agility: 'bg-purple-100 text-purple-700', ball_work: 'bg-green-100 text-green-700', flexibility: 'bg-pink-100 text-pink-700', core: 'bg-amber-100 text-amber-700', plyometrics: 'bg-orange-100 text-orange-700', recovery: 'bg-teal-100 text-teal-700' }[cat] || 'bg-gray-100 text-gray-600'}`}>{cat.replace('_', ' ')}</span>
        ))}
        {hasPartner && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-100 text-indigo-700">Partner needed</span>}
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
