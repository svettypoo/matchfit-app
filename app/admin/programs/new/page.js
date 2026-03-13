'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const PHASES = [
  { value: 'general', label: 'General' },
  { value: 'pre-season', label: 'Pre-Season' },
  { value: 'in-season', label: 'In-Season' },
  { value: 'off-season', label: 'Off-Season' },
  { value: 'recovery', label: 'Recovery' },
];
const DIFFICULTIES = [
  { value: 'easy', label: 'Easy', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'hard', label: 'Hard', color: 'bg-red-100 text-red-700' },
];

function emptySchedule() {
  return DAYS.reduce((acc, d) => ({ ...acc, [d]: { active: false, name: '', exercises: [] } }), {});
}

export default function NewProgramPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Basics
  const [basics, setBasics] = useState({
    name: '', description: '', duration_weeks: 4, phase: 'general', difficulty: 'medium',
  });

  // Step 2: Multi-week schedule — weekSchedules[weekIdx] = { Monday: {...}, ... }
  const [weekSchedules, setWeekSchedules] = useState([emptySchedule()]);
  const [activeWeek, setActiveWeek] = useState(0);

  // Exercise search
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [activeDay, setActiveDay] = useState(null);
  const [showExerciseSearch, setShowExerciseSearch] = useState(false);
  const searchTimeout = useRef(null);

  // Expanded exercise config
  const [expandedExercise, setExpandedExercise] = useState(null); // { day, idx }

  // Copy Day
  const [showCopyDay, setShowCopyDay] = useState(false);
  const [copySource, setCopySource] = useState(null);

  // Drag state
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  // Step 3: Auto-Progression
  const [progression, setProgression] = useState({
    weight_increase_pct: 2.5,
    rpe_increase_per_week: 0.5,
    deload_enabled: true,
    deload_week: 4,
    deload_volume_pct: 60,
    deload_intensity_pct: 70,
  });

  // Templates
  const [templates, setTemplates] = useState([]);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Sync weekSchedules length with duration_weeks
  useEffect(() => {
    const target = basics.duration_weeks;
    setWeekSchedules(prev => {
      if (prev.length === target) return prev;
      if (prev.length < target) {
        // Add weeks — copy from week 1 as base
        const extra = [];
        for (let i = prev.length; i < target; i++) {
          extra.push(JSON.parse(JSON.stringify(prev[0])));
        }
        return [...prev, ...extra];
      }
      return prev.slice(0, target);
    });
    setActiveWeek(w => Math.min(w, target - 1));
  }, [basics.duration_weeks]);

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    setLoadingTemplates(true);
    try {
      const user = JSON.parse(localStorage.getItem('mf_user') || '{}');
      const res = await fetch(`/api/programs?coach_id=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setTemplates((data.programs || []).filter(p => p.is_template));
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
    setLoadingTemplates(false);
  }

  async function loadTemplate(templateId) {
    if (!templateId) return;
    try {
      const res = await fetch(`/api/programs/${templateId}`);
      if (res.ok) {
        const prog = await res.json();
        setBasics(b => ({
          ...b,
          name: prog.name + ' (copy)',
          description: prog.description || '',
          duration_weeks: prog.duration_weeks || 4,
          phase: prog.phase_type || 'general',
          difficulty: prog.difficulty || 'medium',
        }));
        // Rebuild schedule from template days
        const baseSchedule = emptySchedule();
        if (prog.mf_program_days) {
          for (const day of prog.mf_program_days) {
            const dayName = day.day_of_week;
            if (dayName && DAYS.includes(dayName)) {
              baseSchedule[dayName] = {
                active: true,
                name: day.name || '',
                exercises: (day.mf_program_exercises || []).map(ex => ({
                  id: ex.mf_exercises?.id || ex.exercise_id,
                  exercise_id: ex.exercise_id,
                  name: ex.mf_exercises?.name || 'Unknown',
                  category: ex.mf_exercises?.category || '',
                  muscle_groups: ex.mf_exercises?.muscle_groups || [],
                  sets: ex.sets || 3,
                  reps: ex.reps || 10,
                  weight_kg: ex.weight_kg || '',
                  duration_sec: ex.duration_sec || '',
                  rest_sec: ex.rest_sec || 60,
                  rpe_target: ex.rpe_target || 7,
                  notes: ex.notes || '',
                })),
              };
            }
          }
        }
        const weeks = [];
        for (let i = 0; i < (prog.duration_weeks || 4); i++) {
          weeks.push(JSON.parse(JSON.stringify(baseSchedule)));
        }
        setWeekSchedules(weeks);
        setActiveWeek(0);
      }
    } catch (err) {
      console.error('Failed to load template:', err);
    }
  }

  // Current week's schedule shorthand
  const schedule = weekSchedules[activeWeek] || emptySchedule();

  function updateCurrentWeekSchedule(updater) {
    setWeekSchedules(prev => {
      const next = [...prev];
      next[activeWeek] = typeof updater === 'function' ? updater(next[activeWeek]) : updater;
      return next;
    });
  }

  // Exercise search with debounce
  async function searchExercises(q) {
    setExerciseSearch(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (q.length < 2) { setSearchResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      try {
        const user = JSON.parse(localStorage.getItem('mf_user') || '{}');
        const res = await fetch(`/api/exercises?search=${encodeURIComponent(q)}&coach_id=${user.id || ''}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.exercises || []);
        }
      } catch (err) {
        console.error(err);
      }
    }, 250);
  }

  function addExerciseToDay(day, exercise) {
    updateCurrentWeekSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        exercises: [...prev[day].exercises, {
          id: exercise.id,
          exercise_id: exercise.id,
          name: exercise.name,
          category: exercise.category,
          muscle_groups: exercise.muscle_groups || [],
          sets: exercise.default_sets || 3,
          reps: exercise.default_reps || 10,
          weight_kg: exercise.default_weight_kg || '',
          duration_sec: exercise.default_duration_sec || '',
          rest_sec: exercise.default_rest_sec || 60,
          rpe_target: 7,
          notes: '',
        }],
      },
    }));
    setShowExerciseSearch(false);
    setExerciseSearch('');
    setSearchResults([]);
  }

  function removeExercise(day, idx) {
    updateCurrentWeekSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        exercises: prev[day].exercises.filter((_, i) => i !== idx),
      },
    }));
    if (expandedExercise?.day === day && expandedExercise?.idx === idx) {
      setExpandedExercise(null);
    }
  }

  function updateExercise(day, idx, field, value) {
    updateCurrentWeekSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        exercises: prev[day].exercises.map((ex, i) =>
          i === idx ? { ...ex, [field]: value } : ex
        ),
      },
    }));
  }

  // --- Drag & Drop ---
  function handleDragStart(e, day, idx) {
    dragItem.current = { day, idx };
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${day}:${idx}`);
    e.currentTarget.style.opacity = '0.5';
  }

  function handleDragEnd(e) {
    e.currentTarget.style.opacity = '1';
    dragItem.current = null;
    dragOverItem.current = null;
  }

  function handleDragOver(e, day, idx) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    dragOverItem.current = { day, idx };
  }

  function handleDrop(e, targetDay, targetIdx) {
    e.preventDefault();
    const source = dragItem.current;
    if (!source) return;

    if (source.day === targetDay) {
      // Reorder within same day
      updateCurrentWeekSchedule(prev => {
        const exercises = [...prev[targetDay].exercises];
        const [moved] = exercises.splice(source.idx, 1);
        exercises.splice(targetIdx, 0, moved);
        return { ...prev, [targetDay]: { ...prev[targetDay], exercises } };
      });
    } else {
      // Move between days
      updateCurrentWeekSchedule(prev => {
        const srcExercises = [...prev[source.day].exercises];
        const [moved] = srcExercises.splice(source.idx, 1);
        const dstExercises = [...prev[targetDay].exercises];
        dstExercises.splice(targetIdx, 0, moved);
        return {
          ...prev,
          [source.day]: { ...prev[source.day], exercises: srcExercises },
          [targetDay]: { ...prev[targetDay], exercises: dstExercises },
        };
      });
    }

    dragItem.current = null;
    dragOverItem.current = null;
  }

  function handleDropOnDay(e, targetDay) {
    e.preventDefault();
    const source = dragItem.current;
    if (!source || source.day === targetDay) return;

    updateCurrentWeekSchedule(prev => {
      const srcExercises = [...prev[source.day].exercises];
      const [moved] = srcExercises.splice(source.idx, 1);
      const dstExercises = [...prev[targetDay].exercises, moved];
      return {
        ...prev,
        [source.day]: { ...prev[source.day], exercises: srcExercises },
        [targetDay]: { ...prev[targetDay], exercises: dstExercises },
      };
    });

    dragItem.current = null;
  }

  // --- Copy Day ---
  function startCopyDay(sourceDay) {
    setCopySource(sourceDay);
    setShowCopyDay(true);
  }

  function executeCopyDay(targetDay, targetWeek) {
    const sourceExercises = JSON.parse(JSON.stringify(
      (targetWeek === activeWeek ? schedule : weekSchedules[targetWeek])?.[copySource]?.exercises || []
    ));
    const sourceName = schedule[copySource]?.name || '';

    if (targetWeek === activeWeek) {
      updateCurrentWeekSchedule(prev => ({
        ...prev,
        [targetDay]: {
          active: true,
          name: sourceName ? `${sourceName} (copy)` : '',
          exercises: JSON.parse(JSON.stringify(schedule[copySource]?.exercises || [])),
        },
      }));
    } else {
      setWeekSchedules(prev => {
        const next = [...prev];
        next[targetWeek] = {
          ...next[targetWeek],
          [targetDay]: {
            active: true,
            name: sourceName ? `${sourceName} (copy)` : '',
            exercises: JSON.parse(JSON.stringify(schedule[copySource]?.exercises || [])),
          },
        };
        return next;
      });
    }
    setShowCopyDay(false);
    setCopySource(null);
  }

  // --- Copy entire week ---
  function copyWeekToAll() {
    setWeekSchedules(prev => {
      const source = JSON.parse(JSON.stringify(prev[activeWeek]));
      return prev.map((_, i) => i === activeWeek ? prev[i] : JSON.parse(JSON.stringify(source)));
    });
  }

  // --- Save ---
  async function saveProgram() {
    setSaving(true);
    setError('');
    const user = JSON.parse(localStorage.getItem('mf_user') || '{}');

    // Build days array from week 1 schedule (the base template)
    // Multi-week progression metadata is stored separately
    const baseSchedule = weekSchedules[0];
    const days = DAYS
      .filter(d => baseSchedule[d]?.active)
      .map(d => ({
        day_of_week: d,
        name: baseSchedule[d].name || null,
        exercises: baseSchedule[d].exercises.map(ex => ({
          exercise_id: ex.exercise_id || ex.id,
          sets: parseInt(ex.sets) || 3,
          reps: parseInt(ex.reps) || null,
          duration_sec: parseInt(ex.duration_sec) || null,
          rest_sec: parseInt(ex.rest_sec) || 60,
          rpe_target: parseFloat(ex.rpe_target) || null,
          weight_kg: parseFloat(ex.weight_kg) || null,
          notes: ex.notes || null,
        })),
      }));

    try {
      const res = await fetch('/api/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coach_id: user.id,
          name: basics.name,
          description: basics.description || null,
          duration_weeks: basics.duration_weeks,
          phase_type: basics.phase,
          difficulty: basics.difficulty,
          days,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const programId = data.id;

        // If save as template, update the flag
        if (saveAsTemplate && programId) {
          await fetch(`/api/programs/${programId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_template: true }),
          });
        }

        router.push(`/admin/programs/${programId}`);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || 'Failed to save program');
      }
    } catch (err) {
      console.error(err);
      setError('Network error — please try again');
    }
    setSaving(false);
  }

  // --- Total exercise/set counts for review ---
  const totalExercises = DAYS.reduce((sum, d) => sum + (schedule[d]?.exercises?.length || 0), 0);
  const totalSets = DAYS.reduce((sum, d) => {
    return sum + (schedule[d]?.exercises || []).reduce((s, ex) => s + (parseInt(ex.sets) || 0), 0);
  }, 0);
  const activeDays = DAYS.filter(d => schedule[d]?.active);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600 mb-1 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Create Program</h1>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1">
          {['Basics', 'Schedule', 'Progression', 'Review'].map((label, i) => (
            <div key={i} className="flex items-center">
              <button
                onClick={() => setStep(i + 1)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  step === i + 1
                    ? 'bg-green-600 text-white shadow-md shadow-green-200'
                    : step > i + 1
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                  {step > i + 1 ? (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </button>
              {i < 3 && <div className={`w-6 h-0.5 ${step > i + 1 ? 'bg-green-300' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 font-bold">x</button>
        </div>
      )}

      {/* ================================================= */}
      {/* STEP 1: Program Basics                             */}
      {/* ================================================= */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Template Loader */}
          {templates.length > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-green-700">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span className="text-sm font-semibold">Load from Template</span>
                </div>
                <select
                  onChange={e => loadTemplate(e.target.value)}
                  className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-green-300 bg-white text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  defaultValue=""
                >
                  <option value="" disabled>Select a template...</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.duration_weeks}w, {t.difficulty})</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-5">
            <h2 className="text-lg font-semibold text-gray-900">Program Basics</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Program Name *</label>
              <input
                type="text"
                value={basics.name}
                onChange={e => setBasics(b => ({ ...b, name: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                placeholder="e.g. Pre-Season Strength Phase"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={basics.description}
                onChange={e => setBasics(b => ({ ...b, description: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all resize-none"
                rows={2}
                placeholder="Brief program description..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (weeks)</label>
                <input
                  type="number"
                  value={basics.duration_weeks}
                  onChange={e => setBasics(b => ({ ...b, duration_weeks: Math.max(1, Math.min(52, parseInt(e.target.value) || 1)) }))}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none"
                  min="1" max="52"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phase</label>
                <select
                  value={basics.phase}
                  onChange={e => setBasics(b => ({ ...b, phase: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none"
                >
                  {PHASES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                <div className="flex gap-2">
                  {DIFFICULTIES.map(d => (
                    <button
                      key={d.value}
                      onClick={() => setBasics(b => ({ ...b, difficulty: d.value }))}
                      className={`flex-1 py-3 rounded-lg text-sm font-medium border-2 transition-all ${
                        basics.difficulty === d.value
                          ? `${d.color} border-current`
                          : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Save as Template toggle */}
            <label className="flex items-center gap-3 pt-2 cursor-pointer">
              <div
                onClick={() => setSaveAsTemplate(!saveAsTemplate)}
                className={`w-10 h-6 rounded-full transition-all relative cursor-pointer ${
                  saveAsTemplate ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                  saveAsTemplate ? 'left-[18px]' : 'left-0.5'
                }`} />
              </div>
              <span className="text-sm text-gray-700">Save as reusable template</span>
            </label>

            <button
              onClick={() => setStep(2)}
              disabled={!basics.name}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next: Build Schedule
            </button>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* STEP 2: Weekly Schedule Builder                    */}
      {/* ================================================= */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Week tabs */}
          {basics.duration_weeks > 1 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-500 mr-1">Week:</span>
              {Array.from({ length: basics.duration_weeks }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveWeek(i)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    activeWeek === i
                      ? 'bg-green-600 text-white shadow-md shadow-green-200'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-green-300 hover:text-green-600'
                  }`}
                >
                  {progression.deload_enabled && i + 1 === progression.deload_week ? (
                    <span className="flex items-center gap-1">
                      W{i + 1}
                      <span className="text-[10px] opacity-75">deload</span>
                    </span>
                  ) : (
                    `W${i + 1}`
                  )}
                </button>
              ))}
              <button
                onClick={copyWeekToAll}
                className="ml-auto text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg border border-green-200 hover:bg-green-50 transition-all"
                title="Copy this week's schedule to all other weeks"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy to all weeks
              </button>
            </div>
          )}

          <h2 className="text-lg font-semibold text-gray-900">
            Weekly Schedule {basics.duration_weeks > 1 && `— Week ${activeWeek + 1}`}
          </h2>

          {/* Day columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            {DAYS.map(day => (
              <div
                key={day}
                className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all ${
                  schedule[day]?.active ? 'border-green-200' : 'border-gray-100'
                }`}
                onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                onDrop={e => handleDropOnDay(e, day)}
              >
                {/* Day header */}
                <div className={`px-3 py-2.5 border-b flex items-center justify-between ${
                  schedule[day]?.active ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'
                }`}>
                  <span className={`text-sm font-semibold ${schedule[day]?.active ? 'text-green-700' : 'text-gray-500'}`}>
                    {day.slice(0, 3)}
                  </span>
                  <div className="flex items-center gap-1">
                    {schedule[day]?.active && schedule[day]?.exercises?.length > 0 && (
                      <button
                        onClick={() => startCopyDay(day)}
                        className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-green-600 rounded transition-all"
                        title="Copy this day"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => updateCurrentWeekSchedule(prev => ({
                        ...prev,
                        [day]: { ...prev[day], active: !prev[day]?.active },
                      }))}
                      className={`w-6 h-6 rounded-md border-2 flex items-center justify-center text-xs transition-all ${
                        schedule[day]?.active
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-green-400'
                      }`}
                    >
                      {schedule[day]?.active && (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Day content */}
                {schedule[day]?.active && (
                  <div className="p-2 space-y-2">
                    {/* Workout name */}
                    <input
                      type="text"
                      value={schedule[day]?.name || ''}
                      onChange={e => updateCurrentWeekSchedule(prev => ({
                        ...prev,
                        [day]: { ...prev[day], name: e.target.value },
                      }))}
                      className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-md focus:ring-1 focus:ring-green-400 outline-none"
                      placeholder="Workout name"
                    />

                    {/* Exercise list */}
                    {(schedule[day]?.exercises || []).map((ex, i) => {
                      const isExpanded = expandedExercise?.day === day && expandedExercise?.idx === i;
                      return (
                        <div
                          key={i}
                          draggable
                          onDragStart={e => handleDragStart(e, day, i)}
                          onDragEnd={handleDragEnd}
                          onDragOver={e => handleDragOver(e, day, i)}
                          onDrop={e => { e.stopPropagation(); handleDrop(e, day, i); }}
                          className={`rounded-lg border transition-all cursor-grab active:cursor-grabbing ${
                            isExpanded
                              ? 'bg-white border-green-300 shadow-md'
                              : 'bg-gray-50 border-gray-100 hover:border-green-200'
                          }`}
                        >
                          {/* Compact view */}
                          <div className="p-2 text-xs">
                            <div className="flex items-center gap-1">
                              {/* Drag handle */}
                              <span className="text-gray-300 flex-shrink-0 cursor-grab">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                  <circle cx="9" cy="5" r="1.5" /><circle cx="15" cy="5" r="1.5" />
                                  <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
                                  <circle cx="9" cy="19" r="1.5" /><circle cx="15" cy="19" r="1.5" />
                                </svg>
                              </span>
                              <span
                                className="font-medium text-gray-800 truncate flex-1 cursor-pointer hover:text-green-600"
                                onClick={() => setExpandedExercise(isExpanded ? null : { day, idx: i })}
                                title={ex.name}
                              >
                                {ex.name}
                              </span>
                              <button
                                onClick={() => removeExercise(day, i)}
                                className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            <div className="flex gap-1 mt-1 text-gray-500">
                              <span>{ex.sets}x{ex.reps}</span>
                              {ex.weight_kg && <span>@ {ex.weight_kg}kg</span>}
                              {ex.rpe_target && <span className="text-green-600">RPE {ex.rpe_target}</span>}
                            </div>
                          </div>

                          {/* Expanded config */}
                          {isExpanded && (
                            <div className="px-2 pb-2 space-y-2 border-t border-green-100 pt-2">
                              <div className="grid grid-cols-2 gap-1.5">
                                <div>
                                  <label className="text-[10px] text-gray-500 uppercase tracking-wide">Sets</label>
                                  <input
                                    type="number"
                                    value={ex.sets}
                                    onChange={e => updateExercise(day, i, 'sets', parseInt(e.target.value) || 0)}
                                    className="w-full text-xs px-2 py-1 border rounded-md focus:ring-1 focus:ring-green-400 outline-none"
                                    min="1"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-gray-500 uppercase tracking-wide">Reps</label>
                                  <input
                                    type="number"
                                    value={ex.reps}
                                    onChange={e => updateExercise(day, i, 'reps', parseInt(e.target.value) || 0)}
                                    className="w-full text-xs px-2 py-1 border rounded-md focus:ring-1 focus:ring-green-400 outline-none"
                                    min="1"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-gray-500 uppercase tracking-wide">Weight (kg)</label>
                                  <input
                                    type="number"
                                    value={ex.weight_kg}
                                    onChange={e => updateExercise(day, i, 'weight_kg', e.target.value)}
                                    className="w-full text-xs px-2 py-1 border rounded-md focus:ring-1 focus:ring-green-400 outline-none"
                                    step="0.5"
                                    placeholder="--"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-gray-500 uppercase tracking-wide">Rest (sec)</label>
                                  <input
                                    type="number"
                                    value={ex.rest_sec}
                                    onChange={e => updateExercise(day, i, 'rest_sec', parseInt(e.target.value) || 0)}
                                    className="w-full text-xs px-2 py-1 border rounded-md focus:ring-1 focus:ring-green-400 outline-none"
                                    step="15"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-gray-500 uppercase tracking-wide">RPE Target</label>
                                  <input
                                    type="number"
                                    value={ex.rpe_target}
                                    onChange={e => updateExercise(day, i, 'rpe_target', parseFloat(e.target.value) || 0)}
                                    className="w-full text-xs px-2 py-1 border rounded-md focus:ring-1 focus:ring-green-400 outline-none"
                                    min="1" max="10" step="0.5"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-gray-500 uppercase tracking-wide">Duration (sec)</label>
                                  <input
                                    type="number"
                                    value={ex.duration_sec}
                                    onChange={e => updateExercise(day, i, 'duration_sec', e.target.value)}
                                    className="w-full text-xs px-2 py-1 border rounded-md focus:ring-1 focus:ring-green-400 outline-none"
                                    placeholder="--"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="text-[10px] text-gray-500 uppercase tracking-wide">Notes</label>
                                <textarea
                                  value={ex.notes}
                                  onChange={e => updateExercise(day, i, 'notes', e.target.value)}
                                  className="w-full text-xs px-2 py-1 border rounded-md focus:ring-1 focus:ring-green-400 outline-none resize-none"
                                  rows={2}
                                  placeholder="Coaching cues, tempo, etc."
                                />
                              </div>
                              {ex.category && (
                                <div className="flex gap-1 flex-wrap">
                                  <span className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-600 rounded-full capitalize">{ex.category}</span>
                                  {(ex.muscle_groups || []).map(mg => (
                                    <span key={mg} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">{mg}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Add exercise button */}
                    <button
                      onClick={() => { setActiveDay(day); setShowExerciseSearch(true); }}
                      className="w-full text-xs text-green-600 font-medium py-2 border border-dashed border-green-300 rounded-lg hover:bg-green-50 hover:border-green-400 transition-all flex items-center justify-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Exercise
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Summary bar */}
          <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between flex-wrap gap-2 text-sm">
            <div className="flex gap-4 text-gray-600">
              <span><strong className="text-gray-900">{activeDays.length}</strong> training days</span>
              <span><strong className="text-gray-900">{totalExercises}</strong> exercises</span>
              <span><strong className="text-gray-900">{totalSets}</strong> total sets</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="px-6 py-3 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-all">
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all"
            >
              Next: Auto-Progression
            </button>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* STEP 3: Auto-Progression                           */}
      {/* ================================================= */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Auto-Progression Settings</h2>
              <p className="text-sm text-gray-500 mt-1">Configure how weights, volume, and intensity progress across weeks.</p>
            </div>

            {/* Weight progression */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Weight Increase Per Week
              </h3>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0" max="10" step="0.5"
                  value={progression.weight_increase_pct}
                  onChange={e => setProgression(p => ({ ...p, weight_increase_pct: parseFloat(e.target.value) }))}
                  className="flex-1 accent-green-500"
                />
                <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-bold text-green-600 min-w-[60px] text-center">
                  {progression.weight_increase_pct}%
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Each week, prescribed weights increase by {progression.weight_increase_pct}% over the previous week.
                {progression.weight_increase_pct > 0 && (
                  <> For a 100kg exercise: W1=100, W2={(100 * (1 + progression.weight_increase_pct / 100)).toFixed(1)}, W3={(100 * Math.pow(1 + progression.weight_increase_pct / 100, 2)).toFixed(1)}kg</>
                )}
              </p>
            </div>

            {/* RPE progression */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <svg className="w-4 h-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>
                RPE Increase Per Week
              </h3>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0" max="2" step="0.25"
                  value={progression.rpe_increase_per_week}
                  onChange={e => setProgression(p => ({ ...p, rpe_increase_per_week: parseFloat(e.target.value) }))}
                  className="flex-1 accent-yellow-500"
                />
                <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-bold text-yellow-600 min-w-[60px] text-center">
                  +{progression.rpe_increase_per_week}
                </div>
              </div>
              <p className="text-xs text-gray-500">
                RPE target increases by {progression.rpe_increase_per_week} each week. Starting RPE 7: W1=7, W2={7 + progression.rpe_increase_per_week}, W3={7 + progression.rpe_increase_per_week * 2}
              </p>
            </div>

            {/* Deload week */}
            <div className={`rounded-lg p-4 space-y-3 border transition-all ${
              progression.deload_enabled ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100'
            }`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Deload Week
                </h3>
                <button
                  onClick={() => setProgression(p => ({ ...p, deload_enabled: !p.deload_enabled }))}
                  className={`w-10 h-6 rounded-full transition-all relative ${
                    progression.deload_enabled ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                    progression.deload_enabled ? 'left-[18px]' : 'left-0.5'
                  }`} />
                </button>
              </div>

              {progression.deload_enabled && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-gray-600 font-medium">Deload on Week</label>
                      <select
                        value={progression.deload_week}
                        onChange={e => setProgression(p => ({ ...p, deload_week: parseInt(e.target.value) }))}
                        className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-1 focus:ring-blue-400 outline-none"
                      >
                        {Array.from({ length: basics.duration_weeks }, (_, i) => (
                          <option key={i} value={i + 1}>Week {i + 1}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 font-medium">Volume Reduction</label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="range"
                          min="30" max="80" step="5"
                          value={progression.deload_volume_pct}
                          onChange={e => setProgression(p => ({ ...p, deload_volume_pct: parseInt(e.target.value) }))}
                          className="flex-1 accent-blue-500"
                        />
                        <span className="text-sm font-bold text-blue-600 min-w-[40px] text-right">{progression.deload_volume_pct}%</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 font-medium">Intensity Reduction</label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="range"
                          min="50" max="90" step="5"
                          value={progression.deload_intensity_pct}
                          onChange={e => setProgression(p => ({ ...p, deload_intensity_pct: parseInt(e.target.value) }))}
                          className="flex-1 accent-blue-500"
                        />
                        <span className="text-sm font-bold text-blue-600 min-w-[40px] text-right">{progression.deload_intensity_pct}%</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    On Week {progression.deload_week}, volume drops to {progression.deload_volume_pct}% and intensity to {progression.deload_intensity_pct}% of normal to allow recovery.
                  </p>
                </div>
              )}
            </div>

            {/* Progression preview */}
            {basics.duration_weeks > 1 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <h3 className="text-sm font-semibold text-gray-700">Progression Preview (100kg base)</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-3 py-2 text-left text-gray-500 font-medium">Week</th>
                        <th className="px-3 py-2 text-right text-gray-500 font-medium">Weight</th>
                        <th className="px-3 py-2 text-right text-gray-500 font-medium">RPE</th>
                        <th className="px-3 py-2 text-center text-gray-500 font-medium">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: basics.duration_weeks }, (_, i) => {
                        const isDeload = progression.deload_enabled && (i + 1) === progression.deload_week;
                        const weekMultiplier = Math.pow(1 + progression.weight_increase_pct / 100, i);
                        const weight = isDeload
                          ? (100 * weekMultiplier * progression.deload_intensity_pct / 100)
                          : (100 * weekMultiplier);
                        const rpe = isDeload
                          ? Math.max(5, 7 + progression.rpe_increase_per_week * i - 2)
                          : Math.min(10, 7 + progression.rpe_increase_per_week * i);

                        return (
                          <tr key={i} className={`border-t ${isDeload ? 'bg-blue-50' : ''}`}>
                            <td className="px-3 py-2 font-medium text-gray-800">Week {i + 1}</td>
                            <td className="px-3 py-2 text-right text-gray-700">{weight.toFixed(1)} kg</td>
                            <td className="px-3 py-2 text-right text-gray-700">{rpe.toFixed(1)}</td>
                            <td className="px-3 py-2 text-center">
                              {isDeload ? (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-semibold">DELOAD</span>
                              ) : (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-semibold">TRAIN</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="px-6 py-3 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-all">
              Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all"
            >
              Next: Review
            </button>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* STEP 4: Review & Save                              */}
      {/* ================================================= */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-5">
            <h2 className="text-lg font-semibold text-gray-900">Review Program</h2>

            {/* Program info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-0.5">Name</div>
                <div className="font-semibold text-gray-900 text-sm">{basics.name}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-0.5">Duration</div>
                <div className="font-semibold text-gray-900 text-sm">{basics.duration_weeks} weeks</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-0.5">Phase</div>
                <div className="font-semibold text-gray-900 text-sm capitalize">{basics.phase}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-0.5">Difficulty</div>
                <div className="font-semibold text-gray-900 text-sm capitalize">{basics.difficulty}</div>
              </div>
            </div>

            {basics.description && (
              <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                {basics.description}
              </div>
            )}

            {/* Schedule overview */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3 text-sm">Weekly Schedule (Week 1 base)</h3>
              <div className="space-y-2">
                {DAYS.filter(d => weekSchedules[0]?.[d]?.active).map(day => (
                  <div key={day} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-sm text-gray-900">
                        {day}
                        {weekSchedules[0][day].name && (
                          <span className="text-gray-500 font-normal"> — {weekSchedules[0][day].name}</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {weekSchedules[0][day].exercises.length} exercise{weekSchedules[0][day].exercises.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {weekSchedules[0][day].exercises.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {weekSchedules[0][day].exercises.map((ex, i) => (
                          <div key={i} className="flex items-center justify-between text-xs bg-white rounded px-2 py-1.5">
                            <span className="text-gray-800 font-medium">{i + 1}. {ex.name}</span>
                            <span className="text-gray-500">
                              {ex.sets}x{ex.reps}
                              {ex.weight_kg ? ` @ ${ex.weight_kg}kg` : ''}
                              {ex.rpe_target ? ` RPE ${ex.rpe_target}` : ''}
                              {ex.rest_sec ? ` / ${ex.rest_sec}s rest` : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {DAYS.filter(d => !weekSchedules[0]?.[d]?.active).length > 0 && (
                  <div className="text-xs text-gray-400 mt-1">
                    Rest days: {DAYS.filter(d => !weekSchedules[0]?.[d]?.active).map(d => d.slice(0, 3)).join(', ')}
                  </div>
                )}
              </div>
            </div>

            {/* Progression summary */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-2 text-sm">Progression</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="bg-green-50 rounded-lg p-3 text-green-700">
                  <div className="font-bold">+{progression.weight_increase_pct}% weight/week</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3 text-yellow-700">
                  <div className="font-bold">+{progression.rpe_increase_per_week} RPE/week</div>
                </div>
                {progression.deload_enabled ? (
                  <div className="bg-blue-50 rounded-lg p-3 text-blue-700">
                    <div className="font-bold">Deload on Week {progression.deload_week}</div>
                    <div className="text-[10px] mt-0.5">Vol {progression.deload_volume_pct}% / Int {progression.deload_intensity_pct}%</div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-3 text-gray-500">
                    <div className="font-bold">No deload week</div>
                  </div>
                )}
              </div>
            </div>

            {saveAsTemplate && (
              <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-700 font-medium flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                This program will be saved as a reusable template
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(3)} className="px-6 py-3 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-all">
              Back
            </button>
            <button
              onClick={saveProgram}
              disabled={saving}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Program'
              )}
            </button>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* Exercise Search Modal                              */}
      {/* ================================================= */}
      {showExerciseSearch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-5 w-full sm:max-w-md max-h-[85vh] sm:max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">Add Exercise — {activeDay}</h3>
              <button
                onClick={() => { setShowExerciseSearch(false); setSearchResults([]); setExerciseSearch(''); }}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <input
              type="text"
              value={exerciseSearch}
              onChange={e => searchExercises(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none mb-3"
              placeholder="Search exercises..."
              autoFocus
            />
            <div className="flex-1 overflow-y-auto space-y-1.5">
              {searchResults.map(ex => (
                <button
                  key={ex.id}
                  onClick={() => addExerciseToDay(activeDay, ex)}
                  className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-green-50 hover:border-green-200 border border-transparent transition-all group"
                >
                  <div className="font-medium text-sm text-gray-900 group-hover:text-green-700">{ex.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                    <span className="capitalize">{ex.category}</span>
                    {ex.muscle_groups?.length > 0 && (
                      <>
                        <span className="text-gray-300">|</span>
                        <span>{ex.muscle_groups.join(', ')}</span>
                      </>
                    )}
                    {ex.difficulty && (
                      <>
                        <span className="text-gray-300">|</span>
                        <span className="capitalize">{ex.difficulty}</span>
                      </>
                    )}
                  </div>
                </button>
              ))}
              {exerciseSearch.length >= 2 && searchResults.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">No exercises found for &quot;{exerciseSearch}&quot;</p>
              )}
              {exerciseSearch.length < 2 && (
                <p className="text-sm text-gray-400 text-center py-8">Type at least 2 characters to search</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* Copy Day Modal                                     */}
      {/* ================================================= */}
      {showCopyDay && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <h3 className="font-bold text-gray-900 mb-1">Copy {copySource}</h3>
            <p className="text-xs text-gray-500 mb-4">
              Select a target day and week to copy {schedule[copySource]?.exercises?.length || 0} exercise(s) to.
            </p>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {Array.from({ length: basics.duration_weeks }, (_, weekIdx) => (
                <div key={weekIdx}>
                  {basics.duration_weeks > 1 && (
                    <div className="text-xs font-semibold text-gray-500 mb-1 mt-2">Week {weekIdx + 1}</div>
                  )}
                  <div className="grid grid-cols-7 gap-1">
                    {DAYS.map(day => {
                      const isSameSpot = weekIdx === activeWeek && day === copySource;
                      return (
                        <button
                          key={day}
                          disabled={isSameSpot}
                          onClick={() => executeCopyDay(day, weekIdx)}
                          className={`py-2 rounded-lg text-xs font-medium transition-all ${
                            isSameSpot
                              ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                              : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                          }`}
                        >
                          {day.slice(0, 2)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => { setShowCopyDay(false); setCopySource(null); }}
              className="mt-4 w-full py-2.5 bg-gray-100 rounded-lg font-medium text-sm hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
