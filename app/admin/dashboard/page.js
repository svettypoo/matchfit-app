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
        <svg className="w-8 h-8 animate-spin text-green-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
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
        <StatsCard icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>} label="Active Players" value={stats.active_players || 0} />
        <StatsCard icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>} label="Avg Compliance" value={stats.avg_compliance || 0} suffix="%" />
        <StatsCard icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" /></svg>} label="Avg Streak" value={stats.avg_streak || 0} suffix="d" />
        <StatsCard icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>} label="Injured" value={stats.injured_players || 0} />
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
            <svg className="w-5 h-5 inline text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg> Needs Attention
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
