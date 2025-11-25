-- =====================================================
-- FIX: Gallery and Members Issues
-- Run this SQL in Supabase SQL Editor
-- =====================================================

-- 1. Ensure touch_updated_at function exists
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Ensure gallery table has updated_at column and trigger
DO $$
BEGIN
  -- Add updated_at column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'gallery' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.gallery ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    RAISE NOTICE 'Added updated_at column to gallery table';
  END IF;
END $$;

-- Drop and recreate gallery trigger
DROP TRIGGER IF EXISTS gallery_updated_at ON public.gallery;
CREATE TRIGGER gallery_updated_at
  BEFORE UPDATE ON public.gallery
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

-- 3. Ensure members table has email column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'members' 
    AND column_name = 'email'
  ) THEN
    ALTER TABLE public.members ADD COLUMN email TEXT;
    RAISE NOTICE 'Added email column to members table';
  END IF;
END $$;

-- 4. Verify all required columns exist
DO $$
DECLARE
  gallery_cols text[];
  members_cols text[];
BEGIN
  -- Check gallery columns
  SELECT array_agg(column_name::text) INTO gallery_cols
  FROM information_schema.columns 
  WHERE table_schema = 'public' AND table_name = 'gallery';
  
  RAISE NOTICE 'Gallery columns: %', gallery_cols;
  
  -- Check members columns
  SELECT array_agg(column_name::text) INTO members_cols
  FROM information_schema.columns 
  WHERE table_schema = 'public' AND table_name = 'members';
  
  RAISE NOTICE 'Members columns: %', members_cols;
END $$;

-- 5. Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Success message
SELECT 'Gallery and Members tables fixed successfully!' as status;
