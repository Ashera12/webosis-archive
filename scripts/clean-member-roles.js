/**
 * Clean up old role format "Anggota Sekbid X" to just "Anggota"
 * The sekbid assignment should be in sekbid_id field, not in role name
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanRoles() {
  console.log('\n🧹 Cleaning member roles...\n');

  // Fetch all members
  const { data: members, error } = await supabase
    .from('members')
    .select('id, name, role, sekbid_id')
    .eq('is_active', true);

  if (error) {
    console.error('❌ Error fetching members:', error);
    return;
  }

  console.log(`📊 Found ${members.length} active members\n`);

  // Find members with old role format
  const toUpdate = [];
  const validRoles = [
    'Ketua OSIS',
    'Wakil Ketua',
    'Sekretaris',
    'Bendahara',
    'Koordinator Sekbid',
    'Ketua Sekbid',
    'Wakil Ketua Sekbid',
    'Anggota'
  ];

  members.forEach(m => {
    const role = m.role || '';
    
    // Check for old format: "Anggota Sekbid X" or "Anggota sekbid-X"
    if (/Anggota\s+(S|s)ekbid[\s\-]?\d+/.test(role)) {
      toUpdate.push({
        id: m.id,
        name: m.name,
        oldRole: role,
        newRole: 'Anggota',
        sekbid_id: m.sekbid_id
      });
    }
    // Check for lowercase variants
    else if (role.toLowerCase().includes('anggota sekbid') || role.toLowerCase().includes('anggota sekbid-')) {
      toUpdate.push({
        id: m.id,
        name: m.name,
        oldRole: role,
        newRole: 'Anggota',
        sekbid_id: m.sekbid_id
      });
    }
    // Check if role is not in valid list (case-insensitive)
    else if (!validRoles.some(v => v.toLowerCase() === role.toLowerCase())) {
      console.log(`⚠️  Unknown role: "${role}" for ${m.name} (ID: ${m.id})`);
    }
  });

  if (toUpdate.length === 0) {
    console.log('✅ All roles are clean!\n');
    return;
  }

  console.log(`🔧 Found ${toUpdate.length} roles to clean:\n`);
  toUpdate.forEach(u => {
    console.log(`   ${u.name} (ID: ${u.id})`);
    console.log(`      Old: "${u.oldRole}"`);
    console.log(`      New: "${u.newRole}"`);
    console.log(`      Sekbid: ${u.sekbid_id ?? 'null'}`);
    console.log('');
  });

  // Update roles
  console.log('💾 Updating roles...\n');
  
  for (const update of toUpdate) {
    const { error: updateError } = await supabase
      .from('members')
      .update({ role: update.newRole })
      .eq('id', update.id);

    if (updateError) {
      console.error(`❌ Failed to update ${update.name}:`, updateError);
    } else {
      console.log(`✅ Updated: ${update.name}`);
    }
  }

  console.log(`\n✅ Updated ${toUpdate.length} member roles!\n`);
}

cleanRoles().catch(console.error);
