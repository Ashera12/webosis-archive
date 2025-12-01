-- =====================================================
-- COMPLETE SCHOOL LOCATION CONFIG
-- Creates table with all required columns
-- =====================================================

-- Create school_location_config table
CREATE TABLE IF NOT EXISTS school_location_config (
  id SERIAL PRIMARY KEY,
  location_name TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius_meters DECIMAL(10, 2) DEFAULT 100,
  allowed_ip_ranges TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE UNIQUE INDEX IF NOT EXISTS idx_school_location_name 
  ON school_location_config(location_name);

-- Enable RLS
ALTER TABLE school_location_config ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read access" ON school_location_config;
DROP POLICY IF EXISTS "Service role full access on locations" ON school_location_config;

-- Allow public read access
CREATE POLICY "Allow public read access"
  ON school_location_config FOR SELECT
  USING (true);

-- Allow service role full access
CREATE POLICY "Service role full access on locations"
  ON school_location_config FOR ALL
  USING (auth.role() = 'service_role');

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ school_location_config table created successfully!';
  RAISE NOTICE 'Next: Run fix_ip_ranges_cgnat.sql to populate IP ranges';
END $$;
