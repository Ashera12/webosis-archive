/**
 * API Authorization Helpers
 * Middleware functions to check permissions in API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from './auth';
import { hasPermission, hasAnyPermission, hasAllPermissions, type Permission } from './rbac';

/**
 * Check if current user has a specific permission
 * Returns error response if not authorized
 */
export async function requirePermission(permission: Permission) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Login diperlukan' },
      { status: 401 }
    );
  }
  
  const userRole = (session.user as any).role;
  
  console.log('[requirePermission]', { 
    userEmail: session.user.email,
    sessionRole: userRole, 
    permission, 
    hasPermission: hasPermission(userRole, permission) 
  });
  
  if (!hasPermission(userRole, permission)) {
    return NextResponse.json(
      { 
        error: 'Forbidden', 
        message: 'Anda tidak memiliki izin untuk melakukan aksi ini',
        required_permission: permission,
        your_role: userRole
      },
      { status: 403 }
    );
  }
  
  return null; // Authorized
}

/**
 * Check if current user has ANY of the specified permissions
 */
export async function requireAnyPermission(permissions: Permission[]) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Login diperlukan' },
      { status: 401 }
    );
  }
  
  const userRole = (session.user as any).role;
  
  if (!hasAnyPermission(userRole, permissions)) {
    return NextResponse.json(
      { 
        error: 'Forbidden', 
        message: 'Anda tidak memiliki izin untuk melakukan aksi ini',
        required_permissions: permissions 
      },
      { status: 403 }
    );
  }
  
  return null; // Authorized
}

/**
 * Check if current user has ALL of the specified permissions
 */
export async function requireAllPermissions(permissions: Permission[]) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Login diperlukan' },
      { status: 401 }
    );
  }
  
  const userRole = (session.user as any).role;
  
  if (!hasAllPermissions(userRole, permissions)) {
    return NextResponse.json(
      { 
        error: 'Forbidden', 
        message: 'Anda tidak memiliki izin untuk melakukan aksi ini',
        required_permissions: permissions 
      },
      { status: 403 }
    );
  }
  
  return null; // Authorized
}

/**
 * Require authentication only (no specific permission check)
 */
export async function requireAuth() {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Login diperlukan' },
      { status: 401 }
    );
  }
  
  return null; // Authenticated
}

/**
 * Get current session (for use in API routes)
 */
export async function getCurrentSession() {
  return await auth();
}

/**
 * Get current user role
 */
export async function getCurrentRole(): Promise<string | null> {
  const session = await auth();
  return (session?.user as any)?.role || null;
}

/**
 * Get current user ID
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id || null;
}
