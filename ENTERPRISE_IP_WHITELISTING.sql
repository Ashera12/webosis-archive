-- ========================================
-- 🏢 ENTERPRISE IP WHITELISTING
-- ========================================
-- Standard: Google Workspace, Microsoft 365, Cisco Meraki
-- Method: Server-side IP validation (bukan WiFi SSID)
-- Architecture: Role-based access control
-- ========================================

-- ========================================
-- PRODUCTION CONFIGURATION
-- ========================================

-- Update dengan IP range sekolah yang BENAR
-- Cara cari IP range:
-- 1. Sambung ke WiFi sekolah
-- 2. Buka https://www.iplocation.net/
-- 3. Lihat IP kamu (contoh: 182.10.97.87)
-- 4. Lihat "IP Range" atau "CIDR notation"
-- 5. Masukkan ke SQL di bawah

UPDATE school_location_config
SET 
  -- IP Whitelist (Internal + Public ISP sekolah)
  allowed_ip_ranges = ARRAY[
    '192.168.0.0/16',    -- Range internal WiFi (192.168.0.0 - 192.168.255.255)
    '10.0.0.0/8',        -- Range internal alternatif (10.0.0.0 - 10.255.255.255)
    '182.10.0.0/16'      -- Public IP ISP sekolah (182.10.0.0 - 182.10.255.255)
  ],
  
  -- WiFi SSID (opsional, tidak wajib karena browser tidak bisa baca)
  allowed_wifi_ssids = ARRAY['Villa Lembang', 'WiFi Sekolah'],
  
  -- Strict mode = false (IP whitelisting sudah cukup)
  require_wifi = false,
  
  updated_at = NOW()
WHERE id = 6;

-- Verifikasi
SELECT 
  id,
  location_name,
  allowed_ip_ranges,
  allowed_wifi_ssids,
  require_wifi,
  is_active
FROM school_location_config
WHERE id = 6;

-- ========================================
-- EXPECTED OUTPUT:
-- ========================================
-- id: 6
-- location_name: Lembang
-- allowed_ip_ranges: ["192.168.0.0/16", "10.0.0.0/8", "182.10.0.0/16"]
-- allowed_wifi_ssids: ["Villa Lembang", "WiFi Sekolah"]
-- require_wifi: false
-- is_active: true
-- ========================================

-- ========================================
-- CARA KERJA (ENTERPRISE STANDARD):
-- ========================================
--
-- 1. SISWA (role = 'siswa'):
--    ✅ Hanya bisa absen jika IP dalam whitelist
--    ❌ Data seluler = DITOLAK (IP tidak cocok)
--    ✅ WiFi sekolah = DIIZINKAN (IP cocok)
--
-- 2. GURU (role = 'guru'):
--    ✅ Bypass IP validation
--    ✅ Bisa absen dari mana saja (rumah, kantor, dll)
--
-- 3. ADMIN (role = 'admin'):
--    ✅ Bypass IP validation
--    ✅ Full access dari mana saja
--
-- 4. DEVELOPER (role = 'developer'):
--    ✅ Bypass IP validation
--    ✅ Testing dari mana saja
--
-- ========================================

-- ========================================
-- SECURITY LAYERS (TETAP AKTIF):
-- ========================================
-- Layer 1: IP Whitelisting (server-side) ✅
-- Layer 2: GPS Validation (radius sekolah) ✅
-- Layer 3: Device Fingerprint ✅
-- Layer 4: Face Recognition (AI) ✅
-- Layer 5: AI Anomaly Detection ✅
-- ========================================

-- ========================================
-- TESTING CONFIGURATION (Development)
-- ========================================
-- Jika masih testing dan belum tahu IP range sekolah,
-- gunakan permissive mode sementara:

/*
UPDATE school_location_config
SET 
  allowed_ip_ranges = ARRAY['0.0.0.0/0'],  -- Allow ALL IPs
  require_wifi = false,
  updated_at = NOW()
WHERE id = 6;
*/

-- Setelah dapat IP range yang benar, ganti ke production config di atas

-- ========================================
-- ALTERNATIVE: STRICT INTERNAL ONLY
-- ========================================
-- Jika hanya ingin izinkan dari network internal
-- (tidak ada akses dari internet publik sama sekali):

/*
UPDATE school_location_config
SET 
  allowed_ip_ranges = ARRAY[
    '192.168.100.0/24',  -- Hanya subnet WiFi sekolah
    '10.10.0.0/16'       -- Hanya subnet LAN sekolah
  ],
  require_wifi = false,
  updated_at = NOW()
WHERE id = 6;
*/

-- Dengan config ini:
-- ✅ Siswa di WiFi sekolah (192.168.100.x) = ALLOWED
-- ❌ Siswa pakai data seluler = BLOCKED
-- ❌ Siswa di WiFi rumah = BLOCKED
-- ✅ Guru/Admin = ALWAYS ALLOWED (role bypass)

-- ========================================
-- CARA DEPLOYMENT:
-- ========================================
-- 1. Copy SQL production config di atas
-- 2. Paste di Supabase SQL Editor
-- 3. Update IP ranges sesuai sekolah kamu
-- 4. Run SQL
-- 5. Verifikasi output
-- 6. Tunggu 2 menit (cache clear)
-- 7. Test dengan siswa (harus pakai WiFi sekolah)
-- 8. Test dengan guru (bisa dari mana saja)
-- ========================================

-- ========================================
-- TROUBLESHOOTING:
-- ========================================
--
-- Q: Bagaimana cara tahu IP range WiFi sekolah?
-- A: Sambung ke WiFi → buka https://whatismyipaddress.com/
--    Lihat IP kamu, contoh: 182.10.97.87
--    Gunakan /16 untuk range lebar: 182.10.0.0/16
--    Atau /24 untuk range sempit: 182.10.97.0/24
--
-- Q: Siswa tetap tidak bisa absen meskipun pakai WiFi?
-- A: Cek IP mereka di console log. Pastikan IP dalam range.
--    Contoh: IP = 182.10.97.87, range = 182.10.0.0/16 → MATCH
--
-- Q: Guru tidak bisa absen dari rumah?
-- A: Pastikan role di database = 'guru', bukan 'siswa'
--    Guru auto-bypass IP validation.
--
-- Q: Apakah WiFi SSID perlu divalidasi?
-- A: TIDAK. Browser tidak bisa baca SSID (privacy).
--    IP whitelisting sudah cukup (standar internasional).
--
-- ========================================
