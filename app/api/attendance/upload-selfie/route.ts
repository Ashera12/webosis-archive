import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { uploadFileWithSignedUrl } from '@/lib/signedUrls';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing file or userId' },
        { status: 400 }
      );
    }

    // Verify user is uploading their own photo
    if (session.user.id !== userId) {
      return NextResponse.json(
        { success: false, error: 'Cannot upload for other users' },
        { status: 403 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload with automatic signed URL generation
    const result = await uploadFileWithSignedUrl(buffer, userId, {
      type: 'selfie',
      bucket: 'user-photos',
      contentType: file.type || 'image/jpeg',
      fileName: `selfie_${Date.now()}.jpg`
    });

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Upload failed' },
        { status: 500 }
      );
    }

    console.log('[Upload Selfie] ✅ Uploaded with signed URL:', {
      path: result.path,
      expiresAt: result.expiresAt
    });

    return NextResponse.json({
      success: true,
      url: result.signedUrl,        // Client gets time-limited signed URL
      publicUrl: result.url,          // For storage reference (optional)
      path: result.path,
      expiresAt: result.expiresAt,
      bucket: result.bucket
    });
  } catch (error: any) {
    console.error('Upload selfie error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
