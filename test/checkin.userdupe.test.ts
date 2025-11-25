import { it, expect, vi } from 'vitest';
import { createSupabaseMock } from './utils/createSupabaseMock';

vi.mock('@/lib/supabase/server', () => createSupabaseMock({
  tables: {
    event_qr_codes: { singleData: { id: 'qr-3', event_id: 3, token: 'tok-3', expires_at: null } },
    attendance: { limitData: [{ id: 'u1' }] },
  },
}));

import { POST } from '@/app/api/events/checkin/route';

it('rejects already checked in by user_id', async () => {
  const req = { json: async () => ({ token: 'tok-3', user_id: 'user-1' }) } as any;
  const res = await POST(req);
  const payload = await (res as any).json();
  expect(payload.ok).toBe(false);
  expect(payload.message).toMatch(/User already checked in/i);
});
