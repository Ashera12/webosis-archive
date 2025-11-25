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

async function createTestUser() {
  const testEmail = 'test@osis.sch.id';
  const testPassword = 'Test123!';
  const testName = 'Test User (Unverified)';
  
  console.log('\n🔧 Creating test user...');
  console.log('   Email:', testEmail);
  console.log('   Password:', testPassword);
  console.log('   Status: NOT verified, NOT approved\n');
  
  try {
    // Hash password
    const hash = await bcrypt.hash(testPassword, 10);
    
    // Create user
    const { data, error } = await supabase
      .from('users')
      .insert({
        email: testEmail,
        name: testName,
        password_hash: hash,
        role: 'siswa',
        email_verified: false,
        approved: false,
      })
      .select()
      .single();
    
    if (error) {
      if (error.code === '23505') {
        console.log('⚠️  User already exists, updating...');
        const { error: updateError } = await supabase
          .from('users')
          .update({
            password_hash: hash,
            email_verified: false,
            approved: false,
          })
          .eq('email', testEmail);
        
        if (updateError) {
          console.error('❌ Error updating user:', updateError.message);
          process.exit(1);
        }
        console.log('✅ User updated (reset to unverified/unapproved)');
      } else {
        console.error('❌ Error creating user:', error.message);
        process.exit(1);
      }
    } else {
      console.log('✅ Test user created successfully!');
    }
    
    console.log('\n📝 Test Steps:');
    console.log('1. Try login with test@osis.sch.id / Test123!');
    console.log('   → Should show: "Email Anda belum diverifikasi"');
    console.log('\n2. Update email_verified to true in database or via SQL:');
    console.log('   UPDATE users SET email_verified = true WHERE email = \'test@osis.sch.id\';');
    console.log('\n3. Try login again');
    console.log('   → Should show: "Akun Anda belum disetujui oleh admin"');
    console.log('\n4. Go to /admin/users and approve the user');
    console.log('\n5. Try login again');
    console.log('   → Should succeed and redirect to /admin\n');
    
  } catch (e) {
    console.error('Error:', e.message || e);
    process.exit(1);
  }
}

createTestUser();
