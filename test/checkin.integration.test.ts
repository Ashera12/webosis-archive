import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Guard: only run when explicitly enabled to avoid accidental runs against live DB
const RUN = process.env.RUN_LIVE_INTEGRATION === '1';

if (!RUN) {
  // Provide a harmless placeholder test so Vitest doesn't error out on missing files
  describe('checkin integration (live) - SKIPPED', () => {
    it('skipped because RUN_LIVE_INTEGRATION!=1', () => {
      expect(true).toBe(true);
    });
  });
} else {
  describe('checkin integration (live)', () => {
    it('consume_checkin RPC works end-to-end (single-use token)', async () => {
      // Load .env.local if present
      const root = process.cwd();
      const envPath = root + '/.env.local';
      if (fs.existsSync(envPath)) {
        const raw = fs.readFileSync(envPath, 'utf8');
        raw.split(/\r?\n/).forEach((line) => {
          const m = line.match(/^\s*([A-Za-z0-9_]+)=(.*)$/);
          if (!m) return;
          let key = m[1];
          let val = m[2];
          if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
          if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
          process.env[key] = val;
        });
      }

      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
      const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
      if (!SUPABASE_URL || !SERVICE_ROLE) {
        throw new Error('Missing SUPABASE credentials in env; set RUN_LIVE_INTEGRATION=1 and provide .env.local');
      }

      const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

      // Setup: create event and qr token
      const eventRes = await supabase.from('events').insert([{ title: 'int-test-' + Date.now(), slug: 'int-test-' + Date.now() }]).select().single();
      expect(eventRes.error).toBeNull();
      const event = eventRes.data;

      const token = 'int-token-' + Date.now();
      const qrRes = await supabase.from('event_qr_codes').insert([{ event_id: event.id, token, single_use: true }]).select().single();
      expect(qrRes.error).toBeNull();
      const qr = qrRes.data;

      // Call RPC once - should succeed
      const r1 = await supabase.rpc('consume_checkin', { p_token: token, p_name: 'Tester', p_email: 'test@example.com', p_user_id: null, p_metadata: {} });
      expect(r1.error).toBeNull();
      expect(r1.data?.ok).toBe(true);

      // Call RPC second time - for single_use token should error
      const r2 = await supabase.rpc('consume_checkin', { p_token: token, p_name: 'Tester', p_email: 'test@example.com', p_user_id: null, p_metadata: {} });
      // either error or ok:false with token_already_used
      if (r2.error) {
        // acceptable if RPC returned sql error
      } else {
        expect(r2.data?.ok).toBe(false);
      }

      // Cleanup: delete attendance rows, qr, event
      await supabase.from('attendance').delete().eq('qr_token_id', qr.id);
      await supabase.from('event_qr_codes').delete().eq('id', qr.id);
      await supabase.from('events').delete().eq('id', event.id);
    }, 20000);
  });
}
