/**
 * Audit exercise images using Claude Vision via media.stproperties.com/api/analyze-image
 * Identifies images that are NOT crash test dummies and regenerates them
 *
 * Usage: node audit-exercise-images.js [--audit-only] [--fix] [--start N] [--limit N]
 *   --audit-only   Only audit, don't regenerate (default)
 *   --fix          Audit AND regenerate bad images
 *   --start N      Start offset for exercises
 *   --limit N      Max exercises to process (default: all)
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
const FIX = args.includes('--fix');
const START = getArg('start') || 0;
const LIMIT = getArg('limit') || 9999;

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

async function analyzeImage(imageUrl) {
  // Extract mediaId from URL like https://media.stproperties.com/media/ABC123
  const mediaId = imageUrl.split('/media/').pop();
  if (!mediaId) { console.error('  Cannot extract mediaId from:', imageUrl); return null; }

  const body = JSON.stringify({
    mediaId,
    prompt: 'Does this image show a stylized mannequin, crash test dummy, or robot figure performing an exercise? Answer "YES" if the figure is a non-human mannequin/dummy/robot (yellow, mechanical, segmented, cartoon-like). Answer "NO" if it shows a real human, anatomical diagram with visible muscles/organs, medical illustration, skeleton, or realistic human body. Answer ONLY "YES" or "NO".'
  });
  const res = await httpReq('POST', MEDIA_URL + '/api/analyze-image', {
    'Authorization': 'Bearer ' + MEDIA_TOKEN,
    'Content-Type': 'application/json',
  }, body);
  if (res.status === 200 && res.data?.analysis) {
    const answer = res.data.analysis.trim().toUpperCase();
    return answer.startsWith('YES');
  }
  console.error('  Analysis error:', res.status, typeof res.data === 'object' ? JSON.stringify(res.data).slice(0, 200) : '');
  return null; // unknown
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
  console.log('=== Exercise Image Audit ===');
  console.log(`Mode: ${FIX ? 'AUDIT + FIX' : 'AUDIT ONLY'}`);

  // Fetch ALL exercises that have images
  const res = await supabase('GET', `/rest/v1/mf_exercises?select=id,name,category,primary_muscles,equipment,instructions,image_url&image_url=not.is.null&order=name&offset=${START}&limit=${LIMIT}`);
  const exercises = res.data || [];
  console.log(`Found ${exercises.length} exercises with images\n`);

  const good = [], bad = [], errors = [];

  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];
    process.stdout.write(`[${i + 1}/${exercises.length}] ${ex.name}... `);

    try {
      const isCrashDummy = await analyzeImage(ex.image_url);
      if (isCrashDummy === null) {
        console.log('ANALYSIS ERROR');
        errors.push(ex);
      } else if (isCrashDummy) {
        console.log('OK ✓');
        good.push(ex);
      } else {
        console.log('BAD ✗ — not a crash test dummy');
        bad.push(ex);

        if (FIX) {
          console.log('  Regenerating...');
          const prompt = buildPrompt(ex);
          const img = await geminiGenerateImage(prompt);
          if (!img) { console.log('  FAILED to generate'); continue; }

          const slug = ex.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
          const mediaUrl = await uploadToMedia(img.base64, img.mimeType, `exercise-${slug}`);
          if (!mediaUrl) { console.log('  FAILED to upload'); continue; }

          await supabase('PATCH', `/rest/v1/mf_exercises?id=eq.${ex.id}`, { image_url: mediaUrl });
          console.log(`  FIXED: ${mediaUrl}`);

          // Rate limit
          await new Promise(r => setTimeout(r, 2000));
        }
      }

      // Small delay between analysis calls
      if (i < exercises.length - 1) await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
      errors.push(ex);
    }
  }

  console.log('\n=== AUDIT RESULTS ===');
  console.log(`Good (crash test dummy): ${good.length}`);
  console.log(`Bad (not crash test dummy): ${bad.length}`);
  console.log(`Errors: ${errors.length}`);

  if (bad.length > 0) {
    console.log('\n--- BAD IMAGES (need regeneration) ---');
    bad.forEach(ex => console.log(`  - ${ex.name} (${ex.category}) — ${ex.image_url}`));
  }

  if (errors.length > 0) {
    console.log('\n--- ERRORS (could not analyze) ---');
    errors.forEach(ex => console.log(`  - ${ex.name} — ${ex.image_url}`));
  }

  // Save results to file
  const report = { timestamp: new Date().toISOString(), good: good.length, bad: bad.length, errors: errors.length, badExercises: bad.map(e => ({ id: e.id, name: e.name, category: e.category, image_url: e.image_url })), errorExercises: errors.map(e => ({ id: e.id, name: e.name })) };
  fs.writeFileSync('audit-results.json', JSON.stringify(report, null, 2));
  console.log('\nResults saved to audit-results.json');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
