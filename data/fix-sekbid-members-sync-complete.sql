-- Complete repair script: synchronize `members` with `sekbid` so public /people shows correct data
-- IMPORTANT: BACKUP your database before running this. Test by running the SELECT blocks first.
-- Recommended: run this in Supabase SQL editor step-by-step.

BEGIN;

-- 0) Overview counts (preview)
-- How many rows will potentially be affected by each step
SELECT
  COUNT(*) FILTER (WHERE sekbid_id = 0) AS sekbid_zero_count,
  COUNT(*) FILTER (WHERE sekbid_id IS NULL) AS sekbid_null_count,
  COUNT(*) FILTER (WHERE sekbid_id IS NOT NULL) AS sekbid_not_null_count,
  COUNT(*) FILTER (WHERE is_active IS TRUE) AS active_count
FROM members;

-- 1) Preview members that have sekbid_id = 0 (likely invalid)
SELECT id, COALESCE(name, nama) AS name, COALESCE(role, jabatan) AS role, sekbid_id, is_active
FROM members
WHERE sekbid_id = 0
ORDER BY id
LIMIT 500;

-- 2) Normalize sekbid_id: Convert sekbid_id = 0 to NULL
-- This avoids treating 0 as a valid foreign key. This is idempotent.
UPDATE members
SET sekbid_id = NULL
WHERE sekbid_id = 0;

-- 3) Preview members with sekbid_id IS NOT NULL but role/jabatan is generic or empty
SELECT m.id,
       COALESCE(m.name, m.nama) AS name,
       COALESCE(m.role, m.jabatan) AS role,
       m.sekbid_id,
       COALESCE(s.name, s.nama) AS sekbid_label
FROM members m
LEFT JOIN sekbid s ON m.sekbid_id = s.id
WHERE m.sekbid_id IS NOT NULL
  AND (COALESCE(m.role, m.jabatan) = '' OR COALESCE(m.role, m.jabatan) IS NULL OR COALESCE(m.role, m.jabatan) ~* '^\s*Anggota(\s.*)?$')
ORDER BY m.sekbid_id, m.id
LIMIT 1000;

-- 4) Update role/jabatan for members that have a sekbid but a generic/empty role.
-- Set role/jabatan = 'Anggota {sekbid.name}' (fallback to sekbid.nama or sekbid_id when missing)
UPDATE members m
SET role = 'Anggota ' || COALESCE(s.name, s.nama, m.sekbid_id::text),
    jabatan = 'Anggota ' || COALESCE(s.name, s.nama, m.sekbid_id::text)
FROM sekbid s
WHERE m.sekbid_id = s.id
  AND (COALESCE(m.role, m.jabatan) = '' OR COALESCE(m.role, m.jabatan) IS NULL OR COALESCE(m.role, m.jabatan) ~* '^\s*Anggota(\s.*)?$');

-- 5) Preview any rows that have labels like 'Anggota Sekbid 0' but sekbid_id IS NULL
SELECT id, COALESCE(name, nama) AS name, role, jabatan, sekbid_id
FROM members
WHERE sekbid_id IS NULL
  AND COALESCE(role, jabatan) ILIKE 'Anggota Sekbid %'
ORDER BY id
LIMIT 500;

-- 6) Clean stale labels that reference sekbid 0 when association is cleared
UPDATE members
SET role = 'Anggota', jabatan = 'Anggota'
WHERE sekbid_id IS NULL
  AND COALESCE(role, jabatan) ILIKE 'Anggota Sekbid %';

-- 7) OPTIONAL: Ensure members with a sekbid are active so they appear on /people
-- Uncomment the following block only if you understand it will set `is_active = true` for ALL members with a sekbid.
-- Useful if your admin expects sekbid members to always be visible publicly.
-- Note: Comment is intentionally present. Remove the surrounding comment markers to execute.
--
-- UPDATE members
-- SET is_active = TRUE
-- WHERE sekbid_id IS NOT NULL;
--

-- 8) Ensure display_order exists (if null) by setting to 0 where missing (idempotent)
UPDATE members
SET display_order = COALESCE(display_order, order_index, 0)
WHERE display_order IS NULL AND (order_index IS NOT NULL OR display_order IS NULL);

-- 9) Final sanity checks: show some sample rows grouped by sekbid
SELECT m.id,
       COALESCE(m.name, m.nama) AS name,
       COALESCE(m.role, m.jabatan) AS role,
       m.sekbid_id,
       COALESCE(s.name, s.nama) AS sekbid_label,
       m.is_active,
       COALESCE(m.display_order, m.order_index, 0) AS display_order
FROM members m
LEFT JOIN sekbid s ON m.sekbid_id = s.id
ORDER BY m.sekbid_id NULLS LAST, COALESCE(m.display_order, m.order_index, 0) ASC
LIMIT 200;

COMMIT;

-- Notes and safety guidance:
-- - Run the SELECT preview blocks first and inspect results before running the UPDATEs.
-- - The script is written to be idempotent where practical.
-- - The optional activation step is commented out; only enable it if you want to make sekbid members public immediately.
-- - After running, restart Next dev server and clear .next cache if necessary, then reload /people.
--   (Remove .next and run `npm run dev` locally.)
-- - If you prefer an automated Node script (logs each row changed), use `scripts/run-fix-sekbid-sync.js` in the repo.
