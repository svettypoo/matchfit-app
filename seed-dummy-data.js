/**
 * Seed dummy workout data for MatchFit plan history, progress charts, and analytics
 * Creates plans, completed days, and exercise logs for multiple players over 4 weeks
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Players to seed
const PLAYERS = [
  '0cc60e28-0bf0-40fd-b68b-ba8b7bcd7dc2', // Alex Player
  '1a28f639-9f1e-416e-bebc-072bc7a8b451', // Maria Garcia
  'baa805e3-8706-44b5-8b07-8631074397a0', // Jake Torres
  'ad857fe8-dc73-4557-9c16-d1e37b2c1eb3', // Liam Chen
  '814b1042-372d-4687-b5d2-486940465a65', // Sofia Ahmed
];

// Exercises
const EXERCISES = [
  'f36f7fc0-10f2-4734-bb35-eb83ad414e77', // Barbell Back Squat
  '697c7ecd-3890-4898-8531-b26f4659e310', // Barbell Deadlift
  '6b860dca-855d-4cbf-86a7-6059f2309e63', // Bench Press
  'fb9eee00-f7f9-4ae2-a272-72818ffb01a5', // Overhead Press
  '7fec5344-6c77-4414-80ae-f9594f79fce2', // Barbell Row
  '2e0853a7-c79f-4c99-b1b0-b9b84a1d6050', // Dumbbell Lunges
  '072c6ec5-fb0c-445c-87cf-f5568beec75b', // Romanian Deadlift
  '6697a898-3f6d-4bb7-863d-778ad868c9b6', // Dumbbell Shoulder Press
  '9c142d17-c87e-4c80-b0ac-eeacba0da273', // Goblet Squat
  'a9bbac08-a105-4f78-8d49-7ab78f6c50e2', // Lat Pulldown
];

const PLAN_TEMPLATES = [
  {
    name: 'Foundation Strength Program',
    description: 'Build fundamental strength across all major muscle groups',
    phase: 'base',
    difficulty: 'intermediate',
    days: [
      { name: 'Day 1 — Push', focus: 'Upper Body Push', exercises: [2, 3, 7] }, // Bench, OHP, DB Shoulder Press
      { name: 'Day 2 — Pull', focus: 'Upper Body Pull', exercises: [4, 9, 6] }, // Barbell Row, Lat Pulldown, RDL
      { name: 'Day 3 — Legs', focus: 'Lower Body', exercises: [0, 1, 5, 8] }, // Squat, Deadlift, Lunges, Goblet Squat
    ],
  },
  {
    name: 'Athletic Performance Plan',
    description: 'Sport-specific strength and power development',
    phase: 'build',
    difficulty: 'advanced',
    days: [
      { name: 'Day 1 — Power', focus: 'Explosive Strength', exercises: [0, 1, 5] },
      { name: 'Day 2 — Upper', focus: 'Upper Body Strength', exercises: [2, 3, 4, 9] },
      { name: 'Day 3 — Lower', focus: 'Lower Body Hypertrophy', exercises: [8, 6, 5, 0] },
    ],
  },
];

const RATINGS = ['exceeded', 'met', 'met', 'met', 'below']; // Weighted distribution

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(randomBetween(7, 19), randomBetween(0, 59), 0, 0);
  return d.toISOString();
}

function pickRating() {
  return RATINGS[Math.floor(Math.random() * RATINGS.length)];
}

async function seed() {
  console.log('Seeding dummy data for MatchFit...\n');

  for (const playerId of PLAYERS) {
    const template = PLAN_TEMPLATES[Math.random() > 0.5 ? 1 : 0];
    console.log(`Creating plan "${template.name}" for player ${playerId.slice(0, 8)}...`);

    // Create the exercise plan
    const { data: plan, error: planErr } = await supabase
      .from('mf_exercise_plans')
      .insert({
        player_id: playerId,
        name: template.name,
        description: template.description,
        phase: template.phase,
        difficulty: template.difficulty,
        duration_weeks: 4,
        status: 'active',
        intensity_multiplier: 1.0 + (Math.random() * 0.15),
        performance_trend: Math.random() > 0.3 ? 'meeting' : 'exceeding',
        ai_writeup: `## ${template.name}\n\nThis plan focuses on progressive overload with compound movements. Each week increases volume by 2.5-5%. Rest 60-90 seconds between sets.\n\n### Key Focus Areas\n- Compound lifts with proper form\n- Progressive weight increases\n- Adequate recovery between sessions\n\n### Weekly Schedule\n- 3 training days with 1-2 rest days between\n- Deload every 4th week`,
      })
      .select()
      .single();

    if (planErr) {
      console.error(`  Plan error:`, planErr.message);
      continue;
    }
    console.log(`  Plan created: ${plan.id}`);

    // Create 4 weeks × 3 days = 12 plan days (complete ~9, leave 3 upcoming)
    const totalDays = 12;
    const completedDays = randomBetween(7, 10);

    for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
      const templateDay = template.days[(dayNum - 1) % template.days.length];
      const weekNum = Math.ceil(dayNum / 3);
      const isCompleted = dayNum <= completedDays;
      const isAvailable = dayNum === completedDays + 1;
      const daysBack = (totalDays - dayNum) * 2 + randomBetween(0, 1); // ~every 2 days

      const rating = isCompleted ? pickRating() : null;

      const { data: day, error: dayErr } = await supabase
        .from('mf_plan_days')
        .insert({
          plan_id: plan.id,
          day_number: dayNum,
          day_of_week: (dayNum % 7),
          name: `Week ${weekNum} ${templateDay.name}`,
          focus: templateDay.focus,
          status: isCompleted ? 'completed' : isAvailable ? 'available' : 'upcoming',
          completed_at: isCompleted ? daysAgo(daysBack) : null,
          performance_rating: rating,
        })
        .select()
        .single();

      if (dayErr) {
        console.error(`  Day ${dayNum} error:`, dayErr.message);
        continue;
      }

      // Create exercises for this day
      const weekMultiplier = 1 + (weekNum - 1) * 0.05; // 5% increase per week

      for (let i = 0; i < templateDay.exercises.length; i++) {
        const exIdx = templateDay.exercises[i];
        const exerciseId = EXERCISES[exIdx];
        const baseWeight = [60, 80, 70, 40, 50, 20, 60, 25, 24, 50][exIdx];
        const prescribedWeight = Math.round(baseWeight * weekMultiplier);
        const prescribedSets = randomBetween(3, 4);
        const prescribedReps = randomBetween(8, 12);

        let actualData = {};
        if (isCompleted) {
          const completed = Math.random() > 0.1; // 90% completion rate
          const repVariance = () => prescribedReps + randomBetween(-2, 2);
          const weightVariance = () => prescribedWeight + randomBetween(-5, 5);

          const actualReps = Array.from({ length: prescribedSets }, repVariance);
          const actualWeights = Array.from({ length: prescribedSets }, weightVariance);
          const totalPrescribed = prescribedSets * prescribedReps * prescribedWeight;
          const totalActual = actualReps.reduce((s, r, j) => s + r * actualWeights[j], 0);
          const intensityChange = Math.round(((totalActual / totalPrescribed) - 1) * 100);

          actualData = {
            actual_sets: completed ? prescribedSets : randomBetween(1, prescribedSets - 1),
            actual_reps: completed ? actualReps : actualReps.slice(0, -1),
            actual_weight: completed ? actualWeights : actualWeights.slice(0, -1),
            actual_rpe: randomBetween(6, 9),
            completed,
            completed_at: day.completed_at,
            player_notes: completed && Math.random() > 0.7
              ? ['Felt strong today', 'Grip was fatiguing', 'Good pump', 'Slight knee discomfort on last set', 'Form felt dialed in'][randomBetween(0, 4)]
              : null,
            intensity_change: intensityChange,
          };
        }

        const { error: exErr } = await supabase
          .from('mf_plan_exercises')
          .insert({
            plan_day_id: day.id,
            exercise_id: exerciseId,
            sets: prescribedSets,
            reps: prescribedReps,
            weight_kg: prescribedWeight,
            rest_sec: 60 + (exIdx < 3 ? 30 : 0), // heavier lifts get more rest
            rpe_target: randomBetween(7, 8),
            sort_order: i,
            notes: i === 0 ? 'Warm up with 2 lighter sets first' : null,
            ...actualData,
          });

        if (exErr) console.error(`    Exercise error:`, exErr.message);
      }

      if (isCompleted) {
        console.log(`  Day ${dayNum} (${rating}) — ${templateDay.exercises.length} exercises`);
      }
    }

    console.log(`  ✓ ${completedDays}/${totalDays} days completed\n`);
  }

  // Also seed some mf_scheduled_workouts (old program system) for merged history
  console.log('Seeding program-based workouts...');
  const { data: programs } = await supabase
    .from('mf_programs')
    .select('id, name')
    .limit(3);

  if (programs && programs.length > 0) {
    const { data: programDays } = await supabase
      .from('mf_program_days')
      .select('id, program_id, focus')
      .in('program_id', programs.map(p => p.id))
      .limit(6);

    if (programDays && programDays.length > 0) {
      for (const playerId of PLAYERS.slice(0, 3)) {
        for (let i = 0; i < Math.min(3, programDays.length); i++) {
          const pd = programDays[i];
          const { error } = await supabase
            .from('mf_scheduled_workouts')
            .insert({
              player_id: playerId,
              program_day_id: pd.id,
              scheduled_date: daysAgo(randomBetween(14, 28)).split('T')[0],
              status: 'completed',
              completed_at: daysAgo(randomBetween(14, 28)),
              rpe_reported: randomBetween(5, 9),
              duration_minutes: randomBetween(35, 75),
              completion_pct: randomBetween(80, 100),
            });
          if (error && !error.message.includes('duplicate')) {
            console.log(`  Program workout error: ${error.message}`);
          }
        }
      }
      console.log('  ✓ Program workouts seeded');
    } else {
      console.log('  No program days found, skipping');
    }
  } else {
    console.log('  No programs found, skipping');
  }

  console.log('\n✅ Done! All dummy data seeded.');
}

seed().catch(console.error);
