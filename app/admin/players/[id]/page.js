'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SimpleChart from '../../../../components/SimpleChart';

const TABS = ['Overview', 'Calendar', 'Wellness', 'Program', 'Messages', 'Notes'];

export default function PlayerDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

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
    return <div className="flex items-center justify-center py-20"><div className="animate-spin text-4xl">&#9917;</div></div>;
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
              { label: 'Level', value: stats.level || 1, icon: '&#11088;' },
              { label: 'XP', value: stats.xp || 0, icon: '&#128171;' },
              { label: 'Streak', value: `${stats.streak || 0}d`, icon: '&#128293;' },
              { label: 'Compliance', value: `${stats.compliance || 0}%`, icon: '&#128200;' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
                <div dangerouslySetInnerHTML={{ __html: s.icon }} />
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
                    {b.icon || '&#127942;'}
                  </div>
                ))}
              </div>
            </div>
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
          <div className="text-4xl mb-2">&#128172;</div>
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
          <div className="text-4xl mb-2">&#128197;</div>
          <p className="text-gray-500">Player calendar view</p>
          <p className="text-sm text-gray-400 mt-1">Workout completion history shown here</p>
        </div>
      )}
    </div>
  );
}
