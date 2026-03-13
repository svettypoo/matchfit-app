'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [team, setTeam] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [signupLoading, setSignupLoading] = useState(false);

  async function validateCode() {
    if (code.length !== 6) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/invite/${code}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid code');
      setTeam(data);
    } catch (err) {
      setError(err.message);
      setTeam(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    setError('');
    setSignupLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role: 'player', join_code: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Signup failed');
      localStorage.setItem('mf_user', JSON.stringify(data.user));
      localStorage.setItem('mf_role', 'player');
      localStorage.setItem('mf_profile', JSON.stringify(data.profile || {}));
      router.push('/onboarding');
    } catch (err) {
      setError(err.message);
    } finally {
      setSignupLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">&#9917;</div>
          <h1 className="text-3xl font-bold text-gray-900">Join a Team</h1>
          <p className="text-gray-500 mt-1">Enter your 6-character team code</p>
        </div>

        {!team ? (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex justify-center mb-6">
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase().slice(0, 6))}
                className="text-center text-3xl font-mono tracking-[0.5em] w-64 py-4 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none uppercase"
                placeholder="______"
                maxLength={6}
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 text-center">{error}</div>
            )}

            <button
              onClick={validateCode}
              disabled={code.length !== 6 || loading}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Validate Code'}
            </button>

            <p className="text-center text-sm text-gray-400 mt-4">
              <Link href="/" className="text-green-600 hover:text-green-700">Back to Login</Link>
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-8 animate-slide-up">
            {/* Team Info */}
            <div className="text-center mb-6 p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="text-2xl mb-1">&#127942;</div>
              <h3 className="font-bold text-green-800 text-lg">{team.team_name}</h3>
              <p className="text-green-600 text-sm">Coach: {team.coach_name}</p>
            </div>

            <h3 className="font-semibold text-gray-900 mb-4">Create your account to join</h3>

            <form onSubmit={handleSignup} className="space-y-4">
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                placeholder="Your full name"
                required
              />
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                placeholder="Email address"
                required
              />
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                placeholder="Create password"
                required
                minLength={8}
              />

              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
              )}

              <button
                type="submit"
                disabled={signupLoading}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
              >
                {signupLoading ? 'Joining...' : `Join ${team.team_name}`}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
