#!/usr/bin/env node
// Probe the database using the repo's exec_sql RPC to list public tables
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
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing SUPABASE URL or service role key in environment. Check .env.local');
  process.exit(2);
}

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

(async () => {
  try {
    console.log('Probing public tables via exec_sql RPC...');
  const q = "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' ORDER BY tablename";
    let res;
    if (typeof supabase.rpc === 'function') {
      res = await supabase.rpc('exec_sql', { sql: q });
    } else {
      console.warn('supabase.rpc not available; probe skipped');
      process.exit(0);
    }
    if (res.error) {
      console.error('exec_sql returned error:', res.error.message || res.error);
      process.exit(3);
    }
    const rows = res.data || [];
    if (!Array.isArray(rows)) {
      console.log('exec_sql returned:', rows);
      process.exit(0);
    }
    const tables = rows.map((r) => Object.values(r)[0]);
    console.log('Public tables:', tables.join(', ') || '(none)');
    const candidates = ['attendance', 'attendances', 'event_attendance', 'event_attendances'];
    for (const c of candidates) {
      console.log(`${c}: ${tables.includes(c) ? 'FOUND' : 'missing'}`);
    }

    // Also show any tables starting with 'attend'
    const matches = tables.filter((t) => t && t.toLowerCase().startsWith('attend'));
    if (matches.length) console.log('Tables starting with "attend":', matches.join(', '));

    process.exit(0);
  } catch (e) {
    console.error('Probe failed:', e?.message || e);
    process.exit(4);
  }
})();
