-- Migration: Questionnaire, Coach Feedback, Exercise Plans with Progressive Overload

-- 1. Questionnaire responses — detailed aches/pains/movement assessment
CREATE TABLE IF NOT EXISTS mf_questionnaire_responses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id uuid NOT NULL REFERENCES mf_players(id) ON DELETE CASCADE,
  completed_at timestamptz DEFAULT now(),
  pain_areas jsonb DEFAULT '[]'::jsonb,
  injury_history jsonb DEFAULT '[]'::jsonb,
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
  years_training integer DEFAULT 0,
  current_training_frequency integer DEFAULT 3,
  previous_programs text,
  exercises_avoided text,
  exercises_painful text,
  sleep_hours_avg numeric(3,1) DEFAULT 7.5,
  sleep_quality integer DEFAULT 3,
  stress_level integer DEFAULT 3,
  nutrition_quality integer DEFAULT 3,
  hydration_daily_liters numeric(3,1) DEFAULT 2.0,
  primary_fitness_goal text,
  secondary_goals text[],
  preferred_workout_duration integer DEFAULT 60,
  equipment_available text[],
  workout_environment text DEFAULT 'gym',
  has_medical_conditions boolean DEFAULT false,
  medical_conditions text,
  takes_medications boolean DEFAULT false,
  medications text,
  doctor_clearance boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mf_questionnaire_player ON mf_questionnaire_responses(player_id);

-- 2. Coach feedback on questionnaire
CREATE TABLE IF NOT EXISTS mf_coach_feedback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  questionnaire_id uuid NOT NULL REFERENCES mf_questionnaire_responses(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES mf_coaches(id) ON DELETE CASCADE,
  risk_level text DEFAULT 'low',
  movement_notes text,
  injury_concerns text,
  recommended_modifications text,
  exercises_to_avoid text[],
  exercises_to_prioritize text[],
  special_instructions text,
  intensity_override text,
  approved boolean DEFAULT false,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mf_coach_feedback_questionnaire ON mf_coach_feedback(questionnaire_id);

-- 3. AI-generated exercise plans
CREATE TABLE IF NOT EXISTS mf_exercise_plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id uuid NOT NULL REFERENCES mf_players(id) ON DELETE CASCADE,
  questionnaire_id uuid REFERENCES mf_questionnaire_responses(id),
  coach_feedback_id uuid REFERENCES mf_coach_feedback(id),
  name text NOT NULL,
  description text,
  ai_writeup text,
  duration_weeks integer DEFAULT 4,
  phase text DEFAULT 'base',
  difficulty text DEFAULT 'intermediate',
  status text DEFAULT 'active',
  current_week integer DEFAULT 1,
  intensity_multiplier numeric(4,2) DEFAULT 1.0,
  performance_trend text DEFAULT 'meeting',
  last_adjustment_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mf_exercise_plans_player ON mf_exercise_plans(player_id);

-- 4. Plan days
CREATE TABLE IF NOT EXISTS mf_plan_days (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id uuid NOT NULL REFERENCES mf_exercise_plans(id) ON DELETE CASCADE,
  day_number integer NOT NULL,
  day_of_week integer,
  name text NOT NULL,
  focus text,
  status text DEFAULT 'upcoming',
  completed_at timestamptz,
  performance_rating text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mf_plan_days_plan ON mf_plan_days(plan_id);

-- 5. Plan exercises with progressive overload tracking
CREATE TABLE IF NOT EXISTS mf_plan_exercises (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_day_id uuid NOT NULL REFERENCES mf_plan_days(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES mf_exercises(id),
  sets integer DEFAULT 3,
  reps integer DEFAULT 10,
  weight_kg numeric(6,2),
  duration_sec integer,
  rest_sec integer DEFAULT 60,
  rpe_target integer DEFAULT 7,
  notes text,
  sort_order integer DEFAULT 0,
  actual_sets integer,
  actual_reps integer[],
  actual_weight numeric(6,2)[],
  actual_rpe integer,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  player_notes text,
  previous_exercise_id uuid REFERENCES mf_plan_exercises(id),
  intensity_change numeric(4,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mf_plan_exercises_day ON mf_plan_exercises(plan_day_id);
CREATE INDEX IF NOT EXISTS idx_mf_plan_exercises_exercise ON mf_plan_exercises(exercise_id);
