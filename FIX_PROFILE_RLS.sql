-- Fix RLS policies for users table to allow profile updates
-- This ensures users can read and update their own profile data

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_select_all_authenticated" ON users;
DROP POLICY IF EXISTS "users_update_own_profile" ON users;

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "users_select_own" ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id);

-- Allow users to update their own profile (except role and approval status)
CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id)
  WITH CHECK (
    auth.uid()::text = id
    -- Prevent users from changing their own role or approval status
    AND (
      role = (SELECT role FROM users WHERE id = auth.uid()::text)
      OR role IS NULL
    )
    AND (
      approved = (SELECT approved FROM users WHERE id = auth.uid()::text)
      OR approved IS NULL
    )
  );

-- Allow admins to select all users
CREATE POLICY "users_select_admin" ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::text
      AND role IN ('super_admin', 'admin', 'osis')
    )
  );

-- Allow admins to update any user
CREATE POLICY "users_update_admin" ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::text
      AND role IN ('super_admin', 'admin', 'osis')
    )
  );

COMMIT;
