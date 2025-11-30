-- ========================================
-- 🔓 FINAL SQL FIX - PERMISSIVE MODE
-- ========================================
-- Jalankan di Supabase SQL Editor
-- Waktu: < 1 detik
-- ========================================

-- Update sekolah Lembang untuk mengizinkan SEMUA IP
UPDATE school_location_config
SET 
  allowed_ip_ranges = ARRAY['0.0.0.0/0'],
  require_wifi = false,
  updated_at = NOW()
WHERE id = 6;

-- Verifikasi hasil
SELECT 
  id,
  location_name,
  allowed_ip_ranges,
  require_wifi,
  is_active,
  updated_at
FROM school_location_config
WHERE id = 6;

-- ========================================
-- EXPECTED OUTPUT:
-- ========================================
-- id: 6
-- location_name: Lembang
-- allowed_ip_ranges: ["0.0.0.0/0"]  ← HARUS INI!
-- require_wifi: false
-- is_active: true
-- updated_at: (current timestamp)
-- ========================================

-- ✅ Setelah ini, tunggu 2 menit untuk Vercel deployment
-- ✅ Lalu hard refresh browser (Ctrl+Shift+R)
-- ✅ Logout dan Login ulang
-- ✅ WiFi akan terdeteksi dengan IP apapun!
