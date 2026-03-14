'use client';

import { useState, useEffect } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function PublicPlayerLayout({ children }) {
  const { token } = useParams();
  const pathname = usePathname();
  const [showBanner, setShowBanner] = useState(true);
  const [playerResolved, setPlayerResolved] = useState(false);

  useEffect(() => {
    // Check if token resolves by pinging the API
    fetch(`/api/public/${token}`)
      .then(res => { if (res.ok) setPlayerResolved(true); })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    const dismissed = localStorage.getItem('mf_banner_dismissed');
    if (dismissed) setShowBanner(false);
  }, []);

  const dismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem('mf_banner_dismissed', '1');
  };

  const isActive = (path) => {
    if (path === 'profile') return pathname === `/p/${token}`;
    if (path === 'programs') return pathname.includes('/program');
    if (path === 'rewards') return pathname.includes('/rewards');
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Logo Bar */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-gray-900">MatchFit</span>
        </div>
      </header>

      {/* Create Account Banner */}
      {showBanner && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 flex items-center justify-between">
          <p className="text-sm text-emerald-800">
            <span className="font-medium">Create a free account</span> to track progress across devices
          </p>
          <div className="flex items-center gap-2">
            <Link
              href={`/p/${token}?create=1`}
              className="text-xs font-medium bg-emerald-600 text-white px-3 py-1 rounded-full hover:bg-emerald-700 transition-colors"
            >
              Sign Up
            </Link>
            <button
              onClick={dismissBanner}
              className="text-emerald-600 hover:text-emerald-800 p-0.5"
              aria-label="Dismiss"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom Nav */}
      {playerResolved && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex">
          <Link
            href={`/p/${token}`}
            className={`flex-1 flex flex-col items-center py-2.5 text-xs font-medium transition-colors ${
              isActive('profile') ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span className="mt-0.5">Profile</span>
          </Link>
          <Link
            href={`/p/${token}#programs`}
            className={`flex-1 flex flex-col items-center py-2.5 text-xs font-medium transition-colors ${
              isActive('programs') ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
            <span className="mt-0.5">Programs</span>
          </Link>
          <Link
            href={`/p/${token}#rewards`}
            className={`flex-1 flex flex-col items-center py-2.5 text-xs font-medium transition-colors ${
              isActive('rewards') ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span className="mt-0.5">Rewards</span>
          </Link>
        </nav>
      )}
    </div>
  );
}
