'use client';

import { useState, useEffect } from 'react';
import StatsCard from '../../../components/StatsCard';
import SimpleChart from '../../../components/SimpleChart';

export default function CoachDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [injuryRisk, setInjuryRisk] = useState(null);
  const [riskLoading, setRiskLoading] = useState(false);
  const [showProgression, setShowProgression] = useState(null);
  const [progressionLoading, setProgressionLoading] = useState(false);
  const [progressionPlayer, setProgressionPlayer] = useState(null);

  useEffect(() => {
    async function load() {
      const user = JSON.parse(localStorage.getItem('mf_user') || '{}');
      try {
        const res = await fetch(`/api/coach/dashboard?coach_id=${user.id}`);
        if (res.ok) setData(await res.json());
        // Load injury risk in background
        setRiskLoading(true);
        const riskRes = await fetch(`/api/ai/injury-risk?coach_id=${user.id}`);
        if (riskRes.ok) setInjuryRisk(await riskRes.json());
        setRiskLoading(false);
      } catch (err) {
        console.error(err);
        setRiskLoading(false);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function loadProgression(playerId, playerName) {
    setProgressionLoading(true);
    setProgressionPlayer(playerName);
    setShowProgression(null);
    try {
      const res = await fetch('/api/ai/auto-progression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: playerId }),
      });
      if (res.ok) setShowProgression(await res.json());
    } catch (err) {
      console.error(err);
    }
    setProgressionLoading(false);
  }

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
            <div className="text-center py-6">
              <svg className="w-8 h-8 mx-auto mb-2 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-green-600 font-medium text-sm">All players on track!</p>
              <p className="text-gray-400 text-xs mt-1">Great job! Your team is performing well.</p>
              <p className="text-gray-400 text-xs">Check wellness data for proactive insights.</p>
            </div>
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

      {/* AI Injury Risk Alerts */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI Injury Risk Monitor</h3>
            <p className="text-xs text-gray-400">Analyzes RPE trends, workload spikes, skip patterns, wellness data</p>
          </div>
        </div>

        {riskLoading ? (
          <div className="flex items-center gap-2 py-4 justify-center">
            <svg className="w-5 h-5 animate-spin text-purple-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            <span className="text-sm text-gray-500">Analyzing team health data...</span>
          </div>
        ) : injuryRisk?.alerts?.length === 0 ? (
          <div className="text-center py-4">
            <svg className="w-8 h-8 mx-auto mb-2 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-green-600 font-medium text-sm">{injuryRisk?.summary || 'All clear!'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-600 mb-2">{injuryRisk?.summary}</p>
            {(injuryRisk?.alerts || []).map((a, i) => (
              <div key={i} className={`rounded-lg p-3 border ${a.risk_level === 'high' ? 'bg-red-50 border-red-200' : a.risk_level === 'medium' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${a.risk_level === 'high' ? 'bg-red-500' : a.risk_level === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                    <span className="text-sm font-medium text-gray-900">{a.player_name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium uppercase ${a.risk_level === 'high' ? 'bg-red-100 text-red-700' : a.risk_level === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                      {a.risk_level} risk
                    </span>
                  </div>
                  <button onClick={() => loadProgression(a.player_id, a.player_name)}
                    className="text-[10px] px-2 py-1 bg-purple-100 text-purple-600 rounded-full hover:bg-purple-200">
                    AI Progression
                  </button>
                </div>
                <div className="space-y-1">
                  {a.alerts.map((alert, j) => (
                    <div key={j} className="flex items-start gap-1.5 text-xs text-gray-600">
                      <span className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${alert.severity === 'high' ? 'bg-red-400' : alert.severity === 'medium' ? 'bg-amber-400' : 'bg-gray-400'}`} />
                      {alert.message}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Progression Modal */}
      {(progressionLoading || showProgression) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setShowProgression(null); setProgressionPlayer(null); }}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">AI Auto-Progression: {progressionPlayer}</h2>
                  <p className="text-sm text-gray-500">Exercise-by-exercise progression recommendations</p>
                </div>
              </div>

              {progressionLoading ? (
                <div className="text-center py-12">
                  <svg className="w-10 h-10 animate-spin text-purple-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  <p className="text-gray-600">Analyzing training data...</p>
                </div>
              ) : showProgression ? (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className={`rounded-xl p-4 ${showProgression.readiness === 'ready_to_progress' ? 'bg-green-50 border border-green-200' : showProgression.readiness === 'fatigued' ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-200'}`}>
                    <p className="text-sm font-medium">{showProgression.summary}</p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span>Sessions: {showProgression.total_sessions}</span>
                      {showProgression.overall_rpe && <span>Avg RPE: {showProgression.overall_rpe}</span>}
                      <span>Skip rate: {showProgression.skip_rate}%</span>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {(showProgression.recommendations || []).map((r, i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{r.exercise_name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          r.recommendation === 'increase_weight' ? 'bg-green-100 text-green-700' :
                          r.recommendation === 'increase_reps' ? 'bg-blue-100 text-blue-700' :
                          r.recommendation === 'deload' ? 'bg-red-100 text-red-700' :
                          r.recommendation === 'review' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {r.recommendation.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{r.reasoning}</p>
                      <div className="flex gap-3 mt-1 text-[10px] text-gray-400">
                        {r.current_weight && <span>Current: {r.current_weight}kg</span>}
                        {r.suggested_weight && r.suggested_weight !== r.current_weight && (
                          <span className="font-medium text-green-600">Suggested: {r.suggested_weight}kg</span>
                        )}
                        <span>Sessions: {r.sessions}</span>
                        {r.latest_rpe && <span>RPE: {r.latest_rpe}</span>}
                      </div>
                    </div>
                  ))}

                  {showProgression.recommendations?.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">{showProgression.summary}</p>
                  )}

                  <button onClick={() => { setShowProgression(null); setProgressionPlayer(null); }}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200">Close</button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
