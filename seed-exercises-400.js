const https = require('https');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const get = k => { const m = env.match(new RegExp('^' + k + '=(.+)', 'm')); return m ? m[1].trim().replace(/^"|"$/g, '') : null; };
const url = get('NEXT_PUBLIC_SUPABASE_URL');
const key = get('SUPABASE_SERVICE_ROLE_KEY');

function supabaseReq(method, path, body, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url + path);
    const data = body ? JSON.stringify(body) : '';
    const req = https.request(u, {
      method,
      headers: {
        'apikey': key,
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json',
        'Prefer': method === 'POST' ? 'return=representation' : 'return=minimal',
        ...extraHeaders,
      }
    }, (res) => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(b) }); } catch { resolve({ status: res.statusCode, data: b }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// Load all exercise batches
const exercises = [];
for (const f of ['exercises-batch1.json', 'exercises-batch2.json', 'exercises-batch3.json', 'exercises-batch4.json', 'exercises-batch5.json']) {
  exercises.push(...JSON.parse(fs.readFileSync(f, 'utf8')));
}
console.log(`Loaded ${exercises.length} exercises from 5 batch files`);

// Normalize exercises for DB insert
function normalize(ex) {
  return {
    name: ex.name,
    description: ex.description || ex.instructions || '',
    category: ex.category,
    muscle_groups: ex.muscle_groups || [],
    equipment: ex.equipment || [],
    difficulty: ex.difficulty || 'intermediate',
    is_timed: ex.is_timed || false,
    default_sets: ex.default_sets || 3,
    default_reps: ex.default_reps || 10,
    default_duration_sec: ex.default_duration_sec || null,
    default_rest_sec: ex.default_rest_sec || 60,
    default_weight_kg: ex.default_weight_kg || null,
    tracking_fields: ex.tracking_fields || (ex.default_weight_kg ? ['weight', 'reps', 'rpe'] : ex.is_timed ? ['duration'] : ['reps', 'rpe']),
    primary_muscles: ex.primary_muscles || [],
    secondary_muscles: ex.secondary_muscles || [],
    instructions: ex.instructions || '',
    tips: ex.tips || '',
    exercise_type: ex.exercise_type || 'standard',
    icon_name: ex.icon_name || 'barbell',
    coach_id: null,
  };
}

async function main() {
  // Step 1: Delete all default (non-coach) exercises
  console.log('Deleting existing default exercises...');
  const del = await supabaseReq('DELETE', '/rest/v1/mf_exercises?coach_id=is.null', null);
  console.log(`Delete result: ${del.status}`);

  // Step 2: Insert in batches of 50
  const BATCH_SIZE = 50;
  let inserted = 0;
  for (let i = 0; i < exercises.length; i += BATCH_SIZE) {
    const batch = exercises.slice(i, i + BATCH_SIZE).map(normalize);
    const res = await supabaseReq('POST', '/rest/v1/mf_exercises', batch);
    if (res.status >= 200 && res.status < 300) {
      inserted += batch.length;
      console.log(`  Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} exercises (${inserted}/${exercises.length})`);
    } else {
      console.error(`  ERROR batch ${Math.floor(i / BATCH_SIZE) + 1}:`, res.status, JSON.stringify(res.data).slice(0, 200));
    }
  }

  console.log(`\nDone! Inserted ${inserted}/${exercises.length} exercises.`);

  // Verify count
  const count = await supabaseReq('GET', '/rest/v1/mf_exercises?select=id&coach_id=is.null', null, { 'Prefer': 'count=exact' });
  console.log(`DB count (default exercises): ${Array.isArray(count.data) ? count.data.length : 'unknown'}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
