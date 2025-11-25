-- Section 1 (destructive): delete duplicate attendance rows, return counts
WITH duplicates_email AS (
  SELECT id
  FROM (
    SELECT id,
      ROW_NUMBER() OVER (PARTITION BY event_id, lower(email) ORDER BY scanned_at ASC, id ASC) AS rn
    FROM attendance
    WHERE email IS NOT NULL
  ) t
  WHERE t.rn > 1
), deleted_email AS (
  DELETE FROM attendance WHERE id IN (SELECT id FROM duplicates_email) RETURNING 1
), duplicates_user AS (
  SELECT id
  FROM (
    SELECT id,
      ROW_NUMBER() OVER (PARTITION BY event_id, user_id ORDER BY scanned_at ASC, id ASC) AS rn
    FROM attendance
    WHERE user_id IS NOT NULL
  ) t
  WHERE t.rn > 1
), deleted_user AS (
  DELETE FROM attendance WHERE id IN (SELECT id FROM duplicates_user) RETURNING 1
)
SELECT json_build_object(
  'deleted_email', (SELECT count(*) FROM deleted_email),
  'deleted_user', (SELECT count(*) FROM deleted_user)
) AS result;
