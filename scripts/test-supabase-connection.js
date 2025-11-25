// Test Supabase Connection & Check Tables
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('\n🔍 Testing Supabase Connection...\n');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseKey.substring(0, 20) + '...\n');

  try {
    // Test 1: Check if users table exists
    console.log('1️⃣ Checking if "users" table exists...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .limit(5);

    if (usersError) {
      console.error('❌ Users table error:', usersError.message);
      console.log('\n💡 Solution: Run supabase-schema.sql in Supabase SQL Editor');
      return false;
    }

    console.log(`✅ Users table exists! Found ${users.length} users`);
    if (users.length > 0) {
      console.log('   Users:', users.map(u => `${u.email} (${u.role})`).join(', '));
    }

    // Test 2: Check for admin account
    console.log('\n2️⃣ Checking for Super Admin account...');
    const { data: admin, error: adminError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@osis.sch.id')
      .single();

    if (adminError || !admin) {
      console.error('❌ Super Admin account NOT found!');
      console.log('\n💡 Solution: Run supabase-super-admin-seed.sql in Supabase SQL Editor');
      console.log('   This will create: admin@osis.sch.id / SuperAdmin123!');
      return false;
    }

    console.log('✅ Super Admin found!');
    console.log('   Email:', admin.email);
    console.log('   Name:', admin.name);
    console.log('   Role:', admin.role);
    console.log('   Verified:', admin.email_verified);
    console.log('   Approved:', admin.approved);
    console.log('   Password hash exists:', !!admin.password);

    // Test 3: Check other tables
    console.log('\n3️⃣ Checking other tables...');
    
    const tables = [
      'posts',
      'events',
      'sekbid',
      'members',
      'page_content',
      'gallery_items'
    ];

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      if (error) {
        console.log(`   ❌ ${table}: NOT FOUND`);
      } else {
        console.log(`   ✅ ${table}: exists`);
      }
    }

    console.log('\n✅ All checks passed! Database is ready!');
    console.log('\n🔐 Login credentials:');
    console.log('   URL: http://localhost:3001/admin/login');
    console.log('   Email: admin@osis.sch.id');
    console.log('   Password: SuperAdmin123!');
    
    return true;

  } catch (err) {
    console.error('\n❌ Connection error:', err.message);
    return false;
  }
}

testConnection()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
