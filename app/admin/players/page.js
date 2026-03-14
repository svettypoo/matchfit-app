'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const POSITIONS = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST', 'CF'];
const STATUSES = ['active', 'injured', 'suspended'];

export default function PlayersPage() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPosition, setFilterPosition] = useState('');
  const [viewMode, setViewMode] = useState('cards');
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => { loadPlayers(); }, []);

  async function loadPlayers() {
    const user = JSON.parse(localStorage.getItem('mf_user') || '{}');
    try {
      const res = await fetch(`/api/coach/players?coach_id=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setPlayers(data.players || []);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  const filtered = players
    .filter(p => {
      if (search && !p.name?.toLowerCase().includes(search.toLowerCase()) && !p.email?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatus && p.status !== filterStatus) return false;
      if (filterPosition && p.position !== filterPosition) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'xp') return (b.xp || 0) - (a.xp || 0);
      if (sortBy === 'level') return (b.level || 0) - (a.level || 0);
      if (sortBy === 'streak') return (b.current_streak || 0) - (a.current_streak || 0);
      return 0;
    });

  const statusColor = (s) => {
    if (s === 'injured') return 'bg-red-100 text-red-700';
    if (s === 'suspended') return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Players</h1>
          <p className="text-sm text-gray-500">{filtered.length} player{filtered.length !== 1 ? 's' : ''} across all teams</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-200 rounded-lg p-0.5">
            <button onClick={() => setViewMode('cards')}
              className={`px-2 py-1 text-xs rounded-md ${viewMode === 'cards' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>
              Cards
            </button>
            <button onClick={() => setViewMode('list')}
              className={`px-2 py-1 text-xs rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>
              List
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none flex-1 min-w-[200px]"
        />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none">
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
        <select value={filterPosition} onChange={e => setFilterPosition(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none">
          <option value="">All Positions</option>
          {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none">
          <option value="name">Sort: Name</option>
          <option value="xp">Sort: XP</option>
          <option value="level">Sort: Level</option>
          <option value="streak">Sort: Streak</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <svg className="animate-spin h-8 w-8 text-green-600 mx-auto" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {players.length === 0 ? 'No players yet' : 'No players match filters'}
          </h3>
          <p className="text-gray-500 text-sm">
            {players.length === 0 ? 'Players will appear here when they join your teams' : 'Try adjusting your search or filters'}
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(player => (
            <Link key={player.id} href={`/admin/players/${player.id}`}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0">
                  {player.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{player.name}</h3>
                  <div className="flex items-center gap-1.5">
                    {player.position && (
                      <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">{player.position}</span>
                    )}
                    {player.jersey_number && (
                      <span className="text-xs text-gray-400">#{player.jersey_number}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <span>{player.team_name || 'No team'}</span>
                <span className={`px-2 py-0.5 rounded-full font-medium ${statusColor(player.status)}`}>
                  {player.status || 'active'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="font-bold text-gray-900 text-sm">{player.level || 1}</div>
                  <div className="text-[10px] text-gray-400">Level</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="font-bold text-gray-900 text-sm">{player.xp || 0}</div>
                  <div className="text-[10px] text-gray-400">XP</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="font-bold text-gray-900 text-sm">{player.current_streak || 0}d</div>
                  <div className="text-[10px] text-gray-400">Streak</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Player</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Team</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Position</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Level</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">XP</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Streak</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(player => (
                  <tr key={player.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/players/${player.id}`} className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {player.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="font-medium text-green-600 hover:text-green-700">{player.name}</div>
                          <div className="text-xs text-gray-400">{player.email}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{player.team_name || '--'}</td>
                    <td className="px-4 py-3">
                      {player.position ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">{player.position}</span>
                      ) : '--'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(player.status)}`}>
                        {player.status || 'active'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{player.level || 1}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{player.xp || 0}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{player.current_streak || 0}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
