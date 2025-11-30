-- ENROLLMENT SYSTEM: Database Schema
-- Add tables and columns for mandatory enrollment flow

-- ========================================
-- STEP 0: Create biometric_data table if not exists
-- ========================================
CREATE TABLE IF NOT EXISTS biometric_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reference_photo_url TEXT,
  fingerprint_template TEXT,
  enrollment_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_biometric_data_user_id ON biometric_data(user_id);
CREATE INDEX IF NOT EXISTS idx_biometric_data_enrollment_status ON biometric_data(enrollment_status);

COMMENT ON TABLE biometric_data IS 'Stores user biometric enrollment data (face anchor, fingerprint)';
COMMENT ON COLUMN biometric_data.enrollment_status IS 'Tracks enrollment progress: pending, photo_completed, completed';
COMMENT ON COLUMN biometric_data.reference_photo_url IS 'Face anchor photo URL for AI comparison';

-- Enable RLS on biometric_data
ALTER TABLE biometric_data ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view own biometric data" ON biometric_data;
DROP POLICY IF EXISTS "Users can insert own biometric data" ON biometric_data;
DROP POLICY IF EXISTS "Users can update own biometric data" ON biometric_data;
DROP POLICY IF EXISTS "Admins can view all biometric data" ON biometric_data;

-- Users can view their own biometric data
CREATE POLICY "Users can view own biometric data"
  ON biometric_data FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own biometric data
CREATE POLICY "Users can insert own biometric data"
  ON biometric_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own biometric data
CREATE POLICY "Users can update own biometric data"
  ON biometric_data FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all biometric data
CREATE POLICY "Admins can view all biometric data"
  ON biometric_data FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- ========================================
-- STEP 1: Add enrollment_status to biometric_data table (if column doesn't exist)
-- ========================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'biometric_data' AND column_name = 'enrollment_status'
  ) THEN
    ALTER TABLE biometric_data ADD COLUMN enrollment_status VARCHAR(50) DEFAULT 'pending';
  END IF;
END $$;

-- ========================================
-- STEP 2: Create webauthn_challenges table (temporary challenge storage)
-- ========================================
CREATE TABLE IF NOT EXISTS webauthn_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge TEXT NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('registration', 'authentication')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_user_id ON webauthn_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_expires_at ON webauthn_challenges(expires_at);

COMMENT ON TABLE webauthn_challenges IS 'Temporary storage for WebAuthn challenges (auto-deleted after expiry)';

-- Auto-delete expired challenges
CREATE OR REPLACE FUNCTION delete_expired_challenges()
RETURNS void AS $$
BEGIN
  DELETE FROM webauthn_challenges WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION delete_expired_challenges IS 'Cleanup function to remove expired WebAuthn challenges';

-- ========================================
-- STEP 3: Create webauthn_credentials table if not exists
-- ========================================
CREATE TABLE IF NOT EXISTS webauthn_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_user_id ON webauthn_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_credential_id ON webauthn_credentials(credential_id);

COMMENT ON TABLE webauthn_credentials IS 'Stores WebAuthn/Passkey credentials for device binding';

-- Enable RLS on webauthn_credentials
ALTER TABLE webauthn_credentials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view own credentials" ON webauthn_credentials;
DROP POLICY IF EXISTS "Users can insert own credentials" ON webauthn_credentials;
DROP POLICY IF EXISTS "Users can delete own credentials" ON webauthn_credentials;
DROP POLICY IF EXISTS "Admins can view all credentials" ON webauthn_credentials;

-- Users can view their own credentials
CREATE POLICY "Users can view own credentials"
  ON webauthn_credentials FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own credentials
CREATE POLICY "Users can insert own credentials"
  ON webauthn_credentials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own credentials
CREATE POLICY "Users can delete own credentials"
  ON webauthn_credentials FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all credentials
CREATE POLICY "Admins can view all credentials"
  ON webauthn_credentials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Add device_type and transports columns (safe to run multiple times)
DO $$ 
BEGIN
  -- Add device_type column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'webauthn_credentials' AND column_name = 'device_type'
  ) THEN
    ALTER TABLE webauthn_credentials ADD COLUMN device_type VARCHAR(20) DEFAULT 'platform';
    COMMENT ON COLUMN webauthn_credentials.device_type IS 'platform (Windows Hello, TouchID) or cross-platform (YubiKey)';
  END IF;
  
  -- Add transports column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'webauthn_credentials' AND column_name = 'transports'
  ) THEN
    ALTER TABLE webauthn_credentials ADD COLUMN transports TEXT[];
    COMMENT ON COLUMN webauthn_credentials.transports IS 'Supported transports: usb, nfc, ble, internal';
  END IF;
END $$;

-- ========================================
-- STEP 4: Add enrollment configuration to school_location_config
-- ========================================

-- Add enrollment settings columns to school_location_config
DO $$ 
BEGIN
  -- require_enrollment: User must complete enrollment before attendance
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'school_location_config' AND column_name = 'require_enrollment'
  ) THEN
    ALTER TABLE school_location_config ADD COLUMN require_enrollment BOOLEAN DEFAULT true;
  END IF;
  
  -- require_face_anchor: Require 8-layer verified face photo
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'school_location_config' AND column_name = 'require_face_anchor'
  ) THEN
    ALTER TABLE school_location_config ADD COLUMN require_face_anchor BOOLEAN DEFAULT true;
  END IF;
  
  -- require_device_binding: Require WebAuthn/Passkey registration
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'school_location_config' AND column_name = 'require_device_binding'
  ) THEN
    ALTER TABLE school_location_config ADD COLUMN require_device_binding BOOLEAN DEFAULT true;
  END IF;
  
  -- ai_verification_threshold: Minimum AI match score (0.0-1.0)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'school_location_config' AND column_name = 'ai_verification_threshold'
  ) THEN
    ALTER TABLE school_location_config ADD COLUMN ai_verification_threshold DECIMAL(3,2) DEFAULT 0.80;
  END IF;
  
  -- anti_spoofing_threshold: Minimum anti-spoofing score (0.0-1.0)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'school_location_config' AND column_name = 'anti_spoofing_threshold'
  ) THEN
    ALTER TABLE school_location_config ADD COLUMN anti_spoofing_threshold DECIMAL(3,2) DEFAULT 0.95;
  END IF;
  
  -- min_anti_spoofing_layers: Minimum layers passed (0-8)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'school_location_config' AND column_name = 'min_anti_spoofing_layers'
  ) THEN
    ALTER TABLE school_location_config ADD COLUMN min_anti_spoofing_layers INTEGER DEFAULT 7;
  END IF;
END $$;

COMMENT ON COLUMN school_location_config.require_enrollment IS 'MANDATORY: User must complete enrollment before attendance (HIGHLY RECOMMENDED)';
COMMENT ON COLUMN school_location_config.require_face_anchor IS 'Require 8-layer AI verified face photo during enrollment';
COMMENT ON COLUMN school_location_config.require_device_binding IS 'Require WebAuthn/Passkey registration during enrollment';
COMMENT ON COLUMN school_location_config.ai_verification_threshold IS 'Minimum AI face match score (0.80 = 80%, recommended: 0.75-0.85)';
COMMENT ON COLUMN school_location_config.anti_spoofing_threshold IS 'Minimum anti-spoofing overall score (0.95 = 95%, recommended: 0.90-0.98)';
COMMENT ON COLUMN school_location_config.min_anti_spoofing_layers IS 'Minimum layers passed out of 8 (recommended: 6-8)';

-- Set default values for existing records
UPDATE school_location_config 
SET 
  require_enrollment = true,
  require_face_anchor = true,
  require_device_binding = true,
  ai_verification_threshold = 0.80,
  anti_spoofing_threshold = 0.95,
  min_anti_spoofing_layers = 7
WHERE require_enrollment IS NULL;

-- ========================================
-- STEP 5: Add enrollment security events (SKIPPED to avoid FK errors)
-- ========================================
-- Note: Security events will be logged automatically by API endpoints
-- when users actually perform enrollment actions. This prevents
-- foreign key constraint errors during migration.

-- Optional: Log migration event only if you want to test
-- (Uncomment only if you're sure user_id exists in auth.users)
/*
INSERT INTO security_events (user_id, event_type, severity, metadata)
SELECT 
  auth.uid() as user_id,
  'enrollment_migration' as event_type,
  'LOW' as severity,
  jsonb_build_object(
    'status', 'migration_applied',
    'description', 'Enrollment system migration completed',
    'timestamp', NOW()
  ) as metadata
WHERE auth.uid() IS NOT NULL
LIMIT 1;
*/

-- ========================================
-- STEP 6: Verification query - Check enrollment status
-- ========================================
SELECT 
  u.id,
  u.name,
  u.email,
  bd.reference_photo_url IS NOT NULL as has_photo,
  bd.enrollment_status,
  COUNT(wc.id) as passkey_count,
  CASE 
    WHEN bd.reference_photo_url IS NOT NULL AND COUNT(wc.id) > 0 THEN '✅ Complete'
    WHEN bd.reference_photo_url IS NOT NULL THEN '⚠️ Photo only'
    WHEN COUNT(wc.id) > 0 THEN '⚠️ Passkey only'
    ELSE '❌ Not enrolled'
  END as enrollment_summary
FROM users u
LEFT JOIN biometric_data bd ON bd.user_id = u.id
LEFT JOIN webauthn_credentials wc ON wc.user_id = u.id
GROUP BY u.id, u.name, u.email, bd.reference_photo_url, bd.enrollment_status
ORDER BY enrollment_summary DESC;

-- ========================================
-- STEP 7: Create function to check if user can attend
-- ========================================
CREATE OR REPLACE FUNCTION can_user_attend(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_photo BOOLEAN;
  v_has_passkey BOOLEAN;
BEGIN
  -- Check for reference photo
  SELECT (reference_photo_url IS NOT NULL) INTO v_has_photo
  FROM biometric_data
  WHERE user_id = p_user_id;
  
  -- Check for passkey
  SELECT EXISTS(
    SELECT 1 FROM webauthn_credentials WHERE user_id = p_user_id
  ) INTO v_has_passkey;
  
  -- Both required
  RETURN COALESCE(v_has_photo, FALSE) AND COALESCE(v_has_passkey, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Test function
SELECT 
  id,
  name,
  can_user_attend(id) as can_attend
FROM users
LIMIT 5;

-- ========================================
-- STEP 8: Add RLS policies for webauthn_challenges
-- ========================================
ALTER TABLE webauthn_challenges ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view own challenges" ON webauthn_challenges;
DROP POLICY IF EXISTS "Users can create own challenges" ON webauthn_challenges;
DROP POLICY IF EXISTS "Users can delete own challenges" ON webauthn_challenges;
DROP POLICY IF EXISTS "Admins can view all challenges" ON webauthn_challenges;

-- Users can only see their own challenges
CREATE POLICY "Users can view own challenges"
  ON webauthn_challenges FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own challenges
CREATE POLICY "Users can create own challenges"
  ON webauthn_challenges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own challenges
CREATE POLICY "Users can delete own challenges"
  ON webauthn_challenges FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all challenges
CREATE POLICY "Admins can view all challenges"
  ON webauthn_challenges FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- ========================================
-- STEP 9: Create view for enrollment dashboard
-- ========================================
CREATE OR REPLACE VIEW enrollment_dashboard AS
SELECT 
  u.id as user_id,
  u.name,
  u.email,
  u.role,
  bd.reference_photo_url,
  bd.enrollment_status,
  COUNT(DISTINCT wc.id) as passkey_count,
  CASE 
    WHEN bd.reference_photo_url IS NOT NULL AND COUNT(wc.id) > 0 THEN TRUE
    ELSE FALSE
  END as is_enrolled,
  bd.created_at as photo_enrolled_at,
  MAX(wc.created_at) as last_passkey_added,
  MAX(ar.check_in_time) as last_attendance
FROM users u
LEFT JOIN biometric_data bd ON bd.user_id = u.id
LEFT JOIN webauthn_credentials wc ON wc.user_id = u.id
LEFT JOIN attendance_records ar ON ar.user_id = u.id
GROUP BY u.id, u.name, u.email, u.role, bd.reference_photo_url, bd.enrollment_status, bd.created_at;

-- Grant access to view
GRANT SELECT ON enrollment_dashboard TO authenticated;

-- ========================================
-- STEP 10: Summary - Check migration success
-- ========================================
SELECT 
  'webauthn_challenges' as table_name,
  COUNT(*) as row_count
FROM webauthn_challenges
UNION ALL
SELECT 
  'enrollment_dashboard' as table_name,
  COUNT(*) as row_count
FROM enrollment_dashboard
UNION ALL
SELECT
  'users_with_complete_enrollment' as metric,
  COUNT(*) as count
FROM enrollment_dashboard
WHERE is_enrolled = TRUE;

-- ✅ MIGRATION COMPLETE
-- Next steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Test enrollment flow at /enroll
-- 3. Verify users cannot access /attendance without enrollment
