import { z } from 'zod';

// ==============================================
// ATTENDANCE & BIOMETRIC VALIDATION SCHEMAS
// ==============================================

// Attendance submission schema
export const AttendanceSubmitSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  locationAccuracy: z.number().min(0),
  photoSelfieUrl: z.string().url(),
  fingerprintHash: z.string().min(10),
  wifiSSID: z.string().min(1),
  wifiBSSID: z.string().optional(),
  deviceInfo: z.object({
    userAgent: z.string(),
    platform: z.string(),
    language: z.string()
  }).optional(),
  networkInfo: z.object({
    ipAddress: z.string().optional(),
    macAddress: z.string().optional(),
    networkType: z.string().optional(),
    downlink: z.number().optional(),
    effectiveType: z.string().optional()
  }).optional(),
  aiVerification: z.object({
    verified: z.boolean(),
    matchScore: z.number().min(0).max(1),
    confidence: z.number().min(0).max(1),
    isLive: z.boolean(),
    provider: z.string()
  }).optional(),
  notes: z.string().optional()
});

// Biometric setup schema
export const BiometricSetupSchema = z.object({
  referencePhotoUrl: z.string().url(),
  fingerprintTemplate: z.string().min(10),
  webauthnCredentialId: z.string().nullable().optional(),
  userId: z.string().uuid().optional(),
  // ✅ ADD: Track which biometric method user selected
  biometricType: z.enum([
    'face-id',
    'touch-id', 
    'fingerprint',
    'face-unlock',
    'windows-hello-face',
    'windows-hello-fingerprint',
    'windows-hello-pin',
    'touch-id-mac',
    'passkey',
    'security-key',
    'pin-code'
  ]).optional().default('fingerprint'),
  deviceInfo: z.object({
    userAgent: z.string(),
    platform: z.string(),
    browser: z.string().optional(),
    deviceType: z.string().optional()
  }).optional()
});

// Biometric verification schema
export const BiometricVerifySchema = z.object({
  fingerprintHash: z.string().min(10),
  userId: z.string().uuid()
});

// AI face verification schema with refinement
export const AIFaceVerifySchema = z.object({
  userId: z.string().uuid(),
  currentPhotoUrl: z.string().url().optional(),
  liveSelfieBase64: z.string().optional(),
  referencePhotoUrl: z.string().url().optional()
}).refine(
  (data) => data.currentPhotoUrl || data.liveSelfieBase64,
  {
    message: "Either currentPhotoUrl or liveSelfieBase64 must be provided",
    path: ["currentPhotoUrl"]
  }
);

// ==============================================
// ADMIN SETTINGS VALIDATION SCHEMAS
// ==============================================

export const AdminSettingsUpdateSchema = z.object({
  key: z.string().min(1),
  value: z.string().nullable(),
  description: z.string().optional(),
  category: z.string().optional(),
  is_secret: z.boolean().optional()
});

// Background settings schema (enhanced with regex validation)
export const BackgroundSettingsSchema = z.object({
  background_type: z.enum(['color', 'gradient', 'image']).optional(),
  background_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  background_gradient: z.string().regex(/^linear-gradient\(/).optional(),
  background_image_url: z.string().url().nullable().optional()
});

// ==============================================
// USER & AUTH VALIDATION SCHEMAS
// ==============================================

export const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().regex(/^[0-9+\-\s()]+$/).optional(),
  avatar_url: z.string().url().nullable().optional()
});

export const PasswordChangeSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8)
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  }
);

// ==============================================
// COMMENT & POST VALIDATION SCHEMAS
// ==============================================

export const CreateCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  content_id: z.string().uuid(),
  content_type: z.enum(['event', 'post', 'announcement', 'gallery']),
  parent_id: z.string().uuid().nullable().optional()
});

// ==============================================
// GENERIC RESPONSE SCHEMAS
// ==============================================

export const BackgroundResponseSchema = z.object({
  success: z.boolean(),
  code: z.string(),
  settings: z.record(z.string(), z.string()).optional(),
  message: z.string().optional(),
});

// Member schema (subset for public listing)
export const MemberSchema = z.object({
  id: z.number(),
  name: z.string(),
  role: z.string().optional(),
  sekbid_id: z.number().nullable().optional(),
  is_active: z.boolean().optional(),
  photo_url: z.string().url().nullable().optional(),
  quote: z.string().nullable().optional(),
  display_order: z.number().nullable().optional(),
});

export const MembersResponseSchema = z.object({
  success: z.boolean(),
  code: z.string(),
  members: z.array(MemberSchema).optional(),
  message: z.string().optional(),
});

export function buildSuccess<T extends object>(code: string, data: T) {
  return { success: true, code, ...data };
}

export function buildError(code: string, message: string, details?: unknown) {
  return { success: false, code, message, details };
}
