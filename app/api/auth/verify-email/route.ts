import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import crypto from 'crypto';

// GET /api/auth/verify-email?token=...
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');
    if (!token) {
      return NextResponse.json({ error: 'Token diperlukan' }, { status: 400 });
    }
    if (!/^[a-f0-9]{64}$/.test(token)) {
      return NextResponse.json({ error: 'Format token tidak valid' }, { status: 400 });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const { data: row, error: selErr } = await supabaseAdmin
      .from('email_verifications')
      .select('id,user_id,expires_at,used')
      .eq('token_hash', tokenHash)
      .single();
    if (selErr || !row) {
      return NextResponse.json({ error: 'Token tidak ditemukan atau sudah digunakan' }, { status: 400 });
    }
    if (row.used) {
      return NextResponse.json({ error: 'Token sudah digunakan' }, { status: 400 });
    }
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: 'Token kadaluarsa' }, { status: 400 });
    }

    const { error: updUserErr } = await supabaseAdmin
      .from('users')
      .update({ email_verified: true })
      .eq('id', row.user_id);
    if (updUserErr) {
      return NextResponse.json({ error: 'Gagal menandai email terverifikasi' }, { status: 500 });
    }
    const { error: markErr } = await supabaseAdmin
      .from('email_verifications')
      .update({ used: true })
      .eq('id', row.id);
    if (markErr) {
      console.warn('[verify-email] gagal menandai token used', markErr.message);
    }

    // Get user email for redirect
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', row.user_id)
      .single();
    
    return NextResponse.json({ 
      message: 'Email berhasil diverifikasi. Menunggu persetujuan admin.',
      email: user?.email || ''
    });
  } catch (e: any) {
    console.error('[verify-email] exception', e?.message || e);
    return NextResponse.json({ error: 'Kesalahan server.' }, { status: 500 });
  }
}