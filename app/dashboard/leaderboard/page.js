'use client';

import { useState, useEffect } from 'react';
import BottomNav from '../../../components/BottomNav';

const MEDALS = ['&#129351;', '&#129352;', '&#129353;'];

export default function LeaderboardPage() {
  const [metric, setMetric] = useState('xp');
  const [period, setPeriod] = useState('week');
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('mf_user') || '{}');
    setCurrentUserId(user.id);
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('mf_user') || '{}');
      try {
        const res = await fetch(`/api/leaderboard?metric=${metric}&period=${period}&player_id=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setPlayers(data.players || []);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, [metric, period]);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b px-4 py-3">
        <h1 className="font-bold text-lg text-gray-900">Leaderboard</h1>
      </div>

      {/* Metric Toggle */}
      <div className="px-4 pt-4">
        <div className="flex bg-gray-200 rounded-lg p-1 mb-3">
          {[
            { id: 'xp', label: 'XP' },
            { id: 'streak', label: 'Streak' },
            { id: 'compliance', label: 'Compliance' },
          ].map(m => (
            <button key={m.id} onClick={() => setMetric(m.id)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                metric === m.id ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'
              }`}>
              {m.label}
            </button>
          ))}
        </div>

        {/* Period Tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' },
            { id: 'all', label: 'All Time' },
          ].map(p => (
            <button key={p.id} onClick={() => setPeriod(p.id)}
              className={`px-3 py-1.5 text-sm rounded-full font-medium transition-all ${
                period === p.id ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Player List */}
      <div className="px-4 space-y-2">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin text-3xl mb-2">&#9917;</div>
            <p className="text-gray-500 text-sm">Loading rankings...</p>
          </div>
        ) : players.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-2">&#127942;</div>
            <p className="text-gray-500">No data yet. Start training!</p>
          </div>
        ) : (
          players.map((player, i) => {
            const isCurrent = player.id === currentUserId;
            return (
              <div key={player.id || i}
                className={`bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm transition-all ${
                  isCurrent ? 'ring-2 ring-green-500 bg-green-50' : 'border border-gray-100'
                }`}>
                <div className="w-8 text-center">
                  {i < 3 ? (
                    <span className="text-xl" dangerouslySetInnerHTML={{ __html: MEDALS[i] }} />
                  ) : (
                    <span className="text-sm font-bold text-gray-400">#{i + 1}</span>
                  )}
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold">
                  {player.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm truncate">
                    {player.name} {isCurrent && <span className="text-green-600">(You)</span>}
                  </div>
                  <div className="text-xs text-gray-500">{player.position || 'Player'}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">
                    {metric === 'xp' ? player.xp?.toLocaleString() :
                     metric === 'streak' ? `${player.streak}d` :
                     `${player.compliance}%`}
                  </div>
                  {player.trend && (
                    <span className={`text-xs ${player.trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {player.trend > 0 ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <BottomNav active="leaderboard" />
    </div>
  );
}
