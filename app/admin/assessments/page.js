'use client';

import { useState, useEffect } from 'react';

const RISK_COLORS = { low: 'bg-green-100 text-green-700', moderate: 'bg-yellow-100 text-yellow-700', high: 'bg-red-100 text-red-700' };
const BODY_AREAS = ['Head/Neck','Left Shoulder','Right Shoulder','Upper Back','Lower Back','Left Elbow','Right Elbow','Left Wrist','Right Wrist','Chest','Abdomen','Left Hip','Right Hip','Left Knee','Right Knee','Left Ankle','Right Ankle','Left Foot','Right Foot','Left Thigh','Right Thigh','Left Calf','Right Calf','Groin'];

export default function CoachAssessmentsPage() {
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [questionnaire, setQuestionnaire] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    risk_level: 'low',
    movement_notes: '',
    injury_concerns: '',
    recommended_modifications: '',
    exercises_to_avoid: '',
    exercises_to_prioritize: '',
    special_instructions: '',
    intensity_override: 'normal',
    approved: false,
  });

  useEffect(() => {
    loadPlayers();
  }, []);

  async function loadPlayers() {
    try {
      const coach = JSON.parse(localStorage.getItem('mf_user') || '{}');
      const res = await fetch(`/api/teams?coach_id=${coach.id}`);
      if (!res.ok) return;
      const data = await res.json();
      const allPlayers = [];
      for (const team of (data.teams || [])) {
        const pRes = await fetch(`/api/teams/${team.id}/players`);
        if (pRes.ok) {
          const pData = await pRes.json();
          (pData.players || pData || []).forEach(p => {
            if (!allPlayers.find(x => x.id === p.id)) allPlayers.push({ ...p, team_name: team.name });
          });
        }
      }
      setPlayers(allPlayers);
    } catch (err) {
      console.error('Load players error:', err);
    }
    setLoading(false);
  }

  async function selectPlayer(player) {
    setSelectedPlayer(player);
    setQuestionnaire(null);
    setFeedback(null);

    try {
      const [qRes, fbRes] = await Promise.all([
        fetch(`/api/questionnaire?player_id=${player.id}`),
        fetch(`/api/coach-feedback?player_id=${player.id}`),
      ]);

      if (qRes.ok) {
        const q = await qRes.json();
        setQuestionnaire(q);
      }
      if (fbRes.ok) {
        const fb = await fbRes.json();
        if (fb) {
          setFeedback(fb);
          setFeedbackForm({
            risk_level: fb.risk_level || 'low',
            movement_notes: fb.movement_notes || '',
            injury_concerns: fb.injury_concerns || '',
            recommended_modifications: fb.recommended_modifications || '',
            exercises_to_avoid: (fb.exercises_to_avoid || []).join(', '),
            exercises_to_prioritize: (fb.exercises_to_prioritize || []).join(', '),
            special_instructions: fb.special_instructions || '',
            intensity_override: fb.intensity_override || 'normal',
            approved: fb.approved || false,
          });
        } else {
          setFeedbackForm({
            risk_level: 'low', movement_notes: '', injury_concerns: '',
            recommended_modifications: '', exercises_to_avoid: '', exercises_to_prioritize: '',
            special_instructions: '', intensity_override: 'normal', approved: false,
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function saveFeedback() {
    if (!questionnaire || saving) return;
    setSaving(true);
    try {
      const coach = JSON.parse(localStorage.getItem('mf_user') || '{}');
      const res = await fetch('/api/coach-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionnaire_id: questionnaire.id,
          coach_id: coach.id,
          risk_level: feedbackForm.risk_level,
          movement_notes: feedbackForm.movement_notes,
          injury_concerns: feedbackForm.injury_concerns,
          recommended_modifications: feedbackForm.recommended_modifications,
          exercises_to_avoid: feedbackForm.exercises_to_avoid.split(',').map(s => s.trim()).filter(Boolean),
          exercises_to_prioritize: feedbackForm.exercises_to_prioritize.split(',').map(s => s.trim()).filter(Boolean),
          special_instructions: feedbackForm.special_instructions,
          intensity_override: feedbackForm.intensity_override,
          approved: feedbackForm.approved,
          approved_at: feedbackForm.approved ? new Date().toISOString() : null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setFeedback(data);
      }
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  }

  async function generatePlan() {
    if (!selectedPlayer || generating) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/exercise-plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: selectedPlayer.id }),
      });
      if (res.ok) {
        alert('Exercise plan generated successfully!');
      } else {
        const err = await res.json();
        alert('Error generating plan: ' + (err.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setGenerating(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <svg className="w-8 h-8 animate-spin text-green-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Player Assessments</h1>
          <p className="text-sm text-gray-500 mt-1">Review questionnaires, add feedback, generate exercise plans</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Player List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-800 text-sm">Players</h2>
          </div>
          <div className="divide-y max-h-[70vh] overflow-y-auto">
            {players.length === 0 && (
              <div className="p-6 text-center text-gray-400 text-sm">No players found</div>
            )}
            {players.map(p => (
              <button key={p.id} onClick={() => selectPlayer(p)}
                className={`w-full text-left px-4 py-3 hover:bg-green-50 transition-colors ${selectedPlayer?.id === p.id ? 'bg-green-50 border-l-4 border-green-500' : ''}`}>
                <div className="font-medium text-gray-900 text-sm">{p.name}</div>
                <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                  <span>{p.team_name}</span>
                  {p.position?.length > 0 && <span>· {p.position.join(', ')}</span>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Questionnaire Review + Feedback */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedPlayer ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
              <p className="text-gray-500">Select a player to review their assessment</p>
            </div>
          ) : !questionnaire ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <svg className="w-12 h-12 mx-auto text-amber-300 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
              <p className="text-gray-700 font-medium">{selectedPlayer.name}</p>
              <p className="text-gray-500 text-sm mt-1">No questionnaire submitted yet</p>
            </div>
          ) : (
            <>
              {/* Questionnaire Summary */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-800">{selectedPlayer.name}'s Assessment</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Completed {new Date(questionnaire.completed_at || questionnaire.created_at).toLocaleDateString()}</p>
                  </div>
                  <button onClick={generatePlan} disabled={generating}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                    {generating ? (
                      <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Generating...</>
                    ) : (
                      <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg> Generate Plan</>
                    )}
                  </button>
                </div>

                <div className="p-4 space-y-5">
                  {/* Pain Areas */}
                  {(questionnaire.pain_areas || []).length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                        <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                        Pain Areas
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {questionnaire.pain_areas.map((pa, i) => (
                          <div key={i} className="bg-red-50 rounded-lg p-3 border border-red-100">
                            <div className="font-medium text-red-800 text-sm">{pa.area}</div>
                            <div className="text-xs text-red-600 mt-1 space-x-2">
                              <span>Severity: {pa.severity}/10</span>
                              <span>Type: {pa.painType}</span>
                              <span>Freq: {pa.frequency}</span>
                              {pa.timing && <span>When: {pa.timing}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Injury History */}
                  {(questionnaire.injury_history || []).length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Injury History</h3>
                      <div className="space-y-2">
                        {questionnaire.injury_history.map((inj, i) => (
                          <div key={i} className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                            <div className="font-medium text-amber-800 text-sm">{inj.type} — {inj.area}</div>
                            <div className="text-xs text-amber-600 mt-1">
                              {inj.date && <span>Date: {inj.date} · </span>}
                              <span>Recovery: {inj.recoveryStatus}</span>
                              {inj.notes && <span> · {inj.notes}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Movement Screening */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Movement Screening</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { label: 'Full Squat', val: questionnaire.can_full_squat, note: questionnaire.squat_pain_areas },
                        { label: 'Overhead Reach', val: questionnaire.can_overhead_reach, note: questionnaire.overhead_pain_areas },
                        { label: 'Single Leg Balance', val: questionnaire.can_single_leg_balance, note: questionnaire.balance_weaker_side },
                        { label: 'Touch Toes', val: questionnaire.can_touch_toes, note: questionnaire.flexibility_notes },
                      ].map(m => (
                        <div key={m.label} className={`rounded-lg p-3 text-center border ${m.val ? 'bg-green-50 border-green-200' : m.val === false ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                          <div className="text-lg mb-0.5">{m.val ? '✓' : m.val === false ? '✗' : '—'}</div>
                          <div className="text-xs font-medium text-gray-700">{m.label}</div>
                          {m.note && <div className="text-[10px] text-gray-500 mt-1">{m.note}</div>}
                        </div>
                      ))}
                    </div>
                    {questionnaire.has_clicking_joints && (
                      <div className="mt-2 bg-yellow-50 rounded-lg px-3 py-2 text-xs text-yellow-700 border border-yellow-200">
                        Clicking joints: {questionnaire.clicking_joints_areas}
                      </div>
                    )}
                  </div>

                  {/* Training & Lifestyle */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Training & Lifestyle</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Experience', value: `${questionnaire.years_training || 0} yrs` },
                        { label: 'Frequency', value: `${questionnaire.current_training_frequency || 3}x/wk` },
                        { label: 'Sleep', value: `${questionnaire.sleep_hours_avg || 7.5}h (${questionnaire.sleep_quality || 3}/5)` },
                        { label: 'Stress', value: `${questionnaire.stress_level || 3}/5` },
                        { label: 'Nutrition', value: `${questionnaire.nutrition_quality || 3}/5` },
                        { label: 'Hydration', value: `${questionnaire.hydration_daily_liters || 2}L/day` },
                        { label: 'Duration Pref', value: `${questionnaire.preferred_workout_duration || 60} min` },
                        { label: 'Environment', value: questionnaire.workout_environment || 'gym' },
                      ].map(s => (
                        <div key={s.label} className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                          <div className="text-xs text-gray-500">{s.label}</div>
                          <div className="text-sm font-semibold text-gray-800">{s.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Goals */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Goals & Equipment</h3>
                    <div className="space-y-2">
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <span className="text-xs text-blue-600">Primary Goal:</span>
                        <span className="ml-2 text-sm font-medium text-blue-800">{questionnaire.primary_fitness_goal || 'Not specified'}</span>
                      </div>
                      {questionnaire.secondary_goals?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {questionnaire.secondary_goals.map((g, i) => (
                            <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">{g}</span>
                          ))}
                        </div>
                      )}
                      {questionnaire.equipment_available?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs text-gray-500 mr-1">Equipment:</span>
                          {questionnaire.equipment_available.map((e, i) => (
                            <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{e}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Exercises avoided/painful */}
                  {(questionnaire.exercises_avoided || questionnaire.exercises_painful) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {questionnaire.exercises_avoided && (
                        <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                          <div className="text-xs text-orange-600 font-medium mb-1">Exercises Avoided</div>
                          <div className="text-sm text-orange-800">{questionnaire.exercises_avoided}</div>
                        </div>
                      )}
                      {questionnaire.exercises_painful && (
                        <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                          <div className="text-xs text-red-600 font-medium mb-1">Exercises Causing Pain</div>
                          <div className="text-sm text-red-800">{questionnaire.exercises_painful}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Medical */}
                  {(questionnaire.has_medical_conditions || questionnaire.takes_medications) && (
                    <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                      <h3 className="text-xs font-semibold text-purple-700 mb-1">Medical Information</h3>
                      {questionnaire.has_medical_conditions && (
                        <div className="text-sm text-purple-800">Conditions: {questionnaire.medical_conditions}</div>
                      )}
                      {questionnaire.takes_medications && (
                        <div className="text-sm text-purple-800">Medications: {questionnaire.medications}</div>
                      )}
                      <div className="text-xs text-purple-600 mt-1">Doctor clearance: {questionnaire.doctor_clearance ? 'Yes' : 'No'}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Coach Feedback Form */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b bg-gray-50">
                  <h2 className="font-semibold text-gray-800">Coach Feedback</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {feedback ? `Last updated ${new Date(feedback.updated_at || feedback.created_at).toLocaleDateString()}` : 'Add your professional assessment'}
                  </p>
                </div>

                <div className="p-4 space-y-4">
                  {/* Risk Level */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Risk Level</label>
                    <div className="flex gap-2">
                      {['low', 'moderate', 'high'].map(level => (
                        <button key={level} onClick={() => setFeedbackForm(f => ({ ...f, risk_level: level }))}
                          className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${feedbackForm.risk_level === level ? RISK_COLORS[level] + ' ring-2 ring-offset-1' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Text Fields */}
                  {[
                    { key: 'movement_notes', label: 'Movement Notes', placeholder: 'Observations about movement quality, imbalances, compensations...' },
                    { key: 'injury_concerns', label: 'Injury Concerns', placeholder: 'Specific concerns based on questionnaire responses...' },
                    { key: 'recommended_modifications', label: 'Recommended Modifications', placeholder: 'Exercise modifications to accommodate limitations...' },
                    { key: 'special_instructions', label: 'Special Instructions', placeholder: 'Any additional instructions for plan generation...' },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="text-sm font-medium text-gray-700 block mb-1.5">{field.label}</label>
                      <textarea
                        value={feedbackForm[field.key]}
                        onChange={e => setFeedbackForm(f => ({ ...f, [field.key]: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none h-20"
                        placeholder={field.placeholder}
                      />
                    </div>
                  ))}

                  {/* Exercises to avoid/prioritize */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1.5">Exercises to Avoid</label>
                      <input
                        type="text"
                        value={feedbackForm.exercises_to_avoid}
                        onChange={e => setFeedbackForm(f => ({ ...f, exercises_to_avoid: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Comma separated..."
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1.5">Exercises to Prioritize</label>
                      <input
                        type="text"
                        value={feedbackForm.exercises_to_prioritize}
                        onChange={e => setFeedbackForm(f => ({ ...f, exercises_to_prioritize: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Comma separated..."
                      />
                    </div>
                  </div>

                  {/* Intensity Override */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Intensity Override</label>
                    <div className="flex gap-2">
                      {['reduced', 'normal', 'elevated'].map(level => (
                        <button key={level} onClick={() => setFeedbackForm(f => ({ ...f, intensity_override: level }))}
                          className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${feedbackForm.intensity_override === level ? 'bg-green-100 text-green-700 ring-2 ring-green-300 ring-offset-1' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Approve */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => setFeedbackForm(f => ({ ...f, approved: !f.approved }))}
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${feedbackForm.approved ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}`}>
                      {feedbackForm.approved && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                    </button>
                    <span className="text-sm text-gray-700 font-medium">Approve for plan generation</span>
                  </div>

                  {/* Save + Generate */}
                  <div className="flex gap-3 pt-2">
                    <button onClick={saveFeedback} disabled={saving}
                      className="flex-1 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm">
                      {saving ? 'Saving...' : feedback ? 'Update Feedback' : 'Save Feedback'}
                    </button>
                    <button onClick={generatePlan} disabled={generating || !feedbackForm.approved}
                      className="flex-1 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm flex items-center justify-center gap-2">
                      {generating ? (
                        <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Generating...</>
                      ) : (
                        <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg> Generate AI Plan</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
