-- Fix gallery.created_by foreign key to point to custom users table instead of auth.users
-- Run this if you see FK violation: gallery_created_by_fkey
DO $$
BEGIN
  -- Drop existing FK if it references auth.users
  BEGIN
    ALTER TABLE public.gallery DROP CONSTRAINT IF EXISTS gallery_created_by_fkey;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Could not drop existing gallery_created_by_fkey constraint';
  END;

  -- Recreate FK referencing public.users(id) if users table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema='public' AND table_name='users'
  ) THEN
    ALTER TABLE public.gallery
      ADD CONSTRAINT gallery_created_by_fkey FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON DELETE SET NULL;
    RAISE NOTICE 'gallery_created_by_fkey now references public.users(id)';
  ELSE
    RAISE NOTICE 'public.users table not found; leaving created_by without FK';
  END IF;
END $$;
