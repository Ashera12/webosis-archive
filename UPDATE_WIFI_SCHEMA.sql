-- ================================================
-- UPDATE ATTENDANCE CONFIG - WiFi with MAC Address
-- ================================================
-- Run this AFTER CREATE_ATTENDANCE_TABLES.sql
-- This adds support for WiFi MAC address tracking

-- 1. Create WiFi Config table (more flexible than array)
CREATE TABLE IF NOT EXISTS allowed_wifi_networks (
  id BIGSERIAL PRIMARY KEY,
  config_id BIGINT REFERENCES school_location_config(id) ON DELETE CASCADE,
  
  -- WiFi Details
  ssid TEXT NOT NULL,
  bssid TEXT, -- MAC address (optional, for exact AP matching)
  
  -- Additional details for better validation
  security_type TEXT, -- WPA2, WPA3, Open, etc
  frequency TEXT, -- 2.4GHz, 5GHz
  
  -- Metadata
  notes TEXT, -- e.g., "Ruang Guru Lt 2", "Kantin"
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique per config
  UNIQUE(config_id, ssid, bssid)
);

-- 2. Create index for performance
CREATE INDEX idx_wifi_config_id ON allowed_wifi_networks(config_id);
CREATE INDEX idx_wifi_active ON allowed_wifi_networks(is_active);

-- 3. Enable RLS
ALTER TABLE allowed_wifi_networks ENABLE ROW LEVEL SECURITY;

-- 4. Policies
CREATE POLICY "Admins can view wifi networks"
  ON allowed_wifi_networks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' IN ('super_admin', 'admin', 'osis')
    )
  );

CREATE POLICY "Admins can manage wifi networks"
  ON allowed_wifi_networks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' IN ('super_admin', 'admin', 'osis')
    )
  );

-- 5. Trigger for updated_at
CREATE TRIGGER update_wifi_networks_updated_at
  BEFORE UPDATE ON allowed_wifi_networks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Migration: Convert existing allowed_wifi_ssids to new table
-- Note: Run this ONLY if you have existing data
-- This will migrate from TEXT[] to separate table
DO $$
DECLARE
  config_record RECORD;
  ssid_value TEXT;
BEGIN
  FOR config_record IN SELECT id, allowed_wifi_ssids FROM school_location_config WHERE allowed_wifi_ssids IS NOT NULL LOOP
    IF array_length(config_record.allowed_wifi_ssids, 1) > 0 THEN
      FOREACH ssid_value IN ARRAY config_record.allowed_wifi_ssids LOOP
        INSERT INTO allowed_wifi_networks (config_id, ssid, is_active)
        VALUES (config_record.id, ssid_value, true)
        ON CONFLICT (config_id, ssid, bssid) DO NOTHING;
      END LOOP;
    END IF;
  END LOOP;
END $$;

-- 7. Optional: Add column to track if using legacy array or new table
-- ALTER TABLE school_location_config ADD COLUMN use_wifi_table BOOLEAN DEFAULT true;

COMMENT ON TABLE allowed_wifi_networks IS 'WiFi networks allowed for attendance check-in, with MAC address support';
COMMENT ON COLUMN allowed_wifi_networks.ssid IS 'WiFi network name (SSID)';
COMMENT ON COLUMN allowed_wifi_networks.bssid IS 'MAC address of WiFi access point (optional, for exact matching)';
COMMENT ON COLUMN allowed_wifi_networks.security_type IS 'Security protocol: WPA2, WPA3, Open, etc';
COMMENT ON COLUMN allowed_wifi_networks.frequency IS 'WiFi frequency band: 2.4GHz or 5GHz';
