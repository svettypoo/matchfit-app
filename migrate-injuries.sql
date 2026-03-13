-- Create mf_injuries table for injury tracking
CREATE TABLE IF NOT EXISTS mf_injuries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES mf_players(id) ON DELETE CASCADE,
  body_part TEXT NOT NULL,
  severity INTEGER NOT NULL CHECK (severity >= 1 AND severity <= 5),
  mechanism TEXT,
  notes TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'recovering', 'resolved')),
  recovery_notes TEXT,
  return_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups by player
CREATE INDEX IF NOT EXISTS idx_mf_injuries_player_id ON mf_injuries(player_id);
CREATE INDEX IF NOT EXISTS idx_mf_injuries_date ON mf_injuries(date DESC);
CREATE INDEX IF NOT EXISTS idx_mf_injuries_status ON mf_injuries(status);

-- Enable RLS
ALTER TABLE mf_injuries ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access on mf_injuries"
  ON mf_injuries FOR ALL
  USING (true)
  WITH CHECK (true);
