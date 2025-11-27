import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

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

  // Inject known aliases for stability (sekbid, members) even if data subtree pruned
  const aliasTargets = [
    { path: '/admin/sekbid', target: '/admin/data/sekbid' },
    { path: '/admin/members', target: '/admin/data/members' },
  ];
  for (const alias of aliasTargets) {
    if (!results.find(r => r.path === alias.path)) {
      results.push({ path: alias.path, kind: 'alias' });
    }
    // Show canonical target if missing
    if (!results.find(r => r.path === alias.target)) {
      results.push({ path: alias.target, kind: 'canonical-missing' });
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
  try {
    const root = process.cwd();
    const adminDir = path.join(root, 'app', 'admin');
    const pages = collectAdminPages(adminDir);
    return NextResponse.json({ ok: true, pages, count: pages.length });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
