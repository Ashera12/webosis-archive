-- Preview / generate UPDATE statements for review only
-- Run this in Supabase SQL editor to review exactly what would be changed.
-- It will not execute the UPDATEs; it will produce SQL statements as text you can inspect and copy.

-- 1) Show members with sekbid_id = 0 (likely invalid)
SELECT id, sekbid_id, role, jabatan FROM members WHERE sekbid_id = 0 LIMIT 200;

-- 2) Generate UPDATE to convert sekbid_id = 0 -> NULL (review before running)
SELECT '/* UPDATE members SET sekbid_id = NULL WHERE id = ' || id || '; */' AS preview_sql
FROM members
WHERE sekbid_id = 0
LIMIT 200;

-- 3) Show members with sekbid_id IS NOT NULL but role is generic/empty
SELECT m.id, m.sekbid_id, m.role, m.jabatan, s.name AS sek_name, s.nama AS sek_nama
FROM members m
LEFT JOIN sekbid s ON m.sekbid_id = s.id
WHERE m.sekbid_id IS NOT NULL
  AND (m.role IS NULL OR m.role = '' OR m.role ~* '^\\s*Anggota(\\s.*)?$')
LIMIT 500;

-- 4) For those rows, generate exact UPDATE statements to set role/jabatan = 'Anggota {sekbid.name}'
SELECT
  'UPDATE members SET role = ' || quote_literal('Anggota ' || COALESCE(s.name, s.nama, m.sekbid_id::text)) || ', jabatan = ' || quote_literal('Anggota ' || COALESCE(s.name, s.nama, m.sekbid_id::text)) || ' WHERE id = ' || m.id || ';' AS preview_sql
FROM members m
JOIN sekbid s ON m.sekbid_id = s.id
WHERE m.sekbid_id IS NOT NULL
  AND (m.role IS NULL OR m.role = '' OR m.role ~* '^\\s*Anggota(\\s.*)?$')
LIMIT 500;

-- 5) Preview rows that have 'Anggota Sekbid 0' but sekbid_id IS NULL (fix to plain 'Anggota')
SELECT id, sekbid_id, role, jabatan FROM members WHERE sekbid_id IS NULL AND role ILIKE 'Anggota Sekbid %' LIMIT 200;

-- 6) Generate correction statements for those
SELECT 'UPDATE members SET role = ' || quote_literal('Anggota') || ', jabatan = ' || quote_literal('Anggota') || ' WHERE id = ' || id || ';' AS preview_sql
FROM members
WHERE sekbid_id IS NULL AND role ILIKE 'Anggota Sekbid %'
LIMIT 200;

-- After reviewing these generated statements, copy them (without the preview/* comments) into a transaction and run.
