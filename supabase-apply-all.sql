-- Combined apply script for QR Check-In enhancements
-- Run these statements in Supabase SQL editor in order. This file performs:
-- 1) Cleanup duplicate attendance rows (keeps earliest)
-- 2) Adds single_use/used columns to event_qr_codes
-- 3) Creates unique indexes for attendance deduplication
-- 4) Creates RPC function consume_checkin for atomic consume+insert

-- IMPORTANT: Review this file before running. Back up your DB if unsure.

-- ========== 1) Cleanup duplicate attendance rows ==========
-- Keeps the earliest scanned_at record per (event_id, lower(email)) and per (event_id, user_id)
WITH duplicates_email AS (
  SELECT id
  FROM (
    SELECT id,
      ROW_NUMBER() OVER (PARTITION BY event_id, lower(email) ORDER BY scanned_at ASC, id ASC) AS rn
    FROM attendance
    WHERE email IS NOT NULL
  ) t
  WHERE t.rn > 1
)
DELETE FROM attendance WHERE id IN (SELECT id FROM duplicates_email);

WITH duplicates_user AS (
  SELECT id
  FROM (
    SELECT id,
      ROW_NUMBER() OVER (PARTITION BY event_id, user_id ORDER BY scanned_at ASC, id ASC) AS rn
    FROM attendance
    WHERE user_id IS NOT NULL
  ) t
  WHERE t.rn > 1
)
DELETE FROM attendance WHERE id IN (SELECT id FROM duplicates_user);

-- ========== 2) Enhance event_qr_codes with single_use support ==========
ALTER TABLE IF EXISTS event_qr_codes
  ADD COLUMN IF NOT EXISTS single_use boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS used boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS used_at timestamptz NULL;

-- ========== 3) Add uniqueness constraints for attendance ==========
-- Ensure email uniqueness per event (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS ux_attendance_event_email_lower ON attendance (event_id, (lower(email))) WHERE email IS NOT NULL;

-- Ensure a user_id can only check in once per event
CREATE UNIQUE INDEX IF NOT EXISTS ux_attendance_event_user ON attendance (event_id, user_id) WHERE user_id IS NOT NULL;

-- ========== 4) RPC: consume_checkin(token text, name text, email text, user_id uuid, metadata jsonb) ==========
-- Performs atomic consume of single-use token (if configured), dedupe checks, and inserts attendance.

CREATE OR REPLACE FUNCTION public.consume_checkin(
  p_token text,
  p_name text,
  p_email text,
  p_user_id uuid,
  p_metadata jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_qr record;
  v_event_id uuid;
  v_norm_email text;
  v_att record;
BEGIN
  -- find token
  SELECT * INTO v_qr FROM event_qr_codes WHERE token = p_token LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_token');
  END IF;

  v_event_id := v_qr.event_id;

  -- check expiry
  IF v_qr.expires_at IS NOT NULL AND now() > v_qr.expires_at THEN
    RETURN jsonb_build_object('ok', false, 'error', 'token_expired');
  END IF;

  -- dedupe by user_id
  IF p_user_id IS NOT NULL THEN
    SELECT id INTO v_att FROM attendance WHERE event_id = v_event_id AND user_id = p_user_id LIMIT 1;
    IF FOUND THEN
      RETURN jsonb_build_object('ok', false, 'error', 'already_checked_in_user');
    END IF;
  END IF;

  -- normalize email
  IF p_email IS NOT NULL THEN
    v_norm_email := lower(trim(p_email));
    SELECT id INTO v_att FROM attendance WHERE event_id = v_event_id AND lower(email) = v_norm_email LIMIT 1;
    IF FOUND THEN
      RETURN jsonb_build_object('ok', false, 'error', 'already_checked_in_email');
    END IF;
  ELSE
    v_norm_email := NULL;
  END IF;

  -- If single_use token, attempt to mark as used atomically
  IF COALESCE(v_qr.single_use, false) THEN
    UPDATE event_qr_codes
    SET used = true, used_at = now()
    WHERE id = v_qr.id AND used = false
    RETURNING id INTO v_qr;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('ok', false, 'error', 'token_already_used');
    END IF;
  END IF;

  -- insert attendance
  INSERT INTO attendance (event_id, qr_token_id, user_id, name, email, metadata)
  VALUES (v_event_id, v_qr.id, p_user_id, p_name, v_norm_email, p_metadata)
  RETURNING * INTO v_att;

  RETURN jsonb_build_object('ok', true, 'attendance', to_jsonb(v_att));

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'error', 'internal_error', 'details', sqlerrm);
END;
$$;

-- Optional: grant execute to authenticated role (uncomment if desired)
-- GRANT EXECUTE ON FUNCTION public.consume_checkin(text,text,text,uuid,jsonb) TO authenticated;

-- End of combined script
