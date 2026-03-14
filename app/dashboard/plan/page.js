'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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

const RPE_LABELS = {
  1: 'Very Light', 2: 'Light', 3: 'Light', 4: 'Moderate',
  5: 'Moderate', 6: 'Hard', 7: 'Hard', 8: 'Very Hard',
  9: 'Max Effort', 10: 'Absolute Max',
};
const RPE_COLORS = {
  1: 'bg-green-400', 2: 'bg-green-400', 3: 'bg-green-500', 4: 'bg-lime-500',
  5: 'bg-yellow-400', 6: 'bg-yellow-500', 7: 'bg-orange-400', 8: 'bg-orange-500',
  9: 'bg-red-500', 10: 'bg-red-600',
};

// AI exercise tips — form cues and coaching tips per category
const AI_TIPS = {
  strength: [
    'Brace your core before each rep — exhale at the top',
    'Control the eccentric (lowering) phase for 2-3 seconds',
    'Drive through your heels on pressing movements',
    'Keep your shoulder blades retracted on bench/rows',
  ],
  speed: [
    'Focus on explosive power — fast concentric, controlled eccentric',
    'Full hip extension on every rep',
    'Keep ground contact time minimal on plyometric work',
  ],
  agility: [
    'Stay low — bend at the hips, not the waist',
    'Quick feet, eyes up — look where you want to go',
  ],
  core: [
    'Maintain neutral spine — avoid overarching',
    'Breathe steadily, don\'t hold your breath',
  ],
  flexibility: [
    'Hold each stretch for 20-30 seconds minimum',
    'Breathe into the stretch — never bounce',
  ],
  plyometrics: [
    'Land softly — absorb impact through your legs',
    'Reset between reps — quality over speed',
  ],
};

function getAITip(category, exerciseIdx) {
  const tips = AI_TIPS[category] || AI_TIPS.strength;
  return tips[exerciseIdx % tips.length];
}

// Voice note component using Web Speech API
function VoiceNoteButton({ onTranscript, currentNote }) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  function startListening() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice notes not supported in this browser');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(currentNote ? `${currentNote}. ${transcript}` : transcript);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  function stopListening() {
    if (recognitionRef.current) recognitionRef.current.stop();
    setListening(false);
  }

  return (
    <button
      onClick={listening ? stopListening : startListening}
      className={`p-1.5 rounded-lg transition-all ${listening ? 'bg-red-100 text-red-600 animate-pulse' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
      title={listening ? 'Stop recording' : 'Voice note'}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        {listening ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 0 1 6 0v8.25a3 3 0 0 1-3 3Z" />
        )}
      </svg>
    </button>
  );
}

// RPE Slider component
function RPESlider({ value, onChange }) {
  return (
    <div className="mt-2 px-1">
      <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
        <span>How hard was this?</span>
        <span className="font-semibold text-gray-700">{value}/10 — {RPE_LABELS[value]}</span>
      </div>
      <div className="relative">
        <input
          type="range" min="1" max="10" value={value}
          onChange={e => onChange(parseInt(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #22c55e 0%, #eab308 40%, #ef4444 100%)`,
          }}
        />
        <div className="flex justify-between mt-0.5 px-0.5">
          {[1,2,3,4,5,6,7,8,9,10].map(n => (
            <span key={n} className={`text-[8px] w-3 text-center ${value === n ? 'font-bold text-gray-900' : 'text-gray-300'}`}>{n}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PlanPage() {
  const router = useRouter();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(null);
  const [viewMode, setViewMode] = useState('current'); // current | future | writeup
  const [exerciseEdits, setExerciseEdits] = useState({});
  const [completedExercises, setCompletedExercises] = useState({});
  const [exerciseRPE, setExerciseRPE] = useState({});
  const [exerciseNotes, setExerciseNotes] = useState({});
  const [saving, setSaving] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [completionResult, setCompletionResult] = useState(null);
  const [expandedExercise, setExpandedExercise] = useState(null);
  const [lastPerformance, setLastPerformance] = useState({}); // { exercise_id: { weight, reps, rpe } }

  // Completion modal state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [overallRating, setOverallRating] = useState(null); // exceeded | met | below
  const [overallRPE, setOverallRPE] = useState(7);

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

          // Initialize edits from prescribed values — NO auto-complete
          const edits = {};
          const completed = {};
          const rpes = {};
          const notes = {};
          const lastPerf = {};

          // Build last performance lookup from completed days
          const completedDays = data.mf_plan_days.filter(d => d.status === 'completed');
          completedDays.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));
          for (const cd of completedDays) {
            for (const pe of (cd.mf_plan_exercises || [])) {
              if (pe.completed && pe.exercise_id && !lastPerf[pe.exercise_id]) {
                const actualWeights = Array.isArray(pe.actual_weight) ? pe.actual_weight.filter(w => w > 0) : [];
                const actualReps = Array.isArray(pe.actual_reps) ? pe.actual_reps : [];
                lastPerf[pe.exercise_id] = {
                  weight: actualWeights.length > 0 ? Math.max(...actualWeights) : pe.weight_kg,
                  reps: actualReps.length > 0 ? actualReps[0] : pe.reps,
                  rpe: pe.actual_rpe,
                  date: cd.completed_at,
                };
              }
            }
          }
          setLastPerformance(lastPerf);

          data.mf_plan_days.forEach(day => {
            (day.mf_plan_exercises || []).forEach(pe => {
              // Pre-fill with prescribed values (smart defaults)
              // If there's last performance data, use it as the default weight
              const lp = lastPerf[pe.exercise_id];
              edits[pe.id] = {
                sets: pe.sets || 3,
                reps: pe.reps || 10,
                weight_kg: pe.weight_kg || (lp?.weight) || null,
                duration_sec: pe.duration_sec || null,
                rest_sec: pe.rest_sec || 60,
              };
              // Exercises start UNCHECKED — player marks them as they complete
              completed[pe.id] = pe.completed || false;
              rpes[pe.id] = pe.actual_rpe || (lp?.rpe) || 7;
              notes[pe.id] = pe.player_notes || '';
            });
          });
          setExerciseEdits(edits);
          setCompletedExercises(completed);
          setExerciseRPE(rpes);
          setExerciseNotes(notes);
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
    setCompletedExercises(prev => {
      const newState = !prev[exerciseId];
      // If just completed, expand the exercise to show RPE + notes
      if (newState) setExpandedExercise(exerciseId);
      return { ...prev, [exerciseId]: newState };
    });
  }

  async function handleCompleteDay() {
    // Show rating modal first
    setShowRatingModal(true);
  }

  async function submitCompletion() {
    if (saving) return;
    setSaving(true);
    setShowRatingModal(false);

    const day = plan?.mf_plan_days?.find(d => d.id === activeDay);
    if (!day) { setSaving(false); return; }

    const exercises = (day.mf_plan_exercises || []).map(pe => {
      const edits = exerciseEdits[pe.id] || {};
      const isCompleted = completedExercises[pe.id];
      const sets = edits.sets || pe.sets || 3;
      const reps = edits.reps || pe.reps || 10;
      const weight = edits.weight_kg || pe.weight_kg || null;
      const rpe = exerciseRPE[pe.id] || null;
      const playerNote = exerciseNotes[pe.id] || null;

      return {
        exercise_id: pe.exercise_id,
        plan_exercise_id: pe.id,
        actual_sets: isCompleted ? sets : 0,
        actual_reps: isCompleted ? Array(sets).fill(reps) : [],
        actual_weight: weight ? (isCompleted ? Array(sets).fill(weight) : []) : null,
        actual_rpe: isCompleted ? rpe : null,
        player_notes: playerNote || null,
      };
    });

    try {
      const res = await fetch('/api/exercise-plans/complete-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day_id: activeDay,
          exercises,
          overall_rpe: overallRPE,
          player_rating: overallRating, // player's self-assessment
        }),
      });
      if (res.ok) {
        const result = await res.json();
        setCompletionResult(result);
        setShowComplete(true);
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
      {viewMode === 'current' && currentDay && currentDay.status === 'available' && (
        <div className="bg-white border-b px-4 py-2">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>{completedCount}/{currentExercises.length} exercises done</span>
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
              </div>
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
              const isExpanded = expandedExercise === pe.id;
              const intensityChange = pe.intensity_change;
              const lp = lastPerformance[pe.exercise_id];
              const aiTip = getAITip(ex.category, idx);

              return (
                <div key={pe.id}
                  className={`bg-white rounded-2xl shadow-sm overflow-hidden border-2 transition-all duration-300 ${
                    isCompleted ? 'border-green-400' : 'border-gray-100'
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

                      <div className="min-w-0 flex-1">
                        <h3 className={`font-semibold text-sm ${isCompleted ? 'text-green-700' : 'text-gray-900'}`}>
                          {ex.name || 'Exercise'}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${CATEGORY_COLORS[ex.category] || 'bg-gray-100 text-gray-600'}`}>
                            {(ex.category || 'general').replace('_', ' ')}
                          </span>
                          {intensityChange && intensityChange !== 0 && (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              intensityChange > 0 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {intensityChange > 0 ? '+' : ''}{intensityChange}%
                            </span>
                          )}
                          {lp && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-600">
                              Last: {lp.weight ? `${lp.weight}kg` : `${lp.reps} reps`}
                              {lp.rpe ? ` · RPE ${lp.rpe}` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expand/Collapse */}
                    <button onClick={() => setExpandedExercise(isExpanded ? null : pe.id)}
                      className={`p-1.5 rounded-lg transition-all ${isExpanded ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-gray-600'}`}>
                      <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Prescribed Values — Always adjustable */}
                  <div className="px-4 pb-3">
                    <div className={`grid gap-2 ${edits.weight_kg ? 'grid-cols-3' : 'grid-cols-2'}`}>
                      {/* Sets */}
                      <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                        <div className="text-[10px] text-gray-500 font-medium mb-1">SETS</div>
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => adjustValue(pe.id, 'sets', -1)}
                            className="w-6 h-6 rounded-full bg-white border border-gray-300 flex items-center justify-center text-gray-500 hover:border-green-400 hover:text-green-600 active:scale-90 transition-all">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" /></svg>
                          </button>
                          <span className="text-xl font-bold text-gray-900 tabular-nums min-w-[2ch] text-center">{edits.sets || pe.sets || 3}</span>
                          <button onClick={() => adjustValue(pe.id, 'sets', 1)}
                            className="w-6 h-6 rounded-full bg-white border border-gray-300 flex items-center justify-center text-gray-500 hover:border-green-400 hover:text-green-600 active:scale-90 transition-all">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                          </button>
                        </div>
                      </div>

                      {/* Reps */}
                      <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                        <div className="text-[10px] text-gray-500 font-medium mb-1">REPS</div>
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => adjustValue(pe.id, 'reps', -1)}
                            className="w-6 h-6 rounded-full bg-white border border-gray-300 flex items-center justify-center text-gray-500 hover:border-green-400 hover:text-green-600 active:scale-90 transition-all">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" /></svg>
                          </button>
                          <span className="text-xl font-bold text-gray-900 tabular-nums min-w-[2ch] text-center">{edits.reps || pe.reps || 10}</span>
                          <button onClick={() => adjustValue(pe.id, 'reps', 1)}
                            className="w-6 h-6 rounded-full bg-white border border-gray-300 flex items-center justify-center text-gray-500 hover:border-green-400 hover:text-green-600 active:scale-90 transition-all">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                          </button>
                        </div>
                      </div>

                      {/* Weight (if applicable) */}
                      {(edits.weight_kg || pe.weight_kg) && (
                        <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                          <div className="text-[10px] text-gray-500 font-medium mb-1">KG</div>
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => adjustValue(pe.id, 'weight_kg', -2.5)}
                              className="w-6 h-6 rounded-full bg-white border border-gray-300 flex items-center justify-center text-gray-500 hover:border-green-400 hover:text-green-600 active:scale-90 transition-all">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" /></svg>
                            </button>
                            <span className="text-xl font-bold text-gray-900 tabular-nums min-w-[3ch] text-center">{edits.weight_kg || pe.weight_kg}</span>
                            <button onClick={() => adjustValue(pe.id, 'weight_kg', 2.5)}
                              className="w-6 h-6 rounded-full bg-white border border-gray-300 flex items-center justify-center text-gray-500 hover:border-green-400 hover:text-green-600 active:scale-90 transition-all">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Rest + RPE target */}
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                      <span>Rest: {edits.rest_sec || pe.rest_sec || 60}s</span>
                      {pe.rpe_target && <span>RPE target: {pe.rpe_target}/10</span>}
                    </div>

                    {/* AI Coaching Tip */}
                    <div className="mt-2 flex items-start gap-1.5 text-[11px] text-indigo-600 bg-indigo-50 rounded-lg px-2.5 py-1.5 border border-indigo-100">
                      <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
                      </svg>
                      <span>{aiTip}</span>
                    </div>
                  </div>

                  {/* Expanded: RPE + Notes + Voice (shown when exercise is expanded or just completed) */}
                  {(isExpanded || isCompleted) && (
                    <div className="px-4 pb-3 space-y-2 border-t border-gray-100 pt-2">
                      {/* RPE Slider */}
                      <RPESlider
                        value={exerciseRPE[pe.id] || 7}
                        onChange={val => setExerciseRPE(prev => ({ ...prev, [pe.id]: val }))}
                      />

                      {/* Notes + Voice */}
                      <div className="flex items-start gap-2">
                        <input
                          type="text"
                          value={exerciseNotes[pe.id] || ''}
                          onChange={e => setExerciseNotes(prev => ({ ...prev, [pe.id]: e.target.value }))}
                          placeholder="Notes (e.g., felt knee pain, grip fatigued...)"
                          className="flex-1 text-xs px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none"
                        />
                        <VoiceNoteButton
                          currentNote={exerciseNotes[pe.id]}
                          onTranscript={text => setExerciseNotes(prev => ({ ...prev, [pe.id]: text }))}
                        />
                      </div>

                      {/* Exercise description/instructions */}
                      {ex.description && (
                        <div className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                          <span className="font-medium text-gray-700">How to: </span>{ex.description}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Status Bar */}
                  {isCompleted ? (
                    <div className="bg-green-500 px-4 py-1.5 flex items-center justify-center gap-2 text-white text-xs">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                      <span className="font-medium">Done</span>
                      {exerciseRPE[pe.id] && (
                        <span className="opacity-80 ml-1">RPE {exerciseRPE[pe.id]}</span>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-100 px-4 py-1.5 flex items-center justify-center gap-2 text-gray-500 text-xs">
                      <span className="font-medium">Tap checkmark when done</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Complete Day Button */}
            {currentDay && currentDay.status === 'available' && completedCount > 0 && (
              <div className="pt-2">
                <button onClick={handleCompleteDay} disabled={saving}
                  className={`w-full py-4 font-bold rounded-2xl text-lg shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 ${
                    completedCount === currentExercises.length
                      ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-600/30'
                      : 'bg-green-600/80 text-white/90 shadow-green-600/20'
                  }`}>
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Saving...
                    </span>
                  ) : `Complete Workout (${completedCount}/${currentExercises.length})`}
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
                      <div className="flex items-center gap-2">
                        {d.overall_rpe && <span className="text-[10px] text-gray-400">RPE {d.overall_rpe}</span>}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          d.performance_rating === 'exceeded' ? 'bg-green-100 text-green-700' :
                          d.performance_rating === 'below' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {d.performance_rating || 'met'}
                        </span>
                      </div>
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

      {/* Rating Modal — shown before final submission */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4 sm:items-center">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm animate-slide-up">
            <h2 className="text-lg font-bold text-gray-900 mb-1 text-center">How was your workout?</h2>
            <p className="text-sm text-gray-500 mb-4 text-center">
              {completedCount}/{currentExercises.length} exercises completed
            </p>

            {/* Overall Feeling */}
            <div className="flex gap-2 mb-5">
              {[
                { key: 'exceeded', label: 'Crushed It', icon: '↑', color: 'border-green-400 bg-green-50 text-green-700', active: 'ring-2 ring-green-500' },
                { key: 'met', label: 'Solid', icon: '→', color: 'border-blue-400 bg-blue-50 text-blue-700', active: 'ring-2 ring-blue-500' },
                { key: 'below', label: 'Tough Day', icon: '↓', color: 'border-amber-400 bg-amber-50 text-amber-700', active: 'ring-2 ring-amber-500' },
              ].map(r => (
                <button key={r.key}
                  onClick={() => setOverallRating(r.key)}
                  className={`flex-1 py-3 rounded-xl border-2 text-center transition-all ${r.color} ${overallRating === r.key ? r.active + ' scale-105' : 'opacity-60 hover:opacity-100'}`}>
                  <div className="text-lg font-bold">{r.icon}</div>
                  <div className="text-xs font-medium mt-0.5">{r.label}</div>
                </button>
              ))}
            </div>

            {/* Overall RPE */}
            <div className="mb-5">
              <div className="text-sm font-medium text-gray-700 mb-2">Overall Effort</div>
              <RPESlider value={overallRPE} onChange={setOverallRPE} />
            </div>

            {/* Submit */}
            <button onClick={submitCompletion} disabled={saving || !overallRating}
              className="w-full py-3.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-all">
              {saving ? 'Saving...' : 'Submit Workout'}
            </button>
            <button onClick={() => setShowRatingModal(false)}
              className="w-full py-2 text-gray-500 text-sm mt-2">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Completion Result Modal */}
      {showComplete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center">
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
            <p className="text-sm text-gray-500 mb-3">
              {completionResult?.performance_rating === 'exceeded'
                ? 'Amazing! You exceeded expectations. Plan intensity will increase!'
                : completionResult?.performance_rating === 'below'
                  ? 'Good effort! Intensity adjusted for next time.'
                  : 'Great work! You met your targets.'}
            </p>

            {/* AI Session Summary */}
            {completionResult?.ai_summary && (
              <div className="bg-indigo-50 rounded-xl px-4 py-3 mb-4 text-left border border-indigo-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
                  </svg>
                  <span className="text-[10px] font-semibold text-indigo-700 uppercase">AI Coach Note</span>
                </div>
                <p className="text-xs text-indigo-800 leading-relaxed">{completionResult.ai_summary}</p>
              </div>
            )}

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

      <style jsx>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: white;
          border: 3px solid #22c55e;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
}
