import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import crypto from 'crypto';
import { sendMail } from '@/lib/mailer';

// Basic in-memory rate limiting (process local)
const REG_WINDOW = 10 * 60 * 1000; // 10 minutes
const REG_MAX = Number(process.env.REG_MAX_ATTEMPTS ?? 5);
const regMap = new Map<string, { count: number; first: number }>();

function getReg(key: string) {
  const v = regMap.get(key);
  if (!v) return { count: 0, first: 0 };
  if (Date.now() - v.first > REG_WINDOW) { regMap.delete(key); return { count: 0, first: 0 }; }
  return v;
}
function incReg(key: string) {
  const now = Date.now();
  const v = regMap.get(key);
  if (!v) { regMap.set(key, { count: 1, first: now }); return; }
  if (now - v.first > REG_WINDOW) { regMap.set(key, { count: 1, first: now }); return; }
  v.count += 1; regMap.set(key, v);
}

function validatePassword(pw: string): string | null {
  if (pw.length < 8) return 'Minimal 8 karakter';
  if (!/[A-Z]/.test(pw)) return 'Harus ada huruf besar';
  if (!/[a-z]/.test(pw)) return 'Harus ada huruf kecil';
  if (!/[0-9]/.test(pw)) return 'Harus ada angka';
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    let { email, password, name, nickname, role: requestedRole, unit_sekolah, nik, nisn, kelas } = body as { 
      email?: string; password?: string; name?: string; nickname?: string; role?: string; unit_sekolah?: string; nik?: string; nisn?: string; kelas?: string
    };

    if (!email || !password) {
      return NextResponse.json({ error: 'Email dan password wajib diisi' }, { status: 400 });
    }
    email = email.trim().toLowerCase();
    name = (name || '').trim();
    nickname = (nickname || '').trim();
    unit_sekolah = (unit_sekolah || '').trim();
    nik = (nik || '').trim();
    nisn = (nisn || '').trim();
    kelas = (kelas || '').trim();
    requestedRole = (requestedRole || '').trim().toLowerCase();

    // Validate extra fields
    const errors: string[] = [];
    if (name.length < 3) errors.push('Nama lengkap minimal 3 karakter');
    if (nickname && nickname.length < 2) errors.push('Nama panggilan minimal 2 karakter');
    if (nik && !/^\d{16}$/.test(nik)) errors.push('NIK harus 16 digit angka');
    if (nisn && !/^\d{10}$/.test(nisn)) errors.push('NISN harus 10 digit angka');
    const allowedPublicRoles = ['osis','siswa','guru'];
    if (!requestedRole || !allowedPublicRoles.includes(requestedRole)) {
      requestedRole = 'siswa'; // default fallback
    }
    if (unit_sekolah && unit_sekolah.length < 2) errors.push('Unit Sekolah minimal 2 karakter');
    if (errors.length) {
      return NextResponse.json({ error: errors.join('; ') }, { status: 400 });
    }

    const attemptKey = `reg:${email}`;
    const attempts = getReg(attemptKey);
    if (attempts.count >= REG_MAX) {
      return NextResponse.json({ error: 'Terlalu banyak percobaan registrasi. Coba lagi nanti.' }, { status: 429 });
    }

    const pwErr = validatePassword(password);
    if (pwErr) {
      incReg(attemptKey);
      return NextResponse.json({ error: `Password tidak valid: ${pwErr}` }, { status: 400 });
    }

    // Check existing user
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .ilike('email', email)
      .limit(1)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ error: 'Email sudah terdaftar.' }, { status: 400 });
    }

    // Hash password
    const bcrypt = (await import('bcryptjs')).default;
    const saltRounds = Number(process.env.PASSWORD_SALT_ROUNDS ?? 10);
    const hash = await bcrypt.hash(password, saltRounds);

    // Generate UUID if table does not auto-generate id
    const userId = (crypto as any).randomUUID ? (crypto as any).randomUUID() : crypto.randomBytes(16).toString('hex');
    // Insert user with pending flags
    const { data: user, error: insErr } = await supabaseAdmin
      .from('users')
      .insert({ 
        id: userId,
        email,
        name: name || null,
        nickname: nickname || null,
        unit_sekolah: unit_sekolah || null,
        kelas: kelas || null,
        nik: nik || null,
        nisn: nisn || null,
        requested_role: requestedRole || null,
        password_hash: hash,
        role: 'pending',
        email_verified: false,
        approved: false
      })
      .select('id,email')
      .single();
    if (insErr || !user) {
      console.error('[register] insert user error', insErr);
      const isDev = process.env.NODE_ENV !== 'production';
      return NextResponse.json({ error: 'Gagal membuat akun.', ...(isDev && insErr ? { dev_detail: insErr.message || String(insErr) } : {}) }, { status: 500 });
    }

    // Create verification token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(); // 24h
    const { error: verErr } = await supabaseAdmin.from('email_verifications').insert({ user_id: user.id, token_hash: tokenHash, expires_at: expiresAt });
    let devVerErr: string | null = null;
    if (verErr) {
      console.error('[register] ver token error', verErr);
      devVerErr = verErr.message || String(verErr);
      // Dev fallback: if verification table missing, mark user email_verified immediately for testing flow
      if ((process.env.NODE_ENV !== 'production') && devVerErr.includes("Could not find the table 'public.email_verifications'")) {
        const { error: fbErr } = await supabaseAdmin.from('users').update({ email_verified: true }).eq('id', user.id);
        if (fbErr) {
          devVerErr += ` | fallback update failed: ${fbErr.message || fbErr}`;
        } else {
          devVerErr += ' | fallback email_verified applied';
        }
      }
    }

    incReg(attemptKey);

    // Send verification email (or expose link in dev if mailer not configured)
    const host = req.headers.get('host') || 'localhost:3000';
    const proto = host.includes('localhost') ? 'http' : 'https';
    const base = `${proto}://${host}`;
    const verificationLink = `${base}/verify-email/${rawToken}`;
    // Use public logo URL from env, fallback to localhost for dev
    const logoUrl = process.env.LOGO_URL || `${base}/images/logo-2.png`;
    let mailSent = false;
    try {
      const { buildVerificationEmail } = await import('@/lib/emailTemplates');
      const tpl = buildVerificationEmail({ verificationLink, name, firstTime: true, logoUrl });
      const mailRes = await sendMail({ to: email, subject: tpl.subject, text: tpl.text, html: tpl.html });
      mailSent = !!mailRes;
    } catch (mailErr: any) {
      console.warn('[register] sendMail failed', mailErr?.message || mailErr);
    }

    // In development, include raw token & user id to simplify local testing of lifecycle
    const expose = process.env.EXPOSE_VERIFICATION_TOKENS === 'true';
    const mailConfigured = !!process.env.SENDGRID_API_KEY || !!process.env.SMTP_HOST;
    const isLocalDev = host.includes('localhost') || host.includes('127.0.0.1');
    return NextResponse.json({
      message: 'Akun dibuat. Silakan cek email Anda untuk verifikasi. Setelah terverifikasi, menunggu persetujuan admin.',
      ...(expose || (!mailConfigured && isLocalDev)) ? { 
        dev_verification_token: rawToken,
        dev_verification_link: verificationLink,
        dev_user_id: user.id,
        mail_sent: mailSent,
        mail_configured: mailConfigured,
        ...(devVerErr ? { dev_ver_error: devVerErr } : {})
      } : {}
    });
  } catch (e: any) {
    console.error('[register] exception', e?.message || e);
    return NextResponse.json({ error: 'Kesalahan server.' }, { status: 500 });
  }
}