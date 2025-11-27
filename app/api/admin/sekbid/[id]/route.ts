import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiAuth';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authErr = await requirePermission('sekbid:read');
    if (authErr) return authErr;
    const { id } = await params;
    console.log('[API sekbid/:id][GET] invoked', { id, at: new Date().toISOString() });

    const { data, error } = await supabaseAdmin
      .from('sekbid')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[API sekbid/:id][GET] error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Sekbid not found' }, { status: 404 });
    }

    return NextResponse.json({ sekbid: data });
  } catch (error: any) {
    console.error('[API sekbid/:id][GET] exception:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authErr = await requirePermission('sekbid:edit');
    if (authErr) return authErr;
    const { id } = await params;
    console.log('[API sekbid/:id][PUT] invoked', { id, at: new Date().toISOString() });
    const body = await request.json();
    const { name, description, display_order } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('sekbid')
      .update({
        name,
        description: description || null,
        display_order: display_order !== undefined ? display_order : 0
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[API sekbid/:id][PUT] error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Sekbid not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API sekbid/:id][PUT] exception:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authErr = await requirePermission('sekbid:delete');
    if (authErr) return authErr;
    const { id } = await params;
    console.log('[API sekbid/:id][DELETE] invoked', { id, at: new Date().toISOString() });

    const { error } = await supabaseAdmin
      .from('sekbid')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[API sekbid/:id][DELETE] error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API sekbid/:id][DELETE] exception:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
