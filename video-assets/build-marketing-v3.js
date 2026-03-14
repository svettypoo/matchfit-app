const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const FRAMES_DIR = path.join(__dirname, 'frames');
const OUT_DIR = __dirname;
const TEMP_DIR = path.join(__dirname, 'temp-v3');

// Clean and create temp dir
if (fs.existsSync(TEMP_DIR)) fs.rmSync(TEMP_DIR, { recursive: true });
fs.mkdirSync(TEMP_DIR, { recursive: true });

const scenes = [
  { scene: 1, duration: 4, screen: "01-coach-dashboard", headline: "Command Your Team's Performance", subtext: "Total visibility into readiness, injuries, and compliance." },
  { scene: 2, duration: 4, screen: "02-coach-teams", headline: "Every Athlete, Fully Understood", subtext: "Filter by position, status, and performance level instantly." },
  { scene: 3, duration: 4, screen: "08-coach-wellness", headline: "Anticipate Injuries First", subtext: "Track sleep, mood, and stress with traffic-light alerts." },
  { scene: 4, duration: 4, screen: "10-coach-analytics", headline: "Data That Drives Champions", subtext: "Master workload ratios and compliance with elite analytics." },
  { scene: 5, duration: 4, screen: "03-coach-programs", headline: "Architect The Perfect Plan", subtext: "Build custom multi-week programs with precise progression." },
  { scene: 6, duration: 4, screen: "05-coach-exercises", headline: "Elite Exercises On Demand", subtext: "100+ movements by muscle group, equipment, and difficulty." },
  { scene: 7, duration: 4, screen: "06-coach-calendar", headline: "Schedule Success Daily", subtext: "Color-coded workout tracking keeps everyone aligned." },
  { scene: 8, duration: 4, screen: "07-coach-messages", headline: "Direct Line To Your Squad", subtext: "Instant coach-to-player messaging for accountability." },
  { scene: 9, duration: 4, screen: "11-player-dashboard", headline: "Own Your Daily Grind", subtext: "Crush today's workout. Build an unstoppable streak." },
  { scene: 10, duration: 4, screen: "13-player-progress", headline: "Visualize Your Potential", subtext: "Watch strength gains explode with real-time charts." },
  { scene: 11, duration: 4, screen: "14-player-badges", headline: "Turn Sweat Into Status", subtext: "Level up and unlock exclusive achievement badges." },
  { scene: 12, duration: 4, screen: "15-player-leaderboard", headline: "Fuel The Competitive Fire", subtext: "Battle teammates for the top spot on the leaderboard." },
  { scene: 13, duration: 4, screen: "12-player-feed", headline: "Build Unbreakable Culture", subtext: "Celebrate team achievements in the live activity feed." },
  { scene: 14, duration: 4, screen: "09-coach-feed", headline: "See Hard Work Pay Off", subtext: "Monitor live workout completions from the sidelines." },
  { scene: 15, duration: 4, screen: "01-coach-dashboard", headline: "Train Smarter. Play Harder.", subtext: "MatchFit — The ultimate performance platform." },
];

// Step 1: Generate individual scene videos from screenshots with text overlays
console.log('🎬 Building MatchFit Marketing Video v3\n');

const sceneFiles = [];

for (const s of scenes) {
  const imgPath = path.join(FRAMES_DIR, s.screen + '.png');
  if (!fs.existsSync(imgPath)) {
    console.log(`  ⚠️ Missing: ${s.screen}.png — skipping`);
    continue;
  }

  const outFile = path.join(TEMP_DIR, `scene-${String(s.scene).padStart(2, '0')}.mp4`);

  // Escape special characters for ffmpeg drawtext
  const headline = s.headline.replace(/'/g, "\u2019").replace(/:/g, "\\:");
  const subtext = s.subtext.replace(/'/g, "\u2019").replace(/:/g, "\\:");
  const sceneLabel = s.scene <= 8 ? 'COACH VIEW' : (s.scene <= 14 ? 'ATHLETE VIEW' : '');

  // Build ffmpeg command with:
  // - Ken Burns zoom effect (slow zoom in)
  // - Dark gradient overlay at bottom for text
  // - Headline text (bold, white)
  // - Subtext (lighter, smaller)
  // - Scene label (top-right badge)
  // - Fade in/out transitions
  const cmd = [
    'ffmpeg', '-y',
    '-loop', '1', '-i', `"${imgPath}"`,
    '-t', String(s.duration),
    '-vf', `"` +
      // Scale to 1920x1080 with Ken Burns slow zoom
      `scale=2100:1182,` +
      `zoompan=z='min(zoom+0.0008,1.1)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${s.duration * 30}:s=1920x1080:fps=30,` +
      // Dark gradient bar at bottom
      `drawbox=y=ih-180:w=iw:h=180:color=black@0.65:t=fill,` +
      // Green accent line
      `drawbox=y=ih-182:w=iw:h=3:color=0x22c55e:t=fill,` +
      // Headline text
      `drawtext=text='${headline}':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=h-145:enable='gte(t,0.3)',` +
      // Subtext
      `drawtext=text='${subtext}':fontsize=24:fontcolor=0xd1d5db:x=(w-text_w)/2:y=h-85:enable='gte(t,0.6)',` +
      // Scene label badge (top-right)
      (sceneLabel ? `drawbox=x=w-220:y=20:w=200:h=36:color=0x22c55e:t=fill,` +
        `drawtext=text='${sceneLabel}':fontsize=18:fontcolor=white:x=w-210:y=28,` : '') +
      // MatchFit logo text (top-left)
      `drawtext=text='MatchFit':fontsize=28:fontcolor=0x22c55e:x=30:y=25,` +
      // Fade in/out
      `fade=t=in:st=0:d=0.5,fade=t=out:st=${s.duration - 0.5}:d=0.5` +
      `"`,
    '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
    '-pix_fmt', 'yuv420p',
    `"${outFile}"`,
  ].join(' ');

  try {
    console.log(`  🎥 Scene ${s.scene}: ${s.headline}`);
    execSync(cmd, { stdio: 'pipe', timeout: 30000 });
    sceneFiles.push(outFile);
  } catch (e) {
    console.log(`  ❌ Error scene ${s.scene}: ${e.stderr?.toString().slice(-200) || e.message}`);
  }
}

if (sceneFiles.length === 0) {
  console.log('\n❌ No scenes generated.');
  process.exit(1);
}

// Step 2: Create concat file
const concatFile = path.join(TEMP_DIR, 'concat.txt');
fs.writeFileSync(concatFile, sceneFiles.map(f => `file '${f.replace(/\\/g, '/')}'`).join('\n'));

// Step 3: Concatenate all scenes
const finalFile = path.join(OUT_DIR, 'matchfit-marketing-v3.mp4');
console.log(`\n🔗 Concatenating ${sceneFiles.length} scenes...`);

try {
  execSync(`ffmpeg -y -f concat -safe 0 -i "${concatFile}" -c copy "${finalFile}"`, { stdio: 'pipe', timeout: 60000 });
  const size = (fs.statSync(finalFile).size / 1024 / 1024).toFixed(1);
  console.log(`\n✅ Final video: ${finalFile} (${size} MB)`);
  console.log(`   Duration: ~${sceneFiles.length * 4}s`);
  console.log(`   Resolution: 1920x1080`);
} catch (e) {
  console.log(`\n❌ Concat error: ${e.stderr?.toString().slice(-300) || e.message}`);
}

// Cleanup
// fs.rmSync(TEMP_DIR, { recursive: true });
console.log('\n🎬 Done!');
