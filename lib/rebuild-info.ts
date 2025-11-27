// Force Vercel rebuild - Updated: 2025-11-27 14:18
// This file triggers Vercel redeployment to clear build cache

export const FORCE_REBUILD_TIMESTAMP = '2025-11-27T14:18:00Z';
export const REBUILD_REASON = 'Clear build cache - fix 404 on /admin/data/sekbid';

// Build information
export const BUILD_INFO = {
  timestamp: FORCE_REBUILD_TIMESTAMP,
  reason: REBUILD_REASON,
  affectedRoutes: [
    '/admin/data/sekbid',
    '/admin/data/sekbid/[id]',
    '/api/admin/sekbid',
    '/api/admin/sekbid/[id]',
  ],
  expectedFixes: [
    'Page /admin/data/sekbid accessible after login',
    'API /api/admin/sekbid returns data with auth',
    'No 404 errors on authenticated access',
    'Build cache cleared completely',
  ],
};
