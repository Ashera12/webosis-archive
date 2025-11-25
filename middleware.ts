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
    
    // Role-based access: restrict admin area to allowed roles
    const allowed = (process.env.ADMIN_ALLOWED_ROLES || 'super_admin,admin,moderator,osis,siswa,guru,other').split(',').map(r => r.trim().toLowerCase());
    const userRole = (session.user.role || '').trim().toLowerCase();
    const isAllowed = allowed.includes(userRole) || userRole.includes('admin') || userRole.includes('osis') || userRole.includes('super');
    if (!isAllowed) {
      const url = new URL('/admin/login', request.url);
      url.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(url);
    }
    // User authorized
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
