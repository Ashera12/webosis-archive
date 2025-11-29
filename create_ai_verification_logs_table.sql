-- Create AI Verification Logs Table
CREATE TABLE IF NOT EXISTS ai_verification_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  current_photo_url TEXT NOT NULL,
  reference_photo_url TEXT NOT NULL,
  face_detected BOOLEAN DEFAULT FALSE,
  match_score DECIMAL(3,2) DEFAULT 0.00 CHECK (match_score >= 0 AND match_score <= 1),
  is_live BOOLEAN DEFAULT FALSE,
  is_fake BOOLEAN DEFAULT FALSE,
  confidence DECIMAL(3,2) DEFAULT 0.00 CHECK (confidence >= 0 AND confidence <= 1),
  ai_provider TEXT DEFAULT 'basic-fallback',
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_logs_user_id ON ai_verification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_created_at ON ai_verification_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_logs_face_detected ON ai_verification_logs(face_detected);
CREATE INDEX IF NOT EXISTS idx_ai_logs_is_fake ON ai_verification_logs(is_fake);
CREATE INDEX IF NOT EXISTS idx_ai_logs_match_score ON ai_verification_logs(match_score);

-- RLS Policies
ALTER TABLE ai_verification_logs ENABLE ROW LEVEL SECURITY;

-- Admin dapat lihat semua
CREATE POLICY "Admin can view all AI verification logs"
  ON ai_verification_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );

-- User dapat lihat log mereka sendiri
CREATE POLICY "Users can view their own AI verification logs"
  ON ai_verification_logs FOR SELECT
  USING (user_id = auth.uid());

-- System dapat insert
CREATE POLICY "System can insert AI verification logs"
  ON ai_verification_logs FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE ai_verification_logs IS 'Logs AI face verification results for attendance photos';
COMMENT ON COLUMN ai_verification_logs.match_score IS 'Similarity score between current and reference photo (0-1)';
COMMENT ON COLUMN ai_verification_logs.is_live IS 'Whether photo appears to be from live person vs screenshot';
COMMENT ON COLUMN ai_verification_logs.is_fake IS 'Whether photo is detected as fake/manipulated';
COMMENT ON COLUMN ai_verification_logs.confidence IS 'AI confidence in verification result (0-1)';
COMMENT ON COLUMN ai_verification_logs.ai_provider IS 'Which AI service was used: openai-vision, google-vision, azure-face, basic-fallback';
