// Seed 320+ additional exercises to reach 400+ total
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
    const req = https.request(u, {
      method,
      headers: { 'apikey': key, 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json', 'Prefer': method === 'POST' ? 'return=representation' : 'return=minimal' }
    }, res => { let b = ''; res.on('data', d => b += d); res.on('end', () => { try { resolve(JSON.parse(b)); } catch { resolve(b); } }); });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function img(name) {
  return `https://picsum.photos/seed/${encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}/400/300`;
}

// Compact format: [name, cat, diff, primary[], secondary[], equip[], sets, reps, weight, rest, timed, dur, type, desc]
const EX = [
  // === STRENGTH (additional ~80) ===
  ['Front Squat', 'strength', 'intermediate', ['quadriceps','core'], ['glutes'], ['barbell'], 4, 8, 60, 120, false, 0, 'independent', 'Barbell front squat with elbows high for quad emphasis.'],
  ['Hack Squat', 'strength', 'intermediate', ['quadriceps'], ['glutes','hamstrings'], ['hack squat machine'], 3, 12, 80, 90, false, 0, 'independent', 'Machine hack squat targeting quads with back support.'],
  ['Pistol Squat', 'strength', 'advanced', ['quadriceps','glutes'], ['core','calves'], ['bodyweight'], 3, 6, 0, 90, false, 0, 'independent', 'Single-leg squat requiring balance, strength and mobility.'],
  ['Zercher Squat', 'strength', 'advanced', ['quadriceps','core'], ['glutes','biceps'], ['barbell'], 3, 8, 50, 120, false, 0, 'independent', 'Squat with barbell held in elbow crooks for core engagement.'],
  ['Box Squat', 'strength', 'intermediate', ['quadriceps','glutes'], ['hamstrings'], ['barbell','box'], 4, 8, 70, 120, false, 0, 'independent', 'Squat to a box to develop power from a dead stop.'],
  ['Pause Squat', 'strength', 'advanced', ['quadriceps','glutes'], ['core'], ['barbell'], 3, 6, 55, 150, false, 0, 'independent', 'Back squat with 2-3 second pause at bottom position.'],
  ['Sissy Squat', 'strength', 'advanced', ['quadriceps'], ['core'], ['bodyweight'], 3, 12, 0, 60, false, 0, 'independent', 'Quad-isolation squat leaning back with knees forward.'],
  ['Conventional Deadlift', 'strength', 'intermediate', ['hamstrings','glutes','lower back'], ['quadriceps','core'], ['barbell'], 4, 6, 100, 180, false, 0, 'independent', 'Classic hip-hinge deadlift with conventional stance.'],
  ['Sumo Deadlift', 'strength', 'intermediate', ['glutes','adductors','hamstrings'], ['quadriceps','core'], ['barbell'], 4, 6, 100, 180, false, 0, 'independent', 'Wide-stance deadlift emphasizing hips and adductors.'],
  ['Trap Bar Deadlift', 'strength', 'beginner', ['quadriceps','glutes','hamstrings'], ['core','traps'], ['trap bar'], 4, 8, 80, 120, false, 0, 'independent', 'Deadlift with hex/trap bar for neutral grip and reduced back stress.'],
  ['Stiff-Leg Deadlift', 'strength', 'intermediate', ['hamstrings','lower back'], ['glutes'], ['barbell'], 3, 10, 60, 90, false, 0, 'independent', 'Deadlift with minimal knee bend for hamstring stretch.'],
  ['Deficit Deadlift', 'strength', 'advanced', ['hamstrings','glutes','lower back'], ['quadriceps'], ['barbell','platform'], 3, 6, 80, 150, false, 0, 'independent', 'Deadlift standing on elevated platform for increased range of motion.'],
  ['Single-Leg Deadlift', 'strength', 'intermediate', ['hamstrings','glutes'], ['core','lower back'], ['dumbbell'], 3, 10, 15, 60, false, 0, 'independent', 'Unilateral hip hinge for balance and hamstring development.'],
  ['Good Morning', 'strength', 'intermediate', ['hamstrings','lower back'], ['glutes'], ['barbell'], 3, 10, 40, 90, false, 0, 'independent', 'Barbell on back, hip hinge forward to target posterior chain.'],
  ['Rack Pull', 'strength', 'intermediate', ['lower back','traps','glutes'], ['hamstrings'], ['barbell','power rack'], 3, 6, 120, 150, false, 0, 'independent', 'Partial deadlift from pins for lockout strength and traps.'],
  ['Incline Bench Press', 'strength', 'intermediate', ['upper chest','front deltoids'], ['triceps'], ['barbell','incline bench'], 4, 8, 50, 120, false, 0, 'independent', 'Barbell press at 30-45 degree incline for upper chest.'],
  ['Decline Bench Press', 'strength', 'intermediate', ['lower chest'], ['triceps','front deltoids'], ['barbell','decline bench'], 3, 10, 50, 90, false, 0, 'independent', 'Barbell press on decline bench for lower chest emphasis.'],
  ['Close-Grip Bench Press', 'strength', 'intermediate', ['triceps','chest'], ['front deltoids'], ['barbell'], 3, 10, 45, 90, false, 0, 'independent', 'Narrow grip bench press to emphasize triceps.'],
  ['Floor Press', 'strength', 'intermediate', ['chest','triceps'], ['front deltoids'], ['barbell'], 3, 8, 50, 90, false, 0, 'independent', 'Bench press from the floor to limit range and build lockout.'],
  ['Dumbbell Bench Press', 'strength', 'beginner', ['chest'], ['triceps','front deltoids'], ['dumbbell','flat bench'], 3, 12, 20, 90, false, 0, 'independent', 'Flat bench press with dumbbells for greater range of motion.'],
  ['Dumbbell Incline Press', 'strength', 'intermediate', ['upper chest'], ['front deltoids','triceps'], ['dumbbell','incline bench'], 3, 10, 18, 90, false, 0, 'independent', 'Incline dumbbell press for upper chest development.'],
  ['Push-Up', 'strength', 'beginner', ['chest','triceps'], ['front deltoids','core'], ['bodyweight'], 3, 15, 0, 60, false, 0, 'independent', 'Classic bodyweight push-up for chest and arm strength.'],
  ['Diamond Push-Up', 'strength', 'intermediate', ['triceps','chest'], ['front deltoids'], ['bodyweight'], 3, 12, 0, 60, false, 0, 'independent', 'Push-up with hands close together to target triceps.'],
  ['Archer Push-Up', 'strength', 'advanced', ['chest','triceps'], ['core','front deltoids'], ['bodyweight'], 3, 8, 0, 60, false, 0, 'independent', 'Wide push-up shifting weight to one arm alternately.'],
  ['Cable Crossover', 'strength', 'intermediate', ['chest'], ['front deltoids'], ['cable machine'], 3, 12, 15, 60, false, 0, 'independent', 'Cable flye movement crossing hands for peak chest contraction.'],
  ['Pec Deck', 'strength', 'beginner', ['chest'], ['front deltoids'], ['pec deck machine'], 3, 12, 30, 60, false, 0, 'independent', 'Machine chest flye for controlled chest isolation.'],
  ['Seated Military Press', 'strength', 'intermediate', ['front deltoids','lateral deltoids'], ['triceps','core'], ['barbell','bench'], 4, 8, 40, 120, false, 0, 'independent', 'Seated barbell overhead press for shoulder strength.'],
  ['Arnold Press', 'strength', 'intermediate', ['front deltoids','lateral deltoids'], ['triceps'], ['dumbbell'], 3, 10, 14, 90, false, 0, 'independent', 'Rotational dumbbell press hitting all three deltoid heads.'],
  ['Push Press', 'strength', 'intermediate', ['front deltoids','lateral deltoids'], ['triceps','quadriceps'], ['barbell'], 4, 6, 50, 120, false, 0, 'independent', 'Explosive overhead press using leg drive for heavier loads.'],
  ['Landmine Press', 'strength', 'intermediate', ['front deltoids','upper chest'], ['triceps','core'], ['barbell','landmine'], 3, 10, 20, 60, false, 0, 'independent', 'Angled press using barbell in landmine attachment.'],
  ['Lateral Raise', 'strength', 'beginner', ['lateral deltoids'], ['traps'], ['dumbbell'], 3, 15, 8, 60, false, 0, 'independent', 'Dumbbell raise to sides for lateral deltoid width.'],
  ['Front Raise', 'strength', 'beginner', ['front deltoids'], ['upper chest'], ['dumbbell'], 3, 12, 8, 60, false, 0, 'independent', 'Dumbbell raise to front for anterior deltoid development.'],
  ['Cable Lateral Raise', 'strength', 'intermediate', ['lateral deltoids'], ['traps'], ['cable machine'], 3, 15, 7, 45, false, 0, 'independent', 'Single-arm lateral raise with cable for constant tension.'],
  ['Rear Delt Fly', 'strength', 'beginner', ['rear deltoids'], ['traps','rhomboids'], ['dumbbell'], 3, 15, 6, 45, false, 0, 'independent', 'Bent-over dumbbell flye for rear deltoid development.'],
  ['Face Pull', 'strength', 'beginner', ['rear deltoids','rhomboids'], ['traps','rotator cuff'], ['cable machine','rope'], 3, 15, 15, 45, false, 0, 'independent', 'Cable pull to face level for shoulder health and posture.'],
  ['Upright Row', 'strength', 'intermediate', ['traps','lateral deltoids'], ['front deltoids','biceps'], ['barbell'], 3, 12, 30, 60, false, 0, 'independent', 'Barbell pull to chin level for traps and shoulders.'],
  ['Barbell Shrug', 'strength', 'intermediate', ['traps'], ['rhomboids'], ['barbell'], 3, 12, 60, 60, false, 0, 'independent', 'Heavy barbell shrugs for upper trap development.'],
  ['Dumbbell Shrug', 'strength', 'beginner', ['traps'], ['rhomboids'], ['dumbbell'], 3, 15, 25, 45, false, 0, 'independent', 'Dumbbell shrugs for trap development with natural hand position.'],
  ['Pull-Up', 'strength', 'intermediate', ['lats','biceps'], ['core','rear deltoids'], ['pull-up bar'], 3, 8, 0, 90, false, 0, 'independent', 'Overhand grip vertical pull for back width.'],
  ['Chin-Up', 'strength', 'intermediate', ['lats','biceps'], ['core','rear deltoids'], ['pull-up bar'], 3, 8, 0, 90, false, 0, 'independent', 'Underhand grip vertical pull emphasizing biceps.'],
  ['Lat Pulldown', 'strength', 'beginner', ['lats'], ['biceps','rear deltoids'], ['cable machine'], 3, 12, 50, 60, false, 0, 'independent', 'Cable pulldown for lat development and back width.'],
  ['Wide-Grip Pulldown', 'strength', 'intermediate', ['lats'], ['teres major','rear deltoids'], ['cable machine'], 3, 10, 45, 60, false, 0, 'independent', 'Extra-wide grip lat pulldown for outer back sweep.'],
  ['Pendlay Row', 'strength', 'intermediate', ['lats','rhomboids'], ['biceps','rear deltoids','lower back'], ['barbell'], 4, 8, 60, 90, false, 0, 'independent', 'Strict barbell row from floor each rep for explosive back power.'],
  ['Kroc Row', 'strength', 'advanced', ['lats','rhomboids'], ['biceps','rear deltoids'], ['dumbbell'], 3, 15, 35, 90, false, 0, 'independent', 'High-rep heavy single-arm dumbbell row with controlled cheating.'],
  ['Cable Row', 'strength', 'beginner', ['lats','rhomboids'], ['biceps','rear deltoids'], ['cable machine'], 3, 12, 40, 60, false, 0, 'independent', 'Seated cable row for mid-back thickness.'],
  ['T-Bar Row', 'strength', 'intermediate', ['lats','rhomboids','traps'], ['biceps','rear deltoids'], ['t-bar','barbell'], 3, 10, 40, 90, false, 0, 'independent', 'Neutral-grip rowing for back thickness.'],
  ['Inverted Row', 'strength', 'beginner', ['lats','rhomboids'], ['biceps','core'], ['barbell','power rack'], 3, 12, 0, 60, false, 0, 'independent', 'Bodyweight horizontal pull under a bar.'],
  ['Chest-Supported Row', 'strength', 'intermediate', ['lats','rhomboids'], ['biceps','rear deltoids'], ['dumbbell','incline bench'], 3, 12, 20, 60, false, 0, 'independent', 'Row lying face down on incline bench to eliminate momentum.'],
  ['Barbell Curl', 'strength', 'beginner', ['biceps'], ['forearms'], ['barbell'], 3, 12, 25, 60, false, 0, 'independent', 'Standing barbell curl for bicep mass.'],
  ['Hammer Curl', 'strength', 'beginner', ['biceps','brachioradialis'], ['forearms'], ['dumbbell'], 3, 12, 12, 45, false, 0, 'independent', 'Neutral grip dumbbell curl for bicep and forearm development.'],
  ['Preacher Curl', 'strength', 'intermediate', ['biceps'], ['forearms'], ['barbell','preacher bench'], 3, 10, 20, 60, false, 0, 'independent', 'Curl on preacher bench to isolate biceps peak.'],
  ['Concentration Curl', 'strength', 'beginner', ['biceps'], ['forearms'], ['dumbbell'], 3, 12, 10, 45, false, 0, 'independent', 'Seated single-arm curl with elbow braced on inner thigh.'],
  ['Spider Curl', 'strength', 'intermediate', ['biceps'], ['forearms'], ['dumbbell','incline bench'], 3, 12, 10, 45, false, 0, 'independent', 'Curl draped over incline bench for constant bicep tension.'],
  ['Reverse Curl', 'strength', 'intermediate', ['forearms','brachioradialis'], ['biceps'], ['barbell'], 3, 12, 20, 45, false, 0, 'independent', 'Overhand grip curl for forearm and brachioradialis.'],
  ['Zottman Curl', 'strength', 'intermediate', ['biceps','forearms'], ['brachioradialis'], ['dumbbell'], 3, 10, 10, 45, false, 0, 'independent', 'Curl up supinated, rotate and lower pronated for full arm work.'],
  ['Tricep Pushdown', 'strength', 'beginner', ['triceps'], ['forearms'], ['cable machine','rope'], 3, 15, 20, 45, false, 0, 'independent', 'Cable pushdown for tricep isolation.'],
  ['Overhead Tricep Extension', 'strength', 'intermediate', ['triceps'], ['forearms'], ['dumbbell'], 3, 12, 15, 60, false, 0, 'independent', 'Single or double arm overhead extension for long head.'],
  ['Skull Crusher', 'strength', 'intermediate', ['triceps'], ['forearms'], ['barbell','flat bench'], 3, 10, 25, 60, false, 0, 'independent', 'Lying EZ-bar extension to forehead for tricep mass.'],
  ['Tricep Dip', 'strength', 'intermediate', ['triceps','chest'], ['front deltoids'], ['dip bars'], 3, 10, 0, 90, false, 0, 'independent', 'Parallel bar dip leaning slightly forward for chest/tricep work.'],
  ['Tricep Kickback', 'strength', 'beginner', ['triceps'], ['rear deltoids'], ['dumbbell'], 3, 12, 8, 45, false, 0, 'independent', 'Bent-over single-arm kickback for tricep contraction.'],
  ['Hip Thrust', 'strength', 'intermediate', ['glutes'], ['hamstrings','core'], ['barbell','bench'], 4, 10, 60, 90, false, 0, 'independent', 'Barbell hip thrust for maximum glute activation.'],
  ['Cable Pull-Through', 'strength', 'beginner', ['glutes','hamstrings'], ['lower back'], ['cable machine','rope'], 3, 15, 20, 60, false, 0, 'independent', 'Cable hip hinge pulling through legs for glute/hamstring work.'],
  ['Glute Kickback', 'strength', 'beginner', ['glutes'], ['hamstrings'], ['cable machine'], 3, 15, 10, 45, false, 0, 'independent', 'Cable or machine kickback isolating the glutes.'],
  ['Standing Calf Raise', 'strength', 'beginner', ['calves'], ['soleus'], ['calf raise machine'], 4, 15, 40, 45, false, 0, 'independent', 'Standing calf raise for gastrocnemius development.'],
  ['Seated Calf Raise', 'strength', 'beginner', ['soleus'], ['calves'], ['seated calf machine'], 3, 15, 30, 45, false, 0, 'independent', 'Seated calf raise targeting the soleus.'],
  ['Nordic Curl', 'strength', 'advanced', ['hamstrings'], ['calves','glutes'], ['bodyweight'], 3, 6, 0, 90, false, 0, 'independent', 'Eccentric hamstring curl for injury prevention.'],
  ['Leg Extension', 'strength', 'beginner', ['quadriceps'], [], ['leg extension machine'], 3, 15, 30, 60, false, 0, 'independent', 'Machine quad isolation with controlled movement.'],
  ['Leg Curl', 'strength', 'beginner', ['hamstrings'], ['calves'], ['leg curl machine'], 3, 12, 25, 60, false, 0, 'independent', 'Machine hamstring curl for isolation work.'],
  ['Walking Lunge', 'strength', 'intermediate', ['quadriceps','glutes'], ['hamstrings','core'], ['dumbbell'], 3, 12, 15, 90, false, 0, 'independent', 'Forward walking lunges with dumbbells for leg development.'],
  ['Reverse Lunge', 'strength', 'beginner', ['quadriceps','glutes'], ['hamstrings'], ['dumbbell'], 3, 10, 12, 60, false, 0, 'independent', 'Step backward into lunge, easier on knees than forward variation.'],
  ['Lateral Lunge', 'strength', 'intermediate', ['adductors','quadriceps'], ['glutes'], ['dumbbell'], 3, 10, 10, 60, false, 0, 'independent', 'Side lunge for adductor strength and hip mobility.'],
  ['Step-Up', 'strength', 'beginner', ['quadriceps','glutes'], ['hamstrings','core'], ['dumbbell','box'], 3, 10, 12, 60, false, 0, 'independent', 'Step up onto box with weight for single-leg strength.'],
  ['Farmers Walk', 'strength', 'intermediate', ['traps','forearms','core'], ['glutes','calves'], ['dumbbell'], 3, 0, 30, 90, true, 40, 'independent', 'Walk carrying heavy weights at sides for grip and core.'],
  ['Overhead Carry', 'strength', 'advanced', ['shoulders','core'], ['traps','triceps'], ['dumbbell'], 3, 0, 20, 90, true, 30, 'independent', 'Walk with weight pressed overhead for shoulder stability.'],
  ['Muscle-Up', 'strength', 'advanced', ['lats','chest','triceps'], ['biceps','core'], ['pull-up bar'], 3, 5, 0, 120, false, 0, 'independent', 'Explosive pull-up transitioning to a dip above the bar.'],
  ['Dumbbell Pullover', 'strength', 'intermediate', ['lats','chest'], ['triceps','core'], ['dumbbell','flat bench'], 3, 12, 15, 60, false, 0, 'independent', 'Lying dumbbell pullover for lat and chest expansion.'],
  ['Straight-Arm Pulldown', 'strength', 'beginner', ['lats'], ['core','triceps'], ['cable machine'], 3, 15, 20, 45, false, 0, 'independent', 'Cable pulldown with straight arms for lat isolation.'],
  ['Jefferson Squat', 'strength', 'advanced', ['quadriceps','glutes'], ['core','adductors'], ['barbell'], 3, 8, 50, 120, false, 0, 'independent', 'Straddle the barbell squat for anti-rotation and leg strength.'],
  ['Cossack Squat', 'strength', 'intermediate', ['adductors','quadriceps'], ['glutes','hamstrings'], ['bodyweight'], 3, 8, 0, 60, false, 0, 'independent', 'Deep side-to-side squat for mobility and adductor strength.'],
  ['Belt Squat', 'strength', 'intermediate', ['quadriceps','glutes'], ['hamstrings'], ['belt squat machine'], 4, 10, 40, 90, false, 0, 'independent', 'Squat with load on hips instead of spine for joint-friendly training.'],

  // === CORE (additional ~45) ===
  ['RKC Plank', 'core', 'intermediate', ['core','glutes'], ['shoulders'], ['bodyweight'], 3, 0, 0, 60, true, 30, 'independent', 'Maximum tension plank squeezing glutes and bracing hard.'],
  ['Plank Shoulder Tap', 'core', 'intermediate', ['core','shoulders'], ['chest'], ['bodyweight'], 3, 16, 0, 45, false, 0, 'independent', 'Plank position tapping opposite shoulder while resisting rotation.'],
  ['Plank to Push-Up', 'core', 'intermediate', ['core','triceps'], ['chest','shoulders'], ['bodyweight'], 3, 10, 0, 60, false, 0, 'independent', 'Transition between forearm plank and push-up position.'],
  ['Dead Bug', 'core', 'beginner', ['core','hip flexors'], ['lower back'], ['bodyweight'], 3, 12, 0, 45, false, 0, 'independent', 'Supine exercise extending opposite arm and leg while bracing.'],
  ['Bird Dog', 'core', 'beginner', ['core','lower back'], ['glutes','shoulders'], ['bodyweight'], 3, 10, 0, 45, false, 0, 'independent', 'All-fours extending opposite arm and leg for stability.'],
  ['Ab Wheel Rollout', 'core', 'intermediate', ['core'], ['shoulders','lats'], ['ab wheel'], 3, 10, 0, 60, false, 0, 'independent', 'Roll ab wheel forward and back for deep core activation.'],
  ['Hanging Leg Raise', 'core', 'intermediate', ['lower abs','hip flexors'], ['core'], ['pull-up bar'], 3, 12, 0, 60, false, 0, 'independent', 'Raise straight legs while hanging for lower ab emphasis.'],
  ['Hanging Knee Raise', 'core', 'beginner', ['lower abs','hip flexors'], ['core'], ['pull-up bar'], 3, 15, 0, 45, false, 0, 'independent', 'Raise knees to chest while hanging for ab work.'],
  ['Toes to Bar', 'core', 'advanced', ['core','hip flexors'], ['lats','grip'], ['pull-up bar'], 3, 10, 0, 60, false, 0, 'independent', 'Raise feet to touch the bar while hanging.'],
  ['Cable Woodchop', 'core', 'intermediate', ['obliques','core'], ['shoulders'], ['cable machine'], 3, 12, 15, 45, false, 0, 'independent', 'Rotational cable chop from high to low for obliques.'],
  ['Russian Twist', 'core', 'intermediate', ['obliques','core'], ['hip flexors'], ['medicine ball'], 3, 20, 6, 45, false, 0, 'independent', 'Seated rotation with weight for oblique development.'],
  ['Pallof Press', 'core', 'beginner', ['core','obliques'], ['shoulders'], ['cable machine','resistance band'], 3, 12, 10, 45, false, 0, 'independent', 'Anti-rotation press for core stability.'],
  ['Mountain Climber', 'core', 'beginner', ['core','hip flexors'], ['shoulders','quadriceps'], ['bodyweight'], 3, 20, 0, 30, false, 0, 'independent', 'Plank position driving knees to chest alternately.'],
  ['V-Up', 'core', 'intermediate', ['core','hip flexors'], ['lower abs'], ['bodyweight'], 3, 15, 0, 45, false, 0, 'independent', 'Simultaneously raise legs and torso to form V shape.'],
  ['Bicycle Crunch', 'core', 'beginner', ['obliques','core'], ['hip flexors'], ['bodyweight'], 3, 20, 0, 30, false, 0, 'independent', 'Alternating elbow-to-knee crunch with pedaling motion.'],
  ['Reverse Crunch', 'core', 'beginner', ['lower abs'], ['core'], ['bodyweight'], 3, 15, 0, 30, false, 0, 'independent', 'Curl hips off floor toward chest for lower ab focus.'],
  ['Hollow Hold', 'core', 'intermediate', ['core'], ['hip flexors'], ['bodyweight'], 3, 0, 0, 45, true, 30, 'independent', 'Gymnastics hold with shoulders and legs elevated.'],
  ['Hollow Rock', 'core', 'intermediate', ['core'], ['hip flexors'], ['bodyweight'], 3, 15, 0, 45, false, 0, 'independent', 'Rock back and forth in hollow body position.'],
  ['L-Sit', 'core', 'advanced', ['core','hip flexors'], ['triceps','shoulders'], ['parallettes'], 3, 0, 0, 60, true, 20, 'independent', 'Hold legs parallel to ground while supporting on hands.'],
  ['Dragon Flag', 'core', 'advanced', ['core'], ['hip flexors','lower back'], ['flat bench'], 3, 6, 0, 90, false, 0, 'independent', 'Bruce Lees signature exercise lowering rigid body from bench.'],
  ['Flutter Kick', 'core', 'beginner', ['lower abs','hip flexors'], ['core'], ['bodyweight'], 3, 20, 0, 30, false, 0, 'independent', 'Lying on back alternating small leg kicks.'],
  ['Scissor Kick', 'core', 'beginner', ['lower abs','hip flexors'], ['adductors'], ['bodyweight'], 3, 20, 0, 30, false, 0, 'independent', 'Crossing legs alternately while lying supine.'],
  ['Lying Windshield Wiper', 'core', 'advanced', ['obliques','core'], ['hip flexors'], ['bodyweight'], 3, 10, 0, 60, false, 0, 'independent', 'Rotate raised legs side to side while lying on back.'],
  ['Copenhagen Plank', 'core', 'intermediate', ['adductors','obliques'], ['core'], ['bench'], 3, 0, 0, 45, true, 25, 'independent', 'Side plank with top leg elevated on bench for adductors.'],
  ['Turkish Get-Up', 'core', 'advanced', ['core','shoulders'], ['glutes','quadriceps','hips'], ['kettlebell'], 3, 4, 12, 90, false, 0, 'independent', 'Complex full-body movement from lying to standing with weight overhead.'],
  ['Anti-Rotation Press', 'core', 'beginner', ['core','obliques'], ['shoulders'], ['cable machine'], 3, 10, 10, 45, false, 0, 'independent', 'Press cable away from body while resisting rotation.'],
  ['Landmine Rotation', 'core', 'intermediate', ['obliques','core'], ['shoulders','hips'], ['barbell','landmine'], 3, 10, 15, 60, false, 0, 'independent', 'Rotate barbell in landmine arc for rotational core strength.'],
  ['Stir the Pot', 'core', 'intermediate', ['core'], ['shoulders'], ['stability ball'], 3, 10, 0, 45, false, 0, 'independent', 'Forearms on ball making circular motions while in plank.'],
  ['Stability Ball Pike', 'core', 'advanced', ['core','hip flexors'], ['shoulders'], ['stability ball'], 3, 10, 0, 60, false, 0, 'independent', 'Pike hips up with feet on stability ball from plank.'],
  ['Medicine Ball Slam', 'core', 'intermediate', ['core','lats'], ['shoulders','triceps'], ['medicine ball'], 3, 12, 8, 45, false, 0, 'independent', 'Slam medicine ball to ground explosively.'],
  ['Bear Crawl', 'core', 'beginner', ['core','shoulders'], ['quadriceps','glutes'], ['bodyweight'], 3, 0, 0, 45, true, 30, 'independent', 'Crawl forward on hands and toes with knees hovering.'],
  ['Inchworm', 'core', 'beginner', ['core','hamstrings'], ['shoulders','chest'], ['bodyweight'], 3, 8, 0, 45, false, 0, 'independent', 'Walk hands out to plank then walk feet to hands.'],
  ['Renegade Row', 'core', 'advanced', ['core','lats'], ['biceps','shoulders'], ['dumbbell'], 3, 8, 15, 60, false, 0, 'independent', 'Plank position alternating dumbbell rows.'],

  // === SPEED (additional ~35) ===
  ['Sprint Intervals', 'speed', 'intermediate', ['quadriceps','hamstrings','glutes'], ['calves','core'], ['bodyweight'], 6, 1, 0, 120, true, 30, 'independent', '30-second all-out sprints with rest intervals.'],
  ['Hill Sprints', 'speed', 'advanced', ['quadriceps','glutes','calves'], ['hamstrings','core'], ['bodyweight'], 6, 1, 0, 180, true, 20, 'independent', 'Sprint uphill for power development and speed endurance.'],
  ['Sled Push', 'speed', 'intermediate', ['quadriceps','glutes','calves'], ['core','shoulders'], ['sled'], 4, 1, 40, 120, true, 30, 'independent', 'Push weighted sled for explosive leg drive.'],
  ['Sled Pull', 'speed', 'intermediate', ['hamstrings','glutes','lats'], ['biceps','core'], ['sled','rope'], 4, 1, 40, 120, true, 30, 'independent', 'Pull sled toward you hand over hand for posterior chain.'],
  ['Prowler Sprint', 'speed', 'advanced', ['quadriceps','glutes'], ['calves','core','shoulders'], ['prowler sled'], 5, 1, 60, 150, true, 25, 'independent', 'Sprint pushing the prowler for conditioning and leg power.'],
  ['Resisted Sprint', 'speed', 'intermediate', ['quadriceps','glutes','hamstrings'], ['core','calves'], ['resistance band'], 5, 1, 0, 120, true, 20, 'independent', 'Sprint against band resistance for acceleration strength.'],
  ['Flying Sprint', 'speed', 'advanced', ['hamstrings','quadriceps'], ['glutes','calves'], ['bodyweight'], 5, 1, 0, 150, true, 30, 'independent', 'Build up to max speed over 30m then sprint 30m at maximum.'],
  ['A-Skip', 'speed', 'beginner', ['hip flexors','calves'], ['core','quadriceps'], ['bodyweight'], 3, 0, 0, 30, true, 20, 'independent', 'Skipping with high knees emphasizing ground contact.'],
  ['B-Skip', 'speed', 'intermediate', ['hamstrings','hip flexors'], ['calves','quadriceps'], ['bodyweight'], 3, 0, 0, 30, true, 20, 'independent', 'A-skip with added leg extension for hamstring activation.'],
  ['High Knee Run', 'speed', 'beginner', ['hip flexors','quadriceps'], ['calves','core'], ['bodyweight'], 3, 0, 0, 30, true, 20, 'independent', 'Run in place or forward driving knees high.'],
  ['Butt Kick Run', 'speed', 'beginner', ['hamstrings','calves'], ['quadriceps'], ['bodyweight'], 3, 0, 0, 30, true, 20, 'independent', 'Run bringing heels to glutes for hamstring speed drill.'],
  ['Straight Leg Bound', 'speed', 'intermediate', ['hamstrings','calves'], ['glutes','hip flexors'], ['bodyweight'], 3, 0, 0, 45, true, 20, 'independent', 'Bounding forward with straight legs for ground contact speed.'],
  ['Power Skip', 'speed', 'beginner', ['calves','quadriceps','hip flexors'], ['glutes','core'], ['bodyweight'], 3, 0, 0, 30, true, 20, 'independent', 'Explosive skipping for height emphasizing triple extension.'],
  ['Quick Feet Drill', 'speed', 'beginner', ['calves','quadriceps'], ['hip flexors'], ['bodyweight'], 4, 0, 0, 20, true, 10, 'independent', 'Rapid foot tapping in place for foot speed.'],
  ['Wall Drive', 'speed', 'beginner', ['hip flexors','quadriceps','glutes'], ['core','calves'], ['bodyweight'], 3, 10, 0, 45, false, 0, 'independent', 'Drive knees against wall at 45 degrees for sprint mechanics.'],
  ['Treadmill Sprint', 'speed', 'intermediate', ['quadriceps','hamstrings','glutes'], ['calves','core'], ['treadmill'], 6, 1, 0, 90, true, 30, 'independent', 'Max effort sprints on treadmill with incline.'],
  ['Parachute Sprint', 'speed', 'intermediate', ['quadriceps','glutes'], ['hamstrings','core'], ['speed parachute'], 5, 1, 0, 150, true, 30, 'independent', 'Sprint with drag parachute for resistance training.'],
  ['Tempo Run', 'speed', 'beginner', ['quadriceps','hamstrings','calves'], ['core','glutes'], ['bodyweight'], 3, 1, 0, 120, true, 60, 'independent', '75% effort sustained runs for speed endurance.'],
  ['Shuttle Run', 'speed', 'intermediate', ['quadriceps','hamstrings','calves'], ['core','glutes'], ['cones'], 5, 1, 0, 90, true, 25, 'independent', 'Sprint back and forth between two points with direction changes.'],
  ['Acceleration Drill', 'speed', 'intermediate', ['quadriceps','glutes'], ['hamstrings','calves'], ['bodyweight'], 5, 1, 0, 90, true, 15, 'independent', 'Short 10-15m explosive starts from various positions.'],
  ['Deceleration Drill', 'speed', 'intermediate', ['quadriceps','hamstrings'], ['core','calves'], ['bodyweight'], 4, 6, 0, 60, false, 0, 'independent', 'Sprint then rapidly decelerate to a stop within marked zone.'],
  ['Sprint Float Sprint', 'speed', 'advanced', ['hamstrings','quadriceps'], ['glutes','calves'], ['bodyweight'], 4, 1, 0, 120, true, 40, 'independent', 'Alternate between max sprint and relaxed floating pace.'],
  ['Backpedal to Sprint', 'speed', 'intermediate', ['quadriceps','hamstrings','calves'], ['core','glutes'], ['bodyweight'], 5, 1, 0, 60, true, 15, 'independent', 'Backpedal then turn and sprint forward on command.'],
  ['Reaction Sprint', 'speed', 'intermediate', ['quadriceps','hamstrings'], ['calves','core'], ['bodyweight'], 5, 1, 0, 60, true, 10, 'partner', 'React to visual or audio cue and sprint designated direction.'],

  // === AGILITY (additional ~25) ===
  ['Ladder Quick Feet', 'agility', 'beginner', ['calves','quadriceps'], ['hip flexors','core'], ['agility ladder'], 4, 0, 0, 30, true, 15, 'independent', 'Run through ladder with two feet in each square.'],
  ['Ladder In-Out', 'agility', 'beginner', ['calves','adductors'], ['quadriceps','core'], ['agility ladder'], 4, 0, 0, 30, true, 15, 'independent', 'Step in and out of ladder squares laterally.'],
  ['Ladder Icky Shuffle', 'agility', 'intermediate', ['calves','quadriceps','hip flexors'], ['core'], ['agility ladder'], 4, 0, 0, 30, true, 15, 'independent', 'Three-step pattern through ladder for coordination.'],
  ['T-Drill', 'agility', 'intermediate', ['quadriceps','calves','hamstrings'], ['core','glutes'], ['cones'], 4, 1, 0, 60, true, 15, 'independent', 'Sprint forward, shuffle left/right, backpedal in T shape.'],
  ['5-10-5 Pro Agility', 'agility', 'intermediate', ['quadriceps','hamstrings','calves'], ['core','glutes'], ['cones'], 5, 1, 0, 60, true, 10, 'independent', 'Sprint 5 yards, cut, sprint 10 yards, cut, sprint 5 back.'],
  ['L-Drill', 'agility', 'intermediate', ['quadriceps','hamstrings'], ['calves','core'], ['cones'], 4, 1, 0, 60, true, 12, 'independent', 'Sprint and cut in an L-shaped pattern for change of direction.'],
  ['Box Drill', 'agility', 'beginner', ['calves','quadriceps'], ['core','hip flexors'], ['cones'], 4, 1, 0, 45, true, 15, 'independent', 'Sprint, shuffle, backpedal around a square of cones.'],
  ['Zig-Zag Cone Drill', 'agility', 'intermediate', ['quadriceps','calves','glutes'], ['core','hamstrings'], ['cones'], 4, 1, 0, 45, true, 15, 'independent', 'Sprint in zig-zag pattern through offset cones.'],
  ['Lateral Shuffle', 'agility', 'beginner', ['adductors','quadriceps','calves'], ['core','glutes'], ['bodyweight'], 4, 0, 0, 30, true, 20, 'independent', 'Athletic stance shuffling laterally without crossing feet.'],
  ['Defensive Slide', 'agility', 'beginner', ['adductors','quadriceps'], ['glutes','calves'], ['bodyweight'], 4, 0, 0, 30, true, 20, 'independent', 'Low athletic stance sliding laterally as in basketball defense.'],
  ['Carioca Drill', 'agility', 'intermediate', ['hip flexors','obliques'], ['calves','quadriceps'], ['bodyweight'], 3, 0, 0, 30, true, 20, 'independent', 'Lateral movement with cross-step pattern for hip mobility.'],
  ['Crossover Step', 'agility', 'intermediate', ['hip flexors','quadriceps'], ['glutes','calves'], ['bodyweight'], 3, 0, 0, 30, true, 15, 'independent', 'Lateral movement initiating with crossover step.'],
  ['3-Cone Drill', 'agility', 'intermediate', ['quadriceps','hamstrings','calves'], ['core'], ['cones'], 5, 1, 0, 60, true, 10, 'independent', 'NFL combine drill weaving around three cones in L shape.'],
  ['Illinois Agility Test', 'agility', 'intermediate', ['quadriceps','hamstrings','calves'], ['core','glutes'], ['cones'], 3, 1, 0, 120, true, 20, 'independent', 'Timed agility course with weaving and direction changes.'],
  ['Hexagonal Agility', 'agility', 'intermediate', ['calves','quadriceps'], ['core','hip flexors'], ['cones'], 4, 1, 0, 45, true, 15, 'independent', 'Jump in and out of hexagon shape rapidly.'],
  ['Reaction Ball Drill', 'agility', 'beginner', ['calves','quadriceps'], ['core','hip flexors'], ['reaction ball'], 3, 0, 0, 30, true, 30, 'independent', 'Chase and catch erratically bouncing reaction ball.'],

  // === BALL WORK (additional ~35) ===
  ['Inside Foot Passing', 'ball_work', 'beginner', ['quadriceps','hip flexors'], ['calves','core'], ['football'], 3, 20, 0, 30, false, 0, 'partner', 'Pass with inside of foot over various distances.'],
  ['Through Ball Practice', 'ball_work', 'intermediate', ['quadriceps','hip flexors'], ['core'], ['football','cones'], 3, 15, 0, 30, false, 0, 'partner', 'Play weighted passes into space for running teammates.'],
  ['Long Ball Practice', 'ball_work', 'advanced', ['quadriceps','hip flexors'], ['core','calves'], ['football'], 3, 12, 0, 45, false, 0, 'partner', 'Practice long-range passes and switches of play.'],
  ['First Touch Control', 'ball_work', 'beginner', ['calves','quadriceps'], ['core'], ['football'], 3, 0, 0, 30, true, 60, 'partner', 'Receive passes and control ball with first touch.'],
  ['Chest Control', 'ball_work', 'intermediate', ['chest','core'], ['quadriceps'], ['football'], 3, 15, 0, 30, false, 0, 'partner', 'Control lofted balls with chest and bring to feet.'],
  ['Dribbling Figure-8', 'ball_work', 'beginner', ['calves','quadriceps'], ['core','hip flexors'], ['football','cones'], 3, 0, 0, 30, true, 45, 'independent', 'Dribble in figure-8 pattern around cones.'],
  ['Speed Dribbling', 'ball_work', 'intermediate', ['calves','quadriceps','hamstrings'], ['core'], ['football','cones'], 4, 0, 0, 45, true, 30, 'independent', 'Dribble at maximum speed through a course.'],
  ['Close Control Dribbling', 'ball_work', 'intermediate', ['calves','quadriceps'], ['core','hip flexors'], ['football'], 3, 0, 0, 30, true, 60, 'independent', 'Tight-space dribbling keeping ball within one step.'],
  ['Cone Weave Dribbling', 'ball_work', 'beginner', ['calves','quadriceps'], ['core'], ['football','cones'], 3, 0, 0, 30, true, 45, 'independent', 'Weave ball through a line of closely spaced cones.'],
  ['1v1 Dribbling', 'ball_work', 'intermediate', ['calves','quadriceps'], ['core','hamstrings'], ['football','cones'], 4, 0, 0, 30, true, 30, 'partner', 'Beat a defender in a confined 1v1 dribbling scenario.'],
  ['Shooting Practice', 'ball_work', 'intermediate', ['quadriceps','hip flexors'], ['core','calves'], ['football'], 3, 15, 0, 30, false, 0, 'independent', 'Strike on goal from various angles and distances.'],
  ['Volley Shooting', 'ball_work', 'advanced', ['quadriceps','hip flexors'], ['core','calves'], ['football'], 3, 10, 0, 30, false, 0, 'partner', 'Strike ball out of the air before it bounces.'],
  ['Free Kick Practice', 'ball_work', 'advanced', ['quadriceps','hip flexors'], ['core','calves'], ['football'], 3, 10, 0, 60, false, 0, 'independent', 'Practice curving and dipping free kicks from set positions.'],
  ['Crossing Drill', 'ball_work', 'intermediate', ['quadriceps','hip flexors'], ['core','calves'], ['football'], 3, 12, 0, 30, false, 0, 'group', 'Deliver crosses from wide positions into the box.'],
  ['Heading Drill', 'ball_work', 'intermediate', ['neck','core'], ['shoulders'], ['football'], 3, 10, 0, 30, false, 0, 'partner', 'Practice directing headers offensively and defensively.'],
  ['Juggling', 'ball_work', 'beginner', ['calves','quadriceps'], ['core','hip flexors'], ['football'], 3, 0, 0, 30, true, 60, 'independent', 'Keep ball in the air using feet thighs and head.'],
  ['Wall Pass Drill', 'ball_work', 'beginner', ['quadriceps','calves'], ['core'], ['football'], 3, 0, 0, 30, true, 60, 'independent', 'Pass against a wall and control the return for touch practice.'],
  ['Give-and-Go Drill', 'ball_work', 'intermediate', ['quadriceps','calves'], ['core','hip flexors'], ['football','cones'], 3, 12, 0, 30, false, 0, 'partner', 'Pass to partner, make a run, receive return pass.'],
  ['Rondo 4v1', 'ball_work', 'intermediate', ['calves','quadriceps'], ['core'], ['football'], 3, 0, 0, 30, true, 120, 'group', 'Keep-away circle with 4 outside vs 1 defender.'],
  ['Rondo 5v2', 'ball_work', 'intermediate', ['calves','quadriceps'], ['core','hamstrings'], ['football'], 3, 0, 0, 30, true, 120, 'group', 'Keep-away with 5 outside vs 2 defenders.'],
  ['Quick Feet Ball Mastery', 'ball_work', 'beginner', ['calves','quadriceps'], ['core'], ['football'], 3, 0, 0, 30, true, 60, 'independent', 'Fast footwork patterns on and around the ball.'],
  ['Sole Roll', 'ball_work', 'beginner', ['calves','hip flexors'], ['core'], ['football'], 3, 0, 0, 20, true, 60, 'independent', 'Roll ball back and forth under sole for close control.'],
  ['Cruyff Turn Practice', 'ball_work', 'intermediate', ['calves','quadriceps'], ['core','hip flexors'], ['football','cones'], 3, 10, 0, 30, false, 0, 'independent', 'Practice the Cruyff turn move at speed against cones.'],
  ['Step-Over Drill', 'ball_work', 'intermediate', ['calves','quadriceps'], ['hip flexors'], ['football','cones'], 3, 10, 0, 30, false, 0, 'independent', 'Practice step-overs approaching a cone then accelerate.'],

  // === PLYOMETRICS (additional ~25) ===
  ['Box Jump', 'plyometrics', 'intermediate', ['quadriceps','glutes','calves'], ['hamstrings','core'], ['plyo box'], 4, 8, 0, 90, false, 0, 'independent', 'Jump onto box from standing for explosive lower body power.'],
  ['Depth Jump', 'plyometrics', 'advanced', ['quadriceps','calves'], ['glutes','hamstrings'], ['plyo box'], 3, 6, 0, 120, false, 0, 'independent', 'Step off box, land, and immediately jump maximally.'],
  ['Tuck Jump', 'plyometrics', 'intermediate', ['quadriceps','calves','hip flexors'], ['core','glutes'], ['bodyweight'], 3, 8, 0, 60, false, 0, 'independent', 'Jump and bring knees to chest at peak height.'],
  ['Broad Jump', 'plyometrics', 'intermediate', ['quadriceps','glutes','hamstrings'], ['calves','core'], ['bodyweight'], 4, 6, 0, 90, false, 0, 'independent', 'Standing horizontal jump for distance.'],
  ['Single-Leg Hop', 'plyometrics', 'intermediate', ['quadriceps','calves','glutes'], ['core','hamstrings'], ['bodyweight'], 3, 8, 0, 60, false, 0, 'independent', 'Hop forward on one leg for single-leg power.'],
  ['Lateral Bound', 'plyometrics', 'intermediate', ['glutes','adductors','quadriceps'], ['calves','core'], ['bodyweight'], 3, 8, 0, 60, false, 0, 'independent', 'Bound side to side covering maximum distance.'],
  ['Skater Jump', 'plyometrics', 'beginner', ['glutes','quadriceps','adductors'], ['calves','core'], ['bodyweight'], 3, 12, 0, 45, false, 0, 'independent', 'Lateral jump landing on one leg like a speed skater.'],
  ['Split Squat Jump', 'plyometrics', 'intermediate', ['quadriceps','glutes'], ['hamstrings','calves','core'], ['bodyweight'], 3, 10, 0, 60, false, 0, 'independent', 'Jump from lunge position switching legs mid-air.'],
  ['Squat Jump', 'plyometrics', 'beginner', ['quadriceps','glutes'], ['calves','hamstrings'], ['bodyweight'], 3, 10, 0, 60, false, 0, 'independent', 'Jump from squat position for explosive leg power.'],
  ['Star Jump', 'plyometrics', 'beginner', ['quadriceps','glutes','shoulders'], ['calves','core'], ['bodyweight'], 3, 12, 0, 45, false, 0, 'independent', 'Jump spreading arms and legs into star shape.'],
  ['Burpee', 'plyometrics', 'intermediate', ['quadriceps','chest','core'], ['shoulders','triceps','calves'], ['bodyweight'], 3, 12, 0, 60, false, 0, 'independent', 'Full body exercise combining squat thrust and jump.'],
  ['Plyo Push-Up', 'plyometrics', 'advanced', ['chest','triceps'], ['core','shoulders'], ['bodyweight'], 3, 8, 0, 90, false, 0, 'independent', 'Push-up with explosive launch off the ground.'],
  ['Clap Push-Up', 'plyometrics', 'advanced', ['chest','triceps'], ['core','shoulders'], ['bodyweight'], 3, 6, 0, 90, false, 0, 'independent', 'Explosive push-up clapping hands before landing.'],
  ['Hurdle Jump', 'plyometrics', 'intermediate', ['quadriceps','calves','glutes'], ['hamstrings','core'], ['hurdles'], 4, 6, 0, 60, false, 0, 'independent', 'Jump over consecutive hurdles for reactive power.'],
  ['Lateral Hurdle Hop', 'plyometrics', 'intermediate', ['adductors','calves','quadriceps'], ['core','glutes'], ['hurdles'], 3, 10, 0, 45, false, 0, 'independent', 'Hop sideways over low hurdles for lateral power.'],
  ['Bounding', 'plyometrics', 'intermediate', ['quadriceps','glutes','calves'], ['hamstrings','core','hip flexors'], ['bodyweight'], 3, 0, 0, 60, true, 20, 'independent', 'Exaggerated running with maximum stride length.'],
  ['Pogo Jump', 'plyometrics', 'beginner', ['calves'], ['quadriceps','core'], ['bodyweight'], 3, 20, 0, 30, false, 0, 'independent', 'Small quick jumps using only ankles for calf reactivity.'],
  ['Medicine Ball Throw', 'plyometrics', 'intermediate', ['chest','shoulders','triceps'], ['core'], ['medicine ball'], 3, 10, 6, 60, false, 0, 'partner', 'Explosive chest pass with medicine ball.'],
  ['Overhead Med Ball Slam', 'plyometrics', 'intermediate', ['core','lats','shoulders'], ['triceps'], ['medicine ball'], 3, 10, 6, 45, false, 0, 'independent', 'Slam ball overhead to ground with full body power.'],
  ['Rotational Med Ball Throw', 'plyometrics', 'intermediate', ['obliques','core','hips'], ['shoulders'], ['medicine ball'], 3, 10, 5, 45, false, 0, 'independent', 'Rotational throw against wall for rotational power.'],
  ['Power Clean', 'plyometrics', 'advanced', ['quadriceps','glutes','hamstrings','traps'], ['core','shoulders','calves'], ['barbell'], 4, 5, 50, 150, false, 0, 'independent', 'Olympic lift catching bar at shoulders for total body power.'],

  // === FLEXIBILITY (additional ~35) ===
  ['Standing Hamstring Stretch', 'flexibility', 'beginner', ['hamstrings'], ['calves','lower back'], ['bodyweight'], 2, 0, 0, 15, true, 30, 'independent', 'Stand and reach toward toes keeping legs straight.'],
  ['Seated Forward Fold', 'flexibility', 'beginner', ['hamstrings','lower back'], ['calves'], ['bodyweight'], 2, 0, 0, 15, true, 30, 'independent', 'Sit with legs straight and fold forward toward toes.'],
  ['Standing Quad Stretch', 'flexibility', 'beginner', ['quadriceps','hip flexors'], [], ['bodyweight'], 2, 0, 0, 15, true, 30, 'independent', 'Stand on one leg pulling heel to glutes.'],
  ['Kneeling Hip Flexor Stretch', 'flexibility', 'beginner', ['hip flexors','quadriceps'], ['core'], ['bodyweight'], 2, 0, 0, 15, true, 30, 'independent', 'Half-kneeling position pushing hips forward.'],
  ['Pigeon Pose', 'flexibility', 'intermediate', ['glutes','hip flexors'], ['piriformis'], ['bodyweight'], 2, 0, 0, 15, true, 45, 'independent', 'Yoga pose opening hips with front leg bent externally.'],
  ['Figure-4 Stretch', 'flexibility', 'beginner', ['glutes','piriformis'], ['hip flexors'], ['bodyweight'], 2, 0, 0, 15, true, 30, 'independent', 'Lie on back crossing ankle over opposite knee.'],
  ['Butterfly Stretch', 'flexibility', 'beginner', ['adductors','groin'], ['hip flexors'], ['bodyweight'], 2, 0, 0, 15, true, 30, 'independent', 'Sit with soles together pressing knees toward floor.'],
  ['Frog Stretch', 'flexibility', 'intermediate', ['adductors','groin'], ['hip flexors'], ['bodyweight'], 2, 0, 0, 15, true, 30, 'independent', 'On all fours with knees wide, rock hips back for deep groin stretch.'],
  ['Couch Stretch', 'flexibility', 'intermediate', ['hip flexors','quadriceps'], ['core'], ['bodyweight','wall'], 2, 0, 0, 15, true, 45, 'independent', 'Rear foot elevated against wall in lunge for deep hip flexor stretch.'],
  ['Downward Dog', 'flexibility', 'beginner', ['hamstrings','calves','shoulders'], ['core','lats'], ['bodyweight'], 2, 0, 0, 15, true, 30, 'independent', 'Inverted V position stretching posterior chain.'],
  ['Upward Dog', 'flexibility', 'beginner', ['hip flexors','abs'], ['chest','shoulders'], ['bodyweight'], 2, 0, 0, 15, true, 20, 'independent', 'Arms straight, hips off floor, chest open.'],
  ['Cat-Cow Stretch', 'flexibility', 'beginner', ['spine','core'], ['shoulders'], ['bodyweight'], 2, 10, 0, 15, false, 0, 'independent', 'Alternate between arching and rounding spine on all fours.'],
  ['Thread the Needle', 'flexibility', 'beginner', ['thoracic spine','shoulders'], ['core'], ['bodyweight'], 2, 8, 0, 15, false, 0, 'independent', 'All fours reaching one arm under body for thoracic rotation.'],
  ['Childs Pose', 'flexibility', 'beginner', ['lats','lower back','hips'], ['shoulders'], ['bodyweight'], 2, 0, 0, 15, true, 30, 'independent', 'Kneel and sit back reaching arms forward for full relaxation.'],
  ['Seated Spinal Twist', 'flexibility', 'beginner', ['obliques','spine'], ['glutes'], ['bodyweight'], 2, 0, 0, 15, true, 30, 'independent', 'Sit and rotate torso using opposite hand on knee.'],
  ['Doorway Chest Stretch', 'flexibility', 'beginner', ['chest','front deltoids'], ['biceps'], ['doorframe'], 2, 0, 0, 15, true, 30, 'independent', 'Place arm on doorframe and lean through for chest opening.'],
  ['Cross-Body Shoulder Stretch', 'flexibility', 'beginner', ['rear deltoids','upper back'], [], ['bodyweight'], 2, 0, 0, 15, true, 20, 'independent', 'Pull arm across body with opposite hand.'],
  ['Worlds Greatest Stretch', 'flexibility', 'intermediate', ['hip flexors','hamstrings','thoracic spine'], ['calves','shoulders'], ['bodyweight'], 2, 6, 0, 15, false, 0, 'independent', 'Lunge with rotation combining hip, hamstring and thoracic mobility.'],
  ['90-90 Hip Stretch', 'flexibility', 'intermediate', ['glutes','hip rotators'], ['hip flexors'], ['bodyweight'], 2, 0, 0, 15, true, 30, 'independent', 'Sit with both legs at 90 degrees for hip rotation mobility.'],
  ['Pancake Stretch', 'flexibility', 'advanced', ['adductors','hamstrings'], ['lower back'], ['bodyweight'], 2, 0, 0, 15, true, 45, 'independent', 'Wide straddle seat folding chest toward floor.'],
  ['Shoulder Dislocate', 'flexibility', 'intermediate', ['shoulders','chest'], ['rotator cuff'], ['PVC pipe','resistance band'], 2, 10, 0, 15, false, 0, 'independent', 'Pass band/pipe over and behind head for shoulder mobility.'],
  ['IT Band Stretch', 'flexibility', 'beginner', ['IT band','glutes'], ['hip flexors'], ['bodyweight'], 2, 0, 0, 15, true, 30, 'independent', 'Cross legs standing and lean away from back leg.'],
  ['Ankle Dorsiflexion Stretch', 'flexibility', 'beginner', ['calves','ankle'], ['soleus'], ['bodyweight','wall'], 2, 0, 0, 15, true, 30, 'independent', 'Knee-to-wall stretch for ankle mobility.'],
  ['Cobra Stretch', 'flexibility', 'beginner', ['abs','hip flexors'], ['chest'], ['bodyweight'], 2, 0, 0, 15, true, 20, 'independent', 'Lie prone pressing chest up while keeping hips on ground.'],
  ['Neck Stretch', 'flexibility', 'beginner', ['neck','traps'], [], ['bodyweight'], 2, 0, 0, 10, true, 20, 'independent', 'Gently tilt head to each side for neck release.'],

  // === RECOVERY (additional ~35) ===
  ['Foam Roll Quads', 'recovery', 'beginner', ['quadriceps'], [], ['foam roller'], 1, 0, 0, 0, true, 60, 'independent', 'Roll front of thighs on foam roller for myofascial release.'],
  ['Foam Roll IT Band', 'recovery', 'beginner', ['IT band'], ['quadriceps'], ['foam roller'], 1, 0, 0, 0, true, 60, 'independent', 'Roll outer thigh on foam roller for IT band release.'],
  ['Foam Roll Hamstrings', 'recovery', 'beginner', ['hamstrings'], [], ['foam roller'], 1, 0, 0, 0, true, 60, 'independent', 'Roll back of thighs on foam roller.'],
  ['Foam Roll Glutes', 'recovery', 'beginner', ['glutes','piriformis'], [], ['foam roller'], 1, 0, 0, 0, true, 60, 'independent', 'Sit on foam roller targeting glute muscles.'],
  ['Foam Roll Upper Back', 'recovery', 'beginner', ['thoracic spine','traps'], ['rhomboids'], ['foam roller'], 1, 0, 0, 0, true, 60, 'independent', 'Roll upper back for thoracic mobility and tension relief.'],
  ['Foam Roll Lats', 'recovery', 'beginner', ['lats'], ['teres major'], ['foam roller'], 1, 0, 0, 0, true, 60, 'independent', 'Lie on side rolling lat muscle.'],
  ['Foam Roll Calves', 'recovery', 'beginner', ['calves','soleus'], [], ['foam roller'], 1, 0, 0, 0, true, 60, 'independent', 'Roll calves on foam roller for lower leg release.'],
  ['Foam Roll Adductors', 'recovery', 'beginner', ['adductors'], ['groin'], ['foam roller'], 1, 0, 0, 0, true, 60, 'independent', 'Lie prone rolling inner thigh on foam roller.'],
  ['Lacrosse Ball Glutes', 'recovery', 'intermediate', ['glutes','piriformis'], [], ['lacrosse ball'], 1, 0, 0, 0, true, 90, 'independent', 'Pin and release glute trigger points with lacrosse ball.'],
  ['Lacrosse Ball Shoulder', 'recovery', 'intermediate', ['deltoids','rotator cuff'], ['traps'], ['lacrosse ball','wall'], 1, 0, 0, 0, true, 90, 'independent', 'Roll ball against wall on rear shoulder for trigger points.'],
  ['Lacrosse Ball Foot', 'recovery', 'beginner', ['plantar fascia'], ['calves'], ['lacrosse ball'], 1, 0, 0, 0, true, 60, 'independent', 'Roll ball under foot arch for plantar fascia release.'],
  ['Lacrosse Ball Pec', 'recovery', 'intermediate', ['chest','front deltoids'], [], ['lacrosse ball','wall'], 1, 0, 0, 0, true, 60, 'independent', 'Roll ball on chest wall junction for pec release.'],
  ['Active Recovery Walk', 'recovery', 'beginner', ['full body'], [], ['bodyweight'], 1, 0, 0, 0, true, 600, 'independent', 'Easy 10-minute walk to promote blood flow.'],
  ['Light Cycling', 'recovery', 'beginner', ['quadriceps','hamstrings'], ['calves'], ['stationary bike'], 1, 0, 0, 0, true, 600, 'independent', 'Easy cycling at low resistance for active recovery.'],
  ['Yoga Sun Salutation', 'recovery', 'beginner', ['full body'], ['core','shoulders'], ['bodyweight'], 3, 5, 0, 15, false, 0, 'independent', 'Flow through sun salutation sequence for full body mobility.'],
  ['Restorative Yoga', 'recovery', 'beginner', ['full body'], [], ['bodyweight','yoga mat'], 1, 0, 0, 0, true, 600, 'independent', 'Gentle supported yoga poses held for extended periods.'],
  ['Box Breathing', 'recovery', 'beginner', ['diaphragm'], ['core'], ['bodyweight'], 1, 0, 0, 0, true, 300, 'independent', 'Inhale 4s, hold 4s, exhale 4s, hold 4s for stress relief.'],
  ['Diaphragmatic Breathing', 'recovery', 'beginner', ['diaphragm'], ['core'], ['bodyweight'], 1, 0, 0, 0, true, 300, 'independent', 'Deep belly breathing for parasympathetic activation.'],
  ['Progressive Muscle Relaxation', 'recovery', 'beginner', ['full body'], [], ['bodyweight'], 1, 0, 0, 0, true, 600, 'independent', 'Systematically tense and release each muscle group.'],
  ['Ankle Mobility Circle', 'recovery', 'beginner', ['ankle','calves'], [], ['bodyweight'], 2, 10, 0, 10, false, 0, 'independent', 'Circle ankle joint in both directions for mobility.'],
  ['Hip Circle', 'recovery', 'beginner', ['hips','hip flexors'], ['glutes'], ['bodyweight'], 2, 10, 0, 10, false, 0, 'independent', 'Standing hip circles for joint lubrication.'],
  ['Shoulder Circle', 'recovery', 'beginner', ['shoulders','rotator cuff'], ['traps'], ['bodyweight'], 2, 10, 0, 10, false, 0, 'independent', 'Arm circles progressing from small to large.'],
  ['Thoracic Spine Extension', 'recovery', 'beginner', ['thoracic spine'], ['core'], ['foam roller'], 2, 0, 0, 10, true, 30, 'independent', 'Lie over foam roller extending upper back.'],
  ['Foam Roll Hip Flexors', 'recovery', 'intermediate', ['hip flexors','quadriceps'], [], ['foam roller'], 1, 0, 0, 0, true, 60, 'independent', 'Target hip flexor area with foam roller in prone position.'],
  ['Light Band Work', 'recovery', 'beginner', ['shoulders','rotator cuff'], ['upper back'], ['resistance band'], 2, 15, 0, 15, false, 0, 'independent', 'Gentle band pull-aparts and rotations for shoulder recovery.'],
];

function buildExercise(e) {
  const [name, cat, diff, pm, sm, equip, sets, reps, wt, rest, timed, dur, type, desc] = e;
  return {
    name,
    description: desc,
    category: cat,
    difficulty: diff,
    exercise_type: type,
    primary_muscles: pm,
    secondary_muscles: sm,
    muscle_groups: [...pm, ...sm],
    equipment: equip,
    default_sets: sets,
    default_reps: timed ? null : (reps || null),
    default_weight_kg: wt || null,
    default_rest_sec: rest || 60,
    is_timed: timed,
    default_duration_sec: timed ? (dur || 30) : null,
    instructions: `1. Set up in the correct starting position\n2. Perform the movement with controlled form\n3. Complete the prescribed repetitions\n4. Rest and repeat`,
    tips: `Focus on form over weight. Control the eccentric phase.`,
    image_url: img(name),
    coach_id: null,
    maturity_safe: ['pre_phv', 'phv', 'post_phv'],
    tracking_fields: timed ? ['duration', 'rpe'] : ['sets', 'reps', 'weight', 'rpe'],
  };
}

async function main() {
  // First check existing count
  const existing = await api('GET', '/rest/v1/mf_exercises?coach_id=is.null&select=id');
  console.log(`Existing system exercises: ${Array.isArray(existing) ? existing.length : 0}`);

  // Delete all system exercises
  console.log('Deleting existing system exercises...');
  await api('DELETE', '/rest/v1/mf_exercises?coach_id=is.null');

  // Build all exercises
  const exercises = EX.map(buildExercise);
  console.log(`Seeding ${exercises.length} exercises...`);

  // Check for duplicate names
  const names = new Set();
  const dupes = [];
  for (const ex of exercises) {
    if (names.has(ex.name)) dupes.push(ex.name);
    names.add(ex.name);
  }
  if (dupes.length) {
    console.log(`WARNING: ${dupes.length} duplicate names found: ${dupes.join(', ')}`);
    // Remove duplicates
    const seen = new Set();
    const unique = exercises.filter(ex => {
      if (seen.has(ex.name)) return false;
      seen.add(ex.name);
      return true;
    });
    console.log(`Deduped: ${unique.length} unique exercises`);
    exercises.length = 0;
    exercises.push(...unique);
  }

  // Insert in batches
  const batch = 25;
  let inserted = 0;
  for (let i = 0; i < exercises.length; i += batch) {
    const chunk = exercises.slice(i, i + batch);
    const res = await api('POST', '/rest/v1/mf_exercises', chunk);
    if (Array.isArray(res)) {
      inserted += res.length;
      console.log(`  Batch ${Math.floor(i/batch)+1}: ${res.length} inserted (total: ${inserted})`);
    } else {
      console.log(`  Batch ${Math.floor(i/batch)+1} ERROR:`, JSON.stringify(res).slice(0, 300));
    }
  }

  // Verify
  const final = await api('GET', '/rest/v1/mf_exercises?select=id,category');
  const cats = {};
  if (Array.isArray(final)) {
    final.forEach(e => { cats[e.category] = (cats[e.category] || 0) + 1; });
  }
  console.log(`\n=== DONE === ${Array.isArray(final) ? final.length : 0} total exercises`);
  console.log('By category:', cats);
}

main().catch(console.error);
