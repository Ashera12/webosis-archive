/**
 * Script to find and remove duplicate members in database
 * Keeps the record with lower ID (older record)
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findDuplicates() {
  console.log('\n🔍 Finding duplicate members...\n');

  const { data: allMembers, error } = await supabase
    .from('members')
    .select('id, name, role, sekbid_id, class, photo_url, is_active')
    .eq('is_active', true)
    .order('id', { ascending: true });

  if (error) {
    console.error('❌ Error fetching members:', error);
    return;
  }

  // Group by name
  const nameMap = new Map();
  allMembers.forEach(m => {
    if (!nameMap.has(m.name)) {
      nameMap.set(m.name, []);
    }
    nameMap.get(m.name).push(m);
  });

  // Find duplicates
  const duplicates = [];
  nameMap.forEach((members, name) => {
    if (members.length > 1) {
      duplicates.push({ name, members });
    }
  });

  if (duplicates.length === 0) {
    console.log('✅ No duplicates found!');
    return [];
  }

  console.log(`⚠️  Found ${duplicates.length} duplicate names:\n`);
  
  duplicates.forEach(({ name, members }) => {
    console.log(`📋 ${name} (${members.length} entries):`);
    members.forEach(m => {
      console.log(`   ID ${m.id}: ${m.role || 'no role'} | sekbid_id: ${m.sekbid_id ?? 'null'} | class: ${m.class || 'none'}`);
    });
    console.log('');
  });

  return duplicates;
}

async function removeDuplicates(duplicates, dryRun = true) {
  if (duplicates.length === 0) return;

  console.log(`\n${dryRun ? '🔍 DRY RUN - Would delete:' : '🗑️  Deleting duplicates...'}\n`);

  const toDelete = [];

  duplicates.forEach(({ name, members }) => {
    // Sort by priority:
    // 1. Has sekbid_id (not null) - prefer records with proper sekbid assignment
    // 2. Newer ID (larger) - likely the updated one
    members.sort((a, b) => {
      // Prefer members with sekbid_id set
      if (a.sekbid_id !== null && b.sekbid_id === null) return -1;
      if (a.sekbid_id === null && b.sekbid_id !== null) return 1;
      // If both have or don't have sekbid_id, prefer newer (larger ID)
      return b.id - a.id;
    });
    
    // Keep first (best priority), delete rest
    const keep = members[0];
    const remove = members.slice(1);

    console.log(`📌 Keeping: ${name} (ID: ${keep.id}, role: ${keep.role || 'none'})`);
    
    remove.forEach(m => {
      console.log(`   ❌ ${dryRun ? 'Would delete' : 'Deleting'}: ID ${m.id} (${m.role || 'no role'})`);
      toDelete.push(m.id);
    });
    console.log('');
  });

  if (!dryRun && toDelete.length > 0) {
    console.log(`\n🗑️  Deleting ${toDelete.length} duplicate records...\n`);
    
    const { error } = await supabase
      .from('members')
      .delete()
      .in('id', toDelete);

    if (error) {
      console.error('❌ Error deleting:', error);
      return;
    }

    console.log(`✅ Successfully deleted ${toDelete.length} duplicates!`);
  }

  return toDelete;
}

async function main() {
  const args = process.argv.slice(2);
  const isExecute = args.includes('--execute');

  console.log('╔════════════════════════════════════════╗');
  console.log('║   Duplicate Members Cleanup Tool      ║');
  console.log('╚════════════════════════════════════════╝');

  const duplicates = await findDuplicates();

  if (duplicates.length > 0) {
    await removeDuplicates(duplicates, !isExecute);

    if (!isExecute) {
      console.log('\n💡 This was a DRY RUN. To actually delete duplicates, run:');
      console.log('   node scripts/fix-duplicates.js --execute\n');
    } else {
      console.log('\n✅ Cleanup complete! Verify in admin panel.\n');
    }
  }
}

main().catch(console.error);
