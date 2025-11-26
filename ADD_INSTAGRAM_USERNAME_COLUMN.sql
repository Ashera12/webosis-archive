-- Migration: Add instagram_username column to users table
-- Created: 2025-11-27
-- Purpose: Store Instagram usernames for member profiles and public display

-- Add instagram_username column
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS instagram_username text;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_instagram_username 
ON public.users(instagram_username) 
WHERE instagram_username IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.users.instagram_username IS 
'Instagram username (without @ symbol) for member profile and public display';

-- Verify column was created
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users' 
  AND column_name = 'instagram_username';
