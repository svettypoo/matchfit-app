'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const STEPS = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'team', label: 'Create Team' },
  { id: 'invite', label: 'Invite Athletes' },
  { id: 'program', label: 'Choose Program' },
  { id: 'assign', label: 'Assign Program' },
  { id: 'done', label: 'All Set!' },
];

const AGE_GROUPS = ['U12', 'U14', 'U16', 'U18', 'Senior'];
const SPORT_TYPES = ['Soccer/Football', 'Basketball', 'Rugby', 'Hockey', 'Track & Field', 'Other'];

const TEMPLATES = [
  {
    id: 'preseason-strength',
    name: 'Pre-Season Strength',
    description: 'Build a solid foundation before the season kicks off. Focus on compound lifts, core stability, and explosive power.',
    duration: '6 weeks',
    days: 4,
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
      </svg>
    ),
    color: 'from-orange-500 to-red-500',
  },
  {
    id: 'inseason-maintenance',
    name: 'In-Season Maintenance',
    description: 'Stay sharp during the season. Lower volume, higher intensity — maintain gains without overtraining.',
    duration: 'Ongoing',
    days: 2,
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
      </svg>
    ),
    color: 'from-green-500 to-emerald-600',
  },
  {
    id: 'recovery-week',
    name: 'Recovery Week',
    description: 'Active recovery between intense training blocks. Mobility, foam rolling, light cardio, and stretching.',
    duration: '1 week',
    days: 5,
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
      </svg>
    ),
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'speed-agility',
    name: 'Speed & Agility',
    description: 'Get quicker on the pitch. Sprint drills, ladder work, cone patterns, and reaction training.',
    duration: '4 weeks',
    days: 3,
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
      </svg>
    ),
    color: 'from-purple-500 to-indigo-600',
  },
];

function generateJoinCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function ConfettiCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#22c55e', '#16a34a', '#facc15', '#eab308', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316'];

    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        w: Math.random() * 10 + 5,
        h: Math.random() * 6 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 3 + 2,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
      });
    }

    let animId;
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.vy += 0.05;
        if (p.y > canvas.height) p.opacity -= 0.02;
        if (p.opacity <= 0) continue;
        alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (alive) animId = requestAnimationFrame(animate);
    }
    animate();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}

export default function CoachOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Step 2: Team data
  const [teamName, setTeamName] = useState('');
  const [ageGroup, setAgeGroup] = useState('U16');
  const [sportType, setSportType] = useState('Soccer/Football');
  const [seasonStart, setSeasonStart] = useState('');
  const [seasonEnd, setSeasonEnd] = useState('');
  const [createdTeam, setCreatedTeam] = useState(null);

  // Step 3: Invite data
  const [joinCode, setJoinCode] = useState('');
  const [emails, setEmails] = useState('');
  const [invitesSent, setInvitesSent] = useState(false);
  const [copied, setCopied] = useState(false);

  // Step 4: Program
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [programChoice, setProgramChoice] = useState(null); // 'scratch' | 'template'

  // Step 5: Assigned
  const [assigned, setAssigned] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('mf_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      } else {
        router.push('/');
      }
    } catch {
      router.push('/');
    }
  }, [router]);

  function goNext() {
    setDirection(1);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  }

  function skip() {
    setDirection(1);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function createTeam() {
    if (!teamName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: teamName.trim(),
          age_group: ageGroup,
          sport_type: sportType,
          season_start: seasonStart || undefined,
          season_end: seasonEnd || undefined,
          coach_id: user?.id,
        }),
      });
      if (res.ok) {
        const team = await res.json();
        setCreatedTeam(team);
        const code = team.join_code || generateJoinCode();
        setJoinCode(code);
        goNext();
      }
    } catch (err) {
      console.error('Failed to create team:', err);
    } finally {
      setLoading(false);
    }
  }

  async function sendInvites() {
    if (!emails.trim()) return;
    setLoading(true);
    try {
      const emailList = emails.split(',').map((e) => e.trim()).filter(Boolean);
      await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_id: createdTeam?.id,
          emails: emailList,
        }),
      });
      setInvitesSent(true);
    } catch (err) {
      console.error('Failed to send invites:', err);
    } finally {
      setLoading(false);
    }
  }

  function copyInviteLink() {
    const link = `${window.location.origin}/join?code=${joinCode}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function assignProgram() {
    setLoading(true);
    try {
      // Mark onboarding complete
      await fetch('/api/coach/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coach_id: user?.id }),
      });
      setAssigned(true);
      setTimeout(goNext, 800);
    } catch (err) {
      console.error('Failed to assign program:', err);
    } finally {
      setLoading(false);
    }
  }

  async function finishOnboarding() {
    try {
      await fetch('/api/coach/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coach_id: user?.id }),
      });
    } catch {}
    router.push('/admin/dashboard');
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  // ─── Step Renderers ───────────────────────────────────

  function renderWelcome() {
    return (
      <div className="text-center space-y-6">
        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-400 to-green-600 rounded-3xl flex items-center justify-center shadow-lg shadow-green-500/30 animate-[bounce_2s_ease-in-out_infinite]">
          <svg className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.841m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
            Welcome to <span className="text-green-600">MatchFit</span> Coach!
          </h1>
          <p className="mt-3 text-lg text-gray-500 max-w-md mx-auto leading-relaxed">
            Build your team, design training programs, and track your athletes&apos; progress — all in one place.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 max-w-lg mx-auto">
          {[
            { icon: '🏟️', title: 'Manage Teams', desc: 'Create squads & roster' },
            { icon: '📋', title: 'Build Programs', desc: 'AI-powered workouts' },
            { icon: '📊', title: 'Track Progress', desc: 'XP, streaks & badges' },
          ].map((f) => (
            <div key={f.title} className="bg-green-50 rounded-2xl p-4 border border-green-100">
              <div className="text-3xl mb-2">{f.icon}</div>
              <div className="font-semibold text-gray-800 text-sm">{f.title}</div>
              <div className="text-xs text-gray-500 mt-0.5">{f.desc}</div>
            </div>
          ))}
        </div>
        <button
          onClick={goNext}
          className="mt-6 inline-flex items-center gap-2 px-8 py-3.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-600/30 hover:shadow-green-600/50 hover:-translate-y-0.5 active:translate-y-0"
        >
          Let&apos;s Get Started
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </div>
    );
  }

  function renderCreateTeam() {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-9 h-9 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Create Your Team</h2>
          <p className="text-gray-500 mt-1">Set up your first squad to get started</p>
        </div>

        <div className="space-y-4 max-w-md mx-auto">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Team Name *</label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Riverside FC U16"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all text-gray-900 placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Age Group</label>
            <div className="flex flex-wrap gap-2">
              {AGE_GROUPS.map((ag) => (
                <button
                  key={ag}
                  onClick={() => setAgeGroup(ag)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border-2 ${
                    ageGroup === ag
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {ag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sport</label>
            <select
              value={sportType}
              onChange={(e) => setSportType(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all text-gray-900 bg-white"
            >
              {SPORT_TYPES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Season Start</label>
              <input
                type="date"
                value={seasonStart}
                onChange={(e) => setSeasonStart(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Season End</label>
              <input
                type="date"
                value={seasonEnd}
                onChange={(e) => setSeasonEnd(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all text-gray-900"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-center pt-2">
          <button
            onClick={createTeam}
            disabled={!teamName.trim() || loading}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-600/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {loading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating...
              </>
            ) : (
              <>
                Create Team
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  function renderInviteAthletes() {
    const inviteLink = typeof window !== 'undefined' ? `${window.location.origin}/join?code=${joinCode}` : '';

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-9 h-9 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Invite Your Athletes</h2>
          <p className="text-gray-500 mt-1">Get your team on board — pick any method below</p>
        </div>

        {/* Join Code */}
        <div className="max-w-md mx-auto bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 text-center">
          <div className="text-xs uppercase tracking-widest text-green-600 font-bold mb-2">Team Join Code</div>
          <div className="text-4xl sm:text-5xl font-mono font-black tracking-[0.3em] text-green-700 select-all">
            {joinCode || generateJoinCode()}
          </div>
          <p className="text-sm text-gray-500 mt-2">Athletes enter this code to join your team</p>
        </div>

        {/* Email Invites */}
        <div className="max-w-md mx-auto space-y-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Email Invites
            </label>
            <textarea
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              placeholder="player1@email.com, player2@email.com, ..."
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all text-gray-900 placeholder:text-gray-400 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">Comma-separated email addresses</p>
          </div>
          <button
            onClick={sendInvites}
            disabled={!emails.trim() || loading || invitesSent}
            className={`w-full py-3 rounded-xl font-semibold transition-all ${
              invitesSent
                ? 'bg-green-100 text-green-700 border-2 border-green-300'
                : 'bg-green-600 text-white hover:bg-green-700 shadow-md'
            } disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {invitesSent ? (
              <span className="inline-flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                Invites Sent!
              </span>
            ) : loading ? 'Sending...' : 'Send Email Invites'}
          </button>
        </div>

        {/* Copy Link */}
        <div className="max-w-md mx-auto">
          <button
            onClick={copyInviteLink}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <svg className="w-5 h-5 text-gray-400 group-hover:text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m9.86-3.07a4.5 4.5 0 0 0-1.242-7.244l-4.5-4.5a4.5 4.5 0 0 0-6.364 6.364l1.757 1.757" />
              </svg>
              <span className="text-sm text-gray-600 truncate">{inviteLink || 'Generating link...'}</span>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-lg shrink-0 transition-all ${
              copied ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600 group-hover:bg-green-100 group-hover:text-green-700'
            }`}>
              {copied ? 'Copied!' : 'Copy'}
            </span>
          </button>
        </div>

        <div className="flex justify-center pt-2">
          <button
            onClick={goNext}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-600/30"
          >
            Continue
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  function renderChooseProgram() {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-9 h-9 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Choose a Program</h2>
          <p className="text-gray-500 mt-1">Start from scratch or use a proven template</p>
        </div>

        {/* Option: Create from Scratch */}
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => { setProgramChoice('scratch'); router.push('/admin/programs/new'); }}
            className={`w-full flex items-center gap-4 p-4 border-2 rounded-xl transition-all hover:border-green-400 hover:bg-green-50 ${
              programChoice === 'scratch' ? 'border-green-500 bg-green-50' : 'border-gray-200'
            }`}
          >
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-900">Create from Scratch</div>
              <div className="text-sm text-gray-500">Build a fully custom program</div>
            </div>
            <svg className="w-5 h-5 text-gray-400 ml-auto" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">or use a template</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Templates Grid */}
        <div className="max-w-lg mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => { setSelectedTemplate(t); setProgramChoice('template'); }}
              className={`relative text-left p-4 border-2 rounded-xl transition-all hover:shadow-md ${
                selectedTemplate?.id === t.id
                  ? 'border-green-500 bg-green-50 shadow-md shadow-green-500/10'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {selectedTemplate?.id === t.id && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
              )}
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${t.color} text-white flex items-center justify-center mb-3`}>
                {t.icon}
              </div>
              <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">{t.description}</p>
              <div className="flex gap-3 mt-3">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  {t.duration}
                </span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 9v9.75" />
                  </svg>
                  {t.days}x/week
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-center pt-2">
          <button
            onClick={goNext}
            disabled={!programChoice}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-600/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            Continue
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  function renderAssignProgram() {
    const program = selectedTemplate || { name: 'Custom Program', description: 'Your custom training program', duration: 'Custom', days: '-' };

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-9 h-9 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 0 0 2.25-2.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v2.25A2.25 2.25 0 0 0 6 10.5Zm0 9.75h2.25A2.25 2.25 0 0 0 10.5 18v-2.25a2.25 2.25 0 0 0-2.25-2.25H6a2.25 2.25 0 0 0-2.25 2.25V18A2.25 2.25 0 0 0 6 20.25Zm9.75-9.75H18a2.25 2.25 0 0 0 2.25-2.25V6A2.25 2.25 0 0 0 18 3.75h-2.25A2.25 2.25 0 0 0 13.5 6v2.25a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Assign to Your Team</h2>
          <p className="text-gray-500 mt-1">Review and assign the program</p>
        </div>

        {/* Program Card */}
        <div className="max-w-md mx-auto bg-white border-2 border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white">
            <div className="text-sm font-medium opacity-80">Selected Program</div>
            <div className="text-xl font-bold mt-1">{program.name}</div>
          </div>
          <div className="p-5 space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">{program.description}</p>
            <div className="flex gap-4 pt-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                {program.duration}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5" />
                </svg>
                {program.days}x/week
              </div>
            </div>

            {/* Team preview */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198c-.003.009-.006.017-.01.026A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-800">{createdTeam?.name || teamName || 'Your Team'}</div>
                  <div className="text-xs text-gray-400">{ageGroup} &middot; {sportType}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center pt-2">
          <button
            onClick={assignProgram}
            disabled={loading || assigned}
            className={`inline-flex items-center gap-2 px-8 py-3.5 font-bold rounded-xl transition-all shadow-lg ${
              assigned
                ? 'bg-green-100 text-green-700 border-2 border-green-300 shadow-none'
                : 'bg-green-600 text-white hover:bg-green-700 shadow-green-600/30'
            } disabled:cursor-not-allowed`}
          >
            {assigned ? (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                Assigned!
              </>
            ) : loading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Assigning...
              </>
            ) : (
              <>
                Assign to Team
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  function renderAllSet() {
    return (
      <div className="text-center space-y-6">
        <ConfettiCanvas />
        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-xl shadow-green-500/30">
          <svg className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">You&apos;re All Set!</h1>
          <p className="mt-3 text-lg text-gray-500 max-w-md mx-auto leading-relaxed">
            Your team is ready, athletes are invited, and the program is assigned. Time to start coaching!
          </p>
        </div>

        <div className="max-w-sm mx-auto bg-green-50 border border-green-200 rounded-2xl p-5 space-y-3 text-left">
          {createdTeam && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-200 rounded-lg flex items-center justify-center text-green-700 shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
              <div className="text-sm"><span className="font-semibold text-gray-800">{createdTeam.name || teamName}</span> <span className="text-gray-500">created</span></div>
            </div>
          )}
          {joinCode && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-200 rounded-lg flex items-center justify-center text-green-700 shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
              <div className="text-sm"><span className="text-gray-500">Join code:</span> <span className="font-mono font-bold text-green-700">{joinCode}</span></div>
            </div>
          )}
          {selectedTemplate && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-200 rounded-lg flex items-center justify-center text-green-700 shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
              <div className="text-sm"><span className="font-semibold text-gray-800">{selectedTemplate.name}</span> <span className="text-gray-500">assigned</span></div>
            </div>
          )}
        </div>

        <button
          onClick={finishOnboarding}
          className="inline-flex items-center gap-2 px-10 py-4 bg-green-600 text-white font-bold text-lg rounded-xl hover:bg-green-700 transition-all shadow-xl shadow-green-600/30 hover:shadow-green-600/50 hover:-translate-y-0.5 active:translate-y-0"
        >
          Go to Dashboard
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </div>
    );
  }

  const stepRenderers = [renderWelcome, renderCreateTeam, renderInviteAthletes, renderChooseProgram, renderAssignProgram, renderAllSet];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Progress Bar */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-gray-700">
              Step {step + 1} of {STEPS.length}
              <span className="text-gray-400 font-normal ml-2">{STEPS[step].label}</span>
            </div>
            {step > 0 && step < STEPS.length - 1 && (
              <button
                onClick={skip}
                className="text-sm text-gray-400 hover:text-gray-600 font-medium transition-colors"
              >
                Skip
              </button>
            )}
          </div>

          {/* Step indicators */}
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="flex-1 h-1.5 rounded-full overflow-hidden bg-gray-100 transition-all"
              >
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${
                    i < step ? 'bg-green-500 w-full'
                    : i === step ? 'bg-green-500 w-full animate-pulse'
                    : 'bg-transparent w-0'
                  }`}
                  style={{ width: i <= step ? '100%' : '0%' }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {/* Back Button */}
        {step > 0 && step < STEPS.length - 1 && (
          <button
            onClick={goBack}
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 font-medium mb-6 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Back
          </button>
        )}

        {/* Step Content with transition */}
        <div
          key={step}
          className="animate-[fadeSlideIn_0.4s_ease-out]"
        >
          {stepRenderers[step]()}
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
