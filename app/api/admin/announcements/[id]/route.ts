import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requirePermission } from '@/lib/apiAuth';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authErr = await requirePermission('announcements:delete');
    if (authErr) return authErr;

    const { id } = await params;
    console.log('[admin/announcements DELETE] Deleting announcement:', id);

    const { error } = await supabaseAdmin
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[admin/announcements DELETE] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[admin/announcements DELETE] Success');
    return NextResponse.json({ success: true, message: 'Announcement deleted' });
  } catch (error: any) {
    console.error('[admin/announcements DELETE] Exception:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authErr = await requirePermission('announcements:edit');
    if (authErr) return authErr;

    const { id } = await params;
    const body = await request.json();
    const { title, content, priority, expires_at } = body;

    const { data, error } = await supabaseAdmin
      .from('announcements')
      .update({
        title,
        content,
        priority,
        expires_at,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
