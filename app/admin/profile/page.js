'use client';

import { useState, useEffect } from 'react';

export default function CoachProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ teams: 0, players: 0, programs: 0 });

  useEffect(() => {
    async function load() {
      try {
        const user = JSON.parse(localStorage.getItem('mf_user') || 'null');
        const prof = JSON.parse(localStorage.getItem('mf_profile') || '{}');
        if (!user) return;

        setProfile({ ...prof, ...user });
        setForm({ name: prof.name || user.name || '' });

        const [teamsRes, playersRes, progsRes] = await Promise.all([
          fetch(`/api/teams?coach_id=${user.id}`),
          fetch(`/api/coach/players?coach_id=${user.id}`),
          fetch(`/api/programs?coach_id=${user.id}`),
        ]);

        const t = teamsRes.ok ? await teamsRes.json() : {};
        const pl = playersRes.ok ? await playersRes.json() : {};
        const pr = progsRes.ok ? await progsRes.json() : {};
        setStats({
          teams: t.teams?.length || 0,
          players: pl.players?.length || 0,
          programs: pr.programs?.length || 0,
        });
      } catch (err) {
        console.error('Profile load error:', err);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const user = JSON.parse(localStorage.getItem('mf_user') || 'null');
      const res = await fetch(`/api/players/${user?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name }),
      });
      if (res.ok) {
        setProfile(prev => ({ ...prev, name: form.name }));
        setEditing(false);
      }
    } catch (err) {
      console.error('Save error:', err);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin h-10 w-10 text-green-600" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Coach Profile</h1>

      {/* Avatar & Name */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {(profile?.name || 'C')[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{profile?.name || 'Coach'}</h2>
            <p className="text-gray-500 text-sm">{profile?.email || '--'}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Teams', value: stats.teams, color: 'text-blue-600' },
          { label: 'Players', value: stats.players, color: 'text-green-600' },
          { label: 'Programs', value: stats.programs, color: 'text-purple-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Profile Details */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Details</h3>
          {!editing && (
            <button onClick={() => setEditing(true)}
              className="text-sm text-green-600 hover:text-green-700 font-medium">
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" value={form.name || ''}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => setEditing(false)}
                className="px-4 py-2 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-100">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="text-gray-900">{profile?.name || '--'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="text-gray-900">{profile?.email || '--'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Member Since</span><span className="text-gray-900">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '--'}</span></div>
          </div>
        )}
      </div>

      {/* Account Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-3">Account</h3>
        <p className="text-sm text-gray-500 mb-4">
          Your account is managed through S&T Properties SSO. To change your password or email, visit the SSO portal.
        </p>
        <a href="https://sso.stproperties.com" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
          Manage SSO Account
        </a>
      </div>
    </div>
  );
}
