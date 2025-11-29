import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const fingerprint = formData.get('fingerprint') as string;
    const userId = formData.get('userId') as string;

    if (!fingerprint || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing fingerprint or userId' },
        { status: 400 }
      );
    }

    // Verify user is checking their own biometric
    if (session.user.id !== userId) {
      return NextResponse.json(
        { success: false, error: 'Cannot verify for other users' },
        { status: 403 }
      );
    }

    // Get user's biometric data
    const { data: biometric, error } = await supabase
      .from('user_biometric')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error || !biometric) {
      return NextResponse.json(
        { success: false, error: 'Biometric data not found. Please setup first.' },
        { status: 404 }
      );
    }

    // Compare fingerprint hash
    const verified = fingerprint === biometric.fingerprint_hash;

    return NextResponse.json({
      success: true,
      verified,
      message: verified
        ? 'Biometric verified successfully'
        : 'Biometric verification failed. Please try again.',
    });
  } catch (error: any) {
    console.error('Verify biometric error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
