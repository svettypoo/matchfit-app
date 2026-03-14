'use client';

import { useState, useEffect } from 'react';

const MEAL_TYPES = ['all', 'breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout', 'shake'];
const DIETARY_TAGS = ['high_protein', 'low_carb', 'vegan', 'vegetarian', 'gluten_free', 'dairy_free', 'keto', 'paleo'];

export default function NutritionPage() {
  const [tab, setTab] = useState('meals'); // meals | plans | players
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mealType, setMealType] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [showAIGen, setShowAIGen] = useState(false);
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState(null);
  const [addForm, setAddForm] = useState({
    name: '', description: '', meal_type: 'lunch', cuisine: '',
    calories: '', protein_g: '', carbs_g: '', fat_g: '',
    fiber_g: '', prep_time_min: '', ingredients: '', instructions: '',
    dietary_tags: [], allergens: [], serving_size: '', image_url: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMeals();
    loadPlayers();
  }, []);

  async function loadMeals() {
    setLoading(true);
    const user = JSON.parse(localStorage.getItem('mf_user') || '{}');
    const params = new URLSearchParams({ coach_id: user.id });
    if (mealType !== 'all') params.set('meal_type', mealType);
    if (search) params.set('search', search);

    const res = await fetch(`/api/meals?${params}`);
    if (res.ok) {
      const data = await res.json();
      setMeals(data.meals || []);
    }
    setLoading(false);
  }

  async function loadPlayers() {
    const user = JSON.parse(localStorage.getItem('mf_user') || '{}');
    const res = await fetch(`/api/coach/players?coach_id=${user.id}`);
    if (res.ok) {
      const data = await res.json();
      setPlayers(data.players || []);
    }
  }

  useEffect(() => { loadMeals(); }, [mealType, search]);

  async function handleAddMeal() {
    setSaving(true);
    const user = JSON.parse(localStorage.getItem('mf_user') || '{}');
    const res = await fetch('/api/meals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...addForm,
        coach_id: user.id,
        calories: addForm.calories ? parseInt(addForm.calories) : null,
        protein_g: addForm.protein_g ? parseFloat(addForm.protein_g) : null,
        carbs_g: addForm.carbs_g ? parseFloat(addForm.carbs_g) : null,
        fat_g: addForm.fat_g ? parseFloat(addForm.fat_g) : null,
        fiber_g: addForm.fiber_g ? parseFloat(addForm.fiber_g) : null,
        prep_time_min: addForm.prep_time_min ? parseInt(addForm.prep_time_min) : null,
        ingredients: addForm.ingredients ? addForm.ingredients.split('\n').filter(Boolean) : [],
      }),
    });
    if (res.ok) {
      setShowAdd(false);
      setAddForm({ name: '', description: '', meal_type: 'lunch', cuisine: '', calories: '', protein_g: '', carbs_g: '', fat_g: '', fiber_g: '', prep_time_min: '', ingredients: '', instructions: '', dietary_tags: [], allergens: [], serving_size: '', image_url: '' });
      loadMeals();
    }
    setSaving(false);
  }

  async function handleGeneratePlan() {
    if (!selectedPlayer) return;
    setGenerating(true);
    setGenResult(null);
    try {
      const res = await fetch('/api/nutrition-plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: selectedPlayer }),
      });
      const data = await res.json();
      if (res.ok) {
        setGenResult(data);
      } else {
        setGenResult({ error: data.error || 'Failed to generate plan' });
      }
    } catch (err) {
      setGenResult({ error: err.message });
    }
    setGenerating(false);
  }

  const macroBar = (label, value, target, color) => {
    const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
    return (
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-600">{label}</span>
          <span className="font-medium">{value || 0}g / {target}g</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Nutrition</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowAIGen(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" /></svg>
            AI Generate Plan
          </button>
          <button onClick={() => setShowAdd(true)}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700">
            + Add Meal
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { id: 'meals', label: 'Meal Library' },
          { id: 'plans', label: 'Player Plans' },
          { id: 'logs', label: 'Meal Logs' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Meal Library Tab */}
      {tab === 'meals' && (
        <div className="space-y-4">
          <div className="flex gap-3 items-center flex-wrap">
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search meals..." className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-64 focus:ring-2 focus:ring-green-500 outline-none" />
            <div className="flex gap-1 flex-wrap">
              {MEAL_TYPES.map(t => (
                <button key={t} onClick={() => setMealType(t)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full capitalize transition-all ${mealType === t ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {t.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-green-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : meals.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.379a48.474 48.474 0 00-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12" /></svg>
              <p className="text-gray-500 font-medium">No meals in the library yet</p>
              <p className="text-gray-400 text-sm mt-1">Add meals manually or generate an AI nutrition plan to auto-populate</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {meals.map(meal => (
                <div key={meal.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  {meal.image_url && (
                    <div className="h-36 bg-gray-100 overflow-hidden">
                      <img src={meal.image_url} alt={meal.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{meal.name}</h3>
                        <span className="text-xs text-green-600 font-medium capitalize">{(meal.meal_type || '').replace('_', ' ')}</span>
                      </div>
                      {meal.calories && (
                        <span className="text-lg font-bold text-amber-600">{meal.calories}<span className="text-xs font-normal text-gray-400"> cal</span></span>
                      )}
                    </div>
                    {meal.description && <p className="text-sm text-gray-500 mt-2 line-clamp-2">{meal.description}</p>}

                    {/* Macro bars */}
                    {(meal.protein_g || meal.carbs_g || meal.fat_g) && (
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                        <div className="bg-blue-50 rounded-lg p-2">
                          <div className="text-sm font-bold text-blue-600">{meal.protein_g || 0}g</div>
                          <div className="text-[10px] text-blue-400">Protein</div>
                        </div>
                        <div className="bg-amber-50 rounded-lg p-2">
                          <div className="text-sm font-bold text-amber-600">{meal.carbs_g || 0}g</div>
                          <div className="text-[10px] text-amber-400">Carbs</div>
                        </div>
                        <div className="bg-red-50 rounded-lg p-2">
                          <div className="text-sm font-bold text-red-500">{meal.fat_g || 0}g</div>
                          <div className="text-[10px] text-red-400">Fat</div>
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {(meal.dietary_tags || []).length > 0 && (
                      <div className="mt-2 flex gap-1 flex-wrap">
                        {meal.dietary_tags.map(tag => (
                          <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-600 rounded-full capitalize">{tag.replace('_', ' ')}</span>
                        ))}
                      </div>
                    )}

                    {meal.is_ai_generated && (
                      <div className="mt-2 flex items-center gap-1 text-[10px] text-purple-500">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                        AI Generated
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Player Plans Tab */}
      {tab === 'plans' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Player Nutrition Plans</h2>
            <p className="text-sm text-gray-500 mb-4">Select a player to view or generate their AI nutrition plan.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {players.map(p => (
                <button key={p.id} onClick={() => { setSelectedPlayer(p.id); setShowAIGen(true); }}
                  className="text-left p-4 bg-gray-50 rounded-xl hover:bg-green-50 hover:border-green-200 border border-gray-100 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                      {(p.name || 'P')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{p.name}</div>
                      <div className="text-xs text-gray-500">{p.position?.join(', ') || 'Player'} | {p.weight_kg || '?'}kg</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Meal Logs Tab */}
      {tab === 'logs' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Team Meal Logs</h2>
          <p className="text-sm text-gray-500">Coming soon: View meal logs across your team, track compliance with nutrition plans, and identify players not meeting their macro targets.</p>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {['Avg Calories', 'Avg Protein', 'Plan Compliance', 'Photo Logs'].map((stat, i) => (
              <div key={stat} className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-gray-300">{['--', '--', '--', '--'][i]}</div>
                <div className="text-xs text-gray-400 mt-1">{stat}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Meal Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Add Meal to Library</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input type="text" value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" placeholder="e.g. Grilled Chicken Quinoa Bowl" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meal Type *</label>
                    <select value={addForm.meal_type} onChange={e => setAddForm(f => ({ ...f, meal_type: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none">
                      {MEAL_TYPES.filter(t => t !== 'all').map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Calories</label>
                    <input type="number" value={addForm.calories} onChange={e => setAddForm(f => ({ ...f, calories: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" placeholder="450" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Protein (g)</label>
                    <input type="number" value={addForm.protein_g} onChange={e => setAddForm(f => ({ ...f, protein_g: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Carbs (g)</label>
                    <input type="number" value={addForm.carbs_g} onChange={e => setAddForm(f => ({ ...f, carbs_g: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fat (g)</label>
                    <input type="number" value={addForm.fat_g} onChange={e => setAddForm(f => ({ ...f, fat_g: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={addForm.description} onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none resize-none" rows={2} placeholder="Brief description..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ingredients (one per line)</label>
                  <textarea value={addForm.ingredients} onChange={e => setAddForm(f => ({ ...f, ingredients: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none resize-none" rows={3} placeholder="200g chicken breast&#10;1 cup quinoa&#10;Mixed greens" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dietary Tags</label>
                  <div className="flex gap-1 flex-wrap">
                    {DIETARY_TAGS.map(tag => (
                      <button key={tag} onClick={() => setAddForm(f => ({
                        ...f,
                        dietary_tags: f.dietary_tags.includes(tag)
                          ? f.dietary_tags.filter(t => t !== tag)
                          : [...f.dietary_tags, tag],
                      }))}
                        className={`px-2.5 py-1 text-xs rounded-full capitalize ${addForm.dietary_tags.includes(tag) ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                        {tag.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={handleAddMeal} disabled={saving || !addForm.name}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Add Meal'}
                </button>
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-gray-600 text-sm rounded-lg hover:bg-gray-100">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Generate Plan Modal */}
      {showAIGen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setShowAIGen(false); setGenResult(null); }}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">AI Nutrition Plan Generator</h2>
                  <p className="text-sm text-gray-500">Generates a personalized 7-day meal plan based on player profile, training load, and goals</p>
                </div>
              </div>

              {!genResult && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Player</label>
                    <select value={selectedPlayer} onChange={e => setSelectedPlayer(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none">
                      <option value="">Choose a player...</option>
                      {players.map(p => <option key={p.id} value={p.id}>{p.name} ({p.weight_kg || '?'}kg, {p.position?.join('/') || 'Player'})</option>)}
                    </select>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 text-sm text-purple-700 mb-4">
                    <strong>AI considers:</strong> Player weight/height, training frequency, active exercise plan phase, fitness level, and nutritional goals to calculate TDEE and optimal macro splits.
                  </div>
                  <button onClick={handleGeneratePlan} disabled={generating || !selectedPlayer}
                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                    {generating ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Generating plan with AI...
                      </>
                    ) : 'Generate Nutrition Plan'}
                  </button>
                </>
              )}

              {genResult && !genResult.error && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <h3 className="font-semibold text-green-800">{genResult.plan?.name}</h3>
                    <p className="text-sm text-green-700 mt-1">{genResult.plan?.description}</p>
                  </div>

                  {/* Macro targets */}
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Calories', value: genResult.plan?.daily_calories, unit: 'cal', color: 'text-amber-600' },
                      { label: 'Protein', value: genResult.plan?.protein_target_g, unit: 'g', color: 'text-blue-600' },
                      { label: 'Carbs', value: genResult.plan?.carbs_target_g, unit: 'g', color: 'text-amber-600' },
                      { label: 'Fat', value: genResult.plan?.fat_target_g, unit: 'g', color: 'text-red-500' },
                    ].map(s => (
                      <div key={s.label} className="bg-white border rounded-xl p-3 text-center">
                        <div className={`text-xl font-bold ${s.color}`}>{s.value || 0}{s.unit}</div>
                        <div className="text-[10px] text-gray-400">{s.label}/day</div>
                      </div>
                    ))}
                  </div>

                  {/* AI Writeup */}
                  {genResult.plan?.ai_writeup && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">AI Analysis</h4>
                      <p className="text-sm text-gray-600 whitespace-pre-line">{genResult.plan.ai_writeup}</p>
                    </div>
                  )}

                  {/* Tips */}
                  {genResult.tips?.length > 0 && (
                    <div className="bg-blue-50 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-blue-700 mb-2">Nutrition Tips</h4>
                      <ul className="text-sm text-blue-600 space-y-1">
                        {genResult.tips.map((tip, i) => <li key={i}>• {tip}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* Shopping list */}
                  {genResult.shopping_list?.length > 0 && (
                    <div className="bg-amber-50 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-amber-700 mb-2">Shopping List ({genResult.shopping_list.length} items)</h4>
                      <div className="grid grid-cols-2 gap-1 text-sm text-amber-600">
                        {genResult.shopping_list.map((item, i) => <div key={i}>• {item}</div>)}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button onClick={() => { setShowAIGen(false); setGenResult(null); loadMeals(); }}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700">
                      Done
                    </button>
                    <button onClick={() => setGenResult(null)}
                      className="px-4 py-2 text-gray-600 text-sm rounded-lg hover:bg-gray-100">
                      Generate Another
                    </button>
                  </div>
                </div>
              )}

              {genResult?.error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-4">
                  <p className="text-red-700 text-sm">{genResult.error}</p>
                  <button onClick={() => setGenResult(null)} className="mt-2 text-red-600 text-sm underline">Try Again</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
