'use client';

const diffColors = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
};

export default function ExerciseCard({ exercise, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all text-left w-full"
    >
      <div className="flex items-start gap-3 mb-2">
        {exercise.image_url ? (
          <img src={exercise.image_url} alt="" className="w-12 h-12 rounded-lg object-cover bg-gray-50 shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
            <span className="text-lg font-bold text-gray-400">{exercise.name?.charAt(0)}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-gray-900 text-sm truncate">{exercise.name}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ml-2 ${diffColors[exercise.difficulty] || diffColors.medium}`}>
              {exercise.difficulty || 'medium'}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium capitalize">
          {exercise.category || 'general'}
        </span>
      </div>
      {exercise.muscle_groups?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {exercise.muscle_groups.map(mg => (
            <span key={mg} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{mg}</span>
          ))}
        </div>
      )}
      {exercise.equipment && (
        <div className="text-xs text-gray-400 mt-2">Equipment: {exercise.equipment}</div>
      )}
    </button>
  );
}
