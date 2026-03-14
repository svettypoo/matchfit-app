'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SimpleChart from '../../../../components/SimpleChart';
import dynamic from 'next/dynamic';

const LineChart = dynamic(() => import('recharts').then(m => m.LineChart), { ssr: false });
const BarChart = dynamic(() => import('recharts').then(m => m.BarChart), { ssr: false });
const Line = dynamic(() => import('recharts').then(m => m.Line), { ssr: false });
const Bar = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(m => m.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false });
const Legend = dynamic(() => import('recharts').then(m => m.Legend), { ssr: false });

const TABS = ['Overview', 'Plan History', 'Progress', 'Calendar', 'Wellness', 'Program', 'Messages', 'Notes'];

export default function PlayerDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [progressData, setProgressData] = useState(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [planHistory, setPlanHistory] = useState(null);
  const [planHistoryLoading, setPlanHistoryLoading] = useState(false);
  const [expandedPlanDay, setExpandedPlanDay] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/players/${id}`);
        if (res.ok) setPlayer(await res.json());
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  useEffect(() => {
    if (activeTab !== 'Plan History') return;
    async function loadPlanHistory() {
      setPlanHistoryLoading(true);
      try {
        const res = await fetch(`/api/players/${id}/plan-history`);
        if (res.ok) setPlanHistory(await res.json());
      } catch (err) { console.error(err); }
      setPlanHistoryLoading(false);
    }
    loadPlanHistory();
  }, [id, activeTab]);

  useEffect(() => {
    if (activeTab !== 'Progress') return;
    async function loadProgress() {
      setProgressLoading(true);
      try {
        const params = new URLSearchParams({ weeks: '8' });
        if (selectedCategory) params.set('category', selectedCategory);
        if (selectedExercise) params.set('exercise_id', selectedExercise);
        const res = await fetch(`/api/players/${id}/exercise-progress?${params}`);
        if (res.ok) setProgressData(await res.json());
      } catch (err) { console.error(err); }
      setProgressLoading(false);
    }
    loadProgress();
  }, [id, activeTab, selectedExercise, selectedCategory]);

  async function saveNotes() {
    setSaving(true);
    try {
      await fetch(`/api/players/${id}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><svg className="animate-spin h-10 w-10 text-green-600" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>;
  }

  const stats = player?.stats || {};

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Back
      </button>

      {/* Player Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
          {player?.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{player?.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            {player?.positions?.map(p => (
              <span key={p} className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">{p}</span>
            ))}
            <span className="text-sm text-gray-500">{player?.team_name}</span>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          player?.status === 'injured' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {player?.status || 'active'}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
              activeTab === tab ? 'bg-green-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'Overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Level', value: stats.level || 1, icon: <svg className="w-6 h-6 text-yellow-500 mx-auto" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg> },
              { label: 'XP', value: stats.xp || 0, icon: <svg className="w-6 h-6 text-purple-500 mx-auto" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" /></svg> },
              { label: 'Streak', value: `${stats.streak || 0}d`, icon: <svg className="w-6 h-6 text-orange-500 mx-auto" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" /></svg> },
              { label: 'Compliance', value: `${stats.compliance || 0}%`, icon: <svg className="w-6 h-6 text-blue-500 mx-auto" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg> },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
                {s.icon}
                <div className="font-bold text-gray-900 mt-1">{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Badges */}
          {player?.badges?.length > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-3">Badges</h3>
              <div className="flex flex-wrap gap-2">
                {player.badges.map((b, i) => (
                  <div key={i} className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center text-2xl border border-yellow-200">
                    {b.icon || <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .982-3.172M8.25 8.75a4.875 4.875 0 0 1 7.5 0M12 3v1.5" /></svg>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============ PLAN HISTORY TAB ============ */}
      {activeTab === 'Plan History' && (
        <div className="space-y-4">
          {planHistoryLoading ? (
            <div className="text-center py-12 text-gray-400">Loading plan history...</div>
          ) : !planHistory || (planHistory.days || []).length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>
              <p className="text-gray-500">No plan workouts completed yet</p>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: 'Total Workouts', value: planHistory.summary?.total_workouts || 0, color: 'text-green-600' },
                  { label: 'Total Volume', value: planHistory.summary?.total_volume ? `${Math.round(planHistory.summary.total_volume / 1000)}k` : '0', color: 'text-blue-600' },
                  { label: 'Exceeded', value: planHistory.summary?.exceeded || 0, color: 'text-green-600' },
                  { label: 'Met', value: planHistory.summary?.met || 0, color: 'text-gray-600' },
                  { label: 'Below', value: planHistory.summary?.below || 0, color: 'text-amber-600' },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
                    <div className={`font-bold text-2xl ${s.color}`}>{s.value}</div>
                    <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Weekly Chart */}
              {(planHistory.weekly || []).length > 0 && (
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-700 mb-3">Weekly Plan Volume</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={(planHistory.weekly || []).map(w => ({
                      week: new Date(w.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                      volume: Math.round(w.volume / 1000),
                      workouts: w.workouts,
                    }))} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                      <Bar dataKey="volume" fill="#22c55e" radius={[4, 4, 0, 0]} name="Volume (k)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Workout List */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b bg-gray-50">
                  <h3 className="font-semibold text-gray-700">Completed Plan Workouts</h3>
                </div>
                <div className="divide-y max-h-[60vh] overflow-y-auto">
                  {(planHistory.days || []).map(day => {
                    const exercises = day.mf_plan_exercises || [];
                    const completedEx = exercises.filter(e => e.completed).length;
                    const isExpanded = expandedPlanDay === day.id;
                    const ratingBg = day.performance_rating === 'exceeded' ? 'bg-green-100 text-green-700' :
                      day.performance_rating === 'below' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700';

                    return (
                      <div key={day.id}>
                        <button onClick={() => setExpandedPlanDay(isExpanded ? null : day.id)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={`w-3 h-3 rounded-full shrink-0 ${day.performance_rating === 'exceeded' ? 'bg-green-500' : day.performance_rating === 'below' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                            <div className="min-w-0">
                              <div className="font-medium text-gray-900 text-sm truncate">{day.name}</div>
                              <div className="text-xs text-gray-500">
                                {day.completed_at ? new Date(day.completed_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : ''}
                                {' · '}{completedEx}/{exercises.length} exercises
                                {day.plan_name && ` · ${day.plan_name}`}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ratingBg}`}>
                              {day.performance_rating || 'met'}
                            </span>
                            <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="border-t bg-gray-50/50 px-4 py-3">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-gray-200 text-gray-500">
                                  <th className="text-left py-1.5 font-medium">Exercise</th>
                                  <th className="text-center py-1.5 font-medium">Prescribed</th>
                                  <th className="text-center py-1.5 font-medium">Actual</th>
                                  <th className="text-center py-1.5 font-medium">Volume %</th>
                                  <th className="text-center py-1.5 font-medium">RPE</th>
                                </tr>
                              </thead>
                              <tbody>
                                {exercises.map(pe => {
                                  const ex = pe.mf_exercises || {};
                                  const prescribedVol = (pe.sets || 3) * (pe.reps || 10);
                                  const actualReps = Array.isArray(pe.actual_reps) ? pe.actual_reps : [];
                                  const actualVol = actualReps.reduce((s, r) => s + (r || 0), 0);
                                  const volPct = prescribedVol > 0 ? Math.round((actualVol / prescribedVol) * 100) : 0;

                                  return (
                                    <tr key={pe.id} className={`border-b border-gray-100 ${!pe.completed ? 'opacity-40' : ''}`}>
                                      <td className="py-1.5 text-gray-800">
                                        {ex.name || 'Exercise'}
                                        {pe.intensity_change && pe.intensity_change !== 0 && (
                                          <span className={`ml-1 text-[10px] font-medium ${pe.intensity_change > 0 ? 'text-green-600' : 'text-amber-600'}`}>
                                            ({pe.intensity_change > 0 ? '+' : ''}{pe.intensity_change}%)
                                          </span>
                                        )}
                                      </td>
                                      <td className="text-center text-gray-600">{pe.sets}x{pe.reps}{pe.weight_kg ? ` @${pe.weight_kg}kg` : ''}</td>
                                      <td className="text-center text-gray-600">
                                        {pe.completed ? `${pe.actual_sets}x[${actualReps.join(',')}]` : '—'}
                                      </td>
                                      <td className="text-center">
                                        {pe.completed ? (
                                          <span className={`font-medium ${volPct >= 110 ? 'text-green-600' : volPct < 85 ? 'text-amber-600' : 'text-blue-600'}`}>
                                            {volPct}%
                                          </span>
                                        ) : '—'}
                                      </td>
                                      <td className="text-center text-gray-600">{pe.actual_rpe || '—'}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'Progress' && (
        <div className="space-y-4">
          {progressLoading ? (
            <div className="text-center py-12 text-gray-400">Loading progress data...</div>
          ) : !progressData ? (
            <div className="text-center py-12 text-gray-400">No progress data available</div>
          ) : (
            <>
              {/* Overall Weekly Stats */}
              {progressData.overall_progress?.length > 0 && (
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-3">Weekly Overview</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={progressData.overall_progress}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" tickFormatter={w => { const d = new Date(w); return `${d.getMonth()+1}/${d.getDate()}`; }} fontSize={11} />
                        <YAxis fontSize={11} />
                        <Tooltip labelFormatter={w => `Week of ${w}`} />
                        <Legend />
                        <Bar dataKey="workouts" fill="#22c55e" name="Workouts" />
                        <Bar dataKey="total_xp" fill="#a855f7" name="XP" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Volume Trend */}
              {progressData.overall_progress?.length > 0 && (
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-3">Volume Trend</h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={progressData.overall_progress}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" tickFormatter={w => { const d = new Date(w); return `${d.getMonth()+1}/${d.getDate()}`; }} fontSize={11} />
                        <YAxis fontSize={11} />
                        <Tooltip labelFormatter={w => `Week of ${w}`} />
                        <Line type="monotone" dataKey="total_volume" stroke="#3b82f6" strokeWidth={2} name="Total Volume" dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Category Breakdown */}
              {progressData.category_progress?.length > 0 && (
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-3">Category Breakdown</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <button onClick={() => setSelectedCategory('')} className={`px-3 py-1 rounded-full text-xs font-medium ${!selectedCategory ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>All</button>
                    {progressData.categories?.map(cat => (
                      <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${selectedCategory === cat ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{cat.replace('_', ' ')}</button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                    {progressData.category_progress.map(cp => (
                      <div key={cp.category} className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="text-xs text-gray-500 capitalize">{cp.category.replace('_', ' ')}</div>
                        <div className="font-bold text-gray-900">{cp.total_volume.toLocaleString()}</div>
                        <div className="text-xs text-gray-400">{cp.total_sessions} sessions</div>
                      </div>
                    ))}
                  </div>
                  {progressData.category_progress.map(cp => cp.weekly?.length > 1 && (
                    <div key={cp.category} className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 capitalize">{cp.category.replace('_', ' ')} — Weekly Volume</h4>
                      <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={cp.weekly}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="week" tickFormatter={w => { const d = new Date(w); return `${d.getMonth()+1}/${d.getDate()}`; }} fontSize={10} />
                            <YAxis fontSize={10} />
                            <Tooltip />
                            <Bar dataKey="total_volume" fill="#6366f1" name="Volume" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Individual Exercise Progress */}
              {progressData.exercises?.length > 0 && (
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-3">Exercise Progress</h3>
                  <select value={selectedExercise} onChange={e => setSelectedExercise(e.target.value)} className="w-full p-2 border rounded-lg mb-3 text-sm">
                    <option value="">All exercises</option>
                    {progressData.exercises.map(ex => (
                      <option key={ex.id} value={ex.id}>{ex.name} ({ex.category})</option>
                    ))}
                  </select>
                  {progressData.exercise_progress?.map(ep => (
                    <div key={ep.exercise_id} className="mb-6 pb-4 border-b border-gray-100 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-800">{ep.exercise_name}</h4>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs capitalize">{ep.category?.replace('_', ' ')}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        <div className="bg-gray-50 rounded p-2 text-center">
                          <div className="text-xs text-gray-500">Sessions</div>
                          <div className="font-bold text-sm">{ep.summary.total_sessions}</div>
                        </div>
                        <div className="bg-gray-50 rounded p-2 text-center">
                          <div className="text-xs text-gray-500">Current</div>
                          <div className="font-bold text-sm">{ep.summary.latest_weight ? `${ep.summary.latest_weight}kg` : `${ep.summary.latest_reps} reps`}</div>
                        </div>
                        <div className="bg-gray-50 rounded p-2 text-center">
                          <div className="text-xs text-gray-500">Change</div>
                          <div className={`font-bold text-sm ${ep.summary.weight_change > 0 ? 'text-green-600' : ep.summary.weight_change < 0 ? 'text-red-600' : ''}`}>
                            {ep.summary.weight_change != null ? `${ep.summary.weight_change > 0 ? '+' : ''}${ep.summary.weight_change}kg` : '-'}
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded p-2 text-center">
                          <div className="text-xs text-gray-500">Best Vol</div>
                          <div className="font-bold text-sm">{ep.summary.best_volume?.toLocaleString()}</div>
                        </div>
                      </div>
                      {ep.data_points?.length > 1 && (
                        <div className="h-40">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={ep.data_points}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" tickFormatter={d => { const dt = new Date(d); return `${dt.getMonth()+1}/${dt.getDate()}`; }} fontSize={10} />
                              <YAxis fontSize={10} />
                              <Tooltip />
                              {ep.summary.latest_weight && <Line type="monotone" dataKey="max_weight" stroke="#ef4444" strokeWidth={2} name="Weight (kg)" dot={{ r: 2 }} />}
                              <Line type="monotone" dataKey="total_volume" stroke="#3b82f6" strokeWidth={2} name="Volume" dot={{ r: 2 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'Wellness' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-3">Readiness History</h3>
            <SimpleChart
              data={player?.wellness_history || [
                { label: 'Mon', value: 72 }, { label: 'Tue', value: 68 },
                { label: 'Wed', value: 75 }, { label: 'Thu', value: 80 },
                { label: 'Fri', value: 65 }, { label: 'Sat', value: 70 },
                { label: 'Sun', value: 78 },
              ]}
              type="line" color="#22c55e" maxValue={100}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {['Sleep', 'Energy', 'Soreness', 'Mood', 'Stress'].map(metric => (
              <div key={metric} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-2">{metric}</h4>
                <SimpleChart
                  data={[
                    { label: 'M', value: Math.random() * 5 },
                    { label: 'T', value: Math.random() * 5 },
                    { label: 'W', value: Math.random() * 5 },
                    { label: 'T', value: Math.random() * 5 },
                    { label: 'F', value: Math.random() * 5 },
                  ]}
                  type="bar" color="#22c55e" maxValue={5}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'Program' && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-3">Current Program</h3>
          <p className="text-gray-500 text-sm">{player?.program_name || 'No program assigned'}</p>
          {player?.program_exercises && (
            <div className="mt-3 space-y-2">
              {player.program_exercises.map((ex, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-700">{ex.name}</span>
                  <span className="text-sm text-gray-400">{ex.sets}x{ex.reps}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'Messages' && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center py-12">
          <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" /></svg>
          <p className="text-gray-500">Conversation with {player?.name}</p>
          <p className="text-sm text-gray-400">Use the Messages page for full chat</p>
        </div>
      )}

      {activeTab === 'Notes' && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-3">Private Coach Notes</h3>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none resize-none h-48"
            placeholder="Write notes about this player..."
          />
          <button onClick={saveNotes} disabled={saving}
            className="mt-3 px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Notes'}
          </button>
        </div>
      )}

      {activeTab === 'Calendar' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
          <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
          <p className="text-gray-500">Player calendar view</p>
          <p className="text-sm text-gray-400 mt-1">Workout completion history shown here</p>
        </div>
      )}
    </div>
  );
}
