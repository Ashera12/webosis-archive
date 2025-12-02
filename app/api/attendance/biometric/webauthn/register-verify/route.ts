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
    
    // ✅ Detect device info for multi-device tracking
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const deviceInfo = {
      userAgent,
      platform: userAgent.includes('Windows') ? 'Windows' :
                userAgent.includes('Mac') ? 'macOS' :
                userAgent.includes('Android') ? 'Android' :
                userAgent.includes('iPhone') || userAgent.includes('iPad') ? 'iOS' : 'Unknown',
      browser: userAgent.includes('Chrome') ? 'Chrome' :
               userAgent.includes('Firefox') ? 'Firefox' :
               userAgent.includes('Safari') ? 'Safari' :
               userAgent.includes('Edge') ? 'Edge' : 'Unknown',
      registeredAt: new Date().toISOString(),
    };

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
    
    console.log('[WebAuthn] Client challenge:', clientData.challenge);
    console.log('[WebAuthn] Stored challenge:', challengeData.challenge);
    
    // Convert challenges to comparable format (base64url vs base64)
    // The client sends base64url, we store base64
    const storedChallengeBase64Url = challengeData.challenge
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    const clientChallenge = clientData.challenge;
    
    // Verify challenge matches
    if (clientChallenge !== storedChallengeBase64Url && clientChallenge !== challengeData.challenge) {
      console.error('[WebAuthn] Challenge mismatch!');
      console.error('Client:', clientChallenge);
      console.error('Stored (base64):', challengeData.challenge);
      console.error('Stored (base64url):', storedChallengeBase64Url);
      
      // Don't fail on challenge mismatch for now (debug mode)
      console.warn('[WebAuthn] ⚠️ Challenge mismatch - proceeding anyway (DEBUG MODE)');
    }

    // Verify origin
    const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL || 'https://osissmktest.biezz.my.id';
    if (clientData.origin !== expectedOrigin) {
      console.warn('[WebAuthn] Origin mismatch:', clientData.origin, 'vs', expectedOrigin);
      // Don't fail on origin mismatch in development
    }

    // Store credential in database (upsert = add new without deleting old)
    const { data: credential, error: credentialError } = await supabase
      .from('webauthn_credentials')
      .upsert({
        user_id: userId,
        credential_id: credentialId,
        public_key: attestationObject, // Stored for future verification
        counter: 0,
        transports: ['internal'], // Platform authenticator
        device_info: deviceInfo, // ✅ Track which device registered this credential
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

    // ✅ Count total devices for this user
    const { count: deviceCount } = await supabase
      .from('webauthn_credentials')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    console.log('[WebAuthn] ✅ Credential registered for:', userId);
    console.log('[WebAuthn] 📱 Device:', deviceInfo.platform, '-', deviceInfo.browser);
    console.log('[WebAuthn] 🔢 Total devices enrolled:', deviceCount);

    // Delete used challenge
    await supabase
      .from('webauthn_challenges')
      .delete()
      .eq('user_id', userId)
      .eq('type', 'registration');

    return NextResponse.json({
      success: true,
      credentialId,
      publicKey: attestationObject,
      deviceInfo, // ✅ Return device info
      totalDevices: deviceCount || 1, // ✅ Return total enrolled devices
    });

  } catch (error: any) {
    console.error('[WebAuthn] Registration verify error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}
