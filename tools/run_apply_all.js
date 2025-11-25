#!/usr/bin/env node
// Small helper to run supabase-apply-all.sql using the Supabase service role key
// Usage: node tools/run_apply_all.js

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
    // strip surrounding quotes
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    process.env[key] = val;
  });
}

// load .env.local if present
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

const sqlPath = path.join(repoRoot, 'supabase-apply-all.sql');
if (!fs.existsSync(sqlPath)) {
  console.error('supabase-apply-all.sql not found in repo root');
  process.exit(2);
}

const raw = fs.readFileSync(sqlPath, 'utf8');

function splitSections(sql) {
  const markers = /-- =+\s*(\d+)\)\s*(.*?)\r?\n/gi;
  const sections = [];
  const indices = [];
  let m;
  while ((m = markers.exec(sql)) !== null) {
    indices.push({ index: m.index, id: Number(m[1]), title: m[2].trim() });
  }
  if (indices.length === 0) return [{ id: 0, title: 'full', sql }];
  for (let i = 0; i < indices.length; i++) {
    const start = indices[i].index;
    const headerEnd = sql.indexOf('\n', start) + 1;
    const contentStart = headerEnd;
    const end = i + 1 < indices.length ? indices[i + 1].index : sql.length;
    const content = sql.slice(contentStart, end).trim();
    sections.push({ id: indices[i].id, title: indices[i].title, sql: content });
  }
  return sections;
}

(async () => {
  console.log('Running apply-all using Supabase service role.');
  console.log('SUPABASE_URL=', SUPABASE_URL);
  const sections = splitSections(raw);
  console.log('Found sections:', sections.map((s) => ({ id: s.id, title: s.title })));

  // Execute all sections in order (this is destructive as-per your confirmation)
  for (const s of sections) {
    console.log(`\n--- Executing section ${s.id}: ${s.title} ---\n`);
    try {
      // Use exec_sql RPC (existing repo expects this RPC). If it doesn't exist, attempt to run via SQL function call on "sql" channel
      // Guard against clients that don't expose rpc
      let res;
      if (typeof supabase.rpc === 'function') {
        res = await supabase.rpc('exec_sql', { sql: s.sql });
      } else {
        console.warn('supabase.rpc not available in this environment; skipping exec_sql for section', s.id);
        res = { data: null, error: new Error('rpc not available') };
      }
      if (res.error) {
        console.error('Section failed with error:', res.error.message || res.error);
        process.exit(3);
      }
      console.log('Section result:', res.data ?? '(no data)');
    } catch (e) {
      console.error('RPC call failed:', e?.message ?? e);
      process.exit(4);
    }
  }

  console.log('\nAll sections executed.');
  process.exit(0);
})();
