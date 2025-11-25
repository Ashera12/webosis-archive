import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requirePermission } from '@/lib/apiAuth';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authErr = await requirePermission('members:delete');
    if (authErr) return authErr;

    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('members')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Member deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authErr = await requirePermission('members:edit');
    if (authErr) return authErr;

    const { id } = await params;
    const body = await request.json();
    const { name, role, sekbid_id, photo_url, class: className, instagram, email, quote, display_order, is_active } = body;

    const { data, error } = await supabaseAdmin
      .from('members')
      .update({
        name,
        role,
        sekbid_id,
        photo_url,
        class: className,
        instagram,
        email,
        quote,
        display_order,
        is_active,
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
