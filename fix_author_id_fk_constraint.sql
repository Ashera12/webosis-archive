-- Fix: Drop foreign key constraint on author_id yang referensi auth.users
-- Karena sistem pakai NextAuth dengan tabel users (bukan auth.users)
-- Ownership tracking sekarang pakai kolom user_id

-- Drop the problematic foreign key constraint
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_author_id_fkey;

-- Make author_id just a nullable UUID without FK constraint
-- (column sudah ada, ini hanya untuk dokumentasi)
-- ALTER TABLE comments ALTER COLUMN author_id DROP NOT NULL;

-- Verify constraint is dropped
SELECT
    conname AS constraint_name,
    contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'comments'::regclass
  AND conname LIKE '%author_id%';

-- Expected: No results or only user_id constraint
