'use client';

import { useState, useEffect, useCallback } from 'react';

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'workouts', label: 'Workouts' },
  { key: 'prs', label: 'PRs' },
  { key: 'announcements', label: 'Announcements' },
];

const TYPE_COLORS = {
  workout: 'bg-blue-100 text-blue-600',
  pr: 'bg-yellow-100 text-yellow-600',
  badge: 'bg-purple-100 text-purple-600',
  announcement: 'bg-green-100 text-green-600',
  challenge: 'bg-orange-100 text-orange-600',
};

const TYPE_LABELS = {
  workout: 'Workout',
  pr: 'PR',
  badge: 'Badge',
  announcement: 'Announcement',
  challenge: 'Challenge',
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

function AnnouncementForm({ teamId, coachId, coachName, onCreated }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [pinned, setPinned] = useState(false);
  const [posting, setPosting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || posting) return;
    setPosting(true);
    try {
      const res = await fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_id: teamId,
          author_id: coachId,
          author_name: coachName,
          title: title.trim(),
          body: body.trim() || null,
          image_url: imageUrl.trim() || null,
          post_type: 'announcement',
          pinned,
        }),
      });
      if (res.ok) {
        setTitle('');
        setBody('');
        setImageUrl('');
        setPinned(false);
        setExpanded(false);
        onCreated();
      }
    } catch (err) {
      console.error(err);
    }
    setPosting(false);
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full bg-green-600 text-white rounded-xl py-3 px-4 font-semibold text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
        </svg>
        Post Announcement
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl p-4 shadow-sm border border-green-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 text-sm">New Announcement</h3>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Announcement title..."
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 mb-2"
        required
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Details (optional)..."
        rows={3}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 mb-2 resize-none"
      />
      <input
        type="url"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        placeholder="Image URL (optional)"
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 mb-3"
      />

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={pinned}
            onChange={(e) => setPinned(e.target.checked)}
            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          Pin to top
        </label>
        <button
          type="submit"
          disabled={posting || !title.trim()}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-green-700 transition-colors"
        >
          {posting ? 'Posting...' : 'Post'}
        </button>
      </div>
    </form>
  );
}

function AdminFeedItem({ item, onPin }) {
  const colorClass = TYPE_COLORS[item.type] || 'bg-gray-100 text-gray-600';

  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border ${item.pinned ? 'border-green-300 ring-1 ring-green-200' : 'border-gray-100'}`}>
      <div className="flex items-start gap-3">
        {/* Type badge */}
        <div className={`flex-shrink-0 px-2 py-1 rounded-md text-[10px] font-bold uppercase ${colorClass}`}>
          {TYPE_LABELS[item.type] || item.type}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {item.pinned && (
            <span className="text-[10px] text-green-600 font-semibold bg-green-50 px-1.5 py-0.5 rounded mr-1">
              PINNED
            </span>
          )}
          <p className="text-sm font-semibold text-gray-900">{item.title}</p>
          {item.subtitle && (
            <p className="text-xs text-gray-500 mt-0.5">{item.subtitle}</p>
          )}
          {item.image_url && (
            <img src={item.image_url} alt="" className="mt-2 rounded-lg max-h-32 object-cover" />
          )}

          {/* Progress bar for challenges */}
          {item.type === 'challenge' && item.progress_pct !== undefined && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>{item.progress_pct}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-orange-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${item.progress_pct}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-gray-400">{timeAgo(item.timestamp)}</span>
            <span className="text-xs text-gray-400">
              {item.reaction_count || 0} likes
            </span>
            <span className="text-xs text-gray-400">
              {item.comment_count || 0} comments
            </span>

            {/* Pin/Unpin button for announcements */}
            {item.ref_type === 'post' && (
              <button
                onClick={() => onPin(item)}
                className={`text-xs font-medium ml-auto ${
                  item.pinned ? 'text-orange-500 hover:text-orange-600' : 'text-gray-400 hover:text-green-600'
                }`}
              >
                {item.pinned ? 'Unpin' : 'Pin'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminFeedPage() {
  const [user, setUser] = useState(null);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  const loadFeed = useCallback(async (teamId, filter) => {
    try {
      const res = await fetch(`/api/feed?team_id=${teamId}&type=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setFeed(data.items || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('mf_user') || 'null');
    if (!u) return;
    setUser(u);

    async function init() {
      try {
        const teamsRes = await fetch(`/api/teams?coach_id=${u.id}`);
        if (teamsRes.ok) {
          const t = await teamsRes.json();
          setTeams(t);
          if (t.length > 0) {
            setSelectedTeam(t[0]);
            await loadFeed(t[0].id, 'all');
          }
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    init();
  }, [loadFeed]);

  async function handleFilterChange(filter) {
    setActiveFilter(filter);
    if (selectedTeam) {
      setLoading(true);
      await loadFeed(selectedTeam.id, filter);
      setLoading(false);
    }
  }

  async function handleTeamChange(teamId) {
    const team = teams.find(t => t.id === teamId);
    setSelectedTeam(team);
    if (team) {
      setLoading(true);
      await loadFeed(team.id, activeFilter);
      setLoading(false);
    }
  }

  async function handlePin(item) {
    try {
      const res = await fetch('/api/feed', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.ref_id, pinned: !item.pinned }),
      });
      if (res.ok && selectedTeam) {
        await loadFeed(selectedTeam.id, activeFilter);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleAnnouncementCreated() {
    if (selectedTeam) {
      await loadFeed(selectedTeam.id, activeFilter);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="w-8 h-8 animate-spin text-green-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Team Feed</h1>
          <p className="text-sm text-gray-500">Activity, announcements & challenges</p>
        </div>

        {/* Team selector */}
        {teams.length > 1 && (
          <select
            value={selectedTeam?.id || ''}
            onChange={(e) => handleTeamChange(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Post Announcement */}
      {selectedTeam && (
        <AnnouncementForm
          teamId={selectedTeam.id}
          coachId={user?.id}
          coachName={user?.name || 'Coach'}
          onCreated={handleAnnouncementCreated}
        />
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
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

      {/* Feed list */}
      {feed.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <svg className="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
          </svg>
          <p className="text-sm text-gray-400">No feed activity yet</p>
          <p className="text-xs text-gray-300 mt-1">Post an announcement to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {feed.map(item => (
            <AdminFeedItem key={item.id} item={item} onPin={handlePin} />
          ))}
        </div>
      )}
    </div>
  );
}
