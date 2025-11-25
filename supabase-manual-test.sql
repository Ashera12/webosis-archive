-- ============================================
-- FINAL FIX: Set proper values for testing
-- ============================================

-- Set all critical values
UPDATE public.admin_settings SET value = 'true', updated_at = now() WHERE key = 'ALLOW_ADMIN_OPS';
UPDATE public.admin_settings SET value = 'true', updated_at = now() WHERE key = 'ALLOW_UNSAFE_TERMINAL';
UPDATE public.admin_settings SET value = 'my-secure-token-123456789012345678901234567890', updated_at = now() WHERE key = 'ADMIN_OPS_TOKEN';
UPDATE public.admin_settings SET value = 'off', updated_at = now() WHERE key = 'AUTO_EXECUTE_MODE';
UPDATE public.admin_settings SET value = '5', updated_at = now() WHERE key = 'AUTO_EXECUTE_DELAY_MINUTES';

-- Verify ALL settings
SELECT key, value, is_secret, updated_at 
FROM public.admin_settings 
ORDER BY key;

-- Double check critical ones
SELECT 
  key, 
  value,
  CASE 
    WHEN value = 'true' THEN '✅ ENABLED'
    WHEN value = 'false' THEN '❌ DISABLED'  
    WHEN value = '' THEN '⚠️ EMPTY'
    ELSE '✓ HAS VALUE'
  END as status
FROM public.admin_settings
WHERE key IN ('ALLOW_ADMIN_OPS', 'ALLOW_UNSAFE_TERMINAL', 'ADMIN_OPS_TOKEN')
ORDER BY key;
