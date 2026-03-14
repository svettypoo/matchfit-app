'use client';

import { useState } from 'react';

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
  // SSO handles all login — middleware redirects to SSO portal
  // This page is a fallback in case middleware doesn't catch it
  useState(() => {
    window.location.href = 'https://sso.stproperties.com?return_to=' + encodeURIComponent(window.location.origin + '/admin');
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-700 via-green-800 to-green-900">
      <div className="text-center text-white">
        <div className="flex items-center justify-center gap-3 mb-4">
          <svg className="w-10 h-10 text-green-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
          <h1 className="text-4xl font-extrabold">MatchFit</h1>
        </div>
        <p className="text-green-200 mb-6">Redirecting to sign in...</p>
        <a href="https://sso.stproperties.com" className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-all">
          Sign in with S&T SSO
        </a>
      </div>
    </div>
  );
}
