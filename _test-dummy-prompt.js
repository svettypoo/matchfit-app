const https = require('https');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const get = k => { const m = env.match(new RegExp('^' + k + '=(.+)', 'm')); return m ? m[1].trim().replace(/^"|"$/g, '') : null; };
const GEMINI_KEY = get('GEMINI_API_KEY');

const prompt = `Generate an image of a CRASH TEST DUMMY performing a barbell squat exercise.

CRITICAL: The figure MUST be a classic automotive crash test dummy - the kind used in car safety testing. It has:
- A smooth, featureless yellow/orange head with NO face (just a round head)
- Black and yellow circular target markers on the chest, knees, and shoulders
- A segmented, articulated body made of metal and rubber
- The classic crash test dummy color scheme: yellow body with black markings/stripes
- NO human skin, NO muscles visible, NO anatomical details - just a mechanical test dummy

The crash test dummy is standing in a squat position holding a barbell across its shoulders. Clean white background. Professional fitness illustration style. No text.`;

function httpReq(method, urlStr, headers, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const opts = { method, hostname: u.hostname, path: u.pathname + u.search, headers };
    const req = https.request(opts, res => {
      const chunks = [];
      res.on('data', d => chunks.push(d));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        try { resolve(JSON.parse(buf.toString())); }
        catch { resolve(buf.toString()); }
      });
    });
    req.on('error', reject);
    req.setTimeout(120000, () => { req.destroy(); reject(new Error('timeout')); });
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  console.log('Sending prompt to Gemini...');
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
  });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_KEY}`;
  const data = await httpReq('POST', url, { 'Content-Type': 'application/json' }, body);

  if (data.error) {
    console.log('API Error:', JSON.stringify(data.error).substring(0, 300));
    return;
  }

  const parts = data?.candidates?.[0]?.content?.parts || [];
  let hasImage = false;
  for (const p of parts) {
    if (p.text) console.log('Text:', p.text.substring(0, 200));
    if (p.inlineData) {
      hasImage = true;
      console.log('Got image! Type:', p.inlineData.mimeType, 'Size:', p.inlineData.data.length, 'chars');

      // Upload to media server
      const uploadBody = JSON.stringify({
        base64: p.inlineData.data,
        filename: 'test-dummy-squat.png',
        source: 'gemini-test'
      });
      const res = await httpReq('POST', 'https://media.stproperties.com/upload', {
        'Authorization': 'Bearer svets-media-token-2026',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(uploadBody),
      }, uploadBody);
      console.log('Upload result:', JSON.stringify(res));
    }
  }
  if (!hasImage) console.log('No image in response');
}

main().catch(e => console.error('Fatal:', e));
