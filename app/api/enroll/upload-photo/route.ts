// app/api/enroll/upload-photo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/enroll/upload-photo
 * Upload verified face anchor photo to storage
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
    
    // Upload to Supabase Storage
    const fileExt = 'jpg';
    const fileName = `${userId}_anchor_${Date.now()}.${fileExt}`;
    const filePath = `reference-photos/${fileName}`;
    
    const arrayBuffer = await photo.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('attendance-photos')
      .upload(filePath, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });
    
    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }
    
    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('attendance-photos')
      .getPublicUrl(filePath);
    
    const photoUrl = urlData.publicUrl;
    
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
    
    console.log('[Face Anchor Saved]', photoUrl);
    
    // Log security event
    await supabaseAdmin.from('security_events').insert({
      user_id: userId,
      event_type: 'enrollment_photo_uploaded',
      description: 'Face anchor photo uploaded successfully',
      metadata: {
        photoUrl,
        fileName,
      },
    });
    
    return NextResponse.json({
      success: true,
      photoUrl,
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
