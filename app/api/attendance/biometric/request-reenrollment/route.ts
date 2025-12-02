import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * POST /api/attendance/biometric/request-reenrollment
 * Request admin approval to re-enroll biometric data
 * 
 * Use case:
 * - User ganti device
 * - User ganti biometric method (fingerprint → Face ID)
 * - Browser fingerprint berubah setelah update
 * 
 * Flow:
 * 1. User submit request dengan reason
 * 2. Admin review di admin panel
 * 3. Admin approve → delete old biometric_data → user re-enroll
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id!;
    const body = await request.json();
    const { reason, newMethod } = body;

    if (!reason || reason.trim().length < 10) {
      return NextResponse.json(
        { error: 'Alasan harus diisi minimal 10 karakter' },
        { status: 400 }
      );
    }

    // Check if already has pending request
    const { data: existingRequest } = await supabaseAdmin
      .from('biometric_reset_requests')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['pending', 'approved'])
      .single();

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return NextResponse.json(
          { error: 'Anda sudah memiliki request pending. Tunggu admin approval.' },
          { status: 400 }
        );
      }
      if (existingRequest.status === 'approved') {
        return NextResponse.json(
          { error: 'Request sebelumnya sudah approved. Silakan lakukan re-enrollment.' },
          { status: 400 }
        );
      }
    }

    // Get current biometric data
    const { data: currentBiometric } = await supabaseAdmin
      .from('biometric_data')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Create request
    const { data: newRequest, error: insertError } = await supabaseAdmin
      .from('biometric_reset_requests')
      .insert({
        user_id: userId,
        reason: reason.trim(),
        current_biometric_type: currentBiometric?.biometric_type || 'unknown',
        requested_biometric_type: newMethod || null,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Re-enrollment Request] Insert error:', insertError);
      return NextResponse.json(
        { error: 'Gagal submit request: ' + insertError.message },
        { status: 500 }
      );
    }

    console.log('[Re-enrollment Request] ✅ Request created:', newRequest.id);

    return NextResponse.json({
      success: true,
      message: 'Request berhasil dikirim ke admin',
      requestId: newRequest.id,
      data: newRequest,
    });

  } catch (error: any) {
    console.error('[Re-enrollment Request] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/attendance/biometric/request-reenrollment
 * Check if user has pending/approved re-enrollment request
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id!;

    // Get latest request
    const { data: latestRequest, error: fetchError } = await supabaseAdmin
      .from('biometric_reset_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('[Re-enrollment Request] Fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Gagal cek request: ' + fetchError.message },
        { status: 500 }
      );
    }

    if (!latestRequest) {
      return NextResponse.json({
        hasRequest: false,
        data: null,
      });
    }

    return NextResponse.json({
      hasRequest: true,
      data: latestRequest,
      status: latestRequest.status,
    });

  } catch (error: any) {
    console.error('[Re-enrollment Request] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
