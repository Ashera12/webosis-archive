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
    
    // Role-based access: admin, moderator, osis, super_admin get full access
    const adminRoles = ['super_admin', 'admin', 'moderator', 'osis'];
    const userRole = (session.user.role || '').trim().toLowerCase();
    const isAdmin = adminRoles.some(role => userRole.includes(role));
    
    // Allow profile page for all authenticated users
    if (pathname === '/admin/profile') {
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
    
    // Redirect non-admin users to dashboard
    if (!isAdmin) {
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
