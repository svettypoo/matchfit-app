'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '../../../components/BottomNav';

const TYPE_ICONS = {
  message: { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>, bg: 'bg-blue-100', color: 'text-blue-600' },
  program: { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>, bg: 'bg-purple-100', color: 'text-purple-600' },
  badge: { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0116.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228M15.003 11.172a7.454 7.454 0 010M9.497 14.25a7.454 7.454 0 010" /></svg>, bg: 'bg-yellow-100', color: 'text-yellow-600' },
  streak: { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" /></svg>, bg: 'bg-orange-100', color: 'text-orange-600' },
  system: { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>, bg: 'bg-gray-100', color: 'text-gray-600' },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const user = JSON.parse(localStorage.getItem('mf_user') || '{}');
      try {
        const res = await fetch(`/api/players/${user.id}/notifications`);
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function markRead(notifId) {
    const user = JSON.parse(localStorage.getItem('mf_user') || '{}');
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
    try {
      await fetch(`/api/players/${user.id}/notifications/${notifId}`, { method: 'PATCH' });
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <h1 className="font-bold text-lg text-gray-900">Notifications</h1>
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="px-4 pt-4 space-y-2">
        {loading ? (
          <div className="text-center py-12">
            <svg className="w-7 h-7 animate-spin text-green-600 mb-2 mx-auto" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            <p className="text-gray-500 text-sm">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
            <p className="text-gray-500">No notifications yet</p>
            <p className="text-gray-400 text-sm">We'll let you know when something happens</p>
          </div>
        ) : (
          notifications.map(n => {
            const typeConfig = TYPE_ICONS[n.type] || TYPE_ICONS.system;
            return (
              <button key={n.id} onClick={() => markRead(n.id)}
                className={`w-full text-left bg-white rounded-xl p-4 flex items-start gap-3 shadow-sm transition-all ${
                  !n.read ? 'border-l-4 border-green-500' : 'border border-gray-100'
                }`}>
                <div className={`w-10 h-10 rounded-full ${typeConfig.bg} flex items-center justify-center flex-shrink-0`}>
                  <span className={`${typeConfig.color}`}>{typeConfig.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`text-sm ${!n.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>{n.title}</h3>
                    {!n.read && <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-1.5" />}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                  <span className="text-xs text-gray-400 mt-1 block">{timeAgo(n.created_at)}</span>
                </div>
              </button>
            );
          })
        )}
      </div>

      <BottomNav active="home" />
    </div>
  );
}
