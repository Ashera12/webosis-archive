import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the supabase admin client used by the route
vi.mock('@/lib/supabase/server', () => {
  const mock = {
    from: (table: string) => {
      const chain: any = {
        select: (..._args: any[]) => chain,
        eq: (_col: string, _val: any) => chain,
        ilike: (_col: string, _val: any) => chain,
        limit: (_n: number) => chain,
        order: (..._args: any[]) => chain,
        single: async () => {
          if (table === 'event_qr_codes') {
            return { data: { id: 'qr-1', event_id: 'ev-1', token: 'tok-123', expires_at: null } };
          }
          return { data: [] };
        },
  insert: (payload: any) => ({ select: () => ({ single: async () => ({ data: { id: 'att-1', ...payload } }) }) }),
      };
      return chain;
    },
  };
  return { supabaseAdmin: { ...mock }, safeRpc: async (name: string, payload?: any) => ({ data: null, error: { message: 'rpc not available' } }) };
});

import { POST } from '@/app/api/events/checkin/route';

describe('checkin route', () => {
  it('records attendance with token and email', async () => {
    const req = { json: async () => ({ token: 'tok-123', email: 'Test@Example.com', name: 'Tester' }) } as any;
    const res = await POST(req);
    // robustly extract JSON from the NextResponse-like return
    let payload: any = null;
    if (res && typeof (res as any).json === 'function') {
      payload = await (res as any).json();
    } else if (res && (res as any).body) {
      try {
        payload = JSON.parse((res as any).body as string);
      } catch {
        payload = (res as any).body;
      }
    } else if (res && (res as any).ok !== undefined) {
      payload = res as any;
    }

    expect(payload).not.toBeNull();
    expect(payload.ok).toBe(true);
    expect(payload.attendance).toBeDefined();
    expect(payload.attendance.email).toBe('test@example.com');
  });
});
