'use client';
import { useState, useEffect } from 'react';

const CATEGORIES = ['all', 'strength', 'speed', 'agility', 'ball_work', 'flexibility', 'core', 'plyometrics', 'recovery'];
const DIFFICULTIES = ['all', 'beginner', 'intermediate', 'advanced'];
const EXERCISE_TYPES = ['all', 'independent', 'partner', 'group'];
const MUSCLE_GROUPS = ['all', 'quads', 'hamstrings', 'glutes', 'calves', 'chest', 'back', 'shoulders', 'biceps', 'triceps', 'core', 'hip_flexors', 'adductors', 'abductors'];

const CAT_ICONS = {
  strength: '🏋️', speed: '🏃', agility: '⚡', ball_work: '⚽',
  flexibility: '🧘', core: '💪', plyometrics: '🦘', recovery: '🧊',
};

const CAT_COLORS = {
  strength: 'bg-red-100 text-red-700', speed: 'bg-blue-100 text-blue-700',
  agility: 'bg-purple-100 text-purple-700', ball_work: 'bg-green-100 text-green-700',
  flexibility: 'bg-pink-100 text-pink-700', core: 'bg-amber-100 text-amber-700',
  plyometrics: 'bg-orange-100 text-orange-700', recovery: 'bg-teal-100 text-teal-700',
};

const CAT_IMAGES = {
  strength: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=400&fit=crop',
  speed: 'https://images.unsplash.com/photo-1461896836934-bd45ba8a0a05?w=400&h=400&fit=crop',
  agility: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&h=400&fit=crop',
  ball_work: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&h=400&fit=crop',
  flexibility: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop',
  core: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=400&fit=crop',
  plyometrics: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=400&h=400&fit=crop',
  recovery: 'https://images.unsplash.com/photo-1600881333168-2ef49b341f30?w=400&h=400&fit=crop',
};

const DIFF_COLORS = {
  beginner: 'text-green-600 bg-green-50', intermediate: 'text-amber-600 bg-amber-50', advanced: 'text-red-600 bg-red-50',
};

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
  const [viewMode, setViewMode] = useState('grid'); // grid | list
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '', description: '', category: 'strength', difficulty: 'intermediate',
    muscle_groups: '', equipment: '', default_sets: 3, default_reps: 10,
    is_timed: false, default_duration_sec: 30, default_rest_sec: 60,
    exercise_type: 'independent', default_weight_kg: '', instructions: '', tips: '',
    video_url: '', image_url: '',
  });

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

  // Client-side muscle filter
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
      await fetch(`/api/exercises`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, ...body }),
      });
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
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Exercise Library</h1>
          <p className="text-sm text-gray-500">{filtered.length} exercise{filtered.length !== 1 ? 's' : ''}{muscleFilter !== 'all' || category !== 'all' ? ' (filtered)' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}>
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
            </button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}>
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
            </button>
          </div>
          <button onClick={() => { resetForm(); setEditingId(null); setShowAdd(true); }} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm">+ Add Exercise</button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, description, or muscle group..."
          className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500/30 focus:border-green-500 bg-white" />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto mb-3 pb-2">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap flex items-center gap-1.5 transition-all ${
              category === c ? 'bg-green-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {c !== 'all' && <span className="text-base">{CAT_ICONS[c]}</span>}
            {c === 'all' ? `All (${exercises.length})` : `${c.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}${catCounts[c] ? ` (${catCounts[c]})` : ''}`}
          </button>
        ))}
      </div>

      {/* Secondary filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {DIFFICULTIES.map(d => (
          <button key={d} onClick={() => setDifficulty(d)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${difficulty === d ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {d === 'all' ? 'All Levels' : d.charAt(0).toUpperCase() + d.slice(1)}
          </button>
        ))}
        <span className="w-px bg-gray-300 mx-1" />
        {EXERCISE_TYPES.map(t => (
          <button key={t} onClick={() => setExerciseType(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${exerciseType === t ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Muscle group filter */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        <span className="text-xs text-gray-500 self-center mr-1">Muscles:</span>
        {MUSCLE_GROUPS.map(m => (
          <button key={m} onClick={() => setMuscleFilter(m)}
            className={`px-2 py-1 rounded text-xs font-medium transition-all ${muscleFilter === m ? 'bg-red-500 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
            {m === 'all' ? 'All' : m.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Exercise grid/list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <svg className="animate-spin h-8 w-8 text-green-600" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
          <p className="text-gray-500 font-medium">No exercises found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or search terms</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map(ex => {
            const ytId = parseYouTubeId(ex.video_url);
            const fallbackImg = CAT_IMAGES[ex.category] || CAT_IMAGES.strength;
            return (
              <div key={ex.id} className="bg-white border rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer group aspect-square flex flex-col"
                onClick={() => setDetailExercise(ex)}>
                {/* Image area ~60% */}
                <div className="relative flex-[3] min-h-0 bg-gray-100">
                  {ytId ? (
                    <>
                      <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <svg className="w-4 h-4 text-red-600 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                        </div>
                      </div>
                    </>
                  ) : ex.image_url ? (
                    <img src={ex.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <img src={fallbackImg} alt="" className="w-full h-full object-cover" />
                  )}
                  {/* Category icon overlay */}
                  <div className="absolute top-1.5 left-1.5 w-7 h-7 rounded-lg bg-black/40 backdrop-blur-sm flex items-center justify-center text-sm">
                    {CAT_ICONS[ex.category] || '🏋️'}
                  </div>
                  {ytId && <div className="absolute top-1.5 right-1.5 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">VIDEO</div>}
                </div>
                {/* Info area ~40% */}
                <div className="flex-[2] p-2 flex flex-col justify-between min-h-0">
                  <div>
                    <h3 className="font-semibold text-gray-800 text-xs leading-tight truncate">{ex.name}</h3>
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${CAT_COLORS[ex.category] || 'bg-gray-100 text-gray-600'}`}>
                        {ex.category?.replace('_', ' ')}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${DIFF_COLORS[ex.difficulty] || ''}`}>{ex.difficulty}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex flex-wrap gap-0.5 mb-1">
                      {(ex.primary_muscles || []).slice(0, 2).map(mg => <span key={mg} className="px-1 py-0 bg-red-50 text-red-600 rounded text-[9px] font-medium">{mg}</span>)}
                      {(ex.secondary_muscles || []).slice(0, 1).map(mg => <span key={mg} className="px-1 py-0 bg-gray-100 text-gray-500 rounded text-[9px]">{mg}</span>)}
                    </div>
                    <p className="text-[10px] text-gray-500">
                      {ex.is_timed ? `${ex.default_duration_sec}s` : `${ex.default_sets}×${ex.default_reps}`}
                      {ex.default_weight_kg > 0 && ` · ${ex.default_weight_kg}kg`}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List view */
        <div className="bg-white rounded-xl border divide-y">
          {filtered.map(ex => (
            <div key={ex.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => setDetailExercise(ex)}>
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xl shrink-0">
                {CAT_ICONS[ex.category] || '🏋️'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-800 truncate">{ex.name}</h3>
                  {ex.video_url && <span className="text-red-500 text-xs">▶ Video</span>}
                </div>
                <p className="text-xs text-gray-500 truncate">{ex.description}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CAT_COLORS[ex.category] || 'bg-gray-100 text-gray-600'}`}>
                {ex.category?.replace('_', ' ')}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${DIFF_COLORS[ex.difficulty] || ''}`}>{ex.difficulty}</span>
              <span className="text-xs text-gray-500 w-16 text-right">
                {ex.is_timed ? `${ex.default_duration_sec}s` : `${ex.default_sets}×${ex.default_reps}`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Exercise Detail Modal */}
      {detailExercise && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDetailExercise(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Video embed */}
            {parseYouTubeId(detailExercise.video_url) ? (
              <div className="aspect-video bg-black rounded-t-2xl overflow-hidden">
                <iframe
                  src={`https://www.youtube.com/embed/${parseYouTubeId(detailExercise.video_url)}?rel=0`}
                  className="w-full h-full" frameBorder="0"
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
              <div className="h-32 bg-gradient-to-br from-green-50 to-green-100 rounded-t-2xl flex items-center justify-center">
                <span className="text-5xl">{CAT_ICONS[detailExercise.category] || '🏋️'}</span>
              </div>
            )}

            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{detailExercise.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CAT_COLORS[detailExercise.category]}`}>{detailExercise.category?.replace('_', ' ')}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${DIFF_COLORS[detailExercise.difficulty]}`}>{detailExercise.difficulty}</span>
                    {detailExercise.exercise_type !== 'independent' && (
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-xs font-medium">{detailExercise.exercise_type}</span>
                    )}
                  </div>
                </div>
                <button onClick={() => { setDetailExercise(null); openEdit(detailExercise); }}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-600 transition-colors">
                  Edit
                </button>
              </div>

              {detailExercise.description && <p className="text-gray-600 text-sm mb-4">{detailExercise.description}</p>}

              {/* Defaults grid */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-gray-900">{detailExercise.default_sets || '-'}</div>
                  <div className="text-xs text-gray-500">Sets</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-gray-900">{detailExercise.is_timed ? `${detailExercise.default_duration_sec}s` : detailExercise.default_reps || '-'}</div>
                  <div className="text-xs text-gray-500">{detailExercise.is_timed ? 'Duration' : 'Reps'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-gray-900">{detailExercise.default_weight_kg || '-'}</div>
                  <div className="text-xs text-gray-500">Weight (kg)</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-gray-900">{detailExercise.default_rest_sec || 60}</div>
                  <div className="text-xs text-gray-500">Rest (s)</div>
                </div>
              </div>

              {/* Muscles */}
              {((detailExercise.primary_muscles?.length > 0) || (detailExercise.secondary_muscles?.length > 0)) && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Muscles Targeted</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(detailExercise.primary_muscles || []).map(m => (
                      <span key={m} className="px-2 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-medium border border-red-100">{m}</span>
                    ))}
                    {(detailExercise.secondary_muscles || []).map(m => (
                      <span key={m} className="px-2 py-1 bg-gray-50 text-gray-600 rounded-lg text-xs border border-gray-200">{m}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Equipment */}
              {detailExercise.equipment?.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Equipment</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {detailExercise.equipment.map(e => (
                      <span key={e} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs border border-blue-100">{e}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Instructions */}
              {detailExercise.instructions && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Instructions</h4>
                  <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-line leading-relaxed">{detailExercise.instructions}</div>
                </div>
              )}

              {/* Tips */}
              {detailExercise.tips && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Coaching Tips</h4>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800 whitespace-pre-line">{detailExercise.tips}</div>
                </div>
              )}

              <button onClick={() => setDetailExercise(null)}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-sm text-gray-600 mt-2 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Exercise' : 'Add Exercise'}</h2>
            <div className="space-y-3">
              <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Exercise name *" required className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500/30 focus:border-green-500" />
              <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Description" className="w-full p-2.5 border rounded-lg" rows={2} />

              {/* Video & Image URLs */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                <div className="text-xs font-medium text-blue-700 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" /></svg>
                  Media (optional)
                </div>
                <input value={form.video_url} onChange={e => setForm(f => ({...f, video_url: e.target.value}))} placeholder="YouTube or video URL" className="w-full p-2 border rounded-lg text-sm bg-white" />
                <input value={form.image_url} onChange={e => setForm(f => ({...f, image_url: e.target.value}))} placeholder="Image URL (thumbnail)" className="w-full p-2 border rounded-lg text-sm bg-white" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-xs text-gray-500">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} className="w-full p-2 border rounded-lg">
                    {CATEGORIES.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div><label className="text-xs text-gray-500">Difficulty</label>
                  <select value={form.difficulty} onChange={e => setForm(f => ({...f, difficulty: e.target.value}))} className="w-full p-2 border rounded-lg">
                    {DIFFICULTIES.filter(d => d !== 'all').map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="text-xs text-gray-500">Exercise Type</label>
                <div className="flex gap-2 mt-1">
                  {['independent', 'partner', 'group'].map(t => (
                    <button key={t} type="button" onClick={() => setForm(f => ({...f, exercise_type: t}))}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${form.exercise_type === t ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{t}</button>
                  ))}
                </div>
              </div>
              <input value={form.muscle_groups} onChange={e => setForm(f => ({...f, muscle_groups: e.target.value}))} placeholder="Muscle groups (comma-separated)" className="w-full p-2 border rounded-lg" />
              <input value={form.equipment} onChange={e => setForm(f => ({...f, equipment: e.target.value}))} placeholder="Equipment (comma-separated)" className="w-full p-2 border rounded-lg" />
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_timed} onChange={e => setForm(f => ({...f, is_timed: e.target.checked}))} className="accent-green-600" /><span className="text-sm">Timed exercise</span></label>
              <div className="grid grid-cols-4 gap-2">
                <div><label className="text-xs text-gray-500">Sets</label><input type="number" value={form.default_sets} onChange={e => setForm(f => ({...f, default_sets: +e.target.value}))} className="w-full p-2 border rounded-lg" /></div>
                <div><label className="text-xs text-gray-500">{form.is_timed ? 'Duration(s)' : 'Reps'}</label><input type="number" value={form.is_timed ? form.default_duration_sec : form.default_reps} onChange={e => setForm(f => form.is_timed ? ({...f, default_duration_sec: +e.target.value}) : ({...f, default_reps: +e.target.value}))} className="w-full p-2 border rounded-lg" /></div>
                <div><label className="text-xs text-gray-500">Weight(kg)</label><input type="number" step="0.5" value={form.default_weight_kg} onChange={e => setForm(f => ({...f, default_weight_kg: e.target.value}))} placeholder="-" className="w-full p-2 border rounded-lg" /></div>
                <div><label className="text-xs text-gray-500">Rest(s)</label><input type="number" value={form.default_rest_sec} onChange={e => setForm(f => ({...f, default_rest_sec: +e.target.value}))} className="w-full p-2 border rounded-lg" /></div>
              </div>
              <textarea value={form.instructions} onChange={e => setForm(f => ({...f, instructions: e.target.value}))} placeholder="Step-by-step instructions" className="w-full p-2 border rounded-lg" rows={3} />
              <textarea value={form.tips} onChange={e => setForm(f => ({...f, tips: e.target.value}))} placeholder="Tips and coaching cues" className="w-full p-2 border rounded-lg" rows={2} />
            </div>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => { setShowAdd(false); setEditingId(null); }} className="flex-1 py-2.5 border rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
              <button type="submit" className="flex-1 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">{editingId ? 'Update' : 'Save'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
