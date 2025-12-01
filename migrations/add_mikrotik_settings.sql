-- =====================================================
-- MIKROTIK INTEGRATION SETTINGS
-- Add all Mikrotik configuration to admin_settings
-- SAFE: Uses ON CONFLICT to prevent duplicates
-- =====================================================

-- STEP 1: Ensure admin_settings table exists with proper schema
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  category TEXT DEFAULT 'general',
  is_secret BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 2: Create indices if they don't exist
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(key);
CREATE INDEX IF NOT EXISTS idx_admin_settings_category ON admin_settings(category);

-- STEP 3: Insert Mikrotik configuration settings
INSERT INTO admin_settings (key, value, description, category, is_secret)
VALUES 
  (
    'mikrotik_enabled',
    'false',
    'Enable Mikrotik router integration for real-time IP validation',
    'security',
    false
  ),
  (
    'mikrotik_host',
    '',
    'Mikrotik router IP address (e.g., 192.168.88.1)',
    'security',
    true
  ),
  (
    'mikrotik_port',
    '8728',
    'Mikrotik API port (default: 8728 for RouterOS API, 80/443 for REST API)',
    'security',
    false
  ),
  (
    'mikrotik_username',
    'admin',
    'Mikrotik admin username',
    'security',
    true
  ),
  (
    'mikrotik_password',
    '',
    'Mikrotik admin password (encrypted)',
    'security',
    true
  ),
  (
    'mikrotik_api_type',
    'rest',
    'API type: rest (RouterOS 7.1+) or routeros (older versions)',
    'security',
    false
  ),
  (
    'mikrotik_use_dhcp',
    'true',
    'Use DHCP leases for IP validation',
    'security',
    false
  ),
  (
    'mikrotik_use_arp',
    'false',
    'Use ARP table for IP validation (slower but catches static IPs)',
    'security',
    false
  ),
  (
    'mikrotik_cache_duration',
    '300',
    'Cache connected devices for N seconds (reduces API calls)',
    'security',
    false
  ),
  (
    'ip_validation_mode',
    'hybrid',
    'IP validation mode: mikrotik (only), whitelist (only), hybrid (try mikrotik first, fallback to whitelist)',
    'security',
    false
  ),
  (
    'location_strict_mode',
    'true',
    'Strict location validation - no bypass allowed',
    'security',
    false
  ),
  (
    'location_max_radius',
    '100',
    'Maximum allowed radius in meters for location validation',
    'attendance',
    false
  ),
  (
    'location_gps_accuracy_required',
    '50',
    'Required GPS accuracy in meters (reject if lower)',
    'attendance',
    false
  )
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_secret = EXCLUDED.is_secret,
  updated_at = now();

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
