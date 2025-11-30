-- Fix Activity Logs RLS Policies (DROP existing policies first)

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Admin can view all activity logs" ON activity_logs;
DROP POLICY IF EXISTS "System can insert activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Admin can update activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Admin can delete activity logs" ON activity_logs;

-- Re-enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- 1. Users can view their own activity logs
CREATE POLICY "Users can view their own activity logs"
  ON activity_logs FOR SELECT
  USING (user_id = auth.uid());

-- 2. Admin can view all activity logs
CREATE POLICY "Admin can view all activity logs"
  ON activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );

-- 3. System can insert activity logs (service role + authenticated users)
CREATE POLICY "System can insert activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (true);

-- 4. Admin can update activity logs (for moderation)
CREATE POLICY "Admin can update activity logs"
  ON activity_logs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );

-- 5. Admin can soft delete activity logs
CREATE POLICY "Admin can delete activity logs"
  ON activity_logs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'super_admin'
    )
  );

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'activity_logs';
