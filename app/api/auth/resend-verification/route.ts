import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { sendMail } from '@/lib/mailer';

// POST /api/auth/resend-verification { email }
// Creates a new verification token if user exists, not verified yet.
// Marks previous unused tokens as used to avoid confusion.
// Rate limited (simple in-memory) by email.

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = Number(process.env.RESEND_MAX_ATTEMPTS ?? 3);
const attemptMap = new Map<string, { count: number; first: number }>();
function get(key: string){
  const v = attemptMap.get(key); if(!v) return {count:0,first:0}; if(Date.now()-v.first>WINDOW_MS){attemptMap.delete(key); return {count:0,first:0};} return v;
}
function inc(key: string){ const now=Date.now(); const v=attemptMap.get(key); if(!v){attemptMap.set(key,{count:1,first:now});return;} if(now-v.first>WINDOW_MS){attemptMap.set(key,{count:1,first:now});return;} v.count++; attemptMap.set(key,v); }

export async function POST(req: NextRequest){
  try {
    const body = await req.json().catch(()=>({}));
    let { email } = body as { email?: string };
    if(!email) return NextResponse.json({ error: 'Email diperlukan' }, { status: 400 });
    email = email.trim().toLowerCase();

    const key = 'resend:'+email;
    const at = get(key);
    if(at.count >= MAX_ATTEMPTS){
      return NextResponse.json({ error: 'Terlalu banyak permintaan kirim ulang. Coba lagi nanti.' }, { status: 429 });
    }

    const { supabaseAdmin } = await import('@/lib/supabase/server');
    const { data: user, error: userErr } = await supabaseAdmin
      .from('users')
      .select('id,email,email_verified')
      .ilike('email', email)
      .maybeSingle();

    if(userErr || !user){ inc(key); return NextResponse.json({ error: 'Email belum terdaftar.' }, { status: 400 }); }
    if(user.email_verified){ inc(key); return NextResponse.json({ error: 'Email sudah diverifikasi.' }, { status: 400 }); }

    // Ensure table exists
    const { data: existingTokens } = await supabaseAdmin
      .from('email_verifications')
      .select('id,used')
      .eq('user_id', user.id)
      .eq('used', false);

    // Mark old unused tokens as used to invalidate them
    if(existingTokens && existingTokens.length){
      const ids = existingTokens.map(r=>r.id);
      await supabaseAdmin.from('email_verifications').update({ used: true }).in('id', ids);
    }

    // Create new token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 1000*60*60*24).toISOString();
    const { error: insErr } = await supabaseAdmin.from('email_verifications').insert({ user_id: user.id, token_hash: tokenHash, expires_at: expiresAt });
    if(insErr){ inc(key); return NextResponse.json({ error: 'Gagal membuat token baru.' }, { status: 500 }); }

    inc(key);

    // Send email (with dev exposure if mailer not configured)
    const host = req.headers.get('host') || process.env.NEXT_PUBLIC_BASE_URL || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const proto = host.includes('localhost') ? 'http' : 'https';
    const link = `${proto}://${host}/verify-email/${rawToken}`;
    // Use public logo URL from env, fallback to localhost for dev
    const logoUrl = process.env.LOGO_URL || `${proto}://${host}/images/logo-2.png`;
    let mailSent = false;
    try {
      const { buildVerificationEmail } = await import('@/lib/emailTemplates');
      const tpl = buildVerificationEmail({ verificationLink: link, firstTime: false, logoUrl });
      const mailRes = await sendMail({ to: email, subject: tpl.subject, text: tpl.text, html: tpl.html });
      mailSent = !!mailRes;
    } catch(mailErr:any){
      console.warn('[resend-verification] sendMail failed', mailErr?.message || mailErr);
    }

    const isLocalDev = host.includes('localhost') || host.includes('127.0.0.1');
    const mailConfigured = !!process.env.SENDGRID_API_KEY || !!process.env.SMTP_HOST;
    return NextResponse.json({
      message: 'Email verifikasi baru diproses.',
      ...(isLocalDev ? {
        dev_token: rawToken,
        dev_link: link,
        mail_sent: mailSent,
        mail_configured: mailConfigured
      } : {})
    });
  } catch(e:any){
    console.error('[resend-verification] exception', e?.message || e);
    return NextResponse.json({ error: 'Kesalahan server.' }, { status: 500 });
  }
}
