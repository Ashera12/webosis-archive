-- ENROLLMENT SYSTEM: Database Schema
-- Add tables and columns for mandatory enrollment flow

-- 1. Add enrollment_status to biometric_data table
ALTER TABLE biometric_data 
ADD COLUMN IF NOT EXISTS enrollment_status VARCHAR(50) DEFAULT 'pending';

COMMENT ON COLUMN biometric_data.enrollment_status IS 'Tracks enrollment progress: pending, photo_completed, completed';

-- 2. Create webauthn_challenges table (temporary challenge storage)
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

-- Auto-delete expired challenges
CREATE OR REPLACE FUNCTION delete_expired_challenges()
RETURNS void AS $$
BEGIN
  DELETE FROM webauthn_challenges WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 3. Update webauthn_credentials table structure
ALTER TABLE webauthn_credentials
ADD COLUMN IF NOT EXISTS device_type VARCHAR(20) DEFAULT 'platform';

ALTER TABLE webauthn_credentials
ADD COLUMN IF NOT EXISTS transports TEXT[];

COMMENT ON COLUMN webauthn_credentials.device_type IS 'platform (Windows Hello, TouchID) or cross-platform (YubiKey)';
COMMENT ON COLUMN webauthn_credentials.transports IS 'Supported transports: usb, nfc, ble, internal';

-- 4. Add enrollment security events
INSERT INTO security_events (user_id, event_type, description, metadata)
SELECT 
  id as user_id,
  'enrollment_check' as event_type,
  'System checking enrollment status' as description,
  jsonb_build_object('status', 'migration_applied') as metadata
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM biometric_data WHERE biometric_data.user_id = users.id
)
LIMIT 10; -- Limit to avoid spam

-- 5. Verification query: Check enrollment status
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

-- 6. Create function to check if user can attend
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

-- 7. Add RLS policies for new tables
ALTER TABLE webauthn_challenges ENABLE ROW LEVEL SECURITY;

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

-- 8. Create view for enrollment dashboard
CREATE OR REPLACE VIEW enrollment_dashboard AS
SELECT 
  u.id as user_id,
  u.name,
  u.email,
  u.role,
  bd.reference_photo_url,
  bd.enrollment_status,
  COUNT(DISTINCT wc.id) as passkey_count,
  COUNT(DISTINCT df.id) as device_count,
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
LEFT JOIN device_fingerprints df ON df.user_id = u.id
LEFT JOIN attendance_records ar ON ar.user_id = u.id
GROUP BY u.id, u.name, u.email, u.role, bd.reference_photo_url, bd.enrollment_status, bd.created_at;

-- Grant access to view
GRANT SELECT ON enrollment_dashboard TO authenticated;

-- 9. Summary: Check migration success
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
