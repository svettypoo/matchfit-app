'use client';

import { useState, useEffect } from 'react';
import BottomNav from '../../../components/BottomNav';
import SimpleChart from '../../../components/SimpleChart';

const QUOTES = [
  "Success is no accident. It is hard work, perseverance, learning, studying, sacrifice and most of all, love of what you are doing. - Pele",
  "The more difficult the victory, the greater the happiness in winning. - Pele",
  "I learned all about life with a ball at my feet. - Ronaldinho",
  "You have to fight to reach your dream. You have to sacrifice and work hard for it. - Lionel Messi",
  "I am not a perfectionist, but I like to feel that things are done well. - Cristiano Ronaldo",
  "The ball is round, the game lasts 90 minutes, and everything else is just theory. - Sepp Herberger",
  "Some people think football is a matter of life and death. It's much more important than that. - Bill Shankly",
  "The secret is to believe in your dreams. - Zinedine Zidane",
  "If you do not believe you can do it then you have no chance at all. - Arsene Wenger",
  "A champion is someone who does not settle for that day's practice. - Mia Hamm",
  "Every disadvantage has its advantage. - Johan Cruyff",
  "It's not about the name on the back of the jersey, it's about the badge on the front. - David Beckham",
  "You eat, sleep and drink football. It becomes like breathing. - Thierry Henry",
  "In football, the worst blindness is seeing only the ball. - Nelson Falcao",
  "It took me 17 years and 114 days to become an overnight success. - Lionel Messi",
  "Work hard in silence, let success be your noise. - Frank Lampard",
  "Without sacrifice, you'll never accomplish anything. - Kylian Mbappe",
  "Football is a simple game. Twenty-two men chase a ball for 90 minutes. - Gary Lineker",
  "Talent without working hard is nothing. - Cristiano Ronaldo",
  "The harder you work, the luckier you get. - Gary Player",
];

export default function ProgressPage() {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const user = JSON.parse(localStorage.getItem('mf_user') || '{}');
      try {
        const res = await fetch(`/api/players/${user.id}/progress`);
        if (res.ok) {
          const data = await res.json();
          setProgress(data);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, []);

  const compliance = progress?.compliance || 0;
  const weeklyData = progress?.weekly || [];
  const wellnessTrend = progress?.wellness_trend || [];
  const prs = progress?.personal_records || [];
  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-green-600" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b px-4 py-3">
        <h1 className="font-bold text-lg text-gray-900">Progress</h1>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Compliance Circle */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
          <h3 className="font-semibold text-gray-700 mb-4">Overall Compliance</h3>
          <div className="relative w-32 h-32 mx-auto">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="8" />
              <circle cx="60" cy="60" r="54" fill="none" stroke="#22c55e" strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 54}`}
                strokeDashoffset={`${2 * Math.PI * 54 * (1 - compliance / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold text-gray-900">{compliance}%</span>
            </div>
          </div>
        </div>

        {/* Weekly Chart */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-3">This Week</h3>
          <SimpleChart
            data={weeklyData.length ? weeklyData : [
              { label: 'Mon', value: 1 }, { label: 'Tue', value: 1 },
              { label: 'Wed', value: 0 }, { label: 'Thu', value: 1 },
              { label: 'Fri', value: 0 }, { label: 'Sat', value: 0 },
              { label: 'Sun', value: 0 },
            ]}
            type="bar"
            color="#22c55e"
          />
        </div>

        {/* Wellness Trend */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-3">Wellness Trend (7 days)</h3>
          <SimpleChart
            data={wellnessTrend.length ? wellnessTrend : [
              { label: 'M', value: 70 }, { label: 'T', value: 65 },
              { label: 'W', value: 80 }, { label: 'T', value: 75 },
              { label: 'F', value: 85 }, { label: 'S', value: 72 },
              { label: 'S', value: 78 },
            ]}
            type="line"
            color="#22c55e"
            maxValue={100}
          />
        </div>

        {/* Personal Records */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-3">Personal Records</h3>
          {prs.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Complete workouts to set personal records</p>
          ) : (
            <div className="space-y-2">
              {prs.map((pr, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <div className="font-medium text-sm text-gray-900">{pr.exercise}</div>
                    <div className="text-xs text-gray-400">{new Date(pr.date).toLocaleDateString()}</div>
                  </div>
                  <div className="font-bold text-green-600">{pr.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Motivational Quote */}
        <div className="bg-green-50 rounded-xl p-4 border border-green-200 text-center">
          <svg className="w-6 h-6 text-green-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" /></svg>
          <p className="text-sm text-green-800 italic">"{quote}"</p>
        </div>
      </div>

      <BottomNav active="home" />
    </div>
  );
}
