-- ============================================
-- ADMIN SETTINGS: Security Validation Control
-- ============================================
-- KEAMANAN PENTING: 
-- 1. Default = STRICT (lokasi & WiFi WAJIB)
-- 2. Admin bisa bypass HANYA untuk testing/development
-- 3. Siswa TIDAK BISA manipulasi (validasi server-side)
-- ============================================

-- ===== OPTION A: PRODUCTION MODE (RECOMMENDED) =====
-- Validasi lokasi & WiFi AKTIF (siswa HARUS di sekolah)
-- Gunakan ini untuk deployment production!

INSERT INTO admin_settings (key, value, is_secret, updated_at)
VALUES 
  ('location_required', 'true', false, NOW()),
  ('wifi_required', 'true', false, NOW())
ON CONFLICT (key) DO UPDATE 
SET 
  value = EXCLUDED.value,
  updated_at = NOW();

-- ===== OPTION B: TESTING MODE (TEMPORARY ONLY) =====
-- Bypass validasi untuk testing tanpa GPS/WiFi
-- JANGAN gunakan di production!

-- INSERT INTO admin_settings (key, value, is_secret, updated_at)
-- VALUES 
--   ('location_required', 'false', false, NOW()),
--   ('wifi_required', 'false', false, NOW())
-- ON CONFLICT (key) DO UPDATE 
-- SET 
--   value = EXCLUDED.value,
--   updated_at = NOW();

-- ===== VERIFY SETTINGS =====
SELECT 
  key,
  value,
  CASE value
    WHEN 'true' THEN '✅ STRICT - Validation ACTIVE (Secure)'
    WHEN 'false' THEN '⚠️ BYPASS - Validation DISABLED (Testing Only)'
    ELSE '❓ Unknown'
  END as status,
  updated_at
FROM admin_settings
WHERE key IN ('location_required', 'wifi_required')
ORDER BY key;

-- ============================================
-- CARA SWITCH ANTARA MODE:
-- ============================================
-- 
-- 🔒 PRODUCTION MODE (Siswa harus di sekolah):
-- UPDATE admin_settings SET value = 'true' WHERE key IN ('location_required', 'wifi_required');
--
-- 🧪 TESTING MODE (Bypass untuk demo):
-- UPDATE admin_settings SET value = 'false' WHERE key IN ('location_required', 'wifi_required');
--
-- ============================================

-- ============================================
-- KEAMANAN MULTI-LAYER:
-- ============================================
-- Layer 1: Admin settings (server-side only)
--   - Siswa tidak bisa akses/ubah tabel ini
--   - RLS policy block semua akses non-admin
--
-- Layer 2: Server-side validation
--   - API route cek settings dari database
--   - Tidak ada bypass dari client-side
--
-- Layer 3: Biometric + Face verification
--   - AI face analysis (liveness detection)
--   - Fingerprint matching
--   - WebAuthn (Windows Hello/Touch ID)
--
-- Layer 4: Audit trail
--   - Semua bypass logged ke security_events
--   - Admin bisa monitor siapa yang bypass
--
-- ============================================
