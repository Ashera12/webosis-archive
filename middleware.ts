import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Add pathname to headers for layout to read
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);
  
  // Public auth pages (login, forgot, reset, verification)
  if (pathname === '/admin/login' || pathname === '/admin/forgot-password' || pathname.startsWith('/admin/reset-password') || pathname === '/register' || pathname.startsWith('/verify-email') || pathname === '/waiting-approval' || pathname === '/waiting-verification') {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }
  
  // Check authentication for admin routes
  if (pathname.startsWith('/admin')) {
    const session = await auth();
    
    if (!session?.user) {
      // Redirect to login if not authenticated
      const url = new URL('/admin/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
    
    // Exception: Allow /admin/profile for all authenticated users to edit own profile
    if (pathname === '/admin/profile') {
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
    
    // STRICT: Fetch current role from database (not session) to ensure latest role is used
    let userRole = (session.user.role || '').trim().toLowerCase();
    
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const supabase = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      });
      
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();
      
      if (userData?.role) {
        userRole = userData.role.trim().toLowerCase();
        console.log('[Middleware] Fetched fresh role from DB:', { 
          userId: session.user.id, 
          sessionRole: session.user.role, 
          dbRole: userData.role,
          pathname 
        });
      }
    } catch (error) {
      console.error('[Middleware] Error fetching role from DB:', error);
    }
    
    // Only super_admin, admin, osis can access admin panel
    const adminRoles = ['super_admin', 'admin', 'osis'];
    const isAdmin = adminRoles.includes(userRole);
    
    console.log('[Middleware] Admin access check:', {
      pathname,
      userId: session.user.id,
      email: session.user.email,
      userRole,
      isAdmin,
      adminRoles
    });
    
    // Redirect non-admin users to dashboard
    if (!isAdmin) {
      console.log('[Middleware] Redirecting non-admin to dashboard:', { userRole, pathname });
      const url = new URL('/dashboard', request.url);
      return NextResponse.redirect(url);
    }
    
    // Admin user authorized
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }
  
  // Check authentication for dashboard route
  if (pathname.startsWith('/dashboard')) {
    const session = await auth();
    
    if (!session?.user) {
      const url = new URL('/admin/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
