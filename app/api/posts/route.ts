import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const featured = searchParams.get('featured');
    const limit = searchParams.get('limit') || '10';

    let query = supabaseAdmin
      .from('posts')
      .select('*')
      .eq('status', 'published')
      // Supabase JS order options do not support nullsLast in this version; removed for type safety
      .order('published_at', { ascending: false });

    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    query = query.limit(parseInt(limit));

    const { data, error } = await query;

    if (error) {
      // Gracefully handle missing table/columns so UI doesn't crash
      const code = (error as any).code || '';
      const message = (error as any).message || '';
      if (code === 'PGRST205' || message.includes('schema cache') || message.includes('Could not find the table')) {
        console.warn('[public/posts] Table/columns missing, returning empty list');
        return NextResponse.json({ posts: [] });
      }
      console.error('Error fetching posts:', error);
      return NextResponse.json({ error: message || 'Failed to fetch posts' }, { status: 500 });
    }

    return NextResponse.json({ posts: data || [] });
  } catch (error) {
    console.error('Error in posts API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
