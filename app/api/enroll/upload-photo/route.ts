// app/api/enroll/upload-photo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { uploadFileWithSignedUrl } from '@/lib/signedUrls';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/enroll/upload-photo
 * Upload verified face anchor photo to storage with signed URL
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
    const formData = await request.formData();
    const photo = formData.get('photo') as File;
    
    if (!photo) {
      return NextResponse.json(
        { success: false, error: 'Photo required' },
        { status: 400 }
      );
    }
    
    console.log('[Upload Face Anchor] User:', userId);
    
    // Convert to buffer
    const arrayBuffer = await photo.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Upload with signed URL generation
    const result = await uploadFileWithSignedUrl(buffer, userId, {
      type: 'reference',
      bucket: 'biometric-data',
      contentType: photo.type || 'image/jpeg',
      fileName: `${userId}_anchor_${Date.now()}.jpg`
    });
    
    if (!result) {
      throw new Error('Upload failed');
    }
    
    const photoUrl = result.url; // Store public URL in database
    
    // Check if biometric_data exists
    const { data: existingBiometric } = await supabaseAdmin
      .from('biometric_data')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (existingBiometric) {
      // Update existing
      await supabaseAdmin
        .from('biometric_data')
        .update({
          reference_photo_url: photoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    } else {
      // Insert new
      await supabaseAdmin
        .from('biometric_data')
        .insert({
          user_id: userId,
          reference_photo_url: photoUrl,
          enrollment_status: 'photo_completed',
        });
    }
    
    console.log('[Face Anchor Saved] ✅ Signed URL:', result.signedUrl);
    
    // Log security event
    await supabaseAdmin.from('security_events').insert({
      user_id: userId,
      event_type: 'enrollment_photo_uploaded',
      severity: 'LOW',
      metadata: {
        description: 'Face anchor photo uploaded successfully',
        photoUrl,
        bucket: result.bucket,
        expiresAt: result.expiresAt
      },
    });
    
    return NextResponse.json({
      success: true,
      photoUrl: result.signedUrl,  // Client gets signed URL
      publicUrl: result.url,        // For reference
      expiresAt: result.expiresAt,
      bucket: result.bucket,
      message: 'Face anchor saved successfully',
    });
    
  } catch (error: any) {
    console.error('[Upload Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
