#!/usr/bin/env node
// Backup duplicate attendance rows (those that would be deleted by cleanup) into backups/ as JSON and CSV
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

const outDir = path.join(repoRoot, 'backups');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function run() {
  try {
    console.log('Backing up duplicate attendance rows (email duplicates)...');
    const q1 = `SELECT * FROM (
      SELECT *, ROW_NUMBER() OVER (PARTITION BY event_id, lower(email) ORDER BY scanned_at ASC, id ASC) AS rn
      FROM attendance
      WHERE email IS NOT NULL
    ) t WHERE t.rn > 1`;
    let res;
    if (typeof supabase.rpc === 'function') {
      res = await supabase.rpc('exec_sql', { sql: q1 });
    } else {
      console.warn('supabase.rpc not available; skipping backup of email duplicates');
      res = { data: [], error: new Error('rpc not available') };
    }
    if (res.error) { console.error('Error selecting email duplicates:', res.error); } else {
      const rows = res.data || [];
      const jsonPath = path.join(outDir, 'duplicates_email.json');
      fs.writeFileSync(jsonPath, JSON.stringify(rows, null, 2));
      // CSV
      const csvPath = path.join(outDir, 'duplicates_email.csv');
      if (rows.length) {
        const keys = Object.keys(rows[0]);
        const csv = [keys.join(',')].concat(rows.map(r => keys.map(k => JSON.stringify(r[k] ?? '')).join(','))).join('\n');
        fs.writeFileSync(csvPath, csv);
      } else {
        fs.writeFileSync(csvPath, '');
      }
      console.log(`Email duplicates backed up: ${rows.length} rows -> ${jsonPath}, ${csvPath}`);
    }

    console.log('Backing up duplicate attendance rows (user_id duplicates)...');
    const q2 = `SELECT * FROM (
      SELECT *, ROW_NUMBER() OVER (PARTITION BY event_id, user_id ORDER BY scanned_at ASC, id ASC) AS rn
      FROM attendance
      WHERE user_id IS NOT NULL
    ) t WHERE t.rn > 1`;
    if (typeof supabase.rpc === 'function') {
      res = await supabase.rpc('exec_sql', { sql: q2 });
    } else {
      console.warn('supabase.rpc not available; skipping backup of user duplicates');
      res = { data: [], error: new Error('rpc not available') };
    }
    if (res.error) { console.error('Error selecting user duplicates:', res.error); } else {
      const rows = res.data || [];
      const jsonPath = path.join(outDir, 'duplicates_user.json');
      fs.writeFileSync(jsonPath, JSON.stringify(rows, null, 2));
      const csvPath = path.join(outDir, 'duplicates_user.csv');
      if (rows.length) {
        const keys = Object.keys(rows[0]);
        const csv = [keys.join(',')].concat(rows.map(r => keys.map(k => JSON.stringify(r[k] ?? '')).join(','))).join('\n');
        fs.writeFileSync(csvPath, csv);
      } else {
        fs.writeFileSync(csvPath, '');
      }
      console.log(`User duplicates backed up: ${rows.length} rows -> ${jsonPath}, ${csvPath}`);
    }

    console.log('Backup complete. Files are in backups/');
    process.exit(0);
  } catch (e) {
    console.error('Backup failed:', e?.message || e);
    process.exit(3);
  }
}

run();
