const https = require('https');
const fs = require('fs');

const API_KEY = 'AIzaSyAL3nvtrW7qFF8KPrzKXwv7cswWiALIhSU';

// Load screenshots as base64
const screenshots = [
  { name: 'Login Page', file: 'c:/Users/pargo_pxnd4wa/matchfit-app/video-assets/01-login.png' },
  { name: 'Coach Dashboard', file: 'c:/Users/pargo_pxnd4wa/matchfit-app/video-assets/02-coach-dashboard.png' },
  { name: 'Exercise Library', file: 'c:/Users/pargo_pxnd4wa/matchfit-app/video-assets/05-coach-exercises.png' },
  { name: 'Player Dashboard', file: 'c:/Users/pargo_pxnd4wa/matchfit-app/video-assets/12-player-dashboard.png' },
  { name: 'Progress Overall', file: 'c:/Users/pargo_pxnd4wa/matchfit-app/video-assets/14-player-progress-overall.png' },
  { name: 'Progress Exercises', file: 'c:/Users/pargo_pxnd4wa/matchfit-app/video-assets/15-player-progress-exercises.png' },
  { name: 'Progress Categories', file: 'c:/Users/pargo_pxnd4wa/matchfit-app/video-assets/16-player-progress-categories.png' },
  { name: 'Coach Player Progress', file: 'c:/Users/pargo_pxnd4wa/matchfit-app/video-assets/11-player-progress-coach.png' },
  { name: 'Workout Complete', file: 'c:/Users/pargo_pxnd4wa/matchfit-app/video-assets/18-workout-execution.png' },
];

const parts = [];

// Add system prompt
parts.push({
  text: `You are a senior UX designer and fitness app expert. I'm showing you screenshots from MatchFit, a fitness platform connecting coaches with athletes. It features: exercise library with 8 categories, workout tracking with per-set weight/reps, progress visualization (overall, per-exercise, per-category), gamification (XP, streaks, badges, levels), wellness monitoring, and coach-player communication.

You are a DIFFERENT expert — a product manager at a fitness tech startup who has used TrainHeroic, TeamBuildr, Volt Athletics, and JEFIT extensively. Provide a DIFFERENT perspective than a UX designer would. Focus on:

1. **Product-Market Fit** — Who is this for? Is the value prop clear from the login screen?
2. **Onboarding Gaps** — What would confuse a first-time coach or athlete?
3. **Engagement & Retention** — Will users come back daily? What's missing for habit formation?
4. **Monetization Readiness** — Could this charge $29/mo for coaches? What's missing for that?
5. **Mobile Experience** — These screens look desktop-oriented. How would they work on a phone?
6. **Data & Analytics Gaps** — What data would coaches actually pay for that's not shown here?
7. **Social & Community** — Is there enough social proof, competition, or team dynamics?
8. **Top 10 Product Improvements** — Ranked by business impact, not just design polish

Be a tough critic. Compare directly to competitors. Don't sugarcoat.`
});

// Add each screenshot
for (const ss of screenshots) {
  const data = fs.readFileSync(ss.file);
  const b64 = data.toString('base64');
  parts.push({ text: `\n\n--- Screenshot: ${ss.name} ---` });
  parts.push({ inlineData: { mimeType: 'image/png', data: b64 } });
}

const body = JSON.stringify({
  contents: [{ parts }],
  generationConfig: { maxOutputTokens: 16384, temperature: 0.7 }
});

const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
const parsed = new URL(url);

const req = https.request({
  hostname: parsed.hostname,
  path: parsed.pathname + parsed.search,
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
}, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.candidates && json.candidates[0]) {
        const text = json.candidates[0].content.parts.map(p => p.text || '').join('');
        fs.writeFileSync('c:/Users/pargo_pxnd4wa/matchfit-app/video-assets/chatgpt-review.txt', text);
        console.log('Gemini critique saved!');
        console.log(text.substring(0, 500) + '...');
      } else {
        console.log('ERROR:', JSON.stringify(json).substring(0, 1000));
      }
    } catch (e) {
      console.log('Parse error:', e.message, data.substring(0, 500));
    }
  });
});

req.on('error', e => console.log('Request error:', e.message));
req.write(body);
req.end();
