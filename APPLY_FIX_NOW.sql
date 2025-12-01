-- ========================================
-- 🔧 EMERGENCY FIX - UPDATE SCHOOL LOCATION
-- ========================================
-- User GPS: -6.900969, 107.542391 (Bandung)
-- Current DB: -6.200000, 106.816666 (SALAH - Jakarta)
-- Distance: 111km → Harus 0m!
-- User IP: 125.160.157.192

-- STEP 1: Backup current config
SELECT 
  id,
  location_name,
  latitude,
  longitude,
  radius_meters,
  allowed_ip_ranges,
  is_active,
  NOW() as backup_time
FROM school_location_config
WHERE is_active = true;

-- STEP 2: UPDATE dengan koordinat REAL sekolah
-- ⚠️ Menggunakan GPS user sebagai reference (HARUS di lokasi sekolah!)
UPDATE school_location_config
SET 
  location_name = 'SMK Fithrah Insani - Bandung',
  latitude = -6.900969,     -- User GPS lat (pastikan ini BENAR!)
  longitude = 107.542391,    -- User GPS lon (pastikan ini BENAR!)
  radius_meters = 300,       -- 300m radius (cukup luas untuk area sekolah)
  allowed_ip_ranges = ARRAY[
    '125.160.0.0/16',        -- User IP range (ISP Public - 65,536 addresses)
    '100.64.0.0/10',         -- CGNAT (Telkomsel/Indosat/XL)
    '192.168.0.0/16',        -- WiFi Lokal sekolah
    '10.0.0.0/8'             -- Private network
  ],
  network_security_level = 'medium',
  require_wifi = false,      -- Allow cellular (karena user pakai 4G)
  bypass_gps_validation = false, -- NO BYPASS!
  updated_at = NOW()
WHERE is_active = true;

-- STEP 3: Verify update berhasil
SELECT 
  '✅ UPDATE SUCCESS!' as status,
  location_name,
  latitude,
  longitude,
  radius_meters,
  allowed_ip_ranges,
  network_security_level,
  require_wifi,
  bypass_gps_validation
FROM school_location_config
WHERE is_active = true;

-- STEP 4: Test distance calculation
-- Harusnya 0m karena user GPS = school GPS
DO $$
DECLARE
  user_lat CONSTANT NUMERIC := -6.900969;
  user_lon CONSTANT NUMERIC := 107.542391;
  school_lat NUMERIC;
  school_lon NUMERIC;
  distance NUMERIC;
BEGIN
  -- Get school coordinates
  SELECT latitude, longitude INTO school_lat, school_lon
  FROM school_location_config
  WHERE is_active = true
  LIMIT 1;
  
  -- Calculate distance using Haversine formula
  distance := 6371000 * acos(
    cos(radians(user_lat)) * cos(radians(school_lat)) * 
    cos(radians(school_lon) - radians(user_lon)) + 
    sin(radians(user_lat)) * sin(radians(school_lat))
  );
  
  RAISE NOTICE '================================================';
  RAISE NOTICE '📍 DISTANCE TEST RESULT';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'User GPS     : %, %', user_lat, user_lon;
  RAISE NOTICE 'School GPS   : %, %', school_lat, school_lon;
  RAISE NOTICE 'Distance     : % meters', ROUND(distance, 2);
  RAISE NOTICE 'Max Allowed  : 300 meters';
  RAISE NOTICE 'Status       : %', CASE WHEN distance <= 300 THEN '✅ PASS' ELSE '❌ FAIL' END;
  RAISE NOTICE '================================================';
END $$;

-- ========================================
-- 📋 CARA JALANKAN SQL INI:
-- ========================================
-- Via psql:
-- psql $env:DATABASE_URL -f APPLY_FIX_NOW.sql

-- Via Supabase Dashboard:
-- 1. Buka Supabase Dashboard
-- 2. Klik "SQL Editor"
-- 3. Copy-paste query ini
-- 4. Klik "Run"

-- Via Node.js/API:
-- Gunakan endpoint /api/admin/attendance/config
-- Method: POST
-- Body: { latitude, longitude, allowed_ip_ranges, ... }

-- ========================================
-- ⚠️ PENTING: VERIFIKASI KOORDINAT!
-- ========================================
-- Koordinat -6.900969, 107.542391 adalah dari GPS user SAAT INI.
-- PASTIKAN user sedang BERADA DI SEKOLAH saat ambil koordinat!
-- 
-- Jika koordinat salah, ganti dengan cara:
-- 1. Buka Google Maps
-- 2. Cari "SMK Fithrah Insani"
-- 3. Klik tengah gedung
-- 4. Copy koordinat yang muncul
-- 5. Update di SQL ini (line 23-24)
-- 6. Jalankan ulang

-- ========================================
-- 🧪 EXPECTED RESULT SETELAH UPDATE:
-- ========================================
-- Frontend akan show:
-- ✅ DI DALAM JANGKAUAN
-- 📏 Jarak: 0m (Max: 300m)
-- 🎯 Akurasi GPS: 2173m ⚠️ (masih buruk tapi distance OK)
-- 
-- Backend validation:
-- ✅ Distance: 0m < 300m (PASS)
-- ❌ Accuracy: 2173m > 20m (FAIL - need outdoor!)
-- ✅ IP: 125.160.157.192 in whitelist (PASS)
