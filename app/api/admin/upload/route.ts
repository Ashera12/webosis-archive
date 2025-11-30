import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { generateSignedUrl } from '@/lib/signedUrls';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Auto-create bucket if it doesn't exist
async function ensureBucket(supabase: any, bucketName: string) {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some((b: any) => b.id === bucketName || b.name === bucketName);
    
    if (!exists) {
      console.log(`[/api/admin/upload] Creating bucket: ${bucketName}`);
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: bucketName === 'backgrounds' ? 5242880 : 10485760,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      });
      
      if (createError) {
        console.error(`[/api/admin/upload] Failed to create bucket ${bucketName}:`, createError);
        return false;
      }
      console.log(`[/api/admin/upload] Bucket ${bucketName} created successfully`);
    }
    return true;
  } catch (error) {
    console.error(`[/api/admin/upload] Error checking/creating bucket:`, error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    console.log('[/api/admin/upload] Session check:', { hasSession: !!session, hasUser: !!session?.user, userEmail: session?.user?.email });
    
    if (!session?.user) {
      console.error('[/api/admin/upload] No session or user found');
      return NextResponse.json({ error: 'Unauthorized - No session' }, { status: 401 });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[/api/admin/upload] Missing Supabase credentials');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string || 'gallery';
    const folder = formData.get('folder') as string || '';

    console.log('[/api/admin/upload] Upload params:', { fileName: file?.name, bucket, folder, fileSize: file?.size });

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return NextResponse.json({ 
        error: `Invalid file type: ${file.type}. Allowed: ${allowedTypes.join(', ')}` 
      }, { status: 400 });
    }

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Ensure bucket exists
    const bucketReady = await ensureBucket(supabase, bucket);
    if (!bucketReady) {
      return NextResponse.json({ 
        error: `Bucket '${bucket}' not available. Please create it in Supabase Storage.` 
      }, { status: 500 });
    }

    // Generate file path
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = folder 
      ? `${folder}/${timestamp}_${cleanFileName}`
      : `${timestamp}_${cleanFileName}`;

    // Upload file
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    console.log('[/api/admin/upload] Uploading to:', { bucket, filePath, size: fileBuffer.length });

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('[/api/admin/upload] Upload error:', error);
      return NextResponse.json({ 
        error: error.message || 'Upload failed',
        details: error
      }, { status: 500 });
    }

    console.log('[/api/admin/upload] Upload success:', data);

    // Generate signed URL for the uploaded file
    const signedUrlResult = await generateSignedUrl(data.path, { bucket });
    
    if (!signedUrlResult) {
      console.warn('[/api/admin/upload] Failed to generate signed URL, falling back to public URL');
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return NextResponse.json({
        success: true,
        url: publicUrl,
        publicUrl: publicUrl,
        path: data.path,
        data: {
          path: data.path,
          publicUrl,
          url: publicUrl,
        },
      });
    }

    console.log('[/api/admin/upload] ✅ Signed URL generated:', {
      bucket: signedUrlResult.bucket,
      expiresAt: signedUrlResult.expiresAt
    });

    return NextResponse.json({
      success: true,
      url: signedUrlResult.url,      // Client gets signed URL
      signedUrl: signedUrlResult.url,
      expiresAt: signedUrlResult.expiresAt,
      bucket: signedUrlResult.bucket,
      path: data.path,
      data: {
        path: data.path,
        signedUrl: signedUrlResult.url,
        url: signedUrlResult.url,
        expiresAt: signedUrlResult.expiresAt,
        bucket: signedUrlResult.bucket
      },
    });
  } catch (error: any) {
    console.error('[/api/admin/upload] Unexpected error:', error);
    return NextResponse.json({ 
      error: error.message || 'Upload failed',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    const bucket = searchParams.get('bucket') || 'gallery';

    if (!path) {
      return NextResponse.json({ error: 'Path required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'File deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    const bucket = searchParams.get('bucket') || 'gallery';

    if (!path) {
      return NextResponse.json({ error: 'Path required' }, { status: 400 });
    }

    // Generate signed URL instead of public URL
    const signedUrlResult = await generateSignedUrl(path, { bucket });
    
    if (!signedUrlResult) {
      // Fallback to public URL if signed URL generation fails
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      return NextResponse.json({
        success: true,
        url: publicUrl,
        publicUrl,
      });
    }

    return NextResponse.json({
      success: true,
      url: signedUrlResult.url,
      signedUrl: signedUrlResult.url,
      expiresAt: signedUrlResult.expiresAt,
      bucket: signedUrlResult.bucket
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
