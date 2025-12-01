-- =====================================================
-- MIKROTIK INTEGRATION SETTINGS
-- SIMPLE VERSION - Just insert into existing table
-- SAFE: Uses ON CONFLICT to prevent duplicates
-- =====================================================

-- Insert Mikrotik configuration settings
-- Assumes admin_settings table already exists
INSERT INTO admin_settings (key, value)
VALUES 
  ('mikrotik_enabled', 'false'),
  ('mikrotik_host', ''),
  ('mikrotik_port', '8728'),
  ('mikrotik_username', 'admin'),
  ('mikrotik_password', ''),
  ('mikrotik_api_type', 'rest'),
  ('mikrotik_use_dhcp', 'true'),
  ('mikrotik_use_arp', 'false'),
  ('mikrotik_cache_duration', '300'),
  ('ip_validation_mode', 'hybrid'),
  ('location_strict_mode', 'true'),
  ('location_max_radius', '100'),
  ('location_gps_accuracy_required', '50')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ 13 Mikrotik settings inserted successfully!';
  RAISE NOTICE 'Settings: mikrotik_enabled, mikrotik_host, mikrotik_port, etc.';
END $$;

-- Update school_location_config to add allowed_ip_ranges if empty
-- This is a sample configuration - should be customized per school

-- Example: Add default IP ranges for typical school networks
-- IMPORTANT: Replace these with actual school network ranges

COMMENT ON COLUMN school_location_config.allowed_ip_ranges IS 
'Array of allowed IP ranges in CIDR notation or simple prefix format.
Examples:
- CIDR: ["192.168.1.0/24", "10.0.0.0/16"] 
- Prefix: ["192.168.", "10.0."]
- Mixed: ["192.168.100.0/24", "172.16.", "100.64.0.0/10"]

Common ranges:
- 192.168.0.0/16 = 192.168.0.0 - 192.168.255.255 (65,536 IPs)
- 10.0.0.0/8 = 10.0.0.0 - 10.255.255.255 (16,777,216 IPs)
- 172.16.0.0/12 = 172.16.0.0 - 172.31.255.255 (1,048,576 IPs)
- 100.64.0.0/10 = 100.64.0.0 - 100.127.255.255 (4,194,304 IPs - CGNAT)';

-- Sample update (commented out - uncomment and customize per school)
-- UPDATE school_location_config
-- SET allowed_ip_ranges = ARRAY[
--   '192.168.0.0/16',    -- Local network
--   '10.0.0.0/8',        -- Private network
--   '172.16.0.0/12',     -- Private network
--   '100.64.0.0/10'      -- CGNAT (Carrier-grade NAT)
-- ]
-- WHERE school_name = 'SMK Webosis';

-- Add helpful query to check current IP ranges
DO $$
BEGIN
  RAISE NOTICE '=== Current School Location Configurations ===';
END $$;

SELECT 
  id,
  location_name,
  allowed_ip_ranges,
  latitude,
  longitude,
  radius_meters,
  is_active,
  created_at
FROM school_location_config
ORDER BY created_at DESC;

-- Add helpful comment
COMMENT ON TABLE school_location_config IS 
'School location and network configuration for attendance validation.

IMPORTANT SETUP STEPS:
1. Configure allowed_ip_ranges with actual school network ranges
2. Test IP validation with: SELECT * FROM school_location_config WHERE id = 1;
3. Enable Mikrotik integration in admin_settings if using Mikrotik router
4. Set location_strict_mode to true in admin_settings for production
5. Configure location_max_radius to appropriate value (default: 100 meters)

Mikrotik Integration:
- Automatically fetches connected device IPs from router
- Eliminates need for static IP ranges
- Real-time validation of school network connections
- Configure mikrotik_* settings in admin_settings table';
