import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { convertToSignedUrl } from '@/lib/signedUrls';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const featured = searchParams.get('featured');
    const limit = searchParams.get('limit') || '10';

    let query = supabaseAdmin
      .from('posts')
      .select(`
        *,
        author:users!author_id (
          id,
          name,
          photo_url
        )
      `)
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

    // Convert media URLs to signed URLs
    const postsWithSignedUrls = await Promise.all(
      (data || []).map(async (post: any) => {
        const updatedPost = { ...post };
        
        // Convert featured_image if present
        if (post.featured_image) {
          const signedUrl = await convertToSignedUrl(post.featured_image);
          if (signedUrl) {
            updatedPost.featured_image = signedUrl.url;
            updatedPost.featured_image_expires_at = signedUrl.expiresAt;
          }
        }
        
        // Convert author photo_url if present
        if (post.author?.photo_url) {
          const signedUrl = await convertToSignedUrl(post.author.photo_url);
          if (signedUrl) {
            updatedPost.author = {
              ...post.author,
              photo_url: signedUrl.url,
              photo_url_expires_at: signedUrl.expiresAt
            };
          }
        }
        
        return updatedPost;
      })
    );

    return NextResponse.json({ posts: postsWithSignedUrls });
  } catch (error) {
    console.error('Error in posts API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
