'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) { router.push('/'); return; }
        const data = await res.json();
        if (data.role === 'coach') { router.push('/admin/dashboard'); return; }
        if (!data.role) { router.push('/'); return; }
        // Store in localStorage for child pages that read it
        localStorage.setItem('mf_user', JSON.stringify(data.user));
        localStorage.setItem('mf_role', data.role);
        localStorage.setItem('mf_profile', JSON.stringify(data.profile || {}));
        setReady(true);
      } catch (err) {
        console.error('Dashboard auth error:', err);
        router.push('/');
      }
    }
    checkAuth();
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <svg className="animate-spin h-10 w-10 text-green-600" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return <>{children}</>;
}
