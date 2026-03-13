'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 border-2 border-white rounded-full" />
          <div className="absolute bottom-20 right-20 w-60 h-60 border-2 border-white rounded-full" />
          <div className="absolute top-1/2 left-1/3 w-20 h-20 border border-white rounded-full" />
          {/* Pitch lines */}
          <div className="absolute top-0 left-1/2 w-px h-full bg-white" />
          <div className="absolute top-1/2 left-1/4 right-1/4 h-px bg-white" />
        </div>
        <div className="relative z-10 text-center">
          <svg className="w-14 h-14 mx-auto mb-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg>
          <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">
            MatchFit
          </h1>
          <p className="text-xl lg:text-2xl text-green-100 font-light max-w-md">
            Train Like A Pro.<br />Play Like A Champion.
          </p>
          <div className="mt-8 flex gap-3 justify-center">
            <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse delay-100" />
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse delay-200" />
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
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
                role === 'player'
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              I'm a Player
            </button>
            <button
              onClick={() => setRole('coach')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
                role === 'coach'
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              I'm a Coach
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : 'Login'}
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
        </div>
      </div>
    </div>
  );
}
