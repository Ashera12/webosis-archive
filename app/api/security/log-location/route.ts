import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * POST /api/security/log-location
 * Log location access for security analysis
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
    const { latitude, longitude, accuracy, page, timestamp } = body;
    
    // Get client IP
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    console.log('[Security Log] Location event:', {
      user: session.user.email,
      event_type: 'location_log',
      location: latitude ? `${latitude}, ${longitude}` : 'N/A'
    });
    
    // Log to security_events table
    await supabaseAdmin.from('security_events').insert({
      user_id: session?.user?.id || null,
      event_type: 'location_log',
      severity: 'INFO',
      metadata: {
        latitude: body.latitude,
        longitude: body.longitude,
        accuracy: body.accuracy,
        page: body.page,
        timestamp: body.timestamp || new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    });
    
    return NextResponse.json({
      success: true,
      message: 'Location logged successfully'
    });
    
  } catch (error: any) {
    console.error('[Security Log] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}
