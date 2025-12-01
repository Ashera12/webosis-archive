-- =====================================================
-- CREATE ADMIN SETTINGS TABLE
-- Run this FIRST before any other migrations
-- =====================================================

-- Create admin_settings table with all columns
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indices
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(key);

-- Enable RLS
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated read access" ON admin_settings;
DROP POLICY IF EXISTS "Service role full access" ON admin_settings;

-- Allow all authenticated users to read
CREATE POLICY "Allow authenticated read access"
  ON admin_settings FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow service role to do everything
CREATE POLICY "Service role full access"
  ON admin_settings FOR ALL
  USING (auth.role() = 'service_role');

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ admin_settings table created successfully!';
  RAISE NOTICE 'Schema: id, key, value, created_at, updated_at';
  RAISE NOTICE 'Next: Run add_mikrotik_settings.sql';
END $$;
