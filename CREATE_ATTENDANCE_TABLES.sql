-- =============================================
-- ATTENDANCE SYSTEM SCHEMA
-- =============================================

-- 1. Tabel untuk menyimpan data absensi
CREATE TABLE IF NOT EXISTS attendance (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- User info
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL, -- 'siswa' atau 'guru'
  
  -- Waktu absensi
  check_in_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  check_out_time TIMESTAMP WITH TIME ZONE,
  
  -- Lokasi & keamanan
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_accuracy DECIMAL(10, 2), -- dalam meter
  
  -- Foto selfie (URL dari Supabase Storage)
  photo_selfie_url TEXT,
  
  -- Fingerprint hash (untuk verifikasi, bukan data biometrik asli)
  fingerprint_hash TEXT,
  
  -- WiFi & device info
  wifi_ssid TEXT,
  wifi_bssid TEXT, -- MAC address router
  device_info JSONB, -- user agent, device type, etc
  
  -- Status & notes
  status TEXT DEFAULT 'present', -- present, late, sick, permission, absent
  notes TEXT,
  
  -- Verifikasi
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES users(id),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabel untuk menyimpan data biometrik user (first-time setup)
CREATE TABLE IF NOT EXISTS user_biometric (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Reference selfie (pertama kali setup)
  reference_photo_url TEXT NOT NULL,
  
  -- Fingerprint template hash
  fingerprint_template TEXT NOT NULL,
  
  -- Metadata
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_user_biometric UNIQUE(user_id)
);

-- 3. Tabel untuk konfigurasi lokasi sekolah & WiFi yang diizinkan
CREATE TABLE IF NOT EXISTS school_location_config (
  id SERIAL PRIMARY KEY,
  
  -- Nama lokasi (misal: "Gedung A", "Lapangan", "Lab Komputer")
  location_name TEXT NOT NULL,
  
  -- Koordinat pusat lokasi
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  
  -- Radius dalam meter (tolerance)
  radius_meters DECIMAL(10, 2) NOT NULL DEFAULT 50,
  
  -- WiFi SSID yang diizinkan di lokasi ini
  allowed_wifi_ssids TEXT[], -- array of SSIDs
  
  -- Status aktif
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Index untuk performa
CREATE INDEX idx_attendance_user_id ON attendance(user_id);
CREATE INDEX idx_attendance_check_in ON attendance(check_in_time DESC);
CREATE INDEX idx_attendance_role ON attendance(user_role);
CREATE INDEX idx_attendance_status ON attendance(status);
CREATE INDEX idx_user_biometric_user_id ON user_biometric(user_id);

-- 5. RLS (Row Level Security) untuk keamanan
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_biometric ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_location_config ENABLE ROW LEVEL SECURITY;

-- Policy: User hanya bisa lihat absensi mereka sendiri
CREATE POLICY "Users can view own attendance"
  ON attendance FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Admin/OSIS bisa lihat semua
CREATE POLICY "Admins can view all attendance"
  ON attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('super_admin', 'admin', 'osis')
    )
  );

-- Policy: User bisa insert absensi sendiri
CREATE POLICY "Users can insert own attendance"
  ON attendance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admin bisa update/verify absensi
CREATE POLICY "Admins can update attendance"
  ON attendance FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('super_admin', 'admin', 'osis')
    )
  );

-- Policy: User biometric - user hanya bisa lihat & update milik sendiri
CREATE POLICY "Users can manage own biometric"
  ON user_biometric FOR ALL
  USING (auth.uid() = user_id);

-- Policy: School location - admin only
CREATE POLICY "Only admins can manage school locations"
  ON school_location_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('super_admin', 'admin')
    )
  );

-- 6. Function untuk auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger untuk attendance
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger untuk user_biometric
CREATE TRIGGER update_user_biometric_updated_at BEFORE UPDATE ON user_biometric
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Insert data konfigurasi lokasi sekolah (contoh)
INSERT INTO school_location_config (location_name, latitude, longitude, radius_meters, allowed_wifi_ssids)
VALUES 
  ('SMK Informatika - Gedung Utama', -6.200000, 106.816666, 50, ARRAY['SMK-INFORMATIKA', 'SMK-INFO-WIFI', 'SEKOLAH-WIFI']),
  ('SMK Informatika - Lapangan', -6.200100, 106.816766, 100, ARRAY['SMK-INFORMATIKA', 'SMK-INFO-WIFI'])
ON CONFLICT DO NOTHING;

-- 8. Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON attendance TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_biometric TO authenticated;
GRANT SELECT ON school_location_config TO authenticated;

-- =============================================
-- NOTES:
-- 1. Fingerprint hash: Gunakan library seperti FingerprintJS untuk generate hash
-- 2. Photo selfie: Upload ke Supabase Storage bucket 'attendance'
-- 3. WiFi check: Client-side check SSID, kirim ke server untuk validasi
-- 4. Location: Gunakan Geolocation API browser
-- 5. Face recognition: Bisa pakai library seperti face-api.js (opsional)
-- =============================================
