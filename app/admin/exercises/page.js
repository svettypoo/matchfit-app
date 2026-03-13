'use client';
import { useState, useEffect } from 'react';

const CATEGORIES = ['all', 'strength', 'speed', 'agility', 'ball_work', 'flexibility', 'core', 'plyometrics', 'recovery'];
const DIFFICULTIES = ['all', 'beginner', 'intermediate', 'advanced'];
const EXERCISE_TYPES = ['all', 'independent', 'partner', 'group'];

export default function AdminExercises() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [exerciseType, setExerciseType] = useState('all');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [form, setForm] = useState({
    name: '', description: '', category: 'strength', difficulty: 'intermediate',
    muscle_groups: '', equipment: '', default_sets: 3, default_reps: 10,
    is_timed: false, default_duration_sec: 30, default_rest_sec: 60,
    exercise_type: 'independent', default_weight_kg: '', instructions: '', tips: '',
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

  async function handleAdd(e) {
    e.preventDefault();
    const profile = JSON.parse(localStorage.getItem('mf_profile') || '{}');
    const body = {
      ...form,
      coach_id: profile.id,
      muscle_groups: form.muscle_groups.split(',').map(s => s.trim()).filter(Boolean),
      equipment: form.equipment.split(',').map(s => s.trim()).filter(Boolean),
      default_weight_kg: form.default_weight_kg ? parseFloat(form.default_weight_kg) : null,
    };
    await fetch('/api/exercises', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setShowAdd(false);
    setForm({ name: '', description: '', category: 'strength', difficulty: 'intermediate', muscle_groups: '', equipment: '', default_sets: 3, default_reps: 10, is_timed: false, default_duration_sec: 30, default_rest_sec: 60, exercise_type: 'independent', default_weight_kg: '', instructions: '', tips: '' });
    loadExercises();
  }

  const catColors = { strength: 'bg-red-100 text-red-700', speed: 'bg-blue-100 text-blue-700', agility: 'bg-purple-100 text-purple-700', ball_work: 'bg-green-100 text-green-700', flexibility: 'bg-pink-100 text-pink-700', core: 'bg-amber-100 text-amber-700', plyometrics: 'bg-orange-100 text-orange-700', recovery: 'bg-teal-100 text-teal-700' };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Exercise Library</h1>
          <p className="text-sm text-gray-500">{exercises.length} exercises</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">+ Add Exercise</button>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search exercises..." className="w-full p-3 border rounded-lg mb-4 focus:ring-2 focus:ring-green-500 focus:border-green-500" />

      <div className="flex gap-2 overflow-x-auto mb-3 pb-2">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)} className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${category === c ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {c === 'all' ? 'All' : c.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {DIFFICULTIES.map(d => (
          <button key={d} onClick={() => setDifficulty(d)} className={`px-3 py-1.5 rounded-full text-sm font-medium ${difficulty === d ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {d === 'all' ? 'All Levels' : d.charAt(0).toUpperCase() + d.slice(1)}
          </button>
        ))}
        <span className="w-px bg-gray-300 mx-1" />
        {EXERCISE_TYPES.map(t => (
          <button key={t} onClick={() => setExerciseType(t)} className={`px-3 py-1.5 rounded-full text-sm font-medium ${exerciseType === t ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading exercises...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercises.map(ex => (
            <div key={ex.id} className="bg-white border rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setShowDetail(showDetail === ex.id ? null : ex.id)}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-800">{ex.name}</h3>
                <div className="flex gap-1 shrink-0 ml-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${catColors[ex.category] || 'bg-gray-100 text-gray-600'}`}>{ex.category?.replace('_', ' ')}</span>
                  {ex.exercise_type !== 'independent' && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">{ex.exercise_type}</span>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-3 line-clamp-2">{ex.description}</p>
              <div className="flex flex-wrap gap-1 mb-2">
                {ex.primary_muscles?.map(mg => <span key={mg} className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs">{mg}</span>)}
                {ex.secondary_muscles?.slice(0, 2).map(mg => <span key={mg} className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">{mg}</span>)}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className={`font-medium ${ex.difficulty === 'beginner' ? 'text-green-600' : ex.difficulty === 'intermediate' ? 'text-amber-600' : 'text-red-600'}`}>{ex.difficulty}</span>
                <span>{ex.is_timed ? `${ex.default_duration_sec}s` : `${ex.default_sets}x${ex.default_reps}`}</span>
                {ex.default_weight_kg && <span>{ex.default_weight_kg}kg</span>}
                <span>{ex.default_rest_sec}s rest</span>
              </div>

              {showDetail === ex.id && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-2" onClick={e => e.stopPropagation()}>
                  {ex.instructions && (
                    <div><div className="text-xs font-medium text-gray-700 mb-1">Instructions:</div><div className="text-xs text-gray-500 whitespace-pre-line">{ex.instructions}</div></div>
                  )}
                  {ex.tips && (
                    <div className="bg-yellow-50 rounded p-2 border border-yellow-200"><div className="text-xs font-medium text-yellow-800">Tips:</div><div className="text-xs text-yellow-700">{ex.tips}</div></div>
                  )}
                  {ex.equipment?.length > 0 && (
                    <div className="flex flex-wrap gap-1"><span className="text-xs text-gray-500">Equipment:</span>{ex.equipment.map(e => <span key={e} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{e}</span>)}</div>
                  )}
                  {ex.tracking_fields?.length > 0 && (
                    <div className="flex flex-wrap gap-1"><span className="text-xs text-gray-500">Tracks:</span>{(typeof ex.tracking_fields === 'string' ? JSON.parse(ex.tracking_fields) : ex.tracking_fields).map(f => <span key={f} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">{f}</span>)}</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {exercises.length === 0 && !loading && <div className="text-center py-12 text-gray-400">No exercises found matching your filters.</div>}

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAdd} className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add Exercise</h2>
            <div className="space-y-3">
              <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Exercise name" required className="w-full p-2 border rounded-lg" />
              <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Description" className="w-full p-2 border rounded-lg" rows={2} />
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-xs text-gray-500">Category</label><select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} className="w-full p-2 border rounded-lg">{CATEGORIES.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}</select></div>
                <div><label className="text-xs text-gray-500">Difficulty</label><select value={form.difficulty} onChange={e => setForm(f => ({...f, difficulty: e.target.value}))} className="w-full p-2 border rounded-lg">{DIFFICULTIES.filter(d => d !== 'all').map(d => <option key={d} value={d}>{d}</option>)}</select></div>
              </div>
              <div><label className="text-xs text-gray-500">Exercise Type</label><div className="flex gap-2 mt-1">{['independent', 'partner', 'group'].map(t => (<button key={t} type="button" onClick={() => setForm(f => ({...f, exercise_type: t}))} className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${form.exercise_type === t ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{t}</button>))}</div></div>
              <input value={form.muscle_groups} onChange={e => setForm(f => ({...f, muscle_groups: e.target.value}))} placeholder="Muscle groups (comma-separated)" className="w-full p-2 border rounded-lg" />
              <input value={form.equipment} onChange={e => setForm(f => ({...f, equipment: e.target.value}))} placeholder="Equipment (comma-separated)" className="w-full p-2 border rounded-lg" />
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_timed} onChange={e => setForm(f => ({...f, is_timed: e.target.checked}))} /><span className="text-sm">Timed exercise</span></label>
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
              <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2 border rounded-lg text-gray-600">Cancel</button>
              <button type="submit" className="flex-1 py-2 bg-green-600 text-white rounded-lg font-medium">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
