-- Add allowed_ip_ranges column to school_location_config table
-- This allows IP range validation when browser cannot detect WiFi SSID

-- Check if column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'school_location_config' 
    AND column_name = 'allowed_ip_ranges'
  ) THEN
    ALTER TABLE school_location_config 
    ADD COLUMN allowed_ip_ranges JSONB DEFAULT '["192.168.", "10.0.", "172.16."]'::jsonb;
    
    RAISE NOTICE 'Column allowed_ip_ranges added to school_location_config';
  ELSE
    RAISE NOTICE 'Column allowed_ip_ranges already exists';
  END IF;
END $$;

-- Update existing records with default IP ranges
UPDATE school_location_config 
SET allowed_ip_ranges = '["192.168.", "10.0.", "172.16."]'::jsonb
WHERE allowed_ip_ranges IS NULL;

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
