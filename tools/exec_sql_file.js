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
const repoRoot = process.cwd();
loadEnvFile(path.join(repoRoot, '.env.local'));
loadEnvFile(path.join(repoRoot, '.env'));
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
if (!SUPABASE_URL || !SERVICE_ROLE) { console.error('Missing SUPABASE URL or service role key'); process.exit(2); }
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

const file = process.argv[2];
if (!file) { console.error('Usage: node exec_sql_file.js <path-to-sql-file>'); process.exit(2); }

const sqlPath = path.isAbsolute(file) ? file : path.join(repoRoot, file);
if (!fs.existsSync(sqlPath)) { console.error('File not found:', sqlPath); process.exit(3); }
const sql = fs.readFileSync(sqlPath, 'utf8');

(async () => {
  try {
    console.log('Executing SQL from', sqlPath);
    let res;
    if (typeof supabase.rpc === 'function') {
      res = await supabase.rpc('exec_sql', { sql });
    } else {
      console.warn('supabase.rpc not available; skipping exec_sql');
      process.exit(0);
    }
    if (res.error) {
      console.error('exec_sql error:', res.error.message || res.error);
      process.exit(4);
    }
    console.log('exec_sql result:', res.data || res);
    process.exit(0);
  } catch (e) { console.error('Unexpected error:', e?.message || e); process.exit(5); }
})();
