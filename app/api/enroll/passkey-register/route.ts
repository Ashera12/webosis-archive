// app/api/enroll/passkey-register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import type { RegistrationResponseJSON } from '@simplewebauthn/types';

/**
 * POST /api/enroll/passkey-register
 * Verify and store WebAuthn passkey registration
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
    const body = await request.json();
    const { credential } = body as { credential: RegistrationResponseJSON };
    
    if (!credential) {
      return NextResponse.json(
        { success: false, error: 'Credential required' },
        { status: 400 }
      );
    }
    
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Get stored challenge
    const { data: challengeData } = await supabaseAdmin
      .from('webauthn_challenges')
      .select('challenge')
      .eq('user_id', userId)
      .eq('type', 'registration')
      .single();
    
    if (!challengeData) {
      return NextResponse.json(
        { success: false, error: 'Challenge not found or expired' },
        { status: 400 }
      );
    }
    
    const expectedChallenge = challengeData.challenge;
    const rpID = process.env.NEXT_PUBLIC_RP_ID || 'localhost';
    const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:3000`;
    
    // Verify registration
    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });
    
    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json(
        { success: false, error: 'Verification failed' },
        { status: 400 }
      );
    }
    
    const { credentialPublicKey, credentialID, counter } = verification.registrationInfo;
    
    // Store credential in database
    await supabaseAdmin.from('webauthn_credentials').insert({
      user_id: userId,
      credential_id: Buffer.from(credentialID).toString('base64'),
      public_key: Buffer.from(credentialPublicKey).toString('base64'),
      counter,
      transports: credential.response.transports || [],
      device_type: 'platform', // Assuming platform authenticator
    });
    
    // Update biometric_data enrollment status
    await supabaseAdmin
      .from('biometric_data')
      .update({
        enrollment_status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
    
    // Delete used challenge
    await supabaseAdmin
      .from('webauthn_challenges')
      .delete()
      .eq('user_id', userId)
      .eq('type', 'registration');
    
    // Log security event
    await supabaseAdmin.from('security_events').insert({
      user_id: userId,
      event_type: 'enrollment_passkey_registered',
      description: 'Device binding completed via WebAuthn passkey',
      metadata: {
        credentialId: Buffer.from(credentialID).toString('base64').substring(0, 20) + '...',
        deviceType: 'platform',
      },
    });
    
    console.log('[Passkey Registered] User:', userId);
    
    return NextResponse.json({
      success: true,
      message: 'Passkey registered successfully',
    });
    
  } catch (error: any) {
    console.error('[Passkey Registration Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}
