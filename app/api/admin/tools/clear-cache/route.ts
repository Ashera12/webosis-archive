import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/apiAuth';

export async function POST(req: NextRequest) {
  const authErr = await requireAuth();
  if (authErr) return authErr;

  try {
    // Placeholder: In a real app, call revalidateTag/path or purge caches
    return NextResponse.json({ success: true, message: 'Cache cleared (no-op in dev)' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to clear cache' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';