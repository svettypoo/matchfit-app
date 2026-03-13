'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import BottomNav from '../../../components/BottomNav';

// Dynamic import recharts to avoid SSR issues
const RechartsLine = dynamic(() => import('recharts').then(m => {
  const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } = m;
  return function RechartsLineChart({ data, lines, yLabel, height = 220 }) {
    const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip contentStyle={{ fontSize: 12 }} />
          {lines.map((key, i) => (
            <Line key={key} type="monotone" dataKey={key} stroke={colors[i % colors.length]}
              strokeWidth={2} dot={{ r: 3 }} name={key.replace(/_/g, ' ')} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  };
}), { ssr: false, loading: () => <div className="h-[220px] bg-gray-100 rounded animate-pulse" /> });

const RechartsBar = dynamic(() => import('recharts').then(m => {
  const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = m;
  return function RechartsBarChart({ data, dataKey, color = '#22c55e', height = 200 }) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip contentStyle={{ fontSize: 12 }} />
          <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  };
}), { ssr: false, loading: () => <div className="h-[200px] bg-gray-100 rounded animate-pulse" /> });

const TABS = ['Overall', 'Exercises', 'Categories'];

const QUOTES = [
  "Success is no accident. It is hard work, perseverance, learning, studying, sacrifice. - Pele",
  "The more difficult the victory, the greater the happiness in winning. - Pele",
  "You have to fight to reach your dream. You have to sacrifice and work hard for it. - Messi",
  "Talent without working hard is nothing. - Cristiano Ronaldo",
  "The harder you work, the luckier you get. - Gary Player",
  "A champion is someone who does not settle for that day's practice. - Mia Hamm",
  "Work hard in silence, let success be your noise. - Frank Lampard",
];

export default function ProgressPage() {
  const router = useRouter();
  const [tab, setTab] = useState('Overall');
  const [progressData, setProgressData] = useState(null);
  const [exerciseData, setExerciseData] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const user = JSON.parse(localStorage.getItem('mf_user') || '{}');
      if (!user.id) { router.push('/'); return; }

      try {
        const [progressRes, exerciseRes] = await Promise.all([
          fetch(`/api/players/${user.id}/progress`),
          fetch(`/api/players/${user.id}/exercise-progress?weeks=8`),
        ]);

        if (progressRes.ok) setProgressData(await progressRes.json());
        if (exerciseRes.ok) {
          const data = await exerciseRes.json();
          setExerciseData(data);
          if (data.exercises?.length > 0) setSelectedExercise(data.exercises[0].id);
          if (data.categories?.length > 0) setSelectedCategory(data.categories[0]);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-green-600" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
      </div>
    );
  }

  // Overall progress data
  const overallData = exerciseData?.overall_progress?.map((w, i) => ({
    label: `W${i + 1}`,
    workouts: w.workouts,
    volume: Math.round(w.total_volume / 1000), // Convert to thousands
    xp: w.total_xp,
    duration: w.total_duration,
    completion: w.avg_completion,
    rpe: w.avg_rpe,
  })) || [];

  // Compliance from basic progress
  const weeklyWorkouts = progressData?.weekly_workouts || [];
  const compliance = weeklyWorkouts.length > 0
    ? Math.round(weeklyWorkouts.reduce((s, w) => s + w.workouts_completed, 0) / Math.max(weeklyWorkouts.length, 1) * 100 / 5)
    : 0;

  // Exercise-specific data
  const selectedExProgress = exerciseData?.exercise_progress?.find(ep => ep.exercise_id === selectedExercise);
  const exChartData = selectedExProgress?.data_points?.map((dp, i) => ({
    label: new Date(dp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: dp.max_weight || 0,
    reps: dp.reps || 0,
    volume: Math.round(dp.total_volume),
    rpe: dp.rpe || 0,
  })) || [];

  // Category data
  const selectedCatProgress = exerciseData?.category_progress?.find(cp => cp.category === selectedCategory);
  const catChartData = selectedCatProgress?.weekly?.map((w, i) => ({
    label: `W${i + 1}`,
    volume: Math.round(w.total_volume / 100), // Hundreds
    sessions: w.sessions,
    rpe: w.avg_rpe || 0,
  })) || [];

  // XP and stats
  const xp = progressData?.xp || {};
  const prs = progressData?.personal_records || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b px-4 py-3">
        <h1 className="font-bold text-lg text-gray-900">Progress</h1>
      </div>

      {/* Tab Selector */}
      <div className="bg-white border-b px-4 py-2 flex gap-1">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              tab === t ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}>{t}</button>
        ))}
      </div>

      <div className="px-4 pt-4 space-y-4">

        {/* =================== OVERALL TAB =================== */}
        {tab === 'Overall' && (
          <>
            {/* XP Stats Row */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Level', value: xp.level || 1, color: 'text-yellow-600' },
                { label: 'Total XP', value: xp.total?.toLocaleString() || '0', color: 'text-purple-600' },
                { label: 'Streak', value: `${xp.current_streak || 0}d`, color: 'text-orange-600' },
                { label: 'Best', value: `${xp.longest_streak || 0}d`, color: 'text-blue-600' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
                  <div className={`font-bold text-lg ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Overall Compliance Circle */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
              <h3 className="font-semibold text-gray-700 mb-4">Overall Compliance</h3>
              <div className="relative w-32 h-32 mx-auto">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                  <circle cx="60" cy="60" r="54" fill="none" stroke="#22c55e" strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 54}`}
                    strokeDashoffset={`${2 * Math.PI * 54 * (1 - compliance / 100)}`}
                    strokeLinecap="round" className="transition-all duration-1000" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-gray-900">{compliance}%</span>
                </div>
              </div>
            </div>

            {/* Weekly Workouts Chart */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-700 mb-3">Weekly Workouts</h3>
              {overallData.length > 0 ? (
                <RechartsBar data={overallData} dataKey="workouts" color="#22c55e" />
              ) : (
                <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">No workout data yet</div>
              )}
            </div>

            {/* Volume Trend */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-700 mb-1">Training Volume Trend</h3>
              <p className="text-xs text-gray-400 mb-3">Total volume in thousands (weight x reps)</p>
              {overallData.length > 0 ? (
                <RechartsLine data={overallData} lines={['volume']} />
              ) : (
                <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">No data</div>
              )}
            </div>

            {/* XP and Duration */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-700 mb-3">XP & Duration per Week</h3>
              {overallData.length > 0 ? (
                <RechartsLine data={overallData} lines={['xp', 'duration']} />
              ) : (
                <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">No data</div>
              )}
            </div>

            {/* Personal Records */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-700 mb-3">Personal Records</h3>
              {prs.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">Complete workouts to set personal records</p>
              ) : (
                <div className="space-y-2">
                  {prs.map((pr, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <div className="font-medium text-sm text-gray-900">{pr.mf_exercises?.name || pr.exercise}</div>
                        <div className="text-xs text-gray-400">{new Date(pr.achieved_at || pr.date).toLocaleDateString()}</div>
                      </div>
                      <div className="font-bold text-green-600">{pr.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Motivational Quote */}
            <div className="bg-green-50 rounded-xl p-4 border border-green-200 text-center">
              <svg className="w-6 h-6 text-green-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" /></svg>
              <p className="text-sm text-green-800 italic">"{quote}"</p>
            </div>
          </>
        )}

        {/* =================== EXERCISES TAB =================== */}
        {tab === 'Exercises' && (
          <>
            {/* Exercise Selector */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-700 mb-2">Select Exercise</h3>
              <select
                value={selectedExercise || ''}
                onChange={e => setSelectedExercise(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                {(exerciseData?.exercises || []).map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.name} ({ex.category?.replace('_', ' ')})</option>
                ))}
              </select>
            </div>

            {selectedExProgress ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
                    <div className="font-bold text-gray-900">{selectedExProgress.summary.total_sessions}</div>
                    <div className="text-[10px] text-gray-500">Sessions</div>
                  </div>
                  {selectedExProgress.summary.latest_weight && (
                    <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
                      <div className="font-bold text-gray-900">{selectedExProgress.summary.latest_weight}kg</div>
                      <div className="text-[10px] text-gray-500">Current</div>
                    </div>
                  )}
                  {selectedExProgress.summary.weight_change != null && (
                    <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
                      <div className={`font-bold ${selectedExProgress.summary.weight_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedExProgress.summary.weight_change >= 0 ? '+' : ''}{selectedExProgress.summary.weight_change}kg
                      </div>
                      <div className="text-[10px] text-gray-500">Change</div>
                    </div>
                  )}
                  <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
                    <div className="font-bold text-gray-900">{selectedExProgress.summary.best_volume}</div>
                    <div className="text-[10px] text-gray-500">Best Volume</div>
                  </div>
                </div>

                {/* Weight Progression */}
                {exChartData.some(d => d.weight > 0) && (
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-700 mb-1">Weight Progression (kg)</h3>
                    <p className="text-xs text-gray-400 mb-3">Max weight used per session</p>
                    <RechartsLine data={exChartData} lines={['weight']} />
                  </div>
                )}

                {/* Reps Trend */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-700 mb-3">Reps per Set (avg)</h3>
                  <RechartsBar data={exChartData} dataKey="reps" color="#3b82f6" />
                </div>

                {/* Volume Trend */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-700 mb-3">Total Volume (weight x reps)</h3>
                  <RechartsLine data={exChartData} lines={['volume']} />
                </div>

                {/* RPE Trend */}
                {exChartData.some(d => d.rpe > 0) && (
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-700 mb-3">RPE Trend</h3>
                    <RechartsLine data={exChartData} lines={['rpe']} />
                  </div>
                )}

                {/* Raw Data Table */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 overflow-x-auto">
                  <h3 className="font-semibold text-gray-700 mb-3">Session Log</h3>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b text-gray-500">
                        <th className="text-left py-2">Date</th>
                        <th className="text-center py-2">Sets</th>
                        <th className="text-center py-2">Reps</th>
                        <th className="text-center py-2">Weight</th>
                        <th className="text-center py-2">Volume</th>
                        <th className="text-center py-2">RPE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedExProgress.data_points.map((dp, i) => (
                        <tr key={i} className="border-b border-gray-50">
                          <td className="py-2 text-gray-700">{new Date(dp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                          <td className="text-center text-gray-600">{dp.sets}</td>
                          <td className="text-center text-gray-600">{dp.reps}</td>
                          <td className="text-center text-gray-600">{dp.max_weight ? `${dp.max_weight}kg` : '-'}</td>
                          <td className="text-center font-medium text-gray-800">{dp.total_volume}</td>
                          <td className="text-center text-gray-600">{dp.rpe || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75Z" /></svg>
                <p className="text-gray-500 text-sm">No data for this exercise yet</p>
                <p className="text-gray-400 text-xs mt-1">Complete workouts to see your progress</p>
              </div>
            )}
          </>
        )}

        {/* =================== CATEGORIES TAB =================== */}
        {tab === 'Categories' && (
          <>
            {/* Category Selector */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-700 mb-2">Select Category</h3>
              <div className="flex flex-wrap gap-2">
                {(exerciseData?.categories || []).map(cat => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize ${
                      selectedCategory === cat
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}>{cat.replace('_', ' ')}</button>
                ))}
              </div>
            </div>

            {selectedCatProgress ? (
              <>
                {/* Category Summary */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
                    <div className="font-bold text-2xl text-gray-900">{selectedCatProgress.total_sessions}</div>
                    <div className="text-xs text-gray-500">Total Sessions</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
                    <div className="font-bold text-2xl text-gray-900">{(selectedCatProgress.total_volume / 1000).toFixed(1)}k</div>
                    <div className="text-xs text-gray-500">Total Volume</div>
                  </div>
                </div>

                {/* Weekly Volume */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-700 mb-3">Weekly Volume</h3>
                  <RechartsBar data={catChartData} dataKey="volume" color="#0d9488" />
                </div>

                {/* Sessions per Week */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-700 mb-3">Sessions per Week</h3>
                  <RechartsBar data={catChartData} dataKey="sessions" color="#06b6d4" />
                </div>

                {/* Average RPE */}
                {catChartData.some(d => d.rpe > 0) && (
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-700 mb-3">Average RPE by Week</h3>
                    <RechartsLine data={catChartData} lines={['rpe']} />
                  </div>
                )}

                {/* Exercises in this category */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-700 mb-3">Exercises in {selectedCategory?.replace('_', ' ')}</h3>
                  <div className="space-y-2">
                    {exerciseData?.exercise_progress?.filter(ep => ep.category === selectedCategory).map((ep, i) => (
                      <button key={i} onClick={() => { setSelectedExercise(ep.exercise_id); setTab('Exercises'); }}
                        className="w-full flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{ep.exercise_name}</div>
                          <div className="text-xs text-gray-400">{ep.summary.total_sessions} sessions</div>
                        </div>
                        <div className="text-right">
                          {ep.summary.latest_weight && (
                            <div className="text-sm font-bold text-gray-800">{ep.summary.latest_weight}kg</div>
                          )}
                          {ep.summary.weight_change != null && (
                            <div className={`text-xs font-medium ${ep.summary.weight_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {ep.summary.weight_change >= 0 ? '+' : ''}{ep.summary.weight_change}kg
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                <p className="text-gray-500 text-sm">Select a category to view progress</p>
              </div>
            )}

            {/* All Categories Overview */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-700 mb-3">All Categories Overview</h3>
              <div className="space-y-3">
                {(exerciseData?.category_progress || []).map(cp => {
                  const maxVol = Math.max(...(exerciseData?.category_progress || []).map(c => c.total_volume), 1);
                  const pct = (cp.total_volume / maxVol) * 100;
                  return (
                    <div key={cp.category}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700 capitalize">{cp.category.replace('_', ' ')}</span>
                        <span className="text-xs text-gray-500">{cp.total_sessions} sessions</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className="h-3 rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: { strength: '#ef4444', speed: '#3b82f6', agility: '#8b5cf6', ball_work: '#22c55e', flexibility: '#ec4899', core: '#f59e0b', plyometrics: '#f97316', recovery: '#14b8a6' }[cp.category] || '#6b7280'
                          }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      <BottomNav active="progress" />
    </div>
  );
}
