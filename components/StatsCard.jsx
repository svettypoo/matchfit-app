'use client';

export default function StatsCard({ icon, label, value, suffix = '', trend, color = 'green' }) {
  const colorMap = {
    green: 'bg-green-50 border-green-200 text-green-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  };

  return (
    <div className={`rounded-xl border p-4 ${colorMap[color] || colorMap.green}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{typeof icon === 'string' ? <span dangerouslySetInnerHTML={{ __html: icon }} /> : icon}</span>
        <span className="text-xs font-medium opacity-70">{label}</span>
      </div>
      <div className="flex items-end gap-1">
        <span className="text-2xl font-bold">{value}{suffix}</span>
        {trend !== undefined && trend !== null && (
          <span className={`text-xs font-medium ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-500' : 'text-gray-400'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
    </div>
  );
}
