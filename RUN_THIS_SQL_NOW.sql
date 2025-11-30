-- ============================================
-- TESTING MODE: Bypass Location & WiFi
-- ============================================
-- Run this in Supabase SQL Editor NOW!
-- ============================================

-- Set BYPASS mode (testing only)
INSERT INTO admin_settings (key, value, is_secret, updated_at)
VALUES 
  ('location_required', 'false', false, NOW()),
  ('wifi_required', 'false', false, NOW())
ON CONFLICT (key) DO UPDATE 
SET 
  value = EXCLUDED.value,
  updated_at = NOW();

-- Verify
SELECT 
  key,
  value,
  CASE value
    WHEN 'true' THEN '🔒 STRICT - Validation ACTIVE'
    WHEN 'false' THEN '✅ BYPASS - Testing Mode'
    ELSE '❓ Unknown'
  END as status,
  updated_at
FROM admin_settings
WHERE key IN ('location_required', 'wifi_required')
ORDER BY key;

-- Expected result:
-- location_required | false | ✅ BYPASS - Testing Mode
-- wifi_required     | false | ✅ BYPASS - Testing Mode
