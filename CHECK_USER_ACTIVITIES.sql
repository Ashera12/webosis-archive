-- =============================================
-- SQL QUERIES - CHECK USER ACTIVITIES
-- =============================================
-- Copy paste ke Supabase SQL Editor untuk monitoring

-- ═══════════════════════════════════════════════
-- 1. CHECK ALL RECENT ACTIVITIES (Last 50)
-- ═══════════════════════════════════════════════
SELECT 
  id,
  user_email,
  user_name,
  activity_type,
  action,
  description,
  status,
  created_at,
  metadata->>'attendance_id' as attendance_id,
  metadata->>'location' as location,
  metadata->>'wifi_ssid' as wifi,
  metadata->>'ai_match_score' as ai_score
FROM activity_logs
WHERE deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 50;

-- ═══════════════════════════════════════════════
-- 2. CHECK SPECIFIC USER ACTIVITIES
-- ═══════════════════════════════════════════════
-- Replace 'user-email@example.com' dengan email user yang ingin dicek
SELECT 
  id,
  activity_type,
  action,
  description,
  status,
  created_at,
  metadata
FROM activity_logs
WHERE user_email = 'user-email@example.com'
  AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 100;

-- ═══════════════════════════════════════════════
-- 3. CHECK ATTENDANCE ACTIVITIES TODAY
-- ═══════════════════════════════════════════════
SELECT 
  user_name,
  user_email,
  activity_type,
  description,
  status,
  created_at,
  metadata->>'location' as location,
  metadata->>'wifi_ssid' as wifi,
  metadata->>'ai_match_score' as ai_score,
  metadata->>'security_score' as security_score
FROM activity_logs
WHERE activity_type IN ('attendance_checkin', 'attendance_checkout')
  AND created_at >= CURRENT_DATE
  AND deleted_at IS NULL
ORDER BY created_at DESC;

-- ═══════════════════════════════════════════════
-- 4. CHECK BIOMETRIC ACTIVITIES
-- ═══════════════════════════════════════════════
SELECT 
  user_name,
  user_email,
  activity_type,
  description,
  status,
  created_at,
  metadata->>'biometricType' as biometric_type,
  metadata->>'hasWebAuthn' as has_webauthn
FROM activity_logs
WHERE activity_type IN ('biometric_setup', 'biometric_update', 'biometric_reset_request')
  AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 50;

-- ═══════════════════════════════════════════════
-- 5. CHECK SECURITY VALIDATION ACTIVITIES
-- ═══════════════════════════════════════════════
SELECT 
  user_name,
  user_email,
  description,
  status,
  created_at,
  metadata->>'securityScore' as security_score,
  metadata->>'violations' as violations,
  metadata->>'warnings' as warnings
FROM activity_logs
WHERE activity_type = 'security_validation'
  AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 50;

-- ═══════════════════════════════════════════════
-- 6. CHECK AI VERIFICATION ACTIVITIES
-- ═══════════════════════════════════════════════
SELECT 
  user_name,
  user_email,
  activity_type,
  description,
  status,
  created_at,
  metadata->>'matchScore' as match_score,
  metadata->>'confidence' as confidence,
  metadata->>'isLive' as is_live,
  metadata->>'provider' as ai_provider
FROM activity_logs
WHERE activity_type IN ('ai_verification', 'biometric_verification', 'ai_wifi_validation')
  AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 50;

-- ═══════════════════════════════════════════════
-- 7. CHECK FAILED ACTIVITIES (Errors)
-- ═══════════════════════════════════════════════
SELECT 
  user_name,
  user_email,
  activity_type,
  description,
  status,
  created_at,
  metadata
FROM activity_logs
WHERE status IN ('failure', 'error')
  AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 50;

-- ═══════════════════════════════════════════════
-- 8. SUMMARY BY USER (Activity Count)
-- ═══════════════════════════════════════════════
SELECT 
  user_email,
  user_name,
  COUNT(*) as total_activities,
  COUNT(CASE WHEN activity_type = 'attendance_checkin' THEN 1 END) as checkins,
  COUNT(CASE WHEN activity_type = 'attendance_checkout' THEN 1 END) as checkouts,
  COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
  COUNT(CASE WHEN status = 'failure' THEN 1 END) as failed,
  MAX(created_at) as last_activity
FROM activity_logs
WHERE deleted_at IS NULL
GROUP BY user_email, user_name
ORDER BY total_activities DESC
LIMIT 50;

-- ═══════════════════════════════════════════════
-- 9. SUMMARY BY ACTIVITY TYPE (Today)
-- ═══════════════════════════════════════════════
SELECT 
  activity_type,
  COUNT(*) as count,
  COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
  COUNT(CASE WHEN status = 'failure' THEN 1 END) as failed
FROM activity_logs
WHERE created_at >= CURRENT_DATE
  AND deleted_at IS NULL
GROUP BY activity_type
ORDER BY count DESC;

-- ═══════════════════════════════════════════════
-- 10. CHECK IF USER ATTENDED TODAY
-- ═══════════════════════════════════════════════
-- Replace 'user-email@example.com' dengan email user
SELECT 
  user_name,
  user_email,
  activity_type,
  description,
  created_at,
  metadata->>'wifi_ssid' as wifi,
  metadata->>'location' as location,
  metadata->>'ai_match_score' as ai_score
FROM activity_logs
WHERE user_email = 'user-email@example.com'
  AND activity_type IN ('attendance_checkin', 'attendance_checkout')
  AND created_at >= CURRENT_DATE
  AND deleted_at IS NULL
ORDER BY created_at DESC;

-- ═══════════════════════════════════════════════
-- 11. CHECK LEGACY user_activities TABLE
-- ═══════════════════════════════════════════════
-- Untuk backward compatibility dengan code lama
SELECT 
  user_id,
  user_email,
  activity_type,
  description,
  status,
  details,
  created_at
FROM user_activities
ORDER BY created_at DESC
LIMIT 50;

-- ═══════════════════════════════════════════════
-- 12. CHECK SECURITY EVENTS
-- ═══════════════════════════════════════════════
SELECT 
  user_id,
  event_type,
  severity,
  metadata,
  resolved,
  created_at
FROM security_events
ORDER BY created_at DESC
LIMIT 50;

-- ═══════════════════════════════════════════════
-- NOTES:
-- ═══════════════════════════════════════════════
-- 1. activity_logs table: Main activity tracking (newest)
-- 2. user_activities table: Legacy activities (may still be used)
-- 3. security_events table: Security-specific events
-- 4. All metadata stored as JSONB for flexible queries
-- 5. Use deleted_at IS NULL to exclude soft-deleted records
