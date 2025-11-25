-- Migration: Add/repair foreign key constraints for posts author and sekbid
-- Date: 2025-11-22

-- Ensure author FK exists with predictable name
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_author_id_fkey;
ALTER TABLE public.posts ADD CONSTRAINT posts_author_id_fkey
  FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- Add sekbid FK (was missing, preventing implicit relationship join)
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_sekbid_id_fkey;
ALTER TABLE public.posts ADD CONSTRAINT posts_sekbid_id_fkey
  FOREIGN KEY (sekbid_id) REFERENCES public.sekbid(id) ON DELETE SET NULL;

-- Optional: refresh schema cache (Supabase will auto-refresh; manual if needed)
-- select pg_notify('pgrst', 'reload schema');
