import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requirePermission } from '@/lib/apiAuth';
import { supabaseAdmin } from '@/lib/supabase/server';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const authErr = await requirePermission('announcements:read');
    if (authErr) return authErr;

    console.log('[admin/announcements GET] Fetching announcements...');
    const { data: announcements, error } = await supabaseAdmin
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[admin/announcements GET] Error:', error);
      console.error('[admin/announcements GET] Error code:', error.code);
      console.error('[admin/announcements GET] Error details:', error.details);
      // Return empty array on PGRST error instead of failing
      if (error.code === 'PGRST116' || error.code === 'PGRST204' || error.code === 'PGRST205') {
        console.log('[admin/announcements GET] Returning empty array due to PGRST error');
        return NextResponse.json({ announcements: [] });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[admin/announcements GET] Found ${announcements?.length || 0} announcements`);
    console.log('[admin/announcements GET] Raw data:', JSON.stringify(announcements, null, 2));
    
    // Don't filter by id - return all announcements
    return NextResponse.json({ announcements: announcements || [] });
  } catch (error: any) {
    console.error('[admin/announcements GET] Exception:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const authErr = await requirePermission('announcements:create');
    if (authErr) return authErr;

    const body = await request.json();
    const { title, content, priority, expires_at } = body;

    console.log('[admin/announcements POST] Creating announcement:', { title, priority });

    const { data, error } = await supabaseAdmin
      .from('announcements')
      .insert({
        title,
        content,
        priority: priority || 'normal',
        expires_at,
        created_by: session.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('[admin/announcements POST] Error:', error);
      if ((error as any).code === '23503') {
        console.log('[admin/announcements POST] FK error, retrying without created_by...');
        const retry = await supabaseAdmin.from('announcements').insert({
          title, content, priority: priority || 'normal', expires_at
        }).select().single();
        if (!retry.error) {
          console.log('[admin/announcements POST] Retry success:', retry.data);
          return NextResponse.json({ success: true, data: retry.data });
        }
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[admin/announcements POST] Success:', data);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[admin/announcements POST] Exception:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
