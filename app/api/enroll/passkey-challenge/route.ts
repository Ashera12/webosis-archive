// app/api/enroll/passkey-challenge/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateRegistrationOptions } from '@simplewebauthn/server';

/**
 * POST /api/enroll/passkey-challenge
 * Generate WebAuthn registration challenge for device binding
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const userName = session.user.name || session.user.email || 'User';
    
    const rpName = process.env.NEXT_PUBLIC_APP_NAME || 'OSIS Attendance';
    const rpID = process.env.NEXT_PUBLIC_RP_ID || 'localhost';
    
    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: userId,
      userName,
      timeout: 60000,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform', // Prefer platform authenticators (Windows Hello, TouchID)
      },
      supportedAlgorithmIDs: [-7, -257], // ES256, RS256
    });
    
    console.log('[Passkey Registration Challenge] Generated for user:', userId);
    
    // Store challenge in session or database (temporary)
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    await supabaseAdmin.from('webauthn_challenges').insert({
      user_id: userId,
      challenge: options.challenge,
      type: 'registration',
      expires_at: new Date(Date.now() + 60000).toISOString(),
    });
    
    return NextResponse.json({
      success: true,
      options,
    });
    
  } catch (error: any) {
    console.error('[Passkey Challenge Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Challenge generation failed' },
      { status: 500 }
    );
  }
}
