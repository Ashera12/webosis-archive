-- Add kelas column to users table properly
-- This column is for student class information (e.g., "X IPA 1", "XI IPS 2", etc.)

-- Add the kelas column if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS kelas text;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_kelas ON public.users(kelas);

-- Add comment to describe the column
COMMENT ON COLUMN public.users.kelas IS 'Student class/grade (e.g., X IPA 1, XI IPS 2)';

-- Verify the column is added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND column_name = 'kelas';
