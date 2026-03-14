const fs = require('fs');
const https = require('https');
const path = require('path');

const API_KEY = 'AIzaSyAL3nvtrW7qFF8KPrzKXwv7cswWiALIhSU';
const FRAMES_DIR = 'c:/Users/pargo_pxnd4wa/matchfit-app/video-assets/frames';
const OUT_DIR = 'c:/Users/pargo_pxnd4wa/matchfit-app/video-assets';
const MODEL = 'veo-3.1-generate-preview';

function generateClip(imagePath, prompt) {
  const imageData = fs.readFileSync(imagePath).toString('base64');
  const body = JSON.stringify({
    instances: [{ prompt, image: { bytesBase64Encoded: imageData, mimeType: 'image/png' } }],
    parameters: { aspectRatio: '16:9', sampleCount: 1, durationSeconds: 8 }
  });
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${MODEL}:predictLongRunning?key=${API_KEY}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      timeout: 60000,
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          if (j.error) { console.log('    API error:', j.error.message.substring(0, 100)); resolve(null); }
          else resolve(j.name || null);
        } catch { resolve(null); }
      });
    });
    req.on('error', (e) => { console.log('    Net error:', e.message); resolve(null); });
    req.write(body);
    req.end();
  });
}

function checkOp(opName) {
  return new Promise((resolve) => {
    https.get(`https://generativelanguage.googleapis.com/v1beta/${opName}?key=${API_KEY}`, { timeout: 30000 }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve({}); } });
    }).on('error', () => resolve({}));
  });
}

function downloadFile(uri, outPath) {
  const url = uri + (uri.includes('?') ? '&' : '?') + `key=${API_KEY}`;
  return new Promise((resolve) => {
    https.get(url, { timeout: 60000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, { timeout: 60000 }, (res2) => {
          const chunks = [];
          res2.on('data', c => chunks.push(c));
          res2.on('end', () => { const b = Buffer.concat(chunks); fs.writeFileSync(outPath, b); resolve(b.length); });
        }).on('error', () => resolve(0));
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => { const b = Buffer.concat(chunks); fs.writeFileSync(outPath, b); resolve(b.length); });
    }).on('error', () => resolve(0));
  });
}

// Only generate clips that are missing or too small (<1KB = error)
const scenes = [
  { image: '13-player-progress', name: 'progress', prompt: 'Professional fitness app demo showing progress tracking. Circular chart fills to 95 percent, bar charts animate upward, stat cards with level and XP appear. Green theme, modern clean design.' },
  { image: '14-player-badges', name: 'badges', prompt: 'Professional gamification showcase. Achievement badge cards with icons and rarity labels (Common, Rare, Epic, Legendary) animate into a grid. Green gradient header with progress bar. Exciting achievement gallery.' },
  { image: '21-coach-review-performance', name: 'performance', prompt: 'Professional analytics dashboard showing sports performance data. A table with 1RM values, personal records, and trend indicators animates in. Clean data visualization. Purple and green accents.' },
  { image: '06-coach-calendar', name: 'calendar', prompt: 'Professional training calendar app view. Weekly calendar fills in with workout sessions, colored blocks appear for different training types. Clean interface with green theme.' },
  { image: '05-coach-exercises', name: 'exercises', prompt: 'Professional exercise library showcase. Exercise cards with thumbnail images, difficulty badges, and muscle group tags scroll into view. Search bar activates. Clean green UI.' },
  { image: '04-coach-program-builder', name: 'program-builder', prompt: 'Professional program builder wizard interface. Steps highlight sequentially, exercise blocks drag into schedule slots, progression settings animate. Clean 4-step wizard. Green theme.' },
  { image: '02-coach-teams', name: 'teams', prompt: 'Professional team management interface. Player roster cards animate in with profile photos, status indicators, and invite buttons. Clean organized grid layout. Green theme.' },
];

(async () => {
  // Filter out scenes that already have good clips
  const needed = scenes.filter(s => {
    const f = `${OUT_DIR}/veo-${s.name}.mp4`;
    return !fs.existsSync(f) || fs.statSync(f).size < 1000;
  });
  
  console.log(`Generating ${needed.length} remaining clips using ${MODEL}...\n`);
  
  for (const scene of needed) {
    const imgPath = path.join(FRAMES_DIR, scene.image + '.png');
    if (!fs.existsSync(imgPath)) { console.log(`  SKIP ${scene.name}: no screenshot`); continue; }
    
    console.log(`Generating: ${scene.name}...`);
    const opName = await generateClip(imgPath, scene.prompt);
    if (!opName) { console.log('  Failed to start.'); await new Promise(r=>setTimeout(r,15000)); continue; }
    console.log(`  Op: ${opName}`);
    
    let success = false;
    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 10000));
      const st = await checkOp(opName);
      if (st.done) {
        if (st.response?.generateVideoResponse?.generatedSamples) {
          for (const v of st.response.generateVideoResponse.generatedSamples) {
            if (v.video?.uri) {
              const out = `${OUT_DIR}/veo-${scene.name}.mp4`;
              const sz = await downloadFile(v.video.uri, out);
              console.log(`  Downloaded: veo-${scene.name}.mp4 (${(sz/1024).toFixed(0)} KB)`);
              success = true;
            }
          }
        } else if (st.error) { console.log(`  Err: ${st.error.message}`); }
        break;
      }
      process.stdout.write('.');
    }
    if (!success) console.log('  Timed out or failed');
    console.log('');
    await new Promise(r => setTimeout(r, 8000));
  }
  
  // Summary
  console.log('\n=== FINAL STATUS ===');
  const allNames = ['coach-dashboard','player-dashboard','analytics','wellness','feed-coach','feed-player','progress','badges','performance','calendar','exercises','program-builder','teams'];
  for (const n of allNames) {
    const f = `${OUT_DIR}/veo-${n}.mp4`;
    const exists = fs.existsSync(f);
    const sz = exists ? fs.statSync(f).size : 0;
    const ok = sz > 1000;
    console.log(`  ${ok ? '✓' : '✗'} veo-${n}.mp4 ${ok ? `(${(sz/1024).toFixed(0)} KB)` : 'MISSING'}`);
  }
})();
