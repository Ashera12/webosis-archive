-- ============================================
-- ATTENDANCE STORAGE BUCKET SETUP
-- ============================================
-- This script creates the attendance storage bucket
-- for selfie photos with proper security policies
-- ============================================

-- IMPORTANT: First create the bucket manually in Supabase Dashboard!
-- Storage > New bucket > Name: "attendance" > Public: YES

-- ============================================
-- STEP 1: Create the bucket (manual or SQL)
-- ============================================

-- Option A: Insert bucket record (if not using dashboard)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attendance',
  'attendance', 
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 2: Create RLS policies for storage.objects
-- ============================================

-- Drop existing policies first (if they exist)
DROP POLICY IF EXISTS "Users can upload their own selfies" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own selfies" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own selfies" ON storage.objects;

-- Policy 1: Allow authenticated users to upload their own selfies
CREATE POLICY "Users can upload their own selfies"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'attendance' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Allow public read access (needed for AI verification and public URLs)
CREATE POLICY "Public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'attendance');

-- Policy 3: Allow authenticated users to update their own selfies
CREATE POLICY "Users can update their own selfies"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'attendance' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'attendance' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Allow authenticated users to delete their own selfies
CREATE POLICY "Users can delete their own selfies"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'attendance' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if bucket exists
SELECT * FROM storage.buckets WHERE id = 'attendance';

-- Check all policies on storage.objects for attendance bucket
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage';

-- Test bucket access (run this after policies are created)
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'attendance';

-- ============================================
-- MANUAL STEPS (if SQL fails)
-- ============================================
/*
If running this SQL script doesn't work, do it manually:

1. Go to Supabase Dashboard: https://mhefqwregrldvxtqqxbb.supabase.co
2. Navigate to: Storage > New bucket
3. Bucket settings:
   - Name: attendance
   - Public bucket: YES ← IMPORTANT!
   - File size limit: 5242880 (5MB)
   - Allowed MIME types: image/jpeg, image/png, image/webp
4. Click "Create bucket"

5. Then create policies:
   - Click on "attendance" bucket
   - Go to "Policies" tab
   - Click "New Policy" > "For full customization"
   - Copy each policy from this file

OR use Supabase CLI:
npx supabase storage create attendance --public
*/

-- ============================================
-- CLEANUP (if needed)
-- ============================================

-- Drop all policies (if you need to recreate them)
/*
DROP POLICY IF EXISTS "Users can upload their own selfies" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own selfies" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own selfies" ON storage.objects;
*/

-- Delete bucket (WARNING: This deletes all files!)
/*
DELETE FROM storage.buckets WHERE id = 'attendance';
*/
