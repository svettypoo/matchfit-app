/**
 * Fix bad exercise images — regenerate all exercises identified as bad or errored in audit
 * Reads audit-results.json and regenerates images for all listed exercises
 *
 * Usage: node fix-exercise-images.js [--start N] [--limit N] [--dry-run]
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

const args = process.argv.slice(2);
const getArg = (name) => { const i = args.indexOf('--' + name); return i >= 0 && args[i + 1] ? parseInt(args[i + 1]) : null; };
const START = getArg('start') || 0;
const LIMIT = getArg('limit') || 9999;
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
        catch { resolve({ status: res.statusCode, data: buf.toString() }); }
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
    console.error('  Gemini error:', res.status, typeof res.data === 'object' ? JSON.stringify(res.data).slice(0, 300) : '');
    return null;
  }
  const parts = res.data?.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.mimeType?.startsWith('image/')) {
      return { base64: part.inlineData.data, mimeType: part.inlineData.mimeType };
    }
  }
  console.error('  No image in Gemini response');
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
  console.error('  Upload error:', res.status);
  return null;
}

function buildPrompt(exercise) {
  const name = exercise.name;
  const category = exercise.category;
  const muscles = (exercise.primary_muscles || []).join(', ');
  const equipment = (exercise.equipment || []).join(', ') || 'bodyweight';
  const instructions = exercise.instructions || '';

  return `Generate an image of a CRASH TEST DUMMY performing the exercise "${name}".

CRITICAL: The figure MUST be a classic automotive crash test dummy - the kind used in car safety testing. It has:
- A smooth, featureless yellow/orange head with NO face (just a round head)
- Black and yellow circular target markers on the chest, knees, and shoulders
- A segmented, articulated body made of metal and rubber
- The classic crash test dummy color scheme: yellow body with black markings/stripes
- NO human skin, NO muscles visible, NO anatomical details - just a mechanical test dummy

The crash test dummy is performing "${name}" in the KEY POSITION of the exercise.

Exercise details:
- Category: ${category}
- Primary muscles: ${muscles}
- Equipment: ${equipment || 'none'}
- Movement: ${instructions}

Style requirements:
- Clean white background
- Professional fitness illustration style, cartoon-like
- If equipment is used (${equipment || 'none'}), show it clearly
- No text, no labels, no watermarks
- Square format, centered composition
- The dummy should demonstrate proper form for this exercise`;
}

async function main() {
  // Read audit results
  if (!fs.existsSync('audit-results.json')) {
    console.error('audit-results.json not found. Run audit-exercise-images.js first.');
    process.exit(1);
  }
  const audit = JSON.parse(fs.readFileSync('audit-results.json', 'utf8'));

  // Combine bad + error exercises
  const allIds = [
    ...audit.badExercises.map(e => e.id),
    ...audit.errorExercises.map(e => e.id),
  ];

  console.log(`=== Fix Exercise Images ===`);
  console.log(`Bad: ${audit.badExercises.length}, Errors: ${audit.errorExercises.length}, Total: ${allIds.length}`);

  // Fetch full exercise data for these IDs
  const idsToFix = allIds.slice(START, START + LIMIT);
  console.log(`Processing ${idsToFix.length} exercises (start=${START}, limit=${LIMIT})`);

  if (DRY_RUN) {
    const names = [...audit.badExercises, ...audit.errorExercises].slice(START, START + LIMIT);
    names.forEach((e, i) => console.log(`  ${i + 1}. ${e.name}`));
    console.log('DRY RUN — no images generated');
    return;
  }

  let success = 0, failed = 0;
  for (let i = 0; i < idsToFix.length; i++) {
    const id = idsToFix[i];

    // Fetch exercise details from DB
    const res = await supabase('GET', `/rest/v1/mf_exercises?select=id,name,category,primary_muscles,equipment,instructions&id=eq.${id}`);
    const ex = (res.data || [])[0];
    if (!ex) { console.log(`[${i+1}/${idsToFix.length}] ID ${id} — not found in DB`); failed++; continue; }

    const slug = ex.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
    console.log(`\n[${i + 1}/${idsToFix.length}] ${ex.name}...`);

    try {
      const prompt = buildPrompt(ex);
      const img = await geminiGenerateImage(prompt);
      if (!img) { failed++; continue; }

      const mediaUrl = await uploadToMedia(img.base64, img.mimeType, `exercise-${slug}`);
      if (!mediaUrl) { failed++; continue; }

      await supabase('PATCH', `/rest/v1/mf_exercises?id=eq.${id}`, { image_url: mediaUrl });
      console.log(`  OK: ${mediaUrl}`);
      success++;

      // Rate limit: 3 seconds between Gemini requests
      if (i < idsToFix.length - 1) await new Promise(r => setTimeout(r, 3000));
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n=== DONE ===`);
  console.log(`Success: ${success}, Failed: ${failed}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
