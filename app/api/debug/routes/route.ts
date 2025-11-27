import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

// Enumerate admin pages at runtime. Helps distinguish true 404 vs permission issues in production.
// NOTE: Uses filesystem; if Vercel build output paths differ, this still lists built pages present in /app.
// This endpoint should be secured if kept long-term; for now read-only diagnostic.

function collectAdminPages(baseDir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(baseDir)) return results;

  function walk(current: string, routePrefix: string) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('_')) continue; // ignore private/underscore dirs
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full, routePrefix + '/' + entry.name);
      } else if (entry.isFile()) {
        // Only include page.tsx files
        if (entry.name === 'page.tsx') {
          results.push(routePrefix || '/admin');
        }
      }
    }
  }

  walk(baseDir, '/admin');
  return Array.from(new Set(results)).sort();
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
