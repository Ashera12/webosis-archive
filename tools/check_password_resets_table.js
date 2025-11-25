#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function loadEnvFile(p) {
  if (!fs.existsSync(p)) return;
  const raw = fs.readFileSync(p, 'utf8');
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

loadEnvFile(path.join(process.cwd(), '.env.local'));
loadEnvFile(path.join(process.cwd(), '.env'));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing SUPABASE config in env');
  process.exit(2);
}

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

(async () => {
  try {
    const { data, error } = await supabase.rpc ? await supabase.from('password_resets').select('id, user_id, created_at').limit(1) : { data: null, error: new Error('rpc not available') };
    if (error) {
      console.error('Error checking password_resets:', error.message || error);
      process.exit(3);
    }
    console.log('password_resets table OK; sample row:', data && data.length ? data[0] : '(no rows)');
    process.exit(0);
  } catch (e) {
    console.error('Unexpected error:', e?.message || e);
    process.exit(4);
  }
})();
