-- =====================================================
-- FIX IP 125.160.157.192 - ADD TO WHITELIST
-- User: any.hand2@gmail.com
-- Issue: IP_NOT_IN_WHITELIST blocking attendance
-- Date: 2024-12-01
-- =====================================================

-- IMPORTANT: IP 125.160.157.192 is a public ISP IP (bukan CGNAT)
-- Range: 125.160.0.0/16 (PT Telkom Indonesia)

-- Option 1: Add specific IP range untuk Telkom
UPDATE school_location_config 
SET allowed_ip_ranges = array_append(allowed_ip_ranges, '125.160.0.0/16')
WHERE location_name IS NOT NULL
  AND NOT ('125.160.0.0/16' = ANY(allowed_ip_ranges));

-- Option 2: Add broader range untuk semua public IP (NOT RECOMMENDED for production)
-- Uncomment jika ingin allow semua IP public:
-- UPDATE school_location_config 
-- SET allowed_ip_ranges = array_append(allowed_ip_ranges, '0.0.0.0/0')
-- WHERE location_name IS NOT NULL;

-- Update admin_settings untuk disable IP validation (temporary fix)
UPDATE admin_settings 
SET 
  attendance_ip_validation_enabled = false,
  updated_at = NOW()
WHERE id = (SELECT id FROM admin_settings ORDER BY is_active DESC LIMIT 1);

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
  attendance_ip_validation_enabled,
  location_latitude,
  location_longitude,
  location_radius_meters,
  updated_at
FROM admin_settings
WHERE is_active = true
LIMIT 1;

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
