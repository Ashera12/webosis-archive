import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requirePermission } from '@/lib/apiAuth';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const authErr = await requirePermission('polls:read');
    if (authErr) return authErr;

    console.log('[admin/polls GET] Fetching polls...');
    const { data: polls, error } = await supabaseAdmin
      .from('polls')
      .select('*, poll_options(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[admin/polls GET] Error:', error);
      // Return empty array on PGRST error instead of failing
      if (error.code === 'PGRST116' || error.code === 'PGRST204' || error.code === 'PGRST205') {
        return NextResponse.json({ polls: [] });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[admin/polls GET] Found ${polls?.length || 0} polls`);
    const validPolls = (polls || []).filter(p => p.id);
    console.log(`[admin/polls GET] Valid polls: ${validPolls.length}`);
    
    return NextResponse.json({ polls: validPolls });
  } catch (error: any) {
    console.error('[admin/polls GET] Exception:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const authErr = await requirePermission('polls:create');
    if (authErr) return authErr;

    const body = await request.json();
    const { question, options, expires_at } = body;

    console.log('[admin/polls POST] Creating poll:', { question, optionsCount: options?.length });

    const { data: poll, error: pollError } = await supabaseAdmin
      .from('polls')
      .insert({
        question,
        expires_at,
        created_by: session.user.id,
      })
      .select()
      .single();

    if (pollError) {
      console.error('[admin/polls POST] Error creating poll:', pollError);
      // Retry without created_by on FK error
      if ((pollError as any).code === '23503') {
        console.log('[admin/polls POST] FK error, retrying without created_by...');
        const retry = await supabaseAdmin.from('polls').insert({
          question, expires_at
        }).select().single();
        if (retry.error) {
          console.error('[admin/polls POST] Retry failed:', retry.error);
          return NextResponse.json({ error: retry.error.message }, { status: 500 });
        }
        console.log('[admin/polls POST] Retry success, poll created:', retry.data);
        
        // Insert poll options with retry data
        if (options && Array.isArray(options) && options.length > 0) {
          const optionsData = options.map((option: string, index: number) => ({
            poll_id: retry.data.id,
            option_text: option,
            order_index: index,
          }));

          const { error: optionsError } = await supabaseAdmin
            .from('poll_options')
            .insert(optionsData);

          if (optionsError) {
            console.error('[admin/polls POST] Error creating options:', optionsError);
            return NextResponse.json({ error: optionsError.message }, { status: 500 });
          }
          console.log(`[admin/polls POST] Created ${options.length} options`);
        }
        
        return NextResponse.json({ success: true, data: retry.data });
      }
      return NextResponse.json({ error: pollError.message }, { status: 500 });
    }

    console.log('[admin/polls POST] Poll created:', poll);

    // Insert poll options
    if (options && Array.isArray(options) && options.length > 0) {
      const optionsData = options.map((option: string, index: number) => ({
        poll_id: poll.id,
        option_text: option,
        order_index: index,
      }));

      console.log('[admin/polls POST] Creating options:', optionsData);
      const { error: optionsError } = await supabaseAdmin
        .from('poll_options')
        .insert(optionsData);

      if (optionsError) {
        console.error('[admin/polls POST] Error creating options:', optionsError);
        return NextResponse.json({ error: optionsError.message }, { status: 500 });
      }
      console.log(`[admin/polls POST] Created ${options.length} options`);
    }

    return NextResponse.json({ success: true, data: poll });
  } catch (error: any) {
    console.error('[admin/polls POST] Exception:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
