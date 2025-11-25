import { it, expect, vi } from 'vitest';
import { createSupabaseMock } from './utils/createSupabaseMock';

vi.mock('@/lib/supabase/server', () => createSupabaseMock({
  tables: {
    event_qr_codes: { singleData: { id: 'qr-2', event_id: 2, token: 'tok-2', expires_at: null } },
    attendance: { limitData: [{ id: 'a1' }] },
  },
}));

import { POST } from '@/app/api/events/checkin/route';

it('rejects already checked in by email', async () => {
  const req = { json: async () => ({ token: 'tok-2', email: 'x@Y.com' }) } as any;
  const res = await POST(req);
  const payload = await (res as any).json();
  expect(payload.ok).toBe(false);
  expect(payload.message || payload.error).toBeDefined();
});
