-- Create Activity Logs Table for comprehensive user activity tracking
CREATE TABLE IF NOT EXISTS activity_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT,
  user_email TEXT,
  user_role TEXT,
  
  -- Activity classification
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'login', 'logout',
    'attendance_checkin', 'attendance_checkout',
    'post_create', 'post_like', 'post_unlike', 'post_comment', 'post_share',
    'poll_vote', 'poll_create',
    'ai_chat_message', 'ai_chat_session_start', 'ai_chat_session_end',
    'profile_update', 'password_change',
    'event_view', 'event_register',
    'gallery_view', 'gallery_upload',
    'member_view', 'member_search',
    'admin_action',
    'security_validation', 'ai_verification',
    'other'
  )),
  
  -- Activity details
  action TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Context
  ip_address TEXT,
  user_agent TEXT,
  device_info JSONB,
  location_data JSONB,
  
  -- Related entities
  related_id TEXT, -- ID of related entity (post_id, poll_id, attendance_id, etc)
  related_type TEXT, -- Type of related entity
  
  -- Status & Result
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failure', 'pending', 'error')),
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Soft delete
  deleted_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_type ON activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created ON activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type_created ON activity_logs(activity_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_related ON activity_logs(related_type, related_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_status ON activity_logs(status);

-- GIN index for JSONB searching
CREATE INDEX IF NOT EXISTS idx_activity_logs_metadata_gin ON activity_logs USING GIN (metadata);

-- RLS Policies
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own activity logs
CREATE POLICY "Users can view their own activity logs"
  ON activity_logs FOR SELECT
  USING (user_id = auth.uid());

-- Admin can view all activity logs
CREATE POLICY "Admin can view all activity logs"
  ON activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );

-- System can insert activity logs (service role)
CREATE POLICY "System can insert activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (true);

-- Admin can update activity logs (for moderation)
CREATE POLICY "Admin can update activity logs"
  ON activity_logs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );

-- Admin can soft delete activity logs
CREATE POLICY "Admin can delete activity logs"
  ON activity_logs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'super_admin'
    )
  );

COMMENT ON TABLE activity_logs IS 'Comprehensive user activity tracking: login, attendance, posts, polls, AI chat, etc.';
COMMENT ON COLUMN activity_logs.activity_type IS 'Category of activity: login, attendance, posts, polls, ai_chat, etc.';
COMMENT ON COLUMN activity_logs.action IS 'Specific action taken: "User logged in", "Created post", "Voted on poll", etc.';
COMMENT ON COLUMN activity_logs.metadata IS 'Additional data in JSON: post content, poll options, chat messages, etc.';
COMMENT ON COLUMN activity_logs.related_id IS 'ID of related entity for quick lookup';
COMMENT ON COLUMN activity_logs.related_type IS 'Type of related entity: post, poll, attendance, chat_session, etc.';
