-- Add DB-level constraints to reduce duplicate attendance

-- Ensure email uniqueness per event (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS ux_attendance_event_email_lower ON attendance (event_id, (lower(email))) WHERE email IS NOT NULL;

-- Ensure a user_id can only check in once per event
CREATE UNIQUE INDEX IF NOT EXISTS ux_attendance_event_user ON attendance (event_id, user_id) WHERE user_id IS NOT NULL;

-- (Optional) Consider single-use tokens: mark token as single_use and add a unique usage record or boolean
-- ALTER TABLE event_qr_codes ADD COLUMN IF NOT EXISTS single_use boolean DEFAULT false;

-- If you'd like tokens to be single-use, you can enforce by adding a check in the checkin handler to set
-- event_qr_codes.used = true and disallow reuse; a DB-level approach requires transaction and update checks.
