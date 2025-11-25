import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  try {
    console.log('[api/announcements GET] Fetching announcements...');
    const now = new Date().toISOString();
    
    const { data: announcements, error: annError } = await supabaseAdmin
      .from('announcements')
      .select('*')
      .or(`expires_at.is.null,expires_at.gte.${now}`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (annError) {
      console.error('[api/announcements GET] Error:', annError);
      if (annError.code === 'PGRST116' || annError.code === 'PGRST204' || annError.code === 'PGRST205') {
        return NextResponse.json({ announcements: [] });
      }
      return NextResponse.json({ error: annError.message }, { status: 500 });
    }

    console.log(`[api/announcements GET] Found ${announcements?.length || 0} announcements`);
    return NextResponse.json({ announcements: announcements || [] });
  } catch (error: any) {
    console.error('[api/announcements GET] Exception:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
