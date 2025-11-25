import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';
export const runtime = 'nodejs';

function mapToAdmin(p: any) {
  return {
    id: p.id,
    title: p.title,
    content: p.content || '',
    excerpt: p.excerpt || '',
    image_url: p.featured_image || '',
    author_id: p.author_id,
    is_published: p.status === 'published',
    published_at: p.published_at,
    created_at: p.created_at,
  };
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data, error } = await supabaseAdmin
      .from('posts')
      .select('*')
      .eq('id', params.id)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(mapToAdmin(data));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const body = await request.json();
    const update: any = {};
    
    // Handle all fields - ensure title is updated when provided
    if (body.title !== undefined && body.title.trim()) {
      update.title = body.title.trim();
    }
    if (body.content !== undefined) update.content = body.content;
    if (body.excerpt !== undefined) update.excerpt = body.excerpt?.trim() || null;
    if (body.image_url !== undefined) update.featured_image = body.image_url?.trim() || null;
    
    if (body.is_published !== undefined) {
      if (body.is_published) {
        update.status = 'published';
        update.published_at = new Date().toISOString();
      } else {
        update.status = 'draft';
        // Leave published_at as is when unpublishing
      }
    }
    
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }
    
    const postId = isNaN(Number(params.id)) ? params.id : Number(params.id);

    console.log('[admin/posts PUT] Updating post:', { postId, update });

    const { data, error } = await supabaseAdmin
      .from('posts')
      .update(update)
      .eq('id', postId)
      .select()
      .single();
      
    if (error) {
      const debug = {
        message: error.message,
        code: (error as any).code,
        details: (error as any).details,
        hint: (error as any).hint,
        update,
        postId,
      };
      console.error('[admin/posts PUT] Update error:', debug);
      const msg = (error as any).message || 'Update failed';
      if (msg.includes('column') && msg.includes('does not exist')) {
        return NextResponse.json({
          error: 'Schema mismatch: missing columns. Please run alter_content_tables_sync.sql and refresh.'
        }, { status: 500 });
      }
      return NextResponse.json({ error: msg }, { status: 500 });
    }
    
    console.log('[admin/posts PUT] Update successful:', data);
    return NextResponse.json({ success: true, data: mapToAdmin(data) });
  } catch (e: any) {
    console.error('[admin/posts PUT] Exception:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { error } = await supabaseAdmin
      .from('posts')
      .delete()
      .eq('id', params.id);
    if (error) {
      console.error('[admin/posts DELETE] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
