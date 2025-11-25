import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requirePermission } from '@/lib/apiAuth';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const authErr = await requirePermission('members:read');
    if (authErr) return authErr;

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('include_inactive') === 'true';
    const sekbidId = searchParams.get('sekbid_id');

    let query = supabaseAdmin
      .from('members')
      .select('*, sekbid:sekbid_id(id, name, color, icon)');

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    if (sekbidId && sekbidId !== 'null') {
      query = query.eq('sekbid_id', sekbidId);
    } else if (sekbidId === 'null') {
      query = query.is('sekbid_id', null);
    }

    const { data: allMembers, error } = await query.order('display_order', { ascending: true });

    if (error) {
      console.error('[admin/members GET] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter: only sekbid_id null (tim inti) or 1-6 (valid sekbid)
    const members = (allMembers || [])
      .filter((m: any) => {
        const sid = m.sekbid_id;
        const validSekbid = sid === null || (sid >= 1 && sid <= 6);
        const hasId = m.id != null && m.id !== undefined && m.id !== '';
        if (!hasId) console.warn('[admin/members GET] Filtering member without id:', m?.name);
        return validSekbid && hasId && m.name;
      });

    console.log(`[admin/members GET] Returning ${members.length} members`);
    return NextResponse.json({ members });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authErr = await requirePermission('members:create');
    if (authErr) return authErr;

    const body = await request.json();
    const { name, role, sekbid_id, photo_url, class: className, instagram, email, quote, display_order, is_active } = body;

    const { data, error } = await supabaseAdmin
      .from('members')
      .insert({
        name,
        role,
        sekbid_id,
        photo_url,
        class: className,
        instagram,
        email,
        quote,
        display_order: display_order ?? 0,
        is_active: is_active !== undefined ? is_active : true,
      })
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
