-- Fix RLS for Posts Table
-- Run this in Supabase SQL Editor

-- 1. Enable RLS on posts table (if not already)
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Public can read published posts" ON posts;
DROP POLICY IF EXISTS "Authenticated users can read all posts" ON posts;
DROP POLICY IF EXISTS "Admins can insert posts" ON posts;
DROP POLICY IF EXISTS "Admins can update posts" ON posts;
DROP POLICY IF EXISTS "Admins can delete posts" ON posts;

-- 3. Public read access for published posts
CREATE POLICY "Public can read published posts"
ON posts FOR SELECT
USING (status = 'published');

-- 4. Authenticated users can read all posts (including drafts)
CREATE POLICY "Authenticated users can read all posts"
ON posts FOR SELECT
TO authenticated
USING (true);

-- 5. Only super_admin and admin can insert posts
CREATE POLICY "Admins can insert posts"
ON posts FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin')
  )
);

-- 6. Only super_admin and admin can update posts
CREATE POLICY "Admins can update posts"
ON posts FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin')
  )
);

-- 7. Only super_admin can delete posts
CREATE POLICY "Admins can delete posts"
ON posts FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);

-- 8. Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'posts'
ORDER BY policyname;
