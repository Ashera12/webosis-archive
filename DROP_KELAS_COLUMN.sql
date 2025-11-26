-- Drop kelas column from users table if it exists
-- This column was added by mistake in update-user-schema.sql but doesn't exist in main schema

ALTER TABLE public.users DROP COLUMN IF EXISTS kelas;

-- Verify the column is gone
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;
