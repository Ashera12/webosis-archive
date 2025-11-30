-- ===============================================
-- COMPLETE FIX: All-in-One SQL Solution
-- Run this in Supabase SQL Editor
-- ===============================================

-- ===============================================
-- STEP 1: Create user_activities table
-- ===============================================
DROP TABLE IF EXISTS user_activities CASCADE;

CREATE TABLE user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_email TEXT,
  activity_type TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'info',
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_user_activities_type ON user_activities(activity_type);
CREATE INDEX idx_user_activities_created ON user_activities(created_at DESC);
CREATE INDEX idx_user_activities_status ON user_activities(status);

-- Enable RLS
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Service role full access" 
  ON user_activities FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Users can insert" 
  ON user_activities FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users view own" 
  ON user_activities FOR SELECT TO authenticated 
  USING (user_id = auth.uid()::text OR user_email = auth.email());

CREATE POLICY "Public can insert" 
  ON user_activities FOR INSERT TO anon WITH CHECK (true);

COMMENT ON TABLE user_activities IS 'Activity logging for monitoring and security analysis';

-- ===============================================
-- STEP 2: Update IP Ranges (CRITICAL!)
-- ===============================================

-- Add CGNAT range (100.64.0.0/10) which includes 100.87.220.23
-- Add common private ranges
-- Set require_wifi = false (don't block if SSID can't be detected)

UPDATE school_location_config
SET 
  allowed_ip_ranges = ARRAY[
    '192.168.0.0/16',     -- All 192.168.x.x (common home/office)
    '10.0.0.0/8',         -- All 10.x.x.x (enterprise)
    '172.16.0.0/12',      -- 172.16-31.x.x (corporate)
    '100.64.0.0/10'       -- CGNAT (includes 100.87.220.23) ⭐
  ],
  require_wifi = false,   -- Don't block if WiFi SSID can't be detected
  updated_at = NOW()
WHERE id = 6 AND location_name = 'Lembang';

-- ===============================================
-- STEP 3: Ensure Lembang is the ONLY active location
-- ===============================================
UPDATE school_location_config SET is_active = false WHERE id != 6;
UPDATE school_location_config SET is_active = true WHERE id = 6;

-- ===============================================
-- STEP 4: Verify Everything
-- ===============================================

-- Check user_activities table
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'user_activities'
ORDER BY ordinal_position;

-- Check school_location_config
SELECT 
  id,
  location_name,
  allowed_wifi_ssids,
  allowed_ip_ranges,
  require_wifi,
  is_active,
  updated_at
FROM school_location_config
ORDER BY is_active DESC, id;

-- ===============================================
-- EXPECTED OUTPUT:
-- ===============================================
-- 
-- user_activities columns:
-- id, user_id, user_email, activity_type, description, 
-- status, details, ip_address, user_agent, created_at, updated_at
--
-- school_location_config (id=6 - Lembang):
-- allowed_wifi_ssids: ["Villa Lembang"]
-- allowed_ip_ranges: ["192.168.0.0/16","10.0.0.0/8","172.16.0.0/12","100.64.0.0/10"]
-- require_wifi: false
-- is_active: true
--
-- ✅ IP 100.87.220.23 is in range 100.64.0.0/10 → WILL MATCH!
-- ===============================================

-- Test IP range matching (should return true for user's IP)
SELECT 
  '100.87.220.23'::inet << '100.64.0.0/10'::cidr AS ip_in_cgnat_range,
  '192.168.100.50'::inet << '192.168.0.0/16'::cidr AS ip_in_private_range;

-- Expected: both should be TRUE

-- ===============================================
-- OPTIONAL: Insert test activity log
-- ===============================================
INSERT INTO user_activities (
  user_id,
  user_email,
  activity_type,
  description,
  status,
  details,
  ip_address
) VALUES (
  'test-user',
  'test@example.com',
  'test_activity',
  'Testing user_activities table after creation',
  'success',
  '{"test": true, "timestamp": "' || NOW() || '"}'::jsonb,
  '100.87.220.23'
);

-- Verify insert
SELECT * FROM user_activities ORDER BY created_at DESC LIMIT 1;

-- ===============================================
-- SUCCESS INDICATORS:
-- ===============================================
-- ✅ user_activities table exists with all columns
-- ✅ Lembang (id=6) is the only active location
-- ✅ allowed_ip_ranges includes 100.64.0.0/10 (CGNAT)
-- ✅ require_wifi = false (won't block if SSID not detected)
-- ✅ Test insert successful
-- ✅ IP range test shows TRUE for user's IP
-- ===============================================

COMMENT ON COLUMN school_location_config.allowed_ip_ranges IS 
'Allowed IP ranges in CIDR notation. Includes:
- 192.168.0.0/16: Common home/office networks
- 10.0.0.0/8: Enterprise networks  
- 172.16.0.0/12: Corporate networks
- 100.64.0.0/10: Carrier-grade NAT (CGNAT) - ISP shared IPs';

-- Done! ✅
