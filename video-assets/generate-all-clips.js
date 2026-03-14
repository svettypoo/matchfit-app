const fs = require('fs');
const https = require('https');
const path = require('path');

const API_KEY = 'AIzaSyCkib3FjcJA3YNCoxH5n8kbxvn5djyIYlw';
const FRAMES_DIR = 'c:/Users/pargo_pxnd4wa/matchfit-app/video-assets/frames';
const OUT_DIR = 'c:/Users/pargo_pxnd4wa/matchfit-app/video-assets';

function generateClip(imagePath, prompt) {
  const imageData = fs.readFileSync(imagePath).toString('base64');
  const body = JSON.stringify({
    instances: [{ prompt, image: { bytesBase64Encoded: imageData, mimeType: 'image/png' } }],
    parameters: { aspectRatio: '16:9', sampleCount: 1, durationSeconds: 8 }
  });
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/veo-3.0-fast-generate-001:predictLongRunning?key=${API_KEY}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      timeout: 60000,
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { const j = JSON.parse(data); resolve(j.name || null); } catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.write(body);
    req.end();
  });
}

function checkOp(opName) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/${opName}?key=${API_KEY}`,
      method: 'GET', timeout: 30000,
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve({}); } });
    });
    req.on('error', () => resolve({}));
    req.end();
  });
}

function download(url, outPath) {
  return new Promise((resolve) => {
    https.get(url, { timeout: 30000 }, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        download(res.headers.location, outPath).then(resolve);
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => { fs.writeFileSync(outPath, Buffer.concat(chunks)); resolve(true); });
    }).on('error', () => resolve(false));
  });
}

const scenes = [
  // INTRO - no image needed, will be generated as title cards
  // ACT 1
  { image: '02-coach-teams', name: 'teams', prompt: 'A professional software demo showing a team management interface. Cards and player names animate in with smooth transitions. Modern green and white UI design. Clean tech demo style with gentle motion.' },
  { image: '04-coach-program-builder', name: 'program-builder', prompt: 'A professional software demo showing a training program builder wizard. Form fields, step indicators, and options animate in. Green-themed modern UI. Clean tech product demo feel.' },
  { image: '05-coach-exercises', name: 'exercises', prompt: 'A professional software demo showing an exercise library with cards. Exercise cards with muscle tags, difficulty badges, and category filters animate in. Grid layout with green accents. Modern fitness app demo.' },
  { image: '06-coach-calendar', name: 'calendar', prompt: 'A professional software demo showing a training calendar view. Calendar grid with workout days fills in. Green themed modern UI with sidebar navigation. Clean scheduling interface demo.' },
  { image: '08-coach-wellness', name: 'wellness', prompt: 'A professional software demo showing athlete wellness monitoring. Charts and readiness scores animate in. Green UI with heart icons and wellness data. Health dashboard demo style.' },
  { image: '09-coach-feed', name: 'feed-coach', prompt: 'A professional software demo showing a team social feed. An announcement composer appears at top, feed cards with activity slide in below. Green-themed modern social feature. Clean tech demo.' },
  // ACT 2
  { image: '12-player-feed', name: 'feed-player', prompt: 'A professional software demo showing a social activity feed on mobile. Workout completion cards with XP badges slide in one by one. Heart and comment icons. Bottom navigation bar visible. Energetic fitness app feel.' },
  { image: '13-player-progress', name: 'progress', prompt: 'A professional software demo showing fitness progress charts. A circular compliance chart fills to 95%, bar charts animate up, stat cards appear. Green-themed modern analytics. Motivating fitness tracking demo.' },
  { image: '14-player-badges', name: 'badges', prompt: 'A professional software demo showing an achievement badge gallery. Badge cards with icons and rarity levels animate in a grid. Green gradient header. Gamification showcase, exciting and rewarding feel.' },
  { image: '15-player-leaderboard', name: 'leaderboard', prompt: 'A professional software demo showing a competitive leaderboard. Player rankings with XP scores and streak badges slide in. Crown on first place. Green-themed competitive fitness app demo.' },
  // ACT 3
  { image: '21-coach-review-performance', name: 'performance', prompt: 'A professional software demo showing performance analytics with 1RM estimation tables. Data rows animate in with color-coded values. Purple-accented analytics theme. Data-driven coaching demo.' },
  { image: '22-coach-review-wellness', name: 'wellness-review', prompt: 'A professional software demo showing a team wellness heatmap. Color cells fill in across a grid of players and dates. Purple and green wellness visualization. Advanced coaching analytics demo.' },
  // OUTRO
  { image: '24-landing-outro', name: 'landing', prompt: 'A professional software landing page with the hero section animating in. Login form, feature cards, and stats bar appear with smooth transitions. Green and white modern SaaS feel. Call-to-action prominent.' },
];

(async () => {
  console.log(`Generating ${scenes.length} video clips with Veo 3.0...\n`);

  // Launch all generation requests
  const ops = [];
  for (const scene of scenes) {
    const imgPath = path.join(FRAMES_DIR, scene.image + '.png');
    if (!fs.existsSync(imgPath)) { console.log(`  MISSING: ${scene.image}`); continue; }
    const opName = await generateClip(imgPath, scene.prompt);
    if (opName) {
      ops.push({ name: scene.name, op: opName, done: false });
      console.log(`  Started: ${scene.name}`);
    } else {
      console.log(`  Failed to start: ${scene.name}`);
    }
    // Small delay between requests to avoid rate limiting
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\nWaiting for ${ops.length} clips to generate...`);

  const maxWait = 300;
  let waited = 0;

  while (waited < maxWait) {
    await new Promise(r => setTimeout(r, 15000));
    waited += 15;

    let allDone = true;
    let doneCount = ops.filter(o => o.done).length;

    for (const op of ops) {
      if (op.done) continue;
      const status = await checkOp(op.op);
      if (status.done) {
        op.done = true;
        doneCount++;
        if (status.response && status.response.generateVideoResponse) {
          const videos = status.response.generateVideoResponse.generatedSamples || [];
          for (const v of videos) {
            if (v.video && v.video.uri) {
              const outFile = `${OUT_DIR}/veo-${op.name}.mp4`;
              const dlUrl = v.video.uri + `?key=${API_KEY}`;
              await download(dlUrl, outFile);
              const size = fs.existsSync(outFile) ? fs.statSync(outFile).size : 0;
              console.log(`  Downloaded: veo-${op.name}.mp4 (${(size/1024).toFixed(0)} KB)`);
            }
          }
        } else if (status.error) {
          console.log(`  Error: ${op.name} - ${status.error.message || JSON.stringify(status.error).slice(0, 100)}`);
        }
      } else {
        allDone = false;
      }
    }

    if (allDone) break;
    console.log(`  [${waited}s] ${doneCount}/${ops.length} done`);
  }

  console.log(`\nAll done! Generated ${ops.filter(o=>o.done).length}/${ops.length} clips.`);

  // List all veo files
  const veoFiles = fs.readdirSync(OUT_DIR).filter(f => f.startsWith('veo-') && f.endsWith('.mp4'));
  console.log('\nGenerated clips:');
  veoFiles.forEach(f => {
    const size = fs.statSync(path.join(OUT_DIR, f)).size;
    console.log(`  ${f} (${(size/1024).toFixed(0)} KB)`);
  });
})();
