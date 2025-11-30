// app/api/enroll/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/enroll/status
 * Check enrollment completion status for current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Get enrollment configuration from school settings
    const { data: config } = await supabaseAdmin
      .from('school_location_config')
      .select('require_enrollment, require_face_anchor, require_device_binding')
      .limit(1)
      .single();
    
    const enrollmentConfig = {
      requireEnrollment: config?.require_enrollment ?? true,
      requireFaceAnchor: config?.require_face_anchor ?? true,
      requireDeviceBinding: config?.require_device_binding ?? true,
    };
    
    // Check for reference photo
    const { data: biometricData } = await supabaseAdmin
      .from('biometric_data')
      .select('reference_photo_url, enrollment_status')
      .eq('user_id', userId)
      .single();
    
    const hasReferencePhoto = !!biometricData?.reference_photo_url;
    
    // Check for passkey/webauthn credential
    const { data: credentials } = await supabaseAdmin
      .from('webauthn_credentials')
      .select('id')
      .eq('user_id', userId)
      .limit(1);
    
    const hasPasskey = credentials && credentials.length > 0;
    
    // Check for device binding
    const { data: devices } = await supabaseAdmin
      .from('device_fingerprints')
      .select('id')
      .eq('user_id', userId)
      .limit(1);
    
    const hasDevice = devices && devices.length > 0;
    
    // Calculate completion based on configuration
    let isComplete = true;
    
    // If enrollment not required, user is complete
    if (!enrollmentConfig.requireEnrollment) {
      isComplete = true;
    } else {
      // Check face anchor requirement
      if (enrollmentConfig.requireFaceAnchor && !hasReferencePhoto) {
        isComplete = false;
      }
      
      // Check device binding requirement
      if (enrollmentConfig.requireDeviceBinding && !hasPasskey) {
        isComplete = false;
      }
    }
    
    return NextResponse.json({
      success: true,
      config: enrollmentConfig,
      status: {
        hasReferencePhoto,
        hasPasskey,
        hasDevice,
        isComplete,
        enrollmentStatus: biometricData?.enrollment_status || 'pending',
      },
    });
    
  } catch (error: any) {
    console.error('[Enroll Status Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Status check failed' },
      { status: 500 }
    );
  }
}
