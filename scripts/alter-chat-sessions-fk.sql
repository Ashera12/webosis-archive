-- Idempotent migration to switch chat_sessions.user_id foreign key
-- from auth.users(id) to public.users(id). Run in Supabase SQL editor.

BEGIN;

-- Drop existing FK if it exists
ALTER TABLE IF EXISTS public.chat_sessions
  DROP CONSTRAINT IF EXISTS chat_sessions_user_id_fkey;

-- Add new FK to public.users
ALTER TABLE IF EXISTS public.chat_sessions
  ADD CONSTRAINT chat_sessions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

COMMIT;

-- Notes:
-- 1) This will succeed only if all existing user_id values in chat_sessions
--    correspond to ids in public.users. If not, the ADD CONSTRAINT will fail.
-- 2) If constraint addition fails, inspect rows with missing users with:
--    SELECT cs.* FROM public.chat_sessions cs LEFT JOIN public.users u ON cs.user_id = u.id WHERE u.id IS NULL;
--    Decide whether to delete/fix those chat_sessions rows or create matching users.
