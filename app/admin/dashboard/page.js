'use client';

import { useState, useEffect } from 'react';
import StatsCard from '../../../components/StatsCard';
import SimpleChart from '../../../components/SimpleChart';

export default function CoachDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const user = JSON.parse(localStorage.getItem('mf_user') || '{}');
      try {
        const res = await fetch(`/api/coach/dashboard?coach_id=${user.id}`);
        if (res.ok) setData(await res.json());
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin text-4xl">&#9917;</div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const topPerformers = data?.top_performers || [];
  const atRisk = data?.at_risk || [];
  const recentCompletions = data?.recent_completions || [];
  const weeklyCompliance = data?.weekly_compliance || [];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {JSON.parse(localStorage.getItem('mf_user') || '{}')?.name?.split(' ')[0] || 'Coach'}!
        </h1>
        <p className="text-gray-500 text-sm">Here's your team overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon="&#128101;" label="Active Players" value={stats.active_players || 0} />
        <StatsCard icon="&#128200;" label="Avg Compliance" value={stats.avg_compliance || 0} suffix="%" />
        <StatsCard icon="&#128293;" label="Avg Streak" value={stats.avg_streak || 0} suffix="d" />
        <StatsCard icon="&#129657;" label="Injured" value={stats.injured_players || 0} />
      </div>

      {/* Weekly Compliance Chart */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-3">Team Compliance (Last 7 Days)</h3>
        <SimpleChart
          data={weeklyCompliance.length ? weeklyCompliance : [
            { label: 'Mon', value: 85 }, { label: 'Tue', value: 78 },
            { label: 'Wed', value: 90 }, { label: 'Thu', value: 82 },
            { label: 'Fri', value: 75 }, { label: 'Sat', value: 60 },
            { label: 'Sun', value: 40 },
          ]}
          type="bar"
          color="#22c55e"
          maxValue={100}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Top Performers */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-3">Top Performers</h3>
          {topPerformers.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No data yet</p>
          ) : (
            <div className="space-y-2">
              {topPerformers.slice(0, 5).map((p, i) => (
                <div key={p.id || i} className="flex items-center gap-3 py-2">
                  <span className="text-sm font-bold text-gray-400 w-5">#{i + 1}</span>
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm">
                    {p.name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{p.name}</div>
                    <div className="text-xs text-gray-500">{p.xp} XP | {p.streak}d streak</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* At Risk */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-3">
            <span className="text-amber-500">&#9888;</span> Needs Attention
          </h3>
          {atRisk.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">All players on track!</p>
          ) : (
            <div className="space-y-2">
              {atRisk.map((p, i) => (
                <div key={p.id || i} className="flex items-center gap-3 py-2 px-3 bg-red-50 rounded-lg">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold text-sm">
                    {p.name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{p.name}</div>
                    <div className="text-xs text-red-600">{p.reason}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Completions */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-3">Recent Workout Completions</h3>
        {recentCompletions.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">No recent completions</p>
        ) : (
          <div className="space-y-2">
            {recentCompletions.slice(0, 10).map((c, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm text-gray-900">{c.player_name}</span>
                  <span className="text-sm text-gray-400">completed</span>
                  <span className="text-sm text-gray-700 font-medium">{c.workout_name}</span>
                </div>
                <span className="text-xs text-gray-400">{c.time_ago || 'recently'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
