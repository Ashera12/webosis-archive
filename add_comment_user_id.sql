-- Add internal user_id column to track NextAuth credential users
ALTER TABLE comments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);