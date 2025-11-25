import { it, expect, vi } from 'vitest';

vi.mock('@/lib/supabase/server', () => {
  const mock = {
    from: (table: string) => {
      const chain: any = {
        select: (..._a: any[]) => chain,
        eq: (_c: string, _v: any) => chain,
        limit: (_n: number) => chain,
        single: async () => {
          if (table === 'event_qr_codes') {
            return { data: { id: 'qr-exp', event_id: 1, token: 'tok-exp', expires_at: new Date(Date.now() - 60 * 1000).toISOString() } };
          }
          return { data: [] };
        },
      };
      return chain;
    },
    rpc: async () => ({ data: null, error: { message: 'rpc not found' } }),
  };
  return { supabaseAdmin: { ...mock }, safeRpc: async (name: string, payload?: any) => ({ data: null, error: { message: 'rpc not found' } }) };
});

import { POST } from '@/app/api/events/checkin/route';

it('returns token expired for past expires_at', async () => {
  const req = { json: async () => ({ token: 'tok-exp' }) } as any;
  const res = await POST(req);
  const payload = await (res as any).json();
  expect(payload.error).toBe('Token expired');
});
