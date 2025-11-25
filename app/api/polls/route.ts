import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  try {
    console.log('[api/polls GET] Fetching active polls...');
    
    const { data: polls, error } = await supabaseAdmin
      .from('polls')
      .select('*, poll_options(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[api/polls GET] Error:', error);
      if (error.code === 'PGRST116' || error.code === 'PGRST204' || error.code === 'PGRST205') {
        return NextResponse.json({ polls: [] });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter active polls (either no expiry or expiry in future)
    const now = new Date();
    const activePolls = (polls || []).filter(poll => {
      if (!poll.expires_at) return true; // No expiry = always active
      return new Date(poll.expires_at) > now;
    });

    console.log(`[api/polls GET] Found ${polls?.length || 0} total polls, ${activePolls.length} active`);
    return NextResponse.json({ polls: activePolls });
  } catch (error: any) {
    console.error('[api/polls GET] Exception:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
