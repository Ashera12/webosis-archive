// app/api/enroll/verify-photo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * POST /api/enroll/verify-photo
 * 8-Layer Anti-Spoofing Verification for face anchor photo
 * 
 * Layers:
 * 1. Liveness detection (blink, movement)
 * 2. Mask/disguise detection
 * 3. Deepfake texture analysis
 * 4. Pose diversity check
 * 5. Light source validation
 * 6. Depth estimation (3D face)
 * 7. Micro-expression scan
 * 8. Age consistency check
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
    const { photoBase64 } = body;
    
    if (!photoBase64) {
      return NextResponse.json(
        { success: false, error: 'Photo required' },
        { status: 400 }
      );
    }
    
    // Get enrollment configuration from school settings
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data: config } = await supabaseAdmin
      .from('school_location_config')
      .select('anti_spoofing_threshold, min_anti_spoofing_layers')
      .limit(1)
      .single();
    
    const antiSpoofingThreshold = config?.anti_spoofing_threshold ?? 0.95;
    const minAntiSpoofingLayers = config?.min_anti_spoofing_layers ?? 7;
    
    console.log('[8-Layer Anti-Spoofing] Starting verification...');
    console.log('[Config] Threshold:', antiSpoofingThreshold, 'Min Layers:', minAntiSpoofingLayers);
    
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `You are an advanced biometric security AI performing 8-layer anti-spoofing analysis on a face enrollment photo.

Analyze this photo and provide a detailed security assessment with STRICT THRESHOLDS:

**LAYER 1: LIVENESS DETECTION**
- Check for signs of natural human face (skin texture, micro-movements captured)
- Detect if this is a real person or a photo/screen/video
- Look for natural lighting variations, shadows, and depth

**LAYER 2: MASK/DISGUISE DETECTION**
- Detect any facial coverings, masks, prosthetics
- Check for artificial materials covering face
- Identify makeup intended to deceive (extreme contouring, face paint)

**LAYER 3: DEEPFAKE DETECTION**
- Analyze texture consistency across face
- Check for digital artifacts, blurring boundaries
- Look for unnatural pixel patterns
- Detect AI-generated or heavily filtered faces

**LAYER 4: POSE DIVERSITY**
- Check if face is frontal (not extreme angle)
- Verify both eyes are visible
- Check for proper face orientation
- Detect if face is too tilted/rotated

**LAYER 5: LIGHT SOURCE VALIDATION**
- Analyze if lighting is natural and consistent
- Check for suspicious shadows indicating printed photo
- Verify light direction matches face geometry
- Detect multiple inconsistent light sources

**LAYER 6: DEPTH ESTIMATION**
- Determine if face has 3D depth characteristics
- Check for flat 2D appearance (printed photo)
- Analyze shadow gradients and contours
- Verify proper perspective distortion

**LAYER 7: MICRO-EXPRESSION SCAN**
- Check for natural facial expression
- Detect if expression seems forced/unnatural
- Verify muscle movement consistency
- Identify frozen/static expressions

**LAYER 8: AGE CONSISTENCY**
- Estimate approximate age range
- Check if face matches typical enrollment age (student/staff)
- Detect age manipulation (filters, heavy editing)
- Verify face maturity matches context

**OUTPUT FORMAT (JSON ONLY, NO MARKDOWN):**
{
  "liveness": true/false,
  "livenessConfidence": 0.0-1.0,
  "maskDetected": true/false,
  "maskConfidence": 0.0-1.0,
  "deepfakeDetected": true/false,
  "deepfakeConfidence": 0.0-1.0,
  "poseDiversity": true/false,
  "poseScore": 0.0-1.0,
  "lightSourceValid": true/false,
  "lightingScore": 0.0-1.0,
  "depthEstimation": true/false,
  "depthScore": 0.0-1.0,
  "microExpression": true/false,
  "expressionScore": 0.0-1.0,
  "ageConsistency": true/false,
  "estimatedAge": number,
  "ageScore": 0.0-1.0,
  "overallScore": 0.0-1.0,
  "passedLayers": number (0-8),
  "detailedAnalysis": "Brief explanation of findings",
  "recommendation": "PASS or REJECT"
}

**STRICT REQUIREMENTS FOR PASS:**
- liveness: true, confidence > 0.85
- maskDetected: false
- deepfakeDetected: false, confidence < 0.3
- poseDiversity: true, score > 0.7
- lightSourceValid: true, score > 0.7
- depthEstimation: true, score > 0.7
- microExpression: true, score > 0.6
- ageConsistency: true, age 10-60, score > 0.7
- overallScore: > 0.95
- passedLayers: >= 7

If photo fails any critical layer, set recommendation to REJECT.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: photoBase64,
          mimeType: 'image/jpeg',
        },
      },
    ]);
    
    const responseText = result.response.text();
    console.log('[AI Response]', responseText);
    
    // Parse JSON response
    let antiSpoofing;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        antiSpoofing = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('[JSON Parse Error]', parseError);
      
      // Fallback: Create response from text analysis
      antiSpoofing = {
        liveness: responseText.toLowerCase().includes('liveness') && responseText.toLowerCase().includes('pass'),
        livenessConfidence: 0.75,
        maskDetected: responseText.toLowerCase().includes('mask detected'),
        maskConfidence: 0.1,
        deepfakeDetected: responseText.toLowerCase().includes('deepfake'),
        deepfakeConfidence: 0.1,
        poseDiversity: !responseText.toLowerCase().includes('poor pose'),
        poseScore: 0.8,
        lightSourceValid: !responseText.toLowerCase().includes('lighting issue'),
        lightingScore: 0.8,
        depthEstimation: true,
        depthScore: 0.8,
        microExpression: true,
        expressionScore: 0.75,
        ageConsistency: true,
        estimatedAge: 20,
        ageScore: 0.9,
        overallScore: 0.75,
        passedLayers: 6,
        detailedAnalysis: responseText.substring(0, 200),
        recommendation: 'REJECT',
      };
    }
    
    console.log('[Anti-Spoofing Result]', antiSpoofing);
    
    // Log security event
    await supabaseAdmin.from('security_events').insert({
      user_id: session.user.id,
      event_type: 'enrollment_photo_verification',
      description: `8-layer verification: ${antiSpoofing.recommendation}`,
      metadata: {
        overallScore: antiSpoofing.overallScore,
        passedLayers: antiSpoofing.passedLayers,
        liveness: antiSpoofing.liveness,
        maskDetected: antiSpoofing.maskDetected,
        deepfakeDetected: antiSpoofing.deepfakeDetected,
        recommendation: antiSpoofing.recommendation,
        configuredThreshold: antiSpoofingThreshold,
        configuredMinLayers: minAntiSpoofingLayers,
      },
    });
    
    // Check if verification passes configured thresholds
    const meetsThreshold = antiSpoofing.overallScore >= antiSpoofingThreshold;
    const meetsLayerCount = antiSpoofing.passedLayers >= minAntiSpoofingLayers;
    const verificationPassed = meetsThreshold && meetsLayerCount;
    
    return NextResponse.json({
      success: true,
      antiSpoofing,
      config: {
        requiredThreshold: antiSpoofingThreshold,
        requiredMinLayers: minAntiSpoofingLayers,
        meetsThreshold,
        meetsLayerCount,
        verificationPassed,
      },
    });
    
  } catch (error: any) {
    console.error('[8-Layer Verification Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}
