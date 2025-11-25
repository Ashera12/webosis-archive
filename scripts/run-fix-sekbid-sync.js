// Run-time repair script for sekbid/member sync
// Usage (locally):
// 1) npm install @supabase/supabase-js
// 2) set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env
// 3) node scripts/run-fix-sekbid-sync.js

const { createClient } = require('@supabase/supabase-js');

async function main() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
  });

  try {
    console.log('1) Converting sekbid_id = 0 to NULL (preview)');
    const { data: zeroRows, error: zeroErr } = await supabase
      .from('members')
      .select('id, sekbid_id, role, jabatan')
      .eq('sekbid_id', 0)
      .limit(500);
    if (zeroErr) throw zeroErr;
    console.log('Found', zeroRows.length, 'rows with sekbid_id = 0');
    if (zeroRows.length > 0) {
      // Optionally abort here and ask user to confirm; we'll proceed but log ids
      console.log('IDs (sekbid_id=0):', zeroRows.map(r => r.id).join(', '));
      const { error: updZeroErr } = await supabase
        .from('members')
        .update({ sekbid_id: null })
        .eq('sekbid_id', 0);
      if (updZeroErr) throw updZeroErr;
      console.log('Converted sekbid_id=0 -> NULL for members');
    }

    console.log('2) Finding members with sekbid_id IS NOT NULL and generic/empty role');
    const { data: genericRows, error: genericErr } = await supabase
      .from('members')
      .select('id, sekbid_id, role, jabatan')
      .is('sekbid_id', null, { negate: true })
      .limit(1000);
    if (genericErr) throw genericErr;

    const toFix = [];
    for (const r of genericRows) {
      const role = (r.role || '').toString();
      if (!role || /^\s*Anggota(\s.*)?$/i.test(role)) {
        toFix.push(r);
      }
    }
    console.log('Candidates to fix:', toFix.length);

    for (const r of toFix) {
      const sekId = r.sekbid_id;
      // fetch sekbid
      const { data: sek, error: sekErr } = await supabase.from('sekbid').select('id, name, nama').eq('id', sekId).single();
      if (sekErr) {
        console.warn('Failed to fetch sekbid for id', sekId, sekErr.message || sekErr);
        continue;
      }
      const label = sek.name || sek.nama || String(sekId);
      const desired = `Anggota ${label}`;
      if (String(r.role) !== desired || String(r.jabatan) !== desired) {
        const { error: fixErr } = await supabase
          .from('members')
          .update({ role: desired, jabatan: desired })
          .eq('id', r.id);
        if (fixErr) {
          console.warn('Failed to update member', r.id, fixErr.message || fixErr);
        } else {
          console.log('Updated member', r.id, '->', desired);
        }
      }
    }

    console.log('3) Clearing stale "Anggota Sekbid 0" where sekbid_id IS NULL');
    const { data: stale, error: staleErr } = await supabase
      .from('members')
      .select('id, sekbid_id, role, jabatan')
      .is('sekbid_id', null)
      .ilike('role', 'Anggota Sekbid %')
      .limit(500);
    if (staleErr) throw staleErr;
    console.log('Rows with stale label:', stale.length ? stale.map(s => s.id).join(', ') : 0);
    if (stale.length > 0) {
      const ids = stale.map(s => s.id);
      const { error: clearErr } = await supabase.from('members').update({ role: 'Anggota', jabatan: 'Anggota' }).in('id', ids);
      if (clearErr) throw clearErr;
      console.log('Cleared stale labels for ids:', ids.join(', '));
    }

    console.log('Done. Consider running a final SELECT to verify changes.');
  } catch (e) {
    console.error('Error during fix:', e.message || e);
    process.exit(1);
  }
}

main();
