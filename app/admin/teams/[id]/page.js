'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PlayerRow from '../../../../components/PlayerRow';

const POSITIONS = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST', 'CF'];

export default function TeamDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [team, setTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ position: '', status: '' });
  const [copied, setCopied] = useState(false);

  // Bulk invite state
  const [bulkEmails, setBulkEmails] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState(null);

  // Add player directly state
  const [directName, setDirectName] = useState('');
  const [directEmail, setDirectEmail] = useState('');
  const [directPosition, setDirectPosition] = useState('');
  const [addingPlayer, setAddingPlayer] = useState(false);
  const [addPlayerMsg, setAddPlayerMsg] = useState(null);

  // Invites list state
  const [invites, setInvites] = useState([]);
  const [invitesLoading, setInvitesLoading] = useState(true);

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
          setPlayers(data.players || data || []);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  // Load invites
  useEffect(() => {
    async function loadInvites() {
      try {
        const res = await fetch(`/api/invite?team_id=${id}`);
        if (res.ok) {
          const data = await res.json();
          setInvites(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error(err);
      }
      setInvitesLoading(false);
    }
    loadInvites();
  }, [id]);

  // Bulk invite send
  async function sendBulkInvites() {
    const raw = bulkEmails.trim();
    if (!raw) return;
    // Parse emails: split by newlines, commas, or semicolons
    const emails = raw
      .split(/[\n,;]+/)
      .map(e => e.trim().toLowerCase())
      .filter(e => e && e.includes('@'));
    if (emails.length === 0) {
      setInviteMsg({ type: 'error', text: 'No valid emails found' });
      return;
    }
    setInviting(true);
    setInviteMsg(null);
    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_id: id, emails }),
      });
      const data = await res.json();
      if (res.ok) {
        const count = data.invites?.length || emails.length;
        setInviteMsg({ type: 'success', text: `${count} invite${count !== 1 ? 's' : ''} sent successfully!` });
        setBulkEmails('');
        // Refresh invites list
        const invRes = await fetch(`/api/invite?team_id=${id}`);
        if (invRes.ok) setInvites(await invRes.json());
      } else {
        setInviteMsg({ type: 'error', text: data.error || 'Failed to send invites' });
      }
    } catch (err) {
      console.error(err);
      setInviteMsg({ type: 'error', text: 'Network error sending invites' });
    }
    setInviting(false);
  }

  // Add player directly
  async function addPlayerDirectly() {
    if (!directName || !directEmail || !directPosition) {
      setAddPlayerMsg({ type: 'error', text: 'All fields are required' });
      return;
    }
    setAddingPlayer(true);
    setAddPlayerMsg(null);
    try {
      const res = await fetch(`/api/teams/${id}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: directName, email: directEmail, position: directPosition }),
      });
      const data = await res.json();
      if (res.ok) {
        setAddPlayerMsg({ type: 'success', text: `${directName} added to the team!` });
        setDirectName('');
        setDirectEmail('');
        setDirectPosition('');
        // Refresh players list
        const plRes = await fetch(`/api/teams/${id}/players`);
        if (plRes.ok) {
          const plData = await plRes.json();
          setPlayers(plData.players || plData || []);
        }
      } else {
        setAddPlayerMsg({ type: 'error', text: data.error || 'Failed to add player' });
      }
    } catch (err) {
      console.error(err);
      setAddPlayerMsg({ type: 'error', text: 'Network error adding player' });
    }
    setAddingPlayer(false);
  }

  function copyJoinLink() {
    const link = `${window.location.origin}/join?code=${team?.join_code || ''}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const filtered = players.filter(p => {
    if (filter.position && !p.positions?.includes(filter.position) && p.position !== filter.position) return false;
    if (filter.status && p.status !== filter.status) return false;
    return true;
  });

  const pendingCount = invites.filter(i => i.status === 'pending').length;

  const joinLink = typeof window !== 'undefined'
    ? `${window.location.origin}/join?code=${team?.join_code || '------'}`
    : `https://matchfit.app/join?code=${team?.join_code || '------'}`;

  if (loading) {
    return <div className="flex items-center justify-center py-20"><svg className="animate-spin h-10 w-10 text-green-600" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>;
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

      {/* Add Player Directly */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-3">Add Player Directly</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
          <input type="text" value={directName} onChange={e => setDirectName(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none text-sm"
            placeholder="Player name" />
          <input type="email" value={directEmail} onChange={e => setDirectEmail(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none text-sm"
            placeholder="player@email.com" />
          <select value={directPosition} onChange={e => setDirectPosition(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none text-sm">
            <option value="">Select Position</option>
            {POSITIONS.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <button onClick={addPlayerDirectly} disabled={addingPlayer}
          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
          {addingPlayer ? 'Adding...' : 'Add Player'}
        </button>
        {addPlayerMsg && (
          <p className={`mt-2 text-sm ${addPlayerMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {addPlayerMsg.text}
          </p>
        )}
      </div>

      {/* Bulk Invite Section */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-3">Invite Players</h3>
        <textarea
          value={bulkEmails}
          onChange={e => setBulkEmails(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none text-sm resize-none"
          rows={4}
          placeholder={"Enter emails (one per line or comma-separated)\nplayer1@email.com\nplayer2@email.com, player3@email.com"}
        />
        <div className="flex gap-2 mt-3">
          <button onClick={sendBulkInvites} disabled={inviting}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
            {inviting ? 'Sending...' : 'Send Invites'}
          </button>
          <button onClick={copyJoinLink}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
            {copied ? '✓ Copied!' : '🔗 Copy Join Link'}
          </button>
          <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 text-center">
            <div className="text-xs text-gray-400">Join Code</div>
            <div className="font-mono font-bold text-lg tracking-wider text-green-700">{team?.join_code || '------'}</div>
          </div>
        </div>
        {inviteMsg && (
          <p className={`mt-2 text-sm ${inviteMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {inviteMsg.text}
          </p>
        )}

        {/* Invite Email Preview */}
        <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-green-600 px-4 py-3">
            <h4 className="text-white font-semibold text-sm">Invite Email Preview</h4>
          </div>
          <div className="p-4 bg-gray-50 text-sm text-gray-700 space-y-3">
            <p>
              You&apos;ve been invited to join <strong>{team?.name || 'Team'}</strong> on MatchFit!
              Click the link below to accept your invitation and start training with your team.
            </p>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Join Code</p>
              <p className="font-mono font-bold text-green-700 text-lg">{team?.join_code || '------'}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Join Link</p>
              <p className="text-green-600 text-sm break-all">{joinLink}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Invited Teammates */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">
            Invited Teammates
            {pendingCount > 0 && (
              <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                {pendingCount} pending
              </span>
            )}
          </h3>
        </div>
        {invitesLoading ? (
          <div className="px-4 py-8 text-center text-gray-400">Loading invites...</div>
        ) : invites.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-400">No invites sent yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Sent</th>
                </tr>
              </thead>
              <tbody>
                {invites.map(inv => (
                  <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{inv.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        inv.status === 'accepted' ? 'bg-green-100 text-green-700' :
                        inv.status === 'expired' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {inv.created_at ? new Date(inv.created_at).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <select value={filter.position} onChange={e => setFilter(f => ({ ...f, position: e.target.value }))}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-green-500 outline-none">
          <option value="">All Positions</option>
          {POSITIONS.map(p => (
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
