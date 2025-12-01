-- ========================================
-- 🔧 FIX MULTIPLE ACTIVE GPS CONFIGS
-- ========================================
-- Problem: Might have multiple is_active=true rows causing conflict

-- STEP 1: Deactivate ALL configs first
UPDATE school_location_config
SET is_active = false
WHERE true;

-- STEP 2: Activate ONLY the correct Bandung config
UPDATE school_location_config
SET 
  is_active = true,
  location_name = 'SMK Fithrah Insani - Bandung',
  latitude = -6.864733,
  longitude = 107.522064,
  radius_meters = 50,
  require_wifi = false,
  allowed_ip_ranges = ARRAY['100.64.0.0/10', '125.160.0.0/16'],
  updated_at = NOW()
WHERE id = 6;

-- STEP 3: Verify only ONE active config
SELECT 
  id,
  location_name,
  latitude,
  longitude,
  radius_meters,
  is_active
FROM school_location_config
WHERE is_active = true;

-- ========================================
-- EXPECTED RESULT: ONLY 1 ROW
-- id: 6
-- latitude: -6.864733
-- longitude: 107.522064
-- ========================================
