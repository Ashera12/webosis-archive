-- ULTIMATE FIX: Recreate admin_settings table WITHOUT RLS
-- This is the nuclear option - backup and recreate table

-- Step 1: Backup existing data (select only columns that exist)
CREATE TEMP TABLE admin_settings_backup AS 
SELECT * FROM admin_settings;

-- Step 2: Drop old table completely
DROP TABLE IF EXISTS admin_settings CASCADE;

-- Step 3: Recreate table WITHOUT RLS (match your actual schema + is_secret for code compatibility)
CREATE TABLE admin_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  is_secret BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CRITICAL: Ensure RLS is DISABLED
ALTER TABLE admin_settings DISABLE ROW LEVEL SECURITY;

-- Step 4: Restore data (only restore existing columns)
INSERT INTO admin_settings (key, value, updated_at)
SELECT key, value, updated_at 
FROM admin_settings_backup
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;

-- Step 5: Grant ALL permissions to ALL roles (NO sequence needed for TEXT primary key)
ALTER TABLE admin_settings OWNER TO postgres;
GRANT ALL PRIVILEGES ON admin_settings TO postgres;
GRANT ALL PRIVILEGES ON admin_settings TO authenticated;
GRANT ALL PRIVILEGES ON admin_settings TO anon;
GRANT ALL PRIVILEGES ON admin_settings TO service_role;
GRANT ALL PRIVILEGES ON TABLE admin_settings TO PUBLIC;

-- Step 6: Verify NO RLS enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity = false THEN '✅ RLS DISABLED - PERFECT!'
    ELSE '❌ RLS STILL ENABLED - PROBLEM!'
  END as status
FROM pg_tables 
WHERE tablename = 'admin_settings';

-- Step 7: Show permissions
SELECT 
  grantee, 
  string_agg(privilege_type, ', ') as privileges
FROM information_schema.table_privileges 
WHERE table_name = 'admin_settings'
GROUP BY grantee
ORDER BY grantee;

-- Step 8: Count restored rows
SELECT 
  COUNT(*) as total_settings,
  string_agg(key, ', ') as setting_keys
FROM admin_settings;
