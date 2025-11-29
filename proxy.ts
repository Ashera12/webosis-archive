import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  // Public auth pages
  if (
    pathname === '/admin/login' ||
    pathname === '/admin/forgot-password' ||
    pathname.startsWith('/admin/reset-password') ||
    pathname === '/register' ||
    pathname.startsWith('/verify-email') ||
    pathname === '/waiting-approval' ||
    pathname === '/waiting-verification'
  ) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Legacy redirect
  if (pathname === '/admin/content') {
    const url = new URL('/admin/posts', request.url);
    return NextResponse.redirect(url);
  }

  // Admin gate
  if (pathname.startsWith('/admin')) {
    const session = await auth();
    if (!session?.user) {
      const url = new URL('/admin/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }

    if (pathname === '/admin/profile') {
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    const userRole = (session.user.role || '').trim().toLowerCase();

    const adminRoles = ['super_admin', 'admin', 'osis'];
    const isAdmin = adminRoles.includes(userRole);
    if (!isAdmin) {
      const url = new URL('/dashboard', request.url);
      return NextResponse.redirect(url);
    }

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Dashboard gate
  if (pathname.startsWith('/dashboard')) {
    const session = await auth();
    if (!session?.user) {
      const url = new URL('/admin/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}
