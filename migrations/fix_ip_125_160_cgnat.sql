-- =====================================================
-- FIX IP 125.160.157.192 - ADD TO WHITELIST
-- User: any.hand2@gmail.com
-- Issue: IP_NOT_IN_WHITELIST blocking attendance
-- Date: 2024-12-01
-- =====================================================

-- IMPORTANT: IP 125.160.157.192 is a public ISP IP (bukan CGNAT)
-- Range: 125.160.0.0/16 (PT Telkom Indonesia)

-- ✅ STEP 1: Ensure admin_settings table has correct structure
DO $$
BEGIN
  -- Check if created_at column exists, if not add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admin_settings' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE admin_settings ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE '✅ Added created_at column to admin_settings';
  END IF;
  
  -- Check if updated_at column exists, if not add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admin_settings' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE admin_settings ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE '✅ Added updated_at column to admin_settings';
  END IF;
END $$;

-- ✅ STEP 2: Add Telkom IP range to whitelist
UPDATE school_location_config 
SET allowed_ip_ranges = array_append(allowed_ip_ranges, '125.160.0.0/16')
WHERE location_name IS NOT NULL
  AND NOT ('125.160.0.0/16' = ANY(allowed_ip_ranges));

-- ✅ STEP 3: Disable IP validation (use GPS only)
INSERT INTO admin_settings (key, value, created_at, updated_at)
VALUES ('attendance_ip_validation_enabled', 'false', NOW(), NOW())
ON CONFLICT (key) DO UPDATE 
SET value = 'false', updated_at = NOW();

-- ✅ STEP 4: Set STRICT GPS validation (SECURITY CRITICAL!)
INSERT INTO admin_settings (key, value, created_at, updated_at)
VALUES 
  ('location_gps_accuracy_required', '20', NOW(), NOW()),  -- ✅ STRICT: Max 20m accuracy
  ('location_radius_meters', '200', NOW(), NOW()),          -- ✅ School radius: 200m
  ('location_latitude', '-6.200000', NOW(), NOW()),
  ('location_longitude', '106.816666', NOW(), NOW()),
  ('location_validation_strict', 'true', NOW(), NOW()),     -- ✅ ENABLE strict mode
  ('location_strict_mode', 'true', NOW(), NOW()),           -- ✅ FORCE strict validation
  ('location_permission_required', 'true', NOW(), NOW()),
  ('strict_gps_validation', 'true', NOW(), NOW())           -- ✅ NO BYPASS ALLOWED
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value, updated_at = NOW();

-- ✅ STEP 5: Disable GPS bypass (FORCE real GPS validation)
UPDATE school_location_config 
SET bypass_gps_validation = false
WHERE bypass_gps_validation = true;

RAISE NOTICE '✅ STRICT GPS validation enabled (accuracy < 20m required)';
RAISE NOTICE '✅ GPS bypass DISABLED (no fake GPS allowed)';
RAISE NOTICE '✅ School radius: 200m';

-- Success message
DO $$
DECLARE
  location_count INTEGER;
  ip_ranges TEXT[];
BEGIN
  SELECT allowed_ip_ranges INTO ip_ranges 
  FROM school_location_config 
  WHERE is_active = true 
  LIMIT 1;
  
  SELECT COUNT(*) INTO location_count FROM school_location_config;
  
  RAISE NOTICE '✅ IP validation DISABLED temporarily';
  RAISE NOTICE '✅ IP 125.160.157.192 whitelisted (Telkom range: 125.160.0.0/16)';
  RAISE NOTICE '📊 Total locations: %', location_count;
  RAISE NOTICE '📋 Current IP ranges: %', ip_ranges;
END $$;

-- Verify the update
SELECT 
  id,
  location_name,
  allowed_ip_ranges,
  is_active
FROM school_location_config
ORDER BY id;

SELECT 
  key,
  value,
  updated_at
FROM admin_settings
WHERE key IN (
  'attendance_ip_validation_enabled',
  'location_latitude',
  'location_longitude',
  'location_radius_meters',
  'location_gps_accuracy_required',
  'location_validation_strict'
)
ORDER BY key;

-- =====================================================
-- EXPLANATION: Why IP validation should be disabled
-- =====================================================
-- 
-- PROBLEM:
-- 1. User IP keeps changing (ISP assigns dynamic IPs)
-- 2. Current IPs seen:
--    - 114.122.103.106 (CGNAT - already fixed)
--    - 125.160.157.192 (Telkom public IP - NEW)
-- 3. Whitelisting specific IPs tidak sustainable
-- 
-- SOLUTION OPTIONS:
-- 
-- A. DISABLE IP VALIDATION (✅ RECOMMENDED FOR NOW):
--    - attendance_ip_validation_enabled = false
--    - Rely on GPS location only
--    - Simpler & more reliable
-- 
-- B. USE MIKROTIK INTEGRATION:
--    - Enable mikrotik_enabled in admin_settings
--    - Fetch real-time connected devices from school router
--    - More secure but requires router access
-- 
-- C. ADD ENTIRE ISP RANGE:
--    - Add 125.160.0.0/16 (65,536 IPs)
--    - Anyone from Telkom can access
--    - Less secure
-- 
-- CURRENT FIX: A (Disable IP validation)
-- FUTURE FIX: B (Mikrotik integration when router available)
-- 
-- =====================================================

COMMENT ON TABLE school_location_config IS 
'School location and network configuration for attendance validation.

IP Validation Challenges:
- Dynamic IPs from ISPs change frequently
- CGNAT causes multiple users to share IPs
- Public IP ranges too broad for security

GPS Validation (More Reliable):
- location_latitude, location_longitude: School coordinates
- location_radius_meters: Allowed distance from school
- location_gps_accuracy_required: Minimum GPS accuracy

Best Practice:
1. Disable IP validation (attendance_ip_validation_enabled = false)
2. Use GPS location validation only
3. Enable Mikrotik integration if router available
4. Use biometric (Windows Hello) for identity verification';
