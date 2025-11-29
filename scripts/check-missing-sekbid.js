/**
 * Fix members that have role "Anggota" but sekbid_id is null
 * These should either:
 * 1. Be Tim Inti (keep null)
 * 2. Have proper sekbid_id assigned
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixMissingSekbid() {
  console.log('\n🔍 Finding members with missing sekbid_id...\n');

  const { data: members, error } = await supabase
    .from('members')
    .select('id, name, role, sekbid_id, class')
    .eq('is_active', true)
    .eq('role', 'Anggota')
    .is('sekbid_id', null);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`⚠️  Found ${members.length} Anggota without sekbid_id:\n`);
  
  if (members.length === 0) {
    console.log('✅ All Anggota have proper sekbid_id!\n');
    return;
  }

  members.forEach(m => {
    console.log(`   ID ${m.id}: ${m.name} (class: ${m.class || 'none'})`);
  });

  console.log('\n💡 These members should be assigned to a sekbid (1-6) via admin panel.');
  console.log('   Or if they are Tim Inti, change their role to proper position.\n');
}

fixMissingSekbid().catch(console.error);
