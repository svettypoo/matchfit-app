const https = require('https');

const prompt = `You are a world-class marketing copywriter for sports tech startups. Write a 60-second marketing video script for MatchFit — a coaching and athlete performance platform.

The app has these REAL features (screenshots available for all):
- Coach Dashboard: Team overview with active players, compliance rates, streaks, injury tracking
- Player Roster: Card/list views, search, filter by position/status, sort by XP/level
- Training Programs: Create/assign multi-week programs with exercises, sets, reps, weights
- Exercise Library: 100+ exercises with muscle groups, equipment, difficulty levels
- Assessments: Questionnaires for player readiness, injury screening
- Calendar: Monthly view with workout schedules, color-coded completion
- Messaging: Direct coach-to-player messaging
- Wellness Dashboard: Mood, sleep, stress, energy tracking with traffic-light alerts
- Analytics: ACWR workload ratios, compliance trends, performance charts
- Activity Feed: Team activity with workout completions, achievements, reactions
- Player Dashboard: Today workout, XP system, streak tracking, level progression
- Badges and Achievements: Gamified XP, unlockable badges, streak milestones
- Leaderboard: Team rankings by XP, compliance, streaks
- Progress Charts: Line/bar charts for strength gains, workout volume
- SSO Login: One-click login

Write the script as a series of SCENES:
- Scene number and duration (4 seconds each, 15 scenes for 60s)
- screen: which app page to show (use filenames like: 01-coach-dashboard, 02-coach-teams, 03-coach-programs, 05-coach-exercises, 06-coach-calendar, 07-coach-messages, 08-coach-wellness, 09-coach-feed, 10-coach-analytics, 11-player-dashboard, 12-player-feed, 13-player-progress, 14-player-badges, 15-player-leaderboard)
- headline: Bold text overlay (max 6 words)
- subtext: One sentence description

Make it EMOTIONALLY COMPELLING. Target: coaches wanting transparency, athletes wanting motivation.
Tone: Premium, confident, aspirational. Nike meets SaaS.
Return ONLY valid JSON array of objects with keys: scene, duration, screen, headline, subtext`;

const body = JSON.stringify({
  contents: [{ parts: [{ text: prompt }] }],
  generationConfig: { temperature: 0.9, maxOutputTokens: 4096 }
});

const req = https.request({
  hostname: 'generativelanguage.googleapis.com',
  path: '/v1beta/models/gemini-3.1-pro-preview:generateContent?key=AIzaSyAL3nvtrW7qFF8KPrzKXwv7cswWiALIhSU',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
  timeout: 30000,
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const scenes = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        console.log(JSON.stringify(scenes, null, 2));
      } else {
        console.log(text);
      }
    } catch (e) {
      console.log('Parse error:', e.message);
    }
  });
});
req.on('error', e => console.log('Error:', e.message));
req.write(body);
req.end();
