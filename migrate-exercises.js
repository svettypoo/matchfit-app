const https = require('https');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const get = k => { const m = env.match(new RegExp('^' + k + '=(.+)', 'm')); return m ? m[1].trim().replace(/^"|"$/g, '') : null; };
const url = get('NEXT_PUBLIC_SUPABASE_URL');
const key = get('SUPABASE_SERVICE_ROLE_KEY');

function supabaseReq(method, path, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url + path);
    const data = body ? JSON.stringify(body) : '';
    const req = https.request(u, {
      method,
      headers: {
        'apikey': key,
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    }, (res) => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => {
        try { resolve(JSON.parse(b)); } catch { resolve(b); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function runSQL(sql) {
  return new Promise((resolve, reject) => {
    const u = new URL(url + '/rest/v1/rpc/exec_sql');
    const data = JSON.stringify({ query: sql });
    const req = https.request(u, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json',
      }
    }, (res) => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => {
        try { resolve(JSON.parse(b)); } catch { resolve(b); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// We'll use the REST API to attempt adding columns by inserting with them
// Since we can't run raw SQL easily, we'll try direct column additions via Supabase dashboard
// Instead, let's check if columns exist by trying to query them

async function main() {
  console.log('Checking current mf_exercises schema...');
  const { data, error } = await supabaseReq('GET', '/rest/v1/mf_exercises?select=*&limit=1', null);

  if (error) {
    console.log('Error:', error);
  } else if (Array.isArray(data) && data.length > 0) {
    console.log('Current columns:', Object.keys(data[0]).join(', '));
  } else {
    console.log('Table exists but is empty, or result:', JSON.stringify(data).substring(0, 300));
  }

  // Check if we need to add columns by looking at what exists
  const result = await supabaseReq('GET', '/rest/v1/mf_exercises?select=*&limit=1');
  if (Array.isArray(result) && result.length > 0) {
    const cols = Object.keys(result[0]);
    console.log('\nExisting columns:', cols.join(', '));

    const needed = ['exercise_type', 'tracking_fields', 'default_weight_kg', 'instructions', 'tips'];
    const missing = needed.filter(c => !cols.includes(c));
    console.log('Missing columns:', missing.join(', ') || 'none');
  } else {
    console.log('Result:', JSON.stringify(result).substring(0, 500));
  }
}

main().catch(console.error);
