-- ============================================
-- QUICK FIX: Bypass Location & WiFi Validation
-- ============================================
-- Purpose: Allow attendance testing without HTTPS/GPS
-- Run this in Supabase SQL Editor IMMEDIATELY
-- ============================================

-- 1. Check if admin_settings exists
SELECT * FROM admin_settings LIMIT 1;

-- 2. If exists, UPDATE to disable validations
UPDATE admin_settings 
SET 
  location_required = false,
  wifi_required = false,
  updated_at = NOW()
WHERE id = 1;

-- 3. If doesn't exist, INSERT new row
INSERT INTO admin_settings (
  id,
  location_required, 
  wifi_required,
  created_at,
  updated_at
) 
VALUES (
  1,
  false, 
  false,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE 
SET 
  location_required = false,
  wifi_required = false,
  updated_at = NOW();

-- 4. Verify settings
SELECT 
  id,
  location_required,
  wifi_required,
  updated_at
FROM admin_settings;

-- ============================================
-- EXPECTED RESULT:
-- ✅ location_required = false
-- ✅ wifi_required = false
-- ============================================

-- After running this:
-- 1. Geolocation error will be ignored (HTTP allowed)
-- 2. Location validation will BYPASS automatically
-- 3. WiFi validation will BYPASS automatically
-- 4. Face analysis WILL RUN (security validation passes)
-- 5. Biometric verification WILL RUN (no longer blocked)
-- ============================================
