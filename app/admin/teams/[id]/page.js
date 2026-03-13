'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PlayerRow from '../../../../components/PlayerRow';

export default function TeamDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [team, setTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [filter, setFilter] = useState({ position: '', status: '' });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [teamRes, playersRes] = await Promise.all([
          fetch(`/api/teams/${id}`),
          fetch(`/api/teams/${id}/players`),
        ]);
        if (teamRes.ok) setTeam(await teamRes.json());
        if (playersRes.ok) {
          const data = await playersRes.json();
          setPlayers(data.players || []);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function sendInvite() {
    if (!inviteEmail) return;
    setInviting(true);
    try {
      await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_id: id, email: inviteEmail }),
      });
      setInviteEmail('');
    } catch (err) {
      console.error(err);
    }
    setInviting(false);
  }

  function copyJoinLink() {
    const link = `${window.location.origin}/join?code=${team?.join_code || ''}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const filtered = players.filter(p => {
    if (filter.position && !p.positions?.includes(filter.position)) return false;
    if (filter.status && p.status !== filter.status) return false;
    return true;
  });

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin text-4xl">&#9917;</div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Team Header */}
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600 mb-1 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Teams
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{team?.name || 'Team'}</h1>
          <p className="text-sm text-gray-500">{team?.age_group || ''} | {players.length} players</p>
        </div>
        <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
          Edit Team
        </button>
      </div>

      {/* Invite Section */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-3">Invite Players</h3>
        <div className="flex gap-2 mb-3">
          <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none text-sm"
            placeholder="player@email.com" />
          <button onClick={sendInvite} disabled={inviting}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
            {inviting ? 'Sending...' : 'Send Invite'}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={copyJoinLink}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center justify-center gap-2">
            {copied ? '✓ Copied!' : '🔗 Copy Join Link'}
          </button>
          <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 text-center">
            <div className="text-xs text-gray-400">Join Code</div>
            <div className="font-mono font-bold text-lg tracking-wider text-green-700">{team?.join_code || '------'}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <select value={filter.position} onChange={e => setFilter(f => ({ ...f, position: e.target.value }))}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-green-500 outline-none">
          <option value="">All Positions</option>
          {['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST', 'CF'].map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-green-500 outline-none">
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="injured">Injured</option>
        </select>
      </div>

      {/* Player Roster */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Player</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Position</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Age</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Streak</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Compliance</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">XP</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No players found</td></tr>
              ) : (
                filtered.map(player => (
                  <PlayerRow key={player.id} player={player} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
