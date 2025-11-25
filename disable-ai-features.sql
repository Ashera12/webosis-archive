-- ============================================
-- Disable AI features sementara (quota issue)
-- ============================================

-- Option 1: Keep features enabled but use different provider
-- Update ini di UI /admin/settings nanti dengan Anthropic/Gemini key

-- Option 2: Disable auto-execute completely
UPDATE public.admin_settings 
SET value = 'off', updated_at = now() 
WHERE key = 'AUTO_EXECUTE_MODE';

-- Verify
SELECT key, value, is_secret 
FROM public.admin_settings 
WHERE key IN ('AUTO_EXECUTE_MODE', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GEMINI_API_KEY')
ORDER BY key;

-- ============================================
-- Kalau mau pakai Anthropic instead:
-- ============================================
-- 1. Get API key: https://console.anthropic.com/settings/keys
-- 2. Update via UI di /admin/settings:
--    ANTHROPIC_API_KEY = sk-ant-api03-...
-- 3. Modify /app/api/admin/ai/route.ts untuk prefer Anthropic
