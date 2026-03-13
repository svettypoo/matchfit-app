'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '../../../components/BottomNav';

const BADGE_DEFS = [
  // Consistency
  { id: 'first_workout', name: 'First Steps', desc: 'Complete your first workout', category: 'Consistency', rarity: 'Common', icon: '1', color: 'bg-green-500' },
  { id: 'streak_3', name: 'On Fire', desc: '3-day workout streak', category: 'Consistency', rarity: 'Common', icon: '3', color: 'bg-orange-500' },
  { id: 'streak_7', name: 'Week Warrior', desc: '7-day workout streak', category: 'Consistency', rarity: 'Rare', icon: '7', color: 'bg-blue-500' },
  { id: 'streak_14', name: 'Unstoppable', desc: '14-day workout streak', category: 'Consistency', rarity: 'Rare', icon: '14', color: 'bg-purple-500' },
  { id: 'streak_30', name: 'Iron Will', desc: '30-day workout streak', category: 'Consistency', rarity: 'Epic', icon: '30', color: 'bg-red-500' },
  { id: 'streak_90', name: 'Legendary Streak', desc: '90-day workout streak', category: 'Consistency', rarity: 'Legendary', icon: '90', color: 'bg-yellow-500' },
  // Strength
  { id: 'first_pr', name: 'PR Machine', desc: 'Set your first personal record', category: 'Strength', rarity: 'Common', icon: 'PR', color: 'bg-red-500' },
  { id: 'pr_5', name: 'Record Breaker', desc: 'Set 5 personal records', category: 'Strength', rarity: 'Rare', icon: '5x', color: 'bg-red-600' },
  { id: 'pr_20', name: 'Limit Pusher', desc: 'Set 20 personal records', category: 'Strength', rarity: 'Epic', icon: '20', color: 'bg-red-700' },
  { id: 'volume_100k', name: 'Volume King', desc: 'Lift 100,000kg total volume', category: 'Strength', rarity: 'Epic', icon: '100K', color: 'bg-amber-600' },
  // Social
  { id: 'first_cheer', name: 'Team Player', desc: 'Cheer on a teammate for the first time', category: 'Social', rarity: 'Common', icon: 'HF', color: 'bg-pink-500' },
  { id: 'top_performer', name: 'MVP', desc: 'Be #1 on the leaderboard', category: 'Social', rarity: 'Epic', icon: '#1', color: 'bg-yellow-500' },
  // Milestones
  { id: 'level_5', name: 'Rising Star', desc: 'Reach Level 5', category: 'Milestones', rarity: 'Common', icon: 'L5', color: 'bg-indigo-500' },
  { id: 'level_10', name: 'Elite', desc: 'Reach Level 10', category: 'Milestones', rarity: 'Rare', icon: 'L10', color: 'bg-indigo-600' },
  { id: 'level_25', name: 'Champion', desc: 'Reach Level 25', category: 'Milestones', rarity: 'Epic', icon: 'L25', color: 'bg-indigo-700' },
  { id: 'level_50', name: 'Legend', desc: 'Reach Level 50', category: 'Milestones', rarity: 'Legendary', icon: 'L50', color: 'bg-indigo-900' },
  { id: 'workouts_10', name: 'Dedicated', desc: 'Complete 10 workouts', category: 'Milestones', rarity: 'Common', icon: '10', color: 'bg-teal-500' },
  { id: 'workouts_50', name: 'Committed', desc: 'Complete 50 workouts', category: 'Milestones', rarity: 'Rare', icon: '50', color: 'bg-teal-600' },
  { id: 'workouts_100', name: 'Centurion', desc: 'Complete 100 workouts', category: 'Milestones', rarity: 'Epic', icon: '100', color: 'bg-teal-700' },
  { id: 'wellness_7', name: 'Self-Aware', desc: 'Complete 7 wellness check-ins', category: 'Milestones', rarity: 'Common', icon: 'W7', color: 'bg-emerald-500' },
];

const RARITY_COLORS = {
  Common: 'border-gray-300',
  Rare: 'border-blue-400',
  Epic: 'border-purple-400',
  Legendary: 'border-yellow-400',
};

const RARITY_TEXT = {
  Common: 'text-gray-500',
  Rare: 'text-blue-600',
  Epic: 'text-purple-600',
  Legendary: 'text-yellow-600',
};

const RARITY_BG = {
  Common: 'bg-gray-50',
  Rare: 'bg-blue-50',
  Epic: 'bg-purple-50',
  Legendary: 'bg-gradient-to-br from-yellow-50 to-amber-50',
};

const CATEGORIES = ['All', 'Consistency', 'Strength', 'Social', 'Milestones'];

export default function BadgesPage() {
  const router = useRouter();
  const [earnedBadgeIds, setEarnedBadgeIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [selectedBadge, setSelectedBadge] = useState(null);

  useEffect(() => {
    async function load() {
      const user = JSON.parse(localStorage.getItem('mf_user') || '{}');
      if (!user.id) { router.push('/'); return; }
      try {
        const res = await fetch(`/api/players/${user.id}/badges`);
        if (res.ok) {
          const data = await res.json();
          setEarnedBadgeIds((data.badges || []).map(b => b.badge_id));
        }
      } catch (err) { console.error(err); }
      setLoading(false);
    }
    load();
  }, [router]);

  const filtered = filter === 'All' ? BADGE_DEFS : BADGE_DEFS.filter(b => b.category === filter);
  const earnedCount = BADGE_DEFS.filter(b => earnedBadgeIds.includes(b.id)).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-green-600" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-6">
        <h1 className="font-bold text-xl mb-1">Badges</h1>
        <p className="text-green-100 text-sm">{earnedCount} / {BADGE_DEFS.length} earned</p>
        <div className="w-full bg-green-800/50 rounded-full h-2.5 mt-3">
          <div className="bg-white rounded-full h-2.5 transition-all duration-500"
            style={{ width: `${(earnedCount / BADGE_DEFS.length) * 100}%` }} />
        </div>
      </div>

      {/* Category Filter */}
      <div className="px-4 py-3 bg-white border-b flex gap-2 overflow-x-auto">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              filter === cat ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>{cat}</button>
        ))}
      </div>

      {/* Rarity Legend */}
      <div className="px-4 py-2 flex gap-4 text-[10px]">
        {Object.entries(RARITY_TEXT).map(([rarity, cls]) => (
          <span key={rarity} className={`${cls} font-medium`}>{rarity}</span>
        ))}
      </div>

      {/* Badge Grid */}
      <div className="px-4 grid grid-cols-3 gap-3">
        {filtered.map(badge => {
          const earned = earnedBadgeIds.includes(badge.id);
          return (
            <button key={badge.id} onClick={() => setSelectedBadge(badge)}
              className={`rounded-xl p-3 border-2 transition-all text-center ${
                earned
                  ? `${RARITY_BG[badge.rarity]} ${RARITY_COLORS[badge.rarity]} shadow-sm hover:shadow-md`
                  : 'bg-gray-100 border-gray-200 opacity-40'
              }`}>
              <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-xs ${earned ? badge.color : 'bg-gray-300'}`}>
                {badge.icon}
              </div>
              <div className={`text-xs font-semibold truncate ${earned ? 'text-gray-900' : 'text-gray-400'}`}>{badge.name}</div>
              <div className={`text-[10px] mt-0.5 ${RARITY_TEXT[badge.rarity]} font-medium`}>{badge.rarity}</div>
            </button>
          );
        })}
      </div>

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedBadge(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs text-center animate-in" onClick={e => e.stopPropagation()}>
            <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-lg ${earnedBadgeIds.includes(selectedBadge.id) ? selectedBadge.color : 'bg-gray-300'}`}>
              {selectedBadge.icon}
            </div>
            <h3 className="font-bold text-xl text-gray-900 mb-1">{selectedBadge.name}</h3>
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border mb-3 ${RARITY_COLORS[selectedBadge.rarity]} ${RARITY_TEXT[selectedBadge.rarity]}`}>
              {selectedBadge.rarity}
            </span>
            <p className="text-gray-600 text-sm mb-4">{selectedBadge.desc}</p>
            <div className="text-xs text-gray-400 mb-4">Category: {selectedBadge.category}</div>
            {earnedBadgeIds.includes(selectedBadge.id) ? (
              <div className="bg-green-50 rounded-lg p-3 text-green-700 text-sm font-medium flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Earned!
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-3 text-gray-500 text-sm">Keep training to unlock!</div>
            )}
            <button onClick={() => setSelectedBadge(null)} className="mt-4 w-full py-2 bg-gray-100 rounded-lg font-medium text-sm">Close</button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
