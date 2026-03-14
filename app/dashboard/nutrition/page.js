'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '../../../components/BottomNav';

const MEAL_TYPES = ['breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'evening_snack'];
const MEAL_LABELS = {
  breakfast: 'Breakfast', morning_snack: 'AM Snack', lunch: 'Lunch',
  afternoon_snack: 'PM Snack', dinner: 'Dinner', evening_snack: 'Eve Snack',
  snack: 'Snack', pre_workout: 'Pre-Workout', post_workout: 'Post-Workout', shake: 'Shake',
};
const DIETARY_RESTRICTION_OPTIONS = [
  'vegetarian', 'vegan', 'halal', 'kosher', 'gluten_free', 'dairy_free', 'nut_free',
  'low_carb', 'keto', 'paleo', 'pescatarian',
];
const CUISINE_OPTIONS = [
  'Mediterranean', 'Asian', 'Mexican', 'American', 'Indian', 'Italian',
  'Japanese', 'Korean', 'Thai', 'Middle Eastern', 'African', 'Caribbean',
];
const COOKING_SKILL_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export default function PlayerNutritionPage() {
  const router = useRouter();
  const fileRef = useRef(null);
  const [user, setUser] = useState(null);
  const [plan, setPlan] = useState(null);
  const [logs, setLogs] = useState([]);
  const [totals, setTotals] = useState({ calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('today'); // today | plan | history
  const [showLog, setShowLog] = useState(false);
  const [showPhoto, setShowPhoto] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [photoResult, setPhotoResult] = useState(null);
  const [logForm, setLogForm] = useState({
    name: '', meal_type: 'lunch', calories: '', protein_g: '', carbs_g: '', fat_g: '',
  });
  const [saving, setSaving] = useState(false);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [historyDays, setHistoryDays] = useState([]);

  // Food preferences state
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);
  const [prefsForm, setPrefsForm] = useState({
    favorite_foods: [],
    disliked_foods: [],
    allergies: [],
    dietary_restrictions: [],
    cuisine_preferences: [],
    meals_per_day: 5,
    cooking_skill: 'intermediate',
  });
  const [favInput, setFavInput] = useState('');
  const [dislikeInput, setDislikeInput] = useState('');
  const [allergyInput, setAllergyInput] = useState('');

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('mf_user') || 'null');
    if (!u) { router.push('/'); return; }
    setUser(u);
    loadData(u.id);
  }, [router]);

  async function loadData(playerId) {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];

    const [planRes, logsRes] = await Promise.all([
      fetch(`/api/nutrition-plans?player_id=${playerId}&status=active`),
      fetch(`/api/meal-logs?player_id=${playerId}&date=${today}`),
    ]);

    if (planRes.ok) {
      const d = await planRes.json();
      setPlan(d.plan || d.plans?.[0] || null);
    }
    if (logsRes.ok) {
      const d = await logsRes.json();
      setLogs(d.logs || []);
      setTotals(d.totals || { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
    }

    // Load 7-day history
    const historyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const r = await fetch(`/api/meal-logs?player_id=${playerId}&date=${dateStr}`);
      if (r.ok) {
        const data = await r.json();
        historyData.push({ date: dateStr, day: d.toLocaleDateString('en-US', { weekday: 'short' }), totals: data.totals });
      }
    }
    setHistoryDays(historyData);
    setLoading(false);
  }

  async function loadPreferences() {
    if (!user) return;
    setPrefsLoading(true);
    try {
      const res = await fetch(`/api/players/${user.id}/food-preferences`);
      if (res.ok) {
        const data = await res.json();
        setPrefsForm({
          favorite_foods: data.preferences.favorite_foods || [],
          disliked_foods: data.preferences.disliked_foods || [],
          allergies: data.preferences.allergies || [],
          dietary_restrictions: data.preferences.dietary_restrictions || [],
          cuisine_preferences: data.preferences.cuisine_preferences || [],
          meals_per_day: data.preferences.meals_per_day || 5,
          cooking_skill: data.preferences.cooking_skill || 'intermediate',
        });
      }
    } catch (err) {
      console.error("Failed to load preferences:", err);
    }
    setPrefsLoading(false);
  }

  async function savePreferences() {
    if (!user) return;
    setPrefsSaving(true);
    setPrefsSaved(false);
    try {
      const res = await fetch(`/api/players/${user.id}/food-preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefsForm),
      });
      if (res.ok) {
        setPrefsSaved(true);
        setTimeout(() => setPrefsSaved(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save preferences:", err);
    }
    setPrefsSaving(false);
  }

  function addTag(field, value) {
    if (!value.trim()) return;
    setPrefsForm(f => ({
      ...f,
      [field]: f[field].includes(value.trim()) ? f[field] : [...f[field], value.trim()],
    }));
  }

  function removeTag(field, value) {
    setPrefsForm(f => ({
      ...f,
      [field]: f[field].filter(v => v !== value),
    }));
  }

  function toggleArrayItem(field, value) {
    setPrefsForm(f => ({
      ...f,
      [field]: f[field].includes(value) ? f[field].filter(v => v !== value) : [...f[field], value],
    }));
  }

  async function handleLogMeal() {
    if (!logForm.name || !user) return;
    setSaving(true);
    const res = await fetch('/api/meal-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_id: user.id,
        name: logForm.name,
        meal_type: logForm.meal_type,
        calories: logForm.calories ? parseInt(logForm.calories) : null,
        protein_g: logForm.protein_g ? parseFloat(logForm.protein_g) : null,
        carbs_g: logForm.carbs_g ? parseFloat(logForm.carbs_g) : null,
        fat_g: logForm.fat_g ? parseFloat(logForm.fat_g) : null,
      }),
    });
    if (res.ok) {
      setShowLog(false);
      setLogForm({ name: '', meal_type: 'lunch', calories: '', protein_g: '', carbs_g: '', fat_g: '' });
      loadData(user.id);
    }
    setSaving(false);
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setShowPhoto(true);
    setAnalyzing(true);
    setPhotoResult(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1];
      try {
        const res = await fetch('/api/meals/analyze-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_base64: base64,
            player_id: user.id,
            meal_type: 'lunch',
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setPhotoResult(data);
          loadData(user.id);
        } else {
          setPhotoResult({ error: data.error || 'Analysis failed' });
        }
      } catch (err) {
        setPhotoResult({ error: err.message });
      }
      setAnalyzing(false);
    };
    reader.readAsDataURL(file);
  }

  async function handleDeleteLog(id) {
    await fetch(`/api/meal-logs?id=${id}`, { method: 'DELETE' });
    loadData(user.id);
  }

  const calorieTarget = plan?.daily_calories || 2500;
  const proteinTarget = plan?.protein_target_g || 150;
  const carbsTarget = plan?.carbs_target_g || 280;
  const fatTarget = plan?.fat_target_g || 70;

  const ring = (value, target, color, size = 80) => {
    const pct = Math.min(100, Math.round((value / target) * 100));
    const circumference = 2 * Math.PI * (size / 2 - 6);
    const dashOffset = circumference - (pct / 100) * circumference;
    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={size / 2 - 6} fill="none" stroke="#f3f4f6" strokeWidth="5" />
          <circle cx={size / 2} cy={size / 2} r={size / 2 - 6} fill="none" stroke={color} strokeWidth="5"
            strokeDasharray={circumference} strokeDashoffset={dashOffset} strokeLinecap="round" className="transition-all duration-700" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold">{pct}%</span>
        </div>
      </div>
    );
  };

  const tagInput = (label, items, field, inputValue, setInputValue, color = 'green') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex gap-1 flex-wrap mb-2">
        {items.map(item => (
          <span key={item} className={`text-xs px-2 py-1 bg-${color}-100 text-${color}-700 rounded-full flex items-center gap-1`}>
            {item}
            <button onClick={() => removeTag(field, item)} className="hover:text-red-500">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(field, inputValue); setInputValue(''); } }}
          className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
          placeholder={`Type and press Enter...`} />
        <button onClick={() => { addTag(field, inputValue); setInputValue(''); }}
          disabled={!inputValue.trim()}
          className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50">
          Add
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <svg className="w-8 h-8 animate-spin text-green-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  const todayPlanMeals = plan?.mf_nutrition_plan_meals
    ?.filter(m => m.day_of_week === new Date().getDay()) || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white px-4 pt-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => router.push('/dashboard')} className="p-1">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-lg font-bold">Nutrition</h1>
          <button onClick={() => { setShowPrefs(true); loadPreferences(); }} className="p-1" title="Food Preferences">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>
          </button>
        </div>

        {/* Calorie Ring */}
        <div className="flex items-center justify-center gap-6">
          <div className="text-center">
            {ring(totals.calories, calorieTarget, '#facc15', 100)}
            <div className="mt-1">
              <span className="text-2xl font-bold">{totals.calories}</span>
              <span className="text-white/70 text-sm"> / {calorieTarget}</span>
            </div>
            <div className="text-xs text-white/60">calories today</div>
          </div>
        </div>

        {/* Macro rings */}
        <div className="flex justify-center gap-6 mt-4">
          <div className="text-center">
            {ring(Math.round(totals.protein_g), proteinTarget, '#3b82f6', 56)}
            <div className="text-xs mt-1 font-medium">{Math.round(totals.protein_g)}g</div>
            <div className="text-[10px] text-white/60">Protein</div>
          </div>
          <div className="text-center">
            {ring(Math.round(totals.carbs_g), carbsTarget, '#f59e0b', 56)}
            <div className="text-xs mt-1 font-medium">{Math.round(totals.carbs_g)}g</div>
            <div className="text-[10px] text-white/60">Carbs</div>
          </div>
          <div className="text-center">
            {ring(Math.round(totals.fat_g), fatTarget, '#ef4444', 56)}
            <div className="text-xs mt-1 font-medium">{Math.round(totals.fat_g)}g</div>
            <div className="text-[10px] text-white/60">Fat</div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-4 -mt-3 flex gap-2">
        <button onClick={() => setShowLog(true)}
          className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-3 flex items-center gap-2 hover:bg-gray-50">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          </div>
          <span className="text-sm font-medium text-gray-700">Log Meal</span>
        </button>
        <button onClick={() => fileRef.current?.click()}
          className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-3 flex items-center gap-2 hover:bg-gray-50">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></svg>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">Snap Meal</span>
            <div className="text-[10px] text-purple-500 flex items-center gap-0.5">
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
              AI Analysis
            </div>
          </div>
        </button>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
      </div>

      {/* Tabs */}
      <div className="px-4 mt-4">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'today', label: "Today's Meals" },
            { id: 'plan', label: 'My Plan' },
            { id: 'history', label: 'History' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Today Tab */}
      {tab === 'today' && (
        <div className="px-4 mt-4 space-y-3">
          {logs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.379a48.474 48.474 0 00-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12" /></svg>
              <p className="text-gray-500 font-medium">No meals logged today</p>
              <p className="text-gray-400 text-sm mt-1">Tap "Log Meal" or snap a photo to get started</p>
            </div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium capitalize">
                        {MEAL_LABELS[log.meal_type] || log.meal_type}
                      </span>
                      {log.ai_analysis && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded-full flex items-center gap-0.5">
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                          AI Analyzed
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 mt-1">{log.name}</h3>
                    <div className="flex gap-3 mt-2 text-xs text-gray-500">
                      {log.calories && <span className="font-medium text-amber-600">{log.calories} cal</span>}
                      {log.protein_g && <span>P: {log.protein_g}g</span>}
                      {log.carbs_g && <span>C: {log.carbs_g}g</span>}
                      {log.fat_g && <span>F: {log.fat_g}g</span>}
                    </div>
                    {log.ai_analysis?.assessment && (
                      <p className="text-xs text-gray-400 mt-2 line-clamp-2">{log.ai_analysis.assessment}</p>
                    )}
                  </div>
                  <button onClick={() => handleDeleteLog(log.id)} className="p-1 text-gray-300 hover:text-red-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                {log.ai_analysis?.meal_score && (
                  <div className="mt-2 flex items-center gap-1">
                    <span className="text-[10px] text-gray-400">Meal Score:</span>
                    <div className="flex gap-0.5">
                      {[...Array(10)].map((_, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full ${i < log.ai_analysis.meal_score ? 'bg-green-500' : 'bg-gray-200'}`} />
                      ))}
                    </div>
                    <span className="text-xs font-medium text-green-600">{log.ai_analysis.meal_score}/10</span>
                  </div>
                )}
              </div>
            ))
          )}

          {/* Today's planned meals from nutrition plan */}
          {todayPlanMeals.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Planned Meals Today
              </h3>
              {todayPlanMeals.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map(pm => {
                const logged = logs.some(l => l.name?.toLowerCase() === pm.name?.toLowerCase());
                return (
                  <div key={pm.id} className={`bg-white rounded-xl border p-3 mb-2 flex items-center justify-between ${logged ? 'border-green-200 bg-green-50/50' : 'border-gray-200'}`}>
                    <div>
                      <div className="flex items-center gap-2">
                        {logged && <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        <span className={`text-sm font-medium ${logged ? 'text-green-700 line-through' : 'text-gray-900'}`}>{pm.name}</span>
                      </div>
                      <div className="flex gap-2 text-[10px] text-gray-400 mt-0.5">
                        <span className="capitalize">{MEAL_LABELS[pm.meal_type] || pm.meal_type}</span>
                        {pm.calories && <span>{pm.calories} cal</span>}
                      </div>
                    </div>
                    {!logged && (
                      <button onClick={() => {
                        setLogForm({
                          name: pm.name, meal_type: pm.meal_type || 'lunch',
                          calories: pm.calories?.toString() || '', protein_g: pm.protein_g?.toString() || '',
                          carbs_g: pm.carbs_g?.toString() || '', fat_g: pm.fat_g?.toString() || '',
                        });
                        setShowLog(true);
                      }}
                        className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700">
                        Log
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Plan Tab */}
      {tab === 'plan' && (
        <div className="px-4 mt-4 space-y-4">
          {!plan ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
              <p className="text-gray-500 font-medium">No nutrition plan yet</p>
              <p className="text-gray-400 text-sm mt-1">Your coach will generate a personalized AI nutrition plan for you</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  {plan.is_ai_generated && (
                    <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full flex items-center gap-0.5">
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                      AI Generated
                    </span>
                  )}
                </div>
                <h2 className="font-bold text-gray-900 text-lg">{plan.name}</h2>
                <p className="text-sm text-gray-500 mt-1">{plan.description}</p>

                {/* Daily targets */}
                <div className="grid grid-cols-4 gap-2 mt-4">
                  <div className="bg-amber-50 rounded-lg p-2 text-center">
                    <div className="text-sm font-bold text-amber-600">{plan.daily_calories}</div>
                    <div className="text-[10px] text-amber-400">Cal</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-2 text-center">
                    <div className="text-sm font-bold text-blue-600">{plan.protein_target_g}g</div>
                    <div className="text-[10px] text-blue-400">Protein</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-2 text-center">
                    <div className="text-sm font-bold text-yellow-600">{plan.carbs_target_g}g</div>
                    <div className="text-[10px] text-yellow-400">Carbs</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-2 text-center">
                    <div className="text-sm font-bold text-red-500">{plan.fat_target_g}g</div>
                    <div className="text-[10px] text-red-400">Fat</div>
                  </div>
                </div>
              </div>

              {/* AI Writeup */}
              {plan.ai_writeup && (
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                  <h3 className="text-sm font-semibold text-purple-700 mb-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                    AI Nutritional Analysis
                  </h3>
                  <p className="text-sm text-purple-600 whitespace-pre-line">{plan.ai_writeup}</p>
                </div>
              )}

              {/* Day selector */}
              <div className="flex gap-1 overflow-x-auto pb-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                  <button key={i} onClick={() => setSelectedDay(i)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg min-w-[48px] transition-all ${selectedDay === i ? 'bg-green-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
                    {day}
                  </button>
                ))}
              </div>

              {/* Day meals */}
              <div className="space-y-2">
                {(plan.mf_nutrition_plan_meals || [])
                  .filter(m => m.day_of_week === selectedDay)
                  .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                  .map(meal => (
                    <div key={meal.id} className="bg-white rounded-xl border border-gray-200 p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] text-green-600 font-medium capitalize">{MEAL_LABELS[meal.meal_type] || meal.meal_type}</span>
                          <h4 className="font-medium text-gray-900 text-sm">{meal.name}</h4>
                          {meal.notes && <p className="text-xs text-gray-400 mt-0.5">{meal.notes}</p>}
                        </div>
                        {meal.calories && <span className="text-sm font-bold text-amber-600">{meal.calories}<span className="text-[10px] text-gray-400">cal</span></span>}
                      </div>
                      <div className="flex gap-3 mt-2 text-[10px] text-gray-400">
                        {meal.protein_g && <span>P: {meal.protein_g}g</span>}
                        {meal.carbs_g && <span>C: {meal.carbs_g}g</span>}
                        {meal.fat_g && <span>F: {meal.fat_g}g</span>}
                      </div>
                    </div>
                  ))}
                {(plan.mf_nutrition_plan_meals || []).filter(m => m.day_of_week === selectedDay).length === 0 && (
                  <p className="text-center text-sm text-gray-400 py-8">No meals planned for this day</p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="px-4 mt-4 space-y-4">
          {/* 7-day calorie chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">7-Day Calorie Intake</h3>
            <div className="flex items-end gap-2 h-32">
              {historyDays.map((d, i) => {
                const pct = calorieTarget > 0 ? Math.min(100, Math.round((d.totals.calories / calorieTarget) * 100)) : 0;
                const isToday = i === historyDays.length - 1;
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-gray-400">{d.totals.calories || 0}</span>
                    <div className="w-full bg-gray-100 rounded-t-md overflow-hidden" style={{ height: '80px' }}>
                      <div className={`w-full rounded-t-md transition-all ${isToday ? 'bg-green-500' : pct >= 80 ? 'bg-green-400' : 'bg-gray-300'}`}
                        style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }} />
                    </div>
                    <span className={`text-[10px] font-medium ${isToday ? 'text-green-600' : 'text-gray-400'}`}>{d.day}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex items-center gap-1 text-[10px] text-gray-400">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Target: {calorieTarget} cal/day</span>
            </div>
          </div>

          {/* Macro breakdown bars */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">7-Day Macro Averages</h3>
            {(() => {
              const days = historyDays.filter(d => d.totals.meal_count > 0);
              const count = days.length || 1;
              const avgProtein = Math.round(days.reduce((s, d) => s + d.totals.protein_g, 0) / count);
              const avgCarbs = Math.round(days.reduce((s, d) => s + d.totals.carbs_g, 0) / count);
              const avgFat = Math.round(days.reduce((s, d) => s + d.totals.fat_g, 0) / count);
              return (
                <div className="space-y-3">
                  {[
                    { label: 'Protein', value: avgProtein, target: proteinTarget, color: 'bg-blue-500' },
                    { label: 'Carbs', value: avgCarbs, target: carbsTarget, color: 'bg-amber-500' },
                    { label: 'Fat', value: avgFat, target: fatTarget, color: 'bg-red-500' },
                  ].map(m => (
                    <div key={m.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">{m.label}</span>
                        <span className="font-medium">{m.value}g / {m.target}g</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${m.color} transition-all duration-500`}
                          style={{ width: `${Math.min(100, Math.round((m.value / m.target) * 100))}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Streak */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" /></svg>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">{historyDays.filter(d => d.totals.meal_count > 0).length}-day streak</div>
              <div className="text-xs text-gray-400">Consecutive days logging meals</div>
            </div>
          </div>
        </div>
      )}

      {/* Log Meal Modal */}
      {showLog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowLog(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Log a Meal</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">What did you eat? *</label>
                  <input type="text" value={logForm.name} onChange={e => setLogForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" placeholder="e.g. Grilled chicken with rice" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meal Type</label>
                  <select value={logForm.meal_type} onChange={e => setLogForm(f => ({ ...f, meal_type: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none">
                    {Object.entries(MEAL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Calories</label>
                    <input type="number" value={logForm.calories} onChange={e => setLogForm(f => ({ ...f, calories: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" placeholder="450" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Protein (g)</label>
                    <input type="number" value={logForm.protein_g} onChange={e => setLogForm(f => ({ ...f, protein_g: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Carbs (g)</label>
                    <input type="number" value={logForm.carbs_g} onChange={e => setLogForm(f => ({ ...f, carbs_g: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fat (g)</label>
                    <input type="number" value={logForm.fat_g} onChange={e => setLogForm(f => ({ ...f, fat_g: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={handleLogMeal} disabled={saving || !logForm.name}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Log Meal (+10 XP)'}
                </button>
                <button onClick={() => setShowLog(false)} className="px-4 py-2.5 text-gray-600 text-sm rounded-lg hover:bg-gray-100">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Analysis Modal */}
      {showPhoto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={() => { setShowPhoto(false); setPhotoResult(null); }}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900">AI Meal Analysis</h2>
              </div>

              {analyzing && (
                <div className="text-center py-12">
                  <svg className="w-10 h-10 animate-spin text-purple-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <p className="text-gray-600 font-medium">Analyzing your meal...</p>
                  <p className="text-sm text-gray-400 mt-1">AI is identifying foods and calculating macros</p>
                </div>
              )}

              {photoResult && !photoResult.error && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                    <h3 className="font-semibold text-green-800">{photoResult.meal_name}</h3>
                    {photoResult.meal_score && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-green-600">Score:</span>
                        <span className="font-bold text-green-700">{photoResult.meal_score}/10</span>
                      </div>
                    )}
                  </div>

                  {/* Totals */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'Cal', value: photoResult.totals?.calories, color: 'text-amber-600 bg-amber-50' },
                      { label: 'Protein', value: `${photoResult.totals?.protein_g}g`, color: 'text-blue-600 bg-blue-50' },
                      { label: 'Carbs', value: `${photoResult.totals?.carbs_g}g`, color: 'text-yellow-600 bg-yellow-50' },
                      { label: 'Fat', value: `${photoResult.totals?.fat_g}g`, color: 'text-red-500 bg-red-50' },
                    ].map(s => (
                      <div key={s.label} className={`${s.color} rounded-lg p-2 text-center`}>
                        <div className="text-sm font-bold">{s.value}</div>
                        <div className="text-[10px]">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Items */}
                  {photoResult.items?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Identified Items</h4>
                      {photoResult.items.map((item, i) => (
                        <div key={i} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                          <div>
                            <span className="text-sm text-gray-900">{item.name}</span>
                            <span className="text-xs text-gray-400 ml-1">({item.portion})</span>
                          </div>
                          <span className="text-xs font-medium text-amber-600">{item.calories} cal</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Assessment */}
                  {photoResult.assessment && (
                    <div className="bg-blue-50 rounded-xl p-3">
                      <h4 className="text-xs font-semibold text-blue-700 mb-1">Assessment</h4>
                      <p className="text-sm text-blue-600">{photoResult.assessment}</p>
                    </div>
                  )}

                  {/* Suggestions */}
                  {photoResult.suggestions?.length > 0 && (
                    <div className="bg-amber-50 rounded-xl p-3">
                      <h4 className="text-xs font-semibold text-amber-700 mb-1">Suggestions</h4>
                      <ul className="text-sm text-amber-600 space-y-1">
                        {photoResult.suggestions.map((s, i) => <li key={i}>• {s}</li>)}
                      </ul>
                    </div>
                  )}

                  <p className="text-xs text-green-600 text-center font-medium">Meal logged automatically (+10 XP)</p>

                  <button onClick={() => { setShowPhoto(false); setPhotoResult(null); }}
                    className="w-full px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700">
                    Done
                  </button>
                </div>
              )}

              {photoResult?.error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-red-700 text-sm">{photoResult.error}</p>
                  <button onClick={() => { setShowPhoto(false); setPhotoResult(null); }}
                    className="mt-2 text-red-600 text-sm underline">Close</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Food Preferences Modal */}
      {showPrefs && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowPrefs(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">My Food Preferences</h2>
                </div>
                <button onClick={() => setShowPrefs(false)} className="p-1 text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <p className="text-sm text-gray-500 mb-4">Tell us what you like and don't like. Your coach will use this when generating your nutrition plan.</p>

              {prefsLoading ? (
                <div className="flex justify-center py-12">
                  <svg className="animate-spin h-8 w-8 text-green-600" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Favorite Foods */}
                  {tagInput('Favorite Foods', prefsForm.favorite_foods, 'favorite_foods', favInput, setFavInput, 'green')}

                  {/* Disliked Foods */}
                  {tagInput('Foods I Dislike', prefsForm.disliked_foods, 'disliked_foods', dislikeInput, setDislikeInput, 'red')}

                  {/* Allergies */}
                  {tagInput('Allergies', prefsForm.allergies, 'allergies', allergyInput, setAllergyInput, 'red')}

                  {/* Dietary Restrictions (checkboxes) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dietary Restrictions</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {DIETARY_RESTRICTION_OPTIONS.map(opt => (
                        <button key={opt} onClick={() => toggleArrayItem('dietary_restrictions', opt)}
                          className={`px-2.5 py-1 text-xs rounded-full capitalize transition-all ${prefsForm.dietary_restrictions.includes(opt) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                          {opt.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cuisine Preferences (checkboxes) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cuisine Preferences</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {CUISINE_OPTIONS.map(cuisine => (
                        <button key={cuisine} onClick={() => toggleArrayItem('cuisine_preferences', cuisine)}
                          className={`px-2.5 py-1 text-xs rounded-full transition-all ${prefsForm.cuisine_preferences.includes(cuisine) ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                          {cuisine}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Meals per day & Cooking skill */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Meals per Day</label>
                      <select value={prefsForm.meals_per_day} onChange={e => setPrefsForm(f => ({ ...f, meals_per_day: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none">
                        {[3, 4, 5, 6].map(n => <option key={n} value={n}>{n} meals</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cooking Skill</label>
                      <select value={prefsForm.cooking_skill} onChange={e => setPrefsForm(f => ({ ...f, cooking_skill: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none">
                        {COOKING_SKILL_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex gap-3 pt-2">
                    <button onClick={savePreferences} disabled={prefsSaving}
                      className="flex-1 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50">
                      {prefsSaving ? 'Saving...' : prefsSaved ? 'Saved!' : 'Save Preferences'}
                    </button>
                    <button onClick={() => setShowPrefs(false)} className="px-4 py-2.5 text-gray-600 text-sm rounded-lg hover:bg-gray-100">
                      Cancel
                    </button>
                  </div>

                  {prefsSaved && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                      <p className="text-sm text-green-700 font-medium">Preferences saved! Your coach will see these when generating your next nutrition plan.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
