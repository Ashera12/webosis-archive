-- Fix RLS policies for admin_settings table - AGGRESSIVE FIX
-- This completely disables RLS and grants all permissions

-- First, check if table exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'admin_settings') THEN
    RAISE NOTICE 'Table admin_settings does not exist!';
  END IF;
END $$;

-- Drop ALL existing policies
DO $$ 
DECLARE
  pol record;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'admin_settings'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON admin_settings', pol.policyname);
  END LOOP;
END $$;

-- FORCE DISABLE RLS
ALTER TABLE IF EXISTS admin_settings DISABLE ROW LEVEL SECURITY;

-- Remove any ownership restrictions
ALTER TABLE IF EXISTS admin_settings OWNER TO postgres;

-- Grant ALL permissions to ALL roles
GRANT ALL PRIVILEGES ON admin_settings TO postgres;
GRANT ALL PRIVILEGES ON admin_settings TO authenticated;
GRANT ALL PRIVILEGES ON admin_settings TO anon;
GRANT ALL PRIVILEGES ON admin_settings TO service_role;
GRANT ALL PRIVILEGES ON admin_settings TO PUBLIC;

-- Grant sequence permissions to ALL roles if exists
DO $$ 
BEGIN
  -- Check for id sequence
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'admin_settings_id_seq' AND relkind = 'S') THEN
    GRANT ALL ON SEQUENCE admin_settings_id_seq TO postgres;
    GRANT ALL ON SEQUENCE admin_settings_id_seq TO authenticated;
    GRANT ALL ON SEQUENCE admin_settings_id_seq TO anon;
    GRANT ALL ON SEQUENCE admin_settings_id_seq TO service_role;
    GRANT ALL ON SEQUENCE admin_settings_id_seq TO PUBLIC;
    RAISE NOTICE 'Granted permissions on admin_settings_id_seq';
  END IF;
END $$;

-- Verify RLS is disabled and show permissions
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  tableowner
FROM pg_tables 
WHERE tablename = 'admin_settings';

-- Show table permissions
SELECT 
  grantee, 
  privilege_type 
FROM information_schema.table_privileges 
WHERE table_name = 'admin_settings'
ORDER BY grantee, privilege_type;

-- Confirm no policies exist
SELECT 
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ No RLS policies - GOOD!'
    ELSE '⚠️ Policies still exist'
  END as status
FROM pg_policies 
WHERE tablename = 'admin_settings';
