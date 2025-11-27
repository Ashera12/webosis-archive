import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/server';
import { sendResetEmail } from '@/lib/mailer';

// Simple in-memory rate limit per normalized email (process local)
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_REQUESTS = 3; // Allow up to 3 forgot requests per window
const forgotMap = new Map<string, { count: number; first: number }>();

function getForgot(key: string) {
  const v = forgotMap.get(key);
  if (!v) return { count: 0, first: 0 };
  if (Date.now() - v.first > WINDOW_MS) {
    forgotMap.delete(key);
    return { count: 0, first: 0 };
  }
  return v;
}
function incForgot(key: string) {
  const now = Date.now();
  const v = forgotMap.get(key);
  if (!v) { forgotMap.set(key, { count: 1, first: now }); return; }
  if (now - v.first > WINDOW_MS) { forgotMap.set(key, { count: 1, first: now }); return; }
  v.count += 1; forgotMap.set(key, v);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawEmail: string | undefined = body.email;
    if (!rawEmail || typeof rawEmail !== 'string') {
      return NextResponse.json({ error: 'Email wajib diisi' }, { status: 400 });
    }
    const email = rawEmail.trim().toLowerCase();

    const attempts = getForgot(email);
    if (attempts.count >= MAX_REQUESTS) {
      return NextResponse.json({ error: 'Terlalu banyak permintaan lupa password. Coba lagi beberapa menit.' }, { status: 429 });
    }

    // Find user by case-insensitive email
    const { data: user, error: userErr } = await supabaseAdmin
      .from('users')
      .select('id,email')
      .ilike('email', email)
      .single();

    if (userErr || !user) {
      incForgot(email); // Do not reveal user existence
      return NextResponse.json({ message: 'Jika email terdaftar, link reset akan dikirim.' });
    }

    // Clean previous unused tokens (optional hygiene)
    await supabaseAdmin.from('password_resets')
      .update({ used: true })
      .eq('user_id', user.id)
      .eq('used', false)
      .lt('expires_at', new Date().toISOString());

    // Generate new token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60).toISOString(); // 1 hour

    const { error: insertErr } = await supabaseAdmin.from('password_resets').insert({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt
    });
    if (insertErr) {
      console.error('[forgot-password] insert error', insertErr);
      return NextResponse.json({ error: 'Gagal membuat token reset. Coba lagi.' }, { status: 500 });
    }

    incForgot(email);

    const host = req.headers.get('host') || process.env.NEXT_PUBLIC_BASE_URL || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const proto = host.includes('localhost') ? 'http' : 'https';
    const base = `${proto}://${host}`;
    const resetLink = `${base}/admin/reset-password/${rawToken}`;
    // Use public logo URL from env, fallback to localhost for dev
    const logoUrl = process.env.LOGO_URL || `${base}/images/logo-2.png`;

    // In production you would send email here (SMTP / Resend / etc.)
    // For development we return the link so you can test quickly.
    // Attempt email sending (silent failure)
    try {
      await sendResetEmail(email, resetLink, logoUrl);
    } catch (mailErr: any) {
      console.warn('[forgot-password] send email failed', mailErr?.message || mailErr);
    }
    const response: any = { message: 'Jika email terdaftar, link reset telah dibuat.' };
    // Only show debug link in localhost development
    const isLocalDev = host.includes('localhost') || host.includes('127.0.0.1');
    if (isLocalDev) {
      response.debugResetLink = resetLink;
    }
    return NextResponse.json(response);
  } catch (e: any) {
    console.error('[forgot-password] exception', e?.message || e);
    return NextResponse.json({ error: 'Kesalahan server.' }, { status: 500 });
  }
}
