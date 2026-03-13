'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';

// Dynamic recharts imports (no SSR)
const LineChart = dynamic(() => import('recharts').then(m => m.LineChart), { ssr: false });
const BarChart = dynamic(() => import('recharts').then(m => m.BarChart), { ssr: false });
const Line = dynamic(() => import('recharts').then(m => m.Line), { ssr: false });
const Bar = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(m => m.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false });
const Legend = dynamic(() => import('recharts').then(m => m.Legend), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false });
const ReferenceLine = dynamic(() => import('recharts').then(m => m.ReferenceLine), { ssr: false });
const ReferenceArea = dynamic(() => import('recharts').then(m => m.ReferenceArea), { ssr: false });
const Cell = dynamic(() => import('recharts').then(m => m.Cell), { ssr: false });

const TABS = [
  { id: 'load', label: 'Load Management', icon: LoadIcon },
  { id: 'performance', label: 'Performance', icon: PerformanceIcon },
  { id: 'injuries', label: 'Injuries', icon: InjuryIcon },
  { id: 'wellness', label: 'Wellness', icon: WellnessIcon },
];

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('load');
  const [coachId, setCoachId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('mf_user') || '{}');
    if (user.id) setCoachId(user.id);
  }, []);

  useEffect(() => {
    if (!coachId) return;
    loadData();
  }, [coachId, activeTab, selectedPlayer]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        coach_id: coachId,
        type: activeTab,
      });
      if (selectedPlayer) params.set('player_id', selectedPlayer);

      const res = await fetch(`/api/analytics?${params}`);
      if (!res.ok) throw new Error('Failed to load analytics');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-1 flex gap-1 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSelectedPlayer(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-green-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <LoadingSkeleton />
      ) : data ? (
        <>
          {activeTab === 'load' && (
            <LoadManagementTab data={data} selectedPlayer={selectedPlayer} setSelectedPlayer={setSelectedPlayer} onRefresh={loadData} />
          )}
          {activeTab === 'performance' && (
            <PerformanceTab data={data} selectedPlayer={selectedPlayer} setSelectedPlayer={setSelectedPlayer} onRefresh={loadData} />
          )}
          {activeTab === 'injuries' && (
            <InjuriesTab data={data} coachId={coachId} onRefresh={loadData} />
          )}
          {activeTab === 'wellness' && (
            <WellnessTab data={data} />
          )}
        </>
      ) : null}
    </div>
  );
}

// ===================== LOADING SKELETON =====================
function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
            <div className="h-8 bg-gray-200 rounded w-1/3" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
        <div className="h-64 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

// ===================== TAB 1: LOAD MANAGEMENT =====================
function LoadManagementTab({ data, selectedPlayer, setSelectedPlayer, onRefresh }) {
  const { acwr_data = [], trend = [], players = [] } = data;

  const greenCount = acwr_data.filter(d => d.zone === 'green').length;
  const amberCount = acwr_data.filter(d => d.zone === 'amber').length;
  const redCount = acwr_data.filter(d => d.zone === 'red').length;
  const grayCount = acwr_data.filter(d => d.zone === 'gray').length;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Optimal Zone" value={greenCount} sub="ACWR 0.8-1.3" color="text-green-600" bg="bg-green-50" />
        <StatCard label="Caution Zone" value={amberCount} sub="ACWR 1.3-1.5 or <0.8" color="text-amber-600" bg="bg-amber-50" />
        <StatCard label="Danger Zone" value={redCount} sub="ACWR >1.5 or <0.5" color="text-red-600" bg="bg-red-50" />
        <StatCard label="No Data" value={grayCount} sub="Insufficient logs" color="text-gray-500" bg="bg-gray-50" />
      </div>

      {/* Red zone alert */}
      {redCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
            <span className="font-semibold text-red-800">{redCount} athlete{redCount > 1 ? 's' : ''} in danger zone</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {acwr_data.filter(d => d.zone === 'red').map(d => (
              <span key={d.player_id} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                {d.player_name} (ACWR: {d.acwr ?? 'N/A'})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ACWR Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Acute:Chronic Workload Ratio</h3>
          <p className="text-xs text-gray-500 mt-1">sRPE method (RPE x Duration). 7-day acute / 28-day chronic.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Athlete</th>
                <th className="text-left px-4 py-3 font-medium">Pos</th>
                <th className="text-right px-4 py-3 font-medium">Acute (7d)</th>
                <th className="text-right px-4 py-3 font-medium">Chronic (28d)</th>
                <th className="text-center px-4 py-3 font-medium">ACWR</th>
                <th className="text-center px-4 py-3 font-medium">Zone</th>
                <th className="text-center px-4 py-3 font-medium">Sessions</th>
                <th className="text-center px-4 py-3 font-medium">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {acwr_data.map(row => (
                <tr key={row.player_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <button
                      onClick={() => setSelectedPlayer(selectedPlayer === row.player_id ? null : row.player_id)}
                      className="hover:text-green-600 transition-colors text-left"
                    >
                      {row.player_name}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{Array.isArray(row.position) ? row.position.join('/') : row.position || '-'}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{row.acute_load}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{row.chronic_load}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-bold ${
                      row.zone === 'green' ? 'text-green-600' :
                      row.zone === 'amber' ? 'text-amber-600' :
                      row.zone === 'red' ? 'text-red-600' : 'text-gray-400'
                    }`}>
                      {row.acwr ?? 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ACWRBadge zone={row.zone} />
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">{row.sessions_7d}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setSelectedPlayer(selectedPlayer === row.player_id ? null : row.player_id)}
                      className={`p-1 rounded hover:bg-gray-200 transition-colors ${selectedPlayer === row.player_id ? 'bg-green-100 text-green-700' : 'text-gray-400'}`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trend Chart */}
      {selectedPlayer && trend.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-1">
            ACWR Trend: {acwr_data.find(d => d.player_id === selectedPlayer)?.player_name}
          </h3>
          <p className="text-xs text-gray-500 mb-4">28-day rolling window</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                <YAxis domain={[0, 'auto']} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                  formatter={(value, name) => [value, name === 'acwr' ? 'ACWR' : name === 'acute_load' ? 'Acute Load' : 'Chronic Load']}
                  labelFormatter={l => `Date: ${l}`}
                />
                <Legend />
                <ReferenceArea y1={0.8} y2={1.3} fill="#22c55e" fillOpacity={0.08} />
                <ReferenceLine y={1.3} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: '1.3', position: 'right', fontSize: 10 }} />
                <ReferenceLine y={0.8} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: '0.8', position: 'right', fontSize: 10 }} />
                <ReferenceLine y={1.5} stroke="#ef4444" strokeDasharray="5 5" label={{ value: '1.5', position: 'right', fontSize: 10 }} />
                <Line type="monotone" dataKey="acwr" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 3 }} name="ACWR" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

// ===================== TAB 2: PERFORMANCE =====================
function PerformanceTab({ data, selectedPlayer, setSelectedPlayer, onRefresh }) {
  const { exercises = [], personal_records = [], history = [], players = [] } = data;
  const [selectedExercise, setSelectedExercise] = useState(null);

  // Filter history by selected exercise
  const filteredHistory = useMemo(() => {
    if (!selectedExercise) return history;
    return history.filter(h => h.exercise_id === selectedExercise);
  }, [history, selectedExercise]);

  // Get unique exercises from history for the dropdown
  const historyExercises = useMemo(() => {
    const map = {};
    history.forEach(h => { map[h.exercise_id] = h.exercise_name; });
    return Object.entries(map).map(([id, name]) => ({ id, name }));
  }, [history]);

  return (
    <div className="space-y-4">
      {/* Player selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <label className="text-sm font-medium text-gray-700 mr-3">Select athlete for detailed view:</label>
        <select
          value={selectedPlayer || ''}
          onChange={e => setSelectedPlayer(e.target.value || null)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-green-500 outline-none"
        >
          <option value="">Team Overview</option>
          {players.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {selectedPlayer && historyExercises.length > 0 && (
          <select
            value={selectedExercise || ''}
            onChange={e => setSelectedExercise(e.target.value || null)}
            className="ml-3 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-green-500 outline-none"
          >
            <option value="">All Exercises</option>
            {historyExercises.map(ex => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* PRs */}
      {personal_records.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L3 7l9 5 9-5-9-5zM3 17l9 5 9-5M3 12l9 5 9-5" /></svg>
            Recent Personal Records
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {personal_records.slice(0, 6).map((pr, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.996.178-1.768.891-1.768 1.953v.237c0 .795.546 1.472 1.306 1.672a11.75 11.75 0 005.961 0c.76-.2 1.306-.877 1.306-1.672v-.237c0-1.062-.772-1.775-1.768-1.953M18.75 4.236c.996.178 1.768.891 1.768 1.953v.237c0 .795-.546 1.472-1.306 1.672a11.75 11.75 0 01-5.961 0c-.76-.2-1.306-.877-1.306-1.672v-.237c0-1.062.772-1.775 1.768-1.953" /></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 truncate">{pr.player_name}</div>
                  <div className="text-xs text-gray-500 truncate">{pr.exercise_name}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-amber-700">{pr.e1rm} kg</div>
                  <div className="text-xs text-green-600">+{pr.improvement} kg</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exercise 1RM Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Estimated 1RM by Exercise</h3>
          <p className="text-xs text-gray-500 mt-1">Epley formula: weight x (1 + reps/30). Based on last 90 days.</p>
        </div>
        {exercises.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No weighted exercise data yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Exercise</th>
                  <th className="text-left px-4 py-3 font-medium">Category</th>
                  <th className="text-right px-4 py-3 font-medium">Team Avg 1RM</th>
                  <th className="text-right px-4 py-3 font-medium">Best 1RM</th>
                  <th className="text-left px-4 py-3 font-medium">Best Athlete</th>
                  <th className="text-center px-4 py-3 font-medium">Athletes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {exercises.map(ex => (
                  <tr key={ex.exercise_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{ex.name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs capitalize">{ex.category}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{ex.team_avg_1rm} kg</td>
                    <td className="px-4 py-3 text-right font-bold text-green-600">{ex.best_1rm} kg</td>
                    <td className="px-4 py-3 text-gray-600">{ex.best_player}</td>
                    <td className="px-4 py-3 text-center text-gray-500">{ex.player_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Historical 1RM Chart */}
      {selectedPlayer && filteredHistory.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-1">
            1RM Progress: {players.find(p => p.id === selectedPlayer)?.name}
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            {selectedExercise ? historyExercises.find(e => e.id === selectedExercise)?.name : 'All exercises'} - Last 90 days
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} unit=" kg" />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                  formatter={(value, name) => [`${value} kg`, name]}
                  labelFormatter={l => `Date: ${l}`}
                />
                <Legend />
                <Line type="monotone" dataKey="e1rm" stroke="#16a34a" strokeWidth={2} dot={{ r: 3, fill: '#16a34a' }} name="Est. 1RM" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

// ===================== TAB 3: INJURIES =====================
function InjuriesTab({ data, coachId, onRefresh }) {
  const { injuries = [], monthly_trends = [], body_part_counts = [], severity_distribution = {}, players = [], teams = [] } = data;
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    player_id: '', body_part: '', severity: 3, mechanism: '', notes: '', date: new Date().toISOString().split('T')[0],
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedBodyPart, setSelectedBodyPart] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.player_id || !formData.body_part) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/injuries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowForm(false);
        setFormData({ player_id: '', body_part: '', severity: 3, mechanism: '', notes: '', date: new Date().toISOString().split('T')[0] });
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
    setSubmitting(false);
  }

  const BODY_PARTS = [
    'Head', 'Neck', 'Left Shoulder', 'Right Shoulder',
    'Left Elbow', 'Right Elbow', 'Left Wrist', 'Right Wrist',
    'Chest', 'Upper Back', 'Lower Back',
    'Left Hip', 'Right Hip', 'Groin',
    'Left Quad', 'Right Quad', 'Left Hamstring', 'Right Hamstring',
    'Left Knee', 'Right Knee',
    'Left Shin', 'Right Shin', 'Left Calf', 'Right Calf',
    'Left Ankle', 'Right Ankle', 'Left Foot', 'Right Foot',
  ];

  const MECHANISMS = [
    'Contact', 'Non-contact', 'Overuse', 'Training', 'Match', 'Warm-up', 'Other',
  ];

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Injuries" value={data.total || 0} color="text-gray-900" bg="bg-white" />
        <StatCard
          label="Active Injuries"
          value={injuries.filter(i => i.status === 'active').length}
          color="text-red-600"
          bg="bg-red-50"
        />
        <StatCard
          label="Most Affected"
          value={body_part_counts[0]?.part || 'N/A'}
          sub={body_part_counts[0] ? `${body_part_counts[0].count} injuries` : ''}
          color="text-amber-600"
          bg="bg-amber-50"
          isText
        />
        <StatCard
          label="This Month"
          value={monthly_trends.length > 0 ? monthly_trends[monthly_trends.length - 1]?.count || 0 : 0}
          color="text-blue-600"
          bg="bg-blue-50"
        />
      </div>

      {/* Log Injury Button + Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Injury Log</h3>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Log Injury
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="border border-gray-200 rounded-xl p-4 mb-4 space-y-4 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Player</label>
                <select
                  value={formData.player_id}
                  onChange={e => setFormData({ ...formData, player_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  required
                >
                  <option value="">Select player...</option>
                  {players.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  required
                />
              </div>
            </div>

            {/* Body Map */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Body Part</label>
              <div className="flex flex-col md:flex-row gap-4">
                {/* SVG Body Map */}
                <div className="flex-shrink-0">
                  <BodyMapSVG
                    selected={formData.body_part}
                    onSelect={part => setFormData({ ...formData, body_part: part })}
                    injuries={injuries}
                  />
                </div>
                {/* Body Part Quick Select */}
                <div className="flex flex-wrap gap-1.5 content-start">
                  {BODY_PARTS.map(part => (
                    <button
                      key={part}
                      type="button"
                      onClick={() => setFormData({ ...formData, body_part: part })}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                        formData.body_part === part
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {part}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Severity (1-5)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormData({ ...formData, severity: s })}
                      className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${
                        formData.severity === s
                          ? s <= 2 ? 'bg-green-600 text-white' : s <= 3 ? 'bg-amber-500 text-white' : 'bg-red-600 text-white'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formData.severity <= 2 ? 'Minor' : formData.severity <= 3 ? 'Moderate' : 'Severe'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mechanism</label>
                <select
                  value={formData.mechanism}
                  onChange={e => setFormData({ ...formData, mechanism: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                >
                  <option value="">Select...</option>
                  {MECHANISMS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none resize-none"
                placeholder="Additional details..."
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !formData.player_id || !formData.body_part}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Saving...' : 'Save Injury'}
              </button>
            </div>
          </form>
        )}

        {/* Injury History */}
        {injuries.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">No injuries recorded</div>
        ) : (
          <div className="space-y-2">
            {injuries.map(injury => (
              <div key={injury.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className={`w-2 h-10 rounded-full ${
                  injury.severity <= 2 ? 'bg-green-500' : injury.severity <= 3 ? 'bg-amber-500' : 'bg-red-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-900">{injury.player_name || injury.mf_players?.name}</span>
                    <span className="text-xs text-gray-400">{injury.date}</span>
                    {injury.status === 'active' && (
                      <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">Active</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-600">{injury.body_part}</span>
                    {injury.mechanism && (
                      <span className="text-xs text-gray-400">({injury.mechanism})</span>
                    )}
                    <span className={`text-xs font-medium ${
                      injury.severity <= 2 ? 'text-green-600' : injury.severity <= 3 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      Sev: {injury.severity}/5
                    </span>
                  </div>
                  {injury.notes && <p className="text-xs text-gray-500 mt-0.5 truncate">{injury.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Monthly Trends */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Monthly Injury Trends</h3>
          {monthly_trends.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly_trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} tickFormatter={m => m.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                  <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} name="Injuries" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Body Part Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Most Common Injury Locations</h3>
          {body_part_counts.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={body_part_counts.slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="part" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                  <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===================== TAB 4: WELLNESS =====================
function WellnessTab({ data }) {
  const { heatmap = [], daily_trends = [], deload_alerts = [], dates = [] } = data;

  return (
    <div className="space-y-4">
      {/* Deload Alerts */}
      {deload_alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
            <span className="font-semibold text-amber-800">Deload Recommended</span>
          </div>
          <p className="text-sm text-amber-700 mb-2">These athletes have averaged below 40 readiness over the last 3 days:</p>
          <div className="flex flex-wrap gap-2">
            {deload_alerts.map(a => (
              <span key={a.player_id} className="px-3 py-1.5 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                {a.player_name} (Avg: {a.avg_readiness_7d ?? '?'})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Team Avg Readiness"
          value={heatmap.length > 0
            ? Math.round(heatmap.filter(h => h.avg_readiness_7d !== null).reduce((s, h) => s + h.avg_readiness_7d, 0) / Math.max(heatmap.filter(h => h.avg_readiness_7d !== null).length, 1))
            : 'N/A'}
          color="text-green-600"
          bg="bg-green-50"
        />
        <StatCard
          label="Checked In Today"
          value={`${heatmap.filter(h => h.days[h.days.length - 1]?.readiness !== null).length}/${heatmap.length}`}
          color="text-blue-600"
          bg="bg-blue-50"
          isText
        />
        <StatCard
          label="Good to Train"
          value={heatmap.filter(h => h.avg_readiness_7d !== null && h.avg_readiness_7d >= 60).length}
          color="text-green-600"
          bg="bg-green-50"
        />
        <StatCard
          label="Need Deload"
          value={deload_alerts.length}
          color={deload_alerts.length > 0 ? 'text-amber-600' : 'text-gray-500'}
          bg={deload_alerts.length > 0 ? 'bg-amber-50' : 'bg-gray-50'}
        />
      </div>

      {/* Team Readiness Heatmap */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 overflow-x-auto">
        <h3 className="font-semibold text-gray-900 mb-1">Team Readiness Heatmap</h3>
        <p className="text-xs text-gray-500 mb-3">Players x Last 14 days. Color = readiness score (0-100).</p>

        <div className="min-w-[600px]">
          <div className="flex">
            {/* Player names column */}
            <div className="flex-shrink-0 w-32">
              <div className="h-8" /> {/* Header spacer */}
              {heatmap.map(player => (
                <div key={player.player_id} className="h-9 flex items-center">
                  <span className="text-xs font-medium text-gray-700 truncate pr-2">{player.player_name}</span>
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            <div className="flex-1 overflow-x-auto">
              {/* Date headers */}
              <div className="flex gap-0.5 mb-0.5">
                {dates.map(date => (
                  <div key={date} className="flex-1 min-w-[36px] h-8 flex items-center justify-center">
                    <span className="text-[10px] text-gray-400 -rotate-45 whitespace-nowrap">{date.slice(5)}</span>
                  </div>
                ))}
              </div>

              {/* Cells */}
              {heatmap.map(player => (
                <div key={player.player_id} className="flex gap-0.5 mb-0.5">
                  {player.days.map((day, i) => (
                    <div
                      key={i}
                      className="flex-1 min-w-[36px] h-8 rounded flex items-center justify-center relative group cursor-default"
                      style={{ backgroundColor: getReadinessColor(day.readiness) }}
                      title={`${player.player_name} - ${day.date}: ${day.readiness ?? 'No check-in'}`}
                    >
                      <span className="text-[10px] font-medium" style={{ color: day.readiness !== null ? (day.readiness > 50 ? '#fff' : '#374151') : '#9ca3af' }}>
                        {day.readiness ?? '-'}
                      </span>
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10 pointer-events-none">
                        <div className="bg-gray-900 text-white text-[10px] rounded-md px-2 py-1.5 whitespace-nowrap shadow-lg">
                          <div className="font-medium">{player.player_name}</div>
                          <div>{day.date}</div>
                          {day.readiness !== null ? (
                            <>
                              <div>Readiness: {day.readiness}</div>
                              <div>Sleep: {day.sleep}/5 | Energy: {day.energy}/5</div>
                              <div>Mood: {day.mood}/5 | Soreness: {day.soreness}/5</div>
                            </>
                          ) : (
                            <div className="text-gray-400">No check-in</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* 7d Avg column */}
            <div className="flex-shrink-0 w-16 ml-2">
              <div className="h-8 flex items-center justify-center">
                <span className="text-[10px] text-gray-500 font-medium">7d Avg</span>
              </div>
              {heatmap.map(player => (
                <div key={player.player_id} className="h-9 flex items-center justify-center">
                  <span className={`text-xs font-bold ${
                    player.avg_readiness_7d === null ? 'text-gray-400' :
                    player.avg_readiness_7d >= 70 ? 'text-green-600' :
                    player.avg_readiness_7d >= 40 ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {player.avg_readiness_7d ?? '-'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 mt-3 text-[10px] text-gray-500">
          <span>Low</span>
          <div className="flex gap-0.5">
            {[0, 20, 40, 60, 80, 100].map(v => (
              <div key={v} className="w-6 h-4 rounded" style={{ backgroundColor: getReadinessColor(v) }} />
            ))}
          </div>
          <span>High</span>
        </div>
      </div>

      {/* Wellness Trends Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-1">Team Wellness Trends</h3>
        <p className="text-xs text-gray-500 mb-3">Daily team averages over last 14 days</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={daily_trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                labelFormatter={l => `Date: ${l}`}
              />
              <Legend />
              <Line type="monotone" dataKey="avg_readiness" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 3 }} name="Readiness" connectNulls />
              <Line type="monotone" dataKey="avg_sleep" stroke="#3b82f6" strokeWidth={1.5} dot={{ r: 2 }} name="Sleep (1-5)" connectNulls />
              <Line type="monotone" dataKey="avg_energy" stroke="#f59e0b" strokeWidth={1.5} dot={{ r: 2 }} name="Energy (1-5)" connectNulls />
              <Line type="monotone" dataKey="avg_mood" stroke="#8b5cf6" strokeWidth={1.5} dot={{ r: 2 }} name="Mood (1-5)" connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ===================== SHARED COMPONENTS =====================

function StatCard({ label, value, sub, color = 'text-gray-900', bg = 'bg-white', isText = false }) {
  return (
    <div className={`${bg} rounded-xl p-4 shadow-sm border border-gray-100`}>
      <div className={`${isText ? 'text-lg' : 'text-2xl'} font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
      {sub && <div className="text-[10px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function ACWRBadge({ zone }) {
  const config = {
    green: { bg: 'bg-green-100', text: 'text-green-700', label: 'Optimal' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Caution' },
    red: { bg: 'bg-red-100', text: 'text-red-700', label: 'Danger' },
    gray: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'No Data' },
  };
  const c = config[zone] || config.gray;
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

function getReadinessColor(readiness) {
  if (readiness === null || readiness === undefined) return '#f3f4f6'; // gray-100
  if (readiness >= 80) return '#16a34a'; // green-600
  if (readiness >= 60) return '#65a30d'; // lime-600
  if (readiness >= 40) return '#f59e0b'; // amber-500
  if (readiness >= 20) return '#f97316'; // orange-500
  return '#ef4444'; // red-500
}

// ===================== SVG BODY MAP =====================
function BodyMapSVG({ selected, onSelect, injuries = [] }) {
  // Count injuries per body part for coloring
  const injuryCounts = {};
  injuries.forEach(i => {
    const part = i.body_part;
    injuryCounts[part] = (injuryCounts[part] || 0) + 1;
  });

  const bodyParts = [
    { id: 'Head', cx: 100, cy: 30, r: 16 },
    { id: 'Neck', cx: 100, cy: 55, r: 8 },
    { id: 'Left Shoulder', cx: 72, cy: 75, r: 12 },
    { id: 'Right Shoulder', cx: 128, cy: 75, r: 12 },
    { id: 'Chest', cx: 100, cy: 90, r: 14 },
    { id: 'Left Elbow', cx: 58, cy: 110, r: 9 },
    { id: 'Right Elbow', cx: 142, cy: 110, r: 9 },
    { id: 'Upper Back', cx: 100, cy: 105, r: 10 },
    { id: 'Left Wrist', cx: 48, cy: 140, r: 7 },
    { id: 'Right Wrist', cx: 152, cy: 140, r: 7 },
    { id: 'Lower Back', cx: 100, cy: 130, r: 12 },
    { id: 'Left Hip', cx: 82, cy: 155, r: 10 },
    { id: 'Right Hip', cx: 118, cy: 155, r: 10 },
    { id: 'Groin', cx: 100, cy: 162, r: 8 },
    { id: 'Left Quad', cx: 85, cy: 185, r: 12 },
    { id: 'Right Quad', cx: 115, cy: 185, r: 12 },
    { id: 'Left Hamstring', cx: 85, cy: 200, r: 10 },
    { id: 'Right Hamstring', cx: 115, cy: 200, r: 10 },
    { id: 'Left Knee', cx: 85, cy: 220, r: 9 },
    { id: 'Right Knee', cx: 115, cy: 220, r: 9 },
    { id: 'Left Shin', cx: 83, cy: 245, r: 8 },
    { id: 'Right Shin', cx: 117, cy: 245, r: 8 },
    { id: 'Left Calf', cx: 83, cy: 258, r: 8 },
    { id: 'Right Calf', cx: 117, cy: 258, r: 8 },
    { id: 'Left Ankle', cx: 82, cy: 278, r: 7 },
    { id: 'Right Ankle', cx: 118, cy: 278, r: 7 },
    { id: 'Left Foot', cx: 78, cy: 295, r: 8 },
    { id: 'Right Foot', cx: 122, cy: 295, r: 8 },
  ];

  function getPartColor(partId) {
    if (selected === partId) return '#16a34a'; // green-600
    const count = injuryCounts[partId] || 0;
    if (count >= 3) return '#ef4444'; // red-500
    if (count >= 2) return '#f97316'; // orange-500
    if (count >= 1) return '#f59e0b'; // amber-500
    return '#d1d5db'; // gray-300
  }

  return (
    <svg viewBox="0 0 200 310" width="160" height="250" className="flex-shrink-0">
      {/* Body outline */}
      <ellipse cx="100" cy="30" rx="18" ry="22" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1" />
      <rect x="88" y="48" width="24" height="12" rx="4" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1" />
      <path d="M72 65 Q60 60 55 70 L45 135 Q43 145 52 145 L65 142 L72 65Z" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1" />
      <path d="M128 65 Q140 60 145 70 L155 135 Q157 145 148 145 L135 142 L128 65Z" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1" />
      <path d="M72 65 L72 155 Q72 170 85 175 L85 280 Q85 300 78 300 L72 300 Q65 300 68 290 L68 285 Q68 278 78 278 L85 280" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1" />
      <path d="M128 65 L128 155 Q128 170 115 175 L115 280 Q115 300 122 300 L128 300 Q135 300 132 290 L132 285 Q132 278 122 278 L115 280" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1" />
      <rect x="72" y="65" width="56" height="90" rx="6" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1" />

      {/* Interactive body part circles */}
      {bodyParts.map(part => (
        <g key={part.id} onClick={() => onSelect(part.id)} className="cursor-pointer">
          <circle
            cx={part.cx}
            cy={part.cy}
            r={part.r}
            fill={getPartColor(part.id)}
            fillOpacity={selected === part.id ? 0.9 : 0.5}
            stroke={selected === part.id ? '#16a34a' : 'transparent'}
            strokeWidth={selected === part.id ? 2 : 0}
            className="transition-all hover:fill-opacity-80"
          />
          {injuryCounts[part.id] > 0 && (
            <text x={part.cx} y={part.cy + 3} textAnchor="middle" fontSize="8" fill="#fff" fontWeight="bold">
              {injuryCounts[part.id]}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

// ===================== ICON COMPONENTS =====================
function LoadIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function PerformanceIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  );
}

function InjuryIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function WellnessIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  );
}
