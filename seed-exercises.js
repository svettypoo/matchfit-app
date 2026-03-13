const https = require('https');
const fs = require('fs');
const { randomUUID } = require('crypto');

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
        try { resolve(JSON.parse(b)); } catch { resolve(b); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// Comprehensive exercise library
const EXERCISES = [
  // === STRENGTH (weights/resistance) ===
  { name: 'Barbell Back Squat', description: 'Stand with barbell on upper back. Bend knees and hips to lower until thighs are parallel, then drive up.', category: 'strength', muscle_groups: ['quadriceps', 'glutes', 'hamstrings'], equipment: ['barbell', 'squat rack'], difficulty: 'intermediate', exercise_type: 'independent', is_timed: false, default_sets: 4, default_reps: 8, default_rest_sec: 120, default_weight_kg: 60, tracking_fields: ['weight', 'reps', 'rpe'], primary_muscles: ['quadriceps', 'glutes'], secondary_muscles: ['hamstrings', 'core', 'lower back'], instructions: '1. Position barbell on upper traps\n2. Feet shoulder-width apart, toes slightly out\n3. Brace core, inhale\n4. Bend knees and hips simultaneously\n5. Lower until thighs parallel to floor\n6. Drive through heels to stand', tips: 'Keep chest up. Dont let knees cave inward. Full depth for max glute activation.' },
  { name: 'Barbell Deadlift', description: 'Lift barbell from floor to hip height with flat back, engaging posterior chain.', category: 'strength', muscle_groups: ['hamstrings', 'glutes', 'lower back'], equipment: ['barbell'], difficulty: 'intermediate', exercise_type: 'independent', is_timed: false, default_sets: 4, default_reps: 6, default_rest_sec: 150, default_weight_kg: 80, tracking_fields: ['weight', 'reps', 'rpe'], primary_muscles: ['hamstrings', 'glutes'], secondary_muscles: ['lower back', 'traps', 'forearms'], instructions: '1. Stand with feet hip-width, bar over mid-foot\n2. Hinge at hips, grip bar outside knees\n3. Flatten back, chest up\n4. Drive through floor, extending hips and knees\n5. Lock out at top\n6. Lower with control', tips: 'Keep bar close to body. Dont round your lower back. Engage lats before pulling.' },
  { name: 'Bench Press', description: 'Lie on bench, lower barbell to chest, press up to full extension.', category: 'strength', muscle_groups: ['chest', 'shoulders', 'triceps'], equipment: ['barbell', 'bench'], difficulty: 'intermediate', exercise_type: 'partner', is_timed: false, default_sets: 4, default_reps: 8, default_rest_sec: 120, default_weight_kg: 50, tracking_fields: ['weight', 'reps', 'rpe'], primary_muscles: ['chest'], secondary_muscles: ['front deltoids', 'triceps'], instructions: '1. Lie flat, eyes under bar\n2. Grip slightly wider than shoulders\n3. Unrack, lower to mid-chest\n4. Touch chest lightly\n5. Press up to lockout', tips: 'Keep shoulder blades pinched. Feet flat on floor. Use a spotter for heavy sets.' },
  { name: 'Overhead Press', description: 'Press barbell from shoulder height to overhead with strict form.', category: 'strength', muscle_groups: ['shoulders', 'triceps'], equipment: ['barbell'], difficulty: 'intermediate', exercise_type: 'independent', is_timed: false, default_sets: 3, default_reps: 8, default_rest_sec: 90, default_weight_kg: 30, tracking_fields: ['weight', 'reps', 'rpe'], primary_muscles: ['front deltoids', 'lateral deltoids'], secondary_muscles: ['triceps', 'upper chest', 'traps'], instructions: '1. Grip bar at shoulder width\n2. Bar rests on front shoulders\n3. Brace core, press overhead\n4. Lock out arms, bar over midfoot\n5. Lower with control', tips: 'Squeeze glutes for stability. Move head back slightly as bar passes face.' },
  { name: 'Barbell Row', description: 'Hinge forward at hips, pull barbell to lower chest/upper stomach.', category: 'strength', muscle_groups: ['upper back', 'biceps', 'lats'], equipment: ['barbell'], difficulty: 'intermediate', exercise_type: 'independent', is_timed: false, default_sets: 4, default_reps: 10, default_rest_sec: 90, default_weight_kg: 50, tracking_fields: ['weight', 'reps', 'rpe'], primary_muscles: ['lats', 'rhomboids'], secondary_muscles: ['biceps', 'rear deltoids', 'lower back'], instructions: '1. Hinge at hips, back flat, ~45 degrees\n2. Grip bar slightly wider than shoulders\n3. Pull bar to lower ribcage\n4. Squeeze shoulder blades at top\n5. Lower with control', tips: 'Dont use momentum. Keep elbows close to body. Pause at the top for maximum contraction.' },
  { name: 'Dumbbell Lunges', description: 'Step forward with dumbbell in each hand, lower back knee toward floor.', category: 'strength', muscle_groups: ['quadriceps', 'glutes', 'hamstrings'], equipment: ['dumbbells'], difficulty: 'beginner', exercise_type: 'independent', is_timed: false, default_sets: 3, default_reps: 12, default_rest_sec: 60, default_weight_kg: 10, tracking_fields: ['weight', 'reps'], primary_muscles: ['quadriceps', 'glutes'], secondary_muscles: ['hamstrings', 'calves', 'core'], instructions: '1. Hold dumbbells at sides\n2. Step forward with one leg\n3. Lower until both knees at 90 degrees\n4. Push through front heel to return\n5. Alternate legs', tips: 'Keep torso upright. Front knee tracks over toes. Step far enough that knee doesnt go past toes.' },
  { name: 'Romanian Deadlift (RDL)', description: 'Hinge at hips with slight knee bend, lowering weight along thighs.', category: 'strength', muscle_groups: ['hamstrings', 'glutes', 'lower back'], equipment: ['barbell'], difficulty: 'intermediate', exercise_type: 'independent', is_timed: false, default_sets: 3, default_reps: 10, default_rest_sec: 90, default_weight_kg: 50, tracking_fields: ['weight', 'reps', 'rpe'], primary_muscles: ['hamstrings', 'glutes'], secondary_muscles: ['lower back', 'core'], instructions: '1. Hold barbell at hip height\n2. Slight knee bend, push hips back\n3. Lower bar along thighs\n4. Feel stretch in hamstrings\n5. Drive hips forward to return', tips: 'Keep bar close to legs. Dont round back. Stop when you feel hamstring stretch limit.' },
  { name: 'Dumbbell Shoulder Press', description: 'Press dumbbells from shoulder height to overhead while seated or standing.', category: 'strength', muscle_groups: ['shoulders', 'triceps'], equipment: ['dumbbells'], difficulty: 'beginner', exercise_type: 'independent', is_timed: false, default_sets: 3, default_reps: 10, default_rest_sec: 60, default_weight_kg: 8, tracking_fields: ['weight', 'reps'], primary_muscles: ['front deltoids', 'lateral deltoids'], secondary_muscles: ['triceps', 'traps'], instructions: '1. Hold dumbbells at shoulder height, palms forward\n2. Press up until arms fully extended\n3. Lower slowly to starting position', tips: 'Dont arch lower back. Control the weight on the way down.' },
  { name: 'Goblet Squat', description: 'Hold dumbbell or kettlebell at chest, squat deep with upright torso.', category: 'strength', muscle_groups: ['quadriceps', 'glutes'], equipment: ['dumbbell'], difficulty: 'beginner', exercise_type: 'independent', is_timed: false, default_sets: 3, default_reps: 12, default_rest_sec: 60, default_weight_kg: 16, tracking_fields: ['weight', 'reps'], primary_muscles: ['quadriceps', 'glutes'], secondary_muscles: ['core', 'upper back'], instructions: '1. Hold weight close to chest\n2. Feet shoulder-width, toes slightly out\n3. Squat deep, elbows between knees\n4. Drive up through heels', tips: 'Great for learning squat form. The front load keeps your torso upright naturally.' },
  { name: 'Lat Pulldown', description: 'Pull cable bar from overhead down to upper chest while seated.', category: 'strength', muscle_groups: ['lats', 'biceps', 'upper back'], equipment: ['cable machine'], difficulty: 'beginner', exercise_type: 'independent', is_timed: false, default_sets: 3, default_reps: 12, default_rest_sec: 60, default_weight_kg: 40, tracking_fields: ['weight', 'reps'], primary_muscles: ['lats'], secondary_muscles: ['biceps', 'rear deltoids', 'rhomboids'], instructions: '1. Grip bar wider than shoulders\n2. Lean back slightly\n3. Pull bar to upper chest\n4. Squeeze shoulder blades\n5. Release with control', tips: 'Dont swing body. Focus on pulling with elbows, not hands.' },
  { name: 'Leg Press', description: 'Push weighted platform away using legs while seated in leg press machine.', category: 'strength', muscle_groups: ['quadriceps', 'glutes', 'hamstrings'], equipment: ['leg press machine'], difficulty: 'beginner', exercise_type: 'independent', is_timed: false, default_sets: 4, default_reps: 12, default_rest_sec: 90, default_weight_kg: 100, tracking_fields: ['weight', 'reps'], primary_muscles: ['quadriceps', 'glutes'], secondary_muscles: ['hamstrings', 'calves'], instructions: '1. Sit in machine, back flat against pad\n2. Place feet shoulder-width on platform\n3. Lower platform until knees at 90 degrees\n4. Press up without locking knees', tips: 'Dont lock knees at top. Keep lower back pressed against pad.' },
  { name: 'Dumbbell Bicep Curl', description: 'Curl dumbbells from arm-extended position to shoulders.', category: 'strength', muscle_groups: ['biceps', 'forearms'], equipment: ['dumbbells'], difficulty: 'beginner', exercise_type: 'independent', is_timed: false, default_sets: 3, default_reps: 12, default_rest_sec: 45, default_weight_kg: 8, tracking_fields: ['weight', 'reps'], primary_muscles: ['biceps'], secondary_muscles: ['forearms', 'brachialis'], instructions: '1. Stand with dumbbells at sides\n2. Curl up, rotating palms up\n3. Squeeze at top\n4. Lower slowly', tips: 'Dont swing. Keep elbows pinned to your sides.' },
  { name: 'Tricep Dips', description: 'Lower and raise body using arms on parallel bars or bench.', category: 'strength', muscle_groups: ['triceps', 'chest', 'shoulders'], equipment: ['dip bars'], difficulty: 'intermediate', exercise_type: 'independent', is_timed: false, default_sets: 3, default_reps: 10, default_rest_sec: 60, default_weight_kg: null, tracking_fields: ['reps', 'rpe'], primary_muscles: ['triceps'], secondary_muscles: ['chest', 'front deltoids'], instructions: '1. Grip bars, arms straight\n2. Lower body by bending elbows\n3. Go until upper arms parallel\n4. Press up to starting position', tips: 'Lean slightly forward for more chest. Stay upright for more triceps.' },
  { name: 'Bulgarian Split Squat', description: 'Single-leg squat with rear foot elevated on bench.', category: 'strength', muscle_groups: ['quadriceps', 'glutes'], equipment: ['dumbbells', 'bench'], difficulty: 'intermediate', exercise_type: 'independent', is_timed: false, default_sets: 3, default_reps: 10, default_rest_sec: 60, default_weight_kg: 10, tracking_fields: ['weight', 'reps'], primary_muscles: ['quadriceps', 'glutes'], secondary_muscles: ['hamstrings', 'hip flexors'], instructions: '1. Place rear foot on bench behind you\n2. Hold dumbbells at sides\n3. Lower until front thigh parallel\n4. Drive up through front heel', tips: 'Keep front shin vertical. Most of the weight should be on the front leg.' },
  { name: 'Hip Thrust', description: 'Drive hips upward with upper back on bench and barbell across hips.', category: 'strength', muscle_groups: ['glutes', 'hamstrings'], equipment: ['barbell', 'bench'], difficulty: 'intermediate', exercise_type: 'independent', is_timed: false, default_sets: 4, default_reps: 10, default_rest_sec: 90, default_weight_kg: 60, tracking_fields: ['weight', 'reps', 'rpe'], primary_muscles: ['glutes'], secondary_muscles: ['hamstrings', 'core'], instructions: '1. Upper back against bench edge\n2. Barbell across hips (pad recommended)\n3. Feet flat, knees at 90 degrees at top\n4. Drive hips up, squeeze glutes\n5. Lower with control', tips: 'Full lockout at top. Chin stays tucked. Best glute isolation exercise.' },

  // === BODYWEIGHT / CALISTHENICS ===
  { name: 'Push-Ups', description: 'Lower and raise body from plank position using arms.', category: 'strength', muscle_groups: ['chest', 'triceps', 'shoulders'], equipment: ['bodyweight'], difficulty: 'beginner', exercise_type: 'independent', is_timed: false, default_sets: 3, default_reps: 15, default_rest_sec: 45, default_weight_kg: null, tracking_fields: ['reps', 'rpe'], primary_muscles: ['chest'], secondary_muscles: ['triceps', 'front deltoids', 'core'], instructions: '1. Hands shoulder-width, body straight\n2. Lower chest to floor\n3. Push up to full extension\n4. Keep core tight throughout', tips: 'Dont let hips sag. Full range of motion. Scale to knees if needed.' },
  { name: 'Pull-Ups', description: 'Hang from bar and pull body up until chin clears bar.', category: 'strength', muscle_groups: ['lats', 'biceps', 'upper back'], equipment: ['pull-up bar'], difficulty: 'intermediate', exercise_type: 'independent', is_timed: false, default_sets: 3, default_reps: 8, default_rest_sec: 90, default_weight_kg: null, tracking_fields: ['reps', 'rpe'], primary_muscles: ['lats', 'biceps'], secondary_muscles: ['rear deltoids', 'forearms', 'rhomboids'], instructions: '1. Grip bar slightly wider than shoulders\n2. Hang with arms fully extended\n3. Pull up until chin over bar\n4. Lower with control', tips: 'Initiate pull with lats, not just arms. Avoid swinging.' },
  { name: 'Bodyweight Squats', description: 'Stand and squat down with arms extended for balance.', category: 'strength', muscle_groups: ['quadriceps', 'glutes'], equipment: ['bodyweight'], difficulty: 'beginner', exercise_type: 'independent', is_timed: false, default_sets: 3, default_reps: 20, default_rest_sec: 30, default_weight_kg: null, tracking_fields: ['reps'], primary_muscles: ['quadriceps', 'glutes'], secondary_muscles: ['hamstrings', 'calves'], instructions: '1. Feet shoulder-width apart\n2. Arms extended forward\n3. Squat until thighs parallel\n4. Stand back up', tips: 'Great warmup exercise. Focus on depth and form.' },
  { name: 'Inverted Rows', description: 'Lie under a bar at waist height and pull chest up to bar.', category: 'strength', muscle_groups: ['upper back', 'biceps'], equipment: ['barbell', 'squat rack'], difficulty: 'beginner', exercise_type: 'independent', is_timed: false, default_sets: 3, default_reps: 12, default_rest_sec: 45, default_weight_kg: null, tracking_fields: ['reps', 'rpe'], primary_muscles: ['lats', 'rhomboids'], secondary_muscles: ['biceps', 'rear deltoids'], instructions: '1. Set bar at waist height\n2. Hang underneath, body straight\n3. Pull chest to bar\n4. Lower with control', tips: 'Easier than pull-ups. Great progression exercise.' },

  // === CORE ===
  { name: 'Plank', description: 'Hold body straight in push-up position, resting on forearms.', category: 'core', muscle_groups: ['core', 'shoulders'], equipment: ['bodyweight'], difficulty: 'beginner', exercise_type: 'independent', is_timed: true, default_sets: 3, default_reps: null, default_duration_sec: 45, default_rest_sec: 30, default_weight_kg: null, tracking_fields: ['duration', 'rpe'], primary_muscles: ['rectus abdominis', 'transverse abdominis'], secondary_muscles: ['obliques', 'shoulders', 'hip flexors'], instructions: '1. Forearms on floor, elbows under shoulders\n2. Body in straight line head to heels\n3. Engage core, dont let hips sag\n4. Hold for prescribed time', tips: 'Squeeze glutes. Breathe normally. Dont look up - keep neck neutral.' },
  { name: 'Dead Bug', description: 'Lie on back, extend opposite arm and leg while maintaining flat back.', category: 'core', muscle_groups: ['core'], equipment: ['bodyweight'], difficulty: 'beginner', exercise_type: 'independent', is_timed: false, default_sets: 3, default_reps: 12, default_rest_sec: 30, default_weight_kg: null, tracking_fields: ['reps'], primary_muscles: ['transverse abdominis', 'rectus abdominis'], secondary_muscles: ['hip flexors', 'obliques'], instructions: '1. Lie on back, arms to ceiling, knees at 90 degrees\n2. Press lower back into floor\n3. Extend opposite arm and leg\n4. Return to start, alternate sides', tips: 'Lower back must stay pressed to floor. Move slowly and with control.' },
  { name: 'Russian Twist', description: 'Sit with torso at 45 degrees, rotate side to side with or without weight.', category: 'core', muscle_groups: ['obliques', 'core'], equipment: ['bodyweight'], difficulty: 'beginner', exercise_type: 'independent', is_timed: false, default_sets: 3, default_reps: 20, default_rest_sec: 30, default_weight_kg: null, tracking_fields: ['reps', 'weight'], primary_muscles: ['obliques'], secondary_muscles: ['rectus abdominis', 'hip flexors'], instructions: '1. Sit with knees bent, feet slightly off floor\n2. Lean back to 45 degrees\n3. Rotate torso side to side\n4. Touch floor beside hip each side', tips: 'Add weight for more challenge. Keep feet off ground for harder version.' },
  { name: 'Bicycle Crunches', description: 'Alternating elbow-to-knee crunch mimicking pedaling motion.', category: 'core', muscle_groups: ['core', 'obliques'], equipment: ['bodyweight'], difficulty: 'beginner', exercise_type: 'independent', is_timed: false, default_sets: 3, default_reps: 20, default_rest_sec: 30, default_weight_kg: null, tracking_fields: ['reps'], primary_muscles: ['rectus abdominis', 'obliques'], secondary_muscles: ['hip flexors'], instructions: '1. Lie on back, hands behind head\n2. Bring opposite elbow and knee together\n3. Extend other leg straight\n4. Alternate in pedaling motion', tips: 'Dont pull on neck. Rotate through torso, not just elbows.' },
  { name: 'Hanging Leg Raise', description: 'Hang from bar and raise legs to 90 degrees or higher.', category: 'core', muscle_groups: ['core', 'hip flexors'], equipment: ['pull-up bar'], difficulty: 'advanced', exercise_type: 'independent', is_timed: false, default_sets: 3, default_reps: 10, default_rest_sec: 60, default_weight_kg: null, tracking_fields: ['reps', 'rpe'], primary_muscles: ['rectus abdominis', 'hip flexors'], secondary_muscles: ['obliques', 'forearms'], instructions: '1. Hang from bar with straight arms\n2. Keep legs straight\n3. Raise legs to 90 degrees or higher\n4. Lower with control', tips: 'Dont swing. Bend knees for easier version. Slow negatives build strength.' },
  { name: 'Ab Rollout', description: 'Kneel with ab wheel, roll forward extending body, then roll back.', category: 'core', muscle_groups: ['core', 'lats'], equipment: ['ab wheel'], difficulty: 'intermediate', exercise_type: 'independent', is_timed: false, default_sets: 3, default_reps: 10, default_rest_sec: 60, default_weight_kg: null, tracking_fields: ['reps', 'rpe'], primary_muscles: ['rectus abdominis', 'transverse abdominis'], secondary_muscles: ['lats', 'shoulders', 'hip flexors'], instructions: '1. Kneel with ab wheel on floor\n2. Roll forward, extending body\n3. Go as far as you can with flat back\n4. Roll back to start using core', tips: 'Start with small range of motion. Dont let hips sag.' },
  { name: 'Side Plank', description: 'Hold body sideways on one forearm, body in straight line.', category: 'core', muscle_groups: ['obliques', 'core'], equipment: ['bodyweight'], difficulty: 'beginner', exercise_type: 'independent', is_timed: true, default_sets: 3, default_reps: null, default_duration_sec: 30, default_rest_sec: 30, default_weight_kg: null, tracking_fields: ['duration'], primary_muscles: ['obliques'], secondary_muscles: ['transverse abdominis', 'shoulders', 'glutes'], instructions: '1. Lie on side, forearm on floor\n2. Stack feet or stagger\n3. Lift hips, body in straight line\n4. Hold, then switch sides', tips: 'Keep hips stacked. Dont let top hip roll forward.' },

  // === PLYOMETRICS ===
  { name: 'Box Jumps', description: 'Jump from floor onto a box/platform, landing softly.', category: 'plyometrics', muscle_groups: ['quadriceps', 'glutes', 'calves'], equipment: ['plyo box'], difficulty: 'intermediate', exercise_type: 'independent', is_timed: false, default_sets: 3, default_reps: 8, default_rest_sec: 90, default_weight_kg: null, tracking_fields: ['reps', 'height_cm'], primary_muscles: ['quadriceps', 'glutes'], secondary_muscles: ['calves', 'hamstrings'], instructions: '1. Stand facing box\n2. Swing arms back, dip slightly\n3. Explode up, swing arms forward\n4. Land softly on box with both feet\n5. Step down (dont jump down)', tips: 'Start with a lower box. Land softly. Step down to protect knees.' },
  { name: 'Depth Jumps', description: 'Step off box, land, immediately jump as high as possible.', category: 'plyometrics', muscle_groups: ['quadriceps', 'calves'], equipment: ['plyo box'], difficulty: 'advanced', exercise_type: 'independent', is_timed: false, default_sets: 3, default_reps: 5, default_rest_sec: 120, default_weight_kg: null, tracking_fields: ['reps', 'height_cm'], primary_muscles: ['quadriceps', 'calves'], secondary_muscles: ['glutes', 'hamstrings'], instructions: '1. Stand on box edge\n2. Step off (dont jump off)\n3. Land on both feet\n4. Immediately jump as high as possible\n5. Land softly', tips: 'Advanced exercise. Minimize ground contact time. Start with low box height.' },
  { name: 'Jump Squats', description: 'Squat down then explode upward into a jump.', category: 'plyometrics', muscle_groups: ['quadriceps', 'glutes', 'calves'], equipment: ['bodyweight'], difficulty: 'beginner', exercise_type: 'independent', is_timed: false, default_sets: 3, default_reps: 10, default_rest_sec: 60, default_weight_kg: null, tracking_fields: ['reps'], primary_muscles: ['quadriceps', 'glutes'], secondary_muscles: ['calves', 'hamstrings', 'core'], instructions: '1. Stand feet shoulder-width\n2. Squat to parallel\n3. Explode up, jumping high\n4. Land softly, immediately squat again', tips: 'Land quietly. Absorb impact through legs. Keep chest up.' },
  { name: 'Lateral Bounds', description: 'Jump sideways from one foot to the other, sticking each landing.', category: 'plyometrics', muscle_groups: ['glutes', 'quadriceps', 'adductors'], equipment: ['bodyweight'], difficulty: 'intermediate', exercise_type: 'independent', is_timed: false, default_sets: 3, default_reps: 10, default_rest_sec: 60, default_weight_kg: null, tracking_fields: ['reps', 'distance_cm'], primary_muscles: ['glutes', 'quadriceps'], secondary_muscles: ['adductors', 'calves', 'core'], instructions: '1. Stand on one foot\n2. Push off laterally\n3. Land on opposite foot\n4. Stick landing for 1 second\n5. Bound back', tips: 'Builds lateral power. Great for change-of-direction sports. Control each landing.' },
  { name: 'Tuck Jumps', description: 'Jump straight up and bring knees to chest at peak height.', category: 'plyometrics', muscle_groups: ['quadriceps', 'core', 'hip flexors'], equipment: ['bodyweight'], difficulty: 'intermediate', exercise_type: 'independent', is_timed: false, default_sets: 3, default_reps: 8, default_rest_sec: 60, default_weight_kg: null, tracking_fields: ['reps'], primary_muscles: ['quadriceps', 'hip flexors'], secondary_muscles: ['calves', 'core', 'glutes'], instructions: '1. Stand with feet shoulder-width\n2. Jump straight up\n3. Bring knees to chest at top\n4. Extend legs for landing\n5. Land softly', tips: 'Drive knees up, dont bend forward to meet them.' },
  { name: 'Broad Jump', description: 'Jump forward as far as possible from standing position.', category: 'plyometrics', muscle_groups: ['quadriceps', 'glutes', 'hamstrings'], equipment: ['bodyweight'], difficulty: 'beginner', exercise_type: 'independent', is_timed: false, default_sets: 3, default_reps: 5, default_rest_sec: 90, default_weight_kg: null, tracking_fields: ['reps', 'distance_cm'], primary_muscles: ['quadriceps', 'glutes'], secondary_muscles: ['hamstrings', 'calves', 'core'], instructions: '1. Feet shoulder-width\n2. Swing arms back, load hips\n3. Swing arms forward, jump as far as possible\n4. Land on both feet, absorb impact', tips: 'Measure distance to track progress. Great test of lower body power.' },

  // === SPEED / SPRINT ===
  { name: '40-Yard Sprint', description: 'All-out sprint over 40 yards (36.6m) from standing start.', category: 'speed', muscle_groups: ['quadriceps', 'hamstrings', 'calves', 'glutes'], equipment: ['track/field'], difficulty: 'intermediate', exercise_type: 'independent', is_timed: true, default_sets: 4, default_reps: null, default_duration_sec: 6, default_rest_sec: 180, default_weight_kg: null, tracking_fields: ['time_sec'], primary_muscles: ['quadriceps', 'hamstrings'], secondary_muscles: ['calves', 'glutes', 'hip flexors'], instructions: '1. Three-point stance or standing start\n2. Drive out low for first 10 yards\n3. Gradually rise to upright\n4. Maintain top speed through finish', tips: 'Warm up thoroughly. Focus on arm drive. Stay relaxed at top speed.' },
  { name: 'Hill Sprints', description: 'Sprint up a hill of 20-50m grade for explosive power development.', category: 'speed', muscle_groups: ['quadriceps', 'glutes', 'calves'], equipment: ['hill'], difficulty: 'intermediate', exercise_type: 'independent', is_timed: true, default_sets: 6, default_reps: null, default_duration_sec: 15, default_rest_sec: 120, default_weight_kg: null, tracking_fields: ['time_sec', 'rpe'], primary_muscles: ['quadriceps', 'glutes'], secondary_muscles: ['calves', 'hamstrings', 'core'], instructions: '1. Find a moderate hill\n2. Sprint up at 85-95% effort\n3. Walk or jog back down\n4. Full recovery before next rep', tips: 'Lean into the hill. Drive arms hard. Walk back for full recovery.' },
  { name: 'Sprint Intervals (100m)', description: 'Repeated 100m sprints with rest between efforts.', category: 'speed', muscle_groups: ['quadriceps', 'hamstrings', 'calves'], equipment: ['track'], difficulty: 'intermediate', exercise_type: 'independent', is_timed: true, default_sets: 6, default_reps: null, default_duration_sec: 15, default_rest_sec: 120, default_weight_kg: null, tracking_fields: ['time_sec', 'rpe'], primary_muscles: ['quadriceps', 'hamstrings'], secondary_muscles: ['calves', 'glutes', 'core'], instructions: '1. Sprint 100m at 90% effort\n2. Walk back for recovery\n3. Rest until HR drops\n4. Repeat', tips: 'Maintain form even when tired. Dont sacrifice technique for speed.' },
  { name: 'Acceleration Drills (20m)', description: 'Short explosive sprints focusing on acceleration mechanics.', category: 'speed', muscle_groups: ['quadriceps', 'glutes'], equipment: ['cones'], difficulty: 'beginner', exercise_type: 'independent', is_timed: true, default_sets: 8, default_reps: null, default_duration_sec: 5, default_rest_sec: 60, default_weight_kg: null, tracking_fields: ['time_sec'], primary_muscles: ['quadriceps', 'glutes'], secondary_muscles: ['hamstrings', 'calves', 'core'], instructions: '1. Start in athletic stance\n2. Explode forward for 20m\n3. Focus on low body angle\n4. Drive arms aggressively', tips: 'First 5 steps are critical. Stay low. Push the ground away behind you.' },

  // === AGILITY ===
  { name: 'Ladder Drills - In-Out', description: 'Quick feet through agility ladder, stepping in and out of each box.', category: 'agility', muscle_groups: ['calves', 'quadriceps'], equipment: ['agility ladder'], difficulty: 'beginner', exercise_type: 'independent', is_timed: true, default_sets: 4, default_reps: null, default_duration_sec: 20, default_rest_sec: 30, default_weight_kg: null, tracking_fields: ['time_sec'], primary_muscles: ['calves', 'quadriceps'], secondary_muscles: ['hip flexors', 'core'], instructions: '1. Start at one end of ladder\n2. Step both feet into each square\n3. Step both feet out\n4. Move forward through ladder as fast as possible', tips: 'Stay on balls of feet. Keep hips low. Speed increases with practice.' },
  { name: 'T-Drill', description: 'Sprint forward, shuffle left, shuffle right, backpedal — forming a T pattern.', category: 'agility', muscle_groups: ['quadriceps', 'calves', 'glutes'], equipment: ['cones'], difficulty: 'intermediate', exercise_type: 'independent', is_timed: true, default_sets: 4, default_reps: null, default_duration_sec: 12, default_rest_sec: 90, default_weight_kg: null, tracking_fields: ['time_sec'], primary_muscles: ['quadriceps', 'calves'], secondary_muscles: ['glutes', 'hamstrings', 'core'], instructions: '1. Sprint forward 10 yards to center cone\n2. Shuffle left 5 yards\n3. Shuffle right 10 yards\n4. Shuffle left 5 yards back to center\n5. Backpedal to start', tips: 'Stay low in athletic stance. Dont cross feet when shuffling.' },
  { name: 'Pro Agility (5-10-5)', description: 'Start in center, sprint 5 yards one direction, 10 yards back, 5 yards to finish.', category: 'agility', muscle_groups: ['quadriceps', 'calves'], equipment: ['cones'], difficulty: 'intermediate', exercise_type: 'independent', is_timed: true, default_sets: 4, default_reps: null, default_duration_sec: 5, default_rest_sec: 90, default_weight_kg: null, tracking_fields: ['time_sec'], primary_muscles: ['quadriceps', 'calves'], secondary_muscles: ['glutes', 'hamstrings', 'core'], instructions: '1. Three-point stance at center cone\n2. Sprint 5 yards to right, touch line\n3. Sprint 10 yards to left, touch line\n4. Sprint 5 yards back through start', tips: 'Plant and cut hard at each turn. Stay low through the cuts.' },
  { name: 'Cone Shuttle', description: 'Weave between cones set in a line, changing direction at each cone.', category: 'agility', muscle_groups: ['quadriceps', 'calves', 'glutes'], equipment: ['cones'], difficulty: 'beginner', exercise_type: 'independent', is_timed: true, default_sets: 4, default_reps: null, default_duration_sec: 15, default_rest_sec: 60, default_weight_kg: null, tracking_fields: ['time_sec'], primary_muscles: ['quadriceps', 'calves'], secondary_muscles: ['glutes', 'hamstrings', 'core'], instructions: '1. Set 4-5 cones in a line, 5 yards apart\n2. Sprint to first cone, touch\n3. Sprint back to start, touch\n4. Sprint to second cone, etc.', tips: 'Decelerate and accelerate quickly. Work on change of direction.' },
  { name: 'Reactive Agility Drill', description: 'Partner points direction, player reacts and sprints that way.', category: 'agility', muscle_groups: ['quadriceps', 'calves'], equipment: ['cones'], difficulty: 'intermediate', exercise_type: 'partner', is_timed: true, default_sets: 6, default_reps: null, default_duration_sec: 8, default_rest_sec: 60, default_weight_kg: null, tracking_fields: ['time_sec', 'rpe'], primary_muscles: ['quadriceps', 'calves'], secondary_muscles: ['glutes', 'core'], instructions: '1. Partner stands at center with 4 cones around them\n2. Partner points to a cone\n3. React and sprint to that cone\n4. Return to center\n5. Partner points again', tips: 'Improves reaction time. Stay in athletic ready position.' },

  // === FLEXIBILITY / MOBILITY ===
  { name: 'Hip Flexor Stretch', description: 'Kneel with one foot forward, push hips forward to stretch hip flexor.', category: 'flexibility', muscle_groups: ['hip flexors'], equipment: ['bodyweight'], difficulty: 'beginner', exercise_type: 'independent', is_timed: true, default_sets: 2, default_reps: null, default_duration_sec: 45, default_rest_sec: 15, default_weight_kg: null, tracking_fields: ['duration'], primary_muscles: ['hip flexors', 'psoas'], secondary_muscles: ['quadriceps'], instructions: '1. Kneel on one knee\n2. Front foot flat, knee at 90 degrees\n3. Push hips forward gently\n4. Feel stretch in front of back hip\n5. Hold, then switch sides', tips: 'Squeeze back glute for deeper stretch. Dont arch lower back.' },
  { name: 'Hamstring Stretch (Standing)', description: 'Stand and extend one leg on elevated surface, hinge forward to stretch.', category: 'flexibility', muscle_groups: ['hamstrings'], equipment: ['bodyweight'], difficulty: 'beginner', exercise_type: 'independent', is_timed: true, default_sets: 2, default_reps: null, default_duration_sec: 45, default_rest_sec: 15, default_weight_kg: null, tracking_fields: ['duration'], primary_muscles: ['hamstrings'], secondary_muscles: ['lower back', 'calves'], instructions: '1. Place heel on elevated surface\n2. Keep leg straight\n3. Hinge forward at hips\n4. Feel stretch behind thigh\n5. Hold, switch sides', tips: 'Keep back flat while hinging. Dont round shoulders.' },
  { name: 'Pigeon Stretch', description: 'Yoga pose that deeply stretches hip external rotators and glutes.', category: 'flexibility', muscle_groups: ['glutes', 'hip rotators'], equipment: ['bodyweight'], difficulty: 'intermediate', exercise_type: 'independent', is_timed: true, default_sets: 2, default_reps: null, default_duration_sec: 60, default_rest_sec: 15, default_weight_kg: null, tracking_fields: ['duration'], primary_muscles: ['glutes', 'piriformis'], secondary_muscles: ['hip rotators', 'hip flexors'], instructions: '1. From all fours, bring one knee forward\n2. Shin angled across body\n3. Extend back leg behind\n4. Lower torso toward floor\n5. Hold, breathe deeply', tips: 'Support with hands if needed. Dont force the stretch.' },
  { name: 'World Greatest Stretch', description: 'Dynamic full-body stretch combining lunge, rotation, and hamstring stretch.', category: 'flexibility', muscle_groups: ['hip flexors', 'hamstrings', 'thoracic spine'], equipment: ['bodyweight'], difficulty: 'beginner', exercise_type: 'independent', is_timed: false, default_sets: 2, default_reps: 6, default_rest_sec: 15, default_weight_kg: null, tracking_fields: ['reps'], primary_muscles: ['hip flexors', 'hamstrings'], secondary_muscles: ['thoracic spine', 'adductors', 'calves'], instructions: '1. Step into deep lunge\n2. Place both hands inside front foot\n3. Rotate toward front knee, extend arm to ceiling\n4. Return hands to floor\n5. Straighten front leg for hamstring stretch\n6. Step forward, repeat other side', tips: 'Best dynamic warmup stretch. Do before every workout.' },
  { name: 'Foam Rolling - IT Band', description: 'Roll lateral thigh on foam roller to release tightness.', category: 'flexibility', muscle_groups: ['IT band', 'quadriceps'], equipment: ['foam roller'], difficulty: 'beginner', exercise_type: 'independent', is_timed: true, default_sets: 1, default_reps: null, default_duration_sec: 60, default_rest_sec: 0, default_weight_kg: null, tracking_fields: ['duration'], primary_muscles: ['IT band'], secondary_muscles: ['vastus lateralis', 'glutes'], instructions: '1. Lie on side with foam roller under outer thigh\n2. Support with arms\n3. Roll from hip to just above knee\n4. Pause on tender spots for 15-30 seconds', tips: 'Painful but effective. Roll slowly. Avoid rolling directly on joints.' },
  { name: 'Thoracic Spine Rotation', description: 'Lie on side and rotate upper body to stretch and mobilize thoracic spine.', category: 'flexibility', muscle_groups: ['thoracic spine', 'chest'], equipment: ['bodyweight'], difficulty: 'beginner', exercise_type: 'independent', is_timed: false, default_sets: 2, default_reps: 10, default_rest_sec: 15, default_weight_kg: null, tracking_fields: ['reps'], primary_muscles: ['thoracic spine'], secondary_muscles: ['chest', 'obliques'], instructions: '1. Lie on side, knees bent to 90 degrees\n2. Arms extended in front\n3. Rotate top arm over to opposite side\n4. Follow with eyes\n5. Return to start, repeat', tips: 'Keep knees stacked. Let gravity do the work. Breathe into the stretch.' },

  // === RECOVERY ===
  { name: 'Light Jog Cooldown', description: '5-10 minute easy jog at conversational pace for active recovery.', category: 'recovery', muscle_groups: ['full body'], equipment: ['bodyweight'], difficulty: 'beginner', exercise_type: 'independent', is_timed: true, default_sets: 1, default_reps: null, default_duration_sec: 300, default_rest_sec: 0, default_weight_kg: null, tracking_fields: ['duration', 'rpe'], primary_muscles: ['quadriceps', 'hamstrings'], secondary_muscles: ['calves', 'cardiovascular'], instructions: '1. Slow, easy jog\n2. Conversational pace\n3. Focus on deep breathing\n4. Gradually slow to walk', tips: 'Keep it truly easy. This is recovery, not training.' },
  { name: 'Static Stretching Routine', description: 'Full-body static stretch sequence held for 30+ seconds each.', category: 'recovery', muscle_groups: ['full body'], equipment: ['bodyweight'], difficulty: 'beginner', exercise_type: 'independent', is_timed: true, default_sets: 1, default_reps: null, default_duration_sec: 600, default_rest_sec: 0, default_weight_kg: null, tracking_fields: ['duration'], primary_muscles: ['hamstrings', 'quadriceps', 'hip flexors'], secondary_muscles: ['calves', 'chest', 'shoulders', 'back'], instructions: '1. Hold each stretch 30-60 seconds\n2. Cover all major muscle groups\n3. Breathe deeply into each stretch\n4. Never bounce', tips: 'Best done after workout when muscles are warm. Relax into each stretch.' },
  { name: 'Yoga Flow', description: 'Dynamic yoga sequence for mobility, balance, and recovery.', category: 'recovery', muscle_groups: ['full body'], equipment: ['yoga mat'], difficulty: 'beginner', exercise_type: 'independent', is_timed: true, default_sets: 1, default_reps: null, default_duration_sec: 900, default_rest_sec: 0, default_weight_kg: null, tracking_fields: ['duration', 'rpe'], primary_muscles: ['core', 'hip flexors', 'hamstrings'], secondary_muscles: ['shoulders', 'calves', 'chest'], instructions: '1. Sun salutation sequence\n2. Warrior poses\n3. Forward folds and twists\n4. End with savasana', tips: 'Focus on breath. Dont force positions. Modify as needed.' },

  // === BALL WORK (Soccer-specific) ===
  { name: 'Dribbling Cone Weave', description: 'Dribble ball through a line of cones with close ball control.', category: 'ball_work', muscle_groups: ['calves', 'quadriceps'], equipment: ['soccer ball', 'cones'], difficulty: 'beginner', exercise_type: 'independent', is_timed: true, default_sets: 4, default_reps: null, default_duration_sec: 30, default_rest_sec: 30, default_weight_kg: null, tracking_fields: ['time_sec'], primary_muscles: ['calves', 'quadriceps'], secondary_muscles: ['hip flexors', 'core'], instructions: '1. Set 6-8 cones in a line, 3 feet apart\n2. Dribble through using both feet\n3. Keep ball close to feet\n4. Use inside and outside of foot', tips: 'Head up, not looking at ball. Use both feet equally.' },
  { name: 'Passing Drills (Wall)', description: 'Pass ball against a wall and receive with first touch.', category: 'ball_work', muscle_groups: ['calves', 'quadriceps'], equipment: ['soccer ball', 'wall'], difficulty: 'beginner', exercise_type: 'independent', is_timed: true, default_sets: 3, default_reps: null, default_duration_sec: 60, default_rest_sec: 30, default_weight_kg: null, tracking_fields: ['duration'], primary_muscles: ['calves'], secondary_muscles: ['quadriceps', 'core'], instructions: '1. Stand 5-10 feet from wall\n2. Pass with inside of foot\n3. Control return with first touch\n4. Alternate feet\n5. Vary distance and power', tips: 'Quality of first touch matters most. Cushion the ball on reception.' },
  { name: 'Rondo (Keep-Away)', description: 'Small group keep-away circle developing passing and movement.', category: 'ball_work', muscle_groups: ['full body'], equipment: ['soccer ball', 'cones'], difficulty: 'intermediate', exercise_type: 'group', is_timed: true, default_sets: 3, default_reps: null, default_duration_sec: 120, default_rest_sec: 60, default_weight_kg: null, tracking_fields: ['duration'], primary_muscles: ['calves', 'quadriceps'], secondary_muscles: ['core', 'cardiovascular'], instructions: '1. 4-5 players form circle\n2. 1-2 players in middle try to intercept\n3. Circle players pass and move\n4. Rotate on interception', tips: 'Move after passing. One or two touch only. Communicate with teammates.' },
  { name: 'Shooting Practice', description: 'Repeated shooting at goal from various angles and distances.', category: 'ball_work', muscle_groups: ['quadriceps', 'hip flexors', 'core'], equipment: ['soccer ball', 'goal'], difficulty: 'intermediate', exercise_type: 'partner', is_timed: false, default_sets: 3, default_reps: 10, default_rest_sec: 30, default_weight_kg: null, tracking_fields: ['reps', 'accuracy_pct'], primary_muscles: ['quadriceps', 'hip flexors'], secondary_muscles: ['core', 'calves', 'hamstrings'], instructions: '1. Set up at various positions\n2. Strike with laces for power\n3. Strike with inside for placement\n4. Practice both feet', tips: 'Plant foot points toward target. Follow through toward target. Keep head down on contact.' },
  { name: 'Juggling', description: 'Keep ball in air using feet, thighs, and head for touch development.', category: 'ball_work', muscle_groups: ['calves', 'quadriceps'], equipment: ['soccer ball'], difficulty: 'beginner', exercise_type: 'independent', is_timed: true, default_sets: 3, default_reps: null, default_duration_sec: 60, default_rest_sec: 15, default_weight_kg: null, tracking_fields: ['duration', 'max_touches'], primary_muscles: ['calves', 'quadriceps'], secondary_muscles: ['hip flexors', 'core'], instructions: '1. Drop ball from hands\n2. Kick up with instep\n3. Alternate feet\n4. Use thighs and head\n5. Count consecutive touches', tips: 'Lock ankle on contact. Small controlled kicks. Track your record.' },
  { name: '1v1 Attacking', description: 'One-on-one dribbling and defending exercise to beat a defender.', category: 'ball_work', muscle_groups: ['full body'], equipment: ['soccer ball', 'cones'], difficulty: 'intermediate', exercise_type: 'partner', is_timed: true, default_sets: 5, default_reps: null, default_duration_sec: 30, default_rest_sec: 30, default_weight_kg: null, tracking_fields: ['duration', 'rpe'], primary_muscles: ['quadriceps', 'calves'], secondary_muscles: ['hamstrings', 'core', 'glutes'], instructions: '1. Attacker starts with ball\n2. Try to dribble past defender\n3. Score through small goals or cones\n4. Switch roles after each attempt', tips: 'Use body feints. Change pace. Attack the defenders front foot.' },

  // === CARDIO / ENDURANCE ===
  { name: 'Running - 5K', description: 'Continuous running at moderate pace for 5 kilometers.', category: 'speed', muscle_groups: ['quadriceps', 'hamstrings', 'calves'], equipment: ['running shoes'], difficulty: 'intermediate', exercise_type: 'independent', is_timed: true, default_sets: 1, default_reps: null, default_duration_sec: 1500, default_rest_sec: 0, default_weight_kg: null, tracking_fields: ['time_sec', 'distance_km', 'rpe'], primary_muscles: ['quadriceps', 'hamstrings'], secondary_muscles: ['calves', 'cardiovascular', 'core'], instructions: '1. Warm up with 5 min easy jog\n2. Run at comfortable sustainable pace\n3. Focus on breathing rhythm\n4. Cool down with 5 min walk', tips: 'Conversational pace for base building. Track time to see improvement.' },
  { name: 'Interval Training (HIIT)', description: 'Alternating high-intensity bursts with rest periods.', category: 'speed', muscle_groups: ['full body'], equipment: ['bodyweight'], difficulty: 'intermediate', exercise_type: 'independent', is_timed: true, default_sets: 6, default_reps: null, default_duration_sec: 30, default_rest_sec: 30, default_weight_kg: null, tracking_fields: ['time_sec', 'rpe'], primary_muscles: ['quadriceps', 'cardiovascular'], secondary_muscles: ['hamstrings', 'core', 'shoulders'], instructions: '1. 30 seconds maximum effort\n2. 30 seconds rest\n3. Repeat 6-10 rounds\n4. Can use sprints, burpees, or any intense exercise', tips: 'Give 100% during work intervals. True rest during recovery. Scale rounds to fitness level.' },
  { name: 'Rowing Machine', description: 'Full-body cardiovascular exercise on rowing ergometer.', category: 'speed', muscle_groups: ['back', 'legs', 'arms'], equipment: ['rowing machine'], difficulty: 'beginner', exercise_type: 'independent', is_timed: true, default_sets: 1, default_reps: null, default_duration_sec: 600, default_rest_sec: 0, default_weight_kg: null, tracking_fields: ['time_sec', 'distance_m', 'rpe'], primary_muscles: ['lats', 'quadriceps'], secondary_muscles: ['biceps', 'hamstrings', 'core', 'cardiovascular'], instructions: '1. Sit on machine, feet in straps\n2. Grip handle, arms extended\n3. Drive with legs first\n4. Pull handle to lower ribs\n5. Return by extending arms, then bending knees', tips: 'Power comes from legs (60%), back (20%), arms (20%). Dont rush the recovery.' },
  { name: 'Jump Rope', description: 'Skip rope continuously for cardiovascular endurance and coordination.', category: 'speed', muscle_groups: ['calves', 'shoulders'], equipment: ['jump rope'], difficulty: 'beginner', exercise_type: 'independent', is_timed: true, default_sets: 3, default_reps: null, default_duration_sec: 60, default_rest_sec: 30, default_weight_kg: null, tracking_fields: ['duration', 'rpe'], primary_muscles: ['calves'], secondary_muscles: ['shoulders', 'forearms', 'cardiovascular'], instructions: '1. Hold rope handles at hip height\n2. Jump with both feet\n3. Stay on balls of feet\n4. Small, quick jumps\n5. Wrists do the turning', tips: 'Keep jumps low. Relax shoulders. Add variations: single leg, double unders.' },

  // === GENERAL FITNESS / FULL BODY ===
  { name: 'Burpees', description: 'Full-body exercise: squat, push-up, jump up. Combines strength and cardio.', category: 'plyometrics', muscle_groups: ['full body'], equipment: ['bodyweight'], difficulty: 'intermediate', exercise_type: 'independent', is_timed: false, default_sets: 3, default_reps: 10, default_rest_sec: 60, default_weight_kg: null, tracking_fields: ['reps', 'rpe'], primary_muscles: ['chest', 'quadriceps'], secondary_muscles: ['shoulders', 'triceps', 'core', 'cardiovascular'], instructions: '1. Stand tall\n2. Squat down, place hands on floor\n3. Jump feet back to plank\n4. Do a push-up\n5. Jump feet forward\n6. Jump up with hands overhead', tips: 'Keep core tight in plank. Modify by stepping instead of jumping.' },
  { name: 'Kettlebell Swing', description: 'Hip-hinge movement swinging kettlebell between legs to chest height.', category: 'strength', muscle_groups: ['glutes', 'hamstrings', 'core'], equipment: ['kettlebell'], difficulty: 'intermediate', exercise_type: 'independent', is_timed: false, default_sets: 3, default_reps: 15, default_rest_sec: 60, default_weight_kg: 16, tracking_fields: ['weight', 'reps', 'rpe'], primary_muscles: ['glutes', 'hamstrings'], secondary_muscles: ['core', 'shoulders', 'lower back'], instructions: '1. Stand with feet wider than shoulders\n2. Hinge at hips, grip kettlebell with both hands\n3. Swing back between legs\n4. Drive hips forward explosively\n5. Swing to chest height\n6. Let it swing back, repeat', tips: 'Its a hip hinge, not a squat. Power comes from hips. Arms are just along for the ride.' },
  { name: 'Turkish Get-Up', description: 'Rise from lying to standing while holding weight overhead with one arm.', category: 'strength', muscle_groups: ['shoulders', 'core', 'full body'], equipment: ['kettlebell'], difficulty: 'advanced', exercise_type: 'independent', is_timed: false, default_sets: 2, default_reps: 3, default_rest_sec: 60, default_weight_kg: 12, tracking_fields: ['weight', 'reps'], primary_muscles: ['shoulders', 'core'], secondary_muscles: ['glutes', 'quadriceps', 'triceps'], instructions: '1. Lie on back, weight in right hand\n2. Arm extended, eyes on weight\n3. Roll to elbow, then hand\n4. Bridge hips up\n5. Sweep leg under to kneeling\n6. Stand up, reverse to return', tips: 'Go slow. Master each position. Keep eyes on the weight throughout.' },
  { name: 'Battle Ropes', description: 'Create waves with heavy ropes for upper body endurance and power.', category: 'strength', muscle_groups: ['shoulders', 'arms', 'core'], equipment: ['battle ropes'], difficulty: 'intermediate', exercise_type: 'independent', is_timed: true, default_sets: 4, default_reps: null, default_duration_sec: 30, default_rest_sec: 30, default_weight_kg: null, tracking_fields: ['duration', 'rpe'], primary_muscles: ['shoulders', 'arms'], secondary_muscles: ['core', 'back', 'cardiovascular'], instructions: '1. Hold rope ends, athletic stance\n2. Alternate arms creating waves\n3. Keep waves going to end of rope\n4. Maintain throughout the set time', tips: 'Use full arm range. Variations: alternating, double, circles, slams.' },
  { name: 'Medicine Ball Slam', description: 'Lift medicine ball overhead and slam it to ground with full force.', category: 'plyometrics', muscle_groups: ['core', 'shoulders', 'lats'], equipment: ['medicine ball'], difficulty: 'beginner', exercise_type: 'independent', is_timed: false, default_sets: 3, default_reps: 12, default_rest_sec: 45, default_weight_kg: 6, tracking_fields: ['weight', 'reps', 'rpe'], primary_muscles: ['core', 'lats'], secondary_muscles: ['shoulders', 'triceps', 'quadriceps'], instructions: '1. Hold ball overhead, fully extended\n2. Brace core\n3. Slam ball to ground with full force\n4. Squat to catch or pick up\n5. Repeat immediately', tips: 'Use a slam ball (not a bouncy one). Full extension at top. Aggressive slam.' },
  { name: 'Farmers Walk', description: 'Walk while carrying heavy weights in each hand for grip and core stability.', category: 'strength', muscle_groups: ['forearms', 'traps', 'core'], equipment: ['dumbbells'], difficulty: 'beginner', exercise_type: 'independent', is_timed: true, default_sets: 3, default_reps: null, default_duration_sec: 45, default_rest_sec: 60, default_weight_kg: 20, tracking_fields: ['weight', 'duration', 'distance_m'], primary_muscles: ['forearms', 'traps'], secondary_muscles: ['core', 'shoulders', 'glutes'], instructions: '1. Pick up heavy dumbbells or farmer walk handles\n2. Stand tall, shoulders back\n3. Walk with short, quick steps\n4. Maintain upright posture throughout', tips: 'Dont lean to one side. Squeeze handles hard. Walk on a straight line.' },
  { name: 'Bear Crawl', description: 'Crawl forward on hands and feet with knees hovering just off ground.', category: 'core', muscle_groups: ['core', 'shoulders', 'quadriceps'], equipment: ['bodyweight'], difficulty: 'beginner', exercise_type: 'independent', is_timed: true, default_sets: 3, default_reps: null, default_duration_sec: 30, default_rest_sec: 30, default_weight_kg: null, tracking_fields: ['duration', 'distance_m'], primary_muscles: ['core', 'shoulders'], secondary_muscles: ['quadriceps', 'hip flexors', 'triceps'], instructions: '1. Start on all fours\n2. Lift knees 1-2 inches off ground\n3. Move opposite hand and foot forward\n4. Keep back flat and hips low\n5. Crawl forward, backward, or laterally', tips: 'Keep hips level. Move slowly with control. Great core stability exercise.' },
  { name: 'Wall Sit', description: 'Lean against wall in squat position and hold for time.', category: 'strength', muscle_groups: ['quadriceps', 'glutes'], equipment: ['wall'], difficulty: 'beginner', exercise_type: 'independent', is_timed: true, default_sets: 3, default_reps: null, default_duration_sec: 45, default_rest_sec: 45, default_weight_kg: null, tracking_fields: ['duration'], primary_muscles: ['quadriceps'], secondary_muscles: ['glutes', 'core', 'calves'], instructions: '1. Back flat against wall\n2. Slide down until thighs parallel\n3. Knees at 90 degrees\n4. Hold position', tips: 'Dont push off wall with hands. Breathe normally. Track duration for progress.' },
  { name: 'Step-Ups', description: 'Step up onto a box/bench with one leg, driving through heel.', category: 'strength', muscle_groups: ['quadriceps', 'glutes'], equipment: ['box', 'dumbbells'], difficulty: 'beginner', exercise_type: 'independent', is_timed: false, default_sets: 3, default_reps: 10, default_rest_sec: 45, default_weight_kg: 10, tracking_fields: ['weight', 'reps'], primary_muscles: ['quadriceps', 'glutes'], secondary_muscles: ['hamstrings', 'calves', 'core'], instructions: '1. Stand facing box/bench\n2. Place entire foot on surface\n3. Drive through heel to stand up\n4. Step down with control\n5. Alternate or do all one side', tips: 'Drive through the working leg, dont push off back foot. Higher box = more glute.' },
  { name: 'Calf Raises', description: 'Rise up on toes and lower back down for calf development.', category: 'strength', muscle_groups: ['calves'], equipment: ['bodyweight'], difficulty: 'beginner', exercise_type: 'independent', is_timed: false, default_sets: 3, default_reps: 20, default_rest_sec: 30, default_weight_kg: null, tracking_fields: ['reps', 'weight'], primary_muscles: ['gastrocnemius', 'soleus'], secondary_muscles: [], instructions: '1. Stand on edge of step or flat ground\n2. Rise up on toes as high as possible\n3. Pause at top\n4. Lower slowly, stretching at bottom', tips: 'Full range of motion. Pause at top and bottom. Add weight for more challenge.' },
  { name: 'Face Pulls', description: 'Pull rope attachment toward face to strengthen rear deltoids and upper back.', category: 'strength', muscle_groups: ['rear deltoids', 'upper back', 'rotator cuff'], equipment: ['cable machine', 'rope attachment'], difficulty: 'beginner', exercise_type: 'independent', is_timed: false, default_sets: 3, default_reps: 15, default_rest_sec: 45, default_weight_kg: 15, tracking_fields: ['weight', 'reps'], primary_muscles: ['rear deltoids'], secondary_muscles: ['rhomboids', 'rotator cuff', 'traps'], instructions: '1. Set cable at face height\n2. Grip rope with both hands\n3. Pull toward face, separating rope ends\n4. Squeeze shoulder blades together\n5. Return with control', tips: 'Essential for shoulder health. Keep elbows high. External rotate at the end.' },

  // === PARTNER/GROUP EXERCISES ===
  { name: 'Partner Medicine Ball Toss', description: 'Chest pass or rotational toss with partner using medicine ball.', category: 'plyometrics', muscle_groups: ['chest', 'core', 'shoulders'], equipment: ['medicine ball'], difficulty: 'beginner', exercise_type: 'partner', is_timed: false, default_sets: 3, default_reps: 12, default_rest_sec: 30, default_weight_kg: 4, tracking_fields: ['weight', 'reps'], primary_muscles: ['chest', 'core'], secondary_muscles: ['shoulders', 'triceps'], instructions: '1. Stand facing partner, 3-5m apart\n2. Hold ball at chest\n3. Pass explosively using chest press motion\n4. Partner catches and immediately returns\n5. Also try rotational tosses', tips: 'Generate power from hips. Catch and immediately release for reactive power.' },
  { name: 'Wheelbarrow Walk', description: 'One partner holds the others ankles while they walk on hands.', category: 'core', muscle_groups: ['shoulders', 'core', 'chest'], equipment: ['bodyweight'], difficulty: 'intermediate', exercise_type: 'partner', is_timed: true, default_sets: 3, default_reps: null, default_duration_sec: 30, default_rest_sec: 30, default_weight_kg: null, tracking_fields: ['duration', 'distance_m'], primary_muscles: ['shoulders', 'core'], secondary_muscles: ['chest', 'triceps', 'forearms'], instructions: '1. Get into push-up position\n2. Partner holds your ankles\n3. Walk forward on hands\n4. Keep body straight\n5. Switch roles', tips: 'Keep core engaged. Dont let hips sag. Fun team exercise.' },
  { name: 'Partner Resistance Sprints', description: 'Sprint against partner resistance using a band or holding waist.', category: 'speed', muscle_groups: ['quadriceps', 'glutes', 'hamstrings'], equipment: ['resistance band'], difficulty: 'intermediate', exercise_type: 'partner', is_timed: true, default_sets: 4, default_reps: null, default_duration_sec: 10, default_rest_sec: 60, default_weight_kg: null, tracking_fields: ['time_sec', 'rpe'], primary_muscles: ['quadriceps', 'glutes'], secondary_muscles: ['hamstrings', 'calves', 'core'], instructions: '1. One partner holds band around sprinters waist\n2. Sprinter drives forward against resistance\n3. Sprint for 10-15 yards\n4. Switch roles\n5. Can also do unresisted after for contrast', tips: 'Lean forward more against resistance. Powerful arm drive. Release sprints feel amazing after.' },
  { name: 'Partner Leg Throws', description: 'Lie on back, partner throws legs down in different directions.', category: 'core', muscle_groups: ['core', 'hip flexors'], equipment: ['bodyweight'], difficulty: 'intermediate', exercise_type: 'partner', is_timed: false, default_sets: 3, default_reps: 10, default_rest_sec: 30, default_weight_kg: null, tracking_fields: ['reps'], primary_muscles: ['rectus abdominis', 'hip flexors'], secondary_muscles: ['obliques'], instructions: '1. Lie on back, grip partners ankles\n2. Raise legs straight to vertical\n3. Partner pushes legs down and to sides\n4. Resist and bring legs back up\n5. Keep lower back pressed to floor', tips: 'Dont let lower back arch. Start with straight down, add angles as you get stronger.' },
  { name: 'Mirror Drill', description: 'Face partner and mirror their movements for reaction and agility.', category: 'agility', muscle_groups: ['full body'], equipment: ['bodyweight'], difficulty: 'beginner', exercise_type: 'partner', is_timed: true, default_sets: 4, default_reps: null, default_duration_sec: 20, default_rest_sec: 20, default_weight_kg: null, tracking_fields: ['duration', 'rpe'], primary_muscles: ['calves', 'quadriceps'], secondary_muscles: ['glutes', 'core'], instructions: '1. Face partner in athletic stance\n2. One leads, one mirrors\n3. Leader moves laterally, forward, back\n4. Mirror follows as quickly as possible\n5. Switch leader/follower', tips: 'Stay in athletic stance. React to hips, not head fakes. Stay light on feet.' },
];

async function main() {
  console.log(`Seeding ${EXERCISES.length} exercises...`);

  // Delete existing system exercises (coach_id is null)
  console.log('Clearing existing system exercises...');
  await supabaseReq('DELETE', '/rest/v1/mf_exercises?coach_id=is.null', null);

  // Insert exercises in batches
  const batchSize = 10;
  const insertedExercises = [];

  for (let i = 0; i < EXERCISES.length; i += batchSize) {
    const batch = EXERCISES.slice(i, i + batchSize).map(ex => ({
      ...ex,
      coach_id: null, // system exercises
      tracking_fields: JSON.stringify(ex.tracking_fields || []),
    }));

    const result = await supabaseReq('POST', '/rest/v1/mf_exercises', batch);
    if (Array.isArray(result)) {
      insertedExercises.push(...result);
      console.log(`  Batch ${Math.floor(i/batchSize) + 1}: inserted ${result.length} exercises`);
    } else {
      console.log(`  Batch ${Math.floor(i/batchSize) + 1} error:`, JSON.stringify(result).substring(0, 200));
    }
  }

  console.log(`\nTotal exercises inserted: ${insertedExercises.length}`);

  // Now get all players for seeding historical data
  const players = await supabaseReq('GET', '/rest/v1/mf_players?select=id,name,team_id&status=eq.active', null);
  console.log(`\nFound ${players.length} active players for historical data seeding`);

  if (!Array.isArray(players) || players.length === 0) {
    console.log('No players found, skipping historical data');
    return;
  }

  // Get the team's coach
  const teams = await supabaseReq('GET', '/rest/v1/mf_teams?select=id,coach_id&limit=1', null);
  const coachId = teams?.[0]?.coach_id;
  const teamId = teams?.[0]?.id;

  if (!coachId) {
    console.log('No coach found, skipping program creation');
    return;
  }

  // Create a comprehensive training program
  console.log('\nCreating training program...');

  // Create the program
  const program = await supabaseReq('POST', '/rest/v1/mf_programs', {
    coach_id: coachId,
    name: 'Complete Athletic Development',
    description: 'Full-body training program combining strength, agility, speed, and flexibility for complete athletic development.',
    duration_weeks: 8,
    phase_type: 'general',
    difficulty: 'medium',
    is_template: false,
  });
  const programId = Array.isArray(program) ? program[0]?.id : program?.id;
  console.log('Program created:', programId);

  if (!programId) {
    console.log('Program creation failed:', JSON.stringify(program).substring(0, 200));
    return;
  }

  // Create program days (5 days per week)
  const dayNames = [
    { name: 'Upper Body Strength', day_of_week: 1 },
    { name: 'Speed & Agility', day_of_week: 2 },
    { name: 'Lower Body Strength', day_of_week: 3 },
    { name: 'Ball Work & Skills', day_of_week: 4 },
    { name: 'Full Body & Recovery', day_of_week: 5 },
  ];

  const programDays = await supabaseReq('POST', '/rest/v1/mf_program_days', dayNames.map((d, i) => ({
    program_id: programId,
    day_of_week: d.day_of_week,
    name: d.name,
    sort_order: i,
  })));
  console.log('Program days created:', programDays?.length || 'error');

  if (!Array.isArray(programDays)) {
    console.log('Day creation error:', JSON.stringify(programDays).substring(0, 200));
    return;
  }

  // Map exercises by name for easy lookup
  const exByName = {};
  insertedExercises.forEach(e => { exByName[e.name] = e; });

  // Assign exercises to each day
  const dayExercises = {
    'Upper Body Strength': ['Bench Press', 'Overhead Press', 'Barbell Row', 'Pull-Ups', 'Dumbbell Bicep Curl', 'Tricep Dips', 'Face Pulls', 'Plank'],
    'Speed & Agility': ['Acceleration Drills (20m)', 'T-Drill', 'Ladder Drills - In-Out', 'Jump Squats', 'Lateral Bounds', 'Sprint Intervals (100m)', 'World Greatest Stretch'],
    'Lower Body Strength': ['Barbell Back Squat', 'Romanian Deadlift (RDL)', 'Bulgarian Split Squat', 'Hip Thrust', 'Calf Raises', 'Hanging Leg Raise', 'Wall Sit'],
    'Ball Work & Skills': ['Dribbling Cone Weave', 'Passing Drills (Wall)', 'Shooting Practice', 'Juggling', '1v1 Attacking', 'Cone Shuttle', 'Light Jog Cooldown'],
    'Full Body & Recovery': ['Kettlebell Swing', 'Burpees', 'Medicine Ball Slam', 'Farmers Walk', 'Dead Bug', 'Foam Rolling - IT Band', 'Static Stretching Routine'],
  };

  for (const day of programDays) {
    const exNames = dayExercises[day.name] || [];
    const programExercises = exNames.map((name, i) => {
      const ex = exByName[name];
      if (!ex) {
        console.log(`  WARNING: Exercise not found: ${name}`);
        return null;
      }
      return {
        program_day_id: day.id,
        exercise_id: ex.id,
        sets: ex.default_sets || 3,
        reps: ex.default_reps || null,
        duration_sec: ex.default_duration_sec || null,
        rest_sec: ex.default_rest_sec || 60,
        weight_kg: ex.default_weight_kg || null,
        rpe_target: 7,
        sort_order: i,
      };
    }).filter(Boolean);

    if (programExercises.length > 0) {
      const result = await supabaseReq('POST', '/rest/v1/mf_program_exercises', programExercises);
      console.log(`  ${day.name}: ${Array.isArray(result) ? result.length : 'error'} exercises assigned`);
    }
  }

  // Assign program to all players
  console.log('\nAssigning program to players...');
  for (const player of players) {
    // Delete existing active program assignments
    await supabaseReq('DELETE', `/rest/v1/mf_player_programs?player_id=eq.${player.id}&status=eq.active`, null);

    await supabaseReq('POST', '/rest/v1/mf_player_programs', {
      player_id: player.id,
      program_id: programId,
      status: 'active',
      start_date: '2026-01-15',
    });
    console.log(`  Assigned to ${player.name}`);
  }

  // Now seed 8 weeks of historical workout data
  console.log('\nSeeding 8 weeks of historical workout data...');

  const today = new Date();
  // Get the program exercises for each day
  const allProgramExercises = {};
  for (const day of programDays) {
    const pex = await supabaseReq('GET', `/rest/v1/mf_program_exercises?program_day_id=eq.${day.id}&select=*,mf_exercises(*)`, null);
    allProgramExercises[day.id] = pex || [];
  }

  for (const player of players) {
    console.log(`\n  Seeding data for ${player.name}...`);

    // Delete existing scheduled workouts for this player
    await supabaseReq('DELETE', `/rest/v1/mf_exercise_logs?workout_id=in.(select id from mf_scheduled_workouts where player_id='${player.id}')`, null);
    await supabaseReq('DELETE', `/rest/v1/mf_scheduled_workouts?player_id=eq.${player.id}`, null);

    let totalXP = 0;
    let currentStreak = 0;
    let longestStreak = 0;
    let lastDate = null;

    // For each of the last 8 weeks
    for (let week = 7; week >= 0; week--) {
      for (let dayIdx = 0; dayIdx < 5; dayIdx++) {
        const workoutDate = new Date(today);
        workoutDate.setDate(today.getDate() - week * 7 - (4 - dayIdx));

        // Skip future dates
        if (workoutDate > today) continue;

        const dateStr = workoutDate.toISOString().split('T')[0];
        const dayId = programDays[dayIdx].id;

        // Random completion: 70-95% chance of completing
        const playerFactor = players.indexOf(player) * 0.05; // Different rates per player
        const completionChance = 0.70 + playerFactor;
        const didComplete = Math.random() < completionChance;

        const workoutStatus = didComplete ? 'completed' : (Math.random() < 0.5 ? 'skipped' : 'scheduled');
        const completionPct = didComplete ? Math.round(75 + Math.random() * 25) : 0;
        const rpe = didComplete ? Math.round(5 + Math.random() * 4) : null;
        const duration = didComplete ? Math.round(30 + Math.random() * 30) : null;
        const xpEarned = didComplete ? Math.round(50 + Math.random() * 50) : 0;

        const workout = await supabaseReq('POST', '/rest/v1/mf_scheduled_workouts', {
          player_id: player.id,
          program_day_id: dayId,
          scheduled_date: dateStr,
          status: workoutStatus,
          completed_at: didComplete ? workoutDate.toISOString() : null,
          completion_pct: completionPct,
          rpe_reported: rpe,
          duration_minutes: duration,
          xp_earned: xpEarned,
        });

        const workoutId = Array.isArray(workout) ? workout[0]?.id : workout?.id;

        if (didComplete && workoutId) {
          totalXP += xpEarned;

          // Track streak
          if (lastDate) {
            const diff = Math.floor((workoutDate - lastDate) / (1000 * 60 * 60 * 24));
            if (diff <= 2) {
              currentStreak++;
            } else {
              currentStreak = 1;
            }
          } else {
            currentStreak = 1;
          }
          longestStreak = Math.max(longestStreak, currentStreak);
          lastDate = workoutDate;

          // Create exercise logs with progressive weight/reps
          const dayExercises = allProgramExercises[dayId] || [];
          const exerciseLogs = dayExercises.map(pe => {
            const ex = pe.mf_exercises;
            if (!ex) return null;

            // Progressive overload: weights increase over weeks
            const weekMultiplier = 1 + (7 - week) * 0.03; // 3% increase per week
            const baseWeight = pe.weight_kg || ex.default_weight_kg || null;
            const weight = baseWeight ? Math.round(baseWeight * weekMultiplier * 10) / 10 : null;

            // Some variation in reps
            const prescribedReps = pe.reps || ex.default_reps || 10;
            const actualReps = prescribedReps + Math.floor(Math.random() * 3) - 1;

            // Build per-set arrays
            const numSets = pe.sets || ex.default_sets || 3;
            const repsArray = Array(numSets).fill(null).map(() =>
              Math.max(1, actualReps + Math.floor(Math.random() * 3) - 1)
            );
            const weightArray = weight ? Array(numSets).fill(null).map((_, si) =>
              // Last sets might be slightly lighter
              Math.round((weight - si * (weight * 0.02)) * 10) / 10
            ) : null;

            return {
              workout_id: workoutId,
              exercise_id: ex.id,
              prescribed_sets: numSets,
              prescribed_reps: prescribedReps,
              completed_sets: numSets,
              completed_reps: repsArray,
              weight_used: weightArray,
              duration_sec: ex.is_timed ? (ex.default_duration_sec || 30) + Math.floor(Math.random() * 10) : null,
              skipped: false,
              rpe_logged: Math.round(5 + Math.random() * 4),
            };
          }).filter(Boolean);

          if (exerciseLogs.length > 0) {
            await supabaseReq('POST', '/rest/v1/mf_exercise_logs', exerciseLogs);
          }
        }
      }
    }

    // Update player stats
    await supabaseReq('PATCH', `/rest/v1/mf_players?id=eq.${player.id}`, {
      xp: totalXP,
      level: Math.floor(totalXP / 500) + 1,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_activity_date: lastDate ? lastDate.toISOString().split('T')[0] : null,
    });
    console.log(`    XP: ${totalXP}, Level: ${Math.floor(totalXP / 500) + 1}, Streak: ${currentStreak}/${longestStreak}`);
  }

  // Seed wellness check-ins for last 14 days
  console.log('\nSeeding wellness check-ins...');
  for (const player of players) {
    for (let d = 13; d >= 0; d--) {
      const date = new Date(today);
      date.setDate(today.getDate() - d);
      const dateStr = date.toISOString().split('T')[0];

      if (Math.random() < 0.8) { // 80% chance of checking in
        const sleep = Math.round(2.5 + Math.random() * 2.5);
        const energy = Math.round(2 + Math.random() * 3);
        const soreness = Math.round(1 + Math.random() * 4);
        const mood = Math.round(2.5 + Math.random() * 2.5);
        const stress = Math.round(1 + Math.random() * 4);
        const readiness = Math.round((sleep * 25 + energy * 25 + (6 - soreness) * 20 + mood * 15 + (6 - stress) * 15) / 5);

        await supabaseReq('POST', '/rest/v1/mf_wellness_checkins', {
          player_id: player.id,
          checkin_date: dateStr,
          sleep_quality: sleep,
          energy_level: energy,
          muscle_soreness: soreness,
          mood: mood,
          stress: stress,
          readiness_score: readiness,
        }, { 'Prefer': 'return=minimal,resolution=merge-duplicates' });
      }
    }
    console.log(`  ${player.name}: wellness check-ins seeded`);
  }

  // Schedule today's and tomorrow's workouts
  console.log('\nScheduling upcoming workouts...');
  const todayDay = today.getDay(); // 0=Sun, 1=Mon...
  for (const player of players) {
    // Today
    if (todayDay >= 1 && todayDay <= 5) {
      const dayIdx = todayDay - 1;
      if (dayIdx < programDays.length) {
        await supabaseReq('POST', '/rest/v1/mf_scheduled_workouts', {
          player_id: player.id,
          program_day_id: programDays[dayIdx].id,
          scheduled_date: today.toISOString().split('T')[0],
          status: 'scheduled',
        }, { 'Prefer': 'return=minimal,resolution=ignore-duplicates' });
      }
    }
  }

  // Create some personal records
  console.log('\nCreating personal records...');
  const prExercises = ['Barbell Back Squat', 'Bench Press', 'Barbell Deadlift', 'Overhead Press', 'Pull-Ups'];
  for (const player of players) {
    for (const exName of prExercises) {
      const ex = exByName[exName];
      if (!ex) continue;

      const prValue = exName === 'Pull-Ups'
        ? `${10 + Math.floor(Math.random() * 8)} reps`
        : `${Math.round((ex.default_weight_kg || 50) * (1.1 + Math.random() * 0.4))} kg`;

      await supabaseReq('POST', '/rest/v1/mf_personal_records', {
        player_id: player.id,
        exercise_id: ex.id,
        value: prValue,
        achieved_at: new Date(today.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
    console.log(`  ${player.name}: PRs created`);
  }

  console.log('\n=== SEED COMPLETE ===');
  console.log(`${insertedExercises.length} exercises`);
  console.log(`1 program with 5 days`);
  console.log(`8 weeks of workout history per player`);
  console.log(`14 days of wellness data per player`);
  console.log(`Personal records for ${prExercises.length} exercises per player`);
}

main().catch(console.error);
