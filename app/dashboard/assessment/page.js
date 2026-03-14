'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '../../../components/BottomNav';

const BODY_AREAS = [
  { id: 'neck', label: 'Neck', x: 50, y: 8 },
  { id: 'shoulder_left', label: 'L Shoulder', x: 28, y: 18 },
  { id: 'shoulder_right', label: 'R Shoulder', x: 72, y: 18 },
  { id: 'upper_back', label: 'Upper Back', x: 50, y: 22 },
  { id: 'lower_back', label: 'Lower Back', x: 50, y: 35 },
  { id: 'elbow_left', label: 'L Elbow', x: 18, y: 35 },
  { id: 'elbow_right', label: 'R Elbow', x: 82, y: 35 },
  { id: 'wrist_left', label: 'L Wrist', x: 12, y: 48 },
  { id: 'wrist_right', label: 'R Wrist', x: 88, y: 48 },
  { id: 'hip_left', label: 'L Hip', x: 35, y: 45 },
  { id: 'hip_right', label: 'R Hip', x: 65, y: 45 },
  { id: 'groin', label: 'Groin', x: 50, y: 50 },
  { id: 'quad_left', label: 'L Quad', x: 37, y: 58 },
  { id: 'quad_right', label: 'R Quad', x: 63, y: 58 },
  { id: 'hamstring_left', label: 'L Hamstring', x: 37, y: 62 },
  { id: 'hamstring_right', label: 'R Hamstring', x: 63, y: 62 },
  { id: 'knee_left', label: 'L Knee', x: 37, y: 70 },
  { id: 'knee_right', label: 'R Knee', x: 63, y: 70 },
  { id: 'shin_left', label: 'L Shin', x: 37, y: 78 },
  { id: 'shin_right', label: 'R Shin', x: 63, y: 78 },
  { id: 'ankle_left', label: 'L Ankle', x: 37, y: 88 },
  { id: 'ankle_right', label: 'R Ankle', x: 63, y: 88 },
  { id: 'foot_left', label: 'L Foot', x: 37, y: 95 },
  { id: 'foot_right', label: 'R Foot', x: 63, y: 95 },
];

const PAIN_TYPES = ['Sharp', 'Dull', 'Aching', 'Burning', 'Stiffness', 'Throbbing', 'Tingling'];
const FREQUENCIES = ['Always', 'Often', 'Sometimes', 'Rarely'];
const INJURY_TYPES = ['Sprain', 'Strain', 'Fracture', 'Surgery', 'Tendinitis', 'Dislocation', 'Concussion', 'Other'];
const EQUIPMENT = ['Dumbbells', 'Barbell', 'Resistance Bands', 'Kettlebell', 'Pull-up Bar', 'Bench', 'Cables', 'Medicine Ball', 'Cones', 'Agility Ladder', 'TRX', 'Foam Roller', 'Soccer Ball'];
const GOALS = ['Build Strength', 'Improve Speed', 'Increase Endurance', 'Better Flexibility', 'Injury Prevention', 'Return from Injury', 'Get Match Fit', 'Weight Loss', 'Muscle Gain'];

export default function AssessmentPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [editingPain, setEditingPain] = useState(null);

  const [data, setData] = useState({
    pain_areas: [],
    injury_history: [],
    can_full_squat: null,
    squat_pain_areas: '',
    can_overhead_reach: null,
    overhead_pain_areas: '',
    can_single_leg_balance: true,
    balance_weaker_side: '',
    can_touch_toes: null,
    flexibility_notes: '',
    has_clicking_joints: false,
    clicking_joints_areas: '',
    years_training: 0,
    current_training_frequency: 3,
    previous_programs: '',
    exercises_avoided: '',
    exercises_painful: '',
    sleep_hours_avg: 7.5,
    sleep_quality: 3,
    stress_level: 3,
    nutrition_quality: 3,
    hydration_daily_liters: 2.0,
    primary_fitness_goal: '',
    secondary_goals: [],
    preferred_workout_duration: 60,
    equipment_available: [],
    workout_environment: 'gym',
    has_medical_conditions: false,
    medical_conditions: '',
    takes_medications: false,
    medications: '',
    doctor_clearance: true,
  });

  const [newInjury, setNewInjury] = useState({ body_part: '', type: '', date: '', fully_recovered: true, still_affects: false, notes: '' });

  function update(key, val) {
    setData(d => ({ ...d, [key]: val }));
  }

  function toggleArrayItem(key, val) {
    setData(d => ({
      ...d,
      [key]: d[key].includes(val) ? d[key].filter(v => v !== val) : [...d[key], val],
    }));
  }

  function addPainArea(area) {
    const existing = data.pain_areas.find(p => p.area === area.id);
    if (existing) {
      setEditingPain(area.id);
    } else {
      setData(d => ({
        ...d,
        pain_areas: [...d.pain_areas, {
          area: area.id,
          label: area.label,
          severity: 3,
          type: 'Aching',
          frequency: 'Sometimes',
          during_activity: true,
          after_activity: false,
          at_rest: false,
          notes: '',
        }],
      }));
      setEditingPain(area.id);
    }
  }

  function updatePainArea(areaId, field, value) {
    setData(d => ({
      ...d,
      pain_areas: d.pain_areas.map(p => p.area === areaId ? { ...p, [field]: value } : p),
    }));
  }

  function removePainArea(areaId) {
    setData(d => ({ ...d, pain_areas: d.pain_areas.filter(p => p.area !== areaId) }));
    setEditingPain(null);
  }

  function addInjury() {
    if (!newInjury.body_part) return;
    setData(d => ({ ...d, injury_history: [...d.injury_history, { ...newInjury }] }));
    setNewInjury({ body_part: '', type: '', date: '', fully_recovered: true, still_affects: false, notes: '' });
  }

  function removeInjury(idx) {
    setData(d => ({ ...d, injury_history: d.injury_history.filter((_, i) => i !== idx) }));
  }

  async function handleSubmit() {
    setGenerating(true);
    try {
      const user = JSON.parse(localStorage.getItem('mf_user') || '{}');

      // Submit questionnaire
      await fetch('/api/questionnaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: user.id, ...data }),
      });

      // Generate exercise plan
      await fetch('/api/exercise-plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: user.id }),
      });

      setTimeout(() => router.push('/dashboard/plan'), 2000);
    } catch (err) {
      console.error(err);
      setGenerating(false);
    }
  }

  if (generating) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="text-center px-6">
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <svg className="animate-spin w-full h-full text-green-600" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Building Your Plan</h2>
          <p className="text-gray-500 max-w-sm mx-auto">Analyzing your assessment, injury history, and goals to create a personalized training program...</p>
          <div className="mt-6 flex justify-center gap-1.5">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-3 h-3 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: `${i * 250}ms` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalSteps = 6;

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b z-10 px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
              </button>
              <span className="text-sm font-medium text-gray-600">Fitness Assessment — Step {step} of {totalSteps}</span>
            </div>
            <span className="text-sm text-gray-400">{Math.round((step / totalSteps) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${(step / totalSteps) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4">

        {/* Step 1: Pain & Aches Body Map */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Where Does It Hurt?</h2>
              <p className="text-gray-500 text-sm">Tap on any body areas where you experience pain, stiffness, or discomfort</p>
            </div>

            {/* Body Map */}
            <div className="bg-white rounded-xl p-4 shadow-sm relative" style={{ minHeight: 420 }}>
              <div className="relative mx-auto" style={{ width: 200, height: 400 }}>
                {/* Simple body outline */}
                <svg viewBox="0 0 100 100" className="w-full h-full text-gray-200">
                  {/* Head */}
                  <circle cx="50" cy="6" r="5" fill="none" stroke="currentColor" strokeWidth="1" />
                  {/* Torso */}
                  <line x1="50" y1="11" x2="50" y2="45" stroke="currentColor" strokeWidth="1.5" />
                  {/* Arms */}
                  <line x1="50" y1="18" x2="25" y2="35" stroke="currentColor" strokeWidth="1" />
                  <line x1="25" y1="35" x2="15" y2="48" stroke="currentColor" strokeWidth="1" />
                  <line x1="50" y1="18" x2="75" y2="35" stroke="currentColor" strokeWidth="1" />
                  <line x1="75" y1="35" x2="85" y2="48" stroke="currentColor" strokeWidth="1" />
                  {/* Shoulders */}
                  <line x1="30" y1="16" x2="70" y2="16" stroke="currentColor" strokeWidth="1" />
                  {/* Hips */}
                  <line x1="38" y1="45" x2="62" y2="45" stroke="currentColor" strokeWidth="1" />
                  {/* Legs */}
                  <line x1="40" y1="45" x2="37" y2="72" stroke="currentColor" strokeWidth="1.2" />
                  <line x1="60" y1="45" x2="63" y2="72" stroke="currentColor" strokeWidth="1.2" />
                  <line x1="37" y1="72" x2="35" y2="95" stroke="currentColor" strokeWidth="1" />
                  <line x1="63" y1="72" x2="65" y2="95" stroke="currentColor" strokeWidth="1" />
                </svg>

                {/* Pain dots */}
                {BODY_AREAS.map(area => {
                  const pain = data.pain_areas.find(p => p.area === area.id);
                  return (
                    <button
                      key={area.id}
                      onClick={() => addPainArea(area)}
                      className={`absolute w-5 h-5 rounded-full border-2 transform -translate-x-1/2 -translate-y-1/2 transition-all ${
                        pain
                          ? pain.severity > 6 ? 'bg-red-500 border-red-600 scale-125' : pain.severity > 3 ? 'bg-orange-400 border-orange-500' : 'bg-yellow-400 border-yellow-500'
                          : 'bg-gray-100 border-gray-300 hover:bg-green-100 hover:border-green-400'
                      }`}
                      style={{ left: `${area.x}%`, top: `${area.y}%` }}
                      title={area.label}
                    />
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex justify-center gap-4 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-400" /> Mild</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-400" /> Moderate</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500" /> Severe</span>
              </div>
            </div>

            {/* Pain Detail Editor */}
            {editingPain && (() => {
              const pain = data.pain_areas.find(p => p.area === editingPain);
              if (!pain) return null;
              return (
                <div className="bg-white rounded-xl p-4 shadow-sm border border-orange-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{pain.label}</h3>
                    <button onClick={() => removePainArea(editingPain)} className="text-xs text-red-500 font-medium">Remove</button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">
                        Severity: <span className="text-orange-600 font-bold">{pain.severity}/10</span>
                      </label>
                      <input type="range" min="1" max="10" value={pain.severity}
                        onChange={e => updatePainArea(editingPain, 'severity', parseInt(e.target.value))}
                        className="w-full accent-orange-500" />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Pain Type</label>
                      <div className="flex flex-wrap gap-1.5">
                        {PAIN_TYPES.map(t => (
                          <button key={t} onClick={() => updatePainArea(editingPain, 'type', t)}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${pain.type === t ? 'bg-orange-100 text-orange-700 ring-1 ring-orange-300' : 'bg-gray-100 text-gray-600'}`}>
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Frequency</label>
                      <div className="flex gap-1.5">
                        {FREQUENCIES.map(f => (
                          <button key={f} onClick={() => updatePainArea(editingPain, 'frequency', f)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${pain.frequency === f ? 'bg-orange-100 text-orange-700 ring-1 ring-orange-300' : 'bg-gray-100 text-gray-600'}`}>
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">When does it occur?</label>
                      <div className="flex gap-2">
                        {[['during_activity', 'During Activity'], ['after_activity', 'After Activity'], ['at_rest', 'At Rest']].map(([key, label]) => (
                          <button key={key} onClick={() => updatePainArea(editingPain, key, !pain[key])}
                            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${pain[key] ? 'bg-orange-100 text-orange-700 ring-1 ring-orange-300' : 'bg-gray-100 text-gray-600'}`}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <input type="text" value={pain.notes} onChange={e => updatePainArea(editingPain, 'notes', e.target.value)}
                      className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-1 focus:ring-orange-400" placeholder="Additional notes about this pain..." />

                    <button onClick={() => setEditingPain(null)} className="w-full py-2 bg-green-600 text-white text-sm font-medium rounded-lg">Done</button>
                  </div>
                </div>
              );
            })()}

            {/* Active pain summary */}
            {data.pain_areas.length > 0 && !editingPain && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">{data.pain_areas.length} Area{data.pain_areas.length > 1 ? 's' : ''} Marked</h3>
                <div className="space-y-1.5">
                  {data.pain_areas.map(p => (
                    <button key={p.area} onClick={() => setEditingPain(p.area)}
                      className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${p.severity > 6 ? 'bg-red-500' : p.severity > 3 ? 'bg-orange-400' : 'bg-yellow-400'}`} />
                        <span className="text-sm font-medium text-gray-700">{p.label}</span>
                      </div>
                      <span className="text-xs text-gray-400">{p.type} · {p.frequency}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Injury History */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Injury History</h2>
              <p className="text-gray-500 text-sm">Tell us about any past injuries that may affect your training</p>
            </div>

            {/* Existing injuries */}
            {data.injury_history.map((inj, i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-red-400">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-sm text-gray-900">{inj.body_part}</div>
                    <div className="text-xs text-gray-500">{inj.type}{inj.date ? ` — ${inj.date}` : ''}</div>
                    {inj.still_affects && <span className="text-xs text-red-600 font-medium">Still affects training</span>}
                    {inj.notes && <p className="text-xs text-gray-400 mt-1">{inj.notes}</p>}
                  </div>
                  <button onClick={() => removeInjury(i)} className="text-gray-300 hover:text-red-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            ))}

            {/* Add injury form */}
            <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Add Injury</h3>
              <input type="text" value={newInjury.body_part} onChange={e => setNewInjury(n => ({ ...n, body_part: e.target.value }))}
                className="w-full px-3 py-2.5 border rounded-lg text-sm" placeholder="Body part (e.g. Right Knee)" />
              <div className="flex flex-wrap gap-1.5">
                {INJURY_TYPES.map(t => (
                  <button key={t} onClick={() => setNewInjury(n => ({ ...n, type: t }))}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${newInjury.type === t ? 'bg-red-100 text-red-700 ring-1 ring-red-300' : 'bg-gray-100 text-gray-600'}`}>
                    {t}
                  </button>
                ))}
              </div>
              <input type="text" value={newInjury.date} onChange={e => setNewInjury(n => ({ ...n, date: e.target.value }))}
                className="w-full px-3 py-2.5 border rounded-lg text-sm" placeholder="When? (e.g. March 2025)" />
              <div className="flex gap-2">
                <button onClick={() => setNewInjury(n => ({ ...n, still_affects: !n.still_affects }))}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium ${newInjury.still_affects ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                  {newInjury.still_affects ? 'Still Affects Me' : 'Fully Recovered'}
                </button>
              </div>
              <input type="text" value={newInjury.notes} onChange={e => setNewInjury(n => ({ ...n, notes: e.target.value }))}
                className="w-full px-3 py-2.5 border rounded-lg text-sm" placeholder="Additional notes..." />
              <button onClick={addInjury} disabled={!newInjury.body_part}
                className="w-full py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg disabled:opacity-40">
                Add Injury
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Movement Screening */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Movement Check</h2>
              <p className="text-gray-500 text-sm">Quick movement screening to identify limitations</p>
            </div>

            {[
              { q: 'Can you do a full deep squat (thighs below parallel)?', key: 'can_full_squat', painKey: 'squat_pain_areas', painLabel: 'Where does it hurt during squats?' },
              { q: 'Can you reach both arms fully overhead without pain?', key: 'can_overhead_reach', painKey: 'overhead_pain_areas', painLabel: 'Where is the restriction?' },
              { q: 'Can you balance on one leg for 30 seconds?', key: 'can_single_leg_balance', painKey: 'balance_weaker_side', painLabel: 'Which side is weaker?' },
              { q: 'Can you touch your toes with straight legs?', key: 'can_touch_toes', painKey: 'flexibility_notes', painLabel: 'Describe the limitation' },
            ].map(({ q, key, painKey, painLabel }) => (
              <div key={key} className="bg-white rounded-xl p-4 shadow-sm">
                <p className="font-medium text-sm text-gray-900 mb-3">{q}</p>
                <div className="flex gap-2 mb-2">
                  {[true, false].map(v => (
                    <button key={String(v)} onClick={() => update(key, v)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        data[key] === v
                          ? (v ? 'bg-green-100 text-green-700 ring-1 ring-green-300' : 'bg-red-100 text-red-700 ring-1 ring-red-300')
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                      {v ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>
                {data[key] === false && (
                  <input type="text" value={data[painKey]} onChange={e => update(painKey, e.target.value)}
                    className="w-full text-xs px-3 py-2 border rounded-lg mt-2 focus:ring-1 focus:ring-green-400" placeholder={painLabel} />
                )}
              </div>
            ))}

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="font-medium text-sm text-gray-900 mb-3">Do any of your joints click, pop, or lock?</p>
              <div className="flex gap-2 mb-2">
                {[true, false].map(v => (
                  <button key={String(v)} onClick={() => update('has_clicking_joints', v)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium ${data.has_clicking_joints === v ? (v ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700') : 'bg-gray-100 text-gray-600'}`}>
                    {v ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>
              {data.has_clicking_joints && (
                <input type="text" value={data.clicking_joints_areas} onChange={e => update('clicking_joints_areas', e.target.value)}
                  className="w-full text-xs px-3 py-2 border rounded-lg mt-2" placeholder="Which joints?" />
              )}
            </div>
          </div>
        )}

        {/* Step 4: Training History & Lifestyle */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Training & Lifestyle</h2>
              <p className="text-gray-500 text-sm">Help us understand your training background</p>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Years of Training: <span className="text-green-600 font-bold">{data.years_training}</span></label>
                <input type="range" min="0" max="20" value={data.years_training} onChange={e => update('years_training', parseInt(e.target.value))} className="w-full accent-green-600" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Current sessions/week: <span className="text-green-600 font-bold">{data.current_training_frequency}</span></label>
                <input type="range" min="0" max="7" value={data.current_training_frequency} onChange={e => update('current_training_frequency', parseInt(e.target.value))} className="w-full accent-green-600" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Exercises you avoid (pain/discomfort)</label>
                <textarea value={data.exercises_avoided} onChange={e => update('exercises_avoided', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm resize-none h-16" placeholder="e.g. Barbell back squats, overhead press..." />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Exercises that cause pain</label>
                <textarea value={data.exercises_painful} onChange={e => update('exercises_painful', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm resize-none h-16" placeholder="e.g. Running causes knee pain, deadlifts hurt lower back..." />
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Recovery & Lifestyle</h3>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Avg sleep: <span className="text-green-600 font-bold">{data.sleep_hours_avg}h</span></label>
                <input type="range" min="4" max="12" step="0.5" value={data.sleep_hours_avg} onChange={e => update('sleep_hours_avg', parseFloat(e.target.value))} className="w-full accent-green-600" />
              </div>
              {[['sleep_quality', 'Sleep Quality'], ['stress_level', 'Stress Level'], ['nutrition_quality', 'Nutrition Quality']].map(([key, label]) => (
                <div key={key}>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map(v => (
                      <button key={v} onClick={() => update(key, v)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium ${data[key] === v ? 'bg-green-100 text-green-700 ring-1 ring-green-300' : 'bg-gray-100 text-gray-600'}`}>
                        {v}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 mt-0.5 px-1"><span>Poor</span><span>Excellent</span></div>
                </div>
              ))}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Daily water: <span className="text-green-600 font-bold">{data.hydration_daily_liters}L</span></label>
                <input type="range" min="0.5" max="5" step="0.5" value={data.hydration_daily_liters} onChange={e => update('hydration_daily_liters', parseFloat(e.target.value))} className="w-full accent-green-600" />
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Goals & Equipment */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Goals & Equipment</h2>
              <p className="text-gray-500 text-sm">What do you want to achieve?</p>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block">Primary Goal</label>
                <div className="grid grid-cols-3 gap-2">
                  {GOALS.map(g => (
                    <button key={g} onClick={() => update('primary_fitness_goal', g)}
                      className={`p-2.5 rounded-xl text-xs font-medium text-center transition-all border ${
                        data.primary_fitness_goal === g ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600'
                      }`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block">Secondary Goals (select multiple)</label>
                <div className="flex flex-wrap gap-1.5">
                  {GOALS.filter(g => g !== data.primary_fitness_goal).map(g => (
                    <button key={g} onClick={() => toggleArrayItem('secondary_goals', g)}
                      className={`px-2.5 py-1.5 rounded-full text-xs font-medium ${data.secondary_goals.includes(g) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Preferred workout duration: <span className="text-green-600 font-bold">{data.preferred_workout_duration} min</span></label>
                <input type="range" min="20" max="120" step="10" value={data.preferred_workout_duration} onChange={e => update('preferred_workout_duration', parseInt(e.target.value))} className="w-full accent-green-600" />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block">Available Equipment</label>
                <div className="flex flex-wrap gap-1.5">
                  {EQUIPMENT.map(eq => (
                    <button key={eq} onClick={() => toggleArrayItem('equipment_available', eq)}
                      className={`px-2.5 py-1.5 rounded-full text-xs font-medium ${data.equipment_available.includes(eq) ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                      {eq}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block">Workout Environment</label>
                <div className="grid grid-cols-4 gap-2">
                  {['gym', 'home', 'field', 'mixed'].map(env => (
                    <button key={env} onClick={() => update('workout_environment', env)}
                      className={`py-2 rounded-lg text-xs font-medium capitalize ${data.workout_environment === env ? 'bg-green-100 text-green-700 ring-1 ring-green-300' : 'bg-gray-100 text-gray-600'}`}>
                      {env}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Medical */}
        {step === 6 && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Medical Information</h2>
              <p className="text-gray-500 text-sm">Important for your safety — kept confidential</p>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
              <div>
                <p className="font-medium text-sm text-gray-900 mb-2">Do you have any medical conditions?</p>
                <div className="flex gap-2">
                  {[true, false].map(v => (
                    <button key={String(v)} onClick={() => update('has_medical_conditions', v)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium ${data.has_medical_conditions === v ? (v ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700') : 'bg-gray-100 text-gray-600'}`}>
                      {v ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>
                {data.has_medical_conditions && (
                  <textarea value={data.medical_conditions} onChange={e => update('medical_conditions', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm resize-none h-16 mt-2" placeholder="e.g. Asthma, diabetes, heart condition..." />
                )}
              </div>

              <div>
                <p className="font-medium text-sm text-gray-900 mb-2">Are you currently taking any medications?</p>
                <div className="flex gap-2">
                  {[true, false].map(v => (
                    <button key={String(v)} onClick={() => update('takes_medications', v)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium ${data.takes_medications === v ? (v ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700') : 'bg-gray-100 text-gray-600'}`}>
                      {v ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>
                {data.takes_medications && (
                  <textarea value={data.medications} onChange={e => update('medications', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm resize-none h-16 mt-2" placeholder="List your medications..." />
                )}
              </div>

              <div>
                <p className="font-medium text-sm text-gray-900 mb-2">Do you have doctor's clearance for exercise?</p>
                <div className="flex gap-2">
                  {[true, false].map(v => (
                    <button key={String(v)} onClick={() => update('doctor_clearance', v)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium ${data.doctor_clearance === v ? (v ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700') : 'bg-gray-100 text-gray-600'}`}>
                      {v ? 'Yes' : 'Not Yet'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <h3 className="font-semibold text-green-800 text-sm mb-2">Assessment Summary</h3>
              <div className="text-xs text-green-700 space-y-1">
                <p>{data.pain_areas.length} pain area{data.pain_areas.length !== 1 ? 's' : ''} identified</p>
                <p>{data.injury_history.length} past injur{data.injury_history.length !== 1 ? 'ies' : 'y'}</p>
                <p>Goal: {data.primary_fitness_goal || 'Not set'}</p>
                <p>Environment: {data.workout_environment}, {data.preferred_workout_duration}min sessions</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-30">
        <div className="max-w-2xl mx-auto flex gap-3">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)} className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200">Back</button>
          )}
          {step < totalSteps ? (
            <button onClick={() => { setEditingPain(null); setStep(s => s + 1); }}
              className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg">Next</button>
          ) : (
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg disabled:opacity-50">
              Generate My Exercise Plan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
