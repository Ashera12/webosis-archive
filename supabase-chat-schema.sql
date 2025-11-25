-- ============================================
-- AI LIVE CHAT SYSTEM
-- ============================================
-- Two modes:
-- 1. Super Admin: Full web management AI assistant
-- 2. Public: Information helper for students/visitors
-- ============================================

-- Chat sessions table
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  session_name TEXT DEFAULT 'New Chat',
  mode TEXT NOT NULL CHECK (mode IN ('admin', 'public')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_mode ON public.chat_sessions(mode);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);

-- RLS Policies
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chat_sessions_select_own ON public.chat_sessions;
CREATE POLICY chat_sessions_select_own ON public.chat_sessions
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.jwt() ->> 'role' = 'super_admin'
  );

DROP POLICY IF EXISTS chat_sessions_insert_own ON public.chat_sessions;
CREATE POLICY chat_sessions_insert_own ON public.chat_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS chat_sessions_update_own ON public.chat_sessions;
CREATE POLICY chat_sessions_update_own ON public.chat_sessions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS chat_messages_select_own ON public.chat_messages;
CREATE POLICY chat_messages_select_own ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions
      WHERE id = chat_messages.session_id
      AND (user_id = auth.uid() OR auth.jwt() ->> 'role' = 'super_admin')
    )
  );

DROP POLICY IF EXISTS chat_messages_insert_own ON public.chat_messages;
CREATE POLICY chat_messages_insert_own ON public.chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_sessions
      WHERE id = chat_messages.session_id
      AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS chat_sessions_super_admin ON public.chat_sessions;
CREATE POLICY chat_sessions_super_admin ON public.chat_sessions
  FOR ALL USING (auth.jwt() ->> 'role' = 'super_admin');

DROP POLICY IF EXISTS chat_messages_super_admin ON public.chat_messages;
CREATE POLICY chat_messages_super_admin ON public.chat_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions
      WHERE id = chat_messages.session_id
      AND auth.jwt() ->> 'role' = 'super_admin'
    )
  );

-- Function to update session timestamp on new message
CREATE OR REPLACE FUNCTION update_chat_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_sessions
  SET updated_at = now()
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure trigger creation is idempotent to avoid 'trigger already exists' errors
DROP TRIGGER IF EXISTS trigger_update_chat_session_timestamp ON public.chat_messages;
CREATE TRIGGER trigger_update_chat_session_timestamp
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_session_timestamp();

-- ============================================
-- VERIFICATION
-- ============================================

-- Check tables created
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE tablename IN ('chat_sessions', 'chat_messages')
ORDER BY tablename;

-- Check indexes
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('chat_sessions', 'chat_messages')
ORDER BY tablename, indexname;
