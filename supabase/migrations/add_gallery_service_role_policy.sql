-- Restore service role full access policy for gallery table (needed for supabaseAdmin)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gallery' AND policyname='Service role full access'
  ) THEN
    CREATE POLICY "Service role full access"
      ON public.gallery FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

