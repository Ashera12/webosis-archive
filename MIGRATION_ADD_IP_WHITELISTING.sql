-- ================================================================
-- MIGRATION: Add Enterprise IP Whitelisting to school_location_config
-- Date: 2025-11-30
-- Purpose: Add IP whitelisting fields for strict network security
-- ================================================================

-- Add new columns for Enterprise IP Whitelisting
ALTER TABLE school_location_config 
ADD COLUMN IF NOT EXISTS allowed_ip_ranges TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS require_wifi BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS network_security_level TEXT DEFAULT 'high',
ADD COLUMN IF NOT EXISTS required_subnet TEXT,
ADD COLUMN IF NOT EXISTS enable_ip_validation BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS enable_webrtc_detection BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_private_ip_check BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_subnet_matching BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS allowed_connection_types TEXT[] DEFAULT '{wifi}',
ADD COLUMN IF NOT EXISTS min_network_quality TEXT DEFAULT 'fair',
ADD COLUMN IF NOT EXISTS enable_mac_address_validation BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS allowed_mac_addresses TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS block_vpn BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS block_proxy BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS enable_network_quality_check BOOLEAN DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN school_location_config.allowed_ip_ranges IS 
'🔐 CIDR IP ranges for internal school network. ALL users (siswa, guru, admin) must access from these ranges. Example: ["192.168.0.0/16", "182.10.0.0/16"]';

COMMENT ON COLUMN school_location_config.require_wifi IS 
'❌ DEPRECATED - Browser cannot detect WiFi SSID names. Use IP whitelisting instead. Default: false';

COMMENT ON COLUMN school_location_config.network_security_level IS 
'Security level: low (GPS only), medium (GPS + IP), high (GPS + IP + Face + Fingerprint). Default: high';

-- Create index for IP range queries (performance optimization)
CREATE INDEX IF NOT EXISTS idx_school_location_config_active 
ON school_location_config(is_active) WHERE is_active = true;

-- Verify migration
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'school_location_config'
  AND column_name IN (
    'allowed_ip_ranges', 
    'require_wifi', 
    'network_security_level',
    'block_vpn',
    'block_proxy'
  )
ORDER BY column_name;

-- ================================================================
-- IMPORTANT: After running this migration
-- ================================================================
-- 1. Update active school_location_config with IP ranges:
--    UPDATE school_location_config 
--    SET 
--      allowed_ip_ranges = ARRAY['192.168.0.0/16', '182.10.0.0/16'],
--      require_wifi = false,
--      network_security_level = 'high'
--    WHERE is_active = true;
--
-- 2. Configure IP ranges via Admin Panel:
--    - Login as Admin
--    - Go to Attendance Settings
--    - Add IP ranges in CIDR notation
--    - Set security level to HIGH
--    - Save configuration
-- ================================================================
