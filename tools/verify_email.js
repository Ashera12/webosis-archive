#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyEmail() {
  const email = process.argv[2] || 'test@osis.sch.id';
  
  console.log(`\n✉️  Verifying email for: ${email}\n`);
  
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ email_verified: true })
      .eq('email', email)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
    
    if (!data) {
      console.log('❌ User not found');
      process.exit(1);
    }
    
    console.log('✅ Email verified successfully!');
    console.log('   Email:', data.email);
    console.log('   Name:', data.name);
    console.log('   Verified:', data.email_verified ? '✓' : '✗');
    console.log('   Approved:', data.approved ? '✓' : '✗');
    console.log('\nTry logging in again!\n');
    
  } catch (e) {
    console.error('Error:', e.message || e);
    process.exit(1);
  }
}

verifyEmail();
