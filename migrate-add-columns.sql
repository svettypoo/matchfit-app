-- Add new columns to mf_exercises for exercise type, tracking, instructions
ALTER TABLE mf_exercises
  ADD COLUMN IF NOT EXISTS exercise_type text DEFAULT 'independent',
  ADD COLUMN IF NOT EXISTS tracking_fields jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS default_weight_kg numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS instructions text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tips text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS primary_muscles text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS secondary_muscles text[] DEFAULT '{}';

-- Add extra logging columns to mf_exercise_logs
ALTER TABLE mf_exercise_logs
  ADD COLUMN IF NOT EXISTS rpe_logged integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS notes text DEFAULT NULL;
