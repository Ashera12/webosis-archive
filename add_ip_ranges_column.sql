-- Update allowed_ip_ranges column in school_location_config table
-- This allows IP range validation when browser cannot detect WiFi SSID
-- Column already exists as TEXT[] type

-- Update existing records with default IP ranges (using TEXT[] format)
UPDATE school_location_config 
SET allowed_ip_ranges = ARRAY['192.168.', '10.0.', '172.16.']
WHERE allowed_ip_ranges IS NULL OR allowed_ip_ranges = '{}';

-- Add comment
COMMENT ON COLUMN school_location_config.allowed_ip_ranges IS 
'Allowed IP address prefixes for WiFi validation when SSID cannot be detected by browser. Default: private IP ranges (192.168.*, 10.0.*, 172.16.*)';

-- Verify
SELECT 
  id,
  location_name,
  allowed_wifi_ssids,
  allowed_ip_ranges,
  is_active
FROM school_location_config;
