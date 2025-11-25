-- One-off repair script: fix sekbid_id==0 and synchronize role/jabatan to include sekbid name
-- IMPORTANT: Run only after backing up your DB. Test the SELECTs first before running UPDATEs.
-- Recommended usage: paste into Supabase SQL editor and run step-by-step.

BEGIN;

-- Preview members that have sekbid_id = 0 (likely invalid)
SELECT id, sekbid_id, role, jabatan FROM members WHERE sekbid_id = 0 LIMIT 200;

-- Convert sekbid_id = 0 to NULL (explicitly clear association)
-- This prevents accidental foreign key mismatch and avoids using 0 as a real sekbid id.
UPDATE members
SET sekbid_id = NULL
WHERE sekbid_id = 0;

-- Preview rows where sekbid_id is not null but role is generic 'Anggota' or empty/null
SELECT m.id, m.sekbid_id, m.role, m.jabatan, s.id AS sek_id, s.name AS sek_name, s.nama AS sek_nama
FROM members m
LEFT JOIN sekbid s ON m.sekbid_id = s.id
WHERE m.sekbid_id IS NOT NULL
  AND (m.role IS NULL OR m.role ~* '^\s*Anggota(\s.*)?$' OR m.role = '')
LIMIT 500;

-- Update those rows so role and jabatan become 'Anggota {sekbid.name}'
UPDATE members m
SET role = 'Anggota ' || COALESCE(s.name, s.nama, m.sekbid_id::text),
    jabatan = 'Anggota ' || COALESCE(s.name, s.nama, m.sekbid_id::text)
FROM sekbid s
WHERE m.sekbid_id = s.id
  AND (m.role IS NULL OR m.role ~* '^\s*Anggota(\s.*)?$' OR m.role = '');

-- Fix rows that may have leftover text like 'Anggota Sekbid 0' when sekbid_id is NULL
SELECT id, sekbid_id, role, jabatan FROM members WHERE sekbid_id IS NULL AND role ILIKE 'Anggota Sekbid %' LIMIT 200;

UPDATE members
SET role = 'Anggota', jabatan = 'Anggota'
WHERE sekbid_id IS NULL AND role ILIKE 'Anggota Sekbid %';

-- Final sanity check: show a few sample rows
SELECT id, sekbid_id, role, jabatan FROM members ORDER BY id DESC LIMIT 50;

COMMIT;

-- Notes:
-- - This script only updates rows where role is NULL/empty or matches a generic 'Anggota' pattern.
-- - It will NOT overwrite roles like 'Ketua OSIS', 'Wakil Ketua', 'Sekretaris', etc.
-- - If you want to be more conservative, run the SELECTs first and then comment-in the UPDATEs one-by-one.
-- - Always back up the DB (export) or run inside a transaction you can roll back if needed.
