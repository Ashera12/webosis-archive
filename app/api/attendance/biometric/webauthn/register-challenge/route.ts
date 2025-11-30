// app/api/attendance/biometric/webauthn/register-challenge/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Generate registration challenge for WebAuthn
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
    const { userId, userName, userDisplayName } = body;

    // Verify user is registering for themselves
    if (userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot register for other users' },
        { status: 403 }
      );
    }

    // Generate random challenge (32 bytes)
    const challenge = crypto.randomBytes(32).toString('base64');

    // Store challenge in database (temporary, expires in 5 minutes)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    
    await supabase
      .from('webauthn_challenges')
      .upsert({
        user_id: userId,
        challenge,
        type: 'registration',
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
      });

    // WebAuthn registration options
    // RP ID must be the domain WITHOUT protocol and WITHOUT port
    const rpId = 'biezz.my.id'; // Parent domain works for all subdomains
    
    const options = {
      challenge,
      rp: {
        name: process.env.NEXT_PUBLIC_APP_NAME || 'OSIS SMK Fithrah Insani',
        id: rpId, // Must match domain exactly (no https://, no port)
      },
      user: {
        id: Buffer.from(userId).toString('base64'),
        name: userName || session.user.email || 'user',
        displayName: userDisplayName || session.user.name || 'User',
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },  // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Built-in biometric
        requireResidentKey: false,
        residentKey: 'preferred',
        userVerification: 'required', // MUST use biometric/PIN
      },
      timeout: 60000, // 60 seconds
      attestation: 'none', // Privacy-preserving
    };

    console.log('[WebAuthn] 📝 Registration challenge generated for:', userId);

    return NextResponse.json({
      success: true,
      options,
    });

  } catch (error: any) {
    console.error('[WebAuthn] Registration challenge error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate challenge' },
      { status: 500 }
    );
  }
}
