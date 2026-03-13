'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState('player');
  const [form, setForm] = useState({ name: '', email: '', password: '', team_name: '', join_code: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field, val) {
    setForm(f => ({ ...f, [field]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const body = { ...form, role };
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Signup failed');
      localStorage.setItem('mf_user', JSON.stringify(data.user));
      localStorage.setItem('mf_role', data.role || role);
      localStorage.setItem('mf_profile', JSON.stringify(data.profile || {}));
      if (role === 'coach') {
        router.push('/admin');
      } else {
        router.push('/onboarding');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Hero */}
      <div className="lg:w-1/2 bg-gradient-to-br from-green-700 via-green-800 to-green-900 flex flex-col items-center justify-center p-8 lg:p-16 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-48 h-48 border-2 border-white rounded-full" />
          <div className="absolute bottom-10 left-10 w-32 h-32 border border-white rounded-full" />
        </div>
        <div className="relative z-10 text-center">
          <svg className="w-14 h-14 mx-auto mb-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg>
          <h1 className="text-5xl font-extrabold tracking-tight mb-4">Join MatchFit</h1>
          <p className="text-xl text-green-100 font-light max-w-md">
            Your personalized soccer fitness journey starts here.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
          <p className="text-gray-500 mb-6">Get started with your free account</p>

          {/* Role Toggle */}
          <div className="flex bg-gray-200 rounded-lg p-1 mb-6">
            <button
              onClick={() => setRole('coach')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
                role === 'coach' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'
              }`}
            >
              Coach
            </button>
            <button
              onClick={() => setRole('player')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
                role === 'player' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'
              }`}
            >
              Player
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => update('name', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                placeholder="Your full name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={e => update('password', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                placeholder="Min 8 characters"
                required
                minLength={8}
              />
            </div>

            {role === 'coach' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                <input
                  type="text"
                  value={form.team_name}
                  onChange={e => update('team_name', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  placeholder="e.g. FC Lightning U16"
                  required
                />
              </div>
            )}

            {role === 'player' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Join Code</label>
                <input
                  type="text"
                  value={form.join_code}
                  onChange={e => update('join_code', e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none tracking-widest text-center font-mono text-lg"
                  placeholder="ABC123"
                  maxLength={6}
                />
                <p className="text-xs text-gray-400 mt-1">Get this from your coach</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/" className="text-green-600 hover:text-green-700 font-medium">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
