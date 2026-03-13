'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const NAV_ITEMS = [
  { href: '/admin/dashboard', icon: '&#128202;', label: 'Dashboard' },
  { href: '/admin/teams', icon: '&#128101;', label: 'Teams' },
  { href: '/admin/programs', icon: '&#128221;', label: 'Programs' },
  { href: '/admin/exercises', icon: '&#128170;', label: 'Exercises' },
  { href: '/admin/calendar', icon: '&#128197;', label: 'Calendar' },
  { href: '/admin/messages', icon: '&#128172;', label: 'Messages' },
  { href: '/admin/wellness', icon: '&#128154;', label: 'Wellness' },
];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('mf_role');
    if (role !== 'coach') { router.push('/'); return; }
    const user = JSON.parse(localStorage.getItem('mf_user') || '{}');
    setProfile(user);

    async function loadTeams() {
      try {
        const res = await fetch(`/api/teams?coach_id=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setTeams(data.teams || []);
          if (data.teams?.length > 0) setSelectedTeam(data.teams[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadTeams();
  }, [router]);

  function handleLogout() {
    localStorage.clear();
    router.push('/');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-green-800 text-white transform transition-transform duration-200 lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } flex flex-col`}>
        <div className="p-4 border-b border-green-700">
          <div className="flex items-center gap-2">
            <span className="text-2xl">&#9917;</span>
            <span className="font-bold text-lg">MatchFit</span>
          </div>
          <span className="text-xs bg-green-600 px-2 py-0.5 rounded-full mt-1 inline-block">Coach</span>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive ? 'bg-green-700 text-white' : 'text-green-200 hover:bg-green-700/50 hover:text-white'
                }`}>
                <span dangerouslySetInnerHTML={{ __html: item.icon }} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-green-700 space-y-1">
          <Link href="/admin/profile"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-green-200 hover:bg-green-700/50">
            <span>&#128100;</span> Profile
          </Link>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-green-200 hover:bg-red-600/30 hover:text-red-200">
            <span>&#128682;</span> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-1">
            <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-3">
            {teams.length > 0 && (
              <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-green-500 outline-none">
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {profile?.name?.[0]?.toUpperCase() || 'C'}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
