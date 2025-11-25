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

const migrationPath = path.join(process.cwd(), 'migrations', '001-create-password-resets.sql');
if (!fs.existsSync(migrationPath)) {
  console.error('Migration file not found:', migrationPath);
  process.exit(2);
}

const sql = fs.readFileSync(migrationPath, 'utf8');

(async () => {
  try {
    if (typeof supabase.rpc !== 'function') {
      console.error('supabase.rpc not available in this environment; cannot run migration automatically.');
      process.exit(3);
    }
    console.log('Running migration via exec_sql RPC...');
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    if (error) {
      console.error('Migration failed:', error.message || error);
      process.exit(4);
    }
    console.log('Migration ran successfully:', data);
    process.exit(0);
  } catch (e) {
    console.error('Unexpected error running migration:', e?.message || e);
    process.exit(5);
  }
})();
