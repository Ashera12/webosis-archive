-- Cleanup and fix events with NULL id
-- Run this in Supabase SQL Editor

-- Step 1: Check how many events have NULL id
SELECT COUNT(*) as null_id_count FROM events WHERE id IS NULL;

-- Step 2: Show events with NULL id
SELECT title, event_date, description, created_at, updated_at 
FROM events 
WHERE id IS NULL 
ORDER BY updated_at DESC;

-- Step 3: Delete events with NULL id (they can't be managed anyway)
-- BACKUP first by creating a temporary table
CREATE TEMP TABLE events_null_id_backup AS 
SELECT * FROM events WHERE id IS NULL;

-- Now delete NULL id events
DELETE FROM events WHERE id IS NULL;

-- Step 4: Verify deletion
SELECT COUNT(*) as remaining_null_ids FROM events WHERE id IS NULL;

-- Step 5: Show all remaining events
SELECT id, title, event_date, location FROM events ORDER BY event_date DESC;

-- Step 6: If you need to restore from backup (run this only if needed)
-- INSERT INTO events SELECT * FROM events_null_id_backup;
