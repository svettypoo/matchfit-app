'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PublicPlayerProfile() {
  const { token } = useParams();
  const router = useRouter();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/public/${token}`)
      .then(res => {
        if (!res.ok) throw new Error('Invalid or expired link');
        return res.json();
      })
      .then(data => {
        setPlayer(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M15 9l-6 6M9 9l6 6" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Link Not Found</h2>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  const { profile, completed_programs, active_programs, recent_logs, rewards } = player;
  const initials = (profile.name || 'P').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Player Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{profile.name}</h1>
          {profile.team_name && (
            <p className="text-sm text-gray-500">{profile.team_name}</p>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm">
          <p className="text-2xl font-bold text-emerald-600">{profile.level || 1}</p>
          <p className="text-xs text-gray-500 mt-0.5">Level</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm">
          <p className="text-2xl font-bold text-amber-500">{profile.xp || 0}</p>
          <p className="text-xs text-gray-500 mt-0.5">XP</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm">
          <p className="text-2xl font-bold text-orange-500">{profile.streak || 0}</p>
          <p className="text-xs text-gray-500 mt-0.5">Day Streak</p>
        </div>
      </div>

      {/* Active Programs */}
      {active_programs?.length > 0 && (
        <section id="programs">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Active Programs</h2>
          <div className="space-y-2">
            {active_programs.map(prog => (
              <Link
                key={prog.id}
                href={`/p/${token}/program/${prog.id}`}
                className="block bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{prog.program_name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {prog.completed_days || 0} / {prog.total_days || '?'} days completed
                    </p>
                  </div>
                  <div className="shrink-0 ml-3">
                    <div className="w-10 h-10 rounded-full border-3 border-emerald-500 flex items-center justify-center">
                      <span className="text-xs font-bold text-emerald-600">
                        {prog.total_days ? Math.round(((prog.completed_days || 0) / prog.total_days) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Completed Programs */}
      {completed_programs?.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Completed Programs</h2>
          <div className="space-y-2">
            {completed_programs.map(prog => (
              <div key={prog.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{prog.program_name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Completed {prog.completed_at ? new Date(prog.completed_at).toLocaleDateString() : ''}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Rewards / Badges */}
      {rewards?.length > 0 && (
        <section id="rewards">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Rewards & Badges</h2>
          <div className="grid grid-cols-3 gap-3">
            {rewards.map(reward => (
              <div key={reward.id} className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm">
                <div className="text-2xl mb-1">{reward.icon || '🏆'}</div>
                <p className="text-xs font-medium text-gray-900 truncate">{reward.name}</p>
                {reward.earned_at && (
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {new Date(reward.earned_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Exercise History */}
      {recent_logs?.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Recent Workouts</h2>
          <div className="space-y-2">
            {recent_logs.map((log, i) => (
              <div key={i} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                    <path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14" />
                    <path d="M2 20h20" />
                    <path d="M14 12H10" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{log.exercise_name || 'Exercise'}</p>
                  <p className="text-xs text-gray-500">
                    {log.sets && `${log.sets} sets`}
                    {log.reps && ` x ${log.reps} reps`}
                    {log.weight && ` @ ${log.weight}kg`}
                    {log.duration && ` - ${log.duration}s`}
                  </p>
                </div>
                <span className="text-xs text-gray-400 shrink-0">
                  {log.created_at ? new Date(log.created_at).toLocaleDateString() : ''}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Create Account CTA */}
      {!profile.has_account && (
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-5 text-center text-white">
          <h3 className="text-lg font-bold mb-1">Track Your Progress</h3>
          <p className="text-sm text-emerald-100 mb-4">Create a free account to sync across devices and unlock all features.</p>
          <button
            onClick={() => router.push(`/p/${token}?create=1`)}
            className="bg-white text-emerald-700 font-semibold px-6 py-2.5 rounded-full text-sm hover:bg-emerald-50 transition-colors"
          >
            Create Free Account
          </button>
        </div>
      )}
    </div>
  );
}
