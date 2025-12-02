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

    // Get user's registered credentials (if any)
    const { data: credentials, error: credError } = await supabase
      .from('webauthn_credentials')
      .select('credential_id, transports')
      .eq('user_id', userId);

    // ✅ IMPORTANT: Even if no credentials in DB, still generate challenge
    // Reason: User might have credentials on device but not synced to DB
    // OR: Using discoverable credentials (passkey) which doesn't need allowCredentials
    const hasCredentials = credentials && credentials.length > 0;
    
    if (!hasCredentials) {
      console.warn('[WebAuthn] ⚠️ No credentials found in DB for:', userId);
      console.warn('[WebAuthn] Will try discoverable credentials (passkey mode)');
    } else {
      console.log('[WebAuthn] ✅ Found', credentials.length, 'credential(s) for:', userId);
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
    // ✅ RP ID MUST MATCH registration - Use dynamic detection
    const hostname = request.headers.get('host') || 'osissmktest.biezz.my.id';
    const rpId = hostname.includes('localhost') ? 'localhost' : 'biezz.my.id';
    
    const options = {
      challenge,
      // ✅ IMPORTANT: If no credentials, use empty array for discoverable credentials (passkey mode)
      // Browser will show ALL available passkeys for this RP ID
      allowCredentials: hasCredentials ? credentials!.map(cred => ({
        id: cred.credential_id,
        type: 'public-key' as const,
        transports: cred.transports || ['internal'], // ✅ 'internal' for platform authenticators
      })) : [], // ✅ Empty = discoverable credentials
      timeout: 60000, // 60 seconds
      rpId, // ✅ Dynamically matched with registration
      userVerification: 'required' as const, // ✅ CRITICAL - FORCES biometric prompt
    };

    console.log('[WebAuthn] 🔍 Authentication challenge generated for:', userId);
    console.log('[WebAuthn] Mode:', hasCredentials ? 'Specific credentials' : 'Discoverable credentials (passkey)');
    console.log('[WebAuthn] Credentials count:', hasCredentials ? credentials!.length : 0);

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
