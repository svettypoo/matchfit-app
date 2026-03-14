'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

const POSITIONS = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST', 'CF'];
const STATUSES = ['active', 'injured', 'suspended'];

export default function RosterPage() {
  const [teams, setTeams] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [unassigned, setUnassigned] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all'); // 'all' | 'byTeam' | 'unassigned'
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPosition, setFilterPosition] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('cards');
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showCreatePlayer, setShowCreatePlayer] = useState(false);
  const [teamForm, setTeamForm] = useState({ name: '', age_group: '', season_start: '', season_end: '' });
  const [playerForm, setPlayerForm] = useState({ name: '', email: '', phone: '', team_id: '', position: '', jersey_number: '' });
  const [creating, setCreating] = useState(false);
  const [expandedTeams, setExpandedTeams] = useState({});

  useEffect(() => { loadRoster(); }, []);

  async function loadRoster() {
    const user = JSON.parse(localStorage.getItem('mf_user') || '{}');
    try {
      const res = await fetch(`/api/roster?coach_id=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setTeams(data.teams || []);
        setAllPlayers(data.all_players || []);
        setUnassigned(data.unassigned_players || []);
        // Expand all teams by default
        const expanded = {};
        (data.teams || []).forEach(t => { expanded[t.id] = true; });
        setExpandedTeams(expanded);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  const filtered = useMemo(() => {
    let list = tab === 'unassigned' ? unassigned : allPlayers;
    return list
      .filter(p => {
        if (search) {
          const q = search.toLowerCase();
          const match = (p.name || '').toLowerCase().includes(q) ||
            (p.email || '').toLowerCase().includes(q) ||
            (p.phone || '').toLowerCase().includes(q) ||
            (p.team_name || '').toLowerCase().includes(q) ||
            (Array.isArray(p.position) ? p.position.join(' ') : (p.position || '')).toLowerCase().includes(q);
          if (!match) return false;
        }
        if (filterStatus && p.status !== filterStatus) return false;
        if (filterPosition) {
          const pos = Array.isArray(p.position) ? p.position : [p.position];
          if (!pos.includes(filterPosition)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
        if (sortBy === 'xp') return (b.xp || 0) - (a.xp || 0);
        if (sortBy === 'level') return (b.level || 0) - (a.level || 0);
        if (sortBy === 'streak') return (b.current_streak || 0) - (a.current_streak || 0);
        return 0;
      });
  }, [allPlayers, unassigned, tab, search, filterStatus, filterPosition, sortBy]);

  const filteredTeams = useMemo(() => {
    if (!search) return teams;
    const q = search.toLowerCase();
    return teams.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.players.some(p =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.email || '').toLowerCase().includes(q) ||
        (p.phone || '').toLowerCase().includes(q)
      )
    );
  }, [teams, search]);

  const statusColor = (s) => {
    if (s === 'injured') return 'bg-red-100 text-red-700';
    if (s === 'suspended') return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  async function createTeam(e) {
    e.preventDefault();
    setCreating(true);
    const user = JSON.parse(localStorage.getItem('mf_user') || '{}');
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...teamForm, coach_id: user.id }),
      });
      if (res.ok) {
        setShowCreateTeam(false);
        setTeamForm({ name: '', age_group: '', season_start: '', season_end: '' });
        loadRoster();
      }
    } catch (err) { console.error(err); }
    setCreating(false);
  }

  async function createPlayer(e) {
    e.preventDefault();
    setCreating(true);
    const user = JSON.parse(localStorage.getItem('mf_user') || '{}');
    try {
      const body = {
        name: playerForm.name,
        email: playerForm.email || null,
        phone: playerForm.phone || null,
        team_id: playerForm.team_id || null,
        position: playerForm.position ? [playerForm.position] : null,
        jersey_number: playerForm.jersey_number ? parseInt(playerForm.jersey_number) : null,
        coach_id: user.id,
      };
      const res = await fetch('/api/roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowCreatePlayer(false);
        setPlayerForm({ name: '', email: '', phone: '', team_id: '', position: '', jersey_number: '' });
        loadRoster();
      }
    } catch (err) { console.error(err); }
    setCreating(false);
  }

  function toggleTeam(id) {
    setExpandedTeams(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function PlayerCard({ player }) {
    return (
      <Link href={`/admin/players/${player.id}`}
        className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 bg-green-600 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0">
            {player.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-gray-900 truncate text-sm">{player.name}</h3>
            <div className="flex items-center gap-1.5 flex-wrap">
              {player.team_name && (
                <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">{player.team_name}</span>
              )}
              {Array.isArray(player.position) ? player.position.map(pos => (
                <span key={pos} className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">{pos}</span>
              )) : player.position && (
                <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">{player.position}</span>
              )}
              {player.jersey_number && (
                <span className="text-[10px] text-gray-400">#{player.jersey_number}</span>
              )}
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${statusColor(player.status)}`}>
            {player.status || 'active'}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-gray-50 rounded-lg py-1.5">
            <div className="font-bold text-gray-900 text-sm">{player.level || 1}</div>
            <div className="text-[10px] text-gray-400">Level</div>
          </div>
          <div className="bg-gray-50 rounded-lg py-1.5">
            <div className="font-bold text-gray-900 text-sm">{player.xp || 0}</div>
            <div className="text-[10px] text-gray-400">XP</div>
          </div>
          <div className="bg-gray-50 rounded-lg py-1.5">
            <div className="font-bold text-gray-900 text-sm">{player.current_streak || 0}d</div>
            <div className="text-[10px] text-gray-400">Streak</div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roster</h1>
          <p className="text-sm text-gray-500">{allPlayers.length} players across {teams.length} teams</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCreatePlayer(true)}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700">
            + Add Player
          </button>
          <button onClick={() => setShowCreateTeam(true)}
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 border border-gray-200">
            + Create Team
          </button>
        </div>
      </div>

      {/* Omnisearch */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          placeholder="Search players, teams, positions, emails, phones..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Tabs + Filters */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {[
            { key: 'all', label: `All Players (${allPlayers.length})` },
            { key: 'byTeam', label: `By Team (${teams.length})` },
            { key: 'unassigned', label: `Unassigned (${unassigned.length})` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${tab === t.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-green-500 outline-none">
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterPosition} onChange={e => setFilterPosition(e.target.value)}
            className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-green-500 outline-none">
            <option value="">All Positions</option>
            {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-green-500 outline-none">
            <option value="name">Name</option>
            <option value="xp">XP</option>
            <option value="level">Level</option>
            <option value="streak">Streak</option>
          </select>
          <div className="flex bg-gray-200 rounded-lg p-0.5">
            <button onClick={() => setViewMode('cards')}
              className={`px-2 py-1 text-xs rounded-md ${viewMode === 'cards' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
            </button>
            <button onClick={() => setViewMode('list')}
              className={`px-2 py-1 text-xs rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <svg className="animate-spin h-8 w-8 text-green-600 mx-auto" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : tab === 'byTeam' ? (
        /* By Team view — collapsible team sections */
        <div className="space-y-3">
          {filteredTeams.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No teams yet</h3>
              <p className="text-gray-500 text-sm mb-4">Create your first team to get started</p>
              <button onClick={() => setShowCreateTeam(true)} className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">Create Team</button>
            </div>
          ) : filteredTeams.map(team => (
            <div key={team.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <button onClick={() => toggleTeam(team.id)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedTeams[team.id] ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                  <div className="text-left">
                    <h3 className="font-bold text-gray-900">{team.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{team.player_count} players</span>
                      {team.age_group && <><span>·</span><span>{team.age_group}</span></>}
                      {team.join_code && <><span>·</span><span className="font-mono text-green-600">#{team.join_code}</span></>}
                    </div>
                  </div>
                </div>
                <Link href={`/admin/teams/${team.id}`} onClick={e => e.stopPropagation()}
                  className="text-xs text-green-600 hover:text-green-700 font-medium px-3 py-1 rounded-lg hover:bg-green-50">
                  Manage
                </Link>
              </button>

              {expandedTeams[team.id] && (
                <div className="border-t border-gray-100 px-5 py-3">
                  {team.players.length === 0 ? (
                    <p className="text-sm text-gray-400 py-4 text-center">No players in this team</p>
                  ) : viewMode === 'cards' ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 py-2">
                      {team.players.map(p => <PlayerCard key={p.id} player={{ ...p, team_name: team.name }} />)}
                    </div>
                  ) : (
                    <div className="divide-y">
                      {team.players.map(p => (
                        <Link key={p.id} href={`/admin/players/${p.id}`}
                          className="flex items-center gap-3 py-2.5 hover:bg-gray-50 px-1 rounded-lg">
                          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {p.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900 truncate">{p.name}</div>
                            <div className="text-xs text-gray-400">{p.email}</div>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            {Array.isArray(p.position) && p.position.map(pos => (
                              <span key={pos} className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">{pos}</span>
                            ))}
                            <span className={`px-2 py-0.5 rounded-full font-medium ${statusColor(p.status)}`}>{p.status || 'active'}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {allPlayers.length === 0 ? 'No players yet' : 'No players match your search'}
          </h3>
          <p className="text-gray-500 text-sm">
            {allPlayers.length === 0 ? 'Add players to your roster' : 'Try adjusting your search or filters'}
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map(p => <PlayerCard key={p.id} player={p} />)}
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
                      {Array.isArray(player.position) ? player.position.map(pos => (
                        <span key={pos} className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium mr-1">{pos}</span>
                      )) : player.position ? (
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

      {/* Create Team Modal */}
      {showCreateTeam && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreateTeam(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create Team</h2>
            <form onSubmit={createTeam} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                <input type="text" value={teamForm.name} onChange={e => setTeamForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age Group</label>
                <input type="text" value={teamForm.age_group} onChange={e => setTeamForm(f => ({ ...f, age_group: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="e.g. U16, U18, Senior" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Season Start</label>
                  <input type="date" value={teamForm.season_start} onChange={e => setTeamForm(f => ({ ...f, season_start: e.target.value }))}
                    className="w-full px-3 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Season End</label>
                  <input type="date" value={teamForm.season_end} onChange={e => setTeamForm(f => ({ ...f, season_end: e.target.value }))}
                    className="w-full px-3 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateTeam(false)} className="flex-1 py-3 bg-gray-100 rounded-lg font-medium">Cancel</button>
                <button type="submit" disabled={creating} className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Player Modal */}
      {showCreatePlayer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreatePlayer(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add Player</h2>
            <form onSubmit={createPlayer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" value={playerForm.name} onChange={e => setPlayerForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={playerForm.email} onChange={e => setPlayerForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="Optional" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" value={playerForm.phone} onChange={e => setPlayerForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="Optional" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
                <select value={playerForm.team_id} onChange={e => setPlayerForm(f => ({ ...f, team_id: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none">
                  <option value="">No team (unassigned)</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                  <select value={playerForm.position} onChange={e => setPlayerForm(f => ({ ...f, position: e.target.value }))}
                    className="w-full px-3 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none">
                    <option value="">Select...</option>
                    {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jersey #</label>
                  <input type="number" value={playerForm.jersey_number} onChange={e => setPlayerForm(f => ({ ...f, jersey_number: e.target.value }))}
                    className="w-full px-3 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none"
                    min="0" max="99" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreatePlayer(false)} className="flex-1 py-3 bg-gray-100 rounded-lg font-medium">Cancel</button>
                <button type="submit" disabled={creating} className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">
                  {creating ? 'Adding...' : 'Add Player'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
