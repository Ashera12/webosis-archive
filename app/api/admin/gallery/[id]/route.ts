import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requirePermission } from '@/lib/apiAuth';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authErr = await requirePermission('gallery:delete');
    if (authErr) return authErr;

    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('gallery')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Gallery item deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authErr = await requirePermission('gallery:edit');
    if (authErr) return authErr;

    const { id } = await params;
    const body = await request.json();
    const { title, description, image_url, event_id, sekbid_id } = body;

    // Build update object without updated_at (let database handle it via trigger)
    const updateData: any = {
      title,
      description,
      image_url,
    };

    // Only include optional fields if they're provided
    if (event_id !== undefined) updateData.event_id = event_id;
    if (sekbid_id !== undefined) updateData.sekbid_id = sekbid_id;

    const { data, error } = await supabaseAdmin
      .from('gallery')
      .update(updateData)
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
