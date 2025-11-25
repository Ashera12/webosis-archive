import { supabaseAdmin } from '@/lib/supabase/server';
import { getConfig, updateConfig } from '@/lib/adminConfig';
import { getRecentErrors as getRecentErrorRecords, updateErrorAnalysis, markErrorFixed } from '@/lib/errorMonitoring';
import { getDatabaseSchema, getSystemStats } from '@/lib/aiContext';

export type CommandResponse = { text: string; requiresConfirm?: boolean; pending?: any };

function isDestructive(cmd: string) {
  return /\b(rm -rf|del\s+|drop\s+table|docker\s+(prune|rm)|shutdown|reboot)\b/i.test(cmd);
}

export async function handleAdminCommand(params: {
  input: string;
  sessionId: string;
  origin: string; // e.g., http://localhost:3001
}): Promise<CommandResponse> {
  const { input, sessionId, origin } = params;
  const trimmed = input.trim();

  // Helper: extract UUID-like error id from any string
  const extractErrorId = (s: string): string | null => {
    const m = s.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
    return m ? m[0] : null;
  };

  // Confirmation flow
  if (trimmed === '/confirm') {
    // All admin actions are now disabled for safety.
    return { text: '❌ Admin action execution is currently disabled.' };
  }
  if (trimmed === '/cancel') {
    const { data: sess } = await supabaseAdmin
      .from('chat_sessions')
      .select('metadata')
      .eq('id', sessionId)
      .single();
    await supabaseAdmin.from('chat_sessions').update({ metadata: { ...sess?.metadata, pendingAction: null } }).eq('id', sessionId);
    return { text: 'Aksi pending dibatalkan.' };
  }

  // Parse commands
  if (trimmed === '/help') {
    return { text: `🤖 **Admin Commands Available:**

**📊 Database & System:**
/schema – Show full database schema
/stats – Show system statistics
/sql <query> – Execute SQL query
/query <table> [filters] – Query table with filters

**🔍 Error Management:**
/errors list [limit] – List recent errors
/analyze <error_id> – AI analysis of error
/fix <error_id> – Auto-fix error (requires confirmation)

**⚙️ Configuration:**
/config get <KEY> – View config value
/config set <KEY>=<VALUE> – Update config

**🎨 AI Features:**
/generate <prompt> [--ref <url>] – Generate image with AI (DALL-E/Gemini)
  • Use --ref to provide reference image URL for style inspiration
  • Example: /generate sunset over mountains --ref https://example.com/ref.jpg

**🖥️ System Operations:**
/run <cmd> – Execute terminal command (requires confirmation)
/confirm – Confirm pending action
/cancel – Cancel pending action
/clear – Clear chat history

**💡 Tips:**
- Use natural language for AI help
- Type / for command suggestions
- AI can query database for you` };
  }

  if (trimmed === '/schema') {
    const schema = await getDatabaseSchema();
    return { text: schema };
  }

  if (trimmed === '/stats') {
    const stats = await getSystemStats();
    return { text: stats };
  }

  if (trimmed.startsWith('/sql ')) {
    return { text: '❌ Admin action execution is currently disabled.' };
  }

  // /query command is disabled

  if (trimmed.startsWith('/config ')) {
    const rest = trimmed.slice(8).trim();
    if (rest.startsWith('get ')) {
      const key = rest.slice(4).trim();
      const val = await getConfig(key);
      return { text: `${key} = ${val ? (key.includes('KEY') || key.includes('TOKEN') ? '***' : val) : '(kosong)'}` };
    }
    if (rest.startsWith('set ')) {
      const expr = rest.slice(4).trim();
      const eqIdx = expr.indexOf('=');
      if (eqIdx === -1) return { text: 'Format salah. Gunakan: /config set KEY=VALUE' };
      const key = expr.slice(0, eqIdx).trim();
      const value = expr.slice(eqIdx + 1).trim();
      const { ok, error } = await updateConfig(key, value);
      if (!ok) return { text: `Gagal update ${key}: ${error}` };
      return { text: `✅ ${key} diupdate.` };
    }
    return { text: 'Gunakan: /config get KEY atau /config set KEY=VALUE' };
  }

  // Errors: list/analyze/fix
  if (trimmed.startsWith('/errors')) {
    const parts = trimmed.split(/\s+/);
    const sub = parts[1] || 'list';
    const arg = parts[2];
    if (sub === 'list') {
      const limit = arg ? Math.min(parseInt(arg, 10) || 20, 200) : 20;
      const res = await getRecentErrorRecords(limit);
      if (!res.ok) return { text: 'Gagal mengambil daftar error.' };
      if (!res.errors.length) return { text: 'Tidak ada error terbaru.' };
      const lines: string[] = ['📋 Daftar Error Terbaru:'];
      res.errors.forEach((e: any, idx: number) => {
        lines.push(`${idx + 1}. ${e.id} • [${e.error_type || e.severity || 'error'}] ${e.message || e.error_message || '(tanpa pesan)'} @ ${e.created_at}`);
      });
      return { text: lines.join('\n') };
    }
  }

  if (trimmed.startsWith('/analyze')) {
    const arg = trimmed.replace('/analyze', '').trim();
    const limit = 20;
    if (!arg || arg.toLowerCase() === 'all') {
      const res = await getRecentErrorRecords(limit);
      if (!res.ok) return { text: 'Gagal mengambil error untuk analisis.' };
      if (!res.errors.length) return { text: 'Tidak ada error untuk dianalisis.' };
      let count = 0;
      for (const err of res.errors) {
        const analysis = autoAnalyzeError(err);
        await updateErrorAnalysis(err.id, analysis, 'analysis_complete');
        count++;
      }
      return { text: `✅ Analisis selesai untuk ${count} error terbaru.` };
    } else {
      const id = arg;
      const res = await supabaseAdmin.from('error_logs').select('*').eq('id', id).single();
      if (res.error || !res.data) return { text: 'Error tidak ditemukan.' };
      const analysis = autoAnalyzeError(res.data);
      await updateErrorAnalysis(id, analysis, 'analysis_complete');
      return { text: `✅ Analisis selesai untuk error ${id}.` };
    }
  }

  if (trimmed.startsWith('/fix')) {
    const arg = trimmed.replace('/fix', '').trim();
    const limit = 20;
    if (!arg || arg.toLowerCase() === 'all') {
      const res = await getRecentErrorRecords(limit);
      if (!res.ok) return { text: 'Gagal mengambil error untuk perbaikan.' };
      if (!res.errors.length) return { text: 'Tidak ada error untuk diperbaiki.' };
      let fixed = 0;
      for (const err of res.errors) {
        // Apply non-destructive fix mark; real fixes must be applied manually in code/DB
        await markErrorFixed(err.id);
        fixed++;
      }
      return { text: `🛠️ Ditandai sebagai telah diperbaiki: ${fixed} error. Pastikan untuk verifikasi aplikasi.` };
    } else {
      const id = arg;
      await markErrorFixed(id);
      return { text: `🛠️ Error ${id} ditandai sebagai telah diperbaiki.` };
    }
  }

  // Natural language Indonesian intent shortcuts
  if (/analisis(kan)? semua error/i.test(trimmed)) {
    const res = await getRecentErrorRecords(20);
    if (!res.ok || !res.errors.length) return { text: 'Tidak ada error untuk dianalisis.' };
    for (const err of res.errors) {
      const analysis = autoAnalyzeError(err);
      await updateErrorAnalysis(err.id, analysis, 'analysis_complete');
    }
    return { text: '✅ Analisis semua error terbaru telah selesai.' };
  }
  if (/perbaik(i|an)? semua error/i.test(trimmed)) {
    const res = await getRecentErrorRecords(20);
    if (!res.ok || !res.errors.length) return { text: 'Tidak ada error untuk diperbaiki.' };
    for (const err of res.errors) {
      await markErrorFixed(err.id);
    }
    return { text: '🛠️ Semua error terbaru ditandai sebagai telah diperbaiki. Lakukan verifikasi.' };
  }

  // Unknown command → help
  if (trimmed.startsWith('/')) {
    return { text: 'Perintah tidak dikenali. Ketik /help untuk melihat daftar perintah.' };
  }

  // Fallback: treat as no-op admin command; let normal AI handle if needed
  return { text: 'Tidak ada perintah admin yang diproses. Ketik /help untuk bantuan.' };
}

async function setPending(sessionId: string, pending: any) {
  const { data: sess } = await supabaseAdmin
    .from('chat_sessions')
    .select('metadata')
    .eq('id', sessionId)
    .single();
  await supabaseAdmin
    .from('chat_sessions')
    .update({ metadata: { ...(sess?.metadata || {}), pendingAction: pending } })
    .eq('id', sessionId);
}

async function executePending(pending: any, origin: string, sessionId?: string): Promise<string> {
  // All admin actions are now disabled for safety.
  return '⚠️ Semua aksi admin telah dinonaktifkan demi keamanan. Tidak ada aksi yang dijalankan.';
}

function autoAnalyzeError(err: any) {
  const msg = (err.message || err.error_message || '').toString();
  const stack = (err.stack || err.error_stack || '').toString();
  const analysis: any = {
    id: err.id,
    type: err.error_type || 'unknown',
    summary: msg.slice(0, 200),
    likely_cause: 'unknown',
    recommendations: [] as string[],
  };
  if (/RLS|row level|policy/i.test(msg + ' ' + stack)) {
    analysis.likely_cause = 'RLS policy blocking request';
    analysis.recommendations.push('Periksa kebijakan RLS untuk tabel terkait dan tambahkan policy service role/anon yang benar.');
  }
  if (/updated_at|column .* does not exist/i.test(msg)) {
    analysis.likely_cause = 'Kolom/trigger waktu tidak sesuai';
    analysis.recommendations.push('Gunakan trigger DB untuk updated_at, hindari update manual dari API.');
  }
  if (/Failed to fetch|CORS|fetch/i.test(msg)) {
    analysis.likely_cause = 'Masalah jaringan/CORS/API route';
    analysis.recommendations.push('Pastikan route API tersedia dan CORS diizinkan.');
  }
  if (/JWTSessionError|next-auth/i.test(msg + ' ' + stack)) {
    analysis.likely_cause = 'Sesi Auth.js tidak valid atau secret berubah';
    analysis.recommendations.push('Periksa NEXTAUTH_SECRET dan lakukan relogin; tangani JWTSessionError di wrapper auth().');
  }
  if (/404/i.test(msg)) {
    analysis.likely_cause = 'Halaman atau route tidak ditemukan';
    analysis.recommendations.push('Tambahkan route/halaman yang hilang atau update link navigasi.');
  }
  if (analysis.recommendations.length === 0) {
    analysis.recommendations.push('Kumpulkan log tambahan dan stack trace lengkap untuk investigasi lanjutan.');
  }
  return analysis;
}
