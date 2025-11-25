-- Create poll_votes table to track who voted and their role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema='public' AND table_name='poll_votes'
  ) THEN
    CREATE TABLE public.poll_votes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      poll_id UUID NOT NULL,
      option_id BIGINT NOT NULL,
      user_id UUID,
      voter_role TEXT NOT NULL DEFAULT 'anonymous',
      voter_identifier TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Add foreign keys
    ALTER TABLE public.poll_votes
      ADD CONSTRAINT poll_votes_poll_id_fkey 
      FOREIGN KEY (poll_id) REFERENCES public.polls(id) ON DELETE CASCADE;
    
    ALTER TABLE public.poll_votes
      ADD CONSTRAINT poll_votes_option_id_fkey 
      FOREIGN KEY (option_id) REFERENCES public.poll_options(id) ON DELETE CASCADE;
    
    -- Index for faster lookups
    CREATE INDEX idx_poll_votes_poll_id ON public.poll_votes(poll_id);
    CREATE INDEX idx_poll_votes_user_id ON public.poll_votes(user_id);
    CREATE INDEX idx_poll_votes_identifier ON public.poll_votes(voter_identifier);
    
    -- Enable RLS
    ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
    
    -- Service role full access
    CREATE POLICY poll_votes_service_full ON public.poll_votes
      FOR ALL TO service_role USING (true) WITH CHECK (true);
    
    -- Public can view aggregated results
    CREATE POLICY poll_votes_public_read ON public.poll_votes
      FOR SELECT USING (true);
  END IF;
END $$;
