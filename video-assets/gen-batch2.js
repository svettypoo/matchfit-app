const fs = require('fs');
const https = require('https');
const path = require('path');

const API_KEY = 'AIzaSyAL3nvtrW7qFF8KPrzKXwv7cswWiALIhSU';
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

function downloadFile(url, outPath) {
  return new Promise((resolve) => {
    const fullUrl = url.includes('key=') ? url : url + (url.includes('?') ? '&' : '?') + `key=${API_KEY}`;
    const parsed = new URL(fullUrl);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      timeout: 30000,
    };
    const req = https.request(options, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        downloadFile(res.headers.location, outPath).then(resolve);
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        fs.writeFileSync(outPath, buf);
        resolve(buf.length);
      });
    });
    req.on('error', () => resolve(0));
    req.end();
  });
}

// Scenes that still need generation
const scenes = [
  { image: '08-coach-wellness', name: 'wellness', prompt: 'A professional software demo showing athlete wellness monitoring dashboard. Charts showing sleep quality, mood scores, and energy levels animate in. Green UI with heart icons. Health monitoring interface with clean design.' },
  { image: '09-coach-feed', name: 'feed-coach', prompt: 'A professional software demo showing a team social feed for coaches. Announcement button prominent at top, activity cards slide in below. Green themed modern social feature of a fitness app.' },
  { image: '12-player-feed', name: 'feed-player', prompt: 'A professional mobile app demo showing a team activity feed. Workout completion notifications with XP earned slide in. Like and comment buttons visible. Bottom tab navigation. Fitness social feed.' },
];

(async () => {
  console.log('Batch 2: Generating 3 clips...\n');

  for (const scene of scenes) {
    const imgPath = path.join(FRAMES_DIR, scene.image + '.png');
    console.log(`Generating: ${scene.name}...`);
    const opName = await generateClip(imgPath, scene.prompt);

    if (!opName) { console.log('  Failed to start.'); continue; }
    console.log(`  Operation: ${opName}`);

    // Poll until done
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 10000));
      const status = await checkOp(opName);
      if (status.done) {
        if (status.response && status.response.generateVideoResponse) {
          const videos = status.response.generateVideoResponse.generatedSamples || [];
          for (const v of videos) {
            if (v.video && v.video.uri) {
              const outFile = `${OUT_DIR}/veo-${scene.name}.mp4`;
              const size = await downloadFile(v.video.uri, outFile);
              console.log(`  Downloaded: veo-${scene.name}.mp4 (${(size/1024).toFixed(0)} KB)`);
            }
          }
        } else if (status.error) {
          console.log(`  Error: ${status.error.message}`);
        }
        break;
      }
      process.stdout.write('.');
    }
    console.log('');

    // Wait between clips to avoid rate limit
    console.log('  Waiting 10s before next...');
    await new Promise(r => setTimeout(r, 10000));
  }

  console.log('\nDone! Listing all veo files:');
  fs.readdirSync(OUT_DIR)
    .filter(f => f.startsWith('veo-') && f.endsWith('.mp4'))
    .forEach(f => {
      const size = fs.statSync(path.join(OUT_DIR, f)).size;
      console.log(`  ${f} (${(size/1024).toFixed(0)} KB)`);
    });
})();
