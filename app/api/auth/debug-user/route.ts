import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }
    const normalized = email.trim().toLowerCase();
    const { supabaseAdmin } = await import('@/lib/supabase/server');
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role, approved, email_verified, password_hash, requested_role, rejected, rejection_reason')
      .ilike('email', normalized)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return NextResponse.json({ found: false, email: normalized });
    }
    // Minimal leak-safe diagnostics (do NOT expose hash content)
    const hasHash = !!data.password_hash;
    const result = {
      found: true,
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      approved: !!data.approved,
      email_verified: !!data.email_verified,
      has_password_hash: hasHash,
      requested_role: (data as any).requested_role ?? null,
      rejected: !!(data as any).rejected,
      rejection_reason: (data as any).rejection_reason ?? null,
    };
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}
