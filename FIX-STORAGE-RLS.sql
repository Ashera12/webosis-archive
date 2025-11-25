-- ============================================================================
-- FIX STORAGE RLS POLICY FOR GALLERY BUCKET
-- ============================================================================
-- Error: "new row violates row-level security policy" when uploading images
-- This happens because storage.objects table has RLS enabled but no policies
-- for authenticated users to INSERT
-- ============================================================================

-- Drop ALL existing policies related to gallery bucket
DROP POLICY IF EXISTS "Authenticated users can upload to gallery" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update gallery files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete gallery files" ON storage.objects;
DROP POLICY IF EXISTS "Public can read gallery files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload to gallery" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow all uploads to gallery" ON storage.objects;
DROP POLICY IF EXISTS "Allow all updates to gallery" ON storage.objects;
DROP POLICY IF EXISTS "Allow all deletes from gallery" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from gallery" ON storage.objects;

-- Drop any other gallery-related policies (loop through all)
DO $$ 
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'objects' 
      AND schemaname = 'storage'
      AND (
        policyname ILIKE '%gallery%'
        OR policyname ILIKE '%upload%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    RAISE NOTICE 'Dropped storage policy: %', pol.policyname;
  END LOOP;
END $$;

-- OPTION 1: Allow ALL users (authenticated + anon) to upload to gallery bucket
CREATE POLICY "Allow all uploads to gallery"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'gallery');

-- OPTION 2: Allow ALL users to update gallery files
CREATE POLICY "Allow all updates to gallery"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'gallery')
WITH CHECK (bucket_id = 'gallery');

-- OPTION 3: Allow ALL users to delete gallery files
CREATE POLICY "Allow all deletes from gallery"
ON storage.objects
FOR DELETE
USING (bucket_id = 'gallery');

-- OPTION 4: Public read access
CREATE POLICY "Allow public reads from gallery"
ON storage.objects
FOR SELECT
USING (bucket_id = 'gallery');

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check storage policies
SELECT 
  policyname,
  cmd as operation,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
ORDER BY policyname;

-- Check bucket exists
SELECT 
  id,
  name,
  public,
  CASE 
    WHEN public = true THEN '✅ Public bucket - files accessible'
    ELSE '⚠️ Private bucket - need policies'
  END as status
FROM storage.buckets 
WHERE id = 'gallery';

-- ============================================================================
-- FINAL MESSAGE
-- ============================================================================
DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '✅ STORAGE POLICIES CREATED FOR GALLERY BUCKET';
  RAISE NOTICE '✅ Authenticated users can now upload images';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Go to /admin/settings';
  RAISE NOTICE '2. Try uploading a background image';
  RAISE NOTICE '3. Should work without RLS error ✅';
  RAISE NOTICE '============================================================';
END $$;
