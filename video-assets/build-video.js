const { execSync } = require('child_process');
const fs = require('fs');

const FRAMES = 'c:/Users/pargo_pxnd4wa/matchfit-app/video-assets/frames';
const OUT = 'c:/Users/pargo_pxnd4wa/matchfit-app/video-assets/matchfit-marketing.mp4';
const W = 1280, H = 720;
const FPS = 30;
const FONT = '/c/Windows/Fonts/arialbd.ttf';
const FONTR = '/c/Windows/Fonts/arial.ttf';

const tempDir = 'c:/Users/pargo_pxnd4wa/matchfit-app/video-assets/temp';
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

function esc(t) {
  return t.replace(/'/g, "\u2019").replace(/:/g, "\\\\:").replace(/\\/g, '/');
}

function titleCard(idx, dur, bgColor, lines) {
  const out = `${tempDir}/scene_${String(idx).padStart(2,'0')}.mp4`;
  let filter = `color=c=${bgColor}:s=${W}x${H}:d=${dur}:r=${FPS}`;
  lines.forEach(l => {
    filter += `,drawtext=text='${esc(l.text)}':fontsize=${l.size}:fontcolor=${l.color || 'white'}:x=(w-text_w)/2:y=${l.y}:fontfile=${l.bold ? FONT : FONTR}`;
  });
  const cmd = `ffmpeg -y -f lavfi -i "${filter}" -c:v libx264 -pix_fmt yuv420p -preset ultrafast "${out}"`;
  execSync(cmd, { timeout: 30000, stdio: 'pipe' });
  console.log(`  scene ${idx}: title card`);
  return out;
}

function imgCard(idx, dur, imgFile, title, subtitle) {
  const out = `${tempDir}/scene_${String(idx).padStart(2,'0')}.mp4`;
  const img = `${FRAMES}/${imgFile}.png`;
  if (!fs.existsSync(img)) { console.log(`  MISSING: ${img}`); return null; }
  let filter = `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=white`;
  filter += `,drawbox=x=0:y=${H-90}:w=${W}:h=90:color=black@0.7:t=fill`;
  filter += `,drawtext=text='${esc(title)}':fontsize=24:fontcolor=white:x=30:y=${H-78}:fontfile=${FONT}`;
  if (subtitle) {
    filter += `,drawtext=text='${esc(subtitle)}':fontsize=15:fontcolor=white@0.85:x=30:y=${H-48}:fontfile=${FONTR}`;
  }
  const cmd = `ffmpeg -y -loop 1 -i "${img}" -vf "${filter}" -c:v libx264 -t ${dur} -pix_fmt yuv420p -r ${FPS} -preset ultrafast "${out}"`;
  execSync(cmd, { timeout: 30000, stdio: 'pipe' });
  console.log(`  scene ${idx}: ${title}`);
  return out;
}

const clips = [];
let s = 0;

// === INTRO ===
clips.push(titleCard(s++, 4, '#16a34a', [
  { text: 'MatchFit', size: 72, y: 280, bold: true },
  { text: 'Train Like A Pro. Play Like A Champion.', size: 26, y: 380, color: 'white@0.85' },
]));

// === ACT 1: COACH ===
clips.push(titleCard(s++, 3, '#16a34a', [
  { text: 'ACT 1', size: 56, y: 270, bold: true },
  { text: 'The Coach Experience', size: 26, y: 350, color: 'white@0.85' },
]));

clips.push(titleCard(s++, 4, '#1e3a2f', [
  { text: 'Hi, I am Coach Sarah', size: 44, y: 240, bold: true },
  { text: 'Head Coach at FC United Academy', size: 22, y: 320, color: 'white@0.8' },
  { text: 'Let me show you how I manage my team', size: 22, y: 355, color: 'white@0.8' },
]));

clips.push(imgCard(s++, 4, '01-coach-dashboard', 'My Dashboard', 'Everything at a glance - active players, compliance, streaks'));
clips.push(imgCard(s++, 3.5, '02-coach-teams', 'Team Management', 'Organize squads, track rosters, manage invites'));
clips.push(imgCard(s++, 4, '04-coach-program-builder', 'Program Builder', '4-step wizard - set basics, build schedule, add progression, review'));
clips.push(imgCard(s++, 4, '05-coach-exercises', 'Exercise Library', '100+ exercises with video demos, muscle groups, difficulty levels'));
clips.push(imgCard(s++, 3.5, '06-coach-calendar', 'Training Calendar', 'See the full week at a glance - workouts, rest days, events'));
clips.push(imgCard(s++, 3.5, '08-coach-wellness', 'Wellness Monitoring', 'Track sleep, mood, energy, readiness - spot issues early'));
clips.push(imgCard(s++, 3.5, '09-coach-feed', 'Team Feed', 'Post announcements, celebrate wins, keep the team connected'));
clips.push(imgCard(s++, 4.5, '10-coach-analytics', 'Advanced Analytics', 'ACWR load management, 1RM tracking, injury monitoring'));

// === ACT 2: PLAYER ===
clips.push(titleCard(s++, 3, '#0ea5e9', [
  { text: 'ACT 2', size: 56, y: 270, bold: true },
  { text: 'The Player Experience', size: 26, y: 350, color: 'white@0.85' },
]));

clips.push(titleCard(s++, 4, '#1e293b', [
  { text: 'Hi, I am Alex', size: 44, y: 240, bold: true },
  { text: 'Midfielder at FC United Academy', size: 22, y: 320, color: 'white@0.8' },
  { text: 'Let me show you my daily training', size: 22, y: 355, color: 'white@0.8' },
]));

clips.push(imgCard(s++, 4, '11-player-dashboard', 'My Dashboard', 'Todays workout, streak, XP level, wellness prompt'));
clips.push(imgCard(s++, 4, '12-player-feed', 'Team Feed', 'See what my teammates are crushing - cheer them on'));
clips.push(imgCard(s++, 4, '13-player-progress', 'Progress Tracking', 'Weekly charts, compliance ring, exercise PRs'));
clips.push(imgCard(s++, 4, '14-player-badges', 'Badges and Achievements', '20 badges across 4 rarities - Common, Rare, Epic, Legendary'));
clips.push(imgCard(s++, 3.5, '15-player-leaderboard', 'Leaderboard', 'Compete with teammates - who has the most XP?'));
clips.push(imgCard(s++, 3, '16-player-notifications', 'Smart Notifications', 'Workout reminders, badge unlocks, streak warnings'));
clips.push(imgCard(s++, 3, '17-player-profile', 'My Profile', 'Stats, position, team, personal bests'));

// === ACT 3: COACH REVIEW ===
clips.push(titleCard(s++, 3, '#7c3aed', [
  { text: 'ACT 3', size: 56, y: 270, bold: true },
  { text: 'Coach Reviews Player Data', size: 26, y: 350, color: 'white@0.85' },
]));

clips.push(titleCard(s++, 4, '#1e3a2f', [
  { text: 'Back to Coach Sarah', size: 44, y: 240, bold: true },
  { text: 'Now let me review how my players performed', size: 22, y: 320, color: 'white@0.8' },
  { text: 'and make data-driven decisions', size: 22, y: 355, color: 'white@0.8' },
]));

clips.push(imgCard(s++, 4, '19-coach-review-dashboard', 'Team Overview', 'Alex streak is 10 days - top performer! Sofia is climbing fast'));
clips.push(imgCard(s++, 4.5, '20-coach-review-load', 'Load Management', 'ACWR ratios show Jake and Liam in caution zone - adjust volume'));
clips.push(imgCard(s++, 4, '21-coach-review-performance', 'Performance Analytics', 'Estimated 1RM tracking, PR detection'));
clips.push(imgCard(s++, 4, '22-coach-review-wellness', 'Wellness Insights', 'Team readiness heatmap - spot who needs a deload'));

// === OUTRO ===
clips.push(imgCard(s++, 4, '24-landing-outro', 'Ready to Transform Your Training?', 'matchfit.stproperties.com'));

clips.push(titleCard(s++, 4, '#16a34a', [
  { text: 'MatchFit', size: 60, y: 260, bold: true },
  { text: 'The Future of Team Fitness', size: 24, y: 350, color: 'white@0.85' },
  { text: 'matchfit.stproperties.com', size: 20, y: 420, color: 'white@0.7' },
]));

// Filter out nulls
const validClips = clips.filter(c => c != null);

// Create concat file
const concatFile = `${tempDir}/concat.txt`;
const concatContent = validClips.map(f => `file '${f.replace(/\\/g, '/')}'`).join('\n');
fs.writeFileSync(concatFile, concatContent);

console.log(`\nConcatenating ${validClips.length} scenes...`);
const concatCmd = `ffmpeg -y -f concat -safe 0 -i "${concatFile}" -c:v libx264 -pix_fmt yuv420p -preset medium -crf 23 "${OUT}"`;
execSync(concatCmd, { timeout: 120000, stdio: 'pipe' });
const stats = fs.statSync(OUT);
console.log(`Video saved: ${OUT} (${(stats.size / 1024 / 1024).toFixed(1)} MB)`);
console.log('Done!');
