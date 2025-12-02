-- Add biometric_type column to track which authentication method user chose
-- This fixes issue where all biometric types show as "fingerprint"

-- Add biometric_type column
ALTER TABLE biometric_data 
ADD COLUMN IF NOT EXISTS biometric_type VARCHAR(50) DEFAULT 'fingerprint';

-- Add device_info to track which device was used for setup
ALTER TABLE biometric_data
ADD COLUMN IF NOT EXISTS device_info JSONB DEFAULT '{}'::jsonb;

-- Update comment
COMMENT ON COLUMN biometric_data.biometric_type IS 'Type of biometric used: face-id, touch-id, fingerprint, face-unlock, windows-hello-face, windows-hello-fingerprint, passkey, pin-code';
COMMENT ON COLUMN biometric_data.device_info IS 'Device and browser info: { userAgent, platform, deviceType, browser }';

-- Create index for biometric_type queries
CREATE INDEX IF NOT EXISTS idx_biometric_data_type ON biometric_data(biometric_type);

-- Also add to attendance table to track which method was used for each attendance
ALTER TABLE attendance
ADD COLUMN IF NOT EXISTS biometric_method_used VARCHAR(50);

COMMENT ON COLUMN attendance.biometric_method_used IS 'Which biometric method was used for this attendance verification';

-- Create index
CREATE INDEX IF NOT EXISTS idx_attendance_biometric_method ON attendance(biometric_method_used);

-- Update existing rows to have default 'fingerprint' for backward compatibility
UPDATE biometric_data 
SET biometric_type = 'fingerprint' 
WHERE biometric_type IS NULL;

UPDATE attendance 
SET biometric_method_used = 'fingerprint' 
WHERE biometric_method_used IS NULL 
  AND photo_selfie_url IS NOT NULL;
