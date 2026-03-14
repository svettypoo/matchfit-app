/**
 * Generate exercise illustration images using Gemini 2.0 Flash Image Generation
 * For each exercise: Gemini generates a crash-dummy style illustration
 * Then uploads to media.stproperties.com and updates DB
 *
 * Usage: node generate-exercise-images.js [--start N] [--limit N] [--dry-run]
 */
const https = require('https');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const get = k => { const m = env.match(new RegExp('^' + k + '=(.+)', 'm')); return m ? m[1].trim().replace(/^"|"$/g, '') : null; };
const SUPABASE_URL = get('NEXT_PUBLIC_SUPABASE_URL');
const SUPABASE_KEY = get('SUPABASE_SERVICE_ROLE_KEY');
const GEMINI_KEY = get('GEMINI_API_KEY');
const MEDIA_TOKEN = 'svets-media-token-2026';
const MEDIA_URL = 'https://media.stproperties.com';

// Parse args
const args = process.argv.slice(2);
const getArg = (name) => { const i = args.indexOf('--' + name); return i >= 0 && args[i + 1] ? parseInt(args[i + 1]) : null; };
const START = getArg('start') || 0;
const LIMIT = getArg('limit') || 10; // Default 10 at a time
const DRY_RUN = args.includes('--dry-run');

function httpReq(method, urlStr, headers, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const opts = { method, hostname: u.hostname, port: u.port, path: u.pathname + u.search, headers };
    const proto = u.protocol === 'https:' ? https : require('http');
    const req = proto.request(opts, (res) => {
      const chunks = [];
      res.on('data', d => chunks.push(d));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        try { resolve({ status: res.statusCode, data: JSON.parse(buf.toString()) }); }
        catch { resolve({ status: res.statusCode, data: buf }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(120000, () => { req.destroy(); reject(new Error('timeout')); });
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function supabase(method, path, body) {
  return httpReq(method, SUPABASE_URL + path, {
    'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY,
    'Content-Type': 'application/json', 'Prefer': method === 'PATCH' ? 'return=minimal' : 'return=representation',
  }, body ? JSON.stringify(body) : null);
}

async function geminiGenerateImage(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_KEY}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
  };
  const res = await httpReq('POST', url, { 'Content-Type': 'application/json' }, JSON.stringify(body));
  if (res.status !== 200) {
    console.error('Gemini error:', res.status, typeof res.data === 'object' ? JSON.stringify(res.data).slice(0, 300) : '');
    return null;
  }
  // Extract image from response
  const parts = res.data?.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.mimeType?.startsWith('image/')) {
      return { base64: part.inlineData.data, mimeType: part.inlineData.mimeType };
    }
  }
  console.error('No image in Gemini response');
  return null;
}

async function uploadToMedia(base64Data, mimeType, filename) {
  const ext = mimeType.includes('png') ? 'png' : 'jpg';
  const body = JSON.stringify({ base64: base64Data, filename: filename + '.' + ext, source: 'gemini-exercise' });
  const res = await httpReq('POST', MEDIA_URL + '/upload', {
    'Authorization': 'Bearer ' + MEDIA_TOKEN,
    'Content-Type': 'application/json',
  }, body);
  if (res.status === 200 && res.data?.url) return res.data.url;
  console.error('Upload error:', res.status);
  return null;
}

function buildPrompt(exercise) {
  const name = exercise.name;
  const category = exercise.category;
  const muscles = (exercise.primary_muscles || []).join(', ');
  const equipment = (exercise.equipment || []).join(', ') || 'bodyweight';
  const instructions = exercise.instructions || '';

  return `Create a clean, professional fitness exercise illustration showing a simple crash-test dummy figure (gray/silver humanoid mannequin with no face, like a store mannequin or crash test dummy) performing the exercise "${name}".

The dummy should be in the KEY POSITION of the exercise (the most recognizable moment of the movement).

Exercise details:
- Category: ${category}
- Primary muscles: ${muscles}
- Equipment: ${equipment || 'none'}
- Movement: ${instructions}

Style requirements:
- Clean white or very light gray background
- The crash dummy figure should be silver/gray, anatomically proportioned
- Highlight the primary muscles being worked with a subtle red/orange glow
- If equipment is used, show it clearly (barbell, dumbbell, etc.)
- Professional, minimalist fitness app illustration style
- No text, no labels, no watermarks
- Square format, centered composition
- The figure should demonstrate proper form`;
}

async function main() {
  // Fetch exercises that don't have images yet
  const res = await supabase('GET', `/rest/v1/mf_exercises?select=id,name,category,primary_muscles,secondary_muscles,equipment,instructions&image_url=is.null&order=name&offset=${START}&limit=${LIMIT}`);
  const exercises = res.data || [];
  console.log(`Found ${exercises.length} exercises without images (offset=${START}, limit=${LIMIT})`);

  if (DRY_RUN) {
    exercises.forEach((e, i) => console.log(`  ${i + 1}. ${e.name} (${e.category})`));
    console.log('DRY RUN — no images generated');
    return;
  }

  let success = 0, failed = 0;
  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];
    const slug = ex.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
    console.log(`\n[${i + 1}/${exercises.length}] ${ex.name}...`);

    try {
      // Generate image with Gemini
      const prompt = buildPrompt(ex);
      const img = await geminiGenerateImage(prompt);
      if (!img) { failed++; continue; }

      // Upload to media server
      const mediaUrl = await uploadToMedia(img.base64, img.mimeType, `exercise-${slug}`);
      if (!mediaUrl) { failed++; continue; }

      // Update exercise in DB
      await supabase('PATCH', `/rest/v1/mf_exercises?id=eq.${ex.id}`, { image_url: mediaUrl });
      console.log(`  OK: ${mediaUrl}`);
      success++;

      // Rate limit: wait 2 seconds between requests
      if (i < exercises.length - 1) await new Promise(r => setTimeout(r, 2000));
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone! Success: ${success}, Failed: ${failed}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
