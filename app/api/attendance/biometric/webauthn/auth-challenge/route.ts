// app/api/attendance/biometric/webauthn/auth-challenge/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Generate authentication challenge for WebAuthn
 * GET endpoint for easier frontend integration
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

    const userId = session.user.id; // From session, not body

    // Get user's registered credentials
    const { data: credentials, error: credError } = await supabase
      .from('webauthn_credentials')
      .select('credential_id, transports')
      .eq('user_id', userId);

    if (credError || !credentials || credentials.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No credentials found. Please register first.' },
        { status: 404 }
      );
    }

    // Generate random challenge
    const challenge = crypto.randomBytes(32).toString('base64');

    // Store challenge
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    
    await supabase
      .from('webauthn_challenges')
      .upsert({
        user_id: userId,
        challenge,
        type: 'authentication',
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
      });

    // WebAuthn authentication options
    const options = {
      challenge,
      allowCredentials: credentials.map(cred => ({
        id: cred.credential_id,
        type: 'public-key' as const,
        transports: cred.transports || ['internal'],
      })),
      timeout: 60000, // 60 seconds
      rpId: process.env.NEXT_PUBLIC_RP_ID || 'osissmktest.biezz.my.id',
      userVerification: 'required' as const, // MUST use biometric/PIN
    };

    console.log('[WebAuthn] 🔍 Authentication challenge generated for:', userId);

    return NextResponse.json({
      success: true,
      options,
    });

  } catch (error: any) {
    console.error('[WebAuthn] Auth challenge error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate challenge' },
      { status: 500 }
    );
  }
}
