'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '../../../components/BottomNav';

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'workouts', label: 'Workouts' },
  { key: 'prs', label: 'PRs' },
  { key: 'announcements', label: 'Announcements' },
];

const ICONS = {
  dumbbell: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
    </svg>
  ),
  trophy: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0116.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.003 6.003 0 01-5.54 0" />
    </svg>
  ),
  badge: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
    </svg>
  ),
  megaphone: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
    </svg>
  ),
  fire: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
    </svg>
  ),
};

const TYPE_COLORS = {
  workout: 'bg-blue-100 text-blue-600',
  pr: 'bg-yellow-100 text-yellow-600',
  badge: 'bg-purple-100 text-purple-600',
  announcement: 'bg-green-100 text-green-600',
  challenge: 'bg-orange-100 text-orange-600',
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function FeedItem({ item, currentUserId, onReact, onToggleComments }) {
  const iconKey = item.icon || 'dumbbell';
  const colorClass = TYPE_COLORS[item.type] || 'bg-gray-100 text-gray-600';
  const hasLiked = item.reactions?.includes(currentUserId);

  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border ${item.pinned ? 'border-green-300 ring-1 ring-green-200' : 'border-gray-100'}`}>
      {item.pinned && (
        <div className="flex items-center gap-1 text-xs text-green-600 font-medium mb-2">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
          Pinned
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
          {ICONS[iconKey] || ICONS.dumbbell}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{item.title}</p>
          {item.subtitle && (
            <p className="text-sm text-gray-500 mt-0.5">{item.subtitle}</p>
          )}
          {item.image_url && (
            <img
              src={item.image_url}
              alt=""
              className="mt-2 rounded-lg max-h-48 object-cover w-full"
            />
          )}

          {/* Progress bar for challenges */}
          {item.type === 'challenge' && item.progress_pct !== undefined && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>{item.progress_pct}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full transition-all"
                  style={{ width: `${item.progress_pct}%` }}
                />
              </div>
            </div>
          )}

          {/* Timestamp + actions */}
          <div className="flex items-center gap-4 mt-2">
            <span className="text-xs text-gray-400">{timeAgo(item.timestamp)}</span>

            {/* Like button */}
            <button
              onClick={() => onReact(item)}
              className={`flex items-center gap-1 text-xs transition-colors ${
                hasLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
              }`}
            >
              <svg className="w-4 h-4" fill={hasLiked ? 'currentColor' : 'none'} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              {item.reaction_count > 0 && <span>{item.reaction_count}</span>}
            </button>

            {/* Comment button */}
            <button
              onClick={() => onToggleComments(item)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-green-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
              </svg>
              {item.comment_count > 0 && <span>{item.comment_count}</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommentSection({ item, currentUserId, currentUserName }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    async function loadComments() {
      try {
        const res = await fetch(`/api/feed/${item.ref_id}/comment?ref_type=${item.ref_type}`);
        if (res.ok) setComments(await res.json());
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    loadComments();
  }, [item.ref_id, item.ref_type]);

  async function submitComment(e) {
    e.preventDefault();
    if (!newComment.trim() || posting) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/feed/${item.ref_id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: currentUserId,
          player_name: currentUserName,
          text: newComment.trim(),
          ref_type: item.ref_type,
        }),
      });
      if (res.ok) {
        const comment = await res.json();
        setComments(prev => [...prev, comment]);
        setNewComment('');
      }
    } catch (err) {
      console.error(err);
    }
    setPosting(false);
  }

  return (
    <div className="bg-gray-50 rounded-xl p-3 ml-13 border border-gray-100">
      {loading ? (
        <p className="text-xs text-gray-400 text-center py-2">Loading comments...</p>
      ) : (
        <>
          {comments.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-1">No comments yet</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2 mb-2 last:mb-0">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-[10px] font-bold text-green-700 flex-shrink-0">
                {(c.player_name || 'P')[0]}
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-700">{c.player_name}</span>
                <p className="text-xs text-gray-600">{c.text}</p>
              </div>
            </div>
          ))}
        </>
      )}

      <form onSubmit={submitComment} className="flex gap-2 mt-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
        <button
          type="submit"
          disabled={posting || !newComment.trim()}
          className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg font-medium disabled:opacity-50 hover:bg-green-700 transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default function FeedPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [openComments, setOpenComments] = useState(null);

  const loadFeed = useCallback(async (teamId, filter) => {
    try {
      const res = await fetch(`/api/feed?team_id=${teamId}&type=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setFeed(data.items || []);
      }
    } catch (err) {
      console.error('Feed load error:', err);
    }
  }, []);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('mf_user') || 'null');
    if (!u) { router.push('/'); return; }
    setUser(u);

    async function init() {
      try {
        const profRes = await fetch(`/api/players/${u.id}`);
        if (profRes.ok) {
          const p = await profRes.json();
          setProfile(p);
          await loadFeed(p.team_id, 'all');
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    init();
  }, [router, loadFeed]);

  async function handleRefresh() {
    if (!profile?.team_id || refreshing) return;
    setRefreshing(true);
    await loadFeed(profile.team_id, activeFilter);
    setRefreshing(false);
  }

  async function handleFilterChange(filter) {
    setActiveFilter(filter);
    if (profile?.team_id) {
      setLoading(true);
      await loadFeed(profile.team_id, filter);
      setLoading(false);
    }
  }

  async function handleReact(item) {
    if (!user) return;
    try {
      const res = await fetch(`/api/feed/${item.ref_id}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: user.id,
          ref_type: item.ref_type,
        }),
      });
      if (res.ok) {
        const result = await res.json();
        setFeed(prev => prev.map(f => {
          if (f.id !== item.id) return f;
          const reactions = [...(f.reactions || [])];
          if (result.action === 'liked') {
            reactions.push(user.id);
          } else {
            const idx = reactions.indexOf(user.id);
            if (idx > -1) reactions.splice(idx, 1);
          }
          return { ...f, reactions, reaction_count: reactions.length };
        }));
      }
    } catch (err) {
      console.error(err);
    }
  }

  function handleToggleComments(item) {
    setOpenComments(prev => prev === item.id ? null : item.id);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <svg className="w-8 h-8 animate-spin text-green-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-gray-900">Team Feed</h1>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${refreshing ? 'animate-spin' : ''}`}
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
            </button>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar">
            {FILTER_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => handleFilterChange(tab.key)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  activeFilter === tab.key
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {feed.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
            </svg>
            <p className="text-gray-400 text-sm">No activity yet</p>
            <p className="text-gray-300 text-xs mt-1">Complete a workout to get the feed started!</p>
          </div>
        ) : (
          feed.map(item => (
            <div key={item.id}>
              <FeedItem
                item={item}
                currentUserId={user?.id}
                onReact={handleReact}
                onToggleComments={handleToggleComments}
              />
              {openComments === item.id && (
                <div className="mt-1">
                  <CommentSection
                    item={item}
                    currentUserId={user?.id}
                    currentUserName={profile?.name || user?.name || 'Player'}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}
