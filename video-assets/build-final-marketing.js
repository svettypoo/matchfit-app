const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const VID_DIR = __dirname;
const FRAMES_DIR = path.join(__dirname, 'frames');
const TEMP = path.join(__dirname, 'temp-final');

if (fs.existsSync(TEMP)) fs.rmSync(TEMP, { recursive: true });
fs.mkdirSync(TEMP, { recursive: true });

// Premium marketing video structure:
// Pattern: Real screenshot → Veo cinematic → Real screenshot → Veo cinematic
// This creates "here's the product" + "here's the vision" rhythm

const scenes = [
  // === INTRO (0-4s) ===
  { type: 'screenshot', img: '01-coach-dashboard', dur: 4, headline: 'Command Your Team', sub: 'MatchFit — The Performance Platform', badge: '' },

  // === COACH BLOCK (4-28s) ===
  { type: 'veo', vid: 'veo-coach-dashboard', dur: 3, headline: '', sub: '' },
  { type: 'screenshot', img: '08-coach-wellness', dur: 4, headline: 'Anticipate Injuries First', sub: 'Track sleep, mood, stress with traffic-light alerts', badge: 'COACH' },
  { type: 'veo', vid: 'veo-wellness', dur: 3, headline: '', sub: '' },
  { type: 'screenshot', img: '10-coach-analytics', dur: 4, headline: 'Data Drives Championships', sub: 'ACWR workload ratios and compliance analytics', badge: 'COACH' },
  { type: 'veo', vid: 'veo-analytics', dur: 3, headline: '', sub: '' },
  { type: 'screenshot', img: '03-coach-programs', dur: 3, headline: 'Build The Perfect Plan', sub: 'Custom multi-week training programs', badge: 'COACH' },
  { type: 'screenshot', img: '05-coach-exercises', dur: 3, headline: '100+ Elite Exercises', sub: 'Sorted by muscle group and difficulty', badge: 'COACH' },

  // === PLAYER BLOCK (28-52s) ===
  { type: 'veo', vid: 'veo-player-dashboard', dur: 3, headline: '', sub: '' },
  { type: 'screenshot', img: '11-player-dashboard', dur: 4, headline: 'Own Your Daily Grind', sub: 'XP, streaks, and todays workout in one view', badge: 'ATHLETE' },
  { type: 'veo', vid: 'veo-progress', dur: 3, headline: '', sub: '' },
  { type: 'screenshot', img: '13-player-progress', dur: 4, headline: 'Visualize Your Gains', sub: 'Real-time strength and volume charts', badge: 'ATHLETE' },
  { type: 'veo', vid: 'veo-badges', dur: 3, headline: '', sub: '' },
  { type: 'screenshot', img: '14-player-badges', dur: 4, headline: 'Turn Sweat Into Status', sub: 'Level up and unlock achievement badges', badge: 'ATHLETE' },
  { type: 'screenshot', img: '15-player-leaderboard', dur: 3, headline: 'Fuel The Fire', sub: 'Compete for the top squad ranking', badge: 'ATHLETE' },

  // === CLOSER (52-60s) ===
  { type: 'veo', vid: 'veo-performance', dur: 3, headline: '', sub: '' },
  { type: 'screenshot', img: '01-coach-dashboard', dur: 5, headline: 'Train Smarter. Play Harder.', sub: 'matchfit.stproperties.com', badge: 'MATCHFIT' },
];

const sceneFiles = [];
let sceneNum = 0;

for (const s of scenes) {
  sceneNum++;
  const outFile = path.join(TEMP, `s${String(sceneNum).padStart(2, '0')}.mp4`);

  if (s.type === 'screenshot') {
    const imgPath = path.join(FRAMES_DIR, s.img + '.png');
    if (!fs.existsSync(imgPath)) { console.log(`  SKIP: ${s.img} missing`); continue; }

    const hl = s.headline.replace(/'/g, "\u2019").replace(/:/g, "\\:");
    const st = s.sub.replace(/'/g, "\u2019").replace(/:/g, "\\:");
    const badge = s.badge.replace(/'/g, "\u2019");

    let filters = [
      `scale=2100:1182`,
      `zoompan=z='min(zoom+0.0006,1.08)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${s.dur * 30}:s=1920x1080:fps=30`,
    ];

    if (hl) {
      filters.push(`drawbox=y=ih-160:w=iw:h=160:color=black@0.7:t=fill`);
      filters.push(`drawbox=y=ih-162:w=iw:h=3:color=0x22c55e:t=fill`);
      filters.push(`drawtext=text='${hl}':fontsize=44:fontcolor=white:x=(w-text_w)/2:y=h-130:enable='gte(t,0.3)'`);
      filters.push(`drawtext=text='${st}':fontsize=22:fontcolor=0xd1d5db:x=(w-text_w)/2:y=h-75:enable='gte(t,0.5)'`);
    }

    if (badge) {
      filters.push(`drawbox=x=w-180:y=16:w=164:h=32:color=0x22c55e@0.9:t=fill`);
      filters.push(`drawtext=text='${badge}':fontsize=16:fontcolor=white:x=w-170:y=22`);
    }

    // MatchFit branding top-left
    filters.push(`drawtext=text='MatchFit':fontsize=26:fontcolor=0x22c55e:x=24:y=20`);
    filters.push(`fade=t=in:st=0:d=0.4,fade=t=out:st=${s.dur - 0.4}:d=0.4`);

    const cmd = `ffmpeg -y -loop 1 -i "${imgPath}" -t ${s.dur} -vf "${filters.join(',')}" -c:v libx264 -preset fast -crf 22 -pix_fmt yuv420p "${outFile}"`;

    try {
      execSync(cmd, { stdio: 'pipe', timeout: 30000 });
      sceneFiles.push(outFile);
      console.log(`  ✅ Scene ${sceneNum}: ${s.headline || 'Cinematic B-roll'}`);
    } catch (e) {
      console.log(`  ❌ Scene ${sceneNum}: ${e.stderr?.toString().slice(-150) || e.message}`);
    }

  } else if (s.type === 'veo') {
    const vidPath = path.join(VID_DIR, s.vid + '.mp4');
    if (!fs.existsSync(vidPath)) { console.log(`  SKIP: ${s.vid} missing`); continue; }

    // Trim Veo clip to duration, scale to 1920x1080, add MatchFit branding + fade
    const cmd = `ffmpeg -y -i "${vidPath}" -t ${s.dur} -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black,drawtext=text='MatchFit':fontsize=26:fontcolor=0x22c55e@0.7:x=24:y=20,fade=t=in:st=0:d=0.3,fade=t=out:st=${s.dur - 0.3}:d=0.3" -c:v libx264 -preset fast -crf 22 -pix_fmt yuv420p -an "${outFile}"`;

    try {
      execSync(cmd, { stdio: 'pipe', timeout: 30000 });
      sceneFiles.push(outFile);
      console.log(`  ✅ Scene ${sceneNum}: Veo cinematic (${s.vid})`);
    } catch (e) {
      console.log(`  ❌ Scene ${sceneNum}: ${e.stderr?.toString().slice(-150) || e.message}`);
    }
  }
}

if (sceneFiles.length < 5) {
  console.log('\nNot enough scenes generated.');
  process.exit(1);
}

// Concatenate
const concatFile = path.join(TEMP, 'concat.txt');
fs.writeFileSync(concatFile, sceneFiles.map(f => `file '${f.replace(/\\/g, '/')}'`).join('\n'));

const finalFile = path.join(VID_DIR, 'matchfit-marketing-final-v3.mp4');
console.log(`\n🔗 Joining ${sceneFiles.length} scenes...`);

try {
  execSync(`ffmpeg -y -f concat -safe 0 -i "${concatFile}" -c copy "${finalFile}"`, { stdio: 'pipe', timeout: 60000 });
  const size = (fs.statSync(finalFile).size / 1024 / 1024).toFixed(1);
  const durTotal = scenes.reduce((a, s) => a + s.dur, 0);
  console.log(`\n✅ matchfit-marketing-final-v3.mp4 (${size} MB, ~${durTotal}s, 1920x1080)`);
} catch (e) {
  console.log(`\n❌ Concat error: ${e.message}`);
}
