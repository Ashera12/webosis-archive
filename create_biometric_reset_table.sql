-- Create biometric_reset_requests table
CREATE TABLE IF NOT EXISTS biometric_reset_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_biometric_reset_user ON biometric_reset_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_biometric_reset_status ON biometric_reset_requests(status);
CREATE INDEX IF NOT EXISTS idx_biometric_reset_requested ON biometric_reset_requests(requested_at DESC);

-- RLS Policies
ALTER TABLE biometric_reset_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY biometric_reset_select_own ON biometric_reset_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own requests
CREATE POLICY biometric_reset_insert_own ON biometric_reset_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only admins can update requests (approve/reject)
CREATE POLICY biometric_reset_update_admin ON biometric_reset_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND LOWER(users.role) = 'admin'
    )
  );

-- Admins can see all requests
CREATE POLICY biometric_reset_select_admin ON biometric_reset_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND LOWER(users.role) = 'admin'
    )
  );

-- Update trigger
CREATE OR REPLACE FUNCTION update_biometric_reset_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER biometric_reset_updated_at
  BEFORE UPDATE ON biometric_reset_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_biometric_reset_updated_at();

-- Comment
COMMENT ON TABLE biometric_reset_requests IS 'User requests to reset their biometric data (requires admin approval)';
