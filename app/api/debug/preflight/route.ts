import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import fs from 'fs';
import path from 'path';
import { getPermissions } from '@/lib/rbac';

function collectAdminPages(): string[] {
  try {
    const baseDir = path.join(process.cwd(), 'app', 'admin');
    if (!fs.existsSync(baseDir)) return [];
    const results: string[] = [];
    function walk(current: string, prefix: string) {
      const entries = fs.readdirSync(current, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('_')) continue;
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) {
          walk(full, prefix + '/' + entry.name);
        } else if (entry.isFile() && entry.name === 'page.tsx') {
          results.push(prefix || '/admin');
        }
      }
    }
    walk(baseDir, '/admin');
    return Array.from(new Set(results)).sort();
  } catch (e) {
    return [];
  }
}

const ADMIN_DEBUG_ROLES = new Set(['super_admin','admin','osis']);
const DEBUG_ENABLED = process.env.DEBUG_ADMIN_ENDPOINTS !== 'false';

export async function GET() {
  if (!DEBUG_ENABLED) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }
  const session = await auth();
  const authenticated = !!session?.user;
  const sessionRole = (session?.user as any)?.role?.toLowerCase() || null;
  const userId = (session?.user as any)?.id || null;

  if (!authenticated || !ADMIN_DEBUG_ROLES.has(sessionRole || '')) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Fresh DB role fetch (reuse logic similar to apiAuth without importing its cache to keep this endpoint lightweight)
  let dbRole: string | null = null;
  if (userId) {
    try {
      const { supabaseAdmin } = await import('@/lib/supabase/server');
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
      if (!error && data?.role) dbRole = (data.role || '').trim().toLowerCase();
    } catch (e) {
      console.error('[preflight] DB role fetch error', e);
    }
  }
  const effectiveRole = dbRole || sessionRole;

  const pages = collectAdminPages();
  const expectedCanonicals = ['/admin/data/sekbid', '/admin/data/members'];
  const missingCanonicals = expectedCanonicals.filter(p => !pages.includes(p));

  const permissions = effectiveRole ? getPermissions(effectiveRole) : [];
  const timestamp = new Date().toISOString();

  return NextResponse.json({
    ok: true,
    timestamp,
    user: { id: userId, email: session?.user?.email },
    session_role: sessionRole,
    db_role: dbRole,
    effective_role: effectiveRole,
    role_mismatch: sessionRole && dbRole && sessionRole !== dbRole || false,
    permissions,
    pages,
    missing_canonicals: missingCanonicals,
  });
}
