-- Fix events table to ensure id and created_at are returned after INSERT
-- Run this in Supabase SQL Editor

-- 1. Check current table structure
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'events'
ORDER BY ordinal_position;

-- 2. Create sequence for id if not exists (for bigint auto-increment)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'events_id_seq') THEN
    CREATE SEQUENCE events_id_seq;
    ALTER TABLE events ALTER COLUMN id SET DEFAULT nextval('events_id_seq');
    ALTER SEQUENCE events_id_seq OWNED BY events.id;
    -- Set sequence to start from max existing id + 1
    PERFORM setval('events_id_seq', COALESCE((SELECT MAX(id) FROM events), 0) + 1, false);
  END IF;
END $$;

-- 3. Ensure created_at has proper default
ALTER TABLE events 
  ALTER COLUMN created_at SET DEFAULT now();

-- 4. Ensure updated_at has trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Check RLS policies - make sure service role can insert and select
-- Disable RLS temporarily to test (DO NOT do this in production without understanding implications)
-- ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- Or add policy for service role
DROP POLICY IF EXISTS "Service role can do everything on events" ON events;
CREATE POLICY "Service role can do everything on events"
ON events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 6. Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'events';

-- 7. Test insert to verify id and created_at are generated
-- INSERT INTO events (title, event_date) VALUES ('Test Event', '2025-12-01') RETURNING *;
