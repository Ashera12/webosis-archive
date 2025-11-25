#!/usr/bin/env node
// Approve (or unapprove) a user directly using the Supabase service role key.
// Usage: node tools/approve_user_direct.js <user_id> --approve|--reject [--admin_id=<id>]

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

const argv = process.argv.slice(2);
if (argv.length === 0) {
  console.error('Usage: node tools/approve_user_direct.js <user_id> --approve|--reject [--admin_id=<id>]');
  process.exit(1);
}

const userId = argv[0];
const approve = argv.includes('--approve');
const reject = argv.includes('--reject');
const adminIdArg = argv.find((a) => a.startsWith('--admin_id='));
const adminId = adminIdArg ? adminIdArg.split('=')[1] : null;

(async () => {
  try {
    if (!userId || (!approve && !reject)) {
      console.error('Provide user id and either --approve or --reject');
      process.exit(1);
    }
    const approved = !!approve;
    console.log(`Setting approved=${approved} for user ${userId}`);
    const { data, error } = await supabase.from('users').update({ approved }).eq('id', userId).select('id,email').single();
    if (error) throw error;
    console.log('Updated users:', data);

    // insert admin action audit
    try {
      const { error: aErr } = await supabase.from('admin_actions').insert({ user_id: adminId || null, action: 'user_approval_changed', payload: { target_user_id: userId, approved }, created_at: new Date().toISOString() });
      if (aErr) console.warn('Failed to insert admin_actions audit', aErr.message || aErr);
    } catch (e) {
      console.warn('admin action insert failed', e.message || e);
    }

    console.log('Done. Consider notifying the user via email (repo has mailer in lib/mailer.ts).');
    process.exit(0);
  } catch (e) {
    console.error('Approve failed', e.message || e);
    process.exit(3);
  }
})();
