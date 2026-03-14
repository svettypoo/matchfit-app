/**
 * Generate exercise animation GIFs using Gemini image generation
 * For each exercise: generates 2 keyframe images (start + end position),
 * combines them into an animated GIF via ffmpeg on Dream exec server,
 * uploads to media.stproperties.com, and updates mf_exercises.animation_url
 *
 * Usage: node generate-exercise-animations.js [--start N] [--limit N] [--dry-run]
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
const EXEC_URL = 'https://exec.stproperties.com';
const EXEC_TOKEN = 'svets-exec-token-2026';

const args = process.argv.slice(2);
const getArg = (name) => { const i = args.indexOf('--' + name); return i >= 0 && args[i + 1] ? parseInt(args[i + 1]) : null; };
const START = getArg('start') || 0;
const LIMIT = getArg('limit') || 10;
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
    req.setTimeout(180000, () => { req.destroy(); reject(new Error('timeout')); });
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
    console.error('    Gemini error:', res.status, typeof res.data === 'object' ? JSON.stringify(res.data).slice(0, 200) : '');
    return null;
  }
  const parts = res.data?.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.mimeType?.startsWith('image/')) {
      return { base64: part.inlineData.data, mimeType: part.inlineData.mimeType };
    }
  }
  console.error('    No image in Gemini response');
  return null;
}

async function uploadToMedia(base64Data, mimeType, filename) {
  const ext = mimeType.includes('png') ? 'png' : mimeType.includes('gif') ? 'gif' : 'jpg';
  const body = JSON.stringify({ base64: base64Data, filename: filename + '.' + ext, source: 'gemini-exercise-anim' });
  const res = await httpReq('POST', MEDIA_URL + '/upload', {
    'Authorization': 'Bearer ' + MEDIA_TOKEN,
    'Content-Type': 'application/json',
  }, body);
  if (res.status === 200 && res.data?.url) return res.data.url;
  console.error('    Upload error:', res.status);
  return null;
}

// Run a shell command on the Dream exec server — returns plain text output
async function execOnDream(command, timeout = 30000) {
  const res = await httpReq('POST', EXEC_URL + '/run', {
    'Authorization': 'Bearer ' + EXEC_TOKEN,
    'Content-Type': 'application/json',
  }, JSON.stringify({ command, timeout }));
  // /run returns plain text, not JSON — data is a Buffer
  const output = Buffer.isBuffer(res.data) ? res.data.toString() : (typeof res.data === 'string' ? res.data : JSON.stringify(res.data));
  return { status: res.status, output };
}

function buildKeyframePrompt(exercise, position) {
  const name = exercise.name;
  const category = exercise.category;
  const muscles = (exercise.primary_muscles || []).join(', ');
  const equipment = (exercise.equipment || []).join(', ') || 'bodyweight';

  const posDesc = position === 'start'
    ? `the STARTING position of the exercise (before the movement begins)`
    : `the END/PEAK position of the exercise (at full contraction or extension)`;

  return `Generate an image of a CRASH TEST DUMMY in ${posDesc} for "${name}".

CRITICAL: The figure MUST be a classic automotive crash test dummy:
- Smooth, featureless yellow/orange head with NO face
- Black and yellow circular target markers on chest, knees, shoulders
- Segmented, articulated body made of metal and rubber
- Yellow body with black markings/stripes
- NO human skin, NO muscles visible, NO anatomical details

The crash test dummy is in ${posDesc}.
Exercise: "${name}" (${category})
Equipment: ${equipment}
Muscles: ${muscles}

Style: Clean white background, professional fitness illustration, cartoon-like.
No text, no labels, no watermarks. Square format, centered.
The dummy should demonstrate proper form.
IMPORTANT: Keep the camera angle and framing IDENTICAL — only the body position changes.`;
}

async function main() {
  console.log('=== Generate Exercise Animations ===');
  console.log(`Batch: start=${START}, limit=${LIMIT}, dryRun=${DRY_RUN}\n`);

  // Fetch exercises without animations
  const res = await supabase('GET', `/rest/v1/mf_exercises?select=id,name,category,primary_muscles,equipment,instructions,image_url&animation_url=is.null&order=name&offset=${START}&limit=${LIMIT}`);
  const exercises = res.data || [];
  console.log(`Found ${exercises.length} exercises without animations\n`);

  if (DRY_RUN) {
    exercises.forEach((e, i) => console.log(`  ${i + 1}. ${e.name} (${e.category})`));
    console.log('\nDRY RUN — no animations generated');
    return;
  }

  let success = 0, failed = 0;
  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];
    const slug = ex.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
    console.log(`\n[${i + 1}/${exercises.length}] ${ex.name}...`);

    try {
      // Step 1: Generate start position
      console.log('  Generating start frame...');
      const startPrompt = buildKeyframePrompt(ex, 'start');
      const startImg = await geminiGenerateImage(startPrompt);
      if (!startImg) { console.log('  SKIP: failed to generate start frame'); failed++; continue; }

      // Rate limit between Gemini calls
      await new Promise(r => setTimeout(r, 2000));

      // Step 2: Generate end position
      console.log('  Generating end frame...');
      const endPrompt = buildKeyframePrompt(ex, 'end');
      const endImg = await geminiGenerateImage(endPrompt);
      if (!endImg) { console.log('  SKIP: failed to generate end frame'); failed++; continue; }

      // Step 3: Upload both frames to media server
      console.log('  Uploading frames...');
      const frame1Url = await uploadToMedia(startImg.base64, startImg.mimeType, `anim-${slug}-start`);
      const frame2Url = await uploadToMedia(endImg.base64, endImg.mimeType, `anim-${slug}-end`);
      if (!frame1Url || !frame2Url) { console.log('  SKIP: failed to upload frames'); failed++; continue; }

      // Step 4: Create GIF on Dream exec server using ffmpeg
      console.log('  Creating GIF on Dream...');
      const gifCmd = `cd /tmp && curl -sL "${frame1Url}" -o anim_f1.png && curl -sL "${frame2Url}" -o anim_f2.png && ffmpeg -y -loop 1 -t 0.8 -i anim_f1.png -loop 1 -t 0.8 -i anim_f2.png -filter_complex "[0:v]scale=400:400:force_original_aspect_ratio=decrease,pad=400:400:(ow-iw)/2:(oh-ih)/2:white[v0];[1:v]scale=400:400:force_original_aspect_ratio=decrease,pad=400:400:(ow-iw)/2:(oh-ih)/2:white[v1];[v0][v1]concat=n=2:v=1:a=0,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3" anim_out.gif 2>/dev/null && cat anim_out.gif | base64 -w0`;

      const gifRes = await execOnDream(gifCmd, 60000);

      let gifBase64 = null;
      if (gifRes.status === 200 && gifRes.output) {
        // Output is plain text — last line before [exit: 0] should be the base64
        const lines = gifRes.output.trim().split('\n');
        for (let li = lines.length - 1; li >= 0; li--) {
          const line = lines[li].trim();
          if (line.startsWith('[exit:')) continue;
          if (line.length > 100) { gifBase64 = line; break; }
        }
      }

      if (!gifBase64) {
        // Fallback: store animation as JSON array of frame URLs
        console.log('  GIF creation failed, storing frame URLs instead');
        const animData = JSON.stringify([frame1Url, frame2Url]);
        await supabase('PATCH', `/rest/v1/mf_exercises?id=eq.${ex.id}`, { animation_url: animData });
        console.log(`  OK (frames): ${frame1Url}, ${frame2Url}`);
        success++;
        if (i < exercises.length - 1) await new Promise(r => setTimeout(r, 2000));
        continue;
      }

      // Step 5: Upload GIF to media server
      const gifUrl = await uploadToMedia(gifBase64, 'image/gif', `exercise-anim-${slug}`);
      if (!gifUrl) {
        // Fallback to frame URLs
        const animData = JSON.stringify([frame1Url, frame2Url]);
        await supabase('PATCH', `/rest/v1/mf_exercises?id=eq.${ex.id}`, { animation_url: animData });
        console.log(`  OK (frames fallback): ${frame1Url}, ${frame2Url}`);
        success++;
        continue;
      }

      // Step 6: Update DB
      await supabase('PATCH', `/rest/v1/mf_exercises?id=eq.${ex.id}`, { animation_url: gifUrl });
      console.log(`  OK: ${gifUrl}`);
      success++;

      // Rate limit
      if (i < exercises.length - 1) await new Promise(r => setTimeout(r, 3000));
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n=== DONE ===`);
  console.log(`Success: ${success}, Failed: ${failed}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
