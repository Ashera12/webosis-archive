-- ============================================
-- ADD WEBAUTHN_CREDENTIAL_ID COLUMN
-- ============================================
-- This adds the webauthn_credential_id column to user_biometric table
-- for storing WebAuthn credential references
-- ============================================

-- Add webauthn_credential_id column (nullable for AI-only mode)
ALTER TABLE user_biometric 
ADD COLUMN IF NOT EXISTS webauthn_credential_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_biometric_webauthn_credential 
ON user_biometric(webauthn_credential_id);

-- Add comment
COMMENT ON COLUMN user_biometric.webauthn_credential_id IS 
'WebAuthn credential ID from webauthn_credentials table. NULL = AI-only mode.';

-- ============================================
-- VERIFICATION
-- ============================================

-- Check column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_biometric' 
  AND column_name = 'webauthn_credential_id';

-- Check current data
SELECT 
  user_id,
  reference_photo_url IS NOT NULL as has_photo,
  fingerprint_template IS NOT NULL as has_fingerprint,
  webauthn_credential_id IS NOT NULL as has_webauthn,
  created_at
FROM user_biometric
ORDER BY created_at DESC
LIMIT 10;
