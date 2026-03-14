const { execSync } = require('child_process');
const fs = require('fs');

const VID = 'c:/Users/pargo_pxnd4wa/matchfit-app/video-assets';
const NARR = `${VID}/narr`;
const TEMP = `${VID}/temp3`;
const OUT = `${VID}/matchfit-marketing-final.mp4`;
const W = 1280, H = 720, FPS = 30;
const FONT = '/c/Windows/Fonts/arialbd.ttf';
const FONTR = '/c/Windows/Fonts/arial.ttf';

if (!fs.existsSync(TEMP)) fs.mkdirSync(TEMP, { recursive: true });
// Clean old temp files
fs.readdirSync(TEMP).filter(f => f.endsWith('.ts')).forEach(f => fs.unlinkSync(`${TEMP}/${f}`));

function esc(t) { return t.replace(/'/g, '\u2019').replace(/:/g, '\\\\:'); }
let idx = 0;

function wavDur(file) {
  const out = execSync(`ffprobe -i "${file}" -show_entries format=duration -v quiet -of default=noprint_wrappers=1`, {encoding:'utf8',timeout:5000}).trim();
  return parseFloat(out.split('=')[1]) || 4;
}

// All clips output as .ts (MPEG-TS) with uniform audio: aac 48kHz stereo
// This ensures clean concatenation

function titleCard(bgColor, lines, narrFile) {
  const out = `${TEMP}/${String(idx++).padStart(3,'0')}.ts`;
  const hasNarr = narrFile && fs.existsSync(`${NARR}/${narrFile}`);
  const dur = hasNarr ? wavDur(`${NARR}/${narrFile}`) + 1.0 : 3.5;

  let filter = `color=c=${bgColor}:s=${W}x${H}:d=${dur}:r=${FPS}`;
  lines.forEach(l => {
    filter += `,drawtext=text='${esc(l.text)}':fontsize=${l.size}:fontcolor=${l.color||'white'}:x=(w-text_w)/2:y=${l.y}:fontfile=${l.bold?FONT:FONTR}`;
  });

  if (hasNarr) {
    // Video from lavfi + audio from narration WAV, both to TS
    execSync(`ffmpeg -y -f lavfi -i "${filter}" -i "${NARR}/${narrFile}" -c:v libx264 -c:a aac -b:a 128k -ar 48000 -ac 2 -pix_fmt yuv420p -shortest -preset ultrafast -f mpegts "${out}"`, {stdio:'pipe',timeout:30000});
  } else {
    // Silent title card
    execSync(`ffmpeg -y -f lavfi -i "${filter}" -f lavfi -i "anullsrc=r=48000:cl=stereo" -c:v libx264 -c:a aac -b:a 128k -ar 48000 -ac 2 -pix_fmt yuv420p -t ${dur} -preset ultrafast -f mpegts "${out}"`, {stdio:'pipe',timeout:30000});
  }
  console.log(`  ${out.split('/').pop()}: title (${dur.toFixed(1)}s)`);
  return out;
}

function veoScene(veoName, title, subtitle, narrFile) {
  const out = `${TEMP}/${String(idx++).padStart(3,'0')}.ts`;
  const src = `${VID}/veo-${veoName}.mp4`;
  if (!fs.existsSync(src) || fs.statSync(src).size < 1000) {
    console.log(`  SKIP: veo-${veoName}.mp4 missing`);
    return null;
  }
  const hasNarr = narrFile && fs.existsSync(`${NARR}/${narrFile}`);

  let filter = `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2`;
  filter += `,drawbox=x=0:y=${H-85}:w=${W}:h=85:color=black@0.65:t=fill`;
  filter += `,drawtext=text='${esc(title)}':fontsize=22:fontcolor=white:x=30:y=${H-73}:fontfile=${FONT}`;
  if (subtitle) filter += `,drawtext=text='${esc(subtitle)}':fontsize=14:fontcolor=white@0.85:x=30:y=${H-45}:fontfile=${FONTR}`;

  if (hasNarr) {
    // Veo video + narration audio
    execSync(`ffmpeg -y -i "${src}" -i "${NARR}/${narrFile}" -vf "${filter}" -c:v libx264 -c:a aac -b:a 128k -ar 48000 -ac 2 -pix_fmt yuv420p -r ${FPS} -shortest -preset ultrafast -f mpegts "${out}"`, {stdio:'pipe',timeout:30000});
  } else {
    // Veo video + silent audio
    execSync(`ffmpeg -y -i "${src}" -f lavfi -i "anullsrc=r=48000:cl=stereo" -vf "${filter}" -c:v libx264 -c:a aac -b:a 128k -ar 48000 -ac 2 -pix_fmt yuv420p -r ${FPS} -shortest -preset ultrafast -f mpegts "${out}"`, {stdio:'pipe',timeout:30000});
  }
  const nStr = hasNarr ? 'narrated' : 'silent';
  console.log(`  ${out.split('/').pop()}: ${veoName} (${nStr})`);
  return out;
}

const clips = [];
console.log('Building final marketing video with narration...\n');

// === INTRO ===
console.log('INTRO');
clips.push(titleCard('#16a34a', [
  { text: 'MatchFit', size: 72, y: 280, bold: true },
  { text: 'Train Like A Pro. Play Like A Champion.', size: 26, y: 370, color: 'white@0.85' },
], 'narr-intro.wav'));

// === ACT 1: COACH ===
console.log('ACT 1: Coach');
clips.push(titleCard('#16a34a', [
  { text: 'ACT 1', size: 52, y: 280, bold: true },
  { text: 'The Coach Experience', size: 24, y: 345, color: 'white@0.85' },
], null));

clips.push(titleCard('#1e3a2f', [
  { text: 'Hi, I am Coach Sarah', size: 42, y: 260, bold: true },
  { text: 'Head Coach at FC United Academy', size: 20, y: 330, color: 'white@0.8' },
  { text: 'Let me show you how I manage my team', size: 20, y: 360, color: 'white@0.8' },
], 'narr-act1-intro.wav'));

clips.push(veoScene('coach-dashboard', 'My Dashboard', 'Everything at a glance - active players, compliance, streaks', 'narr-dashboard.wav'));
clips.push(veoScene('teams', 'Team Management', 'Organize squads, track rosters, manage invites', 'narr-teams.wav'));
clips.push(veoScene('program-builder', 'Program Builder', '4-step wizard with drag-and-drop, auto-progression, templates', 'narr-programs.wav'));
clips.push(veoScene('exercises', 'Exercise Library', '100+ exercises with video demos, muscle groups, difficulty levels', 'narr-exercises.wav'));
clips.push(veoScene('calendar', 'Training Calendar', 'See the full week at a glance', 'narr-calendar.wav'));
clips.push(veoScene('wellness', 'Wellness Monitoring', 'Track sleep, mood, energy - spot issues early', 'narr-wellness.wav'));
clips.push(veoScene('feed-coach', 'Team Feed', 'Post announcements, celebrate wins, keep connected', 'narr-feed.wav'));
clips.push(veoScene('analytics', 'Advanced Analytics', 'ACWR load management, 1RM tracking, injury monitoring', 'narr-analytics.wav'));

// === ACT 2: PLAYER ===
console.log('ACT 2: Player');
clips.push(titleCard('#0ea5e9', [
  { text: 'ACT 2', size: 52, y: 280, bold: true },
  { text: 'The Player Experience', size: 24, y: 345, color: 'white@0.85' },
], null));

clips.push(titleCard('#1e293b', [
  { text: 'Hi, I am Alex', size: 42, y: 260, bold: true },
  { text: 'Midfielder at FC United Academy', size: 20, y: 330, color: 'white@0.8' },
  { text: 'Let me show you my daily training', size: 20, y: 360, color: 'white@0.8' },
], 'narr-act2-intro.wav'));

clips.push(veoScene('player-dashboard', 'My Dashboard', 'Todays workout, streak, XP level, wellness prompt', 'narr-player-dash.wav'));
clips.push(veoScene('feed-player', 'Team Feed', 'See what teammates are crushing - cheer them on', 'narr-player-feed.wav'));
clips.push(veoScene('progress', 'Progress Tracking', 'Weekly charts, compliance ring, exercise PRs', 'narr-progress.wav'));
clips.push(veoScene('badges', 'Badges and Achievements', '20 badges across 4 rarities - Common, Rare, Epic, Legendary', 'narr-badges.wav'));

// === ACT 3: COACH REVIEW ===
console.log('ACT 3: Coach Review');
clips.push(titleCard('#7c3aed', [
  { text: 'ACT 3', size: 52, y: 280, bold: true },
  { text: 'Coach Reviews Player Data', size: 24, y: 345, color: 'white@0.85' },
], null));

clips.push(titleCard('#1e3a2f', [
  { text: 'Back to Coach Sarah', size: 42, y: 260, bold: true },
  { text: 'Reviewing player performance', size: 20, y: 330, color: 'white@0.8' },
  { text: 'Making data-driven decisions', size: 20, y: 360, color: 'white@0.8' },
], 'narr-act3-intro.wav'));

clips.push(veoScene('analytics', 'Team Overview', 'Data-driven decisions for every player', 'narr-review-analytics.wav'));
clips.push(veoScene('performance', 'Performance Analytics', 'Estimated 1RM tracking, PR detection', 'narr-review-perf.wav'));
clips.push(veoScene('wellness', 'Wellness Insights', 'Team readiness - spot who needs deload', 'narr-review-wellness.wav'));

// === OUTRO ===
console.log('OUTRO');
clips.push(titleCard('#16a34a', [
  { text: 'MatchFit', size: 60, y: 260, bold: true },
  { text: 'The Future of Team Fitness', size: 24, y: 345, color: 'white@0.85' },
  { text: 'matchfit.stproperties.com', size: 18, y: 410, color: 'white@0.7' },
], 'narr-outro.wav'));

// Filter nulls - use TS concat protocol (pipe concat, no re-encode needed)
const valid = clips.filter(c => c && fs.existsSync(c));
const concatStr = valid.map(f => f.replace(/\\/g, '/')).join('|');

console.log(`\nConcatenating ${valid.length} clips via concat protocol...`);
execSync(`ffmpeg -y -i "concat:${concatStr}" -c:v libx264 -c:a aac -b:a 128k -ar 48000 -ac 2 -pix_fmt yuv420p -preset medium -crf 20 "${OUT}"`, {stdio:'pipe',timeout:180000});

const stats = fs.statSync(OUT);
const dur = execSync(`ffprobe -i "${OUT}" -show_entries format=duration -v quiet -of default=noprint_wrappers=1`, {encoding:'utf8',timeout:15000}).trim().split('=')[1];
console.log(`\nFinal video: ${OUT}`);
console.log(`Duration: ${parseFloat(dur).toFixed(1)}s | Size: ${(stats.size/1024/1024).toFixed(1)} MB`);
console.log('Done!');
