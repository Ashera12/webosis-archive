-- ====================================
-- CLEANUP CORRUPTED NISN DATA
-- ====================================
-- Issue: NISN field contains wrong data (e.g., "bilaniumn1" instead of 10-digit number)
-- Cause: Possibly wrong field mapping in old code or manual database edits
-- Solution: Clear invalid NISN values

-- STEP 1: Check current NISN data quality
-- Run this first to see what data is corrupted
SELECT 
  id,
  email,
  name,
  nickname,
  nisn,
  length(nisn) as nisn_length,
  CASE 
    WHEN nisn IS NULL THEN '✅ NULL (OK - not filled)'
    WHEN nisn ~ '^[0-9]{10}$' THEN '✅ Valid (10 digits)'
    WHEN nisn ~ '^[0-9]+$' AND length(nisn) != 10 THEN '⚠️ Numbers but wrong length'
    ELSE '❌ Invalid (contains non-digits or wrong format)'
  END as status,
  CASE
    WHEN nisn = nickname THEN '⚠️ NISN matches nickname'
    WHEN nisn = email THEN '⚠️ NISN matches email'
    WHEN nisn LIKE '%@%' THEN '⚠️ NISN contains @ (email-like)'
    ELSE 'OK'
  END as data_issue
FROM users
WHERE nisn IS NOT NULL
ORDER BY 
  CASE 
    WHEN nisn ~ '^[0-9]{10}$' THEN 2
    WHEN nisn ~ '^[0-9]+$' THEN 1
    ELSE 0
  END,
  created_at DESC;

-- STEP 2: Preview what will be cleaned
-- This shows which records will be affected by the cleanup
SELECT 
  id,
  email,
  name,
  nisn as current_nisn,
  'Will be set to NULL' as action
FROM users
WHERE nisn IS NOT NULL 
  AND NOT (nisn ~ '^[0-9]{10}$')
ORDER BY created_at DESC;

-- STEP 3: BACKUP before cleanup (IMPORTANT!)
-- Create a backup table before making changes
CREATE TABLE IF NOT EXISTS users_nisn_backup AS
SELECT id, email, name, nisn, created_at, updated_at
FROM users
WHERE nisn IS NOT NULL;

-- Verify backup was created
SELECT COUNT(*) as backup_count FROM users_nisn_backup;

-- STEP 4: CLEANUP - Clear all invalid NISN values
-- ⚠️ WARNING: This will set invalid NISN values to NULL
-- Only run this after reviewing STEP 1 and STEP 2

-- Option A: Clear all non-numeric or wrong-length NISN
UPDATE users
SET nisn = NULL
WHERE nisn IS NOT NULL 
  AND NOT (nisn ~ '^[0-9]{10}$');

-- STEP 5: Verify cleanup was successful
SELECT 
  COUNT(*) as total_users,
  COUNT(nisn) as users_with_nisn,
  COUNT(CASE WHEN nisn ~ '^[0-9]{10}$' THEN 1 END) as valid_nisn,
  COUNT(CASE WHEN nisn IS NOT NULL AND NOT (nisn ~ '^[0-9]{10}$') THEN 1 END) as invalid_nisn
FROM users;

-- STEP 6: Show remaining NISN data after cleanup
SELECT 
  id,
  email,
  name,
  nisn,
  length(nisn) as nisn_length
FROM users
WHERE nisn IS NOT NULL
ORDER BY created_at DESC
LIMIT 20;

-- ====================================
-- RESTORATION (if needed)
-- ====================================
-- If you need to restore the data, use this query:
-- (Only use if cleanup went wrong!)

-- Restore from backup
-- UPDATE users u
-- SET nisn = b.nisn
-- FROM users_nisn_backup b
-- WHERE u.id = b.id;

-- Drop backup table after confirming cleanup is correct
-- DROP TABLE users_nisn_backup;

-- ====================================
-- PREVENTION - Check for other corrupted fields
-- ====================================

-- Check NIK field (should be 16 digits or NULL)
SELECT 
  id,
  email,
  name,
  nik,
  length(nik) as nik_length,
  CASE 
    WHEN nik IS NULL THEN '✅ NULL'
    WHEN nik ~ '^[0-9]{16}$' THEN '✅ Valid'
    ELSE '❌ Invalid'
  END as status
FROM users
WHERE nik IS NOT NULL
  AND NOT (nik ~ '^[0-9]{16}$')
ORDER BY created_at DESC;

-- Check for duplicate NISN (should be unique)
SELECT nisn, COUNT(*) as duplicate_count
FROM users
WHERE nisn IS NOT NULL
GROUP BY nisn
HAVING COUNT(*) > 1;

-- Check for nickname = email (might indicate wrong mapping)
SELECT id, email, name, nickname
FROM users
WHERE nickname = SUBSTRING(email FROM '^([^@]+)')
ORDER BY created_at DESC
LIMIT 20;
