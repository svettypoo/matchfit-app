'use client';
import { useState } from 'react';

const questions = [
  { key: 'sleep_quality', label: 'Sleep Quality', emojis: ['\u{1F634}', '\u{1F612}', '\u{1F610}', '\u{1F60A}', '\u{1F31F}'] },
  { key: 'energy_level', label: 'Energy Level', emojis: ['\u{1FAB6}', '\u{1F50B}', '\u{26A1}', '\u{1F525}', '\u{1F680}'] },
  { key: 'muscle_soreness', label: 'Muscle Soreness', emojis: ['\u{2705}', '\u{1F44D}', '\u{1F615}', '\u{1F629}', '\u{1F975}'] },
  { key: 'mood', label: 'Mood', emojis: ['\u{1F622}', '\u{1F641}', '\u{1F610}', '\u{1F642}', '\u{1F604}'] },
  { key: 'stress', label: 'Stress Level', emojis: ['\u{1F607}', '\u{1F60C}', '\u{1F610}', '\u{1F630}', '\u{1F4A5}'] },
];

export default function WellnessModal({ playerId, onClose, onComplete }) {
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const allAnswered = questions.every(q => answers[q.key]);

  async function handleSubmit() {
    if (!allAnswered) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/wellness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: playerId, ...answers }),
      });
      const data = await res.json();
      setResult(data);
      if (onComplete) onComplete(data);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    const score = result.readiness_score || 0;
    const color = score >= 70 ? 'text-green-600' : score >= 40 ? 'text-amber-600' : 'text-red-600';
    const message = score >= 70 ? 'You\'re ready to crush it!' : score >= 40 ? 'Listen to your body today.' : 'Consider a recovery day.';

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
        <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-6 animate-slide-up text-center">
          <div className={`text-6xl mb-3 ${color}`}>{score >= 70 ? '\u{1F4AA}' : score >= 40 ? '\u{1F615}' : '\u{1F634}'}</div>
          <h2 className="text-2xl font-bold text-gray-800">Readiness: <span className={color}>{score}</span></h2>
          <p className="text-gray-500 mt-2">{message}</p>
          <p className="text-xs text-green-600 mt-1">+10 XP earned!</p>
          <button onClick={onClose} className="mt-4 w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700">
            Got It
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">How are you feeling?</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>
        <div className="space-y-4">
          {questions.map(q => (
            <div key={q.key}>
              <label className="text-sm font-medium text-gray-600 block mb-2">{q.label}</label>
              <div className="flex gap-2">
                {q.emojis.map((emoji, i) => (
                  <button
                    key={i}
                    onClick={() => setAnswers(a => ({ ...a, [q.key]: i + 1 }))}
                    className={`flex-1 text-2xl py-2 rounded-lg transition-all ${
                      answers[q.key] === i + 1
                        ? 'bg-green-100 ring-2 ring-green-500 scale-110'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={handleSubmit}
          disabled={!allAnswered || submitting}
          className="mt-6 w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting...' : 'Submit Check-In'}
        </button>
      </div>
    </div>
  );
}
