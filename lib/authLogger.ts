import { supabaseAdmin } from './supabase/server';

export async function logAuthEvent(level: 'info' | 'warn' | 'error', payload: Record<string, unknown>) {
  try {
    // Console log for local dev and debugging
    const ts = new Date().toISOString();
    console[level](`[AUTH:${level.toUpperCase()}] ${ts} -`, JSON.stringify(payload));

    // Best-effort: write to `auth_logs` table if available
    await supabaseAdmin.from('auth_logs').insert({ level, payload, created_at: new Date().toISOString() });
  } catch (e) {
    // Don't throw: logging must not break auth flow
    try {
      console.warn('[AUTH] failed to write auth_log:', (e as Error).message);
    } catch {
      // ignore
    }
  }
}

export default { logAuthEvent };
