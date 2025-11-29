-- STEP 1: Find duplicate members by name
SELECT 
  name,
  COUNT(*) as count,
  STRING_AGG(id::TEXT, ', ' ORDER BY id) as all_ids,
  STRING_AGG(role::TEXT, ' | ' ORDER BY id) as all_roles,
  STRING_AGG(COALESCE(sekbid_id::TEXT, 'NULL'), ' | ' ORDER BY id) as all_sekbid_ids
FROM members
WHERE is_active = true
GROUP BY name
HAVING COUNT(*) > 1
ORDER BY count DESC, name;

-- STEP 2: Show all details of duplicates
WITH duplicates AS (
  SELECT name
  FROM members
  WHERE is_active = true
  GROUP BY name
  HAVING COUNT(*) > 1
)
SELECT 
  m.id,
  m.name,
  m.role,
  m.sekbid_id,
  s.name as sekbid_name,
  m.class,
  m.photo_url,
  m.display_order,
  m.created_at
FROM members m
LEFT JOIN sekbid s ON m.sekbid_id = s.id
WHERE m.name IN (SELECT name FROM duplicates)
  AND m.is_active = true
ORDER BY m.name, m.id;

-- STEP 3: After reviewing above, you can delete duplicates manually
-- Example (DO NOT RUN YET - review data first):
-- DELETE FROM members WHERE id IN (37, 24, 26, 27, 22); -- Keep the newer ones with proper sekbid_id

-- STEP 4: Verify no more duplicates
SELECT 
  name,
  COUNT(*) as count
FROM members
WHERE is_active = true
GROUP BY name
HAVING COUNT(*) > 1;
