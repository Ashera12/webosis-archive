import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requirePermission } from '@/lib/apiAuth';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const authErr = await requirePermission('gallery:read');
    if (authErr) return authErr;

    const { data: gallery, error } = await supabaseAdmin
      .from('gallery')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[admin/gallery GET] Error:', error);
      const code = (error as any)?.code;
      // Graceful empty array on common PostgREST errors (missing column/order etc.)
      if (code === 'PGRST116' || code === 'PGRST204' || code === 'PGRST205') {
        return NextResponse.json({ gallery: [] });
      }
      return NextResponse.json({ error: (error as any)?.message || String(error), code }, { status: 500 });
    }

    // Filter only invalid items, keep original IDs
    const normalized = (gallery || [])
      .filter((g: any) => {
        const hasId = g.id != null && g.id !== undefined && g.id !== '';
        if (!hasId) console.warn('[admin/gallery GET] Filtering item without id:', g?.title);
        return hasId && g.title;
      });

    console.log(`[admin/gallery GET] Returning ${normalized.length} items`);
    return NextResponse.json({ gallery: normalized });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const authErr = await requirePermission('gallery:create');
    if (authErr) return authErr;

    const body = await request.json();
    const { title, description, image_url, event_id, sekbid_id } = body;

    // Rely on existing table primary key (likely BIGINT/serial). Do not manually set id.
    const insertPayload = {
      title,
      description,
      image_url,
      event_id,
      sekbid_id,
      created_by: session.user.id,
    } as any;

    const { data, error } = await supabaseAdmin
      .from('gallery')
      // Attempt insert with created_by first
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      // Foreign key violation code 23503 -> retry without created_by
      if ((error as any).code === '23503') {
        console.warn('[admin/gallery POST] FK violation on created_by, retrying without created_by');
        const retryPayload = { ...insertPayload } as any;
        delete retryPayload.created_by;
        const retry = await supabaseAdmin
          .from('gallery')
          .insert(retryPayload)
          .select()
          .single();
        if (!retry.error) {
          return NextResponse.json({ success: true, data: retry.data, note: 'Inserted without created_by due to FK mismatch' });
        }
        console.error('[admin/gallery POST] Retry also failed:', {
          message: retry.error.message,
          code: (retry.error as any).code,
          details: (retry.error as any).details,
          hint: (retry.error as any).hint,
        });
      }
      console.error('[admin/gallery POST] Insert error:', {
        message: error.message,
        details: (error as any).details,
        hint: (error as any).hint,
        code: (error as any).code,
        payload: insertPayload,
      });
      return NextResponse.json({ error: error.message, code: (error as any).code }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
