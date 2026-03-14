/**
 * Migration: Add questionnaire, coach feedback, exercise plans, and progressive overload tables
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrate() {
  console.log('Running questionnaire & exercise plan migration...');

  // 1. Questionnaire responses — detailed aches/pains/movement assessment
  const { error: e1 } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS mf_questionnaire_responses (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        player_id uuid NOT NULL REFERENCES mf_players(id) ON DELETE CASCADE,
        completed_at timestamptz DEFAULT now(),

        -- Pain & Aches (body map)
        pain_areas jsonb DEFAULT '[]'::jsonb,
        -- Each entry: { area: "knee_left", severity: 1-10, type: "sharp|dull|aching|burning|stiffness", frequency: "always|often|sometimes|rarely", during_activity: bool, after_activity: bool, at_rest: bool, notes: "" }

        -- Injury History
        injury_history jsonb DEFAULT '[]'::jsonb,
        -- Each: { body_part: "", type: "sprain|strain|fracture|surgery|tendinitis|other", date: "", fully_recovered: bool, still_affects: bool, rehab_completed: bool, notes: "" }

        -- Movement Screening
        can_full_squat boolean,
        squat_pain_areas text,
        can_overhead_reach boolean,
        overhead_pain_areas text,
        can_single_leg_balance boolean DEFAULT true,
        balance_weaker_side text,
        can_touch_toes boolean,
        flexibility_notes text,
        has_clicking_joints boolean DEFAULT false,
        clicking_joints_areas text,

        -- Training History
        years_training integer DEFAULT 0,
        current_training_frequency integer DEFAULT 3,
        previous_programs text,
        exercises_avoided text,
        exercises_painful text,

        -- Lifestyle & Recovery
        sleep_hours_avg numeric(3,1) DEFAULT 7.5,
        sleep_quality integer DEFAULT 3, -- 1-5
        stress_level integer DEFAULT 3, -- 1-5
        nutrition_quality integer DEFAULT 3, -- 1-5
        hydration_daily_liters numeric(3,1) DEFAULT 2.0,

        -- Goals & Preferences
        primary_fitness_goal text,
        secondary_goals text[],
        preferred_workout_duration integer DEFAULT 60, -- minutes
        equipment_available text[],
        workout_environment text DEFAULT 'gym', -- gym|home|field|mixed

        -- Medical
        has_medical_conditions boolean DEFAULT false,
        medical_conditions text,
        takes_medications boolean DEFAULT false,
        medications text,
        doctor_clearance boolean DEFAULT true,

        created_at timestamptz DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_mf_questionnaire_player ON mf_questionnaire_responses(player_id);
    `
  });
  if (e1) {
    console.log('Table mf_questionnaire_responses may already exist or RPC not available, trying direct SQL...');
    // Fallback: create via REST
  }

  // 2. Coach feedback on questionnaire
  const { error: e2 } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS mf_coach_feedback (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        questionnaire_id uuid NOT NULL REFERENCES mf_questionnaire_responses(id) ON DELETE CASCADE,
        coach_id uuid NOT NULL REFERENCES mf_coaches(id) ON DELETE CASCADE,

        -- Coach's assessment
        risk_level text DEFAULT 'low', -- low|moderate|high
        movement_notes text,
        injury_concerns text,
        recommended_modifications text,
        exercises_to_avoid text[],
        exercises_to_prioritize text[],
        special_instructions text,
        intensity_override text, -- lighter|normal|harder

        -- Coach approval
        approved boolean DEFAULT false,
        approved_at timestamptz,

        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_mf_coach_feedback_questionnaire ON mf_coach_feedback(questionnaire_id);
      CREATE INDEX IF NOT EXISTS idx_mf_coach_feedback_coach ON mf_coach_feedback(coach_id);
    `
  });

  // 3. AI-generated exercise plans
  const { error: e3 } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS mf_exercise_plans (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        player_id uuid NOT NULL REFERENCES mf_players(id) ON DELETE CASCADE,
        questionnaire_id uuid REFERENCES mf_questionnaire_responses(id),
        coach_feedback_id uuid REFERENCES mf_coach_feedback(id),

        -- Plan metadata
        name text NOT NULL,
        description text,
        ai_writeup text, -- The big AI-generated analysis/plan document
        duration_weeks integer DEFAULT 4,
        phase text DEFAULT 'base', -- base|build|peak|deload|recovery
        difficulty text DEFAULT 'intermediate',
        status text DEFAULT 'active', -- active|completed|paused|superseded

        -- Progressive overload tracking
        current_week integer DEFAULT 1,
        intensity_multiplier numeric(4,2) DEFAULT 1.0, -- increases when player exceeds expectations
        performance_trend text DEFAULT 'meeting', -- below|meeting|exceeding
        last_adjustment_at timestamptz,

        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_mf_exercise_plans_player ON mf_exercise_plans(player_id);
      CREATE INDEX IF NOT EXISTS idx_mf_exercise_plans_status ON mf_exercise_plans(status);
    `
  });

  // 4. Plan days — each day in the plan
  const { error: e4 } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS mf_plan_days (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        plan_id uuid NOT NULL REFERENCES mf_exercise_plans(id) ON DELETE CASCADE,
        day_number integer NOT NULL, -- 1, 2, 3... sequential
        day_of_week integer, -- 0=Sun, 1=Mon...
        name text NOT NULL,
        focus text, -- "Upper Body Strength", "Speed & Agility", etc.
        status text DEFAULT 'upcoming', -- upcoming|available|completed|skipped
        completed_at timestamptz,
        performance_rating text, -- below|met|exceeded (set after completion)

        created_at timestamptz DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_mf_plan_days_plan ON mf_plan_days(plan_id);
    `
  });

  // 5. Plan exercises — exercises within each day, with progressive overload tracking
  const { error: e5 } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS mf_plan_exercises (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        plan_day_id uuid NOT NULL REFERENCES mf_plan_days(id) ON DELETE CASCADE,
        exercise_id uuid NOT NULL REFERENCES mf_exercises(id),

        -- Prescribed
        sets integer DEFAULT 3,
        reps integer DEFAULT 10,
        weight_kg numeric(6,2),
        duration_sec integer,
        rest_sec integer DEFAULT 60,
        rpe_target integer DEFAULT 7,
        notes text,
        sort_order integer DEFAULT 0,

        -- Actual (filled in by player)
        actual_sets integer,
        actual_reps integer[],
        actual_weight numeric(6,2)[],
        actual_rpe integer,
        completed boolean DEFAULT false,
        completed_at timestamptz,
        player_notes text,

        -- Progressive overload comparison
        previous_exercise_id uuid REFERENCES mf_plan_exercises(id), -- links to same exercise from previous session
        intensity_change numeric(4,2) DEFAULT 0, -- % change from previous

        created_at timestamptz DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_mf_plan_exercises_day ON mf_plan_exercises(plan_day_id);
      CREATE INDEX IF NOT EXISTS idx_mf_plan_exercises_exercise ON mf_plan_exercises(exercise_id);
    `
  });

  console.log('Migration results:');
  console.log('  mf_questionnaire_responses:', e1 ? `Error: ${e1.message}` : 'OK');
  console.log('  mf_coach_feedback:', e2 ? `Error: ${e2.message}` : 'OK');
  console.log('  mf_exercise_plans:', e3 ? `Error: ${e3.message}` : 'OK');
  console.log('  mf_plan_days:', e4 ? `Error: ${e4.message}` : 'OK');
  console.log('  mf_plan_exercises:', e5 ? `Error: ${e5.message}` : 'OK');

  // If RPC doesn't work, create tables via Supabase REST (insert dummy + delete)
  if (e1) {
    console.log('\nRPC not available. Creating tables via Supabase SQL Editor...');
    console.log('Please run the SQL manually in the Supabase dashboard.');
    console.log('SQL file: migrate-questionnaire.sql');
  }

  console.log('\nDone!');
}

migrate().catch(console.error);
