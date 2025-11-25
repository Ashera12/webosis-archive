-- Complete Database Setup for Authentication System
-- Run this in Supabase SQL Editor to create all required tables

-- ============================================
-- 1. EMAIL VERIFICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_token_hash ON public.email_verifications(token_hash);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON public.email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at ON public.email_verifications(expires_at);

-- ============================================
-- 2. PASSWORD RESETS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_resets_token_hash ON public.password_resets(token_hash);
CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON public.password_resets(user_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires_at ON public.password_resets(expires_at);

-- ============================================
-- 3. UPDATED_AT TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_email_verifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_password_resets_updated_at()
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

DROP TRIGGER IF EXISTS password_resets_updated_at ON public.password_resets;
CREATE TRIGGER password_resets_updated_at
  BEFORE UPDATE ON public.password_resets
  FOR EACH ROW
  EXECUTE FUNCTION update_password_resets_updated_at();

-- ============================================
-- 4. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

-- Email Verifications Policies
DROP POLICY IF EXISTS "Admin can manage email verifications" ON public.email_verifications;
CREATE POLICY "Admin can manage email verifications" ON public.email_verifications
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Service can insert email verifications" ON public.email_verifications;
CREATE POLICY "Service can insert email verifications" ON public.email_verifications
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Service can update email verifications" ON public.email_verifications;
CREATE POLICY "Service can update email verifications" ON public.email_verifications
  FOR UPDATE USING (true);

-- Password Resets Policies
DROP POLICY IF EXISTS "Admin can manage password resets" ON public.password_resets;
CREATE POLICY "Admin can manage password resets" ON public.password_resets
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Service can insert password resets" ON public.password_resets;
CREATE POLICY "Service can insert password resets" ON public.password_resets
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Service can update password resets" ON public.password_resets;
CREATE POLICY "Service can update password resets" ON public.password_resets
  FOR UPDATE USING (true);

-- ============================================
-- 5. PERMISSIONS
-- ============================================

GRANT SELECT, INSERT, UPDATE ON public.email_verifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_verifications TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.password_resets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.password_resets TO service_role;

-- ============================================
-- 6. COMMENTS
-- ============================================

COMMENT ON TABLE public.email_verifications IS 'Email verification tokens for new user registration';
COMMENT ON TABLE public.password_resets IS 'Password reset tokens for forgot password functionality';

-- ============================================
-- 7. VERIFICATION
-- ============================================

SELECT 
  'email_verifications' AS table_name,
  COUNT(*) AS record_count,
  'created successfully' AS status
FROM public.email_verifications
UNION ALL
SELECT 
  'password_resets' AS table_name,
  COUNT(*) AS record_count,
  'created successfully' AS status
FROM public.password_resets;

-- Show indexes
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('email_verifications', 'password_resets')
ORDER BY tablename, indexname;
