-- Add image_url column to announcements if missing
alter table public.announcements add column if not exists image_url text;

-- Optional: backfill or set default behavior can be added here
