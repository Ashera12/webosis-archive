import { auth } from './auth';
import type { Session } from 'next-auth';

// The `auth` export from `lib/auth` is a handler/middleware type, so
// using `ReturnType<typeof auth>` for the session type confuses TS. Use the
// `Session` type from `next-auth` instead.
type AuthSession = Session | null;
type RoleCheckResult = { ok: true; session: Session } | { ok: false; status: number; body: any };

/**
 * Server-side role check helper.
 * allowedRoles: array of allowed role names (e.g. ['super_admin','admin'])
 */
export async function requireRole(allowedRoles: string[] = ['super_admin']): Promise<RoleCheckResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, status: 401, body: { error: 'Unauthorized' } };
  const role = (session.user as any)?.role as string | undefined;
  if (!role || !allowedRoles.includes(role)) return { ok: false, status: 403, body: { error: 'Forbidden - role not allowed' } };
  return { ok: true, session };
}

export async function requireAuth(): Promise<RoleCheckResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, status: 401, body: { error: 'Unauthorized' } };
  return { ok: true, session };
}

export default { requireRole, requireAuth };

