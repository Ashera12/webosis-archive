/**
 * API Authorization Helpers
 * Middleware functions to check permissions in API routes
 */

import { NextResponse } from 'next/server';
import { auth } from './auth';
import { hasPermission, hasAnyPermission, hasAllPermissions, type Permission } from './rbac';

// Lightweight in-memory role cache to minimize DB hits when many API calls
// Keyed by userId, stores { role, expires }
const roleCache = new Map<string, { role: string; expires: number }>();
const ROLE_CACHE_TTL_MS = 30_000; // 30 seconds

async function fetchFreshRole(userId: string): Promise<string | null> {
  const cached = roleCache.get(userId);
  const now = Date.now();
  if (cached && cached.expires > now) {
    return cached.role;
  }
  try {
    const { supabaseAdmin } = await import('./supabase/server');
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();
    if (error) return null;
    const role = (data?.role || '').trim().toLowerCase();
    if (role) {
      roleCache.set(userId, { role, expires: now + ROLE_CACHE_TTL_MS });
      return role;
    }
    return null;
  } catch (e) {
    console.error('[apiAuth] fetchFreshRole error:', e);
    return null;
  }
}

function resolveEffectiveRole(sessionRole: string | undefined | null, freshRole: string | null): string | null {
  // Prefer fresh DB role when available; fallback to session role
  return (freshRole || sessionRole || null);
}

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

  const sessionRole = (session.user as any).role;
  const userId = (session.user as any).id;
  let freshRole: string | null = null;

  if (userId) {
    freshRole = await fetchFreshRole(userId);
  }

  const effectiveRole = resolveEffectiveRole(sessionRole, freshRole);

  console.log('[requirePermission]', {
    userEmail: session.user.email,
    sessionRole,
    freshRole,
    effectiveRole,
    permission,
    hasPermission: hasPermission(effectiveRole || undefined, permission)
  });

  if (!hasPermission(effectiveRole || undefined, permission)) {
    return NextResponse.json(
      {
        error: 'Forbidden',
        message: 'Anda tidak memiliki izin untuk melakukan aksi ini',
        required_permission: permission,
        session_role: sessionRole,
        db_role: freshRole,
        effective_role: effectiveRole
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

  const sessionRole = (session.user as any).role;
  const userId = (session.user as any).id;
  const freshRole = userId ? await fetchFreshRole(userId) : null;
  const effectiveRole = resolveEffectiveRole(sessionRole, freshRole);

  if (!hasAnyPermission(effectiveRole || undefined, permissions)) {
    return NextResponse.json(
      {
        error: 'Forbidden',
        message: 'Anda tidak memiliki izin untuk melakukan aksi ini',
        required_permissions: permissions,
        session_role: sessionRole,
        db_role: freshRole,
        effective_role: effectiveRole
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

  const sessionRole = (session.user as any).role;
  const userId = (session.user as any).id;
  const freshRole = userId ? await fetchFreshRole(userId) : null;
  const effectiveRole = resolveEffectiveRole(sessionRole, freshRole);

  if (!hasAllPermissions(effectiveRole || undefined, permissions)) {
    return NextResponse.json(
      {
        error: 'Forbidden',
        message: 'Anda tidak memiliki izin untuk melakukan aksi ini',
        required_permissions: permissions,
        session_role: sessionRole,
        db_role: freshRole,
        effective_role: effectiveRole
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
