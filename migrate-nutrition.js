const https = require('https');

const SUPABASE_ACCESS_TOKEN = 'sbp_803303e69c9d5ad01cf12adcc6ad17747bd38d03';
const PROJECT_REF = 'xocfduqugghailalzlqy';

const sql = `
-- Meal library
CREATE TABLE IF NOT EXISTS mf_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES mf_coaches(id),
  name TEXT NOT NULL,
  description TEXT,
  meal_type TEXT CHECK (meal_type IN ('breakfast','lunch','dinner','snack','pre_workout','post_workout','shake')),
  cuisine TEXT,
  dietary_tags TEXT[] DEFAULT '{}',
  allergens TEXT[] DEFAULT '{}',
  ingredients TEXT[] DEFAULT '{}',
  instructions TEXT,
  prep_time_min INTEGER,
  calories INTEGER,
  protein_g NUMERIC,
  carbs_g NUMERIC,
  fat_g NUMERIC,
  fiber_g NUMERIC,
  sodium_mg INTEGER,
  sugar_g NUMERIC,
  serving_size TEXT,
  image_url TEXT,
  is_ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nutrition plans
CREATE TABLE IF NOT EXISTS mf_nutrition_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES mf_players(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES mf_coaches(id),
  name TEXT NOT NULL,
  description TEXT,
  ai_writeup TEXT,
  daily_calories INTEGER,
  protein_target_g INTEGER,
  carbs_target_g INTEGER,
  fat_target_g INTEGER,
  dietary_restrictions TEXT[] DEFAULT '{}',
  allergies TEXT[] DEFAULT '{}',
  goal TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','superseded','paused')),
  start_date DATE,
  is_ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plan meals (junction)
CREATE TABLE IF NOT EXISTS mf_nutrition_plan_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES mf_nutrition_plans(id) ON DELETE CASCADE,
  meal_id UUID REFERENCES mf_meals(id),
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  meal_type TEXT,
  name TEXT,
  calories INTEGER,
  protein_g NUMERIC,
  carbs_g NUMERIC,
  fat_g NUMERIC,
  fiber_g NUMERIC,
  sugar_g NUMERIC,
  sodium_mg INTEGER,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meal logs
CREATE TABLE IF NOT EXISTS mf_meal_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES mf_players(id) ON DELETE CASCADE,
  meal_id UUID REFERENCES mf_meals(id),
  plan_meal_id UUID REFERENCES mf_nutrition_plan_meals(id),
  name TEXT NOT NULL,
  meal_type TEXT,
  calories INTEGER,
  protein_g NUMERIC,
  carbs_g NUMERIC,
  fat_g NUMERIC,
  fiber_g NUMERIC,
  sugar_g NUMERIC,
  sodium_mg INTEGER,
  serving_size TEXT,
  notes TEXT,
  image_url TEXT,
  ai_analysis JSONB,
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mf_meals_type ON mf_meals(meal_type);
CREATE INDEX IF NOT EXISTS idx_mf_meals_coach ON mf_meals(coach_id);
CREATE INDEX IF NOT EXISTS idx_mf_nutrition_plans_player ON mf_nutrition_plans(player_id);
CREATE INDEX IF NOT EXISTS idx_mf_nutrition_plans_status ON mf_nutrition_plans(status);
CREATE INDEX IF NOT EXISTS idx_mf_nutrition_plan_meals_plan ON mf_nutrition_plan_meals(plan_id);
CREATE INDEX IF NOT EXISTS idx_mf_meal_logs_player ON mf_meal_logs(player_id);
CREATE INDEX IF NOT EXISTS idx_mf_meal_logs_logged ON mf_meal_logs(logged_at);

-- Enable RLS
ALTER TABLE mf_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE mf_nutrition_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE mf_nutrition_plan_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE mf_meal_logs ENABLE ROW LEVEL SECURITY;

-- Service role bypass policies (drop first to avoid duplicates)
DROP POLICY IF EXISTS "service_all_mf_meals" ON mf_meals;
CREATE POLICY "service_all_mf_meals" ON mf_meals FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service_all_mf_nutrition_plans" ON mf_nutrition_plans;
CREATE POLICY "service_all_mf_nutrition_plans" ON mf_nutrition_plans FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service_all_mf_nutrition_plan_meals" ON mf_nutrition_plan_meals;
CREATE POLICY "service_all_mf_nutrition_plan_meals" ON mf_nutrition_plan_meals FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service_all_mf_meal_logs" ON mf_meal_logs;
CREATE POLICY "service_all_mf_meal_logs" ON mf_meal_logs FOR ALL USING (true) WITH CHECK (true);
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
    try {
      const parsed = JSON.parse(body);
      if (res.statusCode === 201 || res.statusCode === 200) {
        console.log('SUCCESS: All nutrition tables created');
      } else {
        console.log('Response:', JSON.stringify(parsed, null, 2).substring(0, 1000));
      }
    } catch {
      console.log('Response:', body.substring(0, 500));
    }
  });
});

req.on('error', err => console.error('Error:', err.message));
req.write(postData);
req.end();
