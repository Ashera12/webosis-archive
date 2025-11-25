-- Fix RLS policies untuk comments - Support authenticated users dan admin

-- Drop existing policies
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;

-- Policy: Users can delete their own comments OR admins can delete any
CREATE POLICY "Users can delete own comments"
  ON comments
  FOR DELETE
  USING (
    -- Anonymous users: match by author_id IS NULL (not recommended for delete)
    -- Authenticated users: match by author_id
    -- Admin: can delete any
    author_id IS NULL 
    OR 
    auth.uid() = author_id 
    OR 
    (
      auth.uid() IN (
        SELECT id FROM users WHERE role = 'admin'
      )
    )
  );

-- Policy: Users can update their own comments (not admin)
CREATE POLICY "Users can update own comments"
  ON comments
  FOR UPDATE
  USING (
    author_id IS NOT NULL 
    AND auth.uid() = author_id
  )
  WITH CHECK (
    author_id IS NOT NULL 
    AND auth.uid() = author_id
  );

-- Verify policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  cmd, 
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'comments'
ORDER BY cmd, policyname;
