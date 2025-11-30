-- ===============================================
-- CRITICAL FIX: Create user_activities table
-- Run this in Supabase SQL Editor NOW!
-- ===============================================

-- Drop existing table if exists (to reset)
DROP TABLE IF EXISTS user_activities CASCADE;

-- Create user_activities table
CREATE TABLE user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_email TEXT,
  activity_type TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_user_activities_type ON user_activities(activity_type);
CREATE INDEX idx_user_activities_created ON user_activities(created_at DESC);
CREATE INDEX idx_user_activities_status ON user_activities(status);

-- Add RLS (Row Level Security) - Allow all for now
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role to do everything
CREATE POLICY "Service role has full access to user_activities"
  ON user_activities
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Allow authenticated users to insert their own activities
CREATE POLICY "Users can insert their own activities"
  ON user_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Allow authenticated users to view their own activities
CREATE POLICY "Users can view their own activities"
  ON user_activities
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text OR user_email = auth.email());

-- Policy: Allow public to insert (for non-authenticated logging)
CREATE POLICY "Allow public to insert activities"
  ON user_activities
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Verify table created
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'user_activities'
ORDER BY ordinal_position;

-- Test insert
INSERT INTO user_activities (
  user_id,
  user_email,
  activity_type,
  description,
  status,
  details,
  ip_address,
  user_agent
) VALUES (
  'test-user-123',
  'test@example.com',
  'test_activity',
  'Testing user_activities table',
  'success',
  '{"test": true}'::jsonb,
  '127.0.0.1',
  'Test User Agent'
);

-- Verify insert worked
SELECT * FROM user_activities ORDER BY created_at DESC LIMIT 5;

-- Expected output:
-- Should show the test row inserted above
-- If you see data, table is working! ✅
