-- Cleanup duplicate attendance rows by keeping the earliest scanned_at per (event_id, lower(email)) and per (event_id, user_id)

-- 1) Remove duplicate emails per event, keep earliest scanned_at
WITH duplicates AS (
  SELECT id
  FROM (
    SELECT id,
      ROW_NUMBER() OVER (PARTITION BY event_id, lower(email) ORDER BY scanned_at ASC, id ASC) AS rn
    FROM attendance
    WHERE email IS NOT NULL
  ) t
  WHERE t.rn > 1
)
DELETE FROM attendance WHERE id IN (SELECT id FROM duplicates);

-- 2) Remove duplicate user_id per event, keep earliest scanned_at
WITH duplicates AS (
  SELECT id
  FROM (
    SELECT id,
      ROW_NUMBER() OVER (PARTITION BY event_id, user_id ORDER BY scanned_at ASC, id ASC) AS rn
    FROM attendance
    WHERE user_id IS NOT NULL
  ) t
  WHERE t.rn > 1
)
DELETE FROM attendance WHERE id IN (SELECT id FROM duplicates);

-- Note: Run this before creating unique indexes if you have duplicates in the DB.
