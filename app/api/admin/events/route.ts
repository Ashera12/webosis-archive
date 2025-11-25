import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiAuth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const authError = await requirePermission('events:read');
  if (authError) return authError;

  try {
    console.log('[admin/events GET] Fetching events...');
    // Get all events with all fields
    const { data: events, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .order('event_date', { ascending: false });

    if (error) {
      console.error('[admin/events GET] Error:', error);
      // Graceful empty array on common PostgREST errors
      if (error.code === 'PGRST116' || error.code === 'PGRST204' || error.code === 'PGRST205') {
        return NextResponse.json({ events: [] });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log events before filtering
    console.log(`[admin/events GET] Raw events count: ${events?.length || 0}`);
    if (events && events.length > 0) {
      console.log('[admin/events GET] First event sample:', events[0]);
    }
    
    // Filter out any events with truly invalid data (but null id might be valid in some DBs)
    const validEvents = (events || []);
    console.log(`[admin/events GET] Returning ${validEvents.length} events`);
    
    return NextResponse.json({ success: true, events: validEvents });
  } catch (error: any) {
    console.error('[admin/events GET] Exception:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = await requirePermission('events:create');
  if (authError) return authError;

  try {
    const session = await auth();

    const body = await request.json();
    const { title, description, event_date, location, image_url, registration_link } = body;

    console.log('[admin/events POST] Creating event:', { title, event_date });

    const { data, error } = await supabaseAdmin
      .from('events')
      .insert({
        title,
        description,
        event_date,
        location,
        image_url,
        registration_link,
        created_by: session?.user?.id || null,
      })
      .select('*')
      .single();

    if (error) {
      console.error('[admin/events POST] Error:', error);
      if ((error as any).code === '23503') {
        console.log('[admin/events POST] FK error, retrying without created_by...');
        const retry = await supabaseAdmin.from('events').insert({
          title, description, event_date, location, image_url, registration_link
        }).select('*').single();
        if (!retry.error) {
          console.log('[admin/events POST] Retry success:', retry.data);
          return NextResponse.json({ success: true, data: retry.data });
        }
        console.error('[admin/events POST] Retry also failed:', retry.error);
        return NextResponse.json({ error: retry.error.message }, { status: 500 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[admin/events POST] Success:', data);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[admin/events POST] Exception:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
