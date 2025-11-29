// app/api/activity/timeline/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET USER ACTIVITY TIMELINE
 * Fetch all activity logs for current user or specific user (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    // Get user ID with proper type handling
    const sessionUserId = (session.user as any)?.id || session.user.email;
    
    if (!sessionUserId) {
      console.error('[Activity Timeline] No user ID in session:', session.user);
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid session - no user ID' 
      }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    
    // Query parameters
    const userId = searchParams.get('userId') || sessionUserId;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const activityType = searchParams.get('type'); // Filter by type
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');

    // Permission check
    const currentUserRole = ((session.user as any)?.role || '').toLowerCase();
    const isAdmin = ['admin', 'super_admin', 'osis'].includes(currentUserRole);
    
    // Jika bukan admin dan minta data user lain
    if (userId !== sessionUserId && !isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Forbidden: Cannot view other user activity'
      }, { status: 403 });
    }

    console.log('[Activity Timeline] Fetching for user:', userId, 'Requested by:', sessionUserId, 'Role:', currentUserRole);
    console.log('[Activity Timeline] Filters:', {
      type: activityType,
      startDate,
      endDate,
      status,
      limit,
      offset
    });

    // Build query
    let query = supabaseAdmin
      .from('activity_logs')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .is('deleted_at', null) // Exclude soft deleted
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (activityType) {
      query = query.eq('activity_type', activityType);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: activities, error, count } = await query;

    if (error) {
      console.error('[Activity Timeline] Query error:', error);
      throw error;
    }

    console.log('[Activity Timeline] Found:', count, 'activities');

    // Get user info jika admin request
    let userInfo = null;
    if (isAdmin && userId !== sessionUserId) {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('id, email, name, role')
        .eq('id', userId)
        .single();
      
      if (user) {
        userInfo = {
          id: user.id,
          email: user.email,
          name: user.name || user.email,
          role: user.role
        };
      }
    }

    // Get activity statistics
    const { data: stats } = await supabaseAdmin
      .from('activity_logs')
      .select('activity_type')
      .eq('user_id', userId)
      .is('deleted_at', null);

    const activityStats = stats?.reduce((acc: any, log: any) => {
      acc[log.activity_type] = (acc[log.activity_type] || 0) + 1;
      return acc;
    }, {}) || {};

    return NextResponse.json({
      success: true,
      data: {
        activities,
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: (count || 0) > offset + limit
        },
        stats: activityStats,
        userInfo
      }
    });

  } catch (error: any) {
    console.error('[Activity Timeline] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch activity timeline'
    }, { status: 500 });
  }
}

/**
 * POST - LOG NEW ACTIVITY
 * Called by other endpoints to log user activities
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    // Get user ID with proper type handling
    const userId = (session.user as any)?.id || session.user.email;
    
    if (!userId) {
      console.error('[Activity Log] No user ID in session');
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid session - no user ID' 
      }, { status: 400 });
    }

    const body = await request.json();

    const {
      activityType,
      action,
      description,
      metadata = {},
      relatedId,
      relatedType,
      status = 'success',
      errorMessage
    } = body;

    // Validation
    if (!activityType || !action) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: activityType and action'
      }, { status: 400 });
    }

    console.log('[Activity Log] Creating:', {
      user: session.user.email,
      type: activityType,
      action
    });

    // Get request context
    const userAgent = request.headers.get('user-agent') || '';
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    // Insert activity log
    const { data: activity, error } = await supabaseAdmin
      .from('activity_logs')
      .insert({
        user_id: userId,
        user_name: session.user.name || session.user.email,
        user_email: session.user.email,
        user_role: (session.user as any)?.role,
        activity_type: activityType,
        action,
        description,
        metadata,
        ip_address: ipAddress,
        user_agent: userAgent,
        related_id: relatedId,
        related_type: relatedType,
        status,
        error_message: errorMessage,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('[Activity Log] Insert error:', error);
      throw error;
    }

    console.log('[Activity Log] Created:', activity.id);

    return NextResponse.json({
      success: true,
      data: activity
    });

  } catch (error: any) {
    console.error('[Activity Log] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to log activity'
    }, { status: 500 });
  }
}
