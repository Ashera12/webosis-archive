-- Check for duplicate members by name
SELECT 
  name,
  COUNT(*) as total,
  STRING_AGG(id::TEXT, ', ') as member_ids,
  STRING_AGG(role::TEXT, ' | ') as roles,
  STRING_AGG(COALESCE(sekbid_id::TEXT, 'NULL'), ' | ') as sekbid_ids
FROM members
WHERE is_active = true
GROUP BY name
HAVING COUNT(*) > 1
ORDER BY total DESC;

-- Check all active members with their details
SELECT 
  id,
  name,
  role,
  sekbid_id,
  class,
  is_active,
  display_order
FROM members
WHERE is_active = true
  AND (sekbid_id IS NULL OR sekbid_id BETWEEN 1 AND 6)
ORDER BY display_order, name;

-- Count members by role
SELECT 
  role,
  COUNT(*) as total,
  STRING_AGG(name, ', ') as members
FROM members
WHERE is_active = true
  AND (sekbid_id IS NULL OR sekbid_id BETWEEN 1 AND 6)
GROUP BY role
ORDER BY total DESC;

-- Check for members with same name but different roles
SELECT 
  m1.id as id1,
  m1.name,
  m1.role as role1,
  m1.sekbid_id as sekbid1,
  m2.id as id2,
  m2.role as role2,
  m2.sekbid_id as sekbid2
FROM members m1
JOIN members m2 ON m1.name = m2.name AND m1.id < m2.id
WHERE m1.is_active = true AND m2.is_active = true
ORDER BY m1.name;
