import { it, expect, vi } from 'vitest';
import { createSupabaseMock } from './utils/createSupabaseMock';

vi.mock('@/lib/supabase/server', () => createSupabaseMock({
  tables: {
    event_qr_codes: { singleData: { id: 'qr-4', event_id: 4, token: 'tok-4', expires_at: null, single_use: true } },
    attendance: { limitData: [] },
  },
  rpc: async (_name: string, _payload: any) => ({ data: { ok: false, error: 'token_already_used' }, error: null }),
}));

import { POST } from '@/app/api/events/checkin/route';

it('returns token_already_used when RPC signals it', async () => {
  const req = { json: async () => ({ token: 'tok-4', email: 'a@b.com' }) } as any;
  const res = await POST(req);
  const payload = await (res as any).json();
  expect(payload.ok).toBe(false);
  expect(payload.error).toBe('token_already_used');
});
