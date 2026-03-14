'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '../../../components/BottomNav';

const RPE_COLORS = {
  1: 'bg-green-100 text-green-700', 2: 'bg-green-100 text-green-700',
  3: 'bg-green-200 text-green-800', 4: 'bg-yellow-100 text-yellow-700',
  5: 'bg-yellow-100 text-yellow-700', 6: 'bg-yellow-200 text-yellow-800',
  7: 'bg-orange-100 text-orange-700', 8: 'bg-orange-200 text-orange-800',
  9: 'bg-red-100 text-red-700', 10: 'bg-red-200 text-red-800',
};

const RATING_STYLES = {
  exceeded: { bg: 'bg-green-100 text-green-700', dot: 'bg-green-500', label: 'Exceeded' },
  met: { bg: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500', label: 'Met' },
  below: { bg: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', label: 'Below' },
};

const CATEGORY_COLORS = {
  strength: 'bg-red-100 text-red-700',
  speed: 'bg-blue-100 text-blue-700',
  agility: 'bg-purple-100 text-purple-700',
  ball_work: 'bg-green-100 text-green-700',
  flexibility: 'bg-pink-100 text-pink-700',
  core: 'bg-amber-100 text-amber-700',
  plyometrics: 'bg-orange-100 text-orange-700',
  recovery: 'bg-teal-100 text-teal-700',
};

function pctDiff(actual, planned) {
  if (!planned || planned === 0) return null;
  const pct = Math.round(((actual - planned) / planned) * 100);
  return pct;
}

function PctBadge({ pct }) {
  if (pct === null || pct === undefined) return null;
  const color = pct > 0 ? 'text-green-600' : pct < 0 ? 'text-red-500' : 'text-gray-400';
  return <span className={`text-[10px] font-bold ${color}`}>{pct > 0 ? '+' : ''}{pct}%</span>;
}

// Per-set card for completed exercises
function SetCard({ setIndex, plannedReps, actualReps, plannedWeight, actualWeight }) {
  const repsPct = pctDiff(actualReps, plannedReps);
  const weightPct = pctDiff(actualWeight, plannedWeight);

  return (
    <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
      <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1.5">Set {setIndex + 1}</div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-500">Reps</span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400">{plannedReps || '—'}</span>
            <span className="text-gray-300">&rarr;</span>
            <span className="text-xs font-bold text-gray-900">{actualReps ?? '—'}</span>
            <PctBadge pct={repsPct} />
          </div>
        </div>
        {(plannedWeight > 0 || actualWeight > 0) && (
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500">Weight</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400">{plannedWeight ? `${plannedWeight}kg` : '—'}</span>
              <span className="text-gray-300">&rarr;</span>
              <span className="text-xs font-bold text-gray-900">{actualWeight ? `${actualWeight}kg` : '—'}</span>
              <PctBadge pct={weightPct} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WorkoutPlanPage() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState([]);
  const [planDays, setPlanDays] = useState([]);
  const [upcomingDays, setUpcomingDays] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [viewMode, setViewMode] = useState('upcoming'); // upcoming | completed | all

  useEffect(() => {
    async function load() {
      const user = JSON.parse(localStorage.getItem('mf_user') || '{}');
      try {
        const [historyRes, planRes, planActiveRes] = await Promise.all([
          fetch(`/api/players/${user.id}/history`),
          fetch(`/api/players/${user.id}/plan-history`),
          fetch(`/api/exercise-plans?player_id=${user.id}`),
        ]);

        if (historyRes.ok) {
          const data = await historyRes.json();
          setWorkouts((data.workouts || data || []).map(w => ({ ...w, _type: 'program' })));
        }
        if (planRes.ok) {
          const data = await planRes.json();
          setPlanDays((data.days || []).map(d => ({ ...d, _type: 'plan' })));
        }
        if (planActiveRes.ok) {
          const data = await planActiveRes.json();
          const plan = data.plan || data;
          if (plan?.id) {
            setActivePlan(plan);
            // Extract upcoming (not completed) days
            const days = plan.mf_plan_days || [];
            const upcoming = days
              .filter(d => d.status !== 'completed')
              .sort((a, b) => a.day_number - b.day_number);
            setUpcomingDays(upcoming);
          }
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, []);

  // Completed items merged and sorted
  const completedItems = [
    ...workouts.map(w => ({
      id: w.id,
      _type: 'program',
      name: w.mf_program_days?.mf_programs?.name ? `${w.mf_program_days.mf_programs.name} — ${w.mf_program_days?.focus || 'Workout'}` : (w.name || 'Workout'),
      date: w.completed_at,
      completion: w.completion_pct || 100,
      rpe: w.rpe_reported || w.rpe,
      duration: w.duration_minutes,
      exercises: w.exercise_logs || w.exercises || [],
      performance_rating: null,
    })),
    ...planDays.map(d => ({
      id: d.id,
      _type: 'plan',
      name: d.name,
      plan_name: d.plan_name,
      focus: d.focus,
      date: d.completed_at,
      performance_rating: d.performance_rating,
      overall_rpe: d.overall_rpe,
      exercises: d.mf_plan_exercises || [],
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b px-4 py-3">
        <h1 className="font-bold text-lg text-gray-900">Workout Plan</h1>
        {activePlan && (
          <p className="text-xs text-gray-500 mt-0.5">
            {activePlan.name} &middot; Week {activePlan.current_week || 1}/{activePlan.duration_weeks || '—'}
          </p>
        )}
      </div>

      {/* Tab Selector */}
      <div className="bg-white border-b px-4 py-2">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {[
            { key: 'upcoming', label: `Upcoming (${upcomingDays.length})` },
            { key: 'completed', label: `History (${completedItems.length})` },
            { key: 'all', label: 'All' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setViewMode(tab.key)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === tab.key ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {loading ? (
          <div className="text-center py-12">
            <svg className="animate-spin h-8 w-8 text-green-600 mx-auto mb-2" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            <p className="text-gray-500 text-sm">Loading workout plan...</p>
          </div>
        ) : (
          <>
            {/* UPCOMING EXERCISES */}
            {(viewMode === 'upcoming' || viewMode === 'all') && (
              <>
                {viewMode === 'all' && upcomingDays.length > 0 && (
                  <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Upcoming Workouts</h2>
                )}
                {upcomingDays.length === 0 && viewMode === 'upcoming' ? (
                  <div className="text-center py-12">
                    <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                    <p className="text-gray-500 font-medium">No upcoming workouts</p>
                    <p className="text-gray-400 text-sm mt-1">Complete your current workout to unlock the next one</p>
                  </div>
                ) : (
                  upcomingDays.map((day, idx) => {
                    const isExp = expanded === `upcoming-${day.id}`;
                    const exercises = day.mf_plan_exercises || [];
                    const isAvailable = day.status === 'available';

                    return (
                      <div key={`up-${day.id}`} className={`bg-white rounded-xl shadow-sm border overflow-hidden ${isAvailable ? 'border-green-200' : 'border-gray-100'}`}>
                        <button onClick={() => setExpanded(isExp ? null : `upcoming-${day.id}`)}
                          className="w-full text-left px-4 py-3 flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                              {day.day_number || idx + 1}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-900 text-sm truncate">{day.name || `Day ${day.day_number}`}</div>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                                {day.focus && <span className="truncate">{day.focus}</span>}
                                <span>{exercises.length} exercises</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {isAvailable ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-green-100 text-green-700">Ready</span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">Upcoming</span>
                            )}
                            <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExp ? 'rotate-180' : ''}`}
                              fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </button>

                        {isExp && exercises.length > 0 && (
                          <div className="border-t border-gray-100 divide-y divide-gray-50">
                            {exercises.map((pe, i) => {
                              const ex = pe.mf_exercises || {};
                              return (
                                <div key={pe.id} className="px-4 py-2.5 flex items-center gap-3">
                                  <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-medium shrink-0">{i + 1}</div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900 truncate">{ex.name || 'Exercise'}</div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                      <span>{pe.sets || 3} &times; {pe.reps || 10}</span>
                                      {pe.weight_kg > 0 && <span>@ {pe.weight_kg}kg</span>}
                                      {pe.rest_sec && <span>Rest {pe.rest_sec}s</span>}
                                    </div>
                                  </div>
                                  {ex.category && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${CATEGORY_COLORS[ex.category] || 'bg-gray-100 text-gray-600'}`}>
                                      {ex.category?.replace('_', ' ')}
                                    </span>
                                  )}
                                  {pe.intensity_change && pe.intensity_change !== 0 && (
                                    <span className={`text-[10px] font-bold ${pe.intensity_change > 0 ? 'text-green-600' : 'text-amber-600'}`}>
                                      {pe.intensity_change > 0 ? '↑' : '↓'}{Math.abs(pe.intensity_change)}%
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                            {isAvailable && (
                              <div className="px-4 py-3">
                                <button onClick={() => router.push('/dashboard/plan')}
                                  className="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                                  Start Workout
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </>
            )}

            {/* DIVIDER */}
            {viewMode === 'all' && upcomingDays.length > 0 && completedItems.length > 0 && (
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider pt-2">Completed Workouts</h2>
            )}

            {/* COMPLETED HISTORY */}
            {(viewMode === 'completed' || viewMode === 'all') && (
              <>
                {completedItems.length === 0 && viewMode === 'completed' ? (
                  <div className="text-center py-12">
                    <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>
                    <p className="text-gray-500 font-medium">No workouts completed yet</p>
                    <p className="text-gray-400 text-sm mt-1">Your completed workouts will appear here</p>
                  </div>
                ) : (
                  completedItems.map(item => {
                    const isExpanded2 = expanded === item.id;

                    if (item._type === 'plan') {
                      const exercises = item.exercises || [];
                      const completedEx = exercises.filter(e => e.completed).length;
                      const rating = RATING_STYLES[item.performance_rating] || RATING_STYLES.met;

                      return (
                        <div key={`plan-${item.id}`} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                          <button onClick={() => setExpanded(isExpanded2 ? null : item.id)}
                            className="w-full text-left px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className={`w-3 h-3 rounded-full shrink-0 ${rating.dot}`} />
                              <div className="min-w-0">
                                <div className="text-xs text-gray-400">
                                  {item.date ? new Date(item.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : ''}
                                  <span className="ml-2 px-1.5 py-0.5 bg-green-50 text-green-600 rounded text-[10px] font-medium">Plan</span>
                                </div>
                                <div className="font-semibold text-gray-900 text-sm truncate">{item.name}</div>
                                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                                  <span>{completedEx}/{exercises.length} exercises</span>
                                  {item.focus && <><span className="text-gray-300">|</span><span className="truncate">{item.focus}</span></>}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rating.bg}`}>
                                {item.performance_rating || 'met'}
                              </span>
                              <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded2 ? 'rotate-180' : ''}`}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </button>

                          {isExpanded2 && (
                            <div className="border-t border-gray-100">
                              {item.plan_name && (
                                <div className="px-4 pt-3 pb-1">
                                  <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{item.plan_name}</span>
                                </div>
                              )}
                              <div className="divide-y divide-gray-50">
                                {exercises.map((pe, i) => {
                                  const ex = pe.mf_exercises || {};
                                  const actualReps = Array.isArray(pe.actual_reps) ? pe.actual_reps : [];
                                  const actualWeights = Array.isArray(pe.actual_weight) ? pe.actual_weight : [];
                                  const plannedSets = pe.sets || 3;
                                  const plannedReps = pe.reps || 10;
                                  const plannedWeight = pe.weight_kg || 0;

                                  return (
                                    <div key={pe.id} className={`px-4 py-3 ${!pe.completed ? 'opacity-40' : ''}`}>
                                      <div className="flex items-center gap-2.5 mb-2">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${pe.completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                          {pe.completed ? '✓' : i + 1}
                                        </div>
                                        <div className="font-medium text-gray-900 text-sm flex-1">{ex.name || 'Exercise'}</div>
                                        {pe.intensity_change && pe.intensity_change !== 0 && (
                                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pe.intensity_change > 0 ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                                            {pe.intensity_change > 0 ? '↑' : '↓'} {Math.abs(pe.intensity_change)}%
                                          </span>
                                        )}
                                      </div>

                                      {pe.completed ? (
                                        <div className="ml-8 space-y-2">
                                          {/* Per-set cards */}
                                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {Array.from({ length: Math.max(pe.actual_sets || 0, plannedSets) }).map((_, setIdx) => (
                                              <SetCard
                                                key={setIdx}
                                                setIndex={setIdx}
                                                plannedReps={plannedReps}
                                                actualReps={actualReps[setIdx] ?? null}
                                                plannedWeight={plannedWeight}
                                                actualWeight={actualWeights[setIdx] ?? null}
                                              />
                                            ))}
                                          </div>

                                          {/* Overall volume summary */}
                                          {(() => {
                                            const prescribedVol = plannedSets * plannedReps * plannedWeight;
                                            const actualVol = actualReps.reduce((s, r, j) => s + (r || 0) * (actualWeights[j] || plannedWeight || 0), 0);
                                            const volPct = prescribedVol > 0 ? Math.min(Math.round((actualVol / prescribedVol) * 100), 150) : 0;
                                            if (prescribedVol <= 0) return null;
                                            return (
                                              <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] text-gray-400">Volume</span>
                                                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                  <div className={`h-full rounded-full transition-all ${volPct >= 100 ? 'bg-green-500' : volPct >= 85 ? 'bg-blue-500' : 'bg-amber-500'}`}
                                                    style={{ width: `${Math.min(volPct, 100)}%` }} />
                                                </div>
                                                <span className={`text-[10px] font-bold min-w-[32px] text-right ${volPct >= 100 ? 'text-green-600' : volPct >= 85 ? 'text-blue-600' : 'text-amber-600'}`}>
                                                  {volPct}%
                                                </span>
                                              </div>
                                            );
                                          })()}

                                          {pe.actual_rpe && (
                                            <div className="flex items-center gap-1.5">
                                              <span className="text-[10px] text-gray-400">RPE</span>
                                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${RPE_COLORS[pe.actual_rpe] || 'bg-gray-100 text-gray-600'}`}>
                                                {pe.actual_rpe}/10
                                              </span>
                                            </div>
                                          )}

                                          {pe.player_notes && (
                                            <div className="text-xs text-gray-500 italic bg-gray-50 rounded px-2 py-1">"{pe.player_notes}"</div>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="ml-8 text-xs text-gray-400">
                                          Prescribed: {plannedSets} &times; {plannedReps}{plannedWeight ? ` @ ${plannedWeight}kg` : ''} — skipped
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }

                    // Program-based workout card
                    return (
                      <div key={`prog-${item.id}`} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <button onClick={() => setExpanded(isExpanded2 ? null : item.id)}
                          className="w-full text-left px-4 py-3 flex items-center justify-between">
                          <div>
                            <div className="text-xs text-gray-400">
                              {item.date ? new Date(item.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : ''}
                              <span className="ml-2 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-medium">Program</span>
                            </div>
                            <div className="font-semibold text-gray-900 text-sm">{item.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">{item.completion}% complete</span>
                              <span className="text-xs text-gray-400">|</span>
                              <span className="text-xs text-gray-500">{item.duration ? `${item.duration} min` : '--'}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.rpe && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RPE_COLORS[item.rpe] || 'bg-gray-100 text-gray-600'}`}>
                                RPE {item.rpe}
                              </span>
                            )}
                            <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded2 ? 'rotate-180' : ''}`}
                              fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </button>

                        {isExpanded2 && item.exercises?.length > 0 && (
                          <div className="border-t border-gray-100 px-4 py-3 space-y-2">
                            {item.exercises.map((ex, i) => (
                              <div key={i} className="flex items-center justify-between text-sm">
                                <span className="text-gray-700">{ex.mf_exercises?.name || ex.name}</span>
                                <span className="text-gray-400">{ex.completed_sets || ex.sets_completed || ex.sets}x{ex.completed_reps?.[0] || ex.reps}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </>
            )}
          </>
        )}
      </div>

      <BottomNav active="home" />
    </div>
  );
}
