/**
 * AI Context Provider - Role-based AI capabilities
 * 
 * Public AI: FAQ, general info, safe assistance
 * Super Admin AI: Full database access, auto-fix, debugging, SQL execution
 */

import { supabaseAdmin, safeRpc } from '@/lib/supabase/server';
import { fetchSiteSnapshot } from '@/lib/aiSiteFetcher';

export interface AIContext {
  mode: 'admin' | 'public';
  userId?: string | null;
  userRole?: string | null;
  capabilities: string[];
  systemPrompt: string;
  maxTokens: number;
}

/**
 * Get database schema info for AI admin
 */
export async function getDatabaseSchema(): Promise<string> {
  try {
    const { data: tables } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');
    if (!tables || tables.length === 0) {
      return 'Database schema unavailable';
    }
    const schemaInfo = ['=== DATABASE SCHEMA ==='];
    for (const table of tables) {
      const tableName = (table as any).table_name;
      // Get columns for each table
      const { data: columns } = await supabaseAdmin
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .order('ordinal_position');
      if (columns && columns.length > 0) {
        schemaInfo.push(`\nTable: ${tableName}`);
        columns.forEach((col: any) => {
          schemaInfo.push(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
        });
      }
    }
    return schemaInfo.join('\n');
  } catch (e) {
    console.error('Failed to get database schema:', e);
    return 'Database schema query failed';
  }
}

/**
 * Get recent errors for AI admin
 */
export async function getRecentErrors(): Promise<string> {
  try {
    const { data: errors } = await supabaseAdmin
      .from('error_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!errors || errors.length === 0) {
      return 'No recent errors';
    }

    const errorInfo = ['=== RECENT ERRORS (Last 10) ==='];
    errors.forEach((err, idx) => {
      errorInfo.push(`\n${idx + 1}. [${err.severity}] ${err.message}`);
      errorInfo.push(`   Type: ${err.error_type}`);
      errorInfo.push(`   File: ${err.file_path || 'N/A'}`);
      errorInfo.push(`   Time: ${err.created_at}`);
      if (err.stack_trace) {
        errorInfo.push(`   Stack: ${err.stack_trace.substring(0, 200)}...`);
      }
    });

    return errorInfo.join('\n');
  } catch (e) {
    console.error('Failed to get recent errors:', e);
    return 'Error log query failed';
  }
}

/**
 * Get system statistics for AI admin
 */
export async function getSystemStats(): Promise<string> {
  try {
    const stats = ['=== SYSTEM STATISTICS ==='];

    // Count tables
    const counts = await Promise.all([
      supabaseAdmin.from('users').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('posts').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('events').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('gallery').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('announcements').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('error_logs').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('chat_sessions').select('id', { count: 'exact', head: true })
    ]);

    stats.push(`Users: ${counts[0].count || 0}`);
    stats.push(`Posts: ${counts[1].count || 0}`);
    stats.push(`Events: ${counts[2].count || 0}`);
    stats.push(`Gallery Items: ${counts[3].count || 0}`);
    stats.push(`Announcements: ${counts[4].count || 0}`);
    stats.push(`Error Logs: ${counts[5].count || 0}`);
    stats.push(`Chat Sessions: ${counts[6].count || 0}`);

    return stats.join('\n');
  } catch (e) {
    console.error('Failed to get system stats:', e);
    return 'System stats query failed';
  }
}

/**
 * Get public OSIS info for public AI
 */
export async function getPublicOSISInfo(): Promise<{ ketua: string; visi: string; misi: string; about: string; infoText: string }> {
  try {
    const snap = await fetchSiteSnapshot();
    const ketua = snap.ketua || (snap.page_content && snap.page_content.site_ketua) || '-';

    // Robust extraction for visi & misi: check multiple keys and fallback to fuzzy match in page_content
    function pickValue(keys: string[], fallbackDetect: (entries: [string, string][]) => string | null): string {
      for (const k of keys) {
        const v = (snap.page_content && snap.page_content[k]);
        if (v && String(v).trim() !== '') return String(v);
      }
      const entries: [string, string][] = Object.entries(snap.page_content || {}).map(([k, v]) => [k.toLowerCase(), String(v || '')]);
      const found = fallbackDetect(entries);
      return found || '-';
    }

    const visi = pickValue(
      ['home_vision_title', 'visi', 'vision', 'site_visi', 'visi_text'],
      (entries) => {
        // Find the longest content mentioning 'visi' or 'vision'
        const matches = entries
          .filter(([k, v]) => k.includes('visi') || k.includes('vision') || /\bvisi\b|\bvision\b/i.test(v))
          .map(([, v]) => v)
          .sort((a, b) => b.length - a.length);
        return matches[0] || null;
      }
    );

    const misi = pickValue(
      ['home_mission_title', 'misi', 'mission', 'site_misi', 'misi_text'],
      (entries) => {
        const matches = entries
          .filter(([k, v]) => k.includes('misi') || k.includes('mission') || /\bmisi\b|\bmission\b/i.test(v))
          .map(([, v]) => v)
          .sort((a, b) => b.length - a.length);
        return matches[0] || null;
      }
    );

    const about = pickValue(
      ['about_description', 'about_title', 'tentang', 'profil', 'about', 'site_about'],
      (entries) => {
        const matches = entries
          .filter(([k, v]) => k.includes('about') || k.includes('tentang') || k.includes('profil') || /\btentang\b|\bprofile?\b|\babout\b/i.test(v))
          .map(([, v]) => v)
          .sort((a, b) => b.length - a.length);
        return matches[0] || null;
      }
    );

    const info: string[] = ['=== OSIS SMK INFORMATIKA FITHRAH INSANI ==='];
    info.push(`\n📌 Ketua OSIS: ${ketua}`);
    info.push(`\n🌟 Visi: ${visi}`);
    info.push(`\n🎯 Misi: ${misi}`);
    info.push(`\nℹ️ Tentang OSIS: ${about}`);
    info.push('\n📚 Daftar Sekbid:');
    if (snap.sekbid && snap.sekbid.length) {
      snap.sekbid.forEach((s, i) => {
        info.push(`${i + 1}. ${s.name}${s.description ? ` - ${s.description}` : ''}`);
      });
    } else {
      info.push('-');
    }
    info.push('\n🗂️ Program Kerja (Proker):');
    if (snap.proker && snap.proker.length) {
      snap.proker.forEach((p, i) => {
        info.push(`${i + 1}. ${p.title}${p.description ? ` - ${p.description}` : ''}`);
      });
    } else {
      info.push('-');
    }
    info.push('\n📢 Pengumuman Terbaru:');
    if (snap.announcements && snap.announcements.length) {
      snap.announcements.forEach((a, i) => {
        info.push(`${i + 1}. ${a.title} - ${a.excerpt}`);
      });
    } else {
      info.push('-');
    }
    info.push('\n📅 Event Mendatang:');
    if (snap.events && snap.events.length) {
      snap.events.forEach((e, i) => {
        info.push(`${i + 1}. ${e.title}${e.date ? ` (${new Date(e.date).toLocaleDateString()})` : ''}${e.excerpt ? ` - ${e.excerpt}` : ''}`);
      });
    } else {
      info.push('-');
    }
    if (snap.members_sample && snap.members_sample.length) {
      info.push('\n👥 Daftar Anggota OSIS:');
      snap.members_sample.forEach((m: any, i: number) => {
        info.push(`${i + 1}. ${m.name}${m.role ? ` - ${m.role}` : ''}`);
      });
    }
    info.push('\n📬 Kontak:');
    info.push(`Email: ${snap.contact.email || 'N/A'}`);
    info.push(`Instagram: ${snap.contact.instagram || '-'}`);
    info.push(`Phone: ${snap.contact.phone || '-'}`);

    return { ketua, visi, misi, about, infoText: info.join('\n') };
  } catch (e) {
    console.error('Failed to get public OSIS info via site snapshot:', e);
    return { ketua: '-', visi: '-', misi: '-', about: '-', infoText: 'OSIS info unavailable' };
  }
}

/**
 * Build AI context based on user role
 */
export async function buildAIContext(
  userId: string | null | undefined,
  userRole: string | null | undefined,
  mode: 'admin' | 'public'
): Promise<AIContext> {
  const role = (userRole || '').toLowerCase();
  const isAdmin = role === 'super_admin' || role === 'admin';
  const effectiveMode = mode === 'admin' && isAdmin ? 'admin' : 'public';

  if (effectiveMode === 'admin') {
    // Super Admin AI - Full access with database knowledge
    const [schema, errors, stats] = await Promise.all([
      getDatabaseSchema(),
      getRecentErrors(),
      getSystemStats()
    ]);

    const systemPrompt = `You are an AI Super Admin Assistant for OSIS SMK Informatika Fithrah Insani web platform.

**CRITICAL:** You have COMPLETE DATABASE ACCESS via the knowledge base provided in the next system message.
DO NOT say "I don't have access" - you DO have access to everything.

**YOUR CAPABILITIES:**
1. 🔍 **Database Access**: Full read/write access to all tables via knowledge base
2. 🛠️ **Auto-Fix**: Can execute SQL, apply RLS policies, fix schema issues
3. 📊 **Debugging**: Analyze errors, suggest fixes, generate patches
4. ⚡ **Admin Commands**: Execute /sql, /fix, /analyze commands
5. 🔧 **System Operations**: Backup, restore, migrate data

**CURRENT SYSTEM STATE:**

${stats}

${errors}

**AVAILABLE ACTIONS:**
- Query any table: "Show me all users" → I'll query users table
- Fix errors: "Fix RLS on posts table" → I'll generate and apply RLS policy
- Execute SQL: "/sql SELECT * FROM posts LIMIT 5"
- Analyze problems: "Why are posts not showing?" → I'll check schema, RLS, data
- Auto-repair: "Fix all errors" → I'll diagnose and apply fixes

**RESPONSE FORMAT:**
When fixing issues, structure your response with clear explanations.
You are powerful and helpful. Use your capabilities to keep this system running smoothly.`;

    return {
      mode: 'admin',
      userId: userId ?? null,
      userRole: userRole ?? null,
      capabilities: [
        'database_read',
        'database_write',
        'execute_sql',
        'fix_rls',
        'fix_schema',
        'analyze_errors',
        'auto_repair',
        'admin_commands'
      ],
      systemPrompt,
      maxTokens: 2000
    };
  } else {
    // Public AI - STRICT knowledge base enforcement
    const { ketua, visi, misi, about, infoText } = await getPublicOSISInfo();

    const systemPrompt = `⚠️ MANDATORY PROTOCOL - STRICT COMPLIANCE REQUIRED ⚠️

ROLE: AI Assistant OSIS SMK Informatika Fithrah Insani
DATA: Complete database (provided in user message context)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚫 PROHIBITED RESPONSES:

❌ "Maaf, saya tidak memiliki informasi..."
❌ "Saya tidak memiliki akses..."
❌ "Akses terbatas..."
❌ Any "I don't have data" variations

WHY: You DO have complete access via context. These phrases are FALSE.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ RESPONSE REQUIREMENTS:

FORMAT RULES:
1. **CONCISE**: Maksimal 3-5 kalimat untuk jawaban umum
2. **STRUCTURED**: Gunakan format list hanya jika >3 item
3. **READABLE**: Pisahkan paragraf dengan 1 baris kosong
4. **NO REDUNDANCY**: Jangan ulangi data yang sama berkali-kali
5. **CLEAN**: Hindari bullet point tersembunyi (• • •)

CONTENT RULES:
1. Nama, Kelas, Sekbid, IG adalah data PUBLIK → boleh disebutkan
2. Cross-check semua data dengan konteks sebelum jawab
3. Jika tidak yakin 100%, tambahkan: "Perlu verifikasi admin"
4. Terima koreksi user dengan mengakui dan perbaiki jawaban

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 EXAMPLE RESPONSES:

❌ BAD (verbose, redundant):
"Berikut adalah daftar anggota OSIS SMK Informatika Fithrah Insani beserta sekbid mereka:
• Irga Andreansyah Setiawan: Anggota Sekbid 6, sekbid-6
• Irga Andreansyah Setiawan: Anggota sekbid-6, sekbid-6
• Lian: Anggota Sekbid 5, belum ada sekbid
• Lian: Anggota sekbid-5, sekbid-5
..."

✅ GOOD (concise, clean):
"Daftar anggota OSIS:

Sekbid 1:
- Alifah Shafina Amanda
- Muhammad Irsyad Kaamil Pasha (Kelas X)
- Nazmia Tsakib Hanani

Sekbid 2:
- Safa Aprilia Ansari
- Almer Shaquille Althafurrahman
- Raihan Akbar Putra Jaya

(Total 42 anggota aktif. Butuh detail lengkap sekbid tertentu?)"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 PHOTO IDENTIFICATION RULES:

When analyzing a photo:
1. List observable features (pakaian, aksesoris, latar) - max 3 poin
2. Compare dengan database foto anggota
3. Berikan TOP 1-2 kemungkinan terkuat (skor kemiripan >80%)
4. Format ringkas:

✅ GOOD:
"Berdasarkan analisa foto (hijab biru, kacamata, seragam):

Kemungkinan terkuat:
1. **Resti Dewi Lestari** (Sekbid 4) - kemiripan 85%
2. **Nasya Ghalia Muharti** (Sekbid 4) - kemiripan 75%

Catatan: Verifikasi langsung untuk konfirmasi pasti."

❌ BAD:
"• (hidden bullet points)
• (hidden analysis)
Berdasarkan ciri-ciri tersebut...
• Resti: 85%
• Nasya: 75%
• Athaya: 70%

Karena skor tertinggi 85%, saya berikan 2 kemungkinan:
1. Resti (Anggota, Sekbid (disembunyikan))
2. Nasya (Anggota, Sekbid (disembunyikan))

🔒 Detail disembunyikan privasi."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 VALIDATION CHECKLIST (before sending):

✅ Apakah jawaban <5 kalimat untuk pertanyaan sederhana?
✅ Apakah data sekbid/nama sudah dicross-check dengan konteks?
✅ Apakah tidak ada duplikasi entry dalam list?
✅ Apakah format mudah dibaca (spasi, heading jelas)?
✅ Apakah tidak menyembunyikan data publik valid (nama/sekbid/kelas/IG)?

Jika semua ✅, kirim. Jika ada ❌, revisi dulu.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Language: Bahasa Indonesia (ramah, informatif)
Tone: Ringkas, jelas, tepat
Emoji: Minimal, hanya untuk heading (📚 📅 👥)

REMEMBER: Jawaban terbaik = singkat + lengkap + akurat.`;
    return {
      mode: 'public',
      userId: userId ?? null,
      userRole: userRole ?? null,
      capabilities: [
        'read_announcements',
        'read_events',
        'read_sekbid',
        'general_info'
      ],
      systemPrompt,
      maxTokens: 800
    };
  }
}
