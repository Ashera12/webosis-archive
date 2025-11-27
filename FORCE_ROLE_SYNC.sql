-- CRITICAL FIX: Force Role Sync & Clear Session Cache
-- Run this in Supabase SQL Editor to ensure role changes take effect immediately

-- 1. Check current user roles
SELECT id, email, name, role, approved, email_verified, updated_at 
FROM users 
ORDER BY updated_at DESC 
LIMIT 20;

-- 2. Update all users' updated_at to force session refresh
-- This will invalidate cached sessions and force re-fetch from DB
UPDATE users 
SET updated_at = NOW() 
WHERE role IN ('super_admin', 'admin', 'osis', 'moderator', 'editor', 'siswa', 'guru', 'other');

-- 3. Verify no NULL or invalid roles exist
SELECT id, email, role 
FROM users 
WHERE role IS NULL OR role = '' OR role NOT IN ('super_admin', 'admin', 'osis', 'moderator', 'editor', 'viewer', 'siswa', 'guru', 'other', 'pending');

-- 4. Fix any NULL or empty roles (set to 'siswa' as default)
UPDATE users 
SET role = 'siswa', updated_at = NOW()
WHERE role IS NULL OR role = '';

-- 5. Ensure all admin roles are lowercase and trimmed
UPDATE users 
SET role = LOWER(TRIM(role)), updated_at = NOW()
WHERE role != LOWER(TRIM(role));

-- 6. Check for users with pending approval but have admin roles
SELECT id, email, role, approved, email_verified 
FROM users 
WHERE role IN ('super_admin', 'admin', 'osis') AND approved = false;

-- 7. Auto-approve users with admin roles (they should always be approved)
UPDATE users 
SET approved = true, updated_at = NOW()
WHERE role IN ('super_admin', 'admin', 'osis') AND approved = false;

-- 8. Verify role distribution
SELECT role, COUNT(*) as count 
FROM users 
GROUP BY role 
ORDER BY count DESC;

-- 9. Check recent role changes
SELECT id, email, role, approved, email_verified, created_at, updated_at 
FROM users 
WHERE updated_at > NOW() - INTERVAL '1 hour'
ORDER BY updated_at DESC;

-- SUCCESS! All roles should now be synced and sessions will refresh on next request.
