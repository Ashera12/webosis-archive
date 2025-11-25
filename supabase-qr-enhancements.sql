-- Enhance event_qr_codes with single-use support and add DB-level uniqueness constraints

-- Add single_use, used, used_at columns to event_qr_codes
ALTER TABLE IF EXISTS event_qr_codes
  ADD COLUMN IF NOT EXISTS single_use boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS used boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS used_at timestamptz NULL;

-- Add uniqueness constraints for attendance (safe, non-destructive indexes)
CREATE UNIQUE INDEX IF NOT EXISTS ux_attendance_event_email_lower ON attendance (event_id, (lower(email))) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_attendance_event_user ON attendance (event_id, user_id) WHERE user_id IS NOT NULL;

-- Notes:
-- 1) Applying these changes in Supabase SQL editor will modify schema. The single_use/used columns are additive and safe.
-- 2) The unique indexes will prevent duplicates at DB level; if your app needs to tolerate existing duplicates, run cleanup before creating indexes.
-- 3) For single-use tokens we use an optimistic update in the checkin handler (update used = true WHERE id = ... AND used = false) to reduce race conditions.
