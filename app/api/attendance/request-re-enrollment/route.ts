import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { logActivity, getIpAddress, parseUserAgent } from '@/lib/activity-logger';

/**
 * POST /api/attendance/request-re-enrollment
 * User requests permission to re-enroll biometric data (e.g., device change)
 * Requires admin approval before user can re-enroll
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { reason } = body;

    if (!reason || reason.trim().length < 10) {
      return NextResponse.json(
        { error: 'Alasan harus diisi minimal 10 karakter' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Check if biometric data exists
    const { data: biometric, error: biometricError } = await supabaseAdmin
      .from('biometric_data')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (biometricError || !biometric) {
      return NextResponse.json(
        { error: 'Data biometrik tidak ditemukan. Gunakan absensi pertama untuk enrollment otomatis.' },
        { status: 404 }
      );
    }

    // Check if already has pending re-enrollment request
    if (biometric.re_enrollment_allowed === null && biometric.re_enrollment_reason) {
      return NextResponse.json(
        { 
          error: 'Request re-enrollment sudah diajukan dan menunggu persetujuan admin',
          status: 'pending'
        },
        { status: 400 }
      );
    }

    // Update biometric_data to request re-enrollment
    const { error: updateError } = await supabaseAdmin
      .from('biometric_data')
      .update({
        re_enrollment_allowed: null, // null = pending approval
        re_enrollment_reason: reason.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('[Re-enrollment Request] Update failed:', updateError);
      return NextResponse.json(
        { error: 'Gagal mengajukan request re-enrollment' },
        { status: 500 }
      );
    }

    // Log activity
    await logActivity({
      userId,
      userName: session.user.name,
      userEmail: session.user.email,
      userRole: (session.user as any).role,
      activityType: 'security_validation',
      action: 'Re-enrollment request submitted',
      description: `User requested re-enrollment approval: ${reason.substring(0, 50)}`,
      metadata: {
        reason,
        previous_enrollment_date: biometric.created_at,
      },
      ipAddress: getIpAddress(request),
      userAgent: request.headers.get('user-agent') || undefined,
      deviceInfo: parseUserAgent(request.headers.get('user-agent') || ''),
      status: 'pending',
    });

    return NextResponse.json({
      success: true,
      message: 'Request re-enrollment berhasil diajukan. Menunggu persetujuan admin.',
      status: 'pending',
    });

  } catch (error: any) {
    console.error('[Re-enrollment Request] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/attendance/request-re-enrollment
 * Check re-enrollment request status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get biometric data with re-enrollment status
    const { data: biometric, error } = await supabaseAdmin
      .from('biometric_data')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !biometric) {
      return NextResponse.json({
        hasRequest: false,
        status: 'no_enrollment',
      });
    }

    // Check re-enrollment status
    let status = 'none';
    if (biometric.re_enrollment_allowed === true) {
      status = 'approved';
    } else if (biometric.re_enrollment_allowed === false) {
      status = 'rejected';
    } else if (biometric.re_enrollment_allowed === null && biometric.re_enrollment_reason) {
      status = 'pending';
    }

    return NextResponse.json({
      hasRequest: status !== 'none',
      status,
      reason: biometric.re_enrollment_reason,
      approvedBy: biometric.re_enrollment_approved_by,
      approvedAt: biometric.re_enrollment_approved_at,
    });

  } catch (error: any) {
    console.error('[Re-enrollment Status] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
