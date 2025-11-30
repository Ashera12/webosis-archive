/**
 * AI Face Verification Library
 * Ultra-accurate face matching using Google Gemini Vision AI
 * 
 * Features:
 * - 🎯 Liveness Detection (detect real person vs photo/video)
 * - 👤 Face Matching (compare reference photo vs live selfie)
 * - 🔍 Multi-point Verification (facial features, landmarks, expressions)
 * - 🛡️ Anti-Spoofing (detect masks, deepfakes, printed photos)
 * - ⚡ Real-time Analysis (< 2 seconds response)
 */

export interface FaceVerificationResult {
  verified: boolean;
  confidence: number; // 0-100
  isLivePerson: boolean;
  matchScore: number; // 0-100
  analysis: {
    faceDetected: boolean;
    faceLandmarks: string[];
    skinTone: string;
    lighting: string;
    expression: string;
    headPose: string;
    eyesOpen: boolean;
    mouthClosed: boolean;
  };
  warnings: string[];
  timestamp: string;
}

/**
 * Verify face using Gemini Vision AI
 * Compare reference photo (from registration) vs live selfie (from attendance)
 */
export async function verifyFaceWithAI(
  referencePhotoUrl: string,
  liveSelfieBlob: Blob,
  userId: string
): Promise<FaceVerificationResult> {
  try {
    console.log('[AI Verify] 🤖 Starting AI face verification...');
    console.log('[AI Verify] Reference photo:', referencePhotoUrl);
    console.log('[AI Verify] Live selfie size:', (liveSelfieBlob.size / 1024).toFixed(2), 'KB');

    // Convert blob to base64
    const base64Image = await blobToBase64(liveSelfieBlob);

    // Call AI verification API
    const response = await fetch('/api/ai/verify-face', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referencePhotoUrl,
        liveSelfieBase64: base64Image,
        userId,
      }),
    });

    if (!response.ok) {
      throw new Error('AI verification API error: ' + response.statusText);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'AI verification failed');
    }

    console.log('[AI Verify] ✅ Verification complete:', result.data);

    return result.data as FaceVerificationResult;

  } catch (error: any) {
    console.error('[AI Verify] ❌ Error:', error);
    
    // Return failed verification
    return {
      verified: false,
      confidence: 0,
      isLivePerson: false,
      matchScore: 0,
      analysis: {
        faceDetected: false,
        faceLandmarks: [],
        skinTone: 'Unknown',
        lighting: 'Unknown',
        expression: 'Unknown',
        headPose: 'Unknown',
        eyesOpen: false,
        mouthClosed: false,
      },
      warnings: [error.message || 'AI verification failed'],
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Analyze single photo for liveness and quality
 */
export async function analyzeLiveness(photoBlob: Blob): Promise<{
  isLive: boolean;
  confidence: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  issues: string[];
}> {
  try {
    const base64Image = await blobToBase64(photoBlob);

    const response = await fetch('/api/ai/vision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: base64Image,
        prompt: `Analyze this selfie photo for liveness detection and quality:

1. Is this a REAL LIVE PERSON (not a photo of a photo, screen, or video)?
2. Face quality (lighting, focus, angle, expression)
3. Detect any spoofing attempts (masks, prints, screens, deepfakes)
4. Rate confidence 0-100

Respond in JSON format:
{
  "isLive": boolean,
  "confidence": number,
  "quality": "excellent|good|fair|poor",
  "issues": ["issue1", "issue2"]
}`,
      }),
    });

    if (!response.ok) {
      throw new Error('Liveness analysis failed');
    }

    const result = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error('Invalid liveness response');
    }

    // Parse AI response
    const analysis = typeof result.data === 'string' 
      ? JSON.parse(result.data) 
      : result.data;

    return {
      isLive: analysis.isLive ?? false,
      confidence: analysis.confidence ?? 0,
      quality: analysis.quality ?? 'poor',
      issues: analysis.issues ?? [],
    };

  } catch (error: any) {
    console.error('[AI Liveness] Error:', error);
    return {
      isLive: false,
      confidence: 0,
      quality: 'poor',
      issues: [error.message],
    };
  }
}

/**
 * Convert Blob to Base64
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Remove data:image/jpeg;base64, prefix
      const base64Data = base64.split(',')[1] || base64;
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Get verification status emoji
 */
export function getVerificationEmoji(result: FaceVerificationResult): string {
  if (result.verified && result.confidence >= 90) return '✅';
  if (result.verified && result.confidence >= 70) return '⚠️';
  return '❌';
}

/**
 * Get verification status text
 */
export function getVerificationStatus(result: FaceVerificationResult): string {
  if (result.verified && result.confidence >= 90) {
    return 'Terverifikasi - Akurasi Tinggi';
  } else if (result.verified && result.confidence >= 70) {
    return 'Terverifikasi - Akurasi Sedang';
  } else if (result.confidence >= 50) {
    return 'Tidak Terverifikasi - Kemiripan Rendah';
  } else {
    return 'Gagal - Wajah Tidak Cocok';
  }
}

/**
 * Get color for confidence level
 */
export function getConfidenceColor(confidence: number): string {
  if (confidence >= 90) return 'text-green-600';
  if (confidence >= 70) return 'text-yellow-600';
  if (confidence >= 50) return 'text-orange-600';
  return 'text-red-600';
}
