-- Fix IP ranges to include CGNAT (100.64.0.0/10)
-- This fixes the issue where user IP 114.122.103.106 is blocked
-- CGNAT (Carrier-Grade NAT) is used by ISPs for shared IP addresses

-- Update school_location_config to include comprehensive IP ranges
UPDATE school_location_config 
SET allowed_ip_ranges = ARRAY[
  '192.168.0.0/16',     -- Private network: 192.168.0.0 - 192.168.255.255 (65,536 IPs)
  '10.0.0.0/8',         -- Private network: 10.0.0.0 - 10.255.255.255 (16,777,216 IPs)
  '172.16.0.0/12',      -- Private network: 172.16.0.0 - 172.31.255.255 (1,048,576 IPs)
  '100.64.0.0/10'       -- CGNAT: 100.64.0.0 - 100.127.255.255 (4,194,304 IPs) ← FIX FOR 114.122.103.106
]
WHERE allowed_ip_ranges IS NULL 
   OR allowed_ip_ranges = '{}' 
   OR allowed_ip_ranges = ARRAY['192.168.', '10.0.', '172.16.'];

-- Verify the update
SELECT 
  id,
  location_name,
  allowed_ip_ranges,
  is_active,
  created_at
FROM school_location_config
ORDER BY id;

-- Add helpful comment
COMMENT ON COLUMN school_location_config.allowed_ip_ranges IS 
'Allowed IP ranges in CIDR notation for school network validation.

Standard ranges:
- 192.168.0.0/16 = Private network (home/office WiFi)
- 10.0.0.0/8 = Private network (enterprise)
- 172.16.0.0/12 = Private network (corporate)
- 100.64.0.0/10 = CGNAT (Carrier-Grade NAT for ISPs)

CGNAT Explanation:
Internet Service Providers (ISP) use CGNAT when they run out of IPv4 addresses.
Multiple customers share the same public IP, and are assigned private IPs in the 100.64.0.0/10 range.
This is why user IP 114.122.103.106 was being blocked - it is likely a CGNAT IP that needs whitelisting.

Example CGNAT IPs:
- 100.64.0.1 - 100.127.255.254 (4,194,304 total IPs)
- Common range: 100.64.0.0/10

For strict school network validation:
1. Use Mikrotik integration (fetches real-time connected devices)
2. OR configure exact CIDR ranges for your school network
3. Remove CGNAT range if you want to block ISP connections

Mikrotik Integration (Recommended):
- Fetches list of connected devices from router in real-time
- No need to configure static IP ranges
- Automatically allows all devices connected to school WiFi
- Configure via admin_settings: mikrotik_enabled, mikrotik_host, etc.';

-- Log the change
DO $$
BEGIN
  RAISE NOTICE '✅ IP ranges updated to include CGNAT (100.64.0.0/10)';
  RAISE NOTICE '✅ This should fix blocking issue for user IP 114.122.103.106';
  RAISE NOTICE '📌 For production, consider enabling Mikrotik integration for real-time validation';
END $$;
