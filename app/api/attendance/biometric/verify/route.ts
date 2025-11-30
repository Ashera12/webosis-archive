import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * COMPLETE BIOMETRIC VERIFICATION
 * Mengambil SEMUA data dari database dan verifikasi lengkap:
 * - Fingerprint (device fingerprint)
 * - Photo (AI face verification)
 * - WebAuthn credential (if available)
 * - Password (optional backup)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      fingerprint,      // Browser fingerprint
      photoUrl,         // Selfie URL for AI verification
      userId,
      webauthnCredentialId, // Optional: from WebAuthn authentication
    } = body;

    if (!fingerprint || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required verification data' },
        { status: 400 }
      );
    }

    // SECURITY: Verify user is checking their own biometric
    if (session.user.id !== userId) {
      return NextResponse.json(
        { success: false, error: 'Cannot verify for other users' },
        { status: 403 }
      );
    }

    console.log('[Biometric Verify] 🔍 Fetching complete user data from database...');
    console.log('[Biometric Verify] User ID:', userId);

    // ============================================
    // STEP 1: GET ALL BIOMETRIC DATA FROM DATABASE
    // ============================================
    const { data: biometric, error: biometricError } = await supabase
      .from('user_biometric')
      .select(`
        *,
        user_id,
        reference_photo_url,
        fingerprint_template,
        webauthn_credential_id,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)
      .single();

    if (biometricError || !biometric) {
      console.error('[Biometric Verify] ❌ No biometric data found:', biometricError);
      return NextResponse.json(
        { success: false, error: 'Biometric data not found. Please setup first.' },
        { status: 404 }
      );
    }

    console.log('[Biometric Verify] ✅ Biometric data loaded from database');
    console.log('[Biometric Verify] Has photo:', !!biometric.reference_photo_url);
    console.log('[Biometric Verify] Has fingerprint:', !!biometric.fingerprint_template);
    console.log('[Biometric Verify] Has WebAuthn:', !!biometric.webauthn_credential_id);

    // ============================================
    // STEP 2: VERIFY FINGERPRINT (Browser fingerprint)
    // ============================================
    const fingerprintMatch = fingerprint === biometric.fingerprint_template;
    console.log('[Biometric Verify] 🔐 Fingerprint match:', fingerprintMatch);

    if (!fingerprintMatch) {
      console.warn('[Biometric Verify] ⚠️ Fingerprint mismatch - different device?');
    }

    // ============================================
    // STEP 3: VERIFY PHOTO with AI (if provided)
    // ============================================
    let aiVerification = null;
    
    if (photoUrl && biometric.reference_photo_url) {
      console.log('[Biometric Verify] 📸 Verifying photo with AI...');
      console.log('[Biometric Verify] Reference photo (DB):', biometric.reference_photo_url.substring(0, 80) + '...');
      console.log('[Biometric Verify] Current photo:', photoUrl.substring(0, 80) + '...');

      try {
        // Call AI verification API
        const aiResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://osissmktest.biezz.my.id'}/api/ai/verify-face`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            currentPhotoUrl: photoUrl,
            // referencePhotoUrl automatically fetched from database in verify-face API
          }),
        });

        const aiData = await aiResponse.json();
        aiVerification = aiData;

        console.log('[Biometric Verify] 🤖 AI verification result:', {
          verified: aiData.verified,
          matchScore: aiData.matchScore,
          confidence: aiData.confidence,
          isLive: aiData.isLive,
          provider: aiData.provider,
        });
      } catch (aiError: any) {
        console.error('[Biometric Verify] ❌ AI verification failed:', aiError.message);
        aiVerification = {
          verified: false,
          error: aiError.message,
        };
      }
    } else {
      console.log('[Biometric Verify] ⏭️ Skipping AI verification (no photo provided)');
    }

    // ============================================
    // STEP 4: VERIFY WEBAUTHN CREDENTIAL (if available)
    // ============================================
    let webauthnMatch = false;
    
    if (webauthnCredentialId && biometric.webauthn_credential_id) {
      webauthnMatch = webauthnCredentialId === biometric.webauthn_credential_id;
      console.log('[Biometric Verify] 🔑 WebAuthn match:', webauthnMatch);
    } else if (biometric.webauthn_credential_id) {
      console.log('[Biometric Verify] ⏭️ WebAuthn credential exists in DB but not provided in request');
    } else {
      console.log('[Biometric Verify] ⏭️ No WebAuthn credential (AI-only mode)');
    }

    // ============================================
    // STEP 5: COMPREHENSIVE VERIFICATION RESULT
    // ============================================
    const verificationChecks = {
      fingerprint: {
        checked: true,
        passed: fingerprintMatch,
        stored: biometric.fingerprint_template,
        provided: fingerprint,
      },
      ai_face: {
        checked: !!photoUrl,
        passed: aiVerification?.verified || false,
        matchScore: aiVerification?.matchScore || 0,
        confidence: aiVerification?.confidence || 0,
        isLive: aiVerification?.isLive || false,
        provider: aiVerification?.provider || 'none',
        referencePhoto: biometric.reference_photo_url,
      },
      webauthn: {
        checked: !!webauthnCredentialId,
        passed: webauthnMatch,
        stored: biometric.webauthn_credential_id,
        provided: webauthnCredentialId,
      },
    };

    // Overall verification logic:
    // - Fingerprint MUST match (device verification)
    // - AI face MUST pass if photo provided (identity verification)
    // - WebAuthn is bonus security if available
    const overallVerified = 
      fingerprintMatch && 
      (!photoUrl || (aiVerification?.verified && aiVerification?.matchScore >= 0.75));

    console.log('[Biometric Verify] 📊 Verification summary:', {
      overallVerified,
      fingerprint: fingerprintMatch,
      aiVerified: aiVerification?.verified,
      aiScore: aiVerification?.matchScore,
      webauthn: webauthnMatch,
    });

    return NextResponse.json({
      success: true,
      verified: overallVerified,
      checks: verificationChecks,
      biometricData: {
        hasPhoto: !!biometric.reference_photo_url,
        hasFingerprint: !!biometric.fingerprint_template,
        hasWebAuthn: !!biometric.webauthn_credential_id,
        setupDate: biometric.created_at,
        lastUpdate: biometric.updated_at,
      },
      message: overallVerified
        ? '✅ Biometric verified successfully - All checks passed!'
        : '❌ Biometric verification failed - Please check your device and try again.',
    });

  } catch (error: any) {
    console.error('[Biometric Verify] ❌ Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
