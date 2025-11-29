/**
 * Verify API and public page data consistency
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyAPISyncWithDB() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   API vs Database Sync Check          ║');
  console.log('╚════════════════════════════════════════╝\n');

  // Get data from database (same query as API)
  const { data: dbMembers, error } = await supabase
    .from('members')
    .select('*, sekbid:sekbid_id(id, name, color, icon)')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('❌ Database error:', error);
    return;
  }

  // Filter same as API
  const filteredMembers = dbMembers.filter(m => {
    const sekbidId = m.sekbid_id;
    const validSekbid = sekbidId === null || (sekbidId >= 1 && sekbidId <= 6);
    const hasId = m.id != null && m.id !== undefined && m.id !== '';
    return validSekbid && hasId && m.name;
  });

  console.log(`📊 Database query returned: ${dbMembers.length} members`);
  console.log(`📊 After filtering: ${filteredMembers.length} members\n`);

  // Categorize members (same as PeopleSectionsClient)
  const timIntiRoles = ['ketua osis', 'wakil ketua', 'sekretaris', 'bendahara'];
  const koordinatorRoles = ['koordinator sekbid', 'ketua sekbid', 'wakil ketua sekbid'];
  
  const ketua = filteredMembers.filter(m => 
    m.role?.toLowerCase().trim() === 'ketua osis'
  );
  
  const pengurusInti = filteredMembers.filter(m => {
    const role = (m.role || '').toLowerCase().trim();
    return timIntiRoles.includes(role) && role !== 'ketua osis';
  });

  const koordinatorSekbid = filteredMembers.filter(m => {
    const role = (m.role || '').toLowerCase().trim();
    return m.sekbid && koordinatorRoles.includes(role);
  });

  const anggotaSekbid = filteredMembers.filter(m => {
    const role = (m.role || '').toLowerCase().trim();
    const isTimInti = timIntiRoles.includes(role);
    const isKoordinator = koordinatorRoles.includes(role);
    return m.sekbid && !isTimInti && !isKoordinator;
  });

  const orphaned = filteredMembers.filter(m => {
    const role = (m.role || '').toLowerCase().trim();
    const isTimInti = timIntiRoles.includes(role);
    return !m.sekbid && !isTimInti;
  });

  console.log('╔════════════════════════════════════════╗');
  console.log('║     Member Categorization Summary      ║');
  console.log('╚════════════════════════════════════════╝\n');
  
  console.log(`👑 Ketua OSIS: ${ketua.length}`);
  if (ketua.length > 0) {
    ketua.forEach(m => console.log(`   - ${m.name}`));
  }
  console.log('');

  console.log(`👥 Pengurus Inti: ${pengurusInti.length}`);
  if (pengurusInti.length > 0) {
    pengurusInti.forEach(m => console.log(`   - ${m.name} (${m.role})`));
  }
  console.log('');

  console.log(`🎯 Koordinator Sekbid: ${koordinatorSekbid.length}`);
  if (koordinatorSekbid.length > 0) {
    koordinatorSekbid.forEach(m => console.log(`   - ${m.name} → ${m.sekbid?.name || 'unknown'} (${m.role})`));
  }
  console.log('');

  console.log(`📚 Anggota Sekbid: ${anggotaSekbid.length}`);
  const sekbidGroups = {};
  anggotaSekbid.forEach(m => {
    const dept = m.sekbid?.name || 'Unknown';
    if (!sekbidGroups[dept]) sekbidGroups[dept] = [];
    sekbidGroups[dept].push(m.name);
  });
  Object.entries(sekbidGroups).forEach(([dept, names]) => {
    console.log(`   ${dept}: ${names.length} members`);
  });
  console.log('');

  console.log(`⚠️  Belum Ditugaskan: ${orphaned.length}`);
  if (orphaned.length > 0) {
    orphaned.forEach(m => console.log(`   - ${m.name} (${m.role})`));
  }
  console.log('');

  // Verify totals match
  const total = ketua.length + pengurusInti.length + koordinatorSekbid.length + 
                anggotaSekbid.length + orphaned.length;
  
  console.log('╔════════════════════════════════════════╗');
  console.log('║        Sync Verification Result        ║');
  console.log('╚════════════════════════════════════════╝\n');
  
  if (total === filteredMembers.length) {
    console.log('✅ All members categorized correctly!');
    console.log(`✅ Total: ${total}/${filteredMembers.length} members\n`);
  } else {
    console.log(`❌ Mismatch! Total: ${total}/${filteredMembers.length} members\n`);
  }

  // Check for members appearing in multiple categories
  const allCategorized = [
    ...ketua.map(m => ({ ...m, category: 'Ketua' })),
    ...pengurusInti.map(m => ({ ...m, category: 'Pengurus Inti' })),
    ...koordinatorSekbid.map(m => ({ ...m, category: 'Koordinator' })),
    ...anggotaSekbid.map(m => ({ ...m, category: 'Anggota Sekbid' })),
    ...orphaned.map(m => ({ ...m, category: 'Orphaned' }))
  ];

  const idCount = new Map();
  allCategorized.forEach(m => {
    if (!idCount.has(m.id)) idCount.set(m.id, []);
    idCount.get(m.id).push(m.category);
  });

  const duplicateCategorization = Array.from(idCount.entries())
    .filter(([_, cats]) => cats.length > 1);

  if (duplicateCategorization.length > 0) {
    console.log('❌ DOUBLE CATEGORIZATION DETECTED:');
    duplicateCategorization.forEach(([id, cats]) => {
      const member = filteredMembers.find(m => m.id === id);
      console.log(`   - ${member?.name} appears in: ${cats.join(', ')}`);
    });
    console.log('');
  } else {
    console.log('✅ No double categorization - each member in one section only\n');
  }
}

verifyAPISyncWithDB().catch(console.error);
