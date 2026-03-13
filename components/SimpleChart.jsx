'use client';

export function BarChart({ data, labels, color = 'bg-green-500', height = 120 }) {
  const max = Math.max(...data, 1);

  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((val, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] text-gray-500 font-medium">{val}</span>
          <div
            className={`w-full rounded-t ${color} transition-all duration-300`}
            style={{ height: `${(val / max) * 100}%`, minHeight: val > 0 ? 4 : 0 }}
          />
          {labels && (
            <span className="text-[10px] text-gray-400">{labels[i]}</span>
          )}
        </div>
      ))}
    </div>
  );
}

export function LineChart({ data, labels, color = '#22c55e', height = 100, width = '100%' }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const padding = 10;

  const points = data.map((val, i) => {
    const x = padding + (i / Math.max(data.length - 1, 1)) * (100 - 2 * padding);
    const y = 100 - padding - ((val - min) / range) * (100 - 2 * padding);
    return `${x},${y}`;
  });

  return (
    <div style={{ width, height }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        <polyline
          points={points.join(' ')}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {data.map((val, i) => {
          const x = padding + (i / Math.max(data.length - 1, 1)) * (100 - 2 * padding);
          const y = 100 - padding - ((val - min) / range) * (100 - 2 * padding);
          return (
            <circle key={i} cx={x} cy={y} r="2.5" fill={color} />
          );
        })}
      </svg>
      {labels && (
        <div className="flex justify-between mt-1">
          {labels.map((l, i) => (
            <span key={i} className="text-[10px] text-gray-400">{l}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export function CircularProgress({ value, max = 100, size = 80, color = '#22c55e', label }) {
  const pct = Math.min(value / max, 1);
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="6" />
        <circle
          cx="40" cy="40" r={radius}
          fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 40 40)"
          className="transition-all duration-500"
        />
        <text x="40" y="40" textAnchor="middle" dominantBaseline="central"
          className="text-lg font-bold" fill="#1f2937" fontSize="16">
          {Math.round(pct * 100)}%
        </text>
      </svg>
      {label && <span className="text-xs text-gray-500 mt-1">{label}</span>}
    </div>
  );
}

// Default export wrapper — accepts { data: [{label, value}], type: 'bar'|'line', color, maxValue }
export default function SimpleChart({ data = [], type = 'bar', color = '#22c55e', maxValue }) {
  const values = data.map(d => d.value);
  const labels = data.map(d => d.label);

  if (type === 'line') {
    return <LineChart data={values} labels={labels} color={color} />;
  }

  // Bar chart — use inline color style instead of Tailwind class
  const max = maxValue || Math.max(...values, 1);
  return (
    <div className="flex items-end gap-1" style={{ height: 120 }}>
      {values.map((val, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] text-gray-500 font-medium">{Math.round(val)}</span>
          <div
            className="w-full rounded-t transition-all duration-300"
            style={{
              height: `${(val / max) * 100}%`,
              minHeight: val > 0 ? 4 : 0,
              backgroundColor: color,
            }}
          />
          <span className="text-[10px] text-gray-400">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}
