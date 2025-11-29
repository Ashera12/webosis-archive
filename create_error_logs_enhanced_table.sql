-- create_error_logs_enhanced_table.sql
-- Enhanced Error Logging System with AI Auto-Fix

-- Drop table if exists to ensure clean creation
DROP TABLE IF EXISTS error_logs CASCADE;

-- Create error_logs table
CREATE TABLE error_logs (
  id BIGSERIAL PRIMARY KEY,
  error_type TEXT NOT NULL CHECK (error_type IN (
    'client_error',       -- Frontend errors
    'server_error',       -- Backend errors
    'database_error',     -- DB query errors
    'api_error',          -- External API errors
    'validation_error',   -- Data validation errors
    'authentication_error', -- Auth errors
    'authorization_error',  -- Permission errors
    'network_error',      -- Network/timeout errors
    'unknown_error'       -- Unclassified errors
  )),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  stack_trace TEXT,
  error_code TEXT,
  
  -- Context
  user_id UUID,
  user_email TEXT,
  user_role TEXT,
  page_url TEXT,
  api_endpoint TEXT,
  request_method TEXT,
  request_body JSONB,
  response_status INTEGER,
  
  -- Environment
  environment TEXT DEFAULT 'production' CHECK (environment IN ('development', 'staging', 'production')),
  browser TEXT,
  os TEXT,
  device_type TEXT,
  ip_address TEXT,
  user_agent TEXT,
  
  -- AI Analysis
  ai_analyzed BOOLEAN DEFAULT FALSE,
  ai_risk_level TEXT CHECK (ai_risk_level IN ('low', 'medium', 'high', 'critical')),
  ai_category TEXT,
  ai_suggestions TEXT[],
  auto_fixable BOOLEAN DEFAULT FALSE,
  auto_fix_applied BOOLEAN DEFAULT FALSE,
  auto_fix_details JSONB,
  
  -- Resolution
  error_status TEXT DEFAULT 'open' CHECK (error_status IN ('open', 'investigating', 'fixed', 'wont_fix', 'duplicate')),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  resolution_notes TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  occurrence_count INTEGER DEFAULT 1,
  first_occurred_at TIMESTAMPTZ DEFAULT NOW(),
  last_occurred_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_error_logs_severity ON error_logs(severity);
CREATE INDEX idx_error_logs_error_type ON error_logs(error_type);
CREATE INDEX idx_error_logs_status ON error_logs(error_status);
CREATE INDEX idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX idx_error_logs_ai_analyzed ON error_logs(ai_analyzed) WHERE ai_analyzed = FALSE;
CREATE INDEX idx_error_logs_auto_fixable ON error_logs(auto_fixable) WHERE auto_fixable = TRUE AND auto_fix_applied = FALSE;
CREATE INDEX idx_error_logs_metadata_gin ON error_logs USING GIN (metadata);

-- RLS Policies
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admin can view all error logs" ON error_logs;
DROP POLICY IF EXISTS "System can insert error logs" ON error_logs;
DROP POLICY IF EXISTS "Admin can update error logs" ON error_logs;
DROP POLICY IF EXISTS "Super admin can delete error logs" ON error_logs;

-- Admin can view all error logs
CREATE POLICY "Admin can view all error logs"
ON error_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'super_admin')
  )
);

-- System (service role) can insert error logs
CREATE POLICY "System can insert error logs"
ON error_logs FOR INSERT
WITH CHECK (true);

-- Admin can update error logs
CREATE POLICY "Admin can update error logs"
ON error_logs FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'super_admin')
  )
);

-- Super admin can delete error logs
CREATE POLICY "Super admin can delete error logs"
ON error_logs FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'super_admin'
  )
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_error_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS error_logs_updated_at_trigger ON error_logs;
CREATE TRIGGER error_logs_updated_at_trigger
  BEFORE UPDATE ON error_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_error_logs_updated_at();

-- Comments
COMMENT ON TABLE error_logs IS 'Enhanced error logging system with AI-powered analysis and auto-fix capabilities';
COMMENT ON COLUMN error_logs.ai_analyzed IS 'Whether AI has analyzed this error';
COMMENT ON COLUMN error_logs.auto_fixable IS 'Whether this error can be automatically fixed';
COMMENT ON COLUMN error_logs.auto_fix_applied IS 'Whether auto-fix has been applied';
COMMENT ON COLUMN error_logs.occurrence_count IS 'Number of times this error occurred';
COMMENT ON COLUMN error_logs.metadata IS 'Additional error context in JSON format';
