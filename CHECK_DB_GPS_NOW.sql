-- ========================================
-- 🔍 CHECK DATABASE GPS - VERIFY REAL DATA
-- ========================================
-- Run this in Supabase SQL Editor to verify GPS data

-- 1. CHECK ACTIVE CONFIG
SELECT 
  id,
  location_name,
  latitude,
  longitude,
  radius_meters,
  is_active,
  require_wifi,
  allowed_wifi_ssids,
  allowed_ip_ranges,
  created_at,
  updated_at
FROM school_location_config
WHERE is_active = true;

-- 2. CHECK ALL CONFIGS (in case is_active is wrong)
SELECT 
  id,
  location_name,
  latitude,
  longitude,
  radius_meters,
  is_active,
  require_wifi
FROM school_location_config
ORDER BY updated_at DESC;

-- 3. CHECK IF THERE'S MULTIPLE ACTIVE (should be only 1)
SELECT 
  COUNT(*) as active_count,
  ARRAY_AGG(location_name) as active_locations
FROM school_location_config
WHERE is_active = true;

-- ========================================
-- EXPECTED RESULT:
-- ========================================
-- id: 6
-- location_name: SMK Fithrah Insani - Bandung
-- latitude: -6.864733
-- longitude: 107.522064
-- radius_meters: 50
-- is_active: true
-- ========================================
