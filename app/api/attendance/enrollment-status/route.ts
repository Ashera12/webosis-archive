// app/api/attendance/enrollment-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * Check if user has completed biometric enrollment
 * Used to determine if first-time attendance enrollment is needed
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

    // Check biometric_data table
    const { data: biometric, error } = await supabaseAdmin
      .from('biometric_data')
      .select(`
        id,
        user_id,
        reference_photo_url,
        fingerprint_template,
        enrollment_status,
        is_first_attendance_enrollment,
        re_enrollment_allowed,
        re_enrollment_reason,
        re_enrollment_approved_by,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found (expected for first time)
      console.error('[Enrollment Status] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to check enrollment status' },
        { status: 500 }
      );
    }

    // No biometric data = first time user
    if (!biometric) {
      return NextResponse.json({
        success: true,
        isEnrolled: false,
        isFirstAttendance: true,
        enrollmentDate: null,
        canReEnroll: false,
        message: '🎉 Absensi pertama! Kami akan mengambil data biometrik Anda.'
      });
    }

    // Has biometric data = already enrolled
    const isEnrolled = !!biometric.reference_photo_url && 
                       !!biometric.fingerprint_template &&
                       biometric.enrollment_status === 'complete';

    return NextResponse.json({
      success: true,
      isEnrolled,
      isFirstAttendance: false,
      enrollmentDate: biometric.created_at,
      enrollmentMethod: biometric.is_first_attendance_enrollment ? 'attendance' : 'manual',
      canReEnroll: biometric.re_enrollment_allowed || false,
      reEnrollReason: biometric.re_enrollment_reason || null,
      hasReferencePhoto: !!biometric.reference_photo_url,
      hasFingerprint: !!biometric.fingerprint_template,
      message: isEnrolled 
        ? '✅ Sudah terdaftar. Lakukan verifikasi untuk absensi.'
        : '⚠️ Enrollment tidak lengkap. Silakan lengkapi data biometrik.'
    });

  } catch (error: any) {
    console.error('[Enrollment Status] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
