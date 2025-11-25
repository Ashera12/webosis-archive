-- ========================================
-- SAFE STORAGE RLS FIX (Drop then Create)
-- ========================================

-- Drop ALL existing storage policies for gallery bucket
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END;
$$;

-- Create fresh policies
CREATE POLICY "Public can view gallery"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gallery');

CREATE POLICY "Authenticated can upload to gallery"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'gallery' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update gallery"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'gallery')
  WITH CHECK (bucket_id = 'gallery');

CREATE POLICY "Authenticated can delete from gallery"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'gallery');

CREATE POLICY "Service role can do everything"
  ON storage.objects FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Ensure gallery bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO UPDATE SET public = true;
