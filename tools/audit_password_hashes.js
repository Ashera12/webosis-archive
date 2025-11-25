#!/usr/bin/env node
// Audit users table for non-bcrypt password_hash values.
// Usage: node tools/audit_password_hashes.js

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment. Set .env.local');
  process.exit(2);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

(async () => {
  try {
    console.log('Querying users table for non-bcrypt hashes...');
    const { data, error } = await supabase.from('users').select('id,email,password_hash');
    if (error) throw error;
    const rows = data || [];
    const nonBcrypt = rows.filter((r) => {
      const h = (r.password_hash || '').toString();
      return !(h.startsWith('$2') || h.startsWith('$argon2') || h === '' || h === null);
    });
    console.log(`Found ${nonBcrypt.length} users with non-bcrypt-looking hashes.`);
    if (nonBcrypt.length > 0) {
      console.table(nonBcrypt.map((r) => ({ id: r.id, email: r.email })));
      const out = nonBcrypt.map((r) => `${r.id},${r.email}`).join('\n');
      fs.writeFileSync(path.join(process.cwd(), 'non_bcrypt_users.csv'), out);
      console.log('Wrote non_bcrypt_users.csv to repo root. Review and plan migration/reset.');
    }
    process.exit(0);
  } catch (e) {
    console.error('Audit failed', e.message || e);
    process.exit(3);
  }
})();
