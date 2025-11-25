/**
 * List All Users Script
 * Shows all registered users with their status
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllUsers() {
  console.log('\n📋 Fetching all users...\n');
  
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, name, role, email_verified, approved, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  if (!users || users.length === 0) {
    console.log('❌ No users found in database\n');
    return;
  }

  console.log(`✅ Found ${users.length} user(s)\n`);
  console.log('═══════════════════════════════════════════════════════════════════════════════');

  users.forEach((user, index) => {
    const canLogin = user.email_verified && user.approved;
    const statusIcon = canLogin ? '✅' : '⚠️';
    
    console.log(`\n${index + 1}. ${statusIcon} ${user.email}`);
    console.log('───────────────────────────────────────────────────────────────────────────────');
    console.log(`   Name:           ${user.name || '(not set)'}`);
    console.log(`   Role:           ${user.role || '(not assigned)'}`);
    console.log(`   Email Verified: ${user.email_verified ? '✅ Yes' : '❌ No'}`);
    console.log(`   Approved:       ${user.approved ? '✅ Yes' : '❌ No'}`);
    console.log(`   Login Status:   ${canLogin ? '✅ CAN LOGIN' : '❌ CANNOT LOGIN'}`);
    console.log(`   Created:        ${new Date(user.created_at).toLocaleString('id-ID')}`);
  });

  console.log('\n═══════════════════════════════════════════════════════════════════════════════');
  
  // Summary
  const canLoginCount = users.filter(u => u.email_verified && u.approved).length;
  const needsApproval = users.filter(u => !u.approved).length;
  const needsVerification = users.filter(u => !u.email_verified).length;

  console.log('\n📊 Summary:');
  console.log(`   Total Users:         ${users.length}`);
  console.log(`   ✅ Can Login:        ${canLoginCount}`);
  console.log(`   ⏳ Needs Approval:   ${needsApproval}`);
  console.log(`   📧 Needs Verification: ${needsVerification}`);
  console.log('');

  // Role distribution
  const roleCount = {};
  users.forEach(u => {
    const role = u.role || 'no_role';
    roleCount[role] = (roleCount[role] || 0) + 1;
  });

  console.log('👥 Roles:');
  Object.entries(roleCount).forEach(([role, count]) => {
    console.log(`   ${role}: ${count}`);
  });
  console.log('');
}

listAllUsers().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
