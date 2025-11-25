-- Quick Fix: Posts RLS Policy untuk Public Read
-- Run this in Supabase SQL Editor

-- 1. Drop existing problematic policies
DROP POLICY IF EXISTS "Public can view published posts" ON posts;
DROP POLICY IF EXISTS "Anyone can view published posts" ON posts;
DROP POLICY IF EXISTS "Enable read for published posts" ON posts;

-- 2. Enable RLS on posts table (jika belum)
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 3. Create new permissive policy for published posts
CREATE POLICY "Public read published posts"
ON posts
FOR SELECT
TO public
USING (status = 'published');

-- 4. Create policy for authenticated users to read all posts
CREATE POLICY "Authenticated read all posts"
ON posts
FOR SELECT
TO authenticated
USING (true);

-- 5. Verify policies
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
WHERE tablename = 'posts'
ORDER BY policyname;

-- 6. Test query (should work now)
-- SELECT id, title, status, published_at FROM posts WHERE status = 'published' LIMIT 3;
