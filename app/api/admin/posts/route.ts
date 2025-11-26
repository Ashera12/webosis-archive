import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiAuth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { randomUUID } from 'crypto';
export const runtime = 'nodejs';

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function GET() {
  // Check permission
  const authError = await requirePermission('posts:read');
  if (authError) return authError;
  
  try {
    console.log('[admin/posts GET] Fetching from database...');
    const { data, error } = await supabaseAdmin
      .from('posts')
      .select(`
        *,
        author:users!author_id (
          id,
          name,
          photo_url
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100);
      
    if (error) {
      console.error('[admin/posts GET] Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log('[admin/posts GET] Raw data count:', data?.length || 0);
    
    // Map to admin form shape - filter only truly invalid entries
    const mapped = (data || [])
      .filter((p: any) => {
        const valid = p.id !== null && p.id !== undefined && p.id !== '';
        if (!valid) console.warn('[admin/posts GET] Filtering out entry with null id:', p?.title);
        return valid && p.title;
      })
      .map((p: any) => ({
        id: p.id, // Keep original id from database
        title: p.title || '',
        content: p.content || '',
        excerpt: p.excerpt || '',
        image_url: p.featured_image || '',
        author_id: p.author_id,
        is_published: p.status === 'published',
        published_at: p.published_at,
        created_at: p.created_at,
      }));
      
    console.log('[admin/posts GET] Mapped data count:', mapped.length);
    console.log('[admin/posts GET] Returning:', mapped);
    
    return NextResponse.json(mapped);
  } catch (e: any) {
    console.error('[admin/posts GET] Exception:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Check permission
  const authError = await requirePermission('posts:create');
  if (authError) return authError;
  
  try {
    const session = await auth();
    const body = await request.json();
    const title: string = body.title?.trim();
    const content: string = body.content || '';
    const excerpt: string | null = body.excerpt?.trim() || null;
    const image_url: string | null = body.image_url?.trim() || null;
    const is_published: boolean = !!body.is_published;
    if (!title) {
      return NextResponse.json({ error: 'Title required' }, { status: 400 });
    }
    const slug = slugify(title) + '-' + Math.random().toString(36).slice(2, 8);
    const now = new Date().toISOString();
    const status = is_published ? 'published' : 'draft';
    const insertPayload: any = {
      title,
      slug,
      content,
      excerpt,
      featured_image: image_url,
      author_id: session?.user?.id || null,
      status,
      published_at: is_published ? now : null,
      views: 0,
    };
    const { data, error } = await supabaseAdmin
      .from('posts')
      .insert(insertPayload)
      .select()
      .single();
    if (error) {
      console.error('[admin/posts POST] Insert error:', {
        message: error.message,
        code: (error as any).code,
        details: (error as any).details,
        hint: (error as any).hint,
        payload: insertPayload,
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Map response to match frontend expectations
    const mapped = {
      id: String(data.id),
      title: data.title,
      content: data.content || '',
      excerpt: data.excerpt || '',
      image_url: data.featured_image || '',
      author_id: data.author_id,
      is_published: data.status === 'published',
      published_at: data.published_at,
      created_at: data.created_at,
    };
    
    return NextResponse.json({ success: true, data: mapped });
  } catch (e: any) {
    console.error('[admin/posts POST] Exception:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
