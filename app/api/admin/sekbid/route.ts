import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiAuth';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const authErr = await requirePermission('sekbid:read');
    if (authErr) return authErr;

    console.log('[API sekbid][GET] listing invoked at', new Date().toISOString());

    const { data: sekbid, error } = await supabaseAdmin
      .from('sekbid')
      .select('*')
      .lte('id', 6) // Only sekbid 1-6
      .order('id', { ascending: true });

    if (error) {
      console.error('[API sekbid][GET] error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[API sekbid][GET] count:', (sekbid || []).length);
    return NextResponse.json(sekbid || []);
  } catch (error: any) {
    console.error('[API sekbid][GET] exception:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authErr = await requirePermission('sekbid:create');
    if (authErr) return authErr;

    console.log('[API sekbid][POST] create invoked at', new Date().toISOString());
    const body = await request.json();
    const { name, description, display_order } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('sekbid')
      .insert({
        name,
        description: description || null,
        display_order: display_order || 0
      })
      .select()
      .single();

    if (error) {
      console.error('[API sekbid][POST] error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API sekbid][POST] exception:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
