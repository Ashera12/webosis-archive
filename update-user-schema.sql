-- =============================
-- Update Users Table Schema
-- Add missing fields for complete user profile
-- Run this in Supabase SQL Editor
-- =============================

-- Add kelas field if not exists
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS kelas text;

-- Add is_active field if not exists (for account approval)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT false;

-- Ensure all profile fields exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS nickname text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS unit_sekolah text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS nik text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS nisn text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS requested_role text;

-- Update role constraint to include all roles
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('super_admin','admin','moderator','osis','guru','siswa','other','pending'));

-- Add comments for documentation
COMMENT ON COLUMN public.users.kelas IS 'Class/grade of student (e.g., X, XI, XII)';
COMMENT ON COLUMN public.users.is_active IS 'Account active status (approved and not suspended)';
COMMENT ON COLUMN public.users.nickname IS 'User nickname/username for display';
COMMENT ON COLUMN public.users.unit_sekolah IS 'School unit (e.g., SMK, SMP, SD)';
COMMENT ON COLUMN public.users.nik IS 'National ID number (16 digits)';
COMMENT ON COLUMN public.users.nisn IS 'National Student ID number (10 digits)';
COMMENT ON COLUMN public.users.requested_role IS 'Role requested during signup';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS users_is_active_idx ON public.users(is_active);
CREATE INDEX IF NOT EXISTS users_kelas_idx ON public.users(kelas);
CREATE INDEX IF NOT EXISTS users_unit_sekolah_idx ON public.users(unit_sekolah);

-- Update existing users without is_active to true if approved
UPDATE public.users SET is_active = true WHERE approved = true AND is_active = false;

SELECT 'User schema updated successfully!' as status;
