-- ========================================
-- 🔧 FIX SCHOOL LOCATION CONFIGURATION
-- ========================================
-- Run this if admin panel tidak bisa update koordinat
-- User IP: 125.160.157.192 (ISP Public - CGNAT)
-- User GPS: -6.900969, 107.542391 (Bandung area)
-- Accuracy: 2173m (poor - need outdoor GPS lock)

-- STEP 1: Check current config
SELECT 
  id,
  location_name,
  latitude,
  longitude,
  radius_meters,
  allowed_ip_ranges,
  is_active,
  created_at
FROM school_location_config
WHERE is_active = true;

-- STEP 2: Update dengan LOKASI ASLI SEKOLAH
-- ⚠️ GANTI koordinat ini dengan GPS sekolah yang BENAR!
-- Cara: Buka Google Maps → Klik lokasi sekolah → Copy koordinat

UPDATE school_location_config
SET 
  location_name = 'SMK Fithrah Insani',
  latitude = -6.900969,  -- ⚠️ GANTI dengan koordinat sekolah ASLI
  longitude = 107.542391, -- ⚠️ GANTI dengan koordinat sekolah ASLI
  radius_meters = 200,    -- 200m radius (cukup untuk area sekolah)
  allowed_ip_ranges = ARRAY[
    '125.160.0.0/16',     -- ISP Public IP range (65,536 addresses)
    '100.64.0.0/10',      -- CGNAT range (Telkomsel/Indosat/XL)
    '192.168.0.0/16',     -- Local WiFi (jika ada)
    '10.0.0.0/8'          -- Private network
  ],
  network_security_level = 'medium',
  require_wifi = false,   -- Allow cellular data
  updated_at = NOW()
WHERE is_active = true;

-- STEP 3: Verify update
SELECT 
  location_name,
  latitude,
  longitude,
  radius_meters,
  allowed_ip_ranges,
  network_security_level,
  require_wifi
FROM school_location_config
WHERE is_active = true;

-- ========================================
-- 📋 CARA DAPAT KOORDINAT SEKOLAH YANG BENAR:
-- ========================================
-- 1. Buka Google Maps: https://maps.google.com
-- 2. Cari lokasi sekolah: "SMK Fithrah Insani"
-- 3. Klik TEPAT di tengah gedung sekolah
-- 4. Koordinat muncul di bottom: -6.xxxxx, 107.xxxxx
-- 5. Copy koordinat tersebut
-- 6. Update di admin panel ATAU di SQL ini

-- ========================================
-- 🧪 TESTING KOORDINAT:
-- ========================================
-- Contoh: User GPS = -6.900969, 107.542391
-- Jika sekolah GPS = -6.900969, 107.542391 (sama)
-- Maka distance = 0m ✅
-- Jika accuracy = 2173m → DITOLAK (max 20m)

-- ========================================
-- 🔐 IP WHITELISTING:
-- ========================================
-- User IP: 125.160.157.192
-- CIDR: 125.160.0.0/16 (65,536 IP untuk satu range ISP)
-- Sudah ada di array allowed_ip_ranges

-- ========================================
-- ⚠️ TROUBLESHOOTING GPS ACCURACY:
-- ========================================
-- Accuracy 2173m = SANGAT BURUK
-- Solusi:
-- 1. Keluar ke area terbuka (outdoor)
-- 2. Tunggu 30-60 detik untuk GPS lock
-- 3. Pastikan GPS/Location aktif di device
-- 4. Jangan gunakan VPN/GPS spoof
-- 5. Refresh halaman absensi
-- Target: < 20m accuracy ✅
