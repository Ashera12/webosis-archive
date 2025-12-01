-- VERIFY DATABASE GPS NOW
SELECT 
  id,
  location_name,
  latitude,
  longitude,
  radius_meters,
  is_active,
  updated_at
FROM school_location_config
WHERE is_active = true
ORDER BY updated_at DESC
LIMIT 1;

-- Expected:
-- latitude: -6.864733
-- longitude: 107.522064
