/**
 * Migration: Add YouTube video URLs and image URLs to all exercises
 * Run: node migrate-exercise-media.js
 *
 * Uses YouTube thumbnails as exercise images when no custom image_url is set.
 * Videos sourced from popular fitness channels (MuscleWiki, Athlean-X, ScottHermanFitness, etc.)
 */

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
        'Prefer': 'return=minimal',
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

// YouTube video ID → full URL helper
const yt = (id) => `https://www.youtube.com/watch?v=${id}`;
// YouTube thumbnail as image
const ytThumb = (id) => `https://img.youtube.com/vi/${id}/mqdefault.jpg`;

// Curated exercise → YouTube video mapping
// Sources: ScottHermanFitness, Athlean-X, MuscleWiki, THENX, Bowflex, Howcast, etc.
const EXERCISE_MEDIA = {
  // === STRENGTH ===
  'Barbell Back Squat':        { vid: 'ultWZbUMPL8' }, // ScottHermanFitness
  'Barbell Deadlift':          { vid: 'op9kVnSso6Q' }, // Alan Thrall
  'Bench Press':               { vid: 'rT7DgCr-3pg' }, // ScottHermanFitness
  'Overhead Press':            { vid: '2yjwXTZQDDI' }, // Alan Thrall
  'Barbell Row':               { vid: 'kBWAon7ItDw' }, // ScottHermanFitness
  'Dumbbell Lunges':           { vid: 'D7KaRcUTQeE' }, // ScottHermanFitness
  'Romanian Deadlift (RDL)':   { vid: 'JCXUYQz7G8I' }, // Jeremy Ethier
  'Dumbbell Shoulder Press':   { vid: 'qEwKCR5JCog' }, // ScottHermanFitness
  'Goblet Squat':              { vid: 'MeIiIdhvXT4' }, // Bowflex
  'Lat Pulldown':              { vid: 'CAwf7n6Luuc' }, // ScottHermanFitness
  'Leg Press':                 { vid: 'IZxyjW7MPJQ' }, // ScottHermanFitness
  'Dumbbell Bicep Curl':       { vid: 'ykJmrZ5v0Oo' }, // ScottHermanFitness
  'Tricep Dips':               { vid: 'wjUmnZH528Y' }, // Calisthenicmovement
  'Bulgarian Split Squat':     { vid: '2C-uNgKwPLE' }, // Jeremy Ethier
  'Hip Thrust':                { vid: 'SEdqd1n0cvg' }, // Bret Contreras
  'Push-Ups':                  { vid: 'IODxDxX7oi4' }, // Calisthenicmovement
  'Pull-Ups':                  { vid: 'eGo4IYlbE5g' }, // Calisthenicmovement
  'Bodyweight Squats':         { vid: 'aclHkVaku9U' }, // Bowflex
  'Inverted Rows':             { vid: 'dYvY8JMFiXA' }, // Jeff Nippard
  'Kettlebell Swing':          { vid: 'YSxHifyI6s8' }, // Mark Wildman
  'Turkish Get-Up':            { vid: '0bWRPC49-KI' }, // StrongFirst
  'Battle Ropes':              { vid: 'bJPVyz_FSjc' }, // Bowflex
  'Farmers Walk':              { vid: 'Fkzk_RqlYig' }, // Alan Thrall
  'Wall Sit':                  { vid: 'y-wV4Lz6wJU' }, // Howcast
  'Step-Ups':                  { vid: 'dQqApCGd5Ag' }, // Bowflex
  'Calf Raises':               { vid: 'gwLzBJYoWlI' }, // ScottHermanFitness
  'Face Pulls':                { vid: 'rep-qVOkqgk' }, // Jeff Nippard

  // === CORE ===
  'Plank':                     { vid: 'ASdvN_XEl_c' }, // Bowflex
  'Dead Bug':                  { vid: 'I5xbRTx1jbg' }, // Bowflex
  'Russian Twist':             { vid: 'wkD8rjkodUI' }, // Bowflex
  'Bicycle Crunches':          { vid: '9FGilxCbdz8' }, // Bowflex
  'Hanging Leg Raise':         { vid: 'Pr1ieGZ5aFM' }, // Calisthenicmovement
  'Ab Rollout':                { vid: 'rqiTPdK1c_I' }, // Jeff Nippard
  'Side Plank':                { vid: 'K2VljzCC16g' }, // Bowflex
  'Bear Crawl':                { vid: 'Vc0ufKzgFWo' }, // Bowflex
  'Wheelbarrow Walk':          { vid: 'pJqSQ0WVSRU' }, // FitnessBlender
  'Partner Leg Throws':        { vid: 'OMb7SMRWD4Q' }, // FitnessBlender

  // === PLYOMETRICS ===
  'Box Jumps':                 { vid: '52r_Ul5k03g' }, // CrossFit
  'Depth Jumps':               { vid: 'ax2ixEy6pCg' }, // NSCA
  'Jump Squats':               { vid: 'A-cFYGvaKjE' }, // Bowflex
  'Lateral Bounds':            { vid: 'S0rB5yjFJ5c' }, // ACE Fitness
  'Tuck Jumps':                { vid: 'nJZGimNGzDo' }, // Howcast
  'Broad Jump':                { vid: 'kd08WBbhFP0' }, // NSCA
  'Burpees':                   { vid: 'dZgVxmf6jkA' }, // CrossFit
  'Medicine Ball Slam':        { vid: 'hTBnGOBVkFg' }, // Bowflex
  'Partner Medicine Ball Toss':{ vid: 'sDyGJaGjDX4' }, // ACE Fitness

  // === SPEED ===
  '40-Yard Sprint':            { vid: 'hPizRLLGb_A' }, // STACK
  'Hill Sprints':              { vid: 'DggPMwDaqhA' }, // Garage Strength
  'Sprint Intervals (100m)':   { vid: 'vPGSaNu0zHE' }, // The Run Experience
  'Acceleration Drills (20m)': { vid: 'K64_JgvRx8g' }, // EXOS
  'Running - 5K':              { vid: 'brFHyOtTwH4' }, // The Run Experience
  'Interval Training (HIIT)':  { vid: 'ml6cT4AZdqI' }, // THENX
  'Rowing Machine':            { vid: 'EYugLdG-f-8' }, // Concept2
  'Jump Rope':                 { vid: 'FJmRQ5iTXKE' }, // Jump Rope Dudes
  'Partner Resistance Sprints':{ vid: 'qIYE3yl9zb8' }, // STACK

  // === AGILITY ===
  'Ladder Drills - In-Out':    { vid: 'xJNmFxOfv2M' }, // STACK
  'T-Drill':                   { vid: 'BkO50kfDKdI' }, // STACK
  'Pro Agility (5-10-5)':      { vid: 'P7jOfWqfNsk' }, // EXOS
  'Cone Shuttle':              { vid: 'EPFbM_5Bu4k' }, // STACK
  'Reactive Agility Drill':    { vid: 'y1WK8XKUD0I' }, // STACK
  'Mirror Drill':              { vid: 'qSO5sXCGI24' }, // STACK

  // === FLEXIBILITY ===
  'Hip Flexor Stretch':        { vid: 'YQmpO9VT2X4' }, // Tom Merrick
  'Hamstring Stretch (Standing)': { vid: 'FDwpEdxZ3H4' }, // Tom Merrick
  'Pigeon Stretch':            { vid: 'MWjWLMSX_iQ' }, // Tom Merrick
  'World Greatest Stretch':    { vid: 'u1sfPmsnwwU' }, // ATHLEAN-X
  'Foam Rolling - IT Band':    { vid: 'RhLbGxPECWE' }, // Tom Merrick
  'Thoracic Spine Rotation':   { vid: 'MrHsxDJm0Ps' }, // Tom Merrick

  // === RECOVERY ===
  'Light Jog Cooldown':        { vid: 'nAMO2hrbVKE' }, // The Run Experience
  'Static Stretching Routine': { vid: 'g_tea8ZNtKc' }, // Tom Merrick
  'Yoga Flow':                 { vid: 'oBu-pQG6aR8' }, // Yoga With Adriene

  // === BALL WORK ===
  'Dribbling Cone Weave':      { vid: 'iHLUE2L3m1I' }, // Unisport
  'Passing Drills (Wall)':     { vid: 'GYaul8Mnzx0' }, // 7mlc
  'Rondo (Keep-Away)':         { vid: 'cP5MHk8-6dI' }, // MedFootTV
  'Shooting Practice':         { vid: 'JlYnMoYiEWM' }, // Unisport
  'Juggling':                  { vid: 'wUz5EfRVLbE' }, // Unisport
  '1v1 Attacking':             { vid: 'qCVGD_xqf3M' }, // 7mlc
};

async function run() {
  console.log('Fetching current exercises...');
  const res = await supabaseReq('GET', '/rest/v1/mf_exercises?select=id,name,video_url,image_url');

  if (!Array.isArray(res.data)) {
    console.error('Failed to fetch exercises:', res);
    return;
  }

  console.log(`Found ${res.data.length} exercises in DB\n`);

  let updated = 0, skipped = 0, notFound = 0;

  for (const ex of res.data) {
    const media = EXERCISE_MEDIA[ex.name];
    if (!media) {
      console.log(`  ⚠️  No video mapped: "${ex.name}"`);
      notFound++;
      continue;
    }

    const videoUrl = yt(media.vid);
    const imageUrl = media.img || ytThumb(media.vid);

    // Only update if video_url is missing or different
    if (ex.video_url === videoUrl && ex.image_url === imageUrl) {
      skipped++;
      continue;
    }

    const patchRes = await supabaseReq(
      'PATCH',
      `/rest/v1/mf_exercises?name=eq.${encodeURIComponent(ex.name)}`,
      { video_url: videoUrl, image_url: imageUrl }
    );

    if (patchRes.status >= 200 && patchRes.status < 300) {
      console.log(`  ✅ ${ex.name} → ${media.vid}`);
      updated++;
    } else {
      console.log(`  ❌ Failed: ${ex.name}`, patchRes.status, patchRes.data);
    }
  }

  console.log(`\nDone! Updated: ${updated}, Skipped (already set): ${skipped}, No video mapped: ${notFound}`);
}

run().catch(console.error);
