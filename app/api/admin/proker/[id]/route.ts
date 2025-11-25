import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requirePermission } from '@/lib/apiAuth';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authErr = await requirePermission('proker:edit');
    if (authErr) return authErr;

    const { id } = await params;
    const body = await request.json();
    const { title, description, sekbid_id, start_date, end_date, status } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('program_kerja')
      .update({
        title,
        description: description || null,
        sekbid_id: sekbid_id || null,
        start_date: start_date || null,
        end_date: end_date || null,
        status: status || 'planned',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating proker:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in PUT /api/admin/proker/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authErr = await requirePermission('proker:delete');
    if (authErr) return authErr;

    const { id } = await params;
    const { error } = await supabaseAdmin
      .from('program_kerja')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting proker:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/proker/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
