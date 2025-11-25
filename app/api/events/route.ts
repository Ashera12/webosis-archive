import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  try {
    console.log('[api/events GET] Fetching events...');
    
    // Get all events, ordered by date descending (newest first)
    const { data: events, error: evtError } = await supabaseAdmin
      .from('events')
      .select('*')
      .order('event_date', { ascending: false });

    if (evtError) {
      console.error('[api/events GET] Error:', evtError);
      if (evtError.code === 'PGRST116' || evtError.code === 'PGRST204' || evtError.code === 'PGRST205') {
        return NextResponse.json({ events: [] });
      }
      return NextResponse.json({ error: evtError.message }, { status: 500 });
    }

    console.log(`[api/events GET] Found ${events?.length || 0} events`);
    return NextResponse.json({ events: events || [] });
  } catch (error: any) {
    console.error('[api/events GET] Exception:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
