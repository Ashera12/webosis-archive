-- Add re_enrollment_allowed flag to biometric_data table
ALTER TABLE biometric_data
ADD COLUMN IF NOT EXISTS re_enrollment_allowed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS re_enrollment_reason TEXT,
ADD COLUMN IF NOT EXISTS re_enrollment_approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS re_enrollment_approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_first_attendance_enrollment BOOLEAN DEFAULT TRUE;

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_biometric_re_enrollment 
ON biometric_data(user_id, re_enrollment_allowed) 
WHERE re_enrollment_allowed = TRUE;

-- Comment
COMMENT ON COLUMN biometric_data.re_enrollment_allowed IS 'Admin dapat mengizinkan user untuk re-enrollment jika ada masalah';
COMMENT ON COLUMN biometric_data.re_enrollment_reason IS 'Alasan mengapa re-enrollment diperlukan';
COMMENT ON COLUMN biometric_data.is_first_attendance_enrollment IS 'TRUE jika data biometrik ini diambil saat absensi pertama';
