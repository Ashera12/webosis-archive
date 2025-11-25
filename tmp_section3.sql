-- Section 3: create unique indexes for attendance
CREATE UNIQUE INDEX IF NOT EXISTS ux_attendance_event_email_lower ON attendance (event_id, (lower(email))) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_attendance_event_user ON attendance (event_id, user_id) WHERE user_id IS NOT NULL;
