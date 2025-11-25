-- Migration: add extra user signup fields
-- Adds nickname, unit_sekolah, nik, nisn, requested_role columns.
-- Adds length/numeric constraints where practical.

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS nickname text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS unit_sekolah text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS nik text; -- Expect 16 digits
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS nisn text; -- Expect 10 digits
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS requested_role text; -- Desired role selected at signup

-- Constraints (will skip if already exist)
DO $$ BEGIN
  ALTER TABLE public.users ADD CONSTRAINT nik_length CHECK (nik IS NULL OR length(nik)=16);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.users ADD CONSTRAINT nisn_length CHECK (nisn IS NULL OR length(nisn)=10);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Optional indexes for faster lookup (unique constraints not enforced here)
CREATE INDEX IF NOT EXISTS idx_users_nik ON public.users(nik);
CREATE INDEX IF NOT EXISTS idx_users_nisn ON public.users(nisn);
