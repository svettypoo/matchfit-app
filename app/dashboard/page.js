'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BottomNav from '../../components/BottomNav';
import WellnessModal from '../../components/WellnessModal';
import WorkoutCard from '../../components/WorkoutCard';
import StatsCard from '../../components/StatsCard';

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [todayWorkout, setTodayWorkout] = useState(null);
  const [stats, setStats] = useState(null);
  const [showWellness, setShowWellness] = useState(false);
  const [wellnessDone, setWellnessDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState(0);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('mf_user') || 'null');
    if (!user) { router.push('/'); return; }

    async function load() {
      try {
        const [profRes, workoutRes, statsRes, notifRes] = await Promise.all([
          fetch(`/api/players/${user.id}`),
          fetch(`/api/players/${user.id}/today-workout`),
          fetch(`/api/players/${user.id}/stats`),
          fetch(`/api/players/${user.id}/notifications?unread=true`),
        ]);
        if (profRes.ok) {
          const p = await profRes.json();
          setProfile(p);
        }
        if (workoutRes.ok) setTodayWorkout(await workoutRes.json());
        if (statsRes.ok) setStats(await statsRes.json());
        if (notifRes.ok) {
          const n = await notifRes.json();
          setNotifications(n.count || 0);
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-3">&#9917;</div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Top Bar */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <span className="text-xl">&#9917;</span>
          <span className="font-bold text-green-700 text-lg">MatchFit</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/notifications" className="relative p-2">
            <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {notifications > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {notifications > 9 ? '9+' : notifications}
              </span>
            )}
          </Link>
          <Link href="/dashboard/profile" className="w-9 h-9 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {profile?.name?.[0]?.toUpperCase() || 'P'}
          </Link>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{greeting}, {profile?.name?.split(' ')[0] || 'Player'}!</h1>
          <p className="text-gray-500 text-sm">{today}</p>
        </div>

        {/* Wellness Check-In Banner */}
        {!wellnessDone && (
          <button
            onClick={() => setShowWellness(true)}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-4 flex items-center justify-between shadow-lg hover:shadow-xl transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">&#128578;</span>
              <div className="text-left">
                <div className="font-semibold">How are you feeling?</div>
                <div className="text-green-100 text-sm">Complete your daily wellness check-in</div>
              </div>
            </div>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Today's Workout */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Today's Workout</h2>
          {todayWorkout ? (
            <WorkoutCard workout={todayWorkout} />
          ) : (
            <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-green-200">
              <div className="text-4xl mb-2">&#128564;</div>
              <h3 className="font-semibold text-gray-900">Rest Day</h3>
              <p className="text-gray-500 text-sm">Recovery is part of the process. Stay hydrated!</p>
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          <StatsCard icon="&#128293;" label="Streak" value={stats?.streak || 0} suffix=" days" />
          <StatsCard icon="&#11088;" label="XP Level" value={stats?.level || 1} />
          <StatsCard icon="&#128200;" label="Weekly" value={stats?.weekly_compliance || 0} suffix="%" />
          <StatsCard icon="&#128154;" label="Readiness" value={stats?.readiness || '--'} suffix={stats?.readiness ? '/100' : ''} />
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { href: '/dashboard/calendar', icon: '&#128197;', label: 'Calendar' },
            { href: '/dashboard/leaderboard', icon: '&#127942;', label: 'Board' },
            { href: '/dashboard/badges', icon: '&#127941;', label: 'Badges' },
            { href: '/dashboard/messages', icon: '&#128172;', label: 'Messages' },
          ].map(link => (
            <Link key={link.href} href={link.href}
              className="bg-white rounded-xl p-3 text-center shadow-sm hover:shadow-md transition-all border border-gray-100">
              <div className="text-2xl mb-1" dangerouslySetInnerHTML={{ __html: link.icon }} />
              <div className="text-xs text-gray-600 font-medium">{link.label}</div>
            </Link>
          ))}
        </div>
      </div>

      {showWellness && (
        <WellnessModal
          onClose={() => setShowWellness(false)}
          onComplete={() => { setWellnessDone(true); setShowWellness(false); }}
        />
      )}

      <BottomNav active="home" />
    </div>
  );
}
