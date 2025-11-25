-- =====================================================
-- SETUP SUPABASE STORAGE BUCKET & POLICIES
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Create storage bucket for gallery
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gallery',
  'gallery',
  true,
  10485760, -- 10MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow public to READ (view) all files in gallery bucket
CREATE POLICY "Public can view gallery images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'gallery');

-- 4. Policy: Allow authenticated users to INSERT (upload) to gallery bucket
CREATE POLICY "Authenticated users can upload gallery images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'gallery');

-- 5. Policy: Allow authenticated users to UPDATE their own files
CREATE POLICY "Authenticated users can update gallery images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'gallery');

-- 6. Policy: Allow authenticated users to DELETE their own files
CREATE POLICY "Authenticated users can delete gallery images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'gallery');

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if bucket exists
SELECT * FROM storage.buckets WHERE id = 'gallery';

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%gallery%';

-- =====================================================
-- MANUAL BUCKET CREATION (if SQL fails)
-- =====================================================
-- If the SQL above doesn't work, create bucket manually:
-- 1. Go to Supabase Dashboard → Storage
-- 2. Click "New bucket"
-- 3. Name: gallery
-- 4. Public bucket: ON (checked)
-- 5. File size limit: 10 MB
-- 6. Allowed MIME types: image/*
-- 7. Click "Create bucket"
-- 
-- Then create policies:
-- 1. Click bucket "gallery"
-- 2. Click "Policies" tab
-- 3. Click "New Policy"
-- 4. Select "Enable read access for all users"
-- 5. Save
