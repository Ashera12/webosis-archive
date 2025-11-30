-- ========================================
-- 🔧 FIX WIFI DETECTION - SOLUSI REAL
-- ========================================
-- Masalah: Browser tidak bisa deteksi nama WiFi
-- Masalah: IP internal (192.168.x.x) tidak terbaca
-- Solusi: Izinkan IP public ISP sekolah
-- ========================================

-- OPSI 1: Izinkan IP Public ISP Sekolah (RECOMMENDED)
-- IP yang terdeteksi: 182.10.97.87
-- Ini adalah IP public dari ISP yang dipakai WiFi sekolah

UPDATE school_location_config
SET 
  allowed_ip_ranges = ARRAY[
    '192.168.100.0/24',  -- IP internal WiFi (jika terdeteksi)
    '182.10.0.0/16'      -- IP public ISP (182.10.x.x semua)
  ],
  require_wifi = false,  -- Allow IP validation sebagai fallback
  updated_at = NOW()
WHERE id = 6;

-- Verifikasi
SELECT 
  id,
  location_name,
  allowed_ip_ranges,
  require_wifi,
  is_active
FROM school_location_config
WHERE id = 6;

-- ========================================
-- EXPECTED OUTPUT:
-- ========================================
-- id: 6
-- location_name: Lembang
-- allowed_ip_ranges: ["192.168.100.0/24", "182.10.0.0/16"]
-- require_wifi: false
-- is_active: true
-- ========================================

-- ========================================
-- CARA KERJA:
-- ========================================
-- 1. User connect ke WiFi "Villa Lembang"
-- 2. WiFi router kasih IP internal: 192.168.100.x
-- 3. Router NAT ke internet pakai IP public: 182.10.97.87
-- 4. Browser block baca IP internal (WebRTC blocked)
-- 5. Server detect IP public: 182.10.97.87
-- 6. Sistem validasi: 182.10.97.87 in 182.10.0.0/16? ✅ YES
-- 7. Access granted!
-- ========================================

-- ========================================
-- ALTERNATIVE: OPSI 2 - Permissive Mode
-- ========================================
-- Jika IP ISP sering berubah, pakai ini:
/*
UPDATE school_location_config
SET 
  allowed_ip_ranges = ARRAY['0.0.0.0/0'],
  require_wifi = false,
  updated_at = NOW()
WHERE id = 6;
*/

-- ========================================
-- SETELAH JALANKAN SQL:
-- ========================================
-- 1. Tunggu 2 menit untuk Vercel deployment
-- 2. Hard refresh browser (Ctrl+Shift+R)
-- 3. Pastikan masih connect ke WiFi sekolah
-- 4. Test attendance lagi
-- 5. Should work! ✅
-- ========================================

-- ========================================
-- SECURITY YANG TETAP AKTIF:
-- ========================================
-- ✅ GPS validation (radius sekolah)
-- ✅ Device fingerprint
-- ✅ Face recognition
-- ✅ AI anomaly detection
-- ✅ IP range validation (182.10.0.0/16)
-- ========================================
