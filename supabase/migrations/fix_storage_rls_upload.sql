-- Fix Storage RLS Policies untuk Upload
-- Jalankan di Supabase SQL Editor

-- 1. Enable RLS on storage.objects (jika belum)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies (if any) untuk bucket 'gallery'
DROP POLICY IF EXISTS "Public can view gallery" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload to gallery" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update gallery" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete from gallery" ON storage.objects;

-- 3. Create new policies untuk bucket 'gallery'

-- Policy 1: Public dapat melihat (read)
CREATE POLICY "Public can view gallery"
ON storage.objects FOR SELECT
USING (bucket_id = 'gallery');

-- Policy 2: Authenticated users dapat upload (insert)
CREATE POLICY "Authenticated can upload to gallery"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'gallery' AND
  auth.role() = 'authenticated'
);

-- Policy 3: Authenticated users dapat update
CREATE POLICY "Authenticated can update gallery"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'gallery')
WITH CHECK (bucket_id = 'gallery');

-- Policy 4: Authenticated users dapat delete
CREATE POLICY "Authenticated can delete from gallery"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'gallery');

-- 4. Pastikan bucket 'gallery' ada dan public
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 5. Policy untuk service role (bypass semua)
CREATE POLICY "Service role can do everything"
ON storage.objects
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Verification queries:
-- SELECT * FROM storage.buckets WHERE id = 'gallery';
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

COMMENT ON POLICY "Public can view gallery" ON storage.objects IS 
'Allow public read access to gallery bucket for displaying images';

COMMENT ON POLICY "Authenticated can upload to gallery" ON storage.objects IS 
'Allow authenticated users to upload files to gallery bucket';

COMMENT ON POLICY "Service role can do everything" ON storage.objects IS 
'Service role bypass for admin operations via API';
