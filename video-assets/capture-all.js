const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE = 'https://svets-dream-production.up.railway.app';
const TOKEN = 'svets-exec-token-2026';
const FRAMES = 'c:/Users/pargo_pxnd4wa/matchfit-app/video-assets/frames';

function api(action, extra = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ action, sessionId: 'marketing-video', ...extra });
    const req = https.request(BASE + '/browser', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let data = [];
      res.on('data', c => data.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(data);
        const ct = res.headers['content-type'] || '';
        if (ct.includes('image')) resolve({ type: 'image', data: buf });
        else resolve({ type: 'json', data: JSON.parse(buf.toString()) });
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function nav(url) {
  await api('navigate', { url });
  await new Promise(r => setTimeout(r, 3000));
}

async function shot(name) {
  const res = await api('screenshot');
  if (res.type === 'image') {
    fs.writeFileSync(path.join(FRAMES, name + '.png'), res.data);
    console.log('  saved:', name);
  } else {
    console.log('  screenshot error:', JSON.stringify(res.data).slice(0, 100));
  }
}

async function click(sel) { await api('click', { selector: sel }); await new Promise(r => setTimeout(r, 1500)); }
async function fill(sel, val) { await api('fill', { selector: sel, value: val }); }

(async () => {
  console.log('=== ACT 1: Coach Perspective ===');
  
  // Login as coach
  await nav('https://matchfit.stproperties.com');
  await api('eval', { script: "localStorage.clear();" });
  await nav('https://matchfit.stproperties.com');
  await new Promise(r => setTimeout(r, 2000));
  
  // Switch to coach role and login
  try { await click("button:has-text('Coach')"); } catch(e) {}
  await fill("input[type='email']", "coach@stproperties.com");
  await fill("input[type='password']", "Partycard123*");
  await click("button[type='submit']");
  await new Promise(r => setTimeout(r, 3000));
  
  // Coach Dashboard
  await shot('01-coach-dashboard');
  
  // Teams
  await nav('https://matchfit.stproperties.com/admin/teams');
  await shot('02-coach-teams');
  
  // Programs
  await nav('https://matchfit.stproperties.com/admin/programs');
  await shot('03-coach-programs');
  
  // Program Builder
  await nav('https://matchfit.stproperties.com/admin/programs/new');
  await shot('04-coach-program-builder');
  
  // Exercises
  await nav('https://matchfit.stproperties.com/admin/exercises');
  await shot('05-coach-exercises');
  
  // Calendar
  await nav('https://matchfit.stproperties.com/admin/calendar');
  await shot('06-coach-calendar');
  
  // Messages
  await nav('https://matchfit.stproperties.com/admin/messages');
  await shot('07-coach-messages');
  
  // Wellness
  await nav('https://matchfit.stproperties.com/admin/wellness');
  await shot('08-coach-wellness');
  
  // Feed (admin)
  await nav('https://matchfit.stproperties.com/admin/feed');
  await shot('09-coach-feed');
  
  // Analytics
  await nav('https://matchfit.stproperties.com/admin/analytics');
  await shot('10-coach-analytics');
  
  console.log('\n=== ACT 2: Player Perspective ===');
  
  // Login as player
  await api('eval', { script: "localStorage.clear();" });
  await nav('https://matchfit.stproperties.com');
  await new Promise(r => setTimeout(r, 2000));
  await fill("input[type='email']", "player@stproperties.com");
  await fill("input[type='password']", "Partycard123*");
  await click("button[type='submit']");
  await new Promise(r => setTimeout(r, 3000));
  
  // Player Dashboard
  await shot('11-player-dashboard');
  
  // Feed
  await nav('https://matchfit.stproperties.com/dashboard/feed');
  await shot('12-player-feed');
  
  // Progress
  await nav('https://matchfit.stproperties.com/dashboard/progress');
  await shot('13-player-progress');
  
  // Badges
  await nav('https://matchfit.stproperties.com/dashboard/badges');
  await shot('14-player-badges');
  
  // Leaderboard
  await nav('https://matchfit.stproperties.com/dashboard/leaderboard');
  await shot('15-player-leaderboard');
  
  // Notifications
  await nav('https://matchfit.stproperties.com/dashboard/notifications');
  await shot('16-player-notifications');
  
  // Profile
  await nav('https://matchfit.stproperties.com/dashboard/profile');
  await shot('17-player-profile');
  
  // Messages
  await nav('https://matchfit.stproperties.com/dashboard/messages');
  await shot('18-player-messages');
  
  console.log('\n=== ACT 3: Coach Review ===');
  
  // Login back as coach
  await api('eval', { script: "localStorage.clear();" });
  await nav('https://matchfit.stproperties.com');
  await new Promise(r => setTimeout(r, 2000));
  try { await click("button:has-text('Coach')"); } catch(e) {}
  await fill("input[type='email']", "coach@stproperties.com");
  await fill("input[type='password']", "Partycard123*");
  await click("button[type='submit']");
  await new Promise(r => setTimeout(r, 3000));
  
  // Coach reviewing dashboard (player performance)
  await shot('19-coach-review-dashboard');
  
  // Analytics - Load Management
  await nav('https://matchfit.stproperties.com/admin/analytics');
  await shot('20-coach-review-analytics');
  
  // Click Performance tab
  try { await click("button:has-text('Performance')"); } catch(e) {}
  await new Promise(r => setTimeout(r, 2000));
  await shot('21-coach-review-performance');
  
  // Click Injuries tab
  try { await click("button:has-text('Injuries')"); } catch(e) {}
  await new Promise(r => setTimeout(r, 2000));
  await shot('22-coach-review-injuries');
  
  // Click Wellness tab
  try { await click("button:has-text('Wellness')"); } catch(e) {}
  await new Promise(r => setTimeout(r, 2000));
  await shot('23-coach-review-wellness');
  
  // Landing page for outro
  await api('eval', { script: "localStorage.clear();" });
  await nav('https://matchfit.stproperties.com');
  await new Promise(r => setTimeout(r, 2000));
  await shot('24-landing-outro');
  
  console.log('\nDone! All frames captured.');
})();
