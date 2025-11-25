#!/usr/bin/env node
// Create an `attendance` table if missing, then run non-destructive previews to show duplicate groups.
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

const createTableSQL = `
-- Use types compatible with existing tables: events.id is bigint, users.id is uuid
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id bigint NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  qr_token_id bigint NULL,
  user_id uuid NULL,
  name text NULL,
  email text NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  scanned_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_attendance_event ON attendance(event_id);
`;

async function run() {
  try {
    console.log('Creating attendance table (IF NOT EXISTS)...');
    let res;
    if (typeof supabase.rpc === 'function') {
      res = await supabase.rpc('exec_sql', { sql: createTableSQL });
    } else {
      console.warn('supabase.rpc not available; skipping create table step');
      res = { data: null, error: new Error('rpc not available') };
    }
    if (res.error) {
      console.error('Error creating table:', res.error.message || res.error);
      process.exit(3);
    }
    console.log('Create table result:', res.data || res);

    // Report basic stats
    const statsQ = `SELECT
      (SELECT count(*) FROM attendance) AS total,
      (SELECT count(*) FROM (SELECT event_id, lower(email) as e, count(*) FROM attendance WHERE email IS NOT NULL GROUP BY event_id, lower(email) HAVING count(*) > 1) t) as duplicate_email_groups,
      (SELECT count(*) FROM (SELECT event_id, user_id, count(*) FROM attendance WHERE user_id IS NOT NULL GROUP BY event_id, user_id HAVING count(*) > 1) t) as duplicate_user_groups
    `;
    if (typeof supabase.rpc === 'function') {
      res = await supabase.rpc('exec_sql', { sql: statsQ });
    } else {
      console.warn('supabase.rpc not available; skipping stats query');
      res = { data: null, error: new Error('rpc not available') };
    }
    if (res.error) {
      console.error('Error fetching stats:', res.error.message || res.error);
      process.exit(4);
    }
    const statsRow = Array.isArray(res.data) && res.data.length ? res.data[0] : res.data;
    console.log('Attendance stats:', statsRow || res.data);

    // Show sample duplicate groups for email and user
    const dupEmailQ = `SELECT event_id, lower(email) as email_lower, count(*) as cnt
      FROM attendance WHERE email IS NOT NULL
      GROUP BY event_id, lower(email)
      HAVING count(*) > 1
      ORDER BY cnt DESC LIMIT 20`;
    if (typeof supabase.rpc === 'function') {
      res = await supabase.rpc('exec_sql', { sql: dupEmailQ });
    } else {
      console.warn('supabase.rpc not available; skipping duplicate-email query');
      res = { data: null, error: new Error('rpc not available') };
    }
    if (res.error) {
      console.error('Error fetching duplicate-email groups:', res.error.message || res.error);
    } else {
      console.log('Duplicate (by email) groups sample:', res.data || []);
    }

    const dupUserQ = `SELECT event_id, user_id, count(*) as cnt
      FROM attendance WHERE user_id IS NOT NULL
      GROUP BY event_id, user_id
      HAVING count(*) > 1
      ORDER BY cnt DESC LIMIT 20`;
    if (typeof supabase.rpc === 'function') {
      res = await supabase.rpc('exec_sql', { sql: dupUserQ });
    } else {
      console.warn('supabase.rpc not available; skipping duplicate-user query');
      res = { data: null, error: new Error('rpc not available') };
    }
    if (res.error) {
      console.error('Error fetching duplicate-user groups:', res.error.message || res.error);
    } else {
      console.log('Duplicate (by user_id) groups sample:', res.data || []);
    }

    console.log('\nDone. No destructive actions were taken.');
    process.exit(0);
  } catch (e) {
    console.error('Unexpected error:', e?.message || e);
    process.exit(5);
  }
}

run();
