import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { hasPermission } from '@/lib/rbac';

/**
 * DEBUG API: Check user's current session and database role
 * Use this to diagnose role sync issues
 */
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({
        error: 'Not authenticated',
        session: null,
        dbUser: null
      }, { status: 401 });
    }

    // Fetch fresh data from database
    const { data: dbUser, error: dbError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role, approved, email_verified, created_at, updated_at')
      .eq('id', session.user.id)
      .single();

    if (dbError) {
      console.error('[Debug Role] DB Error:', dbError);
    }

    // Check some key permissions
    const userRole = dbUser?.role || (session.user as any).role;
    const permissions = {
      'sekbid:read': hasPermission(userRole, 'sekbid:read'),
      'sekbid:edit': hasPermission(userRole, 'sekbid:edit'),
      'proker:read': hasPermission(userRole, 'proker:read'),
      'proker:edit': hasPermission(userRole, 'proker:edit'),
      'events:read': hasPermission(userRole, 'events:read'),
      'events:edit': hasPermission(userRole, 'events:edit'),
      'users:read': hasPermission(userRole, 'users:read'),
      'users:approve': hasPermission(userRole, 'users:approve'),
      'settings:read': hasPermission(userRole, 'settings:read'),
      'settings:write': hasPermission(userRole, 'settings:write'),
    };

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      session: {
        userId: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: (session.user as any).role,
        sessionCreatedAt: (session as any).expires,
      },
      database: {
        ...dbUser,
        dbError: dbError ? dbError.message : null
      },
      roleMatch: dbUser?.role === (session.user as any).role,
      permissions,
      diagnosis: {
        sessionHasRole: !!(session.user as any).role,
        dbHasRole: !!dbUser?.role,
        rolesMatch: dbUser?.role === (session.user as any).role,
        isApproved: dbUser?.approved,
        isVerified: dbUser?.email_verified,
        canAccessAdmin: ['super_admin', 'admin', 'osis'].includes(dbUser?.role || ''),
        recommendation: dbUser?.role !== (session.user as any).role 
          ? 'Role mismatch! Please logout and login again to refresh session.'
          : 'Roles are synced. If you still have issues, clear cookies and re-login.'
      }
    });
  } catch (error: any) {
    console.error('[Debug Role] Exception:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error.message
    }, { status: 500 });
  }
}
