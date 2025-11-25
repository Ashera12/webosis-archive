#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPassword() {
  const testEmail = process.argv[2] || 'admin@osis.sch.id';
  const testPassword = process.argv[3] || 'SuperAdmin123!';
  
  console.log(`\nTesting login for: ${testEmail}`);
  console.log(`Password: ${testPassword}\n`);
  
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, role, password_hash, email_verified, approved')
      .ilike('email', testEmail)
      .single();
    
    if (error) {
      console.error('❌ Error fetching user:', error.message);
      process.exit(1);
    }
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }
    
    console.log('✅ User found:');
    console.log('   Email:', user.email);
    console.log('   Name:', user.name);
    console.log('   Role:', user.role);
    console.log('   Verified:', user.email_verified ? '✓' : '✗');
    console.log('   Approved:', user.approved ? '✓' : '✗');
    console.log('   Has hash:', !!user.password_hash ? '✓' : '✗');
    
    if (!user.password_hash) {
      console.log('\n❌ No password hash found!');
      process.exit(1);
    }
    
    console.log('\nTesting password...');
    const valid = await bcrypt.compare(testPassword, user.password_hash);
    
    if (valid) {
      console.log('✅ Password MATCH! Login should work.');
    } else {
      console.log('❌ Password MISMATCH! Wrong password or hash corrupted.');
      console.log('\nHash starts with:', user.password_hash.substring(0, 20) + '...');
    }
    
  } catch (e) {
    console.error('Error:', e.message || e);
    process.exit(1);
  }
}

testPassword();
