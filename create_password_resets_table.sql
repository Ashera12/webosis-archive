-- Create password_resets table for forgot password functionality
-- This table stores password reset tokens with SHA-256 hashing

CREATE TABLE IF NOT EXISTS public.password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of the raw token (32 bytes hex = 64 chars)
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_resets_token_hash ON public.password_resets(token_hash);
CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON public.password_resets(user_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires_at ON public.password_resets(expires_at);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_password_resets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS password_resets_updated_at ON public.password_resets;
CREATE TRIGGER password_resets_updated_at
  BEFORE UPDATE ON public.password_resets
  FOR EACH ROW
  EXECUTE FUNCTION update_password_resets_updated_at();

-- Enable Row Level Security
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admin/system can manage all password resets
DROP POLICY IF EXISTS "Admin can manage password resets" ON public.password_resets;
CREATE POLICY "Admin can manage password resets" ON public.password_resets
  FOR ALL
  USING (
    auth.jwt() ->> 'role' IN ('super_admin', 'admin', 'service_role', 'authenticated')
  );

-- Users can view their own password reset records (for debugging/audit)
DROP POLICY IF EXISTS "Users can view own password resets" ON public.password_resets;
CREATE POLICY "Users can view own password resets" ON public.password_resets
  FOR SELECT
  USING (
    user_id = (auth.jwt() ->> 'sub')::uuid
  );

-- Service role (API) can insert password reset tokens
DROP POLICY IF EXISTS "Service can insert password resets" ON public.password_resets;
CREATE POLICY "Service can insert password resets" ON public.password_resets
  FOR INSERT
  WITH CHECK (true); -- API will validate on application level

-- Service role can update password reset tokens (mark as used)
DROP POLICY IF EXISTS "Service can update password resets" ON public.password_resets;
CREATE POLICY "Service can update password resets" ON public.password_resets
  FOR UPDATE
  USING (true); -- API will validate on application level

-- Add comments for documentation
COMMENT ON TABLE public.password_resets IS 'Password reset tokens for forgot password functionality';
COMMENT ON COLUMN public.password_resets.token_hash IS 'SHA-256 hash of the reset token (not the raw token)';
COMMENT ON COLUMN public.password_resets.expires_at IS 'Token expiration timestamp (typically 60 minutes from creation)';
COMMENT ON COLUMN public.password_resets.used IS 'Flag to prevent token reuse after successful password reset';

-- Grant permissions to authenticated role
GRANT SELECT, INSERT, UPDATE ON public.password_resets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.password_resets TO service_role;

-- Show table info
SELECT 
  'password_resets table created successfully' AS status,
  COUNT(*) AS existing_records
FROM public.password_resets;
