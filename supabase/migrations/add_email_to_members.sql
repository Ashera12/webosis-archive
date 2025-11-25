-- Add email column to members table if it doesn't exist

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'members' 
    AND column_name = 'email'
  ) THEN
    ALTER TABLE public.members ADD COLUMN email TEXT;
    COMMENT ON COLUMN public.members.email IS 'Email address of the member';
  END IF;
END $$;
