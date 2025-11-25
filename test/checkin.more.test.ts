
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createSupabaseMock } from './utils/createSupabaseMock';

async function loadPOSTWithMock(mockImpl: any) {
  vi.resetModules();
  // use doMock to avoid vi.mock hoisting issues when mocking per-test
  // mockImpl should be the module shape (e.g. { supabaseAdmin: { ... } })
  // doMock accepts a factory that will be used at import time
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  vi.doMock('@/lib/supabase/server', () => mockImpl);
  const mod = await import('@/app/api/events/checkin/route');
  return mod.POST;
}

describe('checkin additional cases', () => {
  beforeEach(() => {
    // noop (modules reset in loader)
  });

  it('returns token expired for past expires_at', async () => {
    const POST = await loadPOSTWithMock(createSupabaseMock({
      tables: { event_qr_codes: { singleData: { id: 'qr-exp', event_id: 1, token: 'tok-exp', expires_at: new Date(Date.now() - 60 * 1000).toISOString() } } },
    }));
    const req = { json: async () => ({ token: 'tok-exp' }) } as any;
    const res = await POST(req);
    const payload = await (res as any).json();
    expect(payload.error).toBe('Token expired');
  });

  it('rejects already checked in by email', async () => {
    const POST = await loadPOSTWithMock(createSupabaseMock({
      tables: {
        event_qr_codes: { singleData: { id: 'qr-2', event_id: 2, token: 'tok-2', expires_at: null } },
        attendance: { limitData: [{ id: 'a1' }] },
      },
    }));
    const req = { json: async () => ({ token: 'tok-2', email: 'x@Y.com' }) } as any;
    const res = await POST(req);
    const payload = await (res as any).json();
    expect(payload.ok).toBe(false);
    expect(payload.message || payload.error).toBeDefined();
  });

  it('rejects already checked in by user_id', async () => {
    const POST = await loadPOSTWithMock(createSupabaseMock({
      tables: {
        event_qr_codes: { singleData: { id: 'qr-3', event_id: 3, token: 'tok-3', expires_at: null } },
        attendance: { limitData: [{ id: 'u1' }] },
      },
    }));
    const req = { json: async () => ({ token: 'tok-3', user_id: 'user-1' }) } as any;
    const res = await POST(req);
    const payload = await (res as any).json();
    expect(payload.ok).toBe(false);
    expect(payload.message).toMatch(/User already checked in/i);
  });

  it('returns token_already_used when RPC signals it', async () => {
    const POST = await loadPOSTWithMock(createSupabaseMock({
      tables: { event_qr_codes: { singleData: { id: 'qr-4', event_id: 4, token: 'tok-4', expires_at: null, single_use: true } } },
      rpc: async (_n: string, _p: any) => ({ data: { ok: false, error: 'token_already_used' }, error: null }),
    }));
    const req = { json: async () => ({ token: 'tok-4', email: 'a@b.com' }) } as any;
    const res = await POST(req);
    const payload = await (res as any).json();
    expect(payload.ok).toBe(false);
    expect(payload.error).toBe('token_already_used');
  });
});
