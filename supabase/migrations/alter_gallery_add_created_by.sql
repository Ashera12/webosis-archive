-- Safe migration to add created_by column and index to gallery table
-- Run this after the original create_gallery_table.sql if you saw
-- ERROR: column "created_by" does not exist

DO $$
BEGIN
  -- Add column if it does not exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='gallery' AND column_name='created_by'
  ) THEN
    ALTER TABLE public.gallery
      ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index only if column exists and index not present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='gallery' AND column_name='created_by'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='gallery' AND indexname='idx_gallery_created_by'
  ) THEN
    CREATE INDEX idx_gallery_created_by ON public.gallery(created_by);
  END IF;
END $$;

-- (Optional) Add more restrictive policies later if you want per-user ownership
-- For now policies in create_gallery_table.sql allow authenticated CRUD without owner checks.
