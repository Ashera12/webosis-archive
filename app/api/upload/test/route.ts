import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// Simple test endpoint to verify upload route is working
export async function GET(request: NextRequest) {
  try {
    console.log('[/api/upload/test] Test endpoint called');
    
    const session = await auth();
    console.log('[/api/upload/test] Session:', { 
      hasSession: !!session, 
      hasUser: !!session?.user,
      email: session?.user?.email 
    });
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('[/api/upload/test] Environment:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseServiceKey,
      urlPrefix: supabaseUrl?.substring(0, 30)
    });
    
    return NextResponse.json({
      success: true,
      session: {
        authenticated: !!session?.user,
        email: session?.user?.email
      },
      environment: {
        hasSupabaseUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey,
        urlPrefix: supabaseUrl?.substring(0, 30)
      }
    });
  } catch (error: any) {
    console.error('[/api/upload/test] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[/api/upload/test] POST test called');
    
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    console.log('[/api/upload/test] FormData received:', {
      hasFile: !!file,
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size
    });
    
    if (!file) {
      return NextResponse.json({ error: 'No file in FormData' }, { status: 400 });
    }
    
    // Try to read file
    const buffer = await file.arrayBuffer();
    console.log('[/api/upload/test] File read successfully, size:', buffer.byteLength);
    
    return NextResponse.json({
      success: true,
      file: {
        name: file.name,
        type: file.type,
        size: file.size,
        bufferSize: buffer.byteLength
      }
    });
  } catch (error: any) {
    console.error('[/api/upload/test] POST Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      errorType: error.constructor?.name,
      stack: error.stack
    }, { status: 500 });
  }
}
