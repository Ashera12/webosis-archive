import { z } from 'zod';

// Background settings schema (only public non-secret GLOBAL_BG_*)
export const BackgroundSettingsSchema = z.record(z.string(), z.string());

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

export function buildError(code: string, message: string, details?: any) {
  return { success: false, code, message, details };
}
