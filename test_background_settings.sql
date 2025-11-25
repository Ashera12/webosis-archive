-- Quick test script to verify background settings in Supabase

-- 1. Check if admin_settings table exists and has background settings
SELECT 
    key, 
    value,
    CASE 
        WHEN key = 'GLOBAL_BG_MODE' THEN 'Background Mode (none/color/gradient/image)'
        WHEN key = 'GLOBAL_BG_SCOPE' THEN 'Scope (all-pages/homepage-only/selected-pages)'
        WHEN key = 'GLOBAL_BG_SELECTED_PAGES' THEN 'Selected Pages Array'
        WHEN key = 'GLOBAL_BG_COLOR' THEN 'Color Value (#hex)'
        WHEN key = 'GLOBAL_BG_GRADIENT' THEN 'Gradient CSS'
        WHEN key = 'GLOBAL_BG_IMAGE' THEN 'Image URL'
        WHEN key = 'GLOBAL_BG_IMAGE_OVERLAY_OPACITY' THEN 'Image Overlay Opacity'
        ELSE 'Other Setting'
    END as description
FROM admin_settings 
WHERE key LIKE 'GLOBAL_BG_%' 
ORDER BY key;

-- 2. If no results, insert default settings
-- Uncomment and run this if table is empty:

/*
INSERT INTO admin_settings (key, value) VALUES
    ('GLOBAL_BG_MODE', 'gradient'),
    ('GLOBAL_BG_SCOPE', 'all-pages'),
    ('GLOBAL_BG_GRADIENT', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'),
    ('GLOBAL_BG_SELECTED_PAGES', '["home","about","posts"]'),
    ('GLOBAL_BG_IMAGE_OVERLAY_OPACITY', '0.3')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
*/

-- 3. Verify storage buckets exist
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id IN ('backgrounds', 'gallery');

-- 4. Check recent uploaded files
SELECT 
    name,
    bucket_id,
    created_at,
    metadata->>'size' as file_size
FROM storage.objects 
WHERE bucket_id IN ('backgrounds', 'gallery')
ORDER BY created_at DESC 
LIMIT 5;
