-- ============================================
-- ADD WEBAUTHN_CREDENTIAL_ID COLUMN
-- ============================================
-- This adds the webauthn_credential_id column to user_biometric table
-- for storing WebAuthn credential references
-- ============================================

-- Add webauthn_credential_id column (nullable for AI-only mode)
ALTER TABLE user_biometric 
ADD COLUMN IF NOT EXISTS webauthn_credential_id TEXT;

-- Add timestamps if they don't exist
ALTER TABLE user_biometric 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE user_biometric 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_biometric_webauthn_credential 
ON user_biometric(webauthn_credential_id);

CREATE INDEX IF NOT EXISTS idx_user_biometric_created_at 
ON user_biometric(created_at);

-- Add comment
COMMENT ON COLUMN user_biometric.webauthn_credential_id IS 
'WebAuthn credential ID from webauthn_credentials table. NULL = AI-only mode.';

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_user_biometric_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_biometric_updated_at ON user_biometric;
CREATE TRIGGER user_biometric_updated_at
  BEFORE UPDATE ON user_biometric
  FOR EACH ROW
  EXECUTE FUNCTION update_user_biometric_updated_at();

-- ============================================
-- VERIFICATION
-- ============================================

-- Check all columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'user_biometric' 
  AND column_name IN ('webauthn_credential_id', 'created_at', 'updated_at')
ORDER BY column_name;

-- Check current data (if any exists)
SELECT 
  user_id,
  reference_photo_url IS NOT NULL as has_photo,
  fingerprint_template IS NOT NULL as has_fingerprint,
  webauthn_credential_id IS NOT NULL as has_webauthn,
  webauthn_credential_id as credential_id,
  created_at,
  updated_at
FROM user_biometric
ORDER BY created_at DESC NULLS LAST
LIMIT 10;
