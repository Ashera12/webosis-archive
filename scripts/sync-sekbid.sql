-- scripts/sync-sekbid.sql
-- Idempotent script to ensure canonical sekbid-1..sekbid-6 exist and
-- mark any other sekbid rows as inactive (safe: does not delete rows).
-- BACKUP your database before running (pg_dump or Supabase backup).

BEGIN;

-- Ensure canonical rows exist (insert if absent, update if present).
INSERT INTO sekbid (name, nama, slug, deskripsi, icon, color, order_index, active)
VALUES
  ('sekbid-1', 'Sekbid 1 - Keagamaan', 'sekbid-1', 'Membina keimanan dan ketakwaan siswa', '/icons/keagamaan.svg', '#0ea5e9', 1, true),
  ('sekbid-2', 'Sekbid 2 - Kaderisasi', 'sekbid-2', 'Kaderisasi / Kedisiplinan', '/icons/kaderisasi.svg', '#10b981', 2, true),
  ('sekbid-3', 'Sekbid 3 - Akademik', 'sekbid-3', 'Akademik Non-Akademik', '/icons/akademik.svg', '#f97316', 3, true),
  ('sekbid-4', 'Sekbid 4 - Ekonomi Kreatif', 'sekbid-4', 'Ekonomi Kreatif', '/icons/ekonomi.svg', '#f43f5e', 4, true),
  ('sekbid-5', 'Sekbid 5 - Kesehatan', 'sekbid-5', 'Kesehatan Lingkungan', '/icons/kesehatan.svg', '#8b5cf6', 5, true),
  ('sekbid-6', 'Sekbid 6 - Kominfo', 'sekbid-6', 'Kominfo / Web Development', '/icons/kominfo.svg', '#06b6d4', 6, true)
ON CONFLICT (name) DO UPDATE
SET
  nama = EXCLUDED.nama,
  slug = EXCLUDED.slug,
  deskripsi = EXCLUDED.deskripsi,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  order_index = EXCLUDED.order_index,
  active = EXCLUDED.active;

-- Deactivate any other sekbid rows that are NOT the canonical names above
-- (keeps historical records safe but hides them from public pages).
UPDATE sekbid
SET active = false
WHERE name NOT IN ('sekbid-1','sekbid-2','sekbid-3','sekbid-4','sekbid-5','sekbid-6');

COMMIT;

-- Helpful checks (run after the script):
-- 1) See canonical rows
--    SELECT id, name, nama, active FROM sekbid WHERE name IN ('sekbid-1','sekbid-2','sekbid-3','sekbid-4','sekbid-5','sekbid-6') ORDER BY order_index;
-- 2) See deactivated rows
--    SELECT id, name, nama FROM sekbid WHERE active = false ORDER BY id LIMIT 50;

-- NOTE:
-- - This script sets `active=false` for non-canonical rows rather than deleting them.
-- - If you prefer to delete duplicates after manual review, export the rows first and then replace the UPDATE with DELETE.
-- - After running this, restart the Next.js server and clear cache so `getActiveSekbid()` (which fetches only `active=true`) reflects changes.
