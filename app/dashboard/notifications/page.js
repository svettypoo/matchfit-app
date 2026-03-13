'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '../../../components/BottomNav';

const NOTIF_ICONS = {
  workout_reminder: { icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z', color: 'bg-blue-100 text-blue-600' },
  workout_complete: { icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'bg-green-100 text-green-600' },
  badge_earned: { icon: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z', color: 'bg-yellow-100 text-yellow-600' },
  program_assigned: { icon: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586', color: 'bg-purple-100 text-purple-600' },
  streak_warning: { icon: 'M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z', color: 'bg-orange-100 text-orange-600' },
  pr_achieved: { icon: 'M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497', color: 'bg-red-100 text-red-600' },
  message: { icon: 'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z', color: 'bg-teal-100 text-teal-600' },
  level_up: { icon: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z', color: 'bg-indigo-100 text-indigo-600' },
  wellness_reminder: { icon: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z', color: 'bg-pink-100 text-pink-600' },
  challenge: { icon: 'M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497', color: 'bg-amber-100 text-amber-600' },
};

function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function load() {
      const user = JSON.parse(localStorage.getItem('mf_user') || '{}');
      if (!user.id) { router.push('/'); return; }
      try {
        const res = await fetch(`/api/players/${user.id}/notifications`);
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
        }
      } catch (err) { console.error(err); }
      setLoading(false);
    }
    load();
  }, [router]);

  async function markAllRead() {
    const user = JSON.parse(localStorage.getItem('mf_user') || '{}');
    try {
      await fetch(`/api/players/${user.id}/notifications`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mark_all_read: true }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) { console.error(err); }
  }

  const filtered = filter === 'all' ? notifications : notifications.filter(n => !n.read);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div>
          <h1 className="font-bold text-lg text-gray-900">Notifications</h1>
          {unreadCount > 0 && <p className="text-xs text-gray-500">{unreadCount} unread</p>}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-xs text-green-600 font-medium hover:text-green-700">
            Mark all read
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="bg-white border-b px-4 py-2 flex gap-2">
        <button onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium ${filter === 'all' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
          All
        </button>
        <button onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium ${filter === 'unread' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
          Unread {unreadCount > 0 && `(${unreadCount})`}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-green-600" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
          <p className="text-gray-500 font-medium">All caught up!</p>
          <p className="text-gray-400 text-sm mt-1">No {filter === 'unread' ? 'unread ' : ''}notifications</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {filtered.map((notif) => {
            const iconDef = NOTIF_ICONS[notif.type] || NOTIF_ICONS.message;
            return (
              <div key={notif.id} className={`px-4 py-3 flex items-start gap-3 transition-colors ${notif.read ? 'bg-white' : 'bg-green-50/50'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconDef.color}`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d={iconDef.icon} />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className={`text-sm ${notif.read ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>{notif.title}</div>
                    {!notif.read && <div className="w-2 h-2 rounded-full bg-green-500 shrink-0 mt-1.5" />}
                  </div>
                  {notif.body && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.body}</p>}
                  <span className="text-[10px] text-gray-400 mt-1 block">{timeAgo(notif.created_at)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
