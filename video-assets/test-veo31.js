const fs = require('fs');
const https = require('https');
const path = require('path');

const API_KEY = 'AIzaSyAL3nvtrW7qFF8KPrzKXwv7cswWiALIhSU';
const img = fs.readFileSync(path.join('frames', '13-player-progress.png')).toString('base64');

// Try each model until one works
const models = [
  'veo-3.1-fast-generate-preview',
  'veo-3.1-generate-preview', 
  'veo-2.0-generate-001',
  'veo-3.0-generate-001'
];

async function tryModel(model) {
  const body = JSON.stringify({
    instances: [{ prompt: 'Professional fitness app showing progress tracking charts animating upward. Green theme.', image: { bytesBase64Encoded: img, mimeType: 'image/png' } }],
    parameters: { aspectRatio: '16:9', sampleCount: 1, durationSeconds: 8 }
  });
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${model}:predictLongRunning?key=${API_KEY}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      timeout: 30000,
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          if (j.error) console.log(`  ${model}: FAIL - ${j.error.message.substring(0, 80)}`);
          else console.log(`  ${model}: SUCCESS - op=${j.name}`);
          resolve(j);
        } catch { resolve(null); }
      });
    });
    req.on('error', (e) => { console.log(`  ${model}: NET ERROR - ${e.message}`); resolve(null); });
    req.write(body);
    req.end();
  });
}

(async () => {
  console.log('Testing all Veo models for quota availability...\n');
  for (const m of models) {
    const r = await tryModel(m);
    if (r && r.name) { console.log(`\nWORKING MODEL FOUND: ${m}`); break; }
    await new Promise(r => setTimeout(r, 2000));
  }
})();
