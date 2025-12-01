-- ✅ VERIFY DATABASE GPS COORDINATES
-- Run this in Supabase SQL Editor to check current database state

-- 1. Check what's actually in the database
SELECT 
  id,
  location_name,
  latitude,
  longitude,
  radius_meters,
  allowed_ip_ranges,
  is_active,
  updated_at
FROM school_location_config
WHERE is_active = true;

-- Expected result:
-- location_name: 'SMK Fithrah Insani - Bandung'
-- latitude: -6.900969 (Bandung)
-- longitude: 107.542391 (Bandung)
-- radius_meters: 300
-- allowed_ip_ranges: ['125.160.0.0/16', '100.64.0.0/10', '192.168.0.0/16', '10.0.0.0/8']

-- 2. Calculate distance from user's current GPS to school GPS
SELECT 
  location_name,
  latitude AS school_lat,
  longitude AS school_lon,
  
  -- User's current GPS (from console logs)
  -6.864813 AS user_lat,
  107.522026 AS user_lon,
  
  -- Haversine distance calculation (in meters)
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
  ) AS distance_meters,
  
  -- Check if within radius
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
  ) <= radius_meters AS is_within_range,
  
  radius_meters AS max_radius
FROM school_location_config
WHERE is_active = true;

-- ⚠️ PROBLEM DIAGNOSIS:
-- If latitude/longitude still shows -6.200000, 106.816666 (Jakarta):
--   → Database NOT updated (previous script may have failed silently)
--   → Need to run UPDATE query
--
-- If latitude/longitude shows -6.900969, 107.542391 (Bandung):
--   → Database IS correct
--   → Problem is frontend cache or API not returning fresh data
--
-- If distance_meters is ~107,000m (107km):
--   → School GPS is wrong (still Jakarta coordinates)
--
-- If distance_meters is ~4,000m (4km):
--   → School GPS is correct (Bandung)
--   → User is not at exact school location
--   → Need to increase radius to 5000m or user needs to go to school
