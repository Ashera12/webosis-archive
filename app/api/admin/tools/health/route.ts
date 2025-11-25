import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/apiAuth';

export async function GET(req: NextRequest) {
  const authErr = await requireAuth();
  if (authErr) return authErr;

  try {
    const now = new Date().toISOString();
    return NextResponse.json({ success: true, message: 'OK', time: now });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Health check failed' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';