#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
  try {
    const { data, error } = await supabase.from('users').select('id,email,approved').eq('role', 'super_admin').limit(1);
    if (error) throw error;
    if (!data || data.length === 0) {
      console.log('❌ No super_admin user found. Run supabase-super-admin-seed.sql or create one manually.');
      process.exit(2);
    }
    const u = data[0];
    console.log(`✅ Found super_admin: id=${u.id} email=${u.email} approved=${u.approved}`);
    process.exit(0);
  } catch (e) {
    console.error('Error checking super_admin:', e.message || e);
    process.exit(1);
  }
}

check();
