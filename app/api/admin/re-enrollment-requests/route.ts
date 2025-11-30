import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { logActivity, getIpAddress, parseUserAgent } from '@/lib/activity-logger';

/**
 * GET /api/admin/re-enrollment-requests
 * Get all pending re-enrollment requests
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get all pending re-enrollment requests
    const { data: requests, error } = await supabaseAdmin
      .from('biometric_data')
      .select(`
        user_id,
        re_enrollment_reason,
        re_enrollment_allowed,
        re_enrollment_approved_by,
        re_enrollment_approved_at,
        created_at,
        updated_at
      `)
      .not('re_enrollment_reason', 'is', null)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[Admin Re-enrollment] Query failed:', error);
      return NextResponse.json(
        { error: 'Failed to fetch re-enrollment requests' },
        { status: 500 }
      );
    }

    // Get user details for each request
    const requestsWithUsers = await Promise.all(
      (requests || []).map(async (req) => {
        const { data: userData } = await supabaseAdmin
          .from('users')
          .select('name, email, kelas, role')
          .eq('id', req.user_id)
          .single();

        let approverName = null;
        if (req.re_enrollment_approved_by) {
          const { data: approver } = await supabaseAdmin
            .from('users')
            .select('name')
            .eq('id', req.re_enrollment_approved_by)
            .single();
          approverName = approver?.name;
        }

        let status = 'none';
        if (req.re_enrollment_allowed === true) {
          status = 'approved';
        } else if (req.re_enrollment_allowed === false) {
          status = 'rejected';
        } else if (req.re_enrollment_allowed === null && req.re_enrollment_reason) {
          status = 'pending';
        }

        return {
          userId: req.user_id,
          userName: userData?.name,
          userEmail: userData?.email,
          userClass: userData?.kelas,
          userRole: userData?.role,
          reason: req.re_enrollment_reason,
          status,
          approvedBy: approverName,
          approvedAt: req.re_enrollment_approved_at,
          requestedAt: req.updated_at,
          enrolledAt: req.created_at,
        };
      })
    );

    return NextResponse.json({
      requests: requestsWithUsers,
      total: requestsWithUsers.length,
      pending: requestsWithUsers.filter((r) => r.status === 'pending').length,
      approved: requestsWithUsers.filter((r) => r.status === 'approved').length,
      rejected: requestsWithUsers.filter((r) => r.status === 'rejected').length,
    });

  } catch (error: any) {
    console.error('[Admin Re-enrollment] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/re-enrollment-requests
 * Approve or reject re-enrollment request
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: admin } = await supabaseAdmin
      .from('users')
      .select('role, name')
      .eq('id', session.user.id)
      .single();

    if (!admin || !['admin', 'super_admin'].includes(admin.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, action } = body; // action: 'approve' or 'reject'

    if (!userId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid request - userId and action (approve/reject) required' },
        { status: 400 }
      );
    }

    // Get user info
    const { data: targetUser } = await supabaseAdmin
      .from('users')
      .select('name, email')
      .eq('id', userId)
      .single();

    // Update biometric_data
    const { error: updateError } = await supabaseAdmin
      .from('biometric_data')
      .update({
        re_enrollment_allowed: action === 'approve',
        re_enrollment_approved_by: session.user.id,
        re_enrollment_approved_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('[Admin Re-enrollment] Update failed:', updateError);
      return NextResponse.json(
        { error: 'Failed to update re-enrollment status' },
        { status: 500 }
      );
    }

    // Log activity
    await logActivity({
      userId: session.user.id,
      userName: session.user.name,
      userEmail: session.user.email,
      userRole: admin.role,
      activityType: 'admin_action',
      action: `Re-enrollment ${action}d`,
      description: `Admin ${action}d re-enrollment request for ${targetUser?.name || userId}`,
      metadata: {
        target_user_id: userId,
        target_user_name: targetUser?.name,
        target_user_email: targetUser?.email,
        action,
      },
      ipAddress: getIpAddress(request),
      userAgent: request.headers.get('user-agent') || undefined,
      deviceInfo: parseUserAgent(request.headers.get('user-agent') || ''),
      relatedId: userId,
      relatedType: 're_enrollment',
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      message: `Re-enrollment request ${action}d successfully`,
      action,
      userId,
    });

  } catch (error: any) {
    console.error('[Admin Re-enrollment] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
