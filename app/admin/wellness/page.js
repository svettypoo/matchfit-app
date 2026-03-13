'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

function getTrafficLight(readiness) {
  if (readiness === null || readiness === undefined) return { color: 'bg-gray-300', label: 'No data', textColor: 'text-gray-500' };
  if (readiness >= 70) return { color: 'bg-green-500', label: 'Good', textColor: 'text-green-700' };
  if (readiness >= 40) return { color: 'bg-amber-500', label: 'Caution', textColor: 'text-amber-700' };
  return { color: 'bg-red-500', label: 'Alert', textColor: 'text-red-700' };
}

export default function WellnessDashboardPage() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ avg_readiness: 0, checked_in: 0, total: 0, alerts: 0 });

  useEffect(() => {
    async function load() {
      const user = JSON.parse(localStorage.getItem('mf_user') || '{}');
      try {
        const res = await fetch(`/api/coach/wellness?coach_id=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setPlayers(data.players || []);
          setStats(data.stats || { avg_readiness: 0, checked_in: 0, total: 0, alerts: 0 });
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, []);

  const alertPlayers = players.filter(p => p.readiness !== null && p.readiness < 40);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Wellness Dashboard</h1>

      {/* Alert Banner */}
      {alertPlayers.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">&#9888;&#65039;</span>
            <h3 className="font-semibold text-red-800">{alertPlayers.length} player{alertPlayers.length > 1 ? 's' : ''} need attention</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {alertPlayers.map(p => (
              <Link key={p.id} href={`/admin/players/${p.id}`}
                className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium hover:bg-red-200">
                {p.name} ({p.readiness}/100)
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.avg_readiness}</div>
          <div className="text-xs text-gray-500">Avg Team Readiness</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.checked_in}/{stats.total}</div>
          <div className="text-xs text-gray-500">Checked In Today</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <div className="text-2xl font-bold text-green-600">{players.filter(p => p.readiness >= 70).length}</div>
          <div className="text-xs text-gray-500">Good to Train</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <div className="text-2xl font-bold text-red-600">{alertPlayers.length}</div>
          <div className="text-xs text-gray-500">Need Attention</div>
        </div>
      </div>

      {/* Player Grid */}
      {loading ? (
        <div className="text-center py-12"><div className="animate-spin text-3xl">&#9917;</div></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {players.map(player => {
            const tl = getTrafficLight(player.readiness);
            return (
              <Link key={player.id} href={`/admin/players/${player.id}`}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center hover:shadow-md transition-all">
                <div className="relative inline-block mb-2">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 font-bold">
                    {player.name?.[0]?.toUpperCase()}
                  </div>
                  <div className={`absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full ${tl.color} border-2 border-white`} />
                </div>
                <div className="font-medium text-sm text-gray-900 truncate">{player.name}</div>
                <div className={`text-xs font-medium ${tl.textColor}`}>{tl.label}</div>
                {player.readiness !== null && (
                  <div className="text-lg font-bold text-gray-900 mt-1">{player.readiness}</div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
