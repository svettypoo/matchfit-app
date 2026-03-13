'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '../../../components/BottomNav';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [units, setUnits] = useState('metric');
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('mf_user') || 'null');
    if (!user) { router.push('/'); return; }

    async function load() {
      try {
        const [profRes, statsRes] = await Promise.all([
          fetch(`/api/players/${user.id}`),
          fetch(`/api/players/${user.id}/stats`),
        ]);
        if (profRes.ok) setProfile(await profRes.json());
        if (statsRes.ok) setStats(await statsRes.json());
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  function handleLogout() {
    localStorage.removeItem('mf_user');
    localStorage.removeItem('mf_role');
    localStorage.removeItem('mf_profile');
    router.push('/');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin text-4xl">&#9917;</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b px-4 py-3">
        <h1 className="font-bold text-lg text-gray-900">Profile</h1>
      </div>

      <div className="px-4 pt-6 space-y-4">
        {/* Avatar & Name */}
        <div className="text-center">
          <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-3">
            {profile?.name?.[0]?.toUpperCase() || 'P'}
          </div>
          <h2 className="text-xl font-bold text-gray-900">{profile?.name || 'Player'}</h2>
          <p className="text-gray-500 text-sm">{profile?.team_name || 'No Team'}</p>
          <div className="flex justify-center gap-2 mt-2">
            {profile?.positions?.map(p => (
              <span key={p} className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">{p}</span>
            ))}
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Level', value: stats?.level || 1, icon: '&#11088;' },
            { label: 'Total XP', value: stats?.xp?.toLocaleString() || '0', icon: '&#128171;' },
            { label: 'Streak', value: `${stats?.streak || 0}d`, icon: '&#128293;' },
            { label: 'Workouts', value: stats?.total_workouts || 0, icon: '&#128170;' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
              <div className="text-lg" dangerouslySetInnerHTML={{ __html: s.icon }} />
              <div className="font-bold text-gray-900 mt-1">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Personal Info */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-3">Personal Info</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="text-gray-900">{profile?.email || '--'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Age</span><span className="text-gray-900">{profile?.age || '--'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Height</span><span className="text-gray-900">{profile?.height ? `${profile.height}cm` : '--'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Weight</span><span className="text-gray-900">{profile?.weight ? `${profile.weight}kg` : '--'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Member Since</span><span className="text-gray-900">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '--'}</span></div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-3">Settings</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Units</span>
              <div className="flex bg-gray-200 rounded-lg p-0.5">
                {['metric', 'imperial'].map(u => (
                  <button key={u} onClick={() => setUnits(u)}
                    className={`px-3 py-1 text-xs font-medium rounded-md capitalize ${
                      units === u ? 'bg-white shadow-sm text-green-700' : 'text-gray-500'
                    }`}>{u}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Notifications</span>
              <button onClick={() => setNotifications(!notifications)}
                className={`w-11 h-6 rounded-full transition-all ${notifications ? 'bg-green-500' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${notifications ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Dark Mode</span>
              <button onClick={() => setDarkMode(!darkMode)}
                className={`w-11 h-6 rounded-full transition-all ${darkMode ? 'bg-green-500' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${darkMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button onClick={() => setEditing(true)}
            className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all">
            Edit Profile
          </button>
          <button onClick={handleLogout}
            className="w-full py-3 bg-red-50 text-red-600 font-semibold rounded-lg hover:bg-red-100 transition-all">
            Logout
          </button>
        </div>
      </div>

      <BottomNav active="profile" />
    </div>
  );
}
