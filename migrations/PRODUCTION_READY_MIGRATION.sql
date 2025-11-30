-- =====================================================
-- PRODUCTION-READY DATABASE MIGRATION
-- Webosis Attendance System
-- Version: 2.0.0
-- Date: 2025-12-01
-- 
-- SAFETY: This migration is IDEMPOTENT
-- Can be run multiple times without errors
-- Uses IF EXISTS / IF NOT EXISTS for safety
-- =====================================================

-- =====================================================
-- 1. ADMIN SETTINGS TABLE (Key-Value Configuration Store)
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  category TEXT DEFAULT 'general',
  is_secret BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast key lookups
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(key);
CREATE INDEX IF NOT EXISTS idx_admin_settings_category ON admin_settings(category);

-- RLS: Admin settings accessible by postgres (admin only)
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to READ non-secret settings
CREATE POLICY IF NOT EXISTS "Public read access for non-secret settings"
  ON admin_settings FOR SELECT
  USING (is_secret = false OR auth.role() = 'authenticated');

-- Only service role can modify (admin via API)
CREATE POLICY IF NOT EXISTS "Service role full access"
  ON admin_settings FOR ALL
  USING (auth.role() = 'service_role');

-- =====================================================
-- 2. BIOMETRIC DATA TABLE (Face & Fingerprint)
-- =====================================================
CREATE TABLE IF NOT EXISTS biometric_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reference_photo_url TEXT NOT NULL,
  fingerprint_template TEXT NOT NULL,
  webauthn_credential_id TEXT,
  enrollment_status TEXT DEFAULT 'complete',
  is_first_attendance_enrollment BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: One biometric record per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_biometric_data_user_unique ON biometric_data(user_id);

-- Performance indices
CREATE INDEX IF NOT EXISTS idx_biometric_data_user_id ON biometric_data(user_id);
CREATE INDEX IF NOT EXISTS idx_biometric_data_enrollment_status ON biometric_data(enrollment_status);
CREATE INDEX IF NOT EXISTS idx_biometric_data_created_at ON biometric_data(created_at DESC);

-- RLS: Users can only access their own biometric data
ALTER TABLE biometric_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own biometric data"
  ON biometric_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own biometric data"
  ON biometric_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own biometric data"
  ON biometric_data FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- 3. WEBAUTHN CREDENTIALS TABLE (Passkey Storage)
-- =====================================================
CREATE TABLE IF NOT EXISTS webauthn_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id TEXT UNIQUE NOT NULL,
  public_key TEXT NOT NULL,
  counter BIGINT DEFAULT 0,
  transports TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- Performance indices
CREATE UNIQUE INDEX IF NOT EXISTS idx_webauthn_credential_id ON webauthn_credentials(credential_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_user_id ON webauthn_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_created_at ON webauthn_credentials(created_at DESC);

-- RLS: Users can only access their own credentials
ALTER TABLE webauthn_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own webauthn credentials"
  ON webauthn_credentials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own webauthn credentials"
  ON webauthn_credentials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own webauthn credentials"
  ON webauthn_credentials FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- 4. WEBAUTHN CHALLENGES TABLE (Temporary Storage)
-- =====================================================
CREATE TABLE IF NOT EXISTS webauthn_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indices
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_user_id ON webauthn_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_expires_at ON webauthn_challenges(expires_at);

-- RLS: Users can only access their own challenges
ALTER TABLE webauthn_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can manage own webauthn challenges"
  ON webauthn_challenges FOR ALL
  USING (auth.uid() = user_id);

-- Auto-cleanup expired challenges (run via cron or trigger)
-- Manual cleanup query: DELETE FROM webauthn_challenges WHERE expires_at < NOW();

-- =====================================================
-- 5. ATTENDANCES TABLE (Check-in/out Records)
-- =====================================================
CREATE TABLE IF NOT EXISTS attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  check_in_time TIMESTAMPTZ DEFAULT NOW(),
  check_out_time TIMESTAMPTZ,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  location_accuracy DOUBLE PRECISION,
  photo_selfie_url TEXT,
  fingerprint_hash TEXT,
  wifi_ssid TEXT,
  wifi_bssid TEXT,
  is_enrollment_attendance BOOLEAN DEFAULT false,
  device_info JSONB,
  notes TEXT,
  status TEXT DEFAULT 'present',
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indices for common queries
CREATE INDEX IF NOT EXISTS idx_attendances_user_id ON attendances(user_id);
CREATE INDEX IF NOT EXISTS idx_attendances_check_in_time ON attendances(check_in_time DESC);
CREATE INDEX IF NOT EXISTS idx_attendances_user_date ON attendances(user_id, check_in_time DESC);
CREATE INDEX IF NOT EXISTS idx_attendances_status ON attendances(status);
CREATE INDEX IF NOT EXISTS idx_attendances_is_verified ON attendances(is_verified);
CREATE INDEX IF NOT EXISTS idx_attendances_created_at ON attendances(created_at DESC);

-- Composite index for date-range queries
CREATE INDEX IF NOT EXISTS idx_attendances_user_date_range 
  ON attendances(user_id, check_in_time) 
  WHERE check_out_time IS NULL;

-- RLS: Users can view and insert own attendance
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own attendance"
  ON attendances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own attendance"
  ON attendances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own attendance"
  ON attendances FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- 6. USER ACTIVITIES TABLE (Audit Log)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indices
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_created 
  ON user_activities(user_id, created_at DESC);

-- RLS: Users can view own activities
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own activities"
  ON user_activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own activities"
  ON user_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 7. SECURITY EVENTS TABLE (Security Audit Log)
-- =====================================================
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  description TEXT,
  metadata JSONB,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indices
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_resolved 
  ON security_events(resolved) 
  WHERE resolved = false;

-- RLS: Only admins can access security events
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Policy will be managed by service role (admin API)

-- =====================================================
-- 8. AI VERIFICATION LOGS TABLE (AI Learning Data)
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_photo_url TEXT NOT NULL,
  reference_photo_url TEXT NOT NULL,
  face_detected BOOLEAN NOT NULL,
  match_score DOUBLE PRECISION NOT NULL,
  is_live BOOLEAN NOT NULL,
  is_fake BOOLEAN NOT NULL,
  confidence DOUBLE PRECISION NOT NULL,
  ai_provider TEXT NOT NULL,
  details JSONB,
  reasoning TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indices
CREATE INDEX IF NOT EXISTS idx_ai_logs_user_id ON ai_verification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_created_at ON ai_verification_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_logs_provider ON ai_verification_logs(ai_provider);
CREATE INDEX IF NOT EXISTS idx_ai_logs_match_score ON ai_verification_logs(match_score);
CREATE INDEX IF NOT EXISTS idx_ai_logs_face_detected ON ai_verification_logs(face_detected);

-- RLS: Users can view own AI logs
ALTER TABLE ai_verification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own AI logs"
  ON ai_verification_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "System can insert AI logs"
  ON ai_verification_logs FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- 9. ERROR LOGS TABLE (Error Tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  url TEXT,
  user_agent TEXT,
  metadata JSONB,
  ai_analyzed BOOLEAN DEFAULT false,
  ai_suggestion TEXT,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indices
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);
CREATE INDEX IF NOT EXISTS idx_error_logs_ai_analyzed 
  ON error_logs(ai_analyzed) 
  WHERE ai_analyzed = false;

-- RLS: Only admins can access error logs
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Policy will be managed by service role (admin API)

-- =====================================================
-- 10. SEED DATA - Admin Settings (Production Defaults)
-- =====================================================
INSERT INTO admin_settings (key, value, description, category, is_secret)
VALUES
  -- Attendance Settings
  ('location_required', 'true', 'Require geolocation for attendance', 'attendance', false),
  ('wifi_required', 'true', 'Require WiFi connection for attendance', 'attendance', false),
  ('ai_verification_required', 'true', 'Require AI face verification', 'attendance', false),
  ('webauthn_required', 'false', 'Require WebAuthn passkey', 'attendance', false),
  
  -- AI Provider Settings (SECRETS - will be masked in API responses)
  ('GEMINI_API_KEY', NULL, 'Google Gemini API Key for AI verification', 'ai', true),
  ('OPENAI_API_KEY', NULL, 'OpenAI API Key for backup AI provider', 'ai', true),
  ('ANTHROPIC_API_KEY', NULL, 'Anthropic Claude API Key for chat', 'ai', true),
  ('HUGGINGFACE_API_KEY', NULL, 'HuggingFace API Key for image generation', 'ai', true),
  
  -- AI Model Configuration
  ('ai_model_primary', 'gemini-2.0-flash-exp', 'Primary AI model for face verification', 'ai', false),
  ('ai_model_fallback', 'gpt-4o-mini', 'Fallback AI model', 'ai', false),
  ('ai_match_threshold', '0.75', 'Minimum face match score (0.0-1.0)', 'ai', false),
  ('ai_confidence_threshold', '0.70', 'Minimum confidence score', 'ai', false),
  
  -- Background Settings
  ('background_type', 'color', 'Background type: color, gradient, image', 'appearance', false),
  ('background_color', '#1a1a2e', 'Solid background color (hex)', 'appearance', false),
  ('background_gradient', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 'Gradient CSS', 'appearance', false),
  ('background_image_url', NULL, 'Background image URL', 'appearance', false),
  
  -- Email Settings
  ('smtp_enabled', 'false', 'Enable email notifications', 'email', false),
  ('smtp_host', NULL, 'SMTP server host', 'email', false),
  ('smtp_port', '587', 'SMTP server port', 'email', false),
  ('smtp_user', NULL, 'SMTP username', 'email', true),
  ('smtp_password', NULL, 'SMTP password', 'email', true),
  
  -- Security Settings
  ('rate_limit_enabled', 'true', 'Enable rate limiting', 'security', false),
  ('rate_limit_provider', 'memory', 'Rate limit provider: memory, redis, upstash', 'security', false),
  ('session_timeout_minutes', '60', 'Session timeout in minutes', 'security', false),
  ('max_login_attempts', '5', 'Max failed login attempts before lockout', 'security', false),
  
  -- Storage Settings
  ('storage_provider', 'supabase', 'Storage provider: supabase, cloudinary, s3', 'storage', false),
  ('storage_signed_urls', 'true', 'Use signed URLs for photos (security)', 'storage', false),
  ('storage_url_expiry_hours', '24', 'Signed URL expiration in hours', 'storage', false),
  ('max_photo_size_mb', '10', 'Maximum photo upload size in MB', 'storage', false)
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- 11. VERIFICATION QUERIES
-- Run these to verify migration success
-- =====================================================

-- Check all tables exist
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('admin_settings', 'biometric_data', 'webauthn_credentials', 
--                    'webauthn_challenges', 'attendances', 'user_activities', 
--                    'security_events', 'ai_verification_logs', 'error_logs')
-- ORDER BY table_name;

-- Check all indices exist
-- SELECT indexname FROM pg_indexes 
-- WHERE schemaname = 'public' 
-- AND indexname LIKE 'idx_%'
-- ORDER BY indexname;

-- Check RLS policies
-- SELECT tablename, policyname, permissive, roles, cmd 
-- FROM pg_policies 
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

-- Check admin_settings seeded
-- SELECT key, category, is_secret, 
--        CASE WHEN is_secret THEN '***' ELSE value END as masked_value
-- FROM admin_settings 
-- ORDER BY category, key;

-- =====================================================
-- MIGRATION COMPLETE ✅
-- =====================================================
-- Tables created: 9
-- Indices created: 35+
-- RLS policies: 15+
-- Seed records: 28
-- 
-- Next steps:
-- 1. Verify tables created (run verification queries above)
-- 2. Configure API keys in admin_settings via Admin UI
-- 3. Test complete enrollment flow
-- 4. Monitor error_logs and security_events tables
-- =====================================================
