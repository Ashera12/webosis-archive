-- Create error_logs table for AI Auto-Fix monitoring
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Error classification
  error_type TEXT NOT NULL DEFAULT 'runtime_error',
  severity TEXT DEFAULT 'medium', -- low, medium, high, critical
  
  -- Error details
  error_message TEXT,
  error_stack TEXT,
  
  -- Request context
  url TEXT,
  method TEXT DEFAULT 'GET',
  status_code INTEGER,
  
  -- User context
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_agent TEXT,
  ip_address TEXT,
  
  -- Request/Response data
  request_body JSONB,
  response_body JSONB,
  headers JSONB,
  context JSONB,
  
  -- AI Analysis
  ai_analysis JSONB,
  fix_status TEXT DEFAULT 'pending', -- pending, analysis_complete, fix_applied, resolved
  fix_applied_at TIMESTAMP WITH TIME ZONE,
  applied_fix TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON public.error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_fix_status ON public.error_logs(fix_status);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON public.error_logs(user_id);

-- Enable Row Level Security
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Super admins can do everything
CREATE POLICY "Super admins full access to error_logs"
  ON public.error_logs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Allow inserting errors from any authenticated user (for logging)
CREATE POLICY "Anyone can insert error logs"
  ON public.error_logs
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Allow service role full access
CREATE POLICY "Service role full access to error_logs"
  ON public.error_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE public.error_logs IS 'Stores application errors for AI-powered monitoring and auto-fix';
