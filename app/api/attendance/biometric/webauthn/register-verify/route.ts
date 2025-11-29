// app/api/attendance/biometric/webauthn/register-verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Verify registration and store credential
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

    const body = await request.json();
    const { userId, credentialId, clientDataJSON, attestationObject } = body;

    // Verify user
    if (userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot verify for other users' },
        { status: 403 }
      );
    }

    // Verify challenge exists and not expired
    const { data: challengeData, error: challengeError } = await supabase
      .from('webauthn_challenges')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'registration')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (challengeError || !challengeData) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired challenge' },
        { status: 400 }
      );
    }

    // Parse client data
    const clientData = JSON.parse(Buffer.from(clientDataJSON, 'base64').toString());
    
    // Verify challenge matches
    if (clientData.challenge !== challengeData.challenge) {
      return NextResponse.json(
        { success: false, error: 'Challenge mismatch' },
        { status: 400 }
      );
    }

    // Verify origin
    const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL || 'https://osissmktest.biezz.my.id';
    if (clientData.origin !== expectedOrigin) {
      console.warn('[WebAuthn] Origin mismatch:', clientData.origin, 'vs', expectedOrigin);
    }

    // Store credential in database
    const { data: credential, error: credentialError } = await supabase
      .from('webauthn_credentials')
      .upsert({
        user_id: userId,
        credential_id: credentialId,
        public_key: attestationObject, // Stored for future verification
        counter: 0,
        transports: ['internal'], // Platform authenticator
        created_at: new Date().toISOString(),
        last_used_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (credentialError) {
      console.error('[WebAuthn] Credential storage error:', credentialError);
      return NextResponse.json(
        { success: false, error: 'Failed to store credential' },
        { status: 500 }
      );
    }

    // Delete used challenge
    await supabase
      .from('webauthn_challenges')
      .delete()
      .eq('user_id', userId)
      .eq('type', 'registration');

    console.log('[WebAuthn] ✅ Credential registered for:', userId);

    return NextResponse.json({
      success: true,
      credentialId,
      publicKey: attestationObject,
    });

  } catch (error: any) {
    console.error('[WebAuthn] Registration verify error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}
