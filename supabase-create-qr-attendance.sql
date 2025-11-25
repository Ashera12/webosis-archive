-- Create tables for QR Check-In system

-- Table to store generated QR tokens for events
CREATE TABLE IF NOT EXISTS event_qr_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  token text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NULL,
  metadata jsonb NULL
);

-- Table to store attendance records
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  qr_token_id uuid NULL REFERENCES event_qr_codes(id) ON DELETE SET NULL,
  user_id uuid NULL,
  name text NULL,
  email text NULL,
  scanned_at timestamptz DEFAULT now(),
  metadata jsonb NULL
);

-- Indexes to help lookups
CREATE INDEX IF NOT EXISTS idx_event_qr_codes_token ON event_qr_codes(token);
CREATE INDEX IF NOT EXISTS idx_attendance_event_id ON attendance(event_id);
