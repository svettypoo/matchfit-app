// Add ~150 more exercises to reach 400+ total
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

// [name, cat, diff, primary[], secondary[], equip[], sets, reps, weight, rest, timed, dur, type, desc]
const EX = [
  // === MORE STRENGTH (30) ===
  ['Trap Bar Deadlift', 'strength', 'intermediate', ['quadriceps','glutes','hamstrings'], ['traps','core'], ['trap bar'], 4, 6, 80, 120, false, 0, 'independent', 'Deadlift variation using hex bar for more quad emphasis.'],
  ['Pause Squat', 'strength', 'advanced', ['quadriceps','glutes'], ['core','hamstrings'], ['barbell','squat rack'], 4, 5, 70, 120, false, 0, 'independent', 'Squat with 2-3 second pause at the bottom.'],
  ['Tempo Back Squat', 'strength', 'intermediate', ['quadriceps','glutes'], ['core','hamstrings'], ['barbell','squat rack'], 3, 8, 60, 90, false, 0, 'independent', 'Slow controlled descent over 3-4 seconds.'],
  ['Zercher Squat', 'strength', 'advanced', ['quadriceps','core','biceps'], ['glutes','upper back'], ['barbell'], 3, 6, 50, 120, false, 0, 'independent', 'Squat holding barbell in elbow crease.'],
  ['Close-Grip Bench Press', 'strength', 'intermediate', ['triceps','chest'], ['shoulders'], ['barbell','bench'], 3, 8, 50, 90, false, 0, 'independent', 'Bench press with hands shoulder-width for triceps emphasis.'],
  ['Incline Dumbbell Fly', 'strength', 'intermediate', ['upper chest'], ['shoulders','biceps'], ['dumbbells','incline bench'], 3, 12, 12, 60, false, 0, 'independent', 'Wide arc motion on incline bench targeting upper chest.'],
  ['Cable Crossover', 'strength', 'intermediate', ['chest'], ['front deltoids'], ['cable machine'], 3, 12, 15, 60, false, 0, 'independent', 'Cross cables from high to low for chest contraction.'],
  ['Dumbbell Pullover', 'strength', 'intermediate', ['lats','chest'], ['triceps','serratus'], ['dumbbell','bench'], 3, 12, 15, 60, false, 0, 'independent', 'Lie on bench lowering weight behind head for lat stretch.'],
  ['Pendlay Row', 'strength', 'intermediate', ['lats','rhomboids','traps'], ['biceps','core'], ['barbell'], 4, 6, 60, 90, false, 0, 'independent', 'Strict bent-over row from dead stop each rep.'],
  ['Meadows Row', 'strength', 'intermediate', ['lats','rear deltoids'], ['biceps','rhomboids'], ['barbell','landmine'], 3, 10, 20, 60, false, 0, 'independent', 'One-arm landmine row with staggered stance.'],
  ['Chest-Supported Row', 'strength', 'beginner', ['lats','rhomboids'], ['biceps','rear deltoids'], ['dumbbells','incline bench'], 3, 12, 15, 60, false, 0, 'independent', 'Row on incline bench to isolate back without low back strain.'],
  ['Z Press', 'strength', 'advanced', ['shoulders','triceps'], ['core','upper chest'], ['dumbbells'], 3, 8, 15, 90, false, 0, 'independent', 'Seated on floor overhead press for strict shoulder work.'],
  ['Behind the Neck Press', 'strength', 'advanced', ['shoulders','traps'], ['triceps'], ['barbell','squat rack'], 3, 8, 30, 90, false, 0, 'independent', 'Overhead press lowering bar behind head for shoulder mobility.'],
  ['Upright Row', 'strength', 'intermediate', ['traps','lateral deltoids'], ['biceps','forearms'], ['barbell'], 3, 10, 25, 60, false, 0, 'independent', 'Pull bar up along body to chin level.'],
  ['Barbell Shrug', 'strength', 'beginner', ['traps'], ['rhomboids','forearms'], ['barbell'], 3, 12, 60, 60, false, 0, 'independent', 'Shrug shoulders up holding heavy barbell.'],
  ['Reverse Grip Curl', 'strength', 'beginner', ['brachioradialis','forearms'], ['biceps'], ['barbell'], 3, 12, 15, 45, false, 0, 'independent', 'Curl with palms facing down for forearm development.'],
  ['Concentration Curl', 'strength', 'beginner', ['biceps'], ['forearms'], ['dumbbell'], 3, 12, 10, 45, false, 0, 'independent', 'Seated curl with elbow braced on inner thigh.'],
  ['Skull Crusher', 'strength', 'intermediate', ['triceps'], ['shoulders'], ['EZ bar','bench'], 3, 10, 20, 60, false, 0, 'independent', 'Lying tricep extension lowering bar toward forehead.'],
  ['Overhead Tricep Extension', 'strength', 'beginner', ['triceps'], ['shoulders'], ['dumbbell'], 3, 12, 12, 45, false, 0, 'independent', 'Extend weight overhead with both hands.'],
  ['Wrist Curl', 'strength', 'beginner', ['forearms'], [], ['dumbbell'], 3, 15, 8, 30, false, 0, 'independent', 'Curl wrist up with forearm resting on knee.'],
  ['Deficit Deadlift', 'strength', 'advanced', ['hamstrings','glutes','lower back'], ['quadriceps','core'], ['barbell','plates'], 4, 5, 80, 150, false, 0, 'independent', 'Deadlift standing on elevated platform for increased ROM.'],
  ['Snatch Grip Deadlift', 'strength', 'advanced', ['upper back','hamstrings','traps'], ['glutes','core','lats'], ['barbell'], 4, 5, 70, 150, false, 0, 'independent', 'Deadlift with extra-wide grip for upper back emphasis.'],
  ['Leg Extension', 'strength', 'beginner', ['quadriceps'], [], ['leg extension machine'], 3, 12, 30, 45, false, 0, 'independent', 'Isolate quadriceps by extending legs against resistance.'],
  ['Leg Curl', 'strength', 'beginner', ['hamstrings'], ['calves'], ['leg curl machine'], 3, 12, 25, 45, false, 0, 'independent', 'Curl heels toward glutes against machine resistance.'],
  ['Seated Calf Raise', 'strength', 'beginner', ['soleus'], ['calves'], ['seated calf machine'], 3, 15, 40, 30, false, 0, 'independent', 'Press up through toes in seated position for soleus.'],
  ['Hack Squat', 'strength', 'intermediate', ['quadriceps','glutes'], ['hamstrings'], ['hack squat machine'], 4, 10, 60, 90, false, 0, 'independent', 'Machine squat with back supported on angled pad.'],
  ['Belt Squat', 'strength', 'intermediate', ['quadriceps','glutes'], ['hamstrings','core'], ['belt squat machine'], 4, 10, 40, 90, false, 0, 'independent', 'Squat with weight hung from belt — no spinal loading.'],
  ['Glute Ham Raise', 'strength', 'advanced', ['hamstrings','glutes'], ['calves','core'], ['GHD machine'], 3, 8, 0, 90, false, 0, 'independent', 'Lower and raise torso using hamstrings on GHD.'],
  ['Nordic Hamstring Curl', 'strength', 'advanced', ['hamstrings'], ['glutes','calves'], ['bodyweight'], 3, 5, 0, 90, false, 0, 'independent', 'Slowly lower torso forward with feet anchored.'],
  ['Landmine Press', 'strength', 'intermediate', ['shoulders','upper chest','triceps'], ['core','serratus'], ['barbell','landmine'], 3, 10, 20, 60, false, 0, 'independent', 'Press barbell end upward in arcing path for shoulder-friendly pressing.'],

  // === MORE CORE (20) ===
  ['Pallof Press', 'core', 'intermediate', ['core','obliques'], ['shoulders'], ['cable machine','resistance band'], 3, 10, 10, 45, false, 0, 'independent', 'Resist rotation while pressing cable away from chest.'],
  ['Suitcase Carry', 'core', 'intermediate', ['obliques','core'], ['forearms','traps'], ['dumbbell','kettlebell'], 3, 0, 24, 60, true, 30, 'independent', 'Walk holding heavy weight in one hand for anti-lateral flexion.'],
  ['Waiter Walk', 'core', 'intermediate', ['shoulders','core','obliques'], ['traps'], ['dumbbell','kettlebell'], 3, 0, 12, 60, true, 30, 'independent', 'Walk with weight locked out overhead in one hand.'],
  ['Ab Wheel Rollout', 'core', 'advanced', ['abs','hip flexors'], ['shoulders','lats'], ['ab wheel'], 3, 8, 0, 60, false, 0, 'independent', 'Roll wheel forward and back maintaining flat lower back.'],
  ['Dragon Flag', 'core', 'advanced', ['abs','hip flexors'], ['core','obliques'], ['bench'], 3, 5, 0, 90, false, 0, 'independent', 'Lower straight body from shoulder stand position.'],
  ['V-Up', 'core', 'intermediate', ['abs','hip flexors'], ['core'], ['bodyweight'], 3, 12, 0, 45, false, 0, 'independent', 'Simultaneously raise legs and torso to touch toes.'],
  ['Hollow Body Hold', 'core', 'intermediate', ['abs','hip flexors'], ['core'], ['bodyweight'], 3, 0, 0, 45, true, 30, 'independent', 'Lie supine with arms and legs extended, lower back pressed flat.'],
  ['L-Sit Hold', 'core', 'advanced', ['abs','hip flexors','triceps'], ['shoulders'], ['parallettes','dip bars'], 3, 0, 0, 60, true, 15, 'independent', 'Hold legs parallel to ground in supported position.'],
  ['Copenhagen Plank', 'core', 'advanced', ['adductors','obliques'], ['core','hip flexors'], ['bench'], 3, 0, 0, 45, true, 20, 'independent', 'Side plank with top leg on bench for adductor emphasis.'],
  ['Reverse Crunch', 'core', 'beginner', ['lower abs'], ['hip flexors','core'], ['bodyweight'], 3, 15, 0, 30, false, 0, 'independent', 'Lift hips off ground curling pelvis toward ribcage.'],
  ['Decline Sit-Up', 'core', 'intermediate', ['abs','hip flexors'], ['core'], ['decline bench'], 3, 15, 0, 45, false, 0, 'independent', 'Sit-up on decline bench for increased resistance.'],
  ['Hanging Windshield Wiper', 'core', 'advanced', ['obliques','abs'], ['hip flexors','forearms'], ['pull-up bar'], 3, 8, 0, 90, false, 0, 'independent', 'Hang and rotate straight legs side to side.'],
  ['Cable Woodchop', 'core', 'intermediate', ['obliques','core'], ['shoulders','hips'], ['cable machine'], 3, 12, 15, 45, false, 0, 'independent', 'Diagonal chop from high to low or low to high.'],
  ['Side Bend', 'core', 'beginner', ['obliques'], ['core'], ['dumbbell'], 3, 15, 15, 30, false, 0, 'independent', 'Lean sideways with weight for oblique isolation.'],
  ['Stability Ball Crunch', 'core', 'beginner', ['abs'], ['core','hip flexors'], ['stability ball'], 3, 15, 0, 30, false, 0, 'independent', 'Crunch on stability ball for greater range of motion.'],
  ['Stir the Pot', 'core', 'intermediate', ['core','abs','obliques'], ['shoulders'], ['stability ball'], 3, 10, 0, 45, false, 0, 'independent', 'Plank on ball making small circles with forearms.'],
  ['TRX Fallout', 'core', 'intermediate', ['abs','shoulders'], ['core','lats'], ['TRX'], 3, 10, 0, 45, false, 0, 'independent', 'Extend arms forward on TRX maintaining rigid body.'],
  ['TRX Pike', 'core', 'advanced', ['abs','hip flexors'], ['shoulders','core'], ['TRX'], 3, 8, 0, 60, false, 0, 'independent', 'Feet in TRX, pike hips up keeping legs straight.'],
  ['Barbell Rollout', 'core', 'advanced', ['abs','hip flexors'], ['shoulders','lats'], ['barbell'], 3, 8, 0, 60, false, 0, 'independent', 'Roll barbell forward and back like an ab wheel.'],
  ['Medicine Ball V-Twist', 'core', 'intermediate', ['obliques','abs'], ['hip flexors'], ['medicine ball'], 3, 15, 5, 45, false, 0, 'independent', 'V-sit twisting medicine ball side to side.'],

  // === MORE SPEED (15) ===
  ['Flying 30m Sprint', 'speed', 'intermediate', ['quadriceps','glutes','hamstrings'], ['calves','hip flexors','core'], ['cones'], 6, 1, 0, 120, true, 5, 'independent', 'Build-up run then max effort 30m for top speed training.'],
  ['Resisted Sprint', 'speed', 'advanced', ['glutes','hamstrings','quadriceps'], ['calves','core'], ['sled','harness'], 4, 1, 0, 150, true, 8, 'partner', 'Sprint against resistance from sled or partner.'],
  ['Downhill Sprint', 'speed', 'intermediate', ['quadriceps','hip flexors'], ['hamstrings','calves'], ['slight slope'], 4, 1, 0, 120, true, 6, 'independent', 'Sprint on slight decline to develop overspeed.'],
  ['In and Out Sprint', 'speed', 'intermediate', ['quadriceps','hamstrings'], ['calves','core'], ['cones'], 6, 1, 0, 90, true, 10, 'independent', 'Alternate sprint and float zones for speed endurance.'],
  ['Falling Start Sprint', 'speed', 'beginner', ['quadriceps','glutes'], ['core','calves'], ['bodyweight'], 6, 1, 0, 90, true, 5, 'independent', 'Fall forward from standing then sprint upon foot contact.'],
  ['Three-Point Start', 'speed', 'intermediate', ['quadriceps','glutes','hamstrings'], ['core','calves'], ['bodyweight'], 6, 1, 0, 90, true, 5, 'independent', 'Sprint start from three-point stance like a sprinter.'],
  ['Hill Sprint', 'speed', 'advanced', ['glutes','quadriceps','calves'], ['hamstrings','core'], ['hill'], 6, 1, 0, 150, true, 10, 'independent', 'Sprint uphill for strength-speed development.'],
  ['Wicket Run', 'speed', 'intermediate', ['hip flexors','hamstrings'], ['calves','quadriceps'], ['mini hurdles'], 4, 1, 0, 90, true, 8, 'independent', 'Sprint through evenly spaced mini hurdles for stride length.'],
  ['Contrast Sprint', 'speed', 'advanced', ['quadriceps','glutes','hamstrings'], ['calves','core'], ['sled','cones'], 4, 2, 0, 180, true, 12, 'independent', 'Heavy sled push followed immediately by unloaded sprint.'],
  ['Arm Action Drill', 'speed', 'beginner', ['shoulders','core'], ['biceps','triceps'], ['bodyweight'], 3, 0, 0, 30, true, 20, 'independent', 'Seated or standing aggressive arm pumping for sprint mechanics.'],
  ['Wall Drive', 'speed', 'beginner', ['hip flexors','glutes','core'], ['quadriceps'], ['wall'], 3, 10, 0, 45, false, 0, 'independent', 'Lean against wall driving knees up alternately.'],
  ['Acceleration Sled March', 'speed', 'intermediate', ['glutes','quadriceps'], ['core','calves'], ['sled'], 3, 0, 0, 90, true, 20, 'independent', 'Heavy sled march with exaggerated knee drive.'],
  ['Standing Arm Drive', 'speed', 'beginner', ['shoulders'], ['core','triceps'], ['bodyweight'], 3, 0, 0, 30, true, 15, 'independent', 'Drive arms aggressively while standing for sprint technique.'],
  ['Stride Length Bounds', 'speed', 'intermediate', ['glutes','hamstrings','quadriceps'], ['calves','core'], ['cones'], 4, 8, 0, 60, false, 0, 'independent', 'Bounding over marked distances for stride power.'],
  ['Parachute Sprint', 'speed', 'advanced', ['glutes','quadriceps','hamstrings'], ['core','calves'], ['speed parachute'], 4, 1, 0, 150, true, 8, 'independent', 'Sprint with resistance parachute for max power.'],

  // === MORE AGILITY (15) ===
  ['5-10-5 Pro Agility', 'agility', 'intermediate', ['quadriceps','glutes','calves'], ['hamstrings','core','hip flexors'], ['cones'], 6, 1, 0, 90, true, 5, 'independent', 'Sprint 5 yards, cut, sprint 10, cut, sprint 5 for change of direction.'],
  ['Illinois Agility Run', 'agility', 'intermediate', ['quadriceps','glutes','calves'], ['hamstrings','core'], ['cones'], 4, 1, 0, 120, true, 15, 'independent', 'Weave through cone course testing agility and acceleration.'],
  ['Reactive Agility Drill', 'agility', 'advanced', ['quadriceps','calves'], ['core','hip flexors','hamstrings'], ['cones'], 4, 6, 0, 90, true, 10, 'partner', 'React to partner cues for unpredictable direction changes.'],
  ['Star Drill', 'agility', 'intermediate', ['quadriceps','calves','glutes'], ['core','hip flexors'], ['cones'], 4, 1, 0, 90, true, 12, 'independent', 'Sprint from center to 5 cones in star pattern.'],
  ['Mirror Drill', 'agility', 'intermediate', ['quadriceps','calves'], ['core','hip flexors'], ['cones'], 4, 0, 0, 60, true, 20, 'partner', 'Shadow a partners movements in a confined space.'],
  ['W Drill', 'agility', 'intermediate', ['quadriceps','glutes','calves'], ['hamstrings','core'], ['cones'], 4, 1, 0, 90, true, 8, 'independent', 'Sprint in W pattern with sharp cuts at each cone.'],
  ['Box Drill', 'agility', 'beginner', ['quadriceps','calves'], ['core','glutes'], ['cones'], 4, 1, 0, 60, true, 8, 'independent', 'Sprint, shuffle, backpedal, shuffle in box pattern.'],
  ['Zig-Zag Run', 'agility', 'beginner', ['quadriceps','calves','glutes'], ['core','hip flexors'], ['cones'], 4, 1, 0, 60, true, 10, 'independent', 'Sprint between angled cones for cutting practice.'],
  ['Figure 8 Drill', 'agility', 'beginner', ['quadriceps','calves'], ['core','hip flexors'], ['cones'], 4, 3, 0, 60, true, 10, 'independent', 'Run figure 8 pattern around two cones.'],
  ['Lateral Shuffle to Sprint', 'agility', 'intermediate', ['quadriceps','adductors','calves'], ['core','glutes'], ['cones'], 4, 4, 0, 60, true, 8, 'independent', 'Shuffle laterally then transition to forward sprint.'],
  ['Crossover Step Drill', 'agility', 'intermediate', ['hip flexors','adductors','calves'], ['core','glutes'], ['cones'], 3, 8, 0, 45, false, 0, 'independent', 'Cross one foot over the other moving laterally.'],
  ['Reaction Ball Drill', 'agility', 'intermediate', ['quadriceps','calves','core'], ['hamstrings','hip flexors'], ['reaction ball'], 3, 0, 0, 45, true, 30, 'independent', 'Chase erratically bouncing ball for reactive agility.'],
  ['Backpedal to Sprint', 'agility', 'intermediate', ['quadriceps','glutes','calves'], ['hamstrings','core'], ['cones'], 4, 4, 0, 60, true, 6, 'independent', 'Backpedal then hip turn and sprint forward.'],
  ['Deceleration Drill', 'agility', 'intermediate', ['quadriceps','calves'], ['core','hamstrings'], ['cones'], 4, 4, 0, 60, true, 6, 'independent', 'Sprint then stop as quickly as possible in 2-3 steps.'],
  ['Speed Ladder In-Out', 'agility', 'beginner', ['calves','quadriceps'], ['core','hip flexors'], ['agility ladder'], 3, 3, 0, 45, true, 8, 'independent', 'Step in and out of each ladder box moving forward.'],

  // === MORE BALL_WORK (20) ===
  ['Rondo Possession', 'ball_work', 'intermediate', ['quadriceps','calves'], ['core','hip flexors'], ['football'], 1, 0, 0, 0, true, 300, 'team', 'Small-sided keep-away game for passing under pressure.'],
  ['Wall Pass Drill', 'ball_work', 'beginner', ['quadriceps','calves'], ['core'], ['football','wall'], 3, 20, 0, 30, false, 0, 'independent', 'Two-touch passing against a wall for first touch.'],
  ['Sole Roll', 'ball_work', 'beginner', ['calves','quadriceps'], ['core','hip flexors'], ['football'], 3, 0, 0, 15, true, 30, 'independent', 'Roll ball under sole of foot for close control.'],
  ['Inside-Outside Touch', 'ball_work', 'beginner', ['calves','quadriceps'], ['core','hip flexors'], ['football'], 3, 20, 0, 30, false, 0, 'independent', 'Alternate inside and outside foot touches while moving.'],
  ['Drag Back Turn', 'ball_work', 'beginner', ['calves','quadriceps'], ['core'], ['football'], 3, 10, 0, 30, false, 0, 'independent', 'Pull ball back with sole and turn 180 degrees.'],
  ['Cruyff Turn', 'ball_work', 'intermediate', ['calves','quadriceps','hip flexors'], ['core'], ['football'], 3, 10, 0, 45, false, 0, 'independent', 'Fake pass then cut ball behind standing leg.'],
  ['Step Over', 'ball_work', 'intermediate', ['hip flexors','calves'], ['core','quadriceps'], ['football'], 3, 10, 0, 45, false, 0, 'independent', 'Circle foot over ball before pushing away with outside.'],
  ['Elastico', 'ball_work', 'advanced', ['calves','ankle'], ['hip flexors','core'], ['football'], 3, 10, 0, 60, false, 0, 'independent', 'Flick ball outside then quickly snap inside to beat defender.'],
  ['Maradona Turn', 'ball_work', 'advanced', ['calves','quadriceps'], ['core','hip flexors'], ['football'], 3, 8, 0, 60, false, 0, 'independent', 'Drag ball with one foot and spin 360 with other foot.'],
  ['Volleys Against Wall', 'ball_work', 'intermediate', ['quadriceps','calves'], ['core','hip flexors'], ['football','wall'], 3, 15, 0, 30, false, 0, 'independent', 'Volley ball against wall without letting it bounce.'],
  ['Header Accuracy', 'ball_work', 'beginner', ['neck','core'], ['quadriceps'], ['football'], 3, 10, 0, 30, false, 0, 'partner', 'Head ball toward target from tossed service.'],
  ['Weak Foot Passing', 'ball_work', 'intermediate', ['calves','quadriceps'], ['core'], ['football','cones'], 3, 20, 0, 30, false, 0, 'independent', 'Pass exclusively with non-dominant foot for balance.'],
  ['Long Ball Accuracy', 'ball_work', 'intermediate', ['quadriceps','hip flexors'], ['core','calves'], ['football','cones'], 3, 10, 0, 60, false, 0, 'independent', 'Hit targets at 30+ yards with driven or lofted pass.'],
  ['Shooting Drill', 'ball_work', 'intermediate', ['quadriceps','hip flexors'], ['core','calves'], ['football','goal'], 3, 10, 0, 45, false, 0, 'independent', 'Shoot from various angles and distances.'],
  ['One-Touch Finish', 'ball_work', 'advanced', ['quadriceps','calves'], ['core','hip flexors'], ['football','goal'], 3, 10, 0, 45, false, 0, 'partner', 'Receive and shoot first time from different angles.'],
  ['Dribble Obstacle Course', 'ball_work', 'intermediate', ['calves','quadriceps','hip flexors'], ['core'], ['football','cones'], 3, 3, 0, 60, true, 20, 'independent', 'Navigate through tight cone course while maintaining close control.'],
  ['Passing Triangle', 'ball_work', 'beginner', ['calves','quadriceps'], ['core'], ['football','cones'], 3, 0, 0, 30, true, 120, 'team', 'Three players passing in triangle with movement.'],
  ['Ball Juggling', 'ball_work', 'intermediate', ['calves','quadriceps','hip flexors'], ['core'], ['football'], 3, 0, 0, 30, true, 60, 'independent', 'Keep ball in air using feet, thighs, and head.'],
  ['Rainbow Flick', 'ball_work', 'advanced', ['calves','hamstrings'], ['core','hip flexors'], ['football'], 3, 5, 0, 45, false, 0, 'independent', 'Roll ball up back of leg and flick over head.'],
  ['Nutmeg Drill', 'ball_work', 'advanced', ['calves','quadriceps'], ['core','hip flexors'], ['football','cones'], 3, 0, 0, 60, true, 60, 'partner', 'Practice pushing ball through defenders legs.'],

  // === MORE PLYOMETRICS (15) ===
  ['Altitude Drop', 'plyometrics', 'advanced', ['quadriceps','calves','glutes'], ['hamstrings','core'], ['plyo box'], 4, 5, 0, 120, false, 0, 'independent', 'Step off high box and absorb landing for eccentric strength.'],
  ['Single Leg Box Jump', 'plyometrics', 'advanced', ['quadriceps','glutes','calves'], ['hamstrings','core'], ['plyo box'], 3, 5, 0, 120, false, 0, 'independent', 'Jump onto box from one leg for unilateral power.'],
  ['Broad Jump to Vertical', 'plyometrics', 'intermediate', ['quadriceps','glutes','calves'], ['hamstrings','core'], ['bodyweight'], 4, 5, 0, 90, false, 0, 'independent', 'Horizontal jump immediately followed by vertical jump.'],
  ['Skater Jump', 'plyometrics', 'intermediate', ['glutes','quadriceps','calves'], ['adductors','core'], ['bodyweight'], 3, 12, 0, 60, false, 0, 'independent', 'Bound laterally from one leg to the other.'],
  ['Star Jump', 'plyometrics', 'beginner', ['quadriceps','calves','glutes'], ['core','shoulders'], ['bodyweight'], 3, 10, 0, 45, false, 0, 'independent', 'Jump spreading arms and legs into X shape.'],
  ['Plyo Lunge', 'plyometrics', 'intermediate', ['quadriceps','glutes'], ['hamstrings','calves','core'], ['bodyweight'], 3, 10, 0, 60, false, 0, 'independent', 'Jump and switch legs in lunge position.'],
  ['Reactive Step-Up', 'plyometrics', 'intermediate', ['quadriceps','glutes','calves'], ['hamstrings'], ['plyo box'], 3, 8, 0, 60, false, 0, 'independent', 'Rapid alternating step-ups with explosive drive.'],
  ['Hurdle Hop Series', 'plyometrics', 'intermediate', ['calves','quadriceps','glutes'], ['hamstrings','core'], ['mini hurdles'], 4, 1, 0, 90, true, 10, 'independent', 'Continuous hops over series of hurdles.'],
  ['Ankle Bounce', 'plyometrics', 'beginner', ['calves'], ['quadriceps'], ['bodyweight'], 3, 20, 0, 30, false, 0, 'independent', 'Quick bounces using only ankle flexion.'],
  ['Single Leg Pogo', 'plyometrics', 'intermediate', ['calves','quadriceps'], ['core'], ['bodyweight'], 3, 15, 0, 45, false, 0, 'independent', 'Quick single-leg hops for ankle stiffness.'],
  ['Lateral Box Jump', 'plyometrics', 'intermediate', ['quadriceps','glutes','adductors'], ['calves','core'], ['plyo box'], 3, 8, 0, 60, false, 0, 'independent', 'Jump sideways onto box for lateral power.'],
  ['Seated Box Jump', 'plyometrics', 'advanced', ['quadriceps','glutes'], ['calves','core'], ['plyo box','bench'], 4, 5, 0, 120, false, 0, 'independent', 'Jump from seated position eliminating stretch reflex.'],
  ['Double Under', 'plyometrics', 'intermediate', ['calves','forearms'], ['shoulders','core'], ['jump rope'], 3, 20, 0, 60, false, 0, 'independent', 'Jump rope passing rope under feet twice per jump.'],
  ['Lateral Bound', 'plyometrics', 'intermediate', ['glutes','quadriceps','adductors'], ['calves','core'], ['bodyweight'], 3, 10, 0, 60, false, 0, 'independent', 'Powerful single-leg lateral jump sticking the landing.'],
  ['Continuous Box Jump', 'plyometrics', 'intermediate', ['quadriceps','glutes','calves'], ['hamstrings','core'], ['plyo box'], 3, 8, 0, 90, false, 0, 'independent', 'Jump on and off box continuously without pausing.'],

  // === MORE FLEXIBILITY (10) ===
  ['Half Split', 'flexibility', 'intermediate', ['hamstrings','hip flexors'], ['calves'], ['bodyweight'], 2, 0, 0, 15, true, 30, 'independent', 'One leg forward straight, back knee down for hamstring stretch.'],
  ['Supine Spinal Twist', 'flexibility', 'beginner', ['lower back','obliques'], ['glutes'], ['bodyweight'], 2, 0, 0, 15, true, 30, 'independent', 'Lie on back dropping knees to one side.'],
  ['Standing Calf Stretch', 'flexibility', 'beginner', ['calves','soleus'], [], ['wall'], 2, 0, 0, 15, true, 30, 'independent', 'Press heel down with toes on wall for calf stretch.'],
  ['Prone Quad Stretch', 'flexibility', 'beginner', ['quadriceps','hip flexors'], [], ['bodyweight'], 2, 0, 0, 15, true, 30, 'independent', 'Lie face down pulling heel to glutes.'],
  ['Lat Hang', 'flexibility', 'beginner', ['lats','shoulders'], ['thoracic spine'], ['pull-up bar'], 2, 0, 0, 15, true, 30, 'independent', 'Hang from bar for lat and shoulder stretch.'],
  ['Wall Shoulder Slide', 'flexibility', 'intermediate', ['shoulders','thoracic spine'], ['traps'], ['wall'], 2, 10, 0, 15, false, 0, 'independent', 'Slide arms up wall maintaining contact through full ROM.'],
  ['Seated Straddle Stretch', 'flexibility', 'intermediate', ['adductors','hamstrings'], ['lower back'], ['bodyweight'], 2, 0, 0, 15, true, 45, 'independent', 'Sit with wide legs folding forward center and to each side.'],
  ['Happy Baby', 'flexibility', 'beginner', ['groin','hip flexors'], ['lower back'], ['bodyweight'], 2, 0, 0, 15, true, 30, 'independent', 'Lie on back holding feet with knees drawn toward armpits.'],
  ['Scorpion Stretch', 'flexibility', 'intermediate', ['hip flexors','obliques','chest'], ['shoulders'], ['bodyweight'], 2, 8, 0, 15, false, 0, 'independent', 'Lie prone rotating one leg across body for rotation.'],
  ['Bretzel Stretch', 'flexibility', 'advanced', ['hip flexors','quadriceps','thoracic spine'], ['chest','shoulders'], ['bodyweight'], 2, 0, 0, 15, true, 30, 'independent', 'Complex stretch combining hip flexor, quad, and thoracic rotation.'],

  // === MORE RECOVERY (10) ===
  ['Contrast Shower', 'recovery', 'beginner', ['full body'], [], ['shower'], 1, 0, 0, 0, true, 300, 'independent', 'Alternate 30s cold and 60s hot water for circulation.'],
  ['Self-Massage Hamstrings', 'recovery', 'beginner', ['hamstrings'], [], ['massage stick'], 1, 0, 0, 0, true, 120, 'independent', 'Roll massage stick over hamstrings for tension release.'],
  ['Percussion Gun Quads', 'recovery', 'beginner', ['quadriceps'], [], ['massage gun'], 1, 0, 0, 0, true, 120, 'independent', 'Use percussion gun on quad muscles for myofascial release.'],
  ['Cold Water Immersion', 'recovery', 'beginner', ['full body'], [], ['ice bath','cold tub'], 1, 0, 0, 0, true, 180, 'independent', 'Immerse in cold water 10-15C for recovery and inflammation.'],
  ['Bodyweight Squat Flow', 'recovery', 'beginner', ['quadriceps','glutes','hip flexors'], ['core'], ['bodyweight'], 2, 10, 0, 15, false, 0, 'independent', 'Slow controlled bodyweight squats for blood flow.'],
  ['Wrist Circles', 'recovery', 'beginner', ['forearms','wrists'], [], ['bodyweight'], 2, 10, 0, 10, false, 0, 'independent', 'Circle wrists in both directions for joint health.'],
  ['Cat Stretch', 'recovery', 'beginner', ['spine','core'], [], ['bodyweight'], 2, 8, 0, 10, false, 0, 'independent', 'On all fours alternating between arching and rounding.'],
  ['Leg Swing Forward-Back', 'recovery', 'beginner', ['hip flexors','hamstrings'], ['glutes'], ['bodyweight'], 2, 15, 0, 10, false, 0, 'independent', 'Swing leg forward and back in controlled pendulum motion.'],
  ['Leg Swing Side to Side', 'recovery', 'beginner', ['adductors','abductors'], ['hip flexors'], ['bodyweight'], 2, 15, 0, 10, false, 0, 'independent', 'Swing leg across body and out for hip mobility.'],
  ['Band Pull-Apart Recovery', 'recovery', 'beginner', ['rear deltoids','rhomboids'], ['traps'], ['light resistance band'], 2, 15, 0, 15, false, 0, 'independent', 'Gentle band pull-aparts for upper back blood flow.'],
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
  // Check current count first
  const existing = await api('GET', '/rest/v1/mf_exercises?select=id');
  const currentCount = Array.isArray(existing) ? existing.length : 0;
  console.log(`Current exercise count: ${currentCount}`);

  // Check for name conflicts
  const existingNames = await api('GET', '/rest/v1/mf_exercises?select=name');
  const nameSet = new Set((Array.isArray(existingNames) ? existingNames : []).map(e => e.name));

  const exercises = EX.map(buildExercise).filter(e => !nameSet.has(e.name));
  console.log(`Adding ${exercises.length} new exercises (${EX.length - exercises.length} skipped as duplicates)...`);

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
