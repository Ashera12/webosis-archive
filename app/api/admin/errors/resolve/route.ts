// app/api/admin/errors/resolve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * RESOLVE ERROR MANUALLY - ADMIN ONLY
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const userRole = (session.user.role || '').toLowerCase();
    if (!['admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json({
        success: false,
        error: 'Forbidden'
      }, { status: 403 });
    }

    const { errorId, status, notes } = await request.json();

    await supabaseAdmin
      .from('error_logs')
      .update({
        status,
        resolved_at: new Date().toISOString(),
        resolved_by: session.user.id,
        resolution_notes: notes
      })
      .eq('id', errorId);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
