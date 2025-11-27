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

export async function GET() {
  const session = await auth();
  const authenticated = !!session?.user;
  const sessionRole = (session?.user as any)?.role || null;
  const userId = (session?.user as any)?.id || null;

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
    authenticated,
    user: authenticated ? { id: userId, email: session?.user?.email } : null,
    session_role: sessionRole,
    db_role: dbRole,
    effective_role: effectiveRole,
    role_mismatch: sessionRole && dbRole && sessionRole !== dbRole || false,
    permissions,
    pages,
    missing_canonicals: missingCanonicals,
  });
}
