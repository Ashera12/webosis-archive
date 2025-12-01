-- 🚨 EMERGENCY GPS FIX - Update School Coordinates
-- Run this in Supabase SQL Editor (you need database access)

-- ✅ OPTION 1: Update existing config (if one exists)
UPDATE school_location_config
SET 
  location_name = 'SMK Fithrah Insani - Bandung',
  latitude = -6.864813,  -- User's current GPS (assuming user is AT school)
  longitude = 107.522026,
  radius_meters = 5000,  -- 5km radius (temporary - covers wide area)
  allowed_ip_ranges = ARRAY['125.160.0.0/16', '100.64.0.0/10', '192.168.0.0/16', '10.0.0.0/8'],
  require_wifi = false,
  network_security_level = 'medium',
  bypass_gps_validation = false,
  updated_at = NOW()
WHERE is_active = true;

-- Verify update
SELECT 
  id,
  location_name,
  latitude,
  longitude,
  radius_meters,
  is_active,
  
  -- Calculate distance from user's current position
  (
    6371000 * ACOS(
      LEAST(1.0, 
        COS(RADIANS(-6.864813)) * 
        COS(RADIANS(latitude)) * 
        COS(RADIANS(longitude) - RADIANS(107.522026)) +
        SIN(RADIANS(-6.864813)) * 
        SIN(RADIANS(latitude))
      )
    )
  ) AS distance_meters_from_current_user
FROM school_location_config
WHERE is_active = true;

-- Expected result: distance_meters_from_current_user = 0 (if user is at school)

-- ✅ OPTION 2: If no config exists, insert new one
INSERT INTO school_location_config (
  location_name,
  latitude,
  longitude,
  radius_meters,
  allowed_wifi_ssids,
  allowed_ip_ranges,
  require_wifi,
  network_security_level,
  bypass_gps_validation,
  is_active
) 
SELECT 
  'SMK Fithrah Insani - Bandung',
  -6.864813,
  107.522026,
  5000,
  ARRAY[]::text[],
  ARRAY['125.160.0.0/16', '100.64.0.0/10', '192.168.0.0/16', '10.0.0.0/8'],
  false,
  'medium',
  false,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM school_location_config WHERE is_active = true
);

-- 🔍 TROUBLESHOOTING: Check if RLS is blocking updates
SELECT 
  tablename, 
  schemaname,
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'school_location_config';

-- If rowsecurity = true, check RLS policies
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'school_location_config';

-- ⚠️ NOTE ABOUT COORDINATES:
-- Current user GPS: -6.864813, 107.522026 (99m accuracy)
-- This script assumes user is CURRENTLY AT the school location
-- 
-- If user is NOT at school right now:
-- 1. User needs to GO TO school
-- 2. Get GPS from /attendance page
-- 3. Update this script with those coordinates
-- 4. Run this script
--
-- OR use Google Maps to get exact school coordinates:
-- 1. Open Google Maps
-- 2. Search "SMK Fithrah Insani Bandung"
-- 3. Right-click on the building → Click coordinates
-- 4. Replace -6.864813, 107.522026 with the real coordinates
