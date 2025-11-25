-- Fix announcements table id column
-- Drop and recreate with proper UUID default

-- Step 1: Create new table with correct structure
CREATE TABLE IF NOT EXISTS public.announcements_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'normal',
  expires_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Copy existing data (generate new UUIDs since old ones are null)
INSERT INTO public.announcements_new (title, content, priority, expires_at, created_by, updated_at)
SELECT title, content, priority, expires_at, created_by, updated_at
FROM public.announcements
WHERE title IS NOT NULL;

-- Step 3: Drop old table
DROP TABLE IF EXISTS public.announcements CASCADE;

-- Step 4: Rename new table
ALTER TABLE public.announcements_new RENAME TO announcements;

-- Step 5: Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Step 6: Create policies
CREATE POLICY announcements_public_read ON public.announcements
  FOR SELECT USING (true);

CREATE POLICY announcements_service_full ON public.announcements
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Step 7: Create index
CREATE INDEX IF NOT EXISTS idx_announcements_expires_at ON public.announcements(expires_at);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON public.announcements(created_at);

COMMENT ON TABLE public.announcements IS 'Announcements with proper UUID primary key';
