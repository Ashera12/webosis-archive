-- ===============================================
-- FIX: Add Additional IP Ranges for Testing
-- ===============================================

-- IMPORTANT: Check your actual IP first!
-- IP detected: 100.87.220.23

-- Option 1: Add this IP range to Lembang location
UPDATE school_location_config
SET allowed_ip_ranges = ARRAY['192.168.100.0/24', '100.87.0.0/16']
WHERE id = 6 AND location_name = 'Lembang';

-- Option 2: Create new testing location with this IP
INSERT INTO school_location_config (
  location_name,
  latitude,
  longitude,
  radius_meters,
  allowed_wifi_ssids,
  allowed_ip_ranges,
  require_wifi,
  is_active,
  created_at,
  updated_at
) VALUES (
  'Remote Testing - VPN Access',
  -6.8132,
  107.6010,
  1000,
  ARRAY['Any WiFi'],  -- Allow any SSID for testing
  ARRAY['100.87.0.0/16', '192.168.0.0/16', '10.0.0.0/8'],  -- Wide range for testing
  false,  -- Don't require specific WiFi
  false,  -- Set to true to activate this location
  NOW(),
  NOW()
);

-- Option 3: Temporarily disable WiFi requirement for Lembang
UPDATE school_location_config
SET 
  require_wifi = false,  -- Don't block if WiFi not detected
  allowed_ip_ranges = ARRAY['192.168.100.0/24', '100.87.0.0/16', '0.0.0.0/0']  -- Allow all IPs (TESTING ONLY!)
WHERE id = 6;

-- ⚠️ FOR PRODUCTION: Remove '0.0.0.0/0' after testing!

-- Verify changes
SELECT 
  id,
  location_name,
  allowed_wifi_ssids,
  allowed_ip_ranges,
  require_wifi,
  is_active
FROM school_location_config
ORDER BY is_active DESC, id;

-- RECOMMENDED APPROACH:
-- 1. First, verify your actual WiFi network
-- 2. If you're on Villa Lembang WiFi, check router settings for IP range
-- 3. Update allowed_ip_ranges to match your router's DHCP range
-- 4. If testing remotely (VPN/mobile data), use Option 2 above

-- ===============================================
-- DIAGNOSE: Check your current IP
-- ===============================================

-- After updating, test with:
-- IP: 100.87.220.23
-- Should match: 100.87.0.0/16 (if using Option 1 or 3)

-- To test CIDR matching:
-- 100.87.220.23 in 100.87.0.0/16?
-- Network: 100.87.0.0, Prefix: /16 (255.255.0.0)
-- First two octets must match: 100.87.x.x
-- Result: ✅ MATCH!
