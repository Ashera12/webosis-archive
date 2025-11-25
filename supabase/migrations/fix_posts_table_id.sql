-- Fix posts table to ensure id column works properly
-- Check if posts table exists and has proper structure
DO $$
BEGIN
  -- Drop and recreate posts table with proper id column
  DROP TABLE IF EXISTS public.posts CASCADE;
  
  CREATE TABLE public.posts (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT,
    excerpt TEXT,
    featured_image TEXT,
    author_id UUID,
    sekbid_id INTEGER,
    category TEXT,
    tags TEXT[],
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
    is_featured BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Create indexes
  CREATE UNIQUE INDEX idx_posts_slug ON public.posts(slug);
  CREATE INDEX idx_posts_status ON public.posts(status);
  CREATE INDEX idx_posts_author ON public.posts(author_id);
  CREATE INDEX idx_posts_created ON public.posts(created_at);

  -- Enable RLS
  ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

  -- Service role full access
  CREATE POLICY posts_service_full ON public.posts 
    FOR ALL TO service_role 
    USING (true) 
    WITH CHECK (true);

  -- Public read published posts
  CREATE POLICY posts_public_read ON public.posts 
    FOR SELECT 
    USING (status = 'published');

  -- Updated at trigger
  CREATE OR REPLACE FUNCTION update_posts_updated_at()
  RETURNS TRIGGER AS $func$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $func$ LANGUAGE plpgsql;

  DROP TRIGGER IF EXISTS trigger_posts_updated_at ON public.posts;
  CREATE TRIGGER trigger_posts_updated_at
    BEFORE UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION update_posts_updated_at();

END $$;
