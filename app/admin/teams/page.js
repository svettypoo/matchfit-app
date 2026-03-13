'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', age_group: '', season_start: '', season_end: '' });
  const [creating, setCreating] = useState(false);
  const [viewMode, setViewMode] = useState('cards');

  useEffect(() => { loadTeams(); }, []);

  async function loadTeams() {
    const user = JSON.parse(localStorage.getItem('mf_user') || '{}');
    try {
      const res = await fetch(`/api/teams?coach_id=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setTeams(data.teams || []);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  async function createTeam(e) {
    e.preventDefault();
    setCreating(true);
    const user = JSON.parse(localStorage.getItem('mf_user') || '{}');
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, coach_id: user.id }),
      });
      if (res.ok) {
        setShowCreate(false);
        setForm({ name: '', age_group: '', season_start: '', season_end: '' });
        loadTeams();
      }
    } catch (err) {
      console.error(err);
    }
    setCreating(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
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
          <button onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700">
            + Create Team
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12"><svg className="animate-spin h-8 w-8 text-green-600 mx-auto" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>
      ) : teams.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No teams yet</h3>
          <p className="text-gray-500 text-sm mb-4">Create your first team to get started</p>
          <button onClick={() => setShowCreate(true)}
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">
            Create Team
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map(team => (
            <Link key={team.id} href={`/admin/teams/${team.id}`}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900">{team.name}</h3>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{team.age_group || 'All ages'}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>{team.player_count || 0} players</span>
              </div>
              {team.season_start && (
                <div className="text-xs text-gray-400 mt-2">
                  Season: {new Date(team.season_start).toLocaleDateString()} - {team.season_end ? new Date(team.season_end).toLocaleDateString() : 'TBD'}
                </div>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Players</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Age Group</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Season</th>
              </tr>
            </thead>
            <tbody>
              {teams.map(team => (
                <tr key={team.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/teams/${team.id}`} className="font-medium text-green-600 hover:text-green-700">
                      {team.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{team.player_count || 0}</td>
                  <td className="px-4 py-3 text-gray-600">{team.age_group || '--'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {team.season_start ? new Date(team.season_start).toLocaleDateString() : '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create Team</h2>
            <form onSubmit={createTeam} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age Group</label>
                <input type="text" value={form.age_group} onChange={e => setForm(f => ({ ...f, age_group: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="e.g. U16, U18, Senior" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Season Start</label>
                  <input type="date" value={form.season_start} onChange={e => setForm(f => ({ ...f, season_start: e.target.value }))}
                    className="w-full px-3 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Season End</label>
                  <input type="date" value={form.season_end} onChange={e => setForm(f => ({ ...f, season_end: e.target.value }))}
                    className="w-full px-3 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 py-3 bg-gray-100 rounded-lg font-medium">Cancel</button>
                <button type="submit" disabled={creating}
                  className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
