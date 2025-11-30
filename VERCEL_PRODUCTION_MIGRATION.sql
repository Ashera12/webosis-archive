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

-- Add ai_analysis column if missing (for existing tables)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'error_logs' 
    AND column_name = 'ai_analysis'
  ) THEN
    ALTER TABLE public.error_logs ADD COLUMN ai_analysis JSONB;
    RAISE NOTICE 'Added ai_analysis column to error_logs';
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
-- 4. USER ACTIVITY TABLE (Already exists, verify)
-- ============================================

-- Verify user_activity table exists (should already be created)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_activity'
  ) THEN
    RAISE EXCEPTION 'user_activity table does not exist! Run user_activity_monitoring.sql first.';
  END IF;
  
  RAISE NOTICE 'user_activity table exists ✓';
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
-- 6. ACTIVITY TYPES VERIFICATION
-- ============================================

-- Verify activity types are being logged correctly
SELECT 
  activity_type,
  COUNT(*) as count,
  MAX(created_at) as last_logged
FROM public.user_activity
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY activity_type
ORDER BY count DESC;

-- ============================================
-- 7. COMPLETION SUMMARY
-- ============================================

-- Summary of all tables and critical columns
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
AND column_name IN ('is_first_attendance_enrollment', 're_enrollment_allowed', 're_enrollment_reason')

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
