-- ⚡ QUICK FIX: Enable GPS Bypass for Testing
-- Run this to allow attendance from ANYWHERE (for testing/development)

-- Add bypass_gps_validation column if not exists
ALTER TABLE school_location_config 
ADD COLUMN IF NOT EXISTS bypass_gps_validation BOOLEAN DEFAULT false;

-- ✅ ENABLE GPS BYPASS (Testing Mode)
UPDATE school_location_config 
SET bypass_gps_validation = true
WHERE is_active = true;

-- Also update IP ranges
UPDATE school_location_config 
SET allowed_ip_ranges = ARRAY[
  '192.168.0.0/16',
  '10.0.0.0/8',
  '182.10.0.0/16',   -- ✅ YOUR IP
  '100.64.0.0/10',
  '0.0.0.0/0'        -- ✅ ALLOW ALL (testing only!)
]
WHERE is_active = true;

-- Verify
SELECT 
  location_name,
  bypass_gps_validation,
  allowed_ip_ranges,
  radius_meters,
  is_active
FROM school_location_config
WHERE is_active = true;

-- Expected result:
-- bypass_gps_validation: true ✅
-- allowed_ip_ranges: {192.168.0.0/16, 10.0.0.0/8, 182.10.0.0/16, 100.64.0.0/10, 0.0.0.0/0}

/*
⚠️ PRODUCTION MODE (Disable Bypass):

UPDATE school_location_config 
SET 
  bypass_gps_validation = false,
  allowed_ip_ranges = ARRAY[
    '192.168.0.0/16',
    '10.0.0.0/8',
    '182.10.0.0/16'
  ]
WHERE is_active = true;
*/
