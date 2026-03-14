'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '../../../components/BottomNav';

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

const TREND_INFO = {
  exceeding: { label: 'Exceeding', color: 'text-green-600 bg-green-50 border-green-200', icon: '↑' },
  meeting: { label: 'On Track', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: '→' },
  below: { label: 'Adjusting Down', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: '↓' },
};

export default function PlanPage() {
  const router = useRouter();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(null);
  const [viewMode, setViewMode] = useState('current'); // current | future | writeup
  const [exerciseEdits, setExerciseEdits] = useState({});
  const [completedExercises, setCompletedExercises] = useState({});
  const [saving, setSaving] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [completionResult, setCompletionResult] = useState(null);
  const [editingExercise, setEditingExercise] = useState(null);

  const loadPlan = useCallback(async () => {
    try {
      const user = JSON.parse(localStorage.getItem('mf_user') || 'null');
      if (!user) { router.push('/'); return; }

      const res = await fetch(`/api/exercise-plans?player_id=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setPlan(data);
        if (data?.mf_plan_days) {
          // Find first available day
          const availableDay = data.mf_plan_days.find(d => d.status === 'available');
          if (availableDay) setActiveDay(availableDay.id);
          else {
            const firstDay = data.mf_plan_days[0];
            if (firstDay) setActiveDay(firstDay.id);
          }

          // Initialize edits from plan data
          // Auto-complete: all exercises in available days start as DONE
          // Player only edits if they deviated from the prescription
          const edits = {};
          const completed = {};
          data.mf_plan_days.forEach(day => {
            const isAvailable = day.status === 'available';
            (day.mf_plan_exercises || []).forEach(pe => {
              edits[pe.id] = {
                sets: pe.sets || 3,
                reps: pe.reps || 10,
                weight_kg: pe.weight_kg || null,
                duration_sec: pe.duration_sec || null,
                rest_sec: pe.rest_sec || 60,
              };
              // Auto-mark as completed if the day is available (today's workout)
              completed[pe.id] = pe.completed || isAvailable;
            });
          });
          setExerciseEdits(edits);
          setCompletedExercises(completed);
        }
      }
    } catch (err) {
      console.error('Load plan error:', err);
    }
    setLoading(false);
  }, [router]);

  useEffect(() => { loadPlan(); }, [loadPlan]);

  function adjustValue(exerciseId, field, delta) {
    setExerciseEdits(prev => {
      const current = prev[exerciseId] || {};
      let newVal = (current[field] || 0) + delta;
      if (field === 'sets') newVal = Math.max(1, Math.min(10, newVal));
      if (field === 'reps') newVal = Math.max(1, Math.min(50, newVal));
      if (field === 'weight_kg') newVal = Math.max(0, Math.round(newVal * 2) / 2);
      if (field === 'rest_sec') newVal = Math.max(10, Math.min(300, newVal));
      return { ...prev, [exerciseId]: { ...current, [field]: newVal } };
    });
  }

  function toggleComplete(exerciseId) {
    setCompletedExercises(prev => ({ ...prev, [exerciseId]: !prev[exerciseId] }));
  }

  async function completeDay() {
    if (saving) return;
    setSaving(true);

    const day = plan?.mf_plan_days?.find(d => d.id === activeDay);
    if (!day) { setSaving(false); return; }

    const exercises = (day.mf_plan_exercises || []).map(pe => {
      const edits = exerciseEdits[pe.id] || {};
      const isCompleted = completedExercises[pe.id];
      const sets = edits.sets || pe.sets || 3;
      const reps = edits.reps || pe.reps || 10;
      const weight = edits.weight_kg || pe.weight_kg || null;

      return {
        exercise_id: pe.exercise_id,
        plan_exercise_id: pe.id,
        actual_sets: isCompleted ? sets : 0,
        actual_reps: isCompleted ? Array(sets).fill(reps) : [],
        actual_weight: weight ? (isCompleted ? Array(sets).fill(weight) : []) : null,
        actual_rpe: null,
      };
    });

    try {
      const res = await fetch('/api/exercise-plans/complete-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day_id: activeDay, exercises }),
      });
      if (res.ok) {
        const result = await res.json();
        setCompletionResult(result);
        setShowComplete(true);
        // Reload plan to get updated state
        await loadPlan();
      }
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-8 h-8 animate-spin text-green-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          <p className="text-gray-500">Loading your plan...</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-white border-b px-4 py-3 sticky top-0 z-20">
          <h1 className="font-bold text-gray-900 text-lg">Exercise Plan</h1>
        </div>
        <div className="p-4">
          <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-200">
            <svg className="w-14 h-14 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>
            <h2 className="text-lg font-bold text-gray-900 mb-2">No Exercise Plan Yet</h2>
            <p className="text-gray-500 text-sm mb-4">Complete your fitness assessment to get a personalized plan</p>
            <button onClick={() => router.push('/dashboard/assessment')}
              className="px-6 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700">
              Start Assessment
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  const days = plan.mf_plan_days || [];
  const currentDay = days.find(d => d.id === activeDay);
  const currentExercises = currentDay?.mf_plan_exercises || [];
  const completedCount = currentExercises.filter(pe => completedExercises[pe.id]).length;
  const allDone = currentExercises.length > 0 && completedCount === currentExercises.length;
  const trend = TREND_INFO[plan.performance_trend] || TREND_INFO.meeting;

  const availableDays = days.filter(d => d.status === 'available');
  const completedDays = days.filter(d => d.status === 'completed');
  const upcomingDays = days.filter(d => d.status === 'upcoming');

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-gray-900 text-lg truncate">{plan.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-500">Week {plan.current_week || 1}/{plan.duration_weeks || 4}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${trend.color}`}>
                {trend.icon} {trend.label}
              </span>
              {plan.intensity_multiplier && plan.intensity_multiplier !== 1.0 && (
                <span className="text-xs text-gray-400">
                  {Math.round((plan.intensity_multiplier - 1) * 100)}% intensity
                </span>
              )}
            </div>
          </div>
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 p-1 ml-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="bg-white border-b px-4 py-2">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {[
            { key: 'current', label: `Today (${availableDays.length})` },
            { key: 'future', label: `Upcoming (${upcomingDays.length})` },
            { key: 'writeup', label: 'Plan Details' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setViewMode(tab.key)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === tab.key ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      {viewMode === 'current' && currentDay && (
        <div className="bg-white border-b px-4 py-2">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>{completedCount}/{currentExercises.length} exercises</span>
            <span>{currentExercises.length > 0 ? Math.round((completedCount / currentExercises.length) * 100) : 0}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${currentExercises.length > 0 ? (completedCount / currentExercises.length) * 100 : 0}%` }} />
          </div>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* CURRENT VIEW — Active day exercises */}
        {viewMode === 'current' && (
          <>
            {/* Day Tabs */}
            {availableDays.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {availableDays.map(d => (
                  <button key={d.id} onClick={() => setActiveDay(d.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${activeDay === d.id ? 'bg-green-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
                    {d.name}
                  </button>
                ))}
              </div>
            )}

            {currentDay && (
              <div className="mb-2">
                <h2 className="font-bold text-gray-900">{currentDay.name}</h2>
                {currentDay.focus && <p className="text-sm text-gray-500">{currentDay.focus}</p>}
                {currentDay.status === 'available' && allDone && (
                  <p className="text-xs text-green-600 mt-1 font-medium">All exercises pre-filled as complete. Tap any exercise to adjust if needed.</p>
                )}
              </div>
            )}

            {/* Complete Day Button — Top position for zero-friction flow */}
            {currentDay && currentDay.status === 'available' && currentExercises.length > 0 && allDone && (
              <button onClick={completeDay} disabled={saving}
                className="w-full py-4 font-bold rounded-2xl text-lg bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/30 transition-all active:scale-[0.98] disabled:opacity-50">
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Saving...
                  </span>
                ) : 'Done — Complete Workout'}
              </button>
            )}

            {currentExercises.length === 0 && (
              <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-200">
                <p className="text-gray-500">No exercises for this day</p>
              </div>
            )}

            {/* Exercise Cards */}
            {currentExercises.map((pe, idx) => {
              const ex = pe.mf_exercises || {};
              const edits = exerciseEdits[pe.id] || {};
              const isCompleted = completedExercises[pe.id];
              const isEditing = editingExercise === pe.id;
              const intensityChange = pe.intensity_change;

              return (
                <div key={pe.id}
                  className={`bg-white rounded-2xl shadow-sm overflow-hidden border-2 transition-all duration-300 ${
                    isCompleted ? 'border-green-400 bg-green-50/50' : 'border-gray-100'
                  }`}>

                  {/* Card Header */}
                  <div className="px-4 pt-4 pb-2 flex items-start justify-between">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {/* Exercise Number / Check */}
                      <button onClick={() => toggleComplete(pe.id)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                          isCompleted
                            ? 'bg-green-500 text-white shadow-lg shadow-green-500/30 scale-110'
                            : 'bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-600'
                        }`}>
                        {isCompleted ? (
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        ) : (
                          <span className="text-sm font-bold">{idx + 1}</span>
                        )}
                      </button>

                      <div className="min-w-0">
                        <h3 className={`font-semibold text-sm ${isCompleted ? 'text-green-700' : 'text-gray-900'}`}>
                          {ex.name || 'Exercise'}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${CATEGORY_COLORS[ex.category] || 'bg-gray-100 text-gray-600'}`}>
                            {(ex.category || 'general').replace('_', ' ')}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            ex.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                            ex.difficulty === 'hard' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {ex.difficulty || 'medium'}
                          </span>
                          {intensityChange && intensityChange !== 0 && (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              intensityChange > 0 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {intensityChange > 0 ? '+' : ''}{intensityChange}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Edit Toggle */}
                    <button onClick={() => setEditingExercise(isEditing ? null : pe.id)}
                      className={`p-1.5 rounded-lg transition-all ${isEditing ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-gray-600'}`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                      </svg>
                    </button>
                  </div>

                  {/* Prescribed Values — Adjustable */}
                  <div className="px-4 pb-3">
                    <div className={`grid gap-2 ${edits.weight_kg ? 'grid-cols-3' : 'grid-cols-2'}`}>
                      {/* Sets */}
                      <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                        <div className="text-[10px] text-gray-500 font-medium mb-1">SETS</div>
                        <div className="flex items-center justify-center gap-1">
                          {isEditing && (
                            <button onClick={() => adjustValue(pe.id, 'sets', -1)}
                              className="w-6 h-6 rounded-full bg-white border border-gray-300 flex items-center justify-center text-gray-500 hover:border-green-400 hover:text-green-600 active:scale-90 transition-all">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" /></svg>
                            </button>
                          )}
                          <span className="text-xl font-bold text-gray-900 tabular-nums min-w-[2ch] text-center">{edits.sets || pe.sets || 3}</span>
                          {isEditing && (
                            <button onClick={() => adjustValue(pe.id, 'sets', 1)}
                              className="w-6 h-6 rounded-full bg-white border border-gray-300 flex items-center justify-center text-gray-500 hover:border-green-400 hover:text-green-600 active:scale-90 transition-all">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Reps */}
                      <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                        <div className="text-[10px] text-gray-500 font-medium mb-1">REPS</div>
                        <div className="flex items-center justify-center gap-1">
                          {isEditing && (
                            <button onClick={() => adjustValue(pe.id, 'reps', -1)}
                              className="w-6 h-6 rounded-full bg-white border border-gray-300 flex items-center justify-center text-gray-500 hover:border-green-400 hover:text-green-600 active:scale-90 transition-all">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" /></svg>
                            </button>
                          )}
                          <span className="text-xl font-bold text-gray-900 tabular-nums min-w-[2ch] text-center">{edits.reps || pe.reps || 10}</span>
                          {isEditing && (
                            <button onClick={() => adjustValue(pe.id, 'reps', 1)}
                              className="w-6 h-6 rounded-full bg-white border border-gray-300 flex items-center justify-center text-gray-500 hover:border-green-400 hover:text-green-600 active:scale-90 transition-all">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Weight (if applicable) */}
                      {(edits.weight_kg || pe.weight_kg) && (
                        <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                          <div className="text-[10px] text-gray-500 font-medium mb-1">KG</div>
                          <div className="flex items-center justify-center gap-1">
                            {isEditing && (
                              <button onClick={() => adjustValue(pe.id, 'weight_kg', -2.5)}
                                className="w-6 h-6 rounded-full bg-white border border-gray-300 flex items-center justify-center text-gray-500 hover:border-green-400 hover:text-green-600 active:scale-90 transition-all">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" /></svg>
                              </button>
                            )}
                            <span className="text-xl font-bold text-gray-900 tabular-nums min-w-[3ch] text-center">{edits.weight_kg || pe.weight_kg}</span>
                            {isEditing && (
                              <button onClick={() => adjustValue(pe.id, 'weight_kg', 2.5)}
                                className="w-6 h-6 rounded-full bg-white border border-gray-300 flex items-center justify-center text-gray-500 hover:border-green-400 hover:text-green-600 active:scale-90 transition-all">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Rest time + Notes */}
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                      <span>Rest: {edits.rest_sec || pe.rest_sec || 60}s</span>
                      {pe.rpe_target && <span>RPE target: {pe.rpe_target}/10</span>}
                    </div>
                    {pe.notes && (
                      <div className="mt-1.5 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                        {pe.notes}
                      </div>
                    )}

                    {/* Description (collapsible in edit mode) */}
                    {isEditing && ex.description && (
                      <div className="mt-2 text-xs text-gray-600 bg-blue-50 rounded-lg px-3 py-2 border border-blue-100">
                        <span className="font-medium text-blue-700">Instructions: </span>{ex.description}
                      </div>
                    )}
                  </div>

                  {/* Completion Bar */}
                  {isCompleted ? (
                    <div className="bg-green-500 px-4 py-1.5 flex items-center justify-center gap-2 text-white text-xs">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                      <span className="font-medium">Done as prescribed</span>
                      <span className="opacity-70 ml-1">— tap checkmark or edit to change</span>
                    </div>
                  ) : (
                    <div className="bg-amber-100 px-4 py-1.5 flex items-center justify-center gap-2 text-amber-700 text-xs">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                      </svg>
                      <span className="font-medium">Skipped — tap checkmark to mark done</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Complete Day Button — Bottom (shown when player unchecked some exercises) */}
            {currentDay && currentDay.status === 'available' && currentExercises.length > 0 && !allDone && completedCount > 0 && (
              <div className="pt-2">
                <button onClick={completeDay} disabled={saving}
                  className="w-full py-3.5 font-semibold rounded-xl text-lg bg-green-600/80 text-white/90 transition-all disabled:opacity-50">
                  {saving ? 'Saving...' : `Complete Day (${completedCount}/${currentExercises.length} exercises)`}
                </button>
              </div>
            )}

            {/* Completed Days Summary */}
            {completedDays.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Completed</h3>
                <div className="space-y-1.5">
                  {completedDays.map(d => (
                    <div key={d.id} className="bg-white rounded-lg px-3 py-2 border border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        <span className="text-sm text-gray-700">{d.name}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        d.performance_rating === 'exceeded' ? 'bg-green-100 text-green-700' :
                        d.performance_rating === 'below' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {d.performance_rating || 'met'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* FUTURE VIEW — Upcoming days */}
        {viewMode === 'future' && (
          <div className="space-y-3">
            <h2 className="font-bold text-gray-900">Upcoming Workouts</h2>
            <p className="text-sm text-gray-500 mb-2">
              Future workouts adjust automatically based on your performance.
              {plan.performance_trend === 'exceeding' && ' Your intensity is increasing since you\'re exceeding targets!'}
              {plan.performance_trend === 'below' && ' We\'re adjusting intensity down to help you build back up.'}
            </p>

            {upcomingDays.length === 0 && (
              <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
                <p className="text-gray-500 text-sm">No upcoming days remaining. Your plan is complete!</p>
              </div>
            )}

            {upcomingDays.map(day => (
              <div key={day.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm">{day.name}</h3>
                    {day.focus && <p className="text-xs text-gray-500">{day.focus}</p>}
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">Locked</span>
                </div>
                <div className="p-3 space-y-1.5">
                  {(day.mf_plan_exercises || []).map((pe, i) => {
                    const ex = pe.mf_exercises || {};
                    return (
                      <div key={pe.id} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-gray-50">
                        <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-medium shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-700 truncate">{ex.name || 'Exercise'}</div>
                          <div className="text-xs text-gray-400">
                            {pe.sets || 3}x{pe.reps || 10}
                            {pe.weight_kg && ` @ ${pe.weight_kg}kg`}
                            {pe.intensity_change && pe.intensity_change !== 0 && (
                              <span className={pe.intensity_change > 0 ? 'text-green-600 ml-1' : 'text-amber-600 ml-1'}>
                                ({pe.intensity_change > 0 ? '+' : ''}{pe.intensity_change}%)
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${CATEGORY_COLORS[ex.category] || 'bg-gray-100 text-gray-600'}`}>
                          {(ex.category || '').replace('_', ' ')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* WRITEUP VIEW — AI plan analysis */}
        {viewMode === 'writeup' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="font-bold text-gray-900 text-lg mb-1">{plan.name}</h2>
              <p className="text-sm text-gray-500 mb-4">{plan.description}</p>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-500">Duration</div>
                  <div className="text-lg font-bold text-gray-900">{plan.duration_weeks || 4}w</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-500">Phase</div>
                  <div className="text-lg font-bold text-gray-900 capitalize">{plan.phase || 'base'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-500">Difficulty</div>
                  <div className="text-lg font-bold text-gray-900 capitalize">{plan.difficulty || 'intermediate'}</div>
                </div>
              </div>

              {plan.ai_writeup && (
                <div className="prose prose-sm max-w-none">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Coach Analysis</h3>
                  <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                    {plan.ai_writeup}
                  </div>
                </div>
              )}
            </div>

            {/* Plan Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Progress Overview</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{completedDays.length}</div>
                  <div className="text-xs text-gray-500">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{availableDays.length}</div>
                  <div className="text-xs text-gray-500">Available</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-400">{upcomingDays.length}</div>
                  <div className="text-xs text-gray-500">Remaining</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Completion Modal */}
      {showComplete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center animate-bounce-in">
            <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
              completionResult?.performance_rating === 'exceeded' ? 'bg-green-100' :
              completionResult?.performance_rating === 'below' ? 'bg-amber-100' : 'bg-blue-100'
            }`}>
              <svg className={`w-9 h-9 ${
                completionResult?.performance_rating === 'exceeded' ? 'text-green-600' :
                completionResult?.performance_rating === 'below' ? 'text-amber-600' : 'text-blue-600'
              }`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-1">Workout Complete!</h2>
            <p className="text-sm text-gray-500 mb-4">
              {completionResult?.performance_rating === 'exceeded'
                ? 'Amazing! You exceeded expectations. Your plan will intensify!'
                : completionResult?.performance_rating === 'below'
                  ? 'Good effort! We\'ll adjust intensity for next time.'
                  : 'Great work! You met your targets. Keep it up!'}
            </p>

            <div className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold mb-4 ${
              completionResult?.performance_rating === 'exceeded' ? 'bg-green-100 text-green-700' :
              completionResult?.performance_rating === 'below' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {completionResult?.performance_rating === 'exceeded' ? '↑ Intensity Increasing' :
               completionResult?.performance_rating === 'below' ? '↓ Intensity Adjusting' : '→ On Track'}
            </div>

            <div className="space-y-2">
              <button onClick={() => { setShowComplete(false); setViewMode('future'); }}
                className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700">
                View Upcoming Workouts
              </button>
              <button onClick={() => { setShowComplete(false); router.push('/dashboard'); }}
                className="w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200">
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
