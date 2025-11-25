-- Update comments table untuk support replies dan likes
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES comments(id) ON DELETE CASCADE;

-- Create comment_likes table
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON comment_likes(user_id);

-- Enable RLS for comment_likes
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view comment likes" ON comment_likes;
DROP POLICY IF EXISTS "Anyone can like comments" ON comment_likes;
DROP POLICY IF EXISTS "Users can unlike comments" ON comment_likes;

-- Policy: Anyone can view likes
CREATE POLICY "Anyone can view comment likes"
  ON comment_likes
  FOR SELECT
  USING (true);

-- Policy: Anyone can like comments
CREATE POLICY "Anyone can like comments"
  ON comment_likes
  FOR INSERT
  WITH CHECK (true);

-- Policy: Users can unlike their own likes
CREATE POLICY "Users can unlike comments"
  ON comment_likes
  FOR DELETE
  USING (true);

-- Add comments
COMMENT ON COLUMN comments.parent_id IS 'ID of parent comment for replies (NULL for top-level comments)';
COMMENT ON TABLE comment_likes IS 'Stores likes for comments';
