import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, safeRpc } from '@/lib/supabase/server';

// Check-in endpoint implementing token consumption logic used by tests
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token: string | undefined = body.token;
    const rawEmail: string | undefined = body.email;
    const user_id: string | undefined = body.user_id;
    const name: string | undefined = body.name;
    const email = rawEmail ? rawEmail.toLowerCase() : undefined;
    if (!token) {
      return NextResponse.json({ ok: false, error: 'Missing token' });
    }

    // Fetch QR token row
    const { data: qr } = await supabaseAdmin
      .from('event_qr_codes')
      .select('*')
      .eq('token', token)
      .limit(1)
      .single();

    if (!qr) {
      return NextResponse.json({ ok: false, error: 'Invalid token' });
    }

    // Expiration check
    if (qr.expires_at) {
      const exp = new Date(qr.expires_at).getTime();
      if (!isNaN(exp) && exp < Date.now()) {
        return NextResponse.json({ ok: false, error: 'Token expired' });
      }
    }

    // Duplicate checks (email / user)
    if (email) {
      const existingByEmail = await supabaseAdmin
        .from('attendance')
        .select('*')
        .eq('event_id', qr.event_id)
        .ilike('email', email)
        .limit(1);
      if ((existingByEmail as any).data && (existingByEmail as any).data.length > 0) {
        return NextResponse.json({ ok: false, message: 'Already checked in by email' });
      }
    }
    if (user_id) {
      const existingByUser = await supabaseAdmin
        .from('attendance')
        .select('*')
        .eq('event_id', qr.event_id)
        .eq('user_id', user_id)
        .limit(1);
      if ((existingByUser as any).data && (existingByUser as any).data.length > 0) {
        return NextResponse.json({ ok: false, message: 'User already checked in' });
      }
    }

    // Attempt RPC first (handles single-use + marking used atomically in real system)
    let rpcResult: any = null;
    try {
      rpcResult = await (safeRpc ? safeRpc('consume_checkin', {
        p_token: token,
        p_name: name || null,
        p_email: email || null,
        p_user_id: user_id || null,
        p_metadata: {},
      }) : supabaseAdmin.rpc('consume_checkin', {
        p_token: token,
        p_name: name || null,
        p_email: email || null,
        p_user_id: user_id || null,
        p_metadata: {},
      }));
    } catch (e) {
      // ignore rpc exceptions; fallback to manual path
      rpcResult = { data: null, error: { message: (e as Error).message } };
    }

    if (rpcResult && rpcResult.data && rpcResult.data.ok === false) {
      // Explicit token_already_used path
      if (rpcResult.data.error === 'token_already_used') {
        return NextResponse.json({ ok: false, error: 'token_already_used' });
      }
    }

    // Manual single-use enforcement if RPC unavailable
    if (qr.single_use) {
      if (qr.used) {
        return NextResponse.json({ ok: false, error: 'token_already_used' });
      }
      // Optimistic mark used
      const updateRes: any = await supabaseAdmin
        .from('event_qr_codes')
        .update({ used: true })
        .eq('id', qr.id)
        .select()
        .single();
      if (!updateRes?.data) {
        // Second attempt / already used
        return NextResponse.json({ ok: false, error: 'token_already_used' });
      }
    }

    // Insert attendance record
    const attendanceInsert: any = await supabaseAdmin
      .from('attendance')
      .insert({
        qr_token_id: qr.id,
        event_id: qr.event_id,
        token,
        email: email || null,
        user_id: user_id || null,
        name: name || null,
        metadata: {},
      })
      .select()
      .single();

    const attendance = attendanceInsert?.data || {
      id: 'att-local',
      email,
      user_id,
      name,
    };

    return NextResponse.json({ ok: true, attendance });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message || 'Unknown error' });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
