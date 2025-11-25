import { NextRequest, NextResponse } from 'next/server';

// POST /api/auth/check-email-state { email }
// Returns { email_verified, approved, exists }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(()=>({}));
    let { email } = body as { email?: string };
    if (!email) return NextResponse.json({ error: 'Email diperlukan' }, { status: 400 });
    email = email.trim().toLowerCase();
    const { supabaseAdmin } = await import('@/lib/supabase/server');
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id,email,email_verified,approved')
      .ilike('email', email)
      .maybeSingle();
    if (error || !data) return NextResponse.json({ exists: false, email_verified: false, approved: false });
    return NextResponse.json({ exists: true, email_verified: !!data.email_verified, approved: !!data.approved });
  } catch (e:any) {
    return NextResponse.json({ error: 'Kesalahan server' }, { status: 500 });
  }
}
