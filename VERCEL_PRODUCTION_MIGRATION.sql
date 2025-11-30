-- ============================================
-- VERCEL PRODUCTION MIGRATION - Complete Setup
-- ============================================
-- Date: 2025-11-30
-- Purpose: Ensure all tables and columns exist for production deployment
-- Execute this in Supabase SQL Editor before deploying to Vercel
-- ============================================

-- ============================================
-- 1. ERROR LOGS TABLE (AI Auto-Fix Monitoring)
-- ============================================

-- Create error_logs table if not exists
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Error classification
  error_type TEXT NOT NULL DEFAULT 'runtime_error',
  severity TEXT DEFAULT 'medium', -- low, medium, high, critical
  
  -- Error details
  error_message TEXT,
  error_stack TEXT,
  
  -- Request context
  url TEXT,
  method TEXT DEFAULT 'GET',
  status_code INTEGER,
  
  -- User context
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_agent TEXT,
  ip_address TEXT,
  
  -- Request/Response data
  request_body JSONB,
  response_body JSONB,
  headers JSONB,
  context JSONB,
  
  -- AI Analysis (CRITICAL COLUMN)
  ai_analysis JSONB,
  fix_status TEXT DEFAULT 'pending', -- pending, analysis_complete, fix_applied, resolved
  fix_applied_at TIMESTAMP WITH TIME ZONE,
  applied_fix TEXT
);

-- Add missing columns if they don't exist (for existing tables)
DO $$ 
BEGIN
  -- Add ai_analysis column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'error_logs' 
    AND column_name = 'ai_analysis'
  ) THEN
    ALTER TABLE public.error_logs ADD COLUMN ai_analysis JSONB;
    RAISE NOTICE 'Added ai_analysis column to error_logs';
  END IF;

  -- Add fix_status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'error_logs' 
    AND column_name = 'fix_status'
  ) THEN
    ALTER TABLE public.error_logs ADD COLUMN fix_status TEXT DEFAULT 'pending';
    RAISE NOTICE 'Added fix_status column to error_logs';
  END IF;

  -- Add fix_applied_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'error_logs' 
    AND column_name = 'fix_applied_at'
  ) THEN
    ALTER TABLE public.error_logs ADD COLUMN fix_applied_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added fix_applied_at column to error_logs';
  END IF;

  -- Add applied_fix column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'error_logs' 
    AND column_name = 'applied_fix'
  ) THEN
    ALTER TABLE public.error_logs ADD COLUMN applied_fix TEXT;
    RAISE NOTICE 'Added applied_fix column to error_logs';
  END IF;
END $$;

-- Create indexes for error_logs
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON public.error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_fix_status ON public.error_logs(fix_status);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON public.error_logs(user_id);

-- Enable RLS for error_logs
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Super admins full access to error_logs" ON public.error_logs;
DROP POLICY IF EXISTS "Anyone can insert error logs" ON public.error_logs;
DROP POLICY IF EXISTS "Service role full access to error_logs" ON public.error_logs;

-- RLS Policies for error_logs
CREATE POLICY "Super admins full access to error_logs"
  ON public.error_logs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

CREATE POLICY "Anyone can insert error logs"
  ON public.error_logs
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Service role full access to error_logs"
  ON public.error_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.error_logs IS 'Stores application errors for AI-powered monitoring and auto-fix';

-- ============================================
-- 2. BIOMETRIC DATA TABLE (First-Time Attendance Enrollment)
-- ============================================

-- Add enrollment tracking columns to biometric_data
DO $$ 
BEGIN
  -- is_first_attendance_enrollment column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'biometric_data' 
    AND column_name = 'is_first_attendance_enrollment'
  ) THEN
    ALTER TABLE public.biometric_data 
    ADD COLUMN is_first_attendance_enrollment BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added is_first_attendance_enrollment column to biometric_data';
  END IF;

  -- re_enrollment_allowed column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'biometric_data' 
    AND column_name = 're_enrollment_allowed'
  ) THEN
    ALTER TABLE public.biometric_data 
    ADD COLUMN re_enrollment_allowed BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added re_enrollment_allowed column to biometric_data';
  END IF;

  -- re_enrollment_reason column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'biometric_data' 
    AND column_name = 're_enrollment_reason'
  ) THEN
    ALTER TABLE public.biometric_data 
    ADD COLUMN re_enrollment_reason TEXT;
    RAISE NOTICE 'Added re_enrollment_reason column to biometric_data';
  END IF;

  -- re_enrollment_approved_by column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'biometric_data' 
    AND column_name = 're_enrollment_approved_by'
  ) THEN
    ALTER TABLE public.biometric_data 
    ADD COLUMN re_enrollment_approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added re_enrollment_approved_by column to biometric_data';
  END IF;

  -- re_enrollment_approved_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'biometric_data' 
    AND column_name = 're_enrollment_approved_at'
  ) THEN
    ALTER TABLE public.biometric_data 
    ADD COLUMN re_enrollment_approved_at TIMESTAMPTZ;
    RAISE NOTICE 'Added re_enrollment_approved_at column to biometric_data';
  END IF;

  -- webauthn_credential_id column (for Windows Hello, Touch ID, Face ID)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'biometric_data' 
    AND column_name = 'webauthn_credential_id'
  ) THEN
    ALTER TABLE public.biometric_data 
    ADD COLUMN webauthn_credential_id TEXT;
    RAISE NOTICE 'Added webauthn_credential_id column to biometric_data';
  END IF;
END $$;

-- Create indexes for biometric_data enrollment
CREATE INDEX IF NOT EXISTS idx_biometric_enrollment 
  ON public.biometric_data(is_first_attendance_enrollment);
  
CREATE INDEX IF NOT EXISTS idx_biometric_re_enrollment 
  ON public.biometric_data(re_enrollment_allowed);

COMMENT ON COLUMN public.biometric_data.is_first_attendance_enrollment 
  IS 'Flag indicating if enrollment happened during first attendance (inline enrollment)';
  
COMMENT ON COLUMN public.biometric_data.re_enrollment_allowed 
  IS 'Admin approval required for re-enrollment (e.g., device change)';

-- ============================================
-- 2B. WEBAUTHN CREDENTIALS TABLE (Windows Hello, Touch ID, Face ID)
-- ============================================

-- Create webauthn_credentials table if not exists
CREATE TABLE IF NOT EXISTS public.webauthn_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- User reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Credential data
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter INTEGER DEFAULT 0,
  
  -- Device info
  device_name TEXT,
  device_type TEXT, -- 'platform' or 'cross-platform'
  authenticator_type TEXT, -- 'Windows Hello', 'Touch ID', 'Face ID', etc.
  
  -- Usage tracking
  last_used_at TIMESTAMP WITH TIME ZONE,
  use_count INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for webauthn_credentials
CREATE INDEX IF NOT EXISTS idx_webauthn_user_id 
  ON public.webauthn_credentials(user_id);
  
CREATE INDEX IF NOT EXISTS idx_webauthn_credential_id 
  ON public.webauthn_credentials(credential_id);
  
CREATE INDEX IF NOT EXISTS idx_webauthn_active 
  ON public.webauthn_credentials(is_active);

-- RLS policies for webauthn_credentials
ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own credentials" ON public.webauthn_credentials;
DROP POLICY IF EXISTS "Service role full access to credentials" ON public.webauthn_credentials;

-- Users can read their own credentials
CREATE POLICY "Users can view own credentials"
  ON public.webauthn_credentials
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can do everything
CREATE POLICY "Service role full access to credentials"
  ON public.webauthn_credentials
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.webauthn_credentials 
  IS 'Stores WebAuthn credentials for biometric authentication (Windows Hello, Touch ID, Face ID, etc.)';

-- ============================================
-- 3. ATTENDANCE TABLE (Enrollment Flag)
-- ============================================

-- Add is_enrollment_attendance column to attendance table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'attendance' 
    AND column_name = 'is_enrollment_attendance'
  ) THEN
    ALTER TABLE public.attendance 
    ADD COLUMN is_enrollment_attendance BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added is_enrollment_attendance column to attendance';
  END IF;
END $$;

-- Create index for attendance enrollment
CREATE INDEX IF NOT EXISTS idx_attendance_enrollment 
  ON public.attendance(is_enrollment_attendance);

COMMENT ON COLUMN public.attendance.is_enrollment_attendance 
  IS 'Flag indicating if this attendance record also enrolled biometric data (first-time attendance)';

-- ============================================
-- 4. USER ACTIVITY TABLE (Create if not exists)
-- ============================================

-- Create user_activity table if not exists
CREATE TABLE IF NOT EXISTS public.user_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- User identification
  user_id TEXT NOT NULL,
  user_name TEXT,
  user_email TEXT,
  user_role TEXT,
  
  -- Activity details
  activity_type TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  
  -- Request context
  ip_address TEXT,
  user_agent TEXT,
  device_info JSONB,
  location_data JSONB,
  
  -- Related entity
  related_id TEXT,
  related_type TEXT,
  
  -- Status
  status TEXT DEFAULT 'success',
  error_message TEXT
);

-- Create indexes for user_activity
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON public.user_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_activity_type ON public.user_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_status ON public.user_activity(status);

-- Enable RLS
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Super admins can view all activity" ON public.user_activity;
DROP POLICY IF EXISTS "Users can view own activity" ON public.user_activity;
DROP POLICY IF EXISTS "Anyone can insert activity" ON public.user_activity;
DROP POLICY IF EXISTS "Service role full access" ON public.user_activity;

-- RLS Policies
CREATE POLICY "Super admins can view all activity"
  ON public.user_activity
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

CREATE POLICY "Users can view own activity"
  ON public.user_activity
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "Anyone can insert activity"
  ON public.user_activity
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Service role full access"
  ON public.user_activity
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.user_activity IS 'Logs all user activities for monitoring and analytics';

-- Verify table was created
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_activity'
  ) THEN
    RAISE NOTICE 'user_activity table exists ✓';
  ELSE
    RAISE EXCEPTION 'Failed to create user_activity table';
  END IF;
END $$;

-- ============================================
-- 5. VERIFICATION SUMMARY
-- ============================================

-- Check all critical columns exist
DO $$ 
DECLARE
  missing_columns TEXT[];
BEGIN
  -- Check error_logs.ai_analysis
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'error_logs' 
    AND column_name = 'ai_analysis'
  ) THEN
    missing_columns := array_append(missing_columns, 'error_logs.ai_analysis');
  END IF;

  -- Check biometric_data.is_first_attendance_enrollment
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'biometric_data' 
    AND column_name = 'is_first_attendance_enrollment'
  ) THEN
    missing_columns := array_append(missing_columns, 'biometric_data.is_first_attendance_enrollment');
  END IF;

  -- Check attendance.is_enrollment_attendance
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'attendance' 
    AND column_name = 'is_enrollment_attendance'
  ) THEN
    missing_columns := array_append(missing_columns, 'attendance.is_enrollment_attendance');
  END IF;

  IF array_length(missing_columns, 1) > 0 THEN
    RAISE WARNING 'Missing columns: %', array_to_string(missing_columns, ', ');
  ELSE
    RAISE NOTICE '✅ All critical columns exist!';
  END IF;
END $$;

-- ============================================
-- 6. ACTIVITY TYPES VERIFICATION (Optional - uncomment to check)
-- ============================================

-- Verify activity types are being logged correctly
-- Uncomment below to see activity statistics:
/*
SELECT 
  activity_type,
  COUNT(*) as count,
  MAX(created_at) as last_logged
FROM public.user_activity
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY activity_type
ORDER BY count DESC;
*/

-- ============================================
-- 7. COMPLETION SUMMARY (Optional - uncomment to check)
-- ============================================

-- Summary of all tables and critical columns
-- Uncomment below to see schema details:
/*
SELECT 
  'error_logs' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'error_logs'
AND column_name IN ('ai_analysis', 'fix_status', 'severity')

UNION ALL

SELECT 
  'biometric_data' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'biometric_data'
AND column_name IN ('is_first_attendance_enrollment', 're_enrollment_allowed', 're_enrollment_reason', 'webauthn_credential_id')

UNION ALL

SELECT 
  'attendance' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'attendance'
AND column_name IN ('is_enrollment_attendance', 'user_id', 'status')

ORDER BY table_name, column_name;
*/

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Next steps:
-- 1. Deploy to Vercel (git push)
-- 2. Test login activity logging
-- 3. Test comment activity logging
-- 4. Test like activity logging
-- 5. Test first-time attendance enrollment
-- 6. Verify error monitoring works
-- ============================================
