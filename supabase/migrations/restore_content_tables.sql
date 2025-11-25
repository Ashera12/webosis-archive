-- Option 1: Rename backup tables back to original names
ALTER TABLE IF EXISTS public.backup_posts RENAME TO posts;
ALTER TABLE IF EXISTS public.backup_announcements RENAME TO announcements;
ALTER TABLE IF EXISTS public.backup_events RENAME TO events;
ALTER TABLE IF EXISTS public.backup_polls RENAME TO polls;
ALTER TABLE IF EXISTS public.backup_poll_options RENAME TO poll_options;
ALTER TABLE IF EXISTS public.backup_admin_notifications RENAME TO admin_notifications;

-- Option 2: If backup tables don't exist, create new tables
-- Create posts table
CREATE TABLE IF NOT EXISTS public.posts (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT,
  excerpt TEXT,
  featured_image TEXT,
  author_id UUID,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_featured BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  expires_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  image_url TEXT,
  registration_link TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create polls table
CREATE TABLE IF NOT EXISTS public.polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  expires_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create poll options table (used by admin/polls route)
CREATE TABLE IF NOT EXISTS public.poll_options (
  id BIGSERIAL PRIMARY KEY,
  poll_id UUID NOT NULL,
  option_text TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  votes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create admin notifications table
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public read published posts" ON public.posts;
DROP POLICY IF EXISTS "Allow service role full access posts" ON public.posts;
DROP POLICY IF EXISTS "Allow public read announcements" ON public.announcements;
DROP POLICY IF EXISTS "Allow service role full access announcements" ON public.announcements;
DROP POLICY IF EXISTS "Allow public read events" ON public.events;
DROP POLICY IF EXISTS "Allow service role full access events" ON public.events;
DROP POLICY IF EXISTS "Allow public read polls" ON public.polls;
DROP POLICY IF EXISTS "Allow service role full access polls" ON public.polls;
DROP POLICY IF EXISTS "Allow service role full access poll_options" ON public.poll_options;
DROP POLICY IF EXISTS "Allow owner read poll_options" ON public.poll_options;
DROP POLICY IF EXISTS "Allow service role full access admin_notifications" ON public.admin_notifications;
DROP POLICY IF EXISTS "Allow owner read admin_notifications" ON public.admin_notifications;

-- Create RLS policies for posts
CREATE POLICY "Allow public read published posts"
  ON public.posts FOR SELECT
  USING (status = 'published');

CREATE POLICY "Allow service role full access posts"
  ON public.posts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for announcements
CREATE POLICY "Allow public read announcements"
  ON public.announcements FOR SELECT
  USING (true);

CREATE POLICY "Allow service role full access announcements"
  ON public.announcements FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for events
CREATE POLICY "Allow public read events"
  ON public.events FOR SELECT
  USING (true);

CREATE POLICY "Allow service role full access events"
  ON public.events FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for polls
CREATE POLICY "Allow public read polls"
  ON public.polls FOR SELECT
  USING (true);

CREATE POLICY "Allow service role full access polls"
  ON public.polls FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policies for poll_options (service role full control, otherwise no public access)
CREATE POLICY "Allow service role full access poll_options"
  ON public.poll_options FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policies for admin_notifications (service role full control and per-user read)
CREATE POLICY "Allow service role full access admin_notifications"
  ON public.admin_notifications FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow owner read admin_notifications"
  ON public.admin_notifications FOR SELECT
  USING (user_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_posts_slug ON public.posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON public.poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_user ON public.admin_notifications(user_id);
