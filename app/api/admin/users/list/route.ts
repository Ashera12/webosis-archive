// app/api/admin/users/list/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET ALL USERS LIST (for admin dropdown selectors)
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
    const userRole = ((session.user as any)?.role || '').toLowerCase();
    if (!['admin', 'super_admin', 'osis'].includes(userRole)) {
      return NextResponse.json({
        success: false,
        error: 'Forbidden: Admin access required'
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '100');

    console.log('[Admin Users List] Fetching users, search:', search);

    // Build query
    let query = supabaseAdmin
      .from('users')
      .select('id, email, name, role, created_at')
      .order('name', { ascending: true })
      .limit(limit);

    // Apply search filter
    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
    }

    const { data: users, error } = await query;

    if (error) {
      console.error('[Admin Users List] Query error:', error);
      throw error;
    }

    console.log('[Admin Users List] Found:', users?.length || 0, 'users');

    return NextResponse.json({
      success: true,
      data: {
        users: users || [],
        total: users?.length || 0
      }
    });

  } catch (error: any) {
    console.error('[Admin Users List] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch users list'
    }, { status: 500 });
  }
}
