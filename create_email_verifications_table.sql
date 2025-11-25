-- Create email_verifications table if not exists
-- This table stores email verification tokens for new user registrations

CREATE TABLE IF NOT EXISTS public.email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of the raw token
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_verifications_token_hash ON public.email_verifications(token_hash);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON public.email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at ON public.email_verifications(expires_at);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_email_verifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS email_verifications_updated_at ON public.email_verifications;
CREATE TRIGGER email_verifications_updated_at
  BEFORE UPDATE ON public.email_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_email_verifications_updated_at();

-- Enable Row Level Security
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admin/system can manage all email verifications
DROP POLICY IF EXISTS "Admin can manage email verifications" ON public.email_verifications;
CREATE POLICY "Admin can manage email verifications" ON public.email_verifications
  FOR ALL
  USING (
    auth.jwt() ->> 'role' IN ('super_admin', 'admin', 'service_role', 'authenticated')
  );

-- Users can view their own email verification records
DROP POLICY IF EXISTS "Users can view own email verifications" ON public.email_verifications;
CREATE POLICY "Users can view own email verifications" ON public.email_verifications
  FOR SELECT
  USING (
    user_id = (auth.jwt() ->> 'sub')::uuid
  );

-- Service role (API) can insert email verification tokens
DROP POLICY IF EXISTS "Service can insert email verifications" ON public.email_verifications;
CREATE POLICY "Service can insert email verifications" ON public.email_verifications
  FOR INSERT
  WITH CHECK (true);

-- Service role can update email verification tokens (mark as used)
DROP POLICY IF EXISTS "Service can update email verifications" ON public.email_verifications;
CREATE POLICY "Service can update email verifications" ON public.email_verifications
  FOR UPDATE
  USING (true);

-- Add comments
COMMENT ON TABLE public.email_verifications IS 'Email verification tokens for new user registration';
COMMENT ON COLUMN public.email_verifications.token_hash IS 'SHA-256 hash of the verification token';
COMMENT ON COLUMN public.email_verifications.expires_at IS 'Token expiration timestamp (typically 24 hours)';
COMMENT ON COLUMN public.email_verifications.used IS 'Flag to prevent token reuse after verification';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.email_verifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_verifications TO service_role;

-- Show table info
SELECT 
  'email_verifications table created successfully' AS status,
  COUNT(*) AS existing_records
FROM public.email_verifications;
