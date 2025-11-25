-- Migration: add rejection fields to users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS rejected boolean NOT NULL DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS rejection_reason text;
-- Optional index if querying many rejected users
CREATE INDEX IF NOT EXISTS idx_users_rejected ON public.users(rejected);
