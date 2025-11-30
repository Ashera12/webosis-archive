import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * POST /api/attendance/log-activity
 * Log user activity for monitoring
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      userEmail, 
      activityType, 
      description,
      status,
      details 
    } = body;

    // Validate required fields
    if (!userId || !activityType) {
      return NextResponse.json(
        { error: 'userId and activityType are required' },
        { status: 400 }
      );
    }

    // Get client info
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'Unknown';

    // Insert activity log
    const { data, error } = await supabaseAdmin
      .from('user_activities')
      .insert({
        user_id: userId,
        user_email: userEmail,
        activity_type: activityType,
        description: description || activityType,
        status: status || 'info',
        details: details || {},
        ip_address: ip,
        user_agent: userAgent,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('[Log Activity API] Error:', error);
      return NextResponse.json(
        { error: 'Failed to log activity', details: error.message },
        { status: 500 }
      );
    }

    console.log('[Log Activity API] ✅ Logged:', activityType, 'for', userEmail);

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error: any) {
    console.error('[Log Activity API] ❌ Error:', error);
    return NextResponse.json(
      { error: 'Failed to log activity', message: error.message },
      { status: 500 }
    );
  }
}
