import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requirePermission } from '@/lib/apiAuth';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authErr = await requirePermission('polls:delete');
    if (authErr) return authErr;

    const { id } = await params;

    // Delete poll options first (cascade)
    await supabaseAdmin
      .from('poll_options')
      .delete()
      .eq('poll_id', id);

    // Delete poll
    const { error } = await supabaseAdmin
      .from('polls')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Poll deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authErr = await requirePermission('polls:edit');
    if (authErr) return authErr;
    const session = await auth();
    const { id } = await params;
    const body = await request.json();
    const { question, expires_at, options } = body;

    console.log('[admin/polls PUT] Updating poll:', { id, question, optionsCount: options?.length });

    // Update poll record
    const { error: updateError } = await supabaseAdmin
      .from('polls')
      .update({ question, expires_at })
      .eq('id', id);
    if (updateError) {
      console.error('[admin/polls PUT] Update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Replace options if provided
    if (Array.isArray(options)) {
      // Delete existing
      const { error: delErr } = await supabaseAdmin
        .from('poll_options')
        .delete()
        .eq('poll_id', id);
      if (delErr) {
        console.error('[admin/polls PUT] Delete options error:', delErr);
        return NextResponse.json({ error: delErr.message }, { status: 500 });
      }
      if (options.length > 0) {
        const insertData = options.map((opt: string, idx: number) => ({
          poll_id: id,
          option_text: opt,
          order_index: idx,
        }));
        const { error: insErr } = await supabaseAdmin
          .from('poll_options')
          .insert(insertData);
        if (insErr) {
          console.error('[admin/polls PUT] Insert options error:', insErr);
          return NextResponse.json({ error: insErr.message }, { status: 500 });
        }
      }
    }

    // Fetch updated poll with options for response
    const { data: poll, error: fetchErr } = await supabaseAdmin
      .from('polls')
      .select('*, poll_options(*)')
      .eq('id', id)
      .single();
    if (fetchErr) {
      console.error('[admin/polls PUT] Fetch updated poll error:', fetchErr);
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: poll });
  } catch (error: any) {
    console.error('[admin/polls PUT] Exception:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authErr = await requirePermission('polls:read');
    if (authErr) return authErr;
    const { id } = await params;
    const { data: poll, error } = await supabaseAdmin
      .from('polls')
      .select('*, poll_options(*)')
      .eq('id', id)
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!poll) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ poll });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
