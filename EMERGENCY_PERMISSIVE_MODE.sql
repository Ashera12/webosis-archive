-- ===============================================
-- EMERGENCY FIX: Permissive WiFi Validation
-- For Development & Testing - Allow ALL IPs
-- ===============================================

-- STEP 1: Update Lembang to allow ALL IPs (for testing)
UPDATE school_location_config
SET 
  allowed_ip_ranges = ARRAY['0.0.0.0/0'],  -- Allow ALL IPs (testing mode)
  require_wifi = false,                     -- Don't require WiFi SSID
  updated_at = NOW()
WHERE id = 6;

-- Verify
SELECT 
  id,
  location_name,
  allowed_wifi_ssids,
  allowed_ip_ranges,
  require_wifi,
  is_active
FROM school_location_config
WHERE id = 6;

-- Expected:
-- allowed_ip_ranges: ["0.0.0.0/0"]  ← Allows ANY IP
-- require_wifi: false
-- is_active: true

-- Test IP matching (should return TRUE for ANY IP)
SELECT 
  '182.10.97.87'::inet << '0.0.0.0/0'::cidr AS public_ip_allowed,
  '192.168.1.1'::inet << '0.0.0.0/0'::cidr AS private_ip_allowed,
  '100.87.220.23'::inet << '0.0.0.0/0'::cidr AS cgnat_ip_allowed;

-- All should be TRUE

-- ⚠️ FOR PRODUCTION: Replace 0.0.0.0/0 with actual school IP ranges
-- Example for production:
/*
UPDATE school_location_config
SET allowed_ip_ranges = ARRAY[
  '192.168.0.0/16',    -- School WiFi
  '182.10.0.0/16'      -- School public IP range (if static)
]
WHERE id = 6;
*/
