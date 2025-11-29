-- ====================================
-- WEBAUTHN TABLES FOR BIOMETRIC AUTH
-- ====================================
-- Professional biometric authentication using W3C WebAuthn standard
-- Supports: Fingerprint, Face ID, Windows Hello, Passkeys, Security Keys

-- Table: webauthn_credentials
-- Stores user's registered authenticators (fingerprint, Face ID, etc)
CREATE TABLE IF NOT EXISTS webauthn_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE, -- Base64 encoded credential ID
  public_key TEXT NOT NULL, -- Public key for verification
  counter INTEGER DEFAULT 0, -- Signature counter (prevents replay attacks)
  transports TEXT[] DEFAULT '{"internal"}', -- ['internal', 'usb', 'nfc', 'ble']
  aaguid TEXT, -- Authenticator AAGUID (identifies device type)
  credential_type TEXT DEFAULT 'public-key',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  device_name TEXT, -- Optional: User-friendly name (e.g., "iPhone 14 Pro")
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, credential_id)
);

-- Table: webauthn_challenges
-- Temporary storage for authentication challenges (expires in 5 minutes)
CREATE TABLE IF NOT EXISTS webauthn_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge TEXT NOT NULL, -- Base64 encoded random challenge
  type TEXT NOT NULL CHECK (type IN ('registration', 'authentication')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, type) -- One challenge per user per type
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_user_id ON webauthn_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_credential_id ON webauthn_credentials(credential_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_is_active ON webauthn_credentials(is_active);

CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_user_id ON webauthn_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_expires_at ON webauthn_challenges(expires_at);

-- RLS Policies
ALTER TABLE webauthn_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE webauthn_challenges ENABLE ROW LEVEL SECURITY;

-- Users can only access their own credentials
CREATE POLICY "Users can view own credentials"
  ON webauthn_credentials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credentials"
  ON webauthn_credentials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credentials"
  ON webauthn_credentials FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own credentials"
  ON webauthn_credentials FOR DELETE
  USING (auth.uid() = user_id);

-- Users can only access their own challenges
CREATE POLICY "Users can view own challenges"
  ON webauthn_challenges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own challenges"
  ON webauthn_challenges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own challenges"
  ON webauthn_challenges FOR DELETE
  USING (auth.uid() = user_id);

-- Function to cleanup expired challenges (run every hour)
CREATE OR REPLACE FUNCTION cleanup_expired_challenges()
RETURNS void AS $$
BEGIN
  DELETE FROM webauthn_challenges
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Grant service role full access (for API endpoints)
GRANT ALL ON webauthn_credentials TO service_role;
GRANT ALL ON webauthn_challenges TO service_role;

-- ====================================
-- VERIFICATION QUERIES
-- ====================================

-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'webauthn%'
ORDER BY table_name;

-- Count credentials by user
SELECT user_id, COUNT(*) as credential_count
FROM webauthn_credentials
WHERE is_active = true
GROUP BY user_id;

-- Show expired challenges
SELECT user_id, type, expires_at, 
       EXTRACT(EPOCH FROM (NOW() - expires_at)) as seconds_expired
FROM webauthn_challenges
WHERE expires_at < NOW();

-- ====================================
-- EXAMPLE USAGE
-- ====================================

-- Check if user has registered credentials
SELECT EXISTS(
  SELECT 1 FROM webauthn_credentials 
  WHERE user_id = 'user-uuid-here' 
  AND is_active = true
) as has_biometric;

-- Get user's active credentials
SELECT credential_id, device_name, transports, 
       created_at, last_used_at, counter
FROM webauthn_credentials
WHERE user_id = 'user-uuid-here' 
AND is_active = true
ORDER BY last_used_at DESC;

-- Revoke a credential
UPDATE webauthn_credentials 
SET is_active = false 
WHERE credential_id = 'credential-id-here';

-- ====================================
-- ROLLBACK (if needed)
-- ====================================

-- DROP TABLE IF EXISTS webauthn_challenges CASCADE;
-- DROP TABLE IF EXISTS webauthn_credentials CASCADE;
-- DROP FUNCTION IF EXISTS cleanup_expired_challenges();

-- ====================================
-- NOTES
-- ====================================

/*
WEBAUTHN FLOW:

1. REGISTRATION (Setup Biometric):
   a. Client requests challenge → POST /api/attendance/biometric/webauthn/register-challenge
   b. Server generates random challenge, stores in webauthn_challenges
   c. Client creates credential using navigator.credentials.create()
   d. Browser prompts: "Use fingerprint to continue"
   e. User authenticates with biometric
   f. Client sends credential → POST /api/attendance/biometric/webauthn/register-verify
   g. Server verifies and stores credential in webauthn_credentials
   h. Challenge deleted
   
2. AUTHENTICATION (Verify Biometric):
   a. Client requests challenge → POST /api/attendance/biometric/webauthn/auth-challenge
   b. Server generates challenge with allowed credentials
   c. Client gets assertion using navigator.credentials.get()
   d. Browser prompts: "Use fingerprint to sign in"
   e. User authenticates with biometric
   f. Client sends assertion → POST /api/attendance/biometric/webauthn/auth-verify
   g. Server verifies signature, updates last_used_at
   h. Challenge deleted
   
SUPPORTED AUTHENTICATORS:
- 📱 Android: Fingerprint Sensor
- 🍎 iOS: Face ID / Touch ID
- 🪟 Windows: Windows Hello (Face/Fingerprint)
- 🍎 macOS: Touch ID
- 🔑 External: YubiKey, Security Keys
- 🌐 Passkeys: Google, Apple, Microsoft

SECURITY FEATURES:
- Challenge expires in 5 minutes
- One-time use challenges (deleted after verification)
- Signature counter prevents replay attacks
- RLS policies ensure users only access own data
- Public key cryptography (private key never leaves device)
- Origin verification
- User verification required (biometric/PIN)

PRIVACY:
- No biometric data stored on server
- Attestation: 'none' (device type not revealed)
- Public key only (private key stays on device)
- GDPR compliant
*/
