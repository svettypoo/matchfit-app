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
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-900 text-sm">{exercise.name}</h3>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${diffColors[exercise.difficulty] || diffColors.medium}`}>
          {exercise.difficulty || 'medium'}
        </span>
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
