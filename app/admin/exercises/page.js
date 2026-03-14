'use client';
import { useState, useEffect } from 'react';
import {
  IconBarbell, IconRun, IconBolt, IconBallFootball,
  IconStretching, IconFlame, IconJumpRope, IconSnowflake,
  IconSearch, IconX, IconPlus, IconList, IconLayoutGrid,
  IconPlayerPlay, IconEdit, IconClock, IconWeight,
  IconRepeat, IconMoodSmile, IconStarFilled,
} from '@tabler/icons-react';

const CATEGORIES = ['all', 'strength', 'speed', 'agility', 'ball_work', 'flexibility', 'core', 'plyometrics', 'recovery'];
const DIFFICULTIES = ['all', 'beginner', 'intermediate', 'advanced'];
const EXERCISE_TYPES = ['all', 'independent', 'partner', 'group'];
const MUSCLE_GROUPS = ['all', 'quads', 'hamstrings', 'glutes', 'calves', 'chest', 'back', 'shoulders', 'biceps', 'triceps', 'core', 'hip_flexors', 'adductors', 'abductors'];

const CAT_CONFIG = {
  strength: { icon: IconBarbell, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', pill: 'bg-red-100 text-red-700' },
  speed: { icon: IconRun, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', pill: 'bg-blue-100 text-blue-700' },
  agility: { icon: IconBolt, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', pill: 'bg-purple-100 text-purple-700' },
  ball_work: { icon: IconBallFootball, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', pill: 'bg-green-100 text-green-700' },
  flexibility: { icon: IconStretching, color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-200', pill: 'bg-pink-100 text-pink-700' },
  core: { icon: IconFlame, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', pill: 'bg-amber-100 text-amber-700' },
  plyometrics: { icon: IconJumpRope, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', pill: 'bg-orange-100 text-orange-700' },
  recovery: { icon: IconSnowflake, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200', pill: 'bg-teal-100 text-teal-700' },
};

const DIFF_CONFIG = {
  beginner: { color: 'text-green-600', bg: 'bg-green-50', dots: 1 },
  intermediate: { color: 'text-amber-600', bg: 'bg-amber-50', dots: 2 },
  advanced: { color: 'text-red-600', bg: 'bg-red-50', dots: 3 },
};

function DifficultyDots({ difficulty }) {
  const config = DIFF_CONFIG[difficulty] || DIFF_CONFIG.intermediate;
  return (
    <div className="flex items-center gap-0.5" title={difficulty}>
      {[1, 2, 3].map(i => (
        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= config.dots ? (difficulty === 'beginner' ? 'bg-green-500' : difficulty === 'advanced' ? 'bg-red-500' : 'bg-amber-500') : 'bg-gray-200'}`} />
      ))}
    </div>
  );
}

function parseYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export default function AdminExercises() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [exerciseType, setExerciseType] = useState('all');
  const [muscleFilter, setMuscleFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [detailExercise, setDetailExercise] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '', description: '', category: 'strength', difficulty: 'intermediate',
    muscle_groups: '', equipment: '', default_sets: 3, default_reps: 10,
    is_timed: false, default_duration_sec: 30, default_rest_sec: 60,
    exercise_type: 'independent', default_weight_kg: '', instructions: '', tips: '',
    video_url: '', image_url: '',
  });
  // Program Builder state
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderName, setBuilderName] = useState('');
  const [builderDays, setBuilderDays] = useState([{ name: 'Day 1', exercises: [] }]);
  const [activeDay, setActiveDay] = useState(0);
  const [savingProgram, setSavingProgram] = useState(false);
  const [builderSaved, setBuilderSaved] = useState(false);

  function addToBuilder(exercise) {
    setShowBuilder(true);
    setBuilderDays(prev => {
      const updated = [...prev];
      const day = { ...updated[activeDay] };
      // Check if already added
      if (day.exercises.some(e => e.id === exercise.id)) return prev;
      day.exercises = [...day.exercises, {
        id: exercise.id,
        name: exercise.name,
        category: exercise.category,
        sets: exercise.default_sets || 3,
        reps: exercise.default_reps || 10,
        duration_seconds: exercise.default_duration_sec || 30,
        rest_seconds: exercise.default_rest_sec || 60,
        is_timed: exercise.is_timed || false,
      }];
      updated[activeDay] = day;
      return updated;
    });
  }

  function removeFromBuilder(dayIdx, exId) {
    setBuilderDays(prev => {
      const updated = [...prev];
      updated[dayIdx] = { ...updated[dayIdx], exercises: updated[dayIdx].exercises.filter(e => e.id !== exId) };
      return updated;
    });
  }

  function addDay() {
    setBuilderDays(prev => [...prev, { name: `Day ${prev.length + 1}`, exercises: [] }]);
    setActiveDay(builderDays.length);
  }

  function updateBuilderExercise(dayIdx, exId, field, value) {
    setBuilderDays(prev => {
      const updated = [...prev];
      updated[dayIdx] = {
        ...updated[dayIdx],
        exercises: updated[dayIdx].exercises.map(e =>
          e.id === exId ? { ...e, [field]: parseInt(value) || 0 } : e
        ),
      };
      return updated;
    });
  }

  async function saveProgram() {
    if (!builderName.trim()) return;
    setSavingProgram(true);
    const profile = JSON.parse(localStorage.getItem('mf_profile') || '{}');
    try {
      const res = await fetch('/api/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coach_id: profile.id,
          name: builderName,
          duration_weeks: 4,
          difficulty: 'medium',
          days: builderDays.map((day, i) => ({
            name: day.name,
            day_of_week: i,
            sort_order: i,
            exercises: day.exercises.map((ex, j) => ({
              exercise_id: ex.id,
              sets: ex.sets,
              reps: ex.reps,
              duration_seconds: ex.duration_seconds,
              rest_seconds: ex.rest_seconds,
              order_index: j,
            })),
          })),
        }),
      });
      if (res.ok) {
        setBuilderSaved(true);
        setTimeout(() => {
          setShowBuilder(false);
          setBuilderName('');
          setBuilderDays([{ name: 'Day 1', exercises: [] }]);
          setActiveDay(0);
          setBuilderSaved(false);
        }, 1500);
      }
    } catch (err) { console.error(err); }
    setSavingProgram(false);
  }

  useEffect(() => { loadExercises(); }, [category, difficulty, exerciseType, search]);

  async function loadExercises() {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== 'all') params.set('category', category);
    if (difficulty !== 'all') params.set('difficulty', difficulty);
    if (exerciseType !== 'all') params.set('exercise_type', exerciseType);
    if (search) params.set('search', search);
    const res = await fetch(`/api/exercises?${params}`);
    const data = await res.json();
    setExercises(data.exercises || (Array.isArray(data) ? data : []));
    setLoading(false);
  }

  const filtered = muscleFilter === 'all' ? exercises : exercises.filter(ex => {
    const allMuscles = [...(ex.primary_muscles || []), ...(ex.secondary_muscles || []), ...(ex.muscle_groups || [])];
    return allMuscles.some(m => m.toLowerCase().includes(muscleFilter));
  });

  async function handleSave(e) {
    e.preventDefault();
    const profile = JSON.parse(localStorage.getItem('mf_profile') || '{}');
    const body = {
      ...form,
      coach_id: profile.id,
      muscle_groups: form.muscle_groups.split(',').map(s => s.trim()).filter(Boolean),
      equipment: form.equipment.split(',').map(s => s.trim()).filter(Boolean),
      default_weight_kg: form.default_weight_kg ? parseFloat(form.default_weight_kg) : null,
      video_url: form.video_url || null,
      image_url: form.image_url || null,
    };
    if (editingId) {
      await fetch(`/api/exercises`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingId, ...body }) });
    } else {
      await fetch('/api/exercises', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    }
    setShowAdd(false);
    setEditingId(null);
    resetForm();
    loadExercises();
  }

  function resetForm() {
    setForm({ name: '', description: '', category: 'strength', difficulty: 'intermediate', muscle_groups: '', equipment: '', default_sets: 3, default_reps: 10, is_timed: false, default_duration_sec: 30, default_rest_sec: 60, exercise_type: 'independent', default_weight_kg: '', instructions: '', tips: '', video_url: '', image_url: '' });
  }

  function openEdit(ex) {
    setEditingId(ex.id);
    setForm({
      name: ex.name || '', description: ex.description || '', category: ex.category || 'strength',
      difficulty: ex.difficulty || 'intermediate',
      muscle_groups: [...(ex.primary_muscles || []), ...(ex.secondary_muscles || [])].join(', '),
      equipment: (ex.equipment || []).join(', '),
      default_sets: ex.default_sets || 3, default_reps: ex.default_reps || 10,
      is_timed: ex.is_timed || false, default_duration_sec: ex.default_duration_sec || 30,
      default_rest_sec: ex.default_rest_sec || 60, exercise_type: ex.exercise_type || 'independent',
      default_weight_kg: ex.default_weight_kg || '', instructions: ex.instructions || '',
      tips: ex.tips || '', video_url: ex.video_url || '', image_url: ex.image_url || '',
    });
    setShowAdd(true);
  }

  const catCounts = {};
  exercises.forEach(ex => { catCounts[ex.category] = (catCounts[ex.category] || 0) + 1; });

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exercise Library</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} exercise{filtered.length !== 1 ? 's' : ''}{muscleFilter !== 'all' || category !== 'all' ? ' (filtered)' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}>
              <IconLayoutGrid size={16} className="text-gray-600" />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}>
              <IconList size={16} className="text-gray-600" />
            </button>
          </div>
          <button onClick={() => setShowBuilder(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors">
            <IconPlus size={16} /> Build Program
          </button>
          <button onClick={() => { resetForm(); setEditingId(null); setShowAdd(true); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition-colors">
            <IconPlus size={16} /> Add Exercise
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <IconSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, description, or muscle group..."
          className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 bg-white text-sm" />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <IconX size={16} />
          </button>
        )}
      </div>

      {/* Category pills */}
      <div className="flex gap-1.5 overflow-x-auto mb-3 pb-1">
        {CATEGORIES.map(c => {
          const config = CAT_CONFIG[c];
          const CatIcon = config?.icon;
          const isActive = category === c;
          return (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-all border ${
                isActive ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}>
              {CatIcon && <CatIcon size={14} />}
              {c === 'all' ? `All (${exercises.length})` : `${c.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}${catCounts[c] ? ` (${catCounts[c]})` : ''}`}
            </button>
          );
        })}
      </div>

      {/* Secondary filters */}
      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        {DIFFICULTIES.map(d => (
          <button key={d} onClick={() => setDifficulty(d)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
              difficulty === d ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
            }`}>
            {d === 'all' ? 'All Levels' : d.charAt(0).toUpperCase() + d.slice(1)}
          </button>
        ))}
        <div className="w-px h-4 bg-gray-200 mx-1" />
        {EXERCISE_TYPES.map(t => (
          <button key={t} onClick={() => setExerciseType(t)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
              exerciseType === t ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
            }`}>
            {t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Muscle group filter */}
      <div className="flex flex-wrap items-center gap-1 mb-6">
        <span className="text-xs text-gray-400 mr-1">Muscles:</span>
        {MUSCLE_GROUPS.map(m => (
          <button key={m} onClick={() => setMuscleFilter(m)}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
              muscleFilter === m ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}>
            {m === 'all' ? 'All' : m.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Exercise grid/list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <IconSearch size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium">No exercises found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map(ex => {
            const config = CAT_CONFIG[ex.category] || CAT_CONFIG.strength;
            const CatIcon = config.icon;
            const ytId = parseYouTubeId(ex.video_url);
            const hasImage = ytId || ex.image_url;

            return (
              <div key={ex.id}
                className={`group bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer overflow-hidden`}
                onClick={() => setDetailExercise(ex)}>

                {/* Image strip (compact, only if image exists) */}
                {hasImage ? (
                  <div className="relative aspect-square bg-gray-100 overflow-hidden">
                    <img
                      src={ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : ex.image_url}
                      alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    {ytId && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                        <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow">
                          <IconPlayerPlay size={14} className="text-red-600 ml-0.5" />
                        </div>
                      </div>
                    )}
                    {/* Category badge on image */}
                    <div className={`absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold ${config.pill} backdrop-blur-sm`}>
                      <CatIcon size={12} />
                      {ex.category?.replace('_', ' ')}
                    </div>
                  </div>
                ) : (
                  /* No image — show colored category header */
                  <div className={`h-2 ${config.bg.replace('bg-', 'bg-')}`} style={{ background: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))` }}>
                    <div className={`h-2 rounded-t-xl ${
                      ex.category === 'strength' ? 'bg-gradient-to-r from-red-400 to-red-500' :
                      ex.category === 'speed' ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
                      ex.category === 'agility' ? 'bg-gradient-to-r from-purple-400 to-purple-500' :
                      ex.category === 'ball_work' ? 'bg-gradient-to-r from-green-400 to-green-500' :
                      ex.category === 'flexibility' ? 'bg-gradient-to-r from-pink-400 to-pink-500' :
                      ex.category === 'core' ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                      ex.category === 'plyometrics' ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
                      'bg-gradient-to-r from-teal-400 to-teal-500'
                    }`} />
                  </div>
                )}

                {/* Card body */}
                <div className="p-3">
                  {/* Name + difficulty */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {!hasImage && <CatIcon size={16} className={config.color + ' shrink-0'} />}
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">{ex.name}</h3>
                    </div>
                    <DifficultyDots difficulty={ex.difficulty} />
                  </div>

                  {/* Category pill (when no image) */}
                  {!hasImage && (
                    <div className="mb-2">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${config.pill}`}>
                        {ex.category?.replace('_', ' ')}
                      </span>
                    </div>
                  )}

                  {/* Muscle tags */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {(ex.primary_muscles || []).slice(0, 3).map(mg => (
                      <span key={mg} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium">{mg}</span>
                    ))}
                    {(ex.secondary_muscles || []).slice(0, 1).map(mg => (
                      <span key={mg} className="px-1.5 py-0.5 bg-gray-50 text-gray-400 rounded text-[10px]">{mg}</span>
                    ))}
                  </div>

                  {/* Bottom row: sets/reps + equipment */}
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <div className="flex items-center gap-2">
                      {ex.is_timed ? (
                        <span className="flex items-center gap-0.5"><IconClock size={12} /> {ex.default_duration_sec}s</span>
                      ) : (
                        <span className="flex items-center gap-0.5"><IconRepeat size={12} /> {ex.default_sets}&times;{ex.default_reps}</span>
                      )}
                      {ex.default_weight_kg > 0 && (
                        <span className="flex items-center gap-0.5"><IconWeight size={12} /> {ex.default_weight_kg}kg</span>
                      )}
                    </div>
                    {(ex.equipment || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 justify-end">
                        {ex.equipment.slice(0, 2).map(eq => (
                          <span key={eq} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-medium">{eq}</span>
                        ))}
                        {ex.equipment.length > 2 && (
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px]">+{ex.equipment.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Add to Program Builder button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); addToBuilder(ex); }}
                    className="mt-2 w-full py-1.5 bg-blue-50 text-blue-600 text-[11px] font-medium rounded-lg hover:bg-blue-100 border border-blue-200 transition-colors flex items-center justify-center gap-1"
                    title="Add to Program Builder">
                    <IconPlus size={12} /> Add to Program
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List view */
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {filtered.map(ex => {
            const config = CAT_CONFIG[ex.category] || CAT_CONFIG.strength;
            const CatIcon = config.icon;
            return (
              <div key={ex.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setDetailExercise(ex)}>
                <div className={`w-9 h-9 rounded-lg ${config.bg} ${config.border} border flex items-center justify-center shrink-0`}>
                  <CatIcon size={18} className={config.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900 text-sm truncate">{ex.name}</h3>
                    {ex.video_url && <IconPlayerPlay size={12} className="text-red-500 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {(ex.primary_muscles || []).slice(0, 2).map(m => (
                      <span key={m} className="text-[10px] text-gray-400">{m}</span>
                    ))}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${config.pill}`}>
                  {ex.category?.replace('_', ' ')}
                </span>
                <DifficultyDots difficulty={ex.difficulty} />
                <span className="text-xs text-gray-500 w-14 text-right font-mono">
                  {ex.is_timed ? `${ex.default_duration_sec}s` : `${ex.default_sets}x${ex.default_reps}`}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Exercise Detail Modal */}
      {detailExercise && (() => {
        const config = CAT_CONFIG[detailExercise.category] || CAT_CONFIG.strength;
        const CatIcon = config.icon;
        const ytId = parseYouTubeId(detailExercise.video_url);
        return (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDetailExercise(null)}>
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
              {/* Media */}
              {ytId ? (
                <div className="aspect-video bg-black rounded-t-2xl overflow-hidden">
                  <iframe src={`https://www.youtube.com/embed/${ytId}?rel=0`} className="w-full h-full" frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                </div>
              ) : detailExercise.video_url ? (
                <div className="aspect-video bg-black rounded-t-2xl overflow-hidden">
                  <video src={detailExercise.video_url} controls className="w-full h-full" />
                </div>
              ) : detailExercise.image_url ? (
                <div className="h-48 bg-gray-100 rounded-t-2xl overflow-hidden">
                  <img src={detailExercise.image_url} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className={`h-20 rounded-t-2xl ${config.bg} flex items-center justify-center`}>
                  <CatIcon size={32} className={config.color} />
                </div>
              )}

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{detailExercise.name}</h2>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${config.pill}`}>
                        <CatIcon size={12} /> {detailExercise.category?.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${DIFF_CONFIG[detailExercise.difficulty]?.bg} ${DIFF_CONFIG[detailExercise.difficulty]?.color}`}>
                        {detailExercise.difficulty}
                      </span>
                      {detailExercise.exercise_type !== 'independent' && (
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-xs font-medium">{detailExercise.exercise_type}</span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => { setDetailExercise(null); openEdit(detailExercise); }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-600 transition-colors">
                    <IconEdit size={14} /> Edit
                  </button>
                </div>

                {detailExercise.description && <p className="text-gray-600 text-sm mb-4 leading-relaxed">{detailExercise.description}</p>}

                {/* Defaults grid */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[
                    { label: 'Sets', value: detailExercise.default_sets || '-', icon: IconRepeat },
                    { label: detailExercise.is_timed ? 'Duration' : 'Reps', value: detailExercise.is_timed ? `${detailExercise.default_duration_sec}s` : detailExercise.default_reps || '-', icon: detailExercise.is_timed ? IconClock : IconRepeat },
                    { label: 'Weight', value: detailExercise.default_weight_kg ? `${detailExercise.default_weight_kg}kg` : '-', icon: IconWeight },
                    { label: 'Rest', value: `${detailExercise.default_rest_sec || 60}s`, icon: IconClock },
                  ].map((item, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3 text-center">
                      <item.icon size={16} className="mx-auto mb-1 text-gray-400" />
                      <div className="text-lg font-bold text-gray-900">{item.value}</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider">{item.label}</div>
                    </div>
                  ))}
                </div>

                {/* Muscles */}
                {((detailExercise.primary_muscles?.length > 0) || (detailExercise.secondary_muscles?.length > 0)) && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Muscles Targeted</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {(detailExercise.primary_muscles || []).map(m => (
                        <span key={m} className="px-2.5 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-medium border border-red-100">{m}</span>
                      ))}
                      {(detailExercise.secondary_muscles || []).map(m => (
                        <span key={m} className="px-2.5 py-1 bg-gray-50 text-gray-600 rounded-lg text-xs border border-gray-200">{m}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Equipment */}
                {detailExercise.equipment?.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Equipment</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {detailExercise.equipment.map(e => (
                        <span key={e} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs border border-blue-100">{e}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Instructions */}
                {detailExercise.instructions && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Instructions</h4>
                    <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-line leading-relaxed">{detailExercise.instructions}</div>
                  </div>
                )}

                {/* Tips */}
                {detailExercise.tips && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Coaching Tips</h4>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 whitespace-pre-line">{detailExercise.tips}</div>
                  </div>
                )}

                <button onClick={() => setDetailExercise(null)}
                  className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-sm text-gray-600 mt-2 transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Program Builder Panel */}
      {showBuilder && (
        <div className="fixed inset-0 z-40 flex justify-end" onClick={() => setShowBuilder(false)}>
          <div className="bg-black/30 absolute inset-0 lg:hidden" />
          <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="p-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-gray-900">Program Builder</h2>
                <button onClick={() => setShowBuilder(false)} className="text-gray-400 hover:text-gray-600">
                  <IconX size={20} />
                </button>
              </div>
              <input value={builderName} onChange={e => setBuilderName(e.target.value)}
                placeholder="Program name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            {/* Day tabs */}
            <div className="flex items-center gap-1 px-4 pt-3 pb-2 border-b border-gray-100 overflow-x-auto shrink-0">
              {builderDays.map((day, i) => (
                <button key={i} onClick={() => setActiveDay(i)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                    activeDay === i ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                  {day.name} ({day.exercises.length})
                </button>
              ))}
              <button onClick={addDay}
                className="px-2 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-lg">
                <IconPlus size={14} />
              </button>
            </div>

            {/* Day name edit */}
            <div className="px-4 py-2 shrink-0">
              <input value={builderDays[activeDay]?.name || ''}
                onChange={e => {
                  setBuilderDays(prev => {
                    const updated = [...prev];
                    updated[activeDay] = { ...updated[activeDay], name: e.target.value };
                    return updated;
                  });
                }}
                className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Day name..." />
            </div>

            {/* Exercise list */}
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
              {builderDays[activeDay]?.exercises.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <IconPlus size={24} className="mx-auto mb-2" />
                  <p className="text-sm">Click "Add to Program" on exercises to add them here</p>
                </div>
              ) : builderDays[activeDay]?.exercises.map((ex, idx) => (
                <div key={ex.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400 w-5">{idx + 1}.</span>
                      <span className="text-sm font-medium text-gray-900 truncate">{ex.name}</span>
                    </div>
                    <button onClick={() => removeFromBuilder(activeDay, ex.id)}
                      className="text-gray-400 hover:text-red-500">
                      <IconX size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-500">Sets</label>
                      <input type="number" value={ex.sets} min={1}
                        onChange={e => updateBuilderExercise(activeDay, ex.id, 'sets', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-200 rounded text-xs" />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500">{ex.is_timed ? 'Sec' : 'Reps'}</label>
                      <input type="number" value={ex.is_timed ? ex.duration_seconds : ex.reps} min={1}
                        onChange={e => updateBuilderExercise(activeDay, ex.id, ex.is_timed ? 'duration_seconds' : 'reps', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-200 rounded text-xs" />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500">Rest(s)</label>
                      <input type="number" value={ex.rest_seconds} min={0}
                        onChange={e => updateBuilderExercise(activeDay, ex.id, 'rest_seconds', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-200 rounded text-xs" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Save button */}
            <div className="p-4 border-t border-gray-100 shrink-0">
              {builderSaved ? (
                <div className="w-full py-3 bg-green-100 text-green-700 rounded-lg font-medium text-sm text-center">
                  Program saved!
                </div>
              ) : (
                <button onClick={saveProgram}
                  disabled={!builderName.trim() || builderDays.every(d => d.exercises.length === 0) || savingProgram}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {savingProgram ? 'Saving...' : `Save Program (${builderDays.reduce((s, d) => s + d.exercises.length, 0)} exercises)`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Exercise' : 'Add Exercise'}</h2>
            <div className="space-y-3">
              <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Exercise name *" required className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm" />
              <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Description" className="w-full p-2.5 border border-gray-200 rounded-xl text-sm" rows={2} />

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
                <div className="text-xs font-medium text-gray-600 flex items-center gap-1">
                  <IconPlayerPlay size={14} /> Media (optional)
                </div>
                <input value={form.video_url} onChange={e => setForm(f => ({...f, video_url: e.target.value}))} placeholder="YouTube or video URL" className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white" />
                <input value={form.image_url} onChange={e => setForm(f => ({...f, image_url: e.target.value}))} placeholder="Image URL (thumbnail)" className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-xs text-gray-500 mb-1 block">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} className="w-full p-2 border border-gray-200 rounded-lg text-sm">
                    {CATEGORIES.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div><label className="text-xs text-gray-500 mb-1 block">Difficulty</label>
                  <select value={form.difficulty} onChange={e => setForm(f => ({...f, difficulty: e.target.value}))} className="w-full p-2 border border-gray-200 rounded-lg text-sm">
                    {DIFFICULTIES.filter(d => d !== 'all').map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="text-xs text-gray-500 mb-1 block">Exercise Type</label>
                <div className="flex gap-2">
                  {['independent', 'partner', 'group'].map(t => (
                    <button key={t} type="button" onClick={() => setForm(f => ({...f, exercise_type: t}))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${form.exercise_type === t ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{t}</button>
                  ))}
                </div>
              </div>
              <input value={form.muscle_groups} onChange={e => setForm(f => ({...f, muscle_groups: e.target.value}))} placeholder="Muscle groups (comma-separated)" className="w-full p-2 border border-gray-200 rounded-lg text-sm" />
              <input value={form.equipment} onChange={e => setForm(f => ({...f, equipment: e.target.value}))} placeholder="Equipment (comma-separated)" className="w-full p-2 border border-gray-200 rounded-lg text-sm" />
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_timed} onChange={e => setForm(f => ({...f, is_timed: e.target.checked}))} className="accent-green-600 w-4 h-4 rounded" /><span className="text-sm text-gray-700">Timed exercise</span></label>
              <div className="grid grid-cols-4 gap-2">
                <div><label className="text-xs text-gray-500">Sets</label><input type="number" value={form.default_sets} onChange={e => setForm(f => ({...f, default_sets: +e.target.value}))} className="w-full p-2 border border-gray-200 rounded-lg text-sm" /></div>
                <div><label className="text-xs text-gray-500">{form.is_timed ? 'Duration(s)' : 'Reps'}</label><input type="number" value={form.is_timed ? form.default_duration_sec : form.default_reps} onChange={e => setForm(f => form.is_timed ? ({...f, default_duration_sec: +e.target.value}) : ({...f, default_reps: +e.target.value}))} className="w-full p-2 border border-gray-200 rounded-lg text-sm" /></div>
                <div><label className="text-xs text-gray-500">Weight(kg)</label><input type="number" step="0.5" value={form.default_weight_kg} onChange={e => setForm(f => ({...f, default_weight_kg: e.target.value}))} placeholder="-" className="w-full p-2 border border-gray-200 rounded-lg text-sm" /></div>
                <div><label className="text-xs text-gray-500">Rest(s)</label><input type="number" value={form.default_rest_sec} onChange={e => setForm(f => ({...f, default_rest_sec: +e.target.value}))} className="w-full p-2 border border-gray-200 rounded-lg text-sm" /></div>
              </div>
              <textarea value={form.instructions} onChange={e => setForm(f => ({...f, instructions: e.target.value}))} placeholder="Step-by-step instructions" className="w-full p-2 border border-gray-200 rounded-lg text-sm" rows={3} />
              <textarea value={form.tips} onChange={e => setForm(f => ({...f, tips: e.target.value}))} placeholder="Tips and coaching cues" className="w-full p-2 border border-gray-200 rounded-lg text-sm" rows={2} />
            </div>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => { setShowAdd(false); setEditingId(null); }} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm font-medium">Cancel</button>
              <button type="submit" className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 text-sm">{editingId ? 'Update' : 'Save'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
