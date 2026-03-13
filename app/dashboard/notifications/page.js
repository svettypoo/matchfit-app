'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '../../../components/BottomNav';

const TYPE_ICONS = {
  message: { icon: '&#128172;', bg: 'bg-blue-100', color: 'text-blue-600' },
  program: { icon: '&#128170;', bg: 'bg-purple-100', color: 'text-purple-600' },
  badge: { icon: '&#127942;', bg: 'bg-yellow-100', color: 'text-yellow-600' },
  streak: { icon: '&#128293;', bg: 'bg-orange-100', color: 'text-orange-600' },
  system: { icon: '&#128276;', bg: 'bg-gray-100', color: 'text-gray-600' },
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
            <div className="animate-spin text-3xl mb-2">&#9917;</div>
            <p className="text-gray-500 text-sm">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-2">&#128276;</div>
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
                  <span className={`text-lg ${typeConfig.color}`} dangerouslySetInnerHTML={{ __html: typeConfig.icon }} />
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
