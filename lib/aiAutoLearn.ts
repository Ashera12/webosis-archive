/**
 * AI Auto-Learning System
 * Automatically analyze, understand, and index all website data for AI providers
 */

import { supabaseAdmin } from '@/lib/supabase/server';
import { fetchSiteSnapshot } from '@/lib/aiSiteFetcher';

// In-memory knowledge base (auto-refreshed every 5 minutes)
let knowledgeBase: string | null = null;
let lastUpdate: number = 0;
const UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Build comprehensive knowledge base from all database tables
 */
async function buildKnowledgeBase(): Promise<string> {
  const kb: string[] = [];
  
  kb.push('=== AI AUTO-LEARNING: COMPLETE DATABASE KNOWLEDGE ===');
  kb.push('Auto-updated every 5 minutes. This is your COMPLETE knowledge of the website.\n');

  try {
    // 1. Get site snapshot (cached 30s)
    const snap = await fetchSiteSnapshot();
    
    // 2. ALL SEKBID with descriptions
    kb.push('📚 SEKSI BIDANG (SEKBID) - COMPLETE LIST:');
    if (snap.sekbid?.length) {
      snap.sekbid.forEach(s => {
        kb.push(`  [ID: ${s.id}] ${s.name}`);
        if (s.description) kb.push(`    Deskripsi: ${s.description}`);
        if (s.icon) kb.push(`    Icon: ${s.icon}`);
      });
    } else {
      kb.push('  (Tidak ada data sekbid)');
    }

    // 3. ALL MEMBERS with full sekbid mapping
    kb.push('\n👥 ANGGOTA OSIS - COMPLETE DIRECTORY WITH SEKBID MAPPING:');
    const { data: allMembers } = await supabaseAdmin
      .from('members')
      .select('*')
      .or('is_active.eq.true,active.eq.true')
      .order('display_order', { ascending: true });
    
    if (allMembers?.length) {
      // Build sekbid lookup
      const sekbidMap: Record<number, string> = {};
      if (snap.sekbid) {
        snap.sekbid.forEach(s => { if (s.id) sekbidMap[s.id] = s.name; });
      }
      
      kb.push(`Total anggota aktif: ${allMembers.length}\n`);
      allMembers.forEach((m, idx) => {
        const name = m.name || m.nama || m.full_name || m.display_name || 'Unknown';
        // Extract clean role/jabatan (remove sekbid number if present)
        let cleanRole = m.role || m.jabatan || m.position || 'Anggota';
        // If role contains "Anggota Sekbid X", extract just "Anggota"
        if (/Anggota Sekbid \d+/.test(cleanRole)) {
          cleanRole = 'Anggota';
        }
        const sekbid = m.sekbid_id ? sekbidMap[m.sekbid_id] || `Sekbid ID ${m.sekbid_id}` : 'Belum ada sekbid';
        
        kb.push(`${idx + 1}. NAMA: ${name}`);
        kb.push(`   Jabatan: ${cleanRole}`);
        kb.push(`   Sekbid: ${m.sekbid_id || '-'}${m.sekbid_id ? ` (${sekbid})` : ''}`);
        if (m.class) kb.push(`   Kelas: ${m.class}`);
        if (m.instagram) kb.push(`   Instagram: ${m.instagram}`);
        if (m.quote) kb.push(`   Quote: ${m.quote}`);
        kb.push('');
      });
    } else {
      kb.push('  (Tidak ada data anggota)');
    }

    // 4. PROGRAM KERJA
    kb.push('\n🎯 PROGRAM KERJA (PROKER):');
    if (snap.proker?.length) {
      snap.proker.forEach((p, i) => {
        kb.push(`${i + 1}. ${p.title}`);
        if (p.description) kb.push(`   ${p.description}`);
      });
    } else {
      kb.push('  (Tidak ada data proker)');
    }

    // 5. EVENTS
    kb.push('\n📅 EVENT & KEGIATAN:');
    const { data: events } = await supabaseAdmin
      .from('events')
      .select('*')
      .order('event_date', { ascending: false })
      .limit(50);
    
    if (events?.length) {
      events.forEach((e, i) => {
        kb.push(`${i + 1}. ${e.title}`);
        const evtDate = e.event_date || e.start_date;
        if (evtDate) kb.push(`   Tanggal: ${evtDate}${e.end_date ? ' - ' + e.end_date : ''}`);
        if (e.location) kb.push(`   Lokasi: ${e.location}`);
        if (e.description) kb.push(`   ${e.description.slice(0, 300)}`);
        if (e.sekbid_id && sekbidMap[e.sekbid_id]) kb.push(`   Sekbid: ${sekbidMap[e.sekbid_id]}`);
        kb.push('');
      });
    } else {
      kb.push('  (Tidak ada event)');
    }

    // 6. ANNOUNCEMENTS
    kb.push('\n📢 PENGUMUMAN:');
    if (snap.announcements?.length) {
      snap.announcements.forEach((a, i) => {
        kb.push(`${i + 1}. ${a.title}`);
        if (a.excerpt) kb.push(`   ${a.excerpt}`);
      });
    } else {
      kb.push('  (Tidak ada pengumuman)');
    }

    // 7. POSTS/ARTICLES
    kb.push('\n📝 POSTS/ARTIKEL:');
    const { data: posts } = await supabaseAdmin
      .from('posts')
      .select('title,excerpt,published_at,status')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(20);
    
    if (posts?.length) {
      posts.forEach((p, i) => {
        kb.push(`${i + 1}. ${p.title} (${p.published_at || 'unpublished'})`);
        if (p.excerpt) kb.push(`   ${p.excerpt.slice(0, 200)}`);
      });
    } else {
      kb.push('  (Tidak ada post)');
    }

    // 8. PAGE CONTENT (Visi, Misi, About, etc)
    kb.push('\n📄 KONTEN HALAMAN (Visi, Misi, About):');
    kb.push(`Ketua OSIS: ${snap.ketua || '-'}`);
    if (snap.page_content) {
      if (snap.page_content.site_visi) kb.push(`Visi: ${snap.page_content.site_visi}`);
      if (snap.page_content.site_misi) kb.push(`Misi: ${snap.page_content.site_misi}`);
      if (snap.page_content.site_about) kb.push(`Tentang OSIS: ${snap.page_content.site_about}`);
    }

    // 9. CONTACT INFO
    kb.push('\n📬 KONTAK OSIS:');
    kb.push(`Email: ${snap.contact?.email || 'N/A'}`);
    kb.push(`Instagram: ${snap.contact?.instagram || 'N/A'}`);
    kb.push(`Phone: ${snap.contact?.phone || 'N/A'}`);

    // 10. LEARNING INSTRUCTIONS FOR AI (CRITICAL)
    kb.push('\n\n🤖 === CRITICAL INSTRUCTIONS - READ FIRST ===');
    kb.push('YOU HAVE COMPLETE ACCESS TO ALL DATABASE INFORMATION ABOVE.');
    kb.push('DO NOT say "I don\'t have access" or "limited data" - YOU DO HAVE ALL THE DATA.');
    kb.push('\nHOW TO ANSWER:');
    kb.push('• "Siapa ketua/ketos?" → Answer from "Ketua OSIS" section above');
    kb.push('• "X itu sekbid berapa?" → Find X in ANGGOTA OSIS list, read their Sekbid line');
    kb.push('• "Daftar sekbid" → List ALL from SEKSI BIDANG section');
    kb.push('• "Siapa anggota?" → List from ANGGOTA OSIS section');
    kb.push('• "Event apa?" → List from EVENT & KEGIATAN section');
    kb.push('• "Program kerja?" → List from PROGRAM KERJA section');
    kb.push('\nRULES:');
    kb.push('');
    kb.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    kb.push('🤖 CRITICAL INSTRUCTIONS FOR AI - READ THIS BEFORE ANSWERING');
    kb.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    kb.push('');
    kb.push('✅ YOU HAVE COMPLETE DATABASE ACCESS - All data is listed above');
    kb.push('✅ ANSWER DIRECTLY from the sections above');
    kb.push('✅ BE CONFIDENT - you have everything needed');
    kb.push('');
    kb.push('❌ NEVER say: "Saya tidak memiliki informasi"');
    kb.push('❌ NEVER say: "Akses terbatas"');
    kb.push('❌ NEVER say: "Silakan hubungi pengurus"');
    kb.push('❌ NEVER suggest contacting anyone else');
    kb.push('');
    kb.push('📌 EXAMPLE QUERIES & CORRECT RESPONSES:');
    kb.push('');
    kb.push('Q: "Irga itu sekbid berapa?"');
    kb.push('A: Search "👥 ANGGOTA OSIS" → Find "Irga" → Read "Sekbid:" → Answer with exact sekbid name');
    kb.push('   Example: "Irga adalah anggota Sekbid 7."');
    kb.push('');
    kb.push('Q: "Siapa ketua OSIS?"');
    kb.push('A: Search "📄 KONTEN HALAMAN" → Find "Ketua OSIS:" → Answer with name');
    kb.push('   Example: "Ketua OSIS adalah [Name from database]."');
    kb.push('');
    kb.push('Q: "Daftar sekbid"');
    kb.push('A: List all items from "📚 SEKSI BIDANG (SEKBID)" section above');
    kb.push('');
    kb.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    kb.push('');
    kb.push('This knowledge base auto-updates every 5 minutes from live database.');

  } catch (e) {
    kb.push('\n❌ ERROR building knowledge base: ' + (e as Error).message);
  }

  return kb.join('\n');
}

/**
 * Get current knowledge base (auto-refresh if stale)
 */
export async function getAIKnowledge(): Promise<string> {
  const now = Date.now();
  if (!knowledgeBase || now - lastUpdate > UPDATE_INTERVAL) {
    console.log('[AI AutoLearn] Building/refreshing knowledge base...');
    knowledgeBase = await buildKnowledgeBase();
    lastUpdate = now;
    console.log('[AI AutoLearn] Knowledge base updated. Size:', knowledgeBase.length, 'chars');
  }
  return knowledgeBase;
}

/**
 * Force refresh knowledge base (call after database updates)
 */
export async function refreshAIKnowledge(): Promise<void> {
  console.log('[AI AutoLearn] Force refresh requested...');
  knowledgeBase = await buildKnowledgeBase();
  lastUpdate = Date.now();
  console.log('[AI AutoLearn] Force refresh complete.');
}

// Build sekbid map helper
const sekbidMap: Record<number, string> = {};

