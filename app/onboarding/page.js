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
const GOALS = [
  { id: 'speed', icon: '&#9889;', label: 'Get Faster' },
  { id: 'strength', icon: '&#128170;', label: 'Build Strength' },
  { id: 'endurance', icon: '&#128168;', label: 'Boost Endurance' },
  { id: 'agility', icon: '&#127939;', label: 'Improve Agility' },
  { id: 'recovery', icon: '&#128154;', label: 'Better Recovery' },
  { id: 'overall', icon: '&#9917;', label: 'Overall Fitness' },
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
          <div className="text-7xl mb-6 animate-spin" style={{ animationDuration: '2s' }}>&#9917;</div>
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
                    { id: 'morning', label: 'Morning', icon: '&#127749;' },
                    { id: 'afternoon', label: 'Afternoon', icon: '&#9728;&#65039;' },
                    { id: 'evening', label: 'Evening', icon: '&#127769;' },
                  ].map(t => (
                    <button key={t.id} onClick={() => update('preferred_time', t.id)}
                      className={`p-4 rounded-xl text-center transition-all border-2 ${
                        data.preferred_time === t.id ? 'border-green-500 bg-green-50' : 'border-gray-200'
                      }`}>
                      <div className="text-2xl mb-1" dangerouslySetInnerHTML={{ __html: t.icon }} />
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
                      <div className="text-2xl mb-1" dangerouslySetInnerHTML={{ __html: g.icon }} />
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
