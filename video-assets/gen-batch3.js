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
        try {
          const j = JSON.parse(data);
          if (j.error) { console.log('    API error:', j.error.message); resolve(null); }
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

const scenes = [
  { image: '13-player-progress', name: 'progress', prompt: 'Professional fitness app demo showing progress tracking. A circular chart fills to 95 percent, bar charts for weekly workouts animate upward, stat cards with level and XP appear. Green theme, modern clean design.' },
  { image: '14-player-badges', name: 'badges', prompt: 'Professional gamification showcase of a fitness app. Achievement badge cards with icons and rarity labels (Common, Rare, Epic, Legendary) animate into a grid layout. Green gradient header with progress bar. Exciting achievement gallery.' },
  { image: '21-coach-review-performance', name: 'performance', prompt: 'Professional analytics dashboard demo showing sports performance data. A table with estimated 1RM values, personal records, and trend indicators animates in. Clean data visualization with coach sidebar. Purple and green accents.' },
];

(async () => {
  console.log('Batch 3: Generating 3 clips...\n');
  for (const scene of scenes) {
    const imgPath = path.join(FRAMES_DIR, scene.image + '.png');
    console.log(`Generating: ${scene.name}...`);
    const opName = await generateClip(imgPath, scene.prompt);
    if (!opName) { console.log('  Failed.'); await new Promise(r=>setTimeout(r,30000)); continue; }
    console.log(`  Op: ${opName}`);
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 10000));
      const st = await checkOp(opName);
      if (st.done) {
        if (st.response?.generateVideoResponse?.generatedSamples) {
          for (const v of st.response.generateVideoResponse.generatedSamples) {
            if (v.video?.uri) {
              const out = `${OUT_DIR}/veo-${scene.name}.mp4`;
              const sz = await downloadFile(v.video.uri, out);
              console.log(`  Downloaded: veo-${scene.name}.mp4 (${(sz/1024).toFixed(0)} KB)`);
            }
          }
        } else if (st.error) { console.log(`  Err: ${st.error.message}`); }
        break;
      }
      process.stdout.write('.');
    }
    console.log('');
    await new Promise(r => setTimeout(r, 5000));
  }
  console.log('\nDone!');
})();
