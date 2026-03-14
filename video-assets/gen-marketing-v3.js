const fs = require('fs');
const https = require('https');
const path = require('path');

const API_KEY = 'AIzaSyAL3nvtrW7qFF8KPrzKXwv7cswWiALIhSU';
const FRAMES_DIR = path.join(__dirname, 'frames');
const OUT_DIR = __dirname;

// Cinematic marketing clips — 8s each, Veo 3.0
const CLIPS = [
  {
    image: '11-player-dashboard.png',
    prompt: `Cinematic slow-motion shot of a young athlete in a modern gym, glancing at their phone which shows a sleek green-themed fitness app dashboard. The camera dollies in toward the phone screen as workout stats and XP numbers animate upward. Dramatic gym lighting with lens flares. The athlete smiles with determination. Professional sports brand commercial style, shallow depth of field, 4K quality.`,
    name: 'hero-athlete'
  },
  {
    image: '01-coach-dashboard.png',
    prompt: `Professional cinematic shot of a sports coach standing on the sideline of a soccer field at golden hour, holding a tablet showing a coaching analytics dashboard with player stats and compliance charts in green UI. Camera orbits slowly around the coach as data visualizations glow on the screen. Warm golden light, bokeh background of players training. Nike/Adidas commercial aesthetic, cinematic color grading.`,
    name: 'coach-sideline'
  },
  {
    image: '13-player-progress.png',
    prompt: `Dynamic montage of an athlete doing strength training exercises — deadlifts, box jumps, sprints — intercut with close-up shots of a phone screen showing progress charts going UP with green lines climbing. Fast cuts synced to music beats. Sweat droplets in slow motion. Numbers counting up: "Level 12", "450 XP", "14-day streak". Epic motivational sports cinematography with dramatic lighting.`,
    name: 'progress-montage'
  },
  {
    image: '08-coach-wellness.png',
    prompt: `Intimate cinematic shot of a coach reviewing player wellness data on a laptop in a team office. The screen shows mood and readiness indicators with green, amber, and red traffic lights. The coach picks up their phone and sends a message. Cut to an athlete receiving a notification on their phone and nodding appreciatively. Warm interior lighting, shallow depth of field, empathetic human connection storytelling.`,
    name: 'wellness-care'
  },
  {
    image: '14-player-badges.png',
    prompt: `Celebratory cinematic shot of a young athlete pumping their fist after completing a workout, with digital achievement badges and XP sparkles materializing around them in a subtle AR overlay effect. Their phone screen shows "New Badge Unlocked: Iron Will" with a gold badge glowing. Stadium lights in the background. Triumphant, aspirational mood. Slow motion confetti and light particles.`,
    name: 'achievement-celebration'
  },
  {
    image: '02-coach-teams.png',
    prompt: `Wide aerial drone shot descending toward a sports team huddled together on a training field. As the camera pushes in, a translucent digital overlay appears showing team stats, player names, and performance metrics floating above each player like a video game HUD. Modern tech-meets-sport aesthetic. The team breaks the huddle and sprints onto the field energetically. Golden hour lighting, epic cinematic scope.`,
    name: 'team-overview'
  },
];

async function generateClip(clip) {
  const imgPath = path.join(FRAMES_DIR, clip.image);
  if (!fs.existsSync(imgPath)) {
    console.log(`  SKIP: Missing ${clip.image}`);
    return null;
  }

  const imageData = fs.readFileSync(imgPath).toString('base64');
  const body = JSON.stringify({
    instances: [{
      prompt: clip.prompt,
      image: { bytesBase64Encoded: imageData, mimeType: 'image/png' }
    }],
    parameters: {
      aspectRatio: '16:9',
      sampleCount: 1,
      durationSeconds: 8,
    }
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
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.name) {
            console.log(`  ✅ Operation: ${json.name}`);
            resolve(json.name);
          } else {
            console.log(`  ❌ Error: ${json.error?.message || data.slice(0, 200)}`);
            resolve(null);
          }
        } catch (e) {
          console.log(`  ❌ Parse error: ${e.message}`);
          resolve(null);
        }
      });
    });
    req.on('error', e => { console.log(`  ❌ ${e.message}`); resolve(null); });
    req.write(body);
    req.end();
  });
}

async function pollOperation(opName) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/${opName}?key=${API_KEY}`,
      method: 'GET',
      timeout: 30000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { resolve({ error: e.message }); } });
    });
    req.on('error', e => resolve({ error: e.message }));
    req.end();
  });
}

(async () => {
  console.log('🎬 MatchFit Marketing Video v3 — Cinematic Veo 3.0 Generation\n');
  console.log(`Generating ${CLIPS.length} cinematic clips...\n`);

  const ops = [];
  for (const clip of CLIPS) {
    console.log(`🎥 ${clip.name}:`);
    const op = await generateClip(clip);
    if (op) ops.push({ name: clip.name, op, done: false });
    // Small delay between requests
    await new Promise(r => setTimeout(r, 2000));
  }

  if (ops.length === 0) {
    console.log('\n❌ No operations started.');
    return;
  }

  console.log(`\n⏳ Waiting for ${ops.length} clips to render (up to 5 minutes)...\n`);

  const maxWait = 360;
  let waited = 0;

  while (waited < maxWait) {
    await new Promise(r => setTimeout(r, 15000));
    waited += 15;

    let allDone = true;
    let progress = [];

    for (const op of ops) {
      if (op.done) { progress.push(`✅ ${op.name}`); continue; }

      const status = await pollOperation(op.op);
      if (status.done) {
        op.done = true;
        if (status.response?.generateVideoResponse) {
          const samples = status.response.generateVideoResponse.generatedSamples || [];
          for (const sample of samples) {
            if (sample.video?.bytesBase64Encoded) {
              const outFile = path.join(OUT_DIR, `v3-${op.name}.mp4`);
              fs.writeFileSync(outFile, Buffer.from(sample.video.bytesBase64Encoded, 'base64'));
              console.log(`  💾 Saved: v3-${op.name}.mp4`);
            } else if (sample.video?.uri) {
              console.log(`  🔗 URI: ${sample.video.uri}`);
            }
          }
        } else if (status.error) {
          console.log(`  ❌ ${op.name}: ${status.error.message}`);
        }
        progress.push(`✅ ${op.name}`);
      } else {
        allDone = false;
        const pct = status.metadata?.percentComplete || '?';
        progress.push(`⏳ ${op.name} (${pct}%)`);
      }
    }

    console.log(`[${waited}s] ${progress.join(' | ')}`);
    if (allDone) break;
  }

  // List generated files
  const generated = fs.readdirSync(OUT_DIR).filter(f => f.startsWith('v3-') && f.endsWith('.mp4'));
  console.log(`\n🎬 Generated ${generated.length}/${CLIPS.length} clips:`);
  generated.forEach(f => {
    const size = (fs.statSync(path.join(OUT_DIR, f)).size / 1024 / 1024).toFixed(1);
    console.log(`  📹 ${f} (${size} MB)`);
  });

  if (generated.length >= 3) {
    console.log('\n✅ Ready to assemble! Run: node video-assets/assemble-marketing-v3.js');
  }
})();
