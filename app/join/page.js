'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function JoinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState('');
  const [team, setTeam] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [signupLoading, setSignupLoading] = useState(false);

  // Auto-fill code from email link (?code=XXXXXX)
  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode && urlCode.length >= 6) {
      const c = urlCode.slice(0, 6).toUpperCase();
      setCode(c);
      // Auto-validate
      (async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/invite/${c}`);
          const data = await res.json();
          if (res.ok) setTeam(data);
          else setError(data.error || 'Invalid code');
        } catch (err) {
          setError(err.message);
        }
        setLoading(false);
      })();
    }
  }, [searchParams]);

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
          <svg className="w-12 h-12 mx-auto mb-3 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" /></svg>
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
              <svg className="w-6 h-6 text-green-600 mx-auto mb-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .982-3.172M8.25 8.75a4.875 4.875 0 0 1 7.5 0M12 3v1.5" /></svg>
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
