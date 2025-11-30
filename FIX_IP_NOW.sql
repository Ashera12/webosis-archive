-- ================================================================
-- QUICK FIX: Update IP Ranges untuk User 182.10.97.87
-- ================================================================
-- Run ini di Supabase SQL Editor untuk fix IP blocking

-- 1. Update active config dengan IP range yang BENAR
UPDATE school_location_config 
SET 
  allowed_ip_ranges = ARRAY[
    '192.168.0.0/16',      -- WiFi lokal sekolah (private network)
    '10.0.0.0/8',          -- Private network
    '182.10.0.0/16',       -- ✅ IP Public ISP (termasuk 182.10.97.87)
    '100.64.0.0/10'        -- CGNAT untuk data seluler
  ],
  require_wifi = false,    -- TIDAK wajib WiFi SSID
  network_security_level = 'high',
  updated_at = NOW()
WHERE is_active = true;

-- 2. Verify configuration
SELECT 
  id,
  location_name,
  allowed_ip_ranges,
  require_wifi,
  network_security_level,
  is_active,
  updated_at
FROM school_location_config
WHERE is_active = true;

-- ================================================================
-- Expected Output:
-- ================================================================
-- allowed_ip_ranges: {192.168.0.0/16,10.0.0.0/8,182.10.0.0/16,100.64.0.0/10}
-- require_wifi: false
-- network_security_level: high
-- is_active: true
--
-- IP 182.10.97.87 sekarang DALAM RANGE 182.10.0.0/16 ✅
-- ================================================================

-- 3. Test IP validation (optional)
-- Check if 182.10.97.87 is in range 182.10.0.0/16:
SELECT 
  '182.10.97.87'::inet << '182.10.0.0/16'::inet as is_in_range;
-- Expected: true

-- 4. Clear old security events (optional - untuk clean logs)
-- DELETE FROM security_events 
-- WHERE event_type = 'ip_whitelist_failed' 
--   AND created_at < NOW() - INTERVAL '1 hour';

-- ================================================================
-- DONE! 
-- User dengan IP 182.10.97.87 sekarang bisa absensi ✅
-- ================================================================
