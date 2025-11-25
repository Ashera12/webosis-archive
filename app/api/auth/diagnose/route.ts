import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { email: rawEmail, password } = await req.json();
    const email = (rawEmail || '').trim().toLowerCase();

    if (!email || !password) {
      return NextResponse.json({ ok: false, message: 'Email dan password harus diisi' }, { status: 400 });
    }

    const { supabaseAdmin } = await import('@/lib/supabase/server');
    const bcrypt = (await import('bcryptjs')).default;

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, password_hash, email_verified, approved, role')
      .ilike('email', email)
      .single();

    if (error || !user) {
      return NextResponse.json({ ok: false, message: `Email "${email}" tidak terdaftar. Silakan registrasi terlebih dahulu atau periksa ejaan email Anda.` }, { status: 200 });
    }

    if (!user.password_hash) {
      return NextResponse.json({ ok: false, message: 'Akun Anda belum memiliki password. Silakan hubungi admin untuk reset password.' }, { status: 200 });
    }

    const valid = await bcrypt.compare(password, user.password_hash as string);
    if (!valid) {
      return NextResponse.json({ ok: false, message: 'Password salah! Jika lupa, minta admin untuk reset password.' }, { status: 200 });
    }

    if (!user.email_verified) {
      return NextResponse.json({ ok: false, message: `Email "${user.email}" belum diverifikasi. Silakan cek inbox email Anda dan klik link verifikasi. Jika tidak menemukan email, cek folder spam.` }, { status: 200 });
    }

    if (!user.approved) {
      return NextResponse.json({ ok: false, message: `Akun Anda (${user.email}) sudah terdaftar dan email terverifikasi, tetapi belum disetujui oleh admin. Role Anda saat ini: ${user.role || 'belum ditentukan'}. Silakan tunggu approval dari Super Admin.` }, { status: 200 });
    }

    return NextResponse.json({ ok: true, message: 'OK', role: user.role || null }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message || 'Diagnosa login gagal' }, { status: 500 });
  }
}
