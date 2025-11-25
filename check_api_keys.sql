-- ========================================
-- API Keys - Database Check & Fix Queries
-- ========================================

-- 1. CHECK: View all API keys in database
SELECT 
  key, 
  CASE 
    WHEN value IS NULL THEN '(NULL)'
    WHEN value = '' THEN '(EMPTY)'
    WHEN value = '***' THEN '(MASKED)'
    ELSE LEFT(value, 15) || '...' 
  END as value_preview,
  LENGTH(value) as chars,
  is_secret,
  TO_CHAR(updated_at, 'YYYY-MM-DD HH24:MI:SS') as last_updated
FROM admin_settings 
WHERE key LIKE '%API_KEY%'
ORDER BY key;

-- Expected result:
-- ANTHROPIC_API_KEY | sk-ant-xxxxxxx... | 45+ | true | 2025-11-20 ...
-- GEMINI_API_KEY    | AIzaSyDW...       | 39+ | true | 2025-11-20 ...
-- OPENAI_API_KEY    | sk-proj-xxxxx...  | 51+ | true | 2025-11-20 ...


-- 2. CHECK: Find invalid/masked values
SELECT 
  key,
  value,
  LENGTH(value) as chars,
  CASE 
    WHEN value IS NULL THEN 'NULL - needs value'
    WHEN value = '' THEN 'EMPTY - needs value'
    WHEN value = '***' THEN 'MASKED - not saved properly'
    WHEN LENGTH(value) < 20 THEN 'TOO SHORT - likely invalid'
    ELSE 'OK'
  END as status
FROM admin_settings 
WHERE key LIKE '%API_KEY%';


-- 3. FIX: Delete invalid entries (run ONLY if needed)
-- DELETE FROM admin_settings 
-- WHERE key LIKE '%API_KEY%' 
-- AND (value IS NULL OR value = '' OR value = '***' OR LENGTH(value) < 20);


-- 4. INSERT: Add API key manually (if UI save fails)
-- Replace 'YOUR_ACTUAL_KEY_HERE' with real key

-- For OpenAI:
-- INSERT INTO admin_settings (key, value, is_secret)
-- VALUES ('OPENAI_API_KEY', 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', true)
-- ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, is_secret = true, updated_at = NOW();

-- For Gemini:
-- INSERT INTO admin_settings (key, value, is_secret)
-- VALUES ('GEMINI_API_KEY', 'AIzaSyDWxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', true)
-- ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, is_secret = true, updated_at = NOW();

-- For Anthropic:
-- INSERT INTO admin_settings (key, value, is_secret)
-- VALUES ('ANTHROPIC_API_KEY', 'sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', true)
-- ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, is_secret = true, updated_at = NOW();


-- 5. CHECK: All admin settings (overview)
SELECT 
  key,
  CASE 
    WHEN is_secret THEN LEFT(value, 10) || '...' 
    ELSE value 
  END as value_display,
  is_secret,
  TO_CHAR(updated_at, 'YYYY-MM-DD HH24:MI:SS') as last_updated
FROM admin_settings 
ORDER BY 
  CASE 
    WHEN key LIKE '%API_KEY%' THEN 1
    WHEN key LIKE '%TOKEN%' THEN 2
    WHEN key LIKE 'THEME_%' THEN 3
    WHEN key LIKE 'GLOBAL_BG_%' THEN 4
    ELSE 5
  END,
  key;


-- 6. CHECK: Recently updated settings (last 24 hours)
SELECT 
  key,
  LEFT(value, 20) || '...' as value_preview,
  is_secret,
  updated_at,
  NOW() - updated_at as age
FROM admin_settings 
WHERE updated_at > NOW() - INTERVAL '24 hours'
ORDER BY updated_at DESC;


-- 7. COUNT: How many settings per category
SELECT 
  CASE 
    WHEN key LIKE '%API_KEY%' THEN 'AI - API Keys'
    WHEN key LIKE '%MODEL%' THEN 'AI - Models'
    WHEN key LIKE '%TOKEN%' THEN 'Security - Tokens'
    WHEN key LIKE 'ALLOW_%' THEN 'Security - Permissions'
    WHEN key LIKE 'THEME_%' THEN 'Theme - Colors'
    WHEN key LIKE 'GLOBAL_BG_%' THEN 'Theme - Background'
    WHEN key LIKE 'DATABASE_%' THEN 'Infrastructure'
    ELSE 'Other'
  END as category,
  COUNT(*) as count,
  SUM(CASE WHEN is_secret THEN 1 ELSE 0 END) as secret_count
FROM admin_settings 
GROUP BY category
ORDER BY count DESC;


-- 8. VERIFY: Check API key formats are valid
SELECT 
  key,
  LEFT(value, 20) as prefix,
  LENGTH(value) as length,
  CASE 
    WHEN key = 'OPENAI_API_KEY' AND (value LIKE 'sk-%' OR value LIKE 'sk-proj-%') AND LENGTH(value) > 40 THEN '✅ Valid OpenAI format'
    WHEN key = 'GEMINI_API_KEY' AND value LIKE 'AIza%' AND LENGTH(value) > 35 THEN '✅ Valid Gemini format'
    WHEN key = 'ANTHROPIC_API_KEY' AND value LIKE 'sk-ant-%' AND LENGTH(value) > 40 THEN '✅ Valid Anthropic format'
    WHEN key LIKE '%API_KEY%' THEN '❌ Invalid format or too short'
    ELSE 'N/A'
  END as validation
FROM admin_settings 
WHERE key LIKE '%API_KEY%'
ORDER BY key;


-- 9. TEST: Simulate getConfig() behavior
-- This shows what getConfig('GEMINI_API_KEY') would return
SELECT 
  'GEMINI_API_KEY' as requested_key,
  COALESCE(
    (SELECT value FROM admin_settings WHERE key = 'GEMINI_API_KEY' AND value IS NOT NULL AND value != ''),
    'FALLBACK TO ENV'
  ) as returned_value,
  CASE 
    WHEN (SELECT value FROM admin_settings WHERE key = 'GEMINI_API_KEY' AND value IS NOT NULL AND value != '') IS NOT NULL 
    THEN 'Database (priority)'
    ELSE 'Environment variable (fallback)'
  END as source;


-- 10. CLEANUP: Remove duplicate or legacy keys
-- Run this if you have duplicate entries or old keys
-- DELETE FROM admin_settings 
-- WHERE key IN (
--   'OLD_KEY_NAME_1',
--   'OLD_KEY_NAME_2'
-- );


-- ========================================
-- Quick Commands (copy-paste ready)
-- ========================================

-- Quick check if any API key exists:
-- SELECT COUNT(*) as api_keys_count FROM admin_settings WHERE key LIKE '%API_KEY%' AND LENGTH(value) > 20;

-- Quick check if Gemini key valid:
-- SELECT value LIKE 'AIza%' AND LENGTH(value) > 35 as is_valid_gemini FROM admin_settings WHERE key = 'GEMINI_API_KEY';

-- Quick delete all API keys (DANGER):
-- DELETE FROM admin_settings WHERE key LIKE '%API_KEY%';

-- Quick view all secrets:
-- SELECT key, LEFT(value, 10) || '***' as masked_value FROM admin_settings WHERE is_secret = true;
