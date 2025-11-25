-- Ensure gallery table has updated_at trigger

-- Create or replace the touch_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS gallery_updated_at ON public.gallery;

-- Create trigger for gallery table
CREATE TRIGGER gallery_updated_at
  BEFORE UPDATE ON public.gallery
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

-- Verify the trigger exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'gallery_updated_at'
  ) THEN
    RAISE NOTICE 'Gallery updated_at trigger created successfully';
  ELSE
    RAISE EXCEPTION 'Failed to create gallery updated_at trigger';
  END IF;
END $$;
