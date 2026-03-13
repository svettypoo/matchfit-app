'use client';

import { useState, useEffect } from 'react';
import BottomNav from '../../../components/BottomNav';
import BadgeCard from '../../../components/BadgeCard';

const CATEGORIES = ['All', 'Consistency', 'Performance', 'Wellness', 'Soccer', 'Social'];

export default function BadgesPage() {
  const [badges, setBadges] = useState([]);
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [earnedCount, setEarnedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    async function load() {
      const user = JSON.parse(localStorage.getItem('mf_user') || '{}');
      try {
        const res = await fetch(`/api/players/${user.id}/badges`);
        if (res.ok) {
          const data = await res.json();
          setBadges(data.badges || []);
          setEarnedCount(data.earned_count || 0);
          setTotalCount(data.total_count || 0);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = category === 'All' ? badges : badges.filter(b => b.category === category.toLowerCase());

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b px-4 py-3">
        <h1 className="font-bold text-lg text-gray-900">Badges</h1>
      </div>

      {/* Counter */}
      <div className="px-4 pt-4">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white text-center mb-4">
          <div className="text-3xl font-bold">{earnedCount}/{totalCount}</div>
          <div className="text-green-100 text-sm">Badges Earned</div>
          <div className="mt-2 h-2 bg-green-400/30 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all"
              style={{ width: totalCount ? `${(earnedCount / totalCount) * 100}%` : '0%' }} />
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4 scrollbar-none">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 py-1.5 text-sm rounded-full font-medium whitespace-nowrap transition-all ${
                category === c ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Badge Grid */}
      <div className="px-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin text-3xl mb-2">&#9917;</div>
            <p className="text-gray-500 text-sm">Loading badges...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-2">&#127941;</div>
            <p className="text-gray-500">No badges in this category yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {filtered.map(badge => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
          </div>
        )}
      </div>

      <BottomNav active="profile" />
    </div>
  );
}
