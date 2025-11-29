import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const ADMIN_DEBUG_ROLES = new Set(['super_admin','admin','osis']);
const DEBUG_ENABLED = process.env.DEBUG_ADMIN_ENDPOINTS === '1';

// Enumerate admin pages at runtime. Helps distinguish true 404 vs permission issues in production.
// NOTE: Uses filesystem; if Vercel build output paths differ, this still lists built pages present in /app.
// This endpoint should be secured if kept long-term; for now read-only diagnostic.

function collectAdminPages(baseDir: string): { path: string; kind: string }[] {
  const results: { path: string; kind: string }[] = [];
  if (!fs.existsSync(baseDir)) return results;

  function walk(current: string, routePrefix: string) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('_')) continue; // ignore private/underscore dirs
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full, routePrefix + '/' + entry.name);
      } else if (entry.isFile()) {
        if (entry.name === 'page.tsx') {
          results.push({ path: routePrefix || '/admin', kind: 'page' });
        }
      }
    }
  }

  walk(baseDir, '/admin');

  // Treat aliases as satisfying their canonical targets if either exists.
  const aliasPairs: Array<{ alias: string; canonical: string }> = [
    { alias: '/admin/sekbid', canonical: '/admin/data/sekbid' },
    { alias: '/admin/members', canonical: '/admin/data/members' },
  ];
  for (const { alias, canonical } of aliasPairs) {
    const hasAlias = results.some(r => r.path === alias);
    const hasCanonical = results.some(r => r.path === canonical);
    if (!hasAlias && !hasCanonical) {
      // Neither exists: flag canonical missing to highlight intended route
      results.push({ path: canonical, kind: 'canonical-missing' });
    } else {
      // At least one exists: ensure we show the alias and mark canonical as satisfied
      if (!hasAlias) results.push({ path: alias, kind: 'alias' });
      // Represent canonical presence as 'canonical' if present, else omit missing flag
      if (hasCanonical) {
        results.push({ path: canonical, kind: 'canonical' });
      }
    }
  }

  // Deduplicate by path keeping first kind
  const seen = new Set<string>();
  const dedup: { path: string; kind: string }[] = [];
  for (const r of results) {
    if (!seen.has(r.path)) {
      dedup.push(r);
      seen.add(r.path);
    }
  }
  return dedup.sort((a, b) => a.path.localeCompare(b.path));
}

export async function GET() {
  if (!DEBUG_ENABLED) {
    // Hide endpoint entirely if disabled
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }
  const session = await auth();
  const role = (session?.user as any)?.role?.toLowerCase();
  if (!session?.user || !ADMIN_DEBUG_ROLES.has(role)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const root = process.cwd();
    const adminDir = path.join(root, 'app', 'admin');
    const pages = collectAdminPages(adminDir);
    return NextResponse.json({ ok: true, pages, count: pages.length });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
