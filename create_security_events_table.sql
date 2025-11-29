-- Create Security Events Table for logging
CREATE TABLE IF NOT EXISTS security_events (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id)
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_resolved ON security_events(resolved);

-- RLS Policies
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Admin bisa lihat semua
CREATE POLICY "Admin can view all security events"
  ON security_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );

-- User bisa lihat event mereka sendiri
CREATE POLICY "Users can view their own security events"
  ON security_events FOR SELECT
  USING (user_id = auth.uid());

-- System dapat insert (service role)
CREATE POLICY "System can insert security events"
  ON security_events FOR INSERT
  WITH CHECK (true);

-- Admin dapat update (resolve events)
CREATE POLICY "Admin can update security events"
  ON security_events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );

COMMENT ON TABLE security_events IS 'Logs security-related events: fingerprint mismatches, location anomalies, suspicious patterns';
COMMENT ON COLUMN security_events.event_type IS 'Type of security event: FINGERPRINT_MISMATCH, LOCATION_SPOOFING, ANOMALY_DETECTED, etc.';
COMMENT ON COLUMN security_events.severity IS 'Event severity level for prioritization';
COMMENT ON COLUMN security_events.metadata IS 'Additional event data in JSON format';
