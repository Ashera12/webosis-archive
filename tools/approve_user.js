#!/usr/bin/env node
// Approve or reject a user by id or email using the Supabase service role.
// Usage: node tools/approve_user.js --id <user-id> --approve true
//        node tools/approve_user.js --email user@example.com --approve true

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

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--id') out.id = args[++i];
    else if (a === '--email') out.email = args[++i];
    else if (a === '--approve') out.approve = args[++i];
    else if (a === '--help' || a === '-h') { out.help = true; }
  }
  return out;
}

async function run() {
  const opts = parseArgs();
  if (opts.help || (!opts.id && !opts.email) || typeof opts.approve === 'undefined') {
    console.log('Usage: node tools/approve_user.js --id <user-id> | --email <email> --approve true|false');
    process.exit(0);
  }
  const approve = String(opts.approve).toLowerCase() === 'true';
  try {
    let user;
    if (opts.id) {
      const { data, error } = await supabase.from('users').select('id,email,approved').eq('id', opts.id).single();
      if (error) {
        console.error('Failed to find user by id', error.message || error);
        process.exit(3);
      }
      user = data;
    } else {
      const { data, error } = await supabase.from('users').select('id,email,approved').ilike('email', opts.email).limit(1).single();
      if (error) {
        console.error('Failed to find user by email', error.message || error);
        process.exit(4);
      }
      user = data;
    }

    console.log('Found user:', user);

    const { error: updErr } = await supabase.from('users').update({ approved: approve }).eq('id', user.id);
    if (updErr) {
      console.error('Failed to update approval', updErr.message || updErr);
      process.exit(5);
    }

    try {
      await supabase.from('admin_actions').insert({ user_id: null, action: 'user_approval_changed_cli', payload: { target_user_id: user.id, approved: approve }, created_at: new Date().toISOString() });
    } catch (e) {
      console.warn('Failed to insert admin_actions audit row', e?.message || e);
    }

    console.log(`User ${user.email} approval set to ${approve}`);
    process.exit(0);
  } catch (e) {
    console.error('Unexpected error', e?.message || e);
    process.exit(6);
  }
}

run();
