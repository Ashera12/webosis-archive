#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
// Use global fetch available in modern Node.js

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

async function run(email) {
  try {
    const { data: user, error: userErr } = await supabase.from('users').select('id,email').ilike('email', email).limit(1).single();
    if (userErr || !user) {
      console.error('User not found:', userErr?.message || '(none)');
      process.exit(3);
    }
    console.log('Found user:', user);

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60).toISOString();

    const { error: insertErr } = await supabase.from('password_resets').insert({ user_id: user.id, token_hash: tokenHash, expires_at: expiresAt });
    if (insertErr) {
      console.error('Failed to insert reset token:', insertErr.message || insertErr);
      process.exit(4);
    }
    console.log('Inserted reset token. Raw token (use to reset):', token.slice(0,24) + '...');

    // Now call the reset API on dev server
    const newPassword = 'NewPassw0rd!';
    const res = await fetch('http://localhost:3001/api/auth/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, newPassword }) });
    const j = await res.json().catch(() => null);
    console.log('Reset API response:', res.status, j);
    process.exit(0);
  } catch (e) {
    console.error('Unexpected error', e?.message || e);
    process.exit(5);
  }
}

const email = process.argv[2];
if (!email) {
  console.log('Usage: node tools/test_reset_flow.js user@example.com');
  process.exit(1);
}

run(email);
