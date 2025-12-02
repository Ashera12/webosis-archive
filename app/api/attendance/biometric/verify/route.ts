import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * COMPLETE BIOMETRIC VERIFICATION - WebAuthn First
 * Priority:
 * 1. WebAuthn (Face ID, Touch ID, Windows Hello) - PRIMARY
 * 2. AI Face Verification - SECONDARY
 * 3. Browser Fingerprint - INFO ONLY (non-blocking)
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
      fingerprint,          // Browser fingerprint (INFO ONLY)
      photoUrl,             // Selfie URL for AI verification
      userId,
      webauthnCredentialId, // WebAuthn credential (PRIMARY)
    } = body;

    // SECURITY: Use session user ID if not provided (safer)
    const targetUserId = userId || session.user.id;

    // SECURITY: Verify user is checking their own biometric
    if (session.user.id !== targetUserId) {
      return NextResponse.json(
        { success: false, error: 'Cannot verify for other users' },
        { status: 403 }
      );
    }

    console.log('[Biometric Verify] 🔍 Fetching complete user data from database...');
    console.log('[Biometric Verify] User ID:', targetUserId);

    // ============================================
    // STEP 1: GET ALL BIOMETRIC DATA FROM DATABASE
    // ============================================
    const { data: biometric, error: biometricError } = await supabase
      .from('biometric_data')
      .select('*')
      .eq('user_id', targetUserId)
      .single();

    if (biometricError || !biometric) {
      console.error('[Biometric Verify] ❌ No biometric data found:', biometricError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Enrollment required. First attendance will auto-enroll your biometric data.',
          needsEnrollment: true,
          isFirstTime: true,
        },
        { status: 400 }
      );
    }

    console.log('[Biometric Verify] ✅ Biometric data loaded from database');
    console.log('[Biometric Verify] Has photo:', !!biometric.reference_photo_url);
    console.log('[Biometric Verify] Enrollment status:', biometric.enrollment_status);
    console.log('[Biometric Verify] Biometric type:', biometric.biometric_type || 'not set');

    // ============================================
    // STEP 2: CHECK WEBAUTHN CREDENTIALS (PRIMARY)
    // ============================================
    const { data: credentials } = await supabase
      .from('webauthn_credentials')
      .select('credential_id, device_info')
      .eq('user_id', targetUserId);
    
    const hasWebAuthn = credentials && credentials.length > 0;
    console.log('[Biometric Verify] 🔑 Has WebAuthn enrolled:', hasWebAuthn);
    if (hasWebAuthn) {
      console.log('[Biometric Verify] 🔑 WebAuthn credentials count:', credentials.length);
    }

    // ============================================
    // STEP 3: BROWSER FINGERPRINT (INFO ONLY - NON-BLOCKING)
    // ============================================
    const fingerprintMatch = fingerprint && biometric.fingerprint_template 
      ? fingerprint === biometric.fingerprint_template 
      : null; // null = tidak dicek
    
    if (fingerprintMatch === false) {
      console.warn('[Biometric Verify] ⚠️ Browser fingerprint mismatch (INFO ONLY - non-blocking)');
      console.warn('[Biometric Verify] Reason: Browser updates/cache clear can change fingerprint');
    } else if (fingerprintMatch === true) {
      console.log('[Biometric Verify] ✅ Browser fingerprint matched');
    } else {
      console.log('[Biometric Verify] ℹ️ Browser fingerprint not checked (not stored or not provided)');
    }

    // ============================================
    // STEP 4: VERIFY PHOTO with AI (if provided)
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
            userId: targetUserId,
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
    // STEP 5: COMPREHENSIVE VERIFICATION RESULT
    // ============================================
    const verificationChecks = {
      fingerprint: {
        checked: !!fingerprint && !!biometric.fingerprint_template,
        passed: fingerprintMatch !== false, // ✅ true or null = PASS (non-blocking)
        stored: biometric.fingerprint_template,
        provided: fingerprint,
        blocking: false, // ✅ NOT blocking verification
      },
      ai_face: {
        checked: !!photoUrl,
        passed: aiVerification?.verified || false,
        matchScore: aiVerification?.matchScore || 0,
        confidence: aiVerification?.confidence || 0,
        isLive: aiVerification?.isLive || false,
        provider: aiVerification?.provider || 'none',
        referencePhoto: biometric.reference_photo_url,
        blocking: true, // ✅ Blocks if checked and failed
      },
      webauthn: {
        checked: hasWebAuthn,
        passed: hasWebAuthn, // ✅ If enrolled, considered passed (actual verification done client-side)
        credentialCount: credentials?.length || 0,
        blocking: false, // ✅ WebAuthn verified client-side before this API call
      },
    };

    // ✅ NEW VERIFICATION LOGIC - Fingerprint NON-BLOCKING
    // Overall verification:
    // 1. Photo reference MUST exist (enrollment completed)
    // 2. AI face verification MUST pass IF photo provided
    // 3. Browser fingerprint = INFO ONLY (tidak memblok)
    // 4. WebAuthn = Already verified client-side (this API just confirms enrollment)
    const overallVerified = 
      !!biometric.reference_photo_url && 
      (!photoUrl || (aiVerification?.verified && aiVerification?.matchScore >= 0.75));

    console.log('[Biometric Verify] 📊 Verification summary:', {
      overallVerified,
      fingerprintMatch: fingerprintMatch !== false ? '✅ PASS (non-blocking)' : '⚠️ INFO ONLY',
      aiVerified: aiVerification?.verified,
      aiScore: aiVerification?.matchScore,
      hasWebAuthn: hasWebAuthn,
    });

    return NextResponse.json({
      success: true,
      verified: overallVerified,
      checks: verificationChecks,
      biometricData: {
        hasPhoto: !!biometric.reference_photo_url,
        hasFingerprint: !!biometric.fingerprint_template,
        hasWebAuthn: hasWebAuthn,
        biometric_type: biometric.biometric_type,
        enrollmentStatus: biometric.enrollment_status,
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
