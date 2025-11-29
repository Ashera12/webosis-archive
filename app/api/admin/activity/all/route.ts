// app/api/admin/activity/all/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET ALL USER ACTIVITIES - ADMIN ONLY
 * Includes anonymous users, IP tracking, full metadata
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

    // Check admin permission
    const userRole = (session.user.role || '').toLowerCase();
    if (!['admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json({
        success: false,
        error: 'Forbidden: Admin access required'
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    
    // Query parameters
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const activityType = searchParams.get('type');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const ipAddress = searchParams.get('ipAddress');
    const searchTerm = searchParams.get('search');

    console.log('[Admin Activity] Fetching all activities with filters:', {
      userId,
      activityType,
      status,
      startDate,
      endDate,
      ipAddress,
      searchTerm
    });

    // Build query
    let query = supabaseAdmin
      .from('activity_logs')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (userId) {
      query = query.eq('user_id', userId);
    }

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

    if (ipAddress) {
      query = query.eq('ip_address', ipAddress);
    }

    if (searchTerm) {
      query = query.or(`user_email.ilike.%${searchTerm}%,user_name.ilike.%${searchTerm}%`);
    }

    const { data: activities, error, count } = await query;

    if (error) {
      console.error('[Admin Activity] Query error:', error);
      throw error;
    }

    // Calculate stats
    const { data: allActivities } = await supabaseAdmin
      .from('activity_logs')
      .select('status, user_name, ip_address')
      .is('deleted_at', null);

    const stats = {
      total: count || 0,
      suspicious: 0,
      anonymous: 0,
      failed: 0
    };

    if (allActivities) {
      stats.failed = allActivities.filter(a => a.status === 'failure' || a.status === 'error').length;
      stats.anonymous = allActivities.filter(a => !a.user_name || a.user_name === 'Anonymous').length;
      
      // Detect suspicious: multiple IPs for same user
      const ipByUser = new Map<string, Set<string>>();
      allActivities.forEach(a => {
        if (a.user_name) {
          if (!ipByUser.has(a.user_name)) {
            ipByUser.set(a.user_name, new Set());
          }
          if (a.ip_address) {
            ipByUser.get(a.user_name)!.add(a.ip_address);
          }
        }
      });
      
      stats.suspicious = Array.from(ipByUser.values()).filter(ips => ips.size > 3).length;
    }

    console.log('[Admin Activity] Found:', count, 'activities');
    console.log('[Admin Activity] Stats:', stats);

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
        stats
      }
    });

  } catch (error: any) {
    console.error('[Admin Activity] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch activities'
    }, { status: 500 });
  }
}
