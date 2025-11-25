import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/server';

function validatePassword(pw: string): string | null {
  if (pw.length < 8) return 'Minimal 8 karakter';
  if (!/[A-Z]/.test(pw)) return 'Harus ada huruf besar (A-Z)';
  if (!/[a-z]/.test(pw)) return 'Harus ada huruf kecil (a-z)';
  if (!/[0-9]/.test(pw)) return 'Harus ada angka (0-9)';
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawToken: string | undefined = body.token;
    const newPassword: string | undefined = body.newPassword;
    if (!rawToken || !newPassword) {
      return NextResponse.json({ error: 'Token dan password baru wajib diisi' }, { status: 400 });
    }

    const pwError = validatePassword(newPassword);
    if (pwError) {
      return NextResponse.json({ error: `Password baru tidak valid: ${pwError}` }, { status: 400 });
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const { data: resetRow, error: selErr } = await supabaseAdmin
      .from('password_resets')
      .select('id,user_id,expires_at,used')
      .eq('token_hash', tokenHash)
      .single();

    if (selErr || !resetRow) {
      return NextResponse.json({ error: 'Token tidak valid atau sudah digunakan' }, { status: 400 });
    }

    if (resetRow.used) {
      return NextResponse.json({ error: 'Token sudah digunakan' }, { status: 400 });
    }

    if (new Date(resetRow.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: 'Token telah kedaluwarsa' }, { status: 400 });
    }

    // Hash new password
    const bcrypt = (await import('bcryptjs')).default;
    const saltRounds = Number(process.env.PASSWORD_SALT_ROUNDS ?? 10);
    const newHash = await bcrypt.hash(newPassword, saltRounds);

    const { error: updErr } = await supabaseAdmin
      .from('users')
      .update({ password_hash: newHash })
      .eq('id', resetRow.user_id);
    if (updErr) {
      console.error('[reset-password] update user error', updErr);
      return NextResponse.json({ error: 'Gagal memperbarui password' }, { status: 500 });
    }

    const { error: markErr } = await supabaseAdmin
      .from('password_resets')
      .update({ used: true })
      .eq('id', resetRow.id);
    if (markErr) {
      console.error('[reset-password] mark used error', markErr);
      // Non-fatal: password updated already
    }

    return NextResponse.json({ message: 'Password berhasil direset. Silakan login kembali.' });
  } catch (e: any) {
    console.error('[reset-password] exception', e?.message || e);
    return NextResponse.json({ error: 'Kesalahan server.' }, { status: 500 });
  }
}
