// Generate bcrypt password hashes for default admin accounts
const bcrypt = require('bcryptjs');

async function generateHashes() {
  console.log('🔐 Generating bcrypt password hashes...\n');

  const accounts = [
    { email: 'admin@osis.sch.id', password: 'SuperAdmin123!', role: 'Super Admin' },
    { email: 'admin2@osis.sch.id', password: 'Admin123!', role: 'Admin' },
    { email: 'osis@osis.sch.id', password: 'Osis123!', role: 'OSIS' },
    { email: 'moderator@osis.sch.id', password: 'Moderator123!', role: 'Moderator' },
  ];

  for (const account of accounts) {
    const hash = await bcrypt.hash(account.password, 10);
    console.log(`${account.role} Account:`);
    console.log(`  Email:    ${account.email}`);
    console.log(`  Password: ${account.password}`);
    console.log(`  Hash:     ${hash}`);
    console.log('');
  }

  console.log('✅ Copy hashes ke supabase-super-admin-seed.sql\n');
}

generateHashes().catch(console.error);
