-- Check user data to diagnose NISN field issue
-- Run this in Supabase SQL Editor to see what data is actually stored

-- See all user fields for debugging
SELECT 
  id,
  name,
  nickname,
  email,
  nisn,
  nik,
  unit_sekolah,
  kelas,
  instagram_username,
  role,
  created_at
FROM users
ORDER BY created_at DESC
LIMIT 20;

-- Check if any NISN values look suspicious (not 10 digits or contains text)
SELECT 
  id,
  name,
  nisn,
  length(nisn) as nisn_length,
  CASE 
    WHEN nisn IS NULL THEN 'NULL'
    WHEN nisn ~ '^[0-9]{10}$' THEN 'Valid (10 digits)'
    ELSE 'Invalid format'
  END as nisn_status
FROM users
WHERE nisn IS NOT NULL
ORDER BY created_at DESC;

-- Check if any fields might be swapped or have wrong data
SELECT 
  id,
  name,
  nickname,
  nisn,
  nik,
  unit_sekolah
FROM users
WHERE nisn IS NOT NULL OR nik IS NOT NULL
ORDER BY created_at DESC
LIMIT 20;
