// app/api/admin/errors/all/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET ALL ERROR LOGS - ADMIN ONLY
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
    
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');
    const autoFixable = searchParams.get('autoFixable');

    // Build query
    let query = supabaseAdmin
      .from('error_logs')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (severity) query = query.eq('severity', severity);
    if (status) query = query.eq('status', status);
    if (autoFixable) query = query.eq('auto_fixable', autoFixable === 'true');

    const { data: errors, error, count } = await query;

    if (error) throw error;

    // Calculate stats
    const { data: allErrors } = await supabaseAdmin
      .from('error_logs')
      .select('severity, status, auto_fixable')
      .is('deleted_at', null);

    const stats = {
      total: count || 0,
      critical: allErrors?.filter(e => e.severity === 'critical').length || 0,
      autoFixable: allErrors?.filter(e => e.auto_fixable).length || 0,
      fixed: allErrors?.filter(e => e.status === 'fixed').length || 0
    };

    return NextResponse.json({
      success: true,
      data: { errors, stats }
    });

  } catch (error: any) {
    console.error('[Admin Errors] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
