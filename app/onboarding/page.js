'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const POSITIONS = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST', 'CF'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TANNER_DESC = [
  'Pre-pubertal (no signs)',
  'Early puberty begins',
  'Mid-puberty (growth spurt likely)',
  'Late puberty (near adult)',
  'Fully mature',
];
const BODY_PARTS = ['Ankle', 'Knee', 'Hip', 'Hamstring', 'Quad', 'Groin', 'Back', 'Shoulder', 'Wrist', 'ACL'];
const GOAL_ICONS = {
  speed: <svg className="w-7 h-7 mx-auto" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" /></svg>,
  strength: <svg className="w-7 h-7 mx-auto" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" /></svg>,
  endurance: <svg className="w-7 h-7 mx-auto" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>,
  agility: <svg className="w-7 h-7 mx-auto" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>,
  recovery: <svg className="w-7 h-7 mx-auto" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>,
  overall: <svg className="w-7 h-7 mx-auto" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg>,
};
const GOALS = [
  { id: 'speed', label: 'Get Faster' },
  { id: 'strength', label: 'Build Strength' },
  { id: 'endurance', label: 'Boost Endurance' },
  { id: 'agility', label: 'Improve Agility' },
  { id: 'recovery', label: 'Better Recovery' },
  { id: 'overall', label: 'Overall Fitness' },
];
const MOTIVATIONS = ['Make the team', 'Get a scholarship', 'Stay healthy', 'Improve performance', 'Have fun'];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [data, setData] = useState({
    dob: '', height: '', weight: '', sitting_height: '', gender: 'male', positions: [],
    tanner_stage: 3, parent_height_father: '', parent_height_mother: '', growth_spurt: false, injuries: [],
    training_days_week: 4, other_sports: '', fitness_level: 'intermediate', test_scores: '',
    available_days: [], preferred_time: 'afternoon', hours_per_day: 1.5, commitments: '',
    primary_goal: '', target_position: '', dream_club: '', motivation: '',
  });

  function update(key, val) {
    setData(d => ({ ...d, [key]: val }));
  }

  function toggleArray(key, val) {
    setData(d => ({
      ...d,
      [key]: d[key].includes(val) ? d[key].filter(v => v !== val) : [...d[key], val],
    }));
  }

  async function handleFinish() {
    setGenerating(true);
    try {
      const user = JSON.parse(localStorage.getItem('mf_user') || '{}');
      await fetch(`/api/players/${user.id}/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await fetch('/api/generate-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: user.id }),
      });
      setTimeout(() => router.push('/dashboard'), 3000);
    } catch {
      setGenerating(false);
    }
  }

  if (generating) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="text-center animate-bounce-in">
          <svg className="animate-spin h-16 w-16 text-green-600 mx-auto mb-6" style={{ animationDuration: '2s' }} viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Creating Your Personalized Program</h2>
          <p className="text-gray-500">Analyzing your profile and building the perfect training plan...</p>
          <div className="mt-6 flex justify-center gap-1">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-3 h-3 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Bar */}
      <div className="sticky top-0 bg-white border-b z-10 px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Step {step} of 5</span>
            <span className="text-sm text-gray-400">{step * 20}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${step * 20}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 pb-24">
        {/* Step 1: Physical Profile */}
        {step === 1 && (
          <div className="animate-slide-up space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Physical Profile</h2>
              <p className="text-gray-500">Help us understand your body composition</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input type="date" value={data.dob} onChange={e => update('dob', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                  <input type="number" value={data.height} onChange={e => update('height', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none" placeholder="175" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                  <input type="number" value={data.weight} onChange={e => update('weight', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none" placeholder="70" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sitting Height (cm)</label>
                <input type="number" value={data.sitting_height} onChange={e => update('sitting_height', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none" placeholder="90" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <div className="flex gap-3">
                  {['male', 'female'].map(g => (
                    <button key={g} onClick={() => update('gender', g)}
                      className={`flex-1 py-3 rounded-lg font-medium capitalize transition-all ${
                        data.gender === g ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Positions</label>
                <div className="flex flex-wrap gap-2">
                  {POSITIONS.map(pos => (
                    <button key={pos} onClick={() => toggleArray('positions', pos)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        data.positions.includes(pos)
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}>
                      {pos}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Growth & Maturation */}
        {step === 2 && (
          <div className="animate-slide-up space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Growth & Maturation</h2>
              <p className="text-gray-500">Important for age-appropriate programming</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanner Stage (1-5): <span className="text-green-600 font-bold">{data.tanner_stage}</span>
                </label>
                <input type="range" min="1" max="5" value={data.tanner_stage}
                  onChange={e => update('tanner_stage', parseInt(e.target.value))}
                  className="w-full accent-green-600" />
                <p className="text-sm text-gray-500 mt-1">{TANNER_DESC[data.tanner_stage - 1]}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Father's Height (cm)</label>
                  <input type="number" value={data.parent_height_father} onChange={e => update('parent_height_father', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none" placeholder="180" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mother's Height (cm)</label>
                  <input type="number" value={data.parent_height_mother} onChange={e => update('parent_height_mother', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none" placeholder="165" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currently experiencing a growth spurt?
                </label>
                <div className="flex gap-3">
                  {[true, false].map(v => (
                    <button key={String(v)} onClick={() => update('growth_spurt', v)}
                      className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                        data.growth_spurt === v ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                      {v ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Previous/Current Injuries</label>
                <div className="flex flex-wrap gap-2">
                  {BODY_PARTS.map(part => (
                    <button key={part} onClick={() => toggleArray('injuries', part)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        data.injuries.includes(part) ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                      {part}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Training Background */}
        {step === 3 && (
          <div className="animate-slide-up space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Training Background</h2>
              <p className="text-gray-500">Tell us about your current activity</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Training days/week: <span className="text-green-600 font-bold">{data.training_days_week}</span>
                </label>
                <input type="range" min="1" max="7" value={data.training_days_week}
                  onChange={e => update('training_days_week', parseInt(e.target.value))}
                  className="w-full accent-green-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Other Sports</label>
                <input type="text" value={data.other_sports} onChange={e => update('other_sports', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="Basketball, Swimming, etc." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fitness Level</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'beginner', label: 'Beginner', desc: 'Just starting out' },
                    { id: 'intermediate', label: 'Intermediate', desc: 'Regular training' },
                    { id: 'advanced', label: 'Advanced', desc: 'Competitive athlete' },
                  ].map(l => (
                    <button key={l.id} onClick={() => update('fitness_level', l.id)}
                      className={`p-4 rounded-xl text-center transition-all border-2 ${
                        data.fitness_level === l.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      <div className="font-semibold text-sm">{l.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{l.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Test Scores (optional)</label>
                <textarea value={data.test_scores} onChange={e => update('test_scores', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none resize-none h-20"
                  placeholder="e.g. Yo-Yo IR1: Level 18, 40m sprint: 5.2s" />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Availability */}
        {step === 4 && (
          <div className="animate-slide-up space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Availability</h2>
              <p className="text-gray-500">When can you train?</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Available Days</label>
                <div className="flex gap-2">
                  {DAYS.map(d => (
                    <button key={d} onClick={() => toggleArray('available_days', d)}
                      className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${
                        data.available_days.includes(d)
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Time</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'morning', label: 'Morning', icon: <svg className="w-7 h-7 mx-auto" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" /></svg> },
                    { id: 'afternoon', label: 'Afternoon', icon: <svg className="w-7 h-7 mx-auto" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" /></svg> },
                    { id: 'evening', label: 'Evening', icon: <svg className="w-7 h-7 mx-auto" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" /></svg> },
                  ].map(t => (
                    <button key={t.id} onClick={() => update('preferred_time', t.id)}
                      className={`p-4 rounded-xl text-center transition-all border-2 ${
                        data.preferred_time === t.id ? 'border-green-500 bg-green-50' : 'border-gray-200'
                      }`}>
                      <div className="mb-1">{t.icon}</div>
                      <div className="text-sm font-medium">{t.label}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hours per day: <span className="text-green-600 font-bold">{data.hours_per_day}h</span>
                </label>
                <input type="range" min="0.5" max="3" step="0.5" value={data.hours_per_day}
                  onChange={e => update('hours_per_day', parseFloat(e.target.value))}
                  className="w-full accent-green-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Other Commitments</label>
                <textarea value={data.commitments} onChange={e => update('commitments', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none resize-none h-20"
                  placeholder="School, work, other team practices..." />
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Goals */}
        {step === 5 && (
          <div className="animate-slide-up space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Your Goals</h2>
              <p className="text-gray-500">What are you training for?</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Goal</label>
                <div className="grid grid-cols-2 gap-3">
                  {GOALS.map(g => (
                    <button key={g.id} onClick={() => update('primary_goal', g.id)}
                      className={`p-4 rounded-xl text-center transition-all border-2 ${
                        data.primary_goal === g.id ? 'border-green-500 bg-green-50' : 'border-gray-200'
                      }`}>
                      <div className="mb-1">{GOAL_ICONS[g.id]}</div>
                      <div className="text-sm font-medium">{g.label}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Position</label>
                <input type="text" value={data.target_position} onChange={e => update('target_position', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="e.g. Central Midfielder" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dream Club</label>
                <input type="text" value={data.dream_club} onChange={e => update('dream_club', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="e.g. FC Barcelona" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">What Motivates You?</label>
                <div className="flex flex-wrap gap-2">
                  {MOTIVATIONS.map(m => (
                    <button key={m} onClick={() => update('motivation', m)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        data.motivation === m ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="max-w-2xl mx-auto flex gap-3">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)}
              className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all">
              Back
            </button>
          )}
          {step < 5 ? (
            <button onClick={() => setStep(s => s + 1)}
              className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all">
              Next
            </button>
          ) : (
            <button onClick={handleFinish}
              className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all">
              Generate My Program
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
