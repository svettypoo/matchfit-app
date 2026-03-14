const https = require('https');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const get = k => { const m = env.match(new RegExp('^' + k + '=(.+)', 'm')); return m ? m[1].trim().replace(/^"|"$/g, '') : null; };
const url = get('NEXT_PUBLIC_SUPABASE_URL');
const key = get('SUPABASE_SERVICE_ROLE_KEY');

function api(method, path, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url + path);
    const data = body ? JSON.stringify(body) : '';
    const req = https.request(u, { method, headers: { 'apikey': key, 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json', 'Prefer': method === 'POST' ? 'return=representation' : 'return=minimal' } }, res => { let b = ''; res.on('data', d => b += d); res.on('end', () => { try { resolve(JSON.parse(b)); } catch { resolve(b); } }); });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function img(n) { return 'https://picsum.photos/seed/'+encodeURIComponent(n.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,''))+'/400/300'; }

const RAW = [
  ['Sissy Squat','strength','intermediate',['quadriceps'],['core'],['bodyweight'],3,10,0,60,false,0,'independent','Lean back squatting on toes for quad isolation.'],
  ['Pin Squat','strength','advanced',['quadriceps','glutes'],['core','hamstrings'],['barbell','squat rack'],4,5,70,120,false,0,'independent','Squat from dead stop on safety pins.'],
  ['Anderson Squat','strength','advanced',['quadriceps','glutes'],['core'],['barbell','squat rack'],4,3,80,150,false,0,'independent','Start from bottom on pins for concentric strength.'],
  ['Floor Press','strength','intermediate',['chest','triceps'],['shoulders'],['barbell'],3,8,50,90,false,0,'independent','Bench press on floor for partial ROM tricep emphasis.'],
  ['Svend Press','strength','beginner',['chest','front deltoids'],['core'],['plates'],3,12,10,45,false,0,'independent','Squeeze plates together pressing forward at chest height.'],
  ['Tate Press','strength','intermediate',['triceps'],['chest'],['dumbbells'],3,12,10,45,false,0,'independent','Lower dumbbells to chest then extend for tricep isolation.'],
  ['JM Press','strength','advanced',['triceps'],['chest','shoulders'],['barbell','bench'],3,8,40,90,false,0,'independent','Hybrid skull crusher and close-grip bench for triceps.'],
  ['Barbell Hip Thrust','strength','intermediate',['glutes'],['hamstrings','core'],['barbell','bench'],4,10,60,90,false,0,'independent','Drive hips up with bar across lap for glute hypertrophy.'],
  ['Body Saw','core','advanced',['core','abs'],['shoulders','lats'],['sliders'],3,10,0,60,false,0,'independent','Forearm plank sliding feet back and forward.'],
  ['Dead Bug Pullover','core','intermediate',['abs','core'],['shoulders','lats'],['dumbbell'],3,10,8,45,false,0,'independent','Dead bug holding weight overhead for anti-extension.'],
  ['Half Kneeling Chop','core','intermediate',['obliques','core'],['shoulders'],['cable machine'],3,10,10,45,false,0,'independent','Diagonal chop in half kneeling for rotational stability.'],
  ['Hollow Sprint','speed','advanced',['quadriceps','glutes','hamstrings'],['core','calves'],['cones'],4,1,0,120,true,6,'independent','Sprint from hollow body hold position.'],
  ['Pop-Up Sprint','speed','intermediate',['quadriceps','glutes'],['core','calves'],['bodyweight'],6,1,0,90,true,5,'independent','Start lying face down then explode into sprint.'],
  ['N Drill','agility','intermediate',['quadriceps','calves','glutes'],['core','hamstrings'],['cones'],4,1,0,90,true,10,'independent','Sprint in N-shaped pattern between four cones.'],
  ['Hexagon Drill','agility','beginner',['calves','quadriceps'],['core','hip flexors'],['tape'],4,2,0,60,true,10,'independent','Jump in and out of hexagon shape on ground.'],
  ['Compass Drill','agility','intermediate',['quadriceps','calves','glutes'],['core','hip flexors'],['cones'],4,2,0,60,true,12,'independent','Sprint to cones placed at compass points around center.'],
  ['Chip Pass','ball_work','intermediate',['quadriceps','calves'],['core'],['football'],3,10,0,30,false,0,'independent','Lift ball with backspin for delicate passing.'],
  ['Outside Foot Pass','ball_work','intermediate',['calves','ankle'],['quadriceps'],['football'],3,15,0,30,false,0,'independent','Pass using outside of foot for disguised distribution.'],
  ['Scissors Dribble','ball_work','intermediate',['hip flexors','calves'],['core'],['football','cones'],3,8,0,45,false,0,'independent','Multiple scissor moves in sequence while dribbling.'],
  ['Heel Flick','ball_work','advanced',['hamstrings','calves'],['core'],['football'],3,8,0,45,false,0,'independent','Flick ball with heel to change direction quickly.'],
  ['Split Squat Jump','plyometrics','intermediate',['quadriceps','glutes'],['calves','core'],['bodyweight'],3,10,0,60,false,0,'independent','Jump from split stance switching legs in air.'],
  ['Pike Jump','plyometrics','intermediate',['abs','hip flexors','calves'],['quadriceps'],['bodyweight'],3,8,0,60,false,0,'independent','Jump bringing legs up to touch toes in pike.'],
  ['Single Leg Lateral Hop','plyometrics','intermediate',['calves','quadriceps','glutes'],['core'],['bodyweight'],3,10,0,45,false,0,'independent','Hop side to side on one foot for lateral stability.'],
  ['Standing Side Bend','flexibility','beginner',['obliques','lats'],['core'],['bodyweight'],2,0,0,15,true,20,'independent','Reach one arm over head bending to opposite side.'],
  ['Forward Lunge Stretch','flexibility','beginner',['hip flexors','quadriceps'],['hamstrings'],['bodyweight'],2,0,0,15,true,30,'independent','Deep lunge holding stretch at bottom.'],
  ['Seated Figure 4','flexibility','beginner',['glutes','piriformis'],['lower back'],['chair'],2,0,0,15,true,30,'independent','Seated crossing ankle over knee pressing knee down.'],
  ['Tennis Ball Foot Roll','recovery','beginner',['plantar fascia'],['calves'],['tennis ball'],1,0,0,0,true,60,'independent','Roll tennis ball under foot for plantar release.'],
  ['Neck Roll','recovery','beginner',['neck','traps'],['upper back'],['bodyweight'],2,5,0,10,false,0,'independent','Gentle neck circles for cervical mobility.'],
  ['Shoulder Shrug Release','recovery','beginner',['traps','shoulders'],['neck'],['bodyweight'],2,10,0,10,false,0,'independent','Shrug shoulders hold 3s then release fully.'],
  ['Spinal Decompression Hang','recovery','beginner',['spine','lats'],['shoulders'],['pull-up bar'],2,0,0,15,true,30,'independent','Hang from bar relaxing for spinal traction.'],
];

const exercises = RAW.map(e => {
  const [name,cat,diff,pm,sm,equip,sets,reps,wt,rest,timed,dur,type,desc] = e;
  return { name, description: desc, category: cat, difficulty: diff, exercise_type: type, primary_muscles: pm, secondary_muscles: sm, muscle_groups: [...pm,...sm], equipment: equip, default_sets: sets, default_reps: timed ? null : (reps||null), default_weight_kg: wt||null, default_rest_sec: rest||60, is_timed: timed, default_duration_sec: timed ? (dur||30) : null, instructions: '1. Set up correctly\n2. Perform with good form\n3. Complete prescribed reps\n4. Rest and repeat', tips: 'Focus on form over speed or weight.', image_url: img(name), coach_id: null, maturity_safe: ['pre_phv','phv','post_phv'], tracking_fields: timed ? ['duration','rpe'] : ['sets','reps','weight','rpe'] };
});

async function main() {
  const existing = await api('GET', '/rest/v1/mf_exercises?select=name');
  const nameSet = new Set((Array.isArray(existing)?existing:[]).map(e=>e.name));
  const toInsert = exercises.filter(e => !nameSet.has(e.name));
  console.log('Inserting', toInsert.length, 'new exercises ('+( exercises.length - toInsert.length)+' dupes skipped)...');
  let total = 0;
  for (let i = 0; i < toInsert.length; i += 25) {
    const chunk = toInsert.slice(i, i + 25);
    const res = await api('POST', '/rest/v1/mf_exercises', chunk);
    if (Array.isArray(res)) { total += res.length; console.log('  Batch', Math.floor(i/25)+1, ':', res.length); }
    else console.log('  ERROR:', JSON.stringify(res).slice(0,200));
  }
  const final = await api('GET', '/rest/v1/mf_exercises?select=id,category');
  const cats = {};
  if (Array.isArray(final)) final.forEach(e => { cats[e.category] = (cats[e.category]||0)+1; });
  console.log('\nTOTAL:', Array.isArray(final)?final.length:0);
  console.log('Categories:', cats);
}
main().catch(console.error);
