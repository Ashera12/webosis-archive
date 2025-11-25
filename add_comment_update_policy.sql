-- Add UPDATE policy for comments (untuk edit feature)
DROP POLICY IF EXISTS "Users can update own comments" ON comments;

CREATE POLICY "Users can update own comments"
  ON comments
  FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Verify all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('comments', 'comment_likes')
ORDER BY tablename, policyname;
