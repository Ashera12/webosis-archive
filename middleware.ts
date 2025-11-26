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
    
    // STRICT: Only super_admin, admin, osis can access admin panel
    const adminRoles = ['super_admin', 'admin', 'osis'];
    const userRole = (session.user.role || '').trim().toLowerCase();
    const isAdmin = adminRoles.includes(userRole);
    
    // Exception: Allow /admin/profile for all authenticated users to edit own profile
    if (pathname === '/admin/profile') {
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
    
    // Redirect non-admin users to 404 (no info leak)
    if (!isAdmin) {
      const url = new URL('/404', request.url);
      return NextResponse.rewrite(url);
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
