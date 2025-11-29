-- ================================================================
-- ENHANCEMENT: Network Monitoring & IP Validation
-- ================================================================
-- Menambahkan field-field untuk network monitoring yang lebih lengkap
-- Termasuk: IP range validation, subnet matching, WebRTC detection, dll
-- ================================================================

-- 1. Add new columns to school_location_config for network monitoring
ALTER TABLE school_location_config 
ADD COLUMN IF NOT EXISTS allowed_ip_ranges TEXT[], -- ["192.168.1.0/24", "10.0.0.0/24"]
ADD COLUMN IF NOT EXISTS required_subnet TEXT,      -- "192.168.1" or "10.0.0"
ADD COLUMN IF NOT EXISTS enable_ip_validation BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS enable_webrtc_detection BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_private_ip_check BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_subnet_matching BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS network_security_level TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'strict'
ADD COLUMN IF NOT EXISTS allowed_connection_types TEXT[] DEFAULT '{"wifi"}', -- ["wifi", "ethernet", "cellular"]
ADD COLUMN IF NOT EXISTS min_network_quality TEXT DEFAULT 'fair', -- 'excellent', 'good', 'fair', 'poor'
ADD COLUMN IF NOT EXISTS enable_mac_address_validation BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS allowed_mac_addresses TEXT[], -- MAC address whitelist
ADD COLUMN IF NOT EXISTS block_vpn BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS block_proxy BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS enable_network_quality_check BOOLEAN DEFAULT true;

-- 2. Add comments for documentation
COMMENT ON COLUMN school_location_config.allowed_ip_ranges IS 'IP ranges yang diizinkan dalam format CIDR (e.g., 192.168.1.0/24)';
COMMENT ON COLUMN school_location_config.required_subnet IS 'Subnet yang required (e.g., 192.168.1 untuk 192.168.1.x)';
COMMENT ON COLUMN school_location_config.enable_ip_validation IS 'Aktifkan validasi IP address';
COMMENT ON COLUMN school_location_config.enable_webrtc_detection IS 'Aktifkan auto-detect IP via WebRTC';
COMMENT ON COLUMN school_location_config.enable_private_ip_check IS 'Validasi IP harus private (192.168.x.x, 10.x.x.x, 172.16-31.x.x)';
COMMENT ON COLUMN school_location_config.enable_subnet_matching IS 'Validasi IP harus dalam subnet tertentu';
COMMENT ON COLUMN school_location_config.network_security_level IS 'Level keamanan: low (WiFi only), medium (+IP check), high (+subnet), strict (+MAC)';
COMMENT ON COLUMN school_location_config.allowed_connection_types IS 'Tipe koneksi yang diizinkan: wifi, ethernet, cellular';
COMMENT ON COLUMN school_location_config.min_network_quality IS 'Kualitas jaringan minimum yang diperlukan';
COMMENT ON COLUMN school_location_config.enable_mac_address_validation IS 'Aktifkan validasi MAC address WiFi';
COMMENT ON COLUMN school_location_config.allowed_mac_addresses IS 'Daftar MAC address WiFi yang diizinkan (BSSID)';
COMMENT ON COLUMN school_location_config.block_vpn IS 'Block koneksi dari VPN';
COMMENT ON COLUMN school_location_config.block_proxy IS 'Block koneksi dari Proxy';
COMMENT ON COLUMN school_location_config.enable_network_quality_check IS 'Check kualitas jaringan (ping, bandwidth)';

-- 3. Create function to validate IP in range (CIDR)
CREATE OR REPLACE FUNCTION is_ip_in_cidr_range(ip_address TEXT, cidr_range TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  ip_parts INT[];
  network_parts INT[];
  mask_bits INT;
  ip_binary BIT(32);
  network_binary BIT(32);
  mask_binary BIT(32);
BEGIN
  -- Parse IP address (e.g., "192.168.1.50" -> [192, 168, 1, 50])
  ip_parts := string_to_array(split_part(ip_address, '/', 1), '.')::INT[];
  
  -- Parse CIDR (e.g., "192.168.1.0/24" -> network: [192, 168, 1, 0], mask: 24)
  network_parts := string_to_array(split_part(cidr_range, '/', 1), '.')::INT[];
  mask_bits := split_part(cidr_range, '/', 2)::INT;
  
  -- Convert IP to binary (32 bits)
  ip_binary := (ip_parts[1]::BIT(8) || ip_parts[2]::BIT(8) || ip_parts[3]::BIT(8) || ip_parts[4]::BIT(8))::BIT(32);
  
  -- Convert network to binary
  network_binary := (network_parts[1]::BIT(8) || network_parts[2]::BIT(8) || network_parts[3]::BIT(8) || network_parts[4]::BIT(8))::BIT(32);
  
  -- Create mask (e.g., /24 = 11111111.11111111.11111111.00000000)
  mask_binary := (REPEAT('1', mask_bits) || REPEAT('0', 32 - mask_bits))::BIT(32);
  
  -- Check if (IP & mask) == (network & mask)
  RETURN (ip_binary & mask_binary) = (network_binary & mask_binary);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. Create function to check if IP is private
CREATE OR REPLACE FUNCTION is_private_ip(ip_address TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  ip_parts INT[];
BEGIN
  ip_parts := string_to_array(ip_address, '.')::INT[];
  
  -- 10.0.0.0/8
  IF ip_parts[1] = 10 THEN
    RETURN TRUE;
  END IF;
  
  -- 172.16.0.0/12 (172.16.x.x - 172.31.x.x)
  IF ip_parts[1] = 172 AND ip_parts[2] >= 16 AND ip_parts[2] <= 31 THEN
    RETURN TRUE;
  END IF;
  
  -- 192.168.0.0/16
  IF ip_parts[1] = 192 AND ip_parts[2] = 168 THEN
    RETURN TRUE;
  END IF;
  
  -- 127.0.0.0/8 (localhost)
  IF ip_parts[1] = 127 THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5. Create function to check if IP matches subnet
CREATE OR REPLACE FUNCTION matches_subnet(ip_address TEXT, subnet_prefix TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Simple prefix matching (e.g., "192.168.1.50" matches "192.168.1")
  RETURN ip_address LIKE (subnet_prefix || '.%');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 6. Add example data with network monitoring enabled
INSERT INTO school_location_config (
  location_name,
  latitude,
  longitude,
  radius_meters,
  allowed_wifi_ssids,
  allowed_ip_ranges,
  required_subnet,
  enable_ip_validation,
  enable_webrtc_detection,
  enable_private_ip_check,
  enable_subnet_matching,
  network_security_level,
  allowed_connection_types,
  min_network_quality,
  enable_mac_address_validation,
  block_vpn,
  block_proxy,
  enable_network_quality_check,
  is_active
) VALUES (
  'SMK Fithrah Insani - Full Network Monitoring',
  -6.2088,
  106.8456,
  150,
  ARRAY['SMKFI-2024', 'SMKFI-5G', 'School-WiFi'],
  ARRAY['192.168.1.0/24', '10.0.0.0/24'], -- IP ranges yang diizinkan
  '192.168.1', -- Required subnet
  true, -- Enable IP validation
  true, -- Enable WebRTC detection
  true, -- Enable private IP check
  true, -- Enable subnet matching
  'high', -- Network security level: high
  ARRAY['wifi'], -- Only WiFi allowed (no cellular)
  'good', -- Minimum network quality: good
  false, -- MAC address validation (optional)
  true, -- Block VPN
  true, -- Block Proxy
  true, -- Enable network quality check
  false -- Not active yet (example data)
) ON CONFLICT DO NOTHING;

-- 7. Create index for performance
CREATE INDEX IF NOT EXISTS idx_school_config_network_security ON school_location_config(network_security_level);
CREATE INDEX IF NOT EXISTS idx_school_config_ip_validation ON school_location_config(enable_ip_validation);

-- 8. Verification query
SELECT 
  location_name,
  enable_ip_validation,
  enable_webrtc_detection,
  enable_private_ip_check,
  enable_subnet_matching,
  network_security_level,
  allowed_ip_ranges,
  required_subnet,
  allowed_connection_types,
  min_network_quality,
  block_vpn,
  block_proxy
FROM school_location_config
ORDER BY created_at DESC
LIMIT 5;

-- ================================================================
-- TESTING EXAMPLES
-- ================================================================

-- Test IP validation functions
SELECT 
  '192.168.1.50' as ip,
  is_ip_in_cidr_range('192.168.1.50', '192.168.1.0/24') as in_range_24,
  is_ip_in_cidr_range('192.168.1.50', '192.168.0.0/16') as in_range_16,
  is_private_ip('192.168.1.50') as is_private,
  matches_subnet('192.168.1.50', '192.168.1') as matches_subnet_1,
  matches_subnet('192.168.1.50', '192.168.2') as matches_subnet_2;

-- Expected results:
-- in_range_24: TRUE
-- in_range_16: TRUE
-- is_private: TRUE
-- matches_subnet_1: TRUE
-- matches_subnet_2: FALSE

-- ================================================================
-- CLEANUP (if needed)
-- ================================================================

-- To rollback changes (CAREFUL!):
-- ALTER TABLE school_location_config 
-- DROP COLUMN IF EXISTS allowed_ip_ranges,
-- DROP COLUMN IF EXISTS required_subnet,
-- DROP COLUMN IF EXISTS enable_ip_validation,
-- DROP COLUMN IF EXISTS enable_webrtc_detection,
-- DROP COLUMN IF EXISTS enable_private_ip_check,
-- DROP COLUMN IF EXISTS enable_subnet_matching,
-- DROP COLUMN IF EXISTS network_security_level,
-- DROP COLUMN IF EXISTS allowed_connection_types,
-- DROP COLUMN IF EXISTS min_network_quality,
-- DROP COLUMN IF EXISTS enable_mac_address_validation,
-- DROP COLUMN IF EXISTS allowed_mac_addresses,
-- DROP COLUMN IF EXISTS block_vpn,
-- DROP COLUMN IF EXISTS block_proxy,
-- DROP COLUMN IF EXISTS enable_network_quality_check;

-- DROP FUNCTION IF EXISTS is_ip_in_cidr_range(TEXT, TEXT);
-- DROP FUNCTION IF EXISTS is_private_ip(TEXT);
-- DROP FUNCTION IF EXISTS matches_subnet(TEXT, TEXT);
