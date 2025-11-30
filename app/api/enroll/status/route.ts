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
    
    // Check for reference photo
    const { data: biometricData } = await supabaseAdmin
      .from('biometric_data')
      .select('reference_photo_url')
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
    
    const isComplete = hasReferencePhoto && hasPasskey;
    
    return NextResponse.json({
      success: true,
      status: {
        hasReferencePhoto,
        hasPasskey,
        hasDevice,
        isComplete,
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
