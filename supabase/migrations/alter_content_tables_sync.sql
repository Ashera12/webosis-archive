-- Synchronize content tables schema with application expectations
-- Posts table: ensure columns exist with correct types and defaults
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema='public' AND table_name='posts'
  ) THEN
    CREATE TABLE public.posts (
      id BIGSERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      content TEXT,
      excerpt TEXT,
      featured_image TEXT,
      author_id UUID,
      status TEXT DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
      is_featured BOOLEAN DEFAULT false,
      published_at TIMESTAMPTZ,
      views INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;

  -- Add missing columns safely
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='slug') THEN
    ALTER TABLE public.posts ADD COLUMN slug TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='content') THEN
    ALTER TABLE public.posts ADD COLUMN content TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='excerpt') THEN
    ALTER TABLE public.posts ADD COLUMN excerpt TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='featured_image') THEN
    ALTER TABLE public.posts ADD COLUMN featured_image TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='author_id') THEN
    ALTER TABLE public.posts ADD COLUMN author_id UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='status') THEN
    ALTER TABLE public.posts ADD COLUMN status TEXT DEFAULT 'draft';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name='posts_status_check') THEN
    ALTER TABLE public.posts ADD CONSTRAINT posts_status_check CHECK (status IN ('draft','published','archived'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='is_featured') THEN
    ALTER TABLE public.posts ADD COLUMN is_featured BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='published_at') THEN
    ALTER TABLE public.posts ADD COLUMN published_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='views') THEN
    ALTER TABLE public.posts ADD COLUMN views INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='created_at') THEN
    ALTER TABLE public.posts ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='updated_at') THEN
    ALTER TABLE public.posts ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  -- Unique index for slug
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_posts_slug') THEN
    CREATE UNIQUE INDEX idx_posts_slug ON public.posts(slug);
  END IF;
END $$;

-- Announcements
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='announcements'
  ) THEN
    CREATE TABLE public.announcements (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      priority TEXT DEFAULT 'normal',
      expires_at TIMESTAMPTZ,
      created_by UUID,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;
  
  -- Add missing columns safely
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='announcements' AND column_name='content') THEN
    ALTER TABLE public.announcements ADD COLUMN content TEXT NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='announcements' AND column_name='priority') THEN
    ALTER TABLE public.announcements ADD COLUMN priority TEXT DEFAULT 'normal';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='announcements' AND column_name='expires_at') THEN
    ALTER TABLE public.announcements ADD COLUMN expires_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='announcements' AND column_name='created_by') THEN
    ALTER TABLE public.announcements ADD COLUMN created_by UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='announcements' AND column_name='created_at') THEN
    ALTER TABLE public.announcements ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='announcements' AND column_name='updated_at') THEN
    ALTER TABLE public.announcements ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='events'
  ) THEN
    CREATE TABLE public.events (
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
  END IF;
  
  -- Add missing columns safely
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='description') THEN
    ALTER TABLE public.events ADD COLUMN description TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='event_date') THEN
    ALTER TABLE public.events ADD COLUMN event_date TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='location') THEN
    ALTER TABLE public.events ADD COLUMN location TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='image_url') THEN
    ALTER TABLE public.events ADD COLUMN image_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='registration_link') THEN
    ALTER TABLE public.events ADD COLUMN registration_link TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='created_by') THEN
    ALTER TABLE public.events ADD COLUMN created_by UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='created_at') THEN
    ALTER TABLE public.events ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='updated_at') THEN
    ALTER TABLE public.events ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Polls and poll_options with FK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='polls'
  ) THEN
    CREATE TABLE public.polls (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      question TEXT NOT NULL,
      options JSONB NOT NULL DEFAULT '[]',
      expires_at TIMESTAMPTZ,
      created_by UUID,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;
  
  -- Add missing columns safely
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='polls' AND column_name='question') THEN
    ALTER TABLE public.polls ADD COLUMN question TEXT NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='polls' AND column_name='options') THEN
    ALTER TABLE public.polls ADD COLUMN options JSONB NOT NULL DEFAULT '[]';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='polls' AND column_name='expires_at') THEN
    ALTER TABLE public.polls ADD COLUMN expires_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='polls' AND column_name='created_by') THEN
    ALTER TABLE public.polls ADD COLUMN created_by UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='polls' AND column_name='created_at') THEN
    ALTER TABLE public.polls ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='polls' AND column_name='updated_at') THEN
    ALTER TABLE public.polls ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='poll_options'
  ) THEN
    CREATE TABLE public.poll_options (
      id BIGSERIAL PRIMARY KEY,
      poll_id UUID NOT NULL,
      option_text TEXT NOT NULL,
      order_index INTEGER DEFAULT 0,
      votes INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;
  
  -- Add missing columns for poll_options
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='poll_options' AND column_name='poll_id') THEN
    ALTER TABLE public.poll_options ADD COLUMN poll_id UUID NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='poll_options' AND column_name='option_text') THEN
    ALTER TABLE public.poll_options ADD COLUMN option_text TEXT NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='poll_options' AND column_name='order_index') THEN
    ALTER TABLE public.poll_options ADD COLUMN order_index INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='poll_options' AND column_name='votes') THEN
    ALTER TABLE public.poll_options ADD COLUMN votes INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='poll_options' AND column_name='created_at') THEN
    ALTER TABLE public.poll_options ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- Add FK if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema='public' AND table_name='poll_options' AND constraint_type='FOREIGN KEY' AND constraint_name='poll_options_poll_id_fkey'
  ) THEN
    ALTER TABLE public.poll_options
      ADD CONSTRAINT poll_options_poll_id_fkey FOREIGN KEY (poll_id) REFERENCES public.polls(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Admin notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='admin_notifications'
  ) THEN
    CREATE TABLE public.admin_notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      link TEXT,
      read BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;
  
  -- Add missing columns safely
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_notifications' AND column_name='user_id') THEN
    ALTER TABLE public.admin_notifications ADD COLUMN user_id UUID NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_notifications' AND column_name='title') THEN
    ALTER TABLE public.admin_notifications ADD COLUMN title TEXT NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_notifications' AND column_name='message') THEN
    ALTER TABLE public.admin_notifications ADD COLUMN message TEXT NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_notifications' AND column_name='type') THEN
    ALTER TABLE public.admin_notifications ADD COLUMN type TEXT NOT NULL DEFAULT 'info';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_notifications' AND column_name='link') THEN
    ALTER TABLE public.admin_notifications ADD COLUMN link TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_notifications' AND column_name='read') THEN
    ALTER TABLE public.admin_notifications ADD COLUMN read BOOLEAN NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_notifications' AND column_name='created_at') THEN
    ALTER TABLE public.admin_notifications ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Enable RLS and base policies (idempotent)
DO $$
BEGIN
  EXECUTE 'ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.events ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY';
END $$;

-- Service role full access policies
DO $$
BEGIN
  -- posts
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='posts' AND policyname='posts_service_full') THEN
    CREATE POLICY posts_service_full ON public.posts FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  -- announcements
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='announcements' AND policyname='ann_service_full') THEN
    CREATE POLICY ann_service_full ON public.announcements FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  -- events
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='events' AND policyname='evt_service_full') THEN
    CREATE POLICY evt_service_full ON public.events FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  -- polls
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='polls' AND policyname='polls_service_full') THEN
    CREATE POLICY polls_service_full ON public.polls FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  -- poll_options
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='poll_options' AND policyname='pollopts_service_full') THEN
    CREATE POLICY pollopts_service_full ON public.poll_options FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  -- admin_notifications
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='admin_notifications' AND policyname='admin_notif_service_full') THEN
    CREATE POLICY admin_notif_service_full ON public.admin_notifications FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Public read policies
DO $$
BEGIN
  -- announcements
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='announcements' AND policyname='ann_public_read') THEN
    CREATE POLICY ann_public_read ON public.announcements FOR SELECT USING (true);
  END IF;
  -- events
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='events' AND policyname='evt_public_read') THEN
    CREATE POLICY evt_public_read ON public.events FOR SELECT USING (true);
  END IF;
  -- polls
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='polls' AND policyname='polls_public_read') THEN
    CREATE POLICY polls_public_read ON public.polls FOR SELECT USING (true);
  END IF;
  -- admin_notifications owner read
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='admin_notifications' AND policyname='admin_notif_owner_read') THEN
    CREATE POLICY admin_notif_owner_read ON public.admin_notifications FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_ann_created ON public.announcements(created_at);
CREATE INDEX IF NOT EXISTS idx_polls_created ON public.polls(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_notif_user ON public.admin_notifications(user_id);
