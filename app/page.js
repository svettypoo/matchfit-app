'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const FEATURES = [
  { icon: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z', title: 'Smart Programs', desc: 'Build & assign periodized training programs with drag-and-drop ease' },
  { icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z', title: 'Real-Time Analytics', desc: 'Track load management, 1RM progression, injury risk, and wellness' },
  { icon: 'M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z', title: 'Gamification', desc: 'XP, streaks, badges, and leaderboards that keep athletes coming back' },
  { icon: 'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z', title: 'Team Management', desc: 'Invite via code, manage rosters, communicate, and monitor wellness' },
];

const STATS = [
  { value: '100+', label: 'Exercises' },
  { value: '8', label: 'Categories' },
  { value: '3', label: 'Exercise Types' },
  { value: '24/7', label: 'Access' },
];

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState('player');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem('mf_user', JSON.stringify(data.user));
      localStorage.setItem('mf_role', data.role || role);
      localStorage.setItem('mf_profile', JSON.stringify(data.profile || {}));
      if (data.role === 'coach' || role === 'coach') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Hero Left Side */}
      <div className="lg:w-1/2 bg-gradient-to-br from-green-700 via-green-800 to-green-900 flex flex-col items-center justify-center p-8 lg:p-16 text-white relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 border-2 border-white rounded-full animate-pulse" />
          <div className="absolute bottom-20 right-20 w-60 h-60 border-2 border-white rounded-full animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/3 w-20 h-20 border border-white rounded-full animate-pulse delay-500" />
          <div className="absolute top-0 left-1/2 w-px h-full bg-white" />
          <div className="absolute top-1/2 left-1/4 right-1/4 h-px bg-white" />
        </div>

        <div className="relative z-10 text-center max-w-lg">
          <div className="flex items-center justify-center gap-3 mb-6">
            <svg className="w-12 h-12 text-green-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
            <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight">MatchFit</h1>
          </div>
          <p className="text-xl lg:text-2xl text-green-100 font-light mb-4">
            Train Like A Pro. Play Like A Champion.
          </p>
          <p className="text-green-200/80 text-sm lg:text-base max-w-md mx-auto mb-8">
            The all-in-one platform connecting coaches with athletes. Build programs, track performance, manage wellness, and gamify training.
          </p>

          {/* Feature highlights */}
          <div className="grid grid-cols-2 gap-3 text-left mb-8">
            {FEATURES.map((f, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 hover:bg-white/15 transition-all">
                <svg className="w-5 h-5 text-green-300 mb-1.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={f.icon} /></svg>
                <div className="font-semibold text-sm text-white">{f.title}</div>
                <div className="text-[11px] text-green-200/70 leading-tight mt-0.5">{f.desc}</div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-6">
            {STATS.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-[10px] text-green-300 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Login Right Side */}
      <div className="lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
          <p className="text-gray-500 mb-8">Sign in to continue your training</p>

          {/* Role Toggle */}
          <div className="flex bg-gray-200 rounded-lg p-1 mb-6">
            <button
              onClick={() => setRole('player')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${
                role === 'player'
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
              I'm an Athlete
            </button>
            <button
              onClick={() => setRole('coach')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${
                role === 'coach'
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" /></svg>
              I'm a Coach
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                placeholder="you@example.com" required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                placeholder="Enter your password" required
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Signing in...
                </span>
              ) : `Sign in as ${role === 'coach' ? 'Coach' : 'Athlete'}`}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <Link href="/signup" className="text-green-600 hover:text-green-700 text-sm font-medium">
              Don't have an account? Sign Up
            </Link>
            <br />
            <Link href="/forgot-password" className="text-gray-400 hover:text-gray-500 text-sm">
              Forgot Password?
            </Link>
          </div>

          {/* Role-specific benefits */}
          <div className="mt-8 bg-green-50 rounded-xl p-4 border border-green-200">
            <h4 className="font-semibold text-green-800 text-sm mb-2">
              {role === 'coach' ? 'Coach Benefits' : 'Athlete Benefits'}
            </h4>
            {role === 'coach' ? (
              <ul className="text-xs text-green-700 space-y-1.5">
                <li className="flex items-center gap-2"><svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Drag-and-drop program builder with periodization</li>
                <li className="flex items-center gap-2"><svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Load management & injury risk analytics</li>
                <li className="flex items-center gap-2"><svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Wellness monitoring with actionable alerts</li>
                <li className="flex items-center gap-2"><svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Team feed, challenges, and communication tools</li>
              </ul>
            ) : (
              <ul className="text-xs text-green-700 space-y-1.5">
                <li className="flex items-center gap-2"><svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Guided workouts with rest timers & exercise demos</li>
                <li className="flex items-center gap-2"><svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Track every rep, set, and PR with beautiful charts</li>
                <li className="flex items-center gap-2"><svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Earn XP, badges, and climb the leaderboard</li>
                <li className="flex items-center gap-2"><svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Team feed to cheer on teammates & share PRs</li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
