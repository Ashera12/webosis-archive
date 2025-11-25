import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!serviceRoleKey) {
  // Helpful dev-time warning when the service role key isn't provided
  // (common on contributor machines or CI without secrets). This
  // explains why `supabaseAdmin` requests may fail with empty errors.
  console.warn('WARNING: SUPABASE_SERVICE_ROLE_KEY is not set. supabaseAdmin requests may fail.');
}
// Do not log secrets. Avoid printing SUPABASE_SERVICE_ROLE_KEY even in development.
// Server-only Supabase client using the Service Role key (never expose to client)
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Provide a safe fallback for `rpc` in environments where the client
// doesn't expose it (some test mocks or lightweight Supabase clients).
// This prevents `TypeError: supabaseAdmin.rpc is not a function` across
// many server routes that call `supabaseAdmin.rpc(...)` and rely on a
// graceful error handling path.
if (typeof (supabaseAdmin as any).rpc !== 'function') {
  (supabaseAdmin as any).rpc = async (fnName: string, payload?: any) => {
    console.warn(`supabaseAdmin.rpc fallback called for ${fnName}; rpc not available on client`);
    return { data: null, error: new Error('rpc not available') };
  };
}

/**
 * Safe RPC wrapper that callers can import to avoid checking `supabaseAdmin.rpc`
 * at each callsite. Returns the same shape as supabase-js `{ data, error }`.
 */
export async function safeRpc(fnName: string, payload?: any) {
  if (typeof (supabaseAdmin as any).rpc === 'function') {
    try {
      return await (supabaseAdmin as any).rpc(fnName, payload);
    } catch (e) {
      console.warn('safeRpc rpc call failed', fnName, e);
      return { data: null, error: e };
    }
  }
  console.warn(`safeRpc: rpc not available for ${fnName}`);
  return { data: null, error: new Error('rpc not available') };
}
