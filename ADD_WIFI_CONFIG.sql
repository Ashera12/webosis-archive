-- Add allowed_wifi_ssids column to school_location_config
-- This stores the list of WiFi SSIDs that are allowed for attendance

-- Step 1: Add column (TEXT ARRAY for PostgreSQL compatibility)
ALTER TABLE school_location_config 
ADD COLUMN IF NOT EXISTS allowed_wifi_ssids TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Step 2: Add require_wifi flag
ALTER TABLE school_location_config 
ADD COLUMN IF NOT EXISTS require_wifi BOOLEAN DEFAULT false;

-- Step 3: Update existing config with example WiFi SSIDs
-- CUSTOMIZE THIS with your actual school WiFi names
UPDATE school_location_config
SET allowed_wifi_ssids = ARRAY['SMK-INFORMATIKA', 'SEKOLAH-WIFI', 'SMK-NETWORK'],
    require_wifi = true
WHERE is_active = true;

-- Step 4: Add comment for documentation
COMMENT ON COLUMN school_location_config.allowed_wifi_ssids IS 
'TEXT ARRAY of allowed WiFi SSID names for attendance. Empty array = allow all WiFi. AI validates detected WiFi against this list.';

COMMENT ON COLUMN school_location_config.require_wifi IS 
'If true, attendance requires WiFi validation. If false, WiFi check is optional.';

-- Step 5: Verify
SELECT 
  id,
  school_name,
  allowed_wifi_ssids,
  require_wifi,
  is_active
FROM school_location_config
WHERE is_active = true;

-- Expected output:
-- allowed_wifi_ssids: {SMK-INFORMATIKA,SEKOLAH-WIFI,SMK-NETWORK}
-- require_wifi: true

-- NOTE: PostgreSQL TEXT[] displays as {item1,item2,item3} format
-- JavaScript will receive it as normal array: ["item1", "item2", "item3"]
