-- Test if gallery table exists and is accessible
SELECT COUNT(*) as table_exists 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'gallery';

-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'gallery';

-- Check policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'gallery';

-- Try to select data
SELECT id, title, image_url, created_at 
FROM public.gallery 
ORDER BY created_at DESC 
LIMIT 5;
