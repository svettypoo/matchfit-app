const https = require('https');
const fs = require('fs');

const SUPABASE_ACCESS_TOKEN = 'sbp_803303e69c9d5ad01cf12adcc6ad17747bd38d03';
const PROJECT_REF = 'xocfduqugghailalzlqy';

const sql = `
ALTER TABLE mf_exercises
  ADD COLUMN IF NOT EXISTS exercise_type text DEFAULT 'independent',
  ADD COLUMN IF NOT EXISTS tracking_fields jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS default_weight_kg numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS instructions text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tips text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS primary_muscles text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS secondary_muscles text[] DEFAULT '{}';

ALTER TABLE mf_exercise_logs
  ADD COLUMN IF NOT EXISTS rpe_logged integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS notes text DEFAULT NULL;
`;

const postData = JSON.stringify({ query: sql });

const req = https.request({
  hostname: 'api.supabase.com',
  path: `/v1/projects/${PROJECT_REF}/database/query`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
  }
}, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', body.substring(0, 500));
  });
});

req.on('error', err => console.error('Error:', err.message));
req.write(postData);
req.end();
