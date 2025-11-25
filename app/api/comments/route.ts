import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(request: NextRequest) {
  try {
    console.log('[Comments API] GET request started');
    
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');
    const contentType = searchParams.get('contentType');

    console.log('[Comments API] Params:', { contentId, contentType });

    if (!contentId || !contentType) {
      return NextResponse.json(
        { error: 'contentId dan contentType diperlukan' },
        { status: 400 }
      );
    }

    // Fetch comments
    const { data: comments, error } = await supabase
      .from('comments')
      .select('*')
      .eq('content_id', contentId)
      .eq('content_type', contentType)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Comments API] Supabase error:', error);
      return NextResponse.json(
        { error: 'Gagal mengambil komentar', details: error.message },
        { status: 500 }
      );
    }

    console.log('[Comments API] Found', comments?.length || 0, 'comments');

    // Get session to check user likes
    const session = await auth();
    const userId = session?.user?.id || 'anonymous';

    // Fetch like counts and user's likes for each comment
    const commentsWithLikes = await Promise.all(
      (comments || []).map(async (comment) => {
        // Get like count
        const { count } = await supabase
          .from('comment_likes')
          .select('*', { count: 'exact', head: true })
          .eq('comment_id', comment.id);

        // Check if user liked
        const { data: userLike } = await supabase
          .from('comment_likes')
          .select('*')
          .eq('comment_id', comment.id)
          .eq('user_id', userId)
          .single();

        return {
          ...comment,
          likes: count || 0,
          liked_by_user: !!userLike
        };
      })
    );

    return NextResponse.json({ comments: commentsWithLikes });
  } catch (error) {
    console.error('[Comments API] Exception:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Comments API] POST request started');
    
    const session = await auth();
    console.log('[Comments API] Session:', session?.user?.id ? 'Authenticated' : 'Anonymous');
    
    const body = await request.json();
    console.log('[Comments API] Request body:', body);
    
    const { contentId, contentType, content, authorName, parentId } = body;

    if (!contentId || !contentType || !content) {
      console.error('[Comments API] Missing required fields:', { contentId, contentType, content });
      return NextResponse.json(
        { error: 'Data tidak lengkap' },
        { status: 400 }
      );
    }

    const isAnonymous = !session?.user?.id;
    const displayName = isAnonymous ? 'Anonymous' : (authorName || session.user.name || 'User');

    const commentData = {
      content_id: contentId,
      content_type: contentType,
      content: content.trim(),
      author_name: displayName,
      author_id: session?.user?.id || null,
      is_anonymous: isAnonymous,
      parent_id: parentId || null,
      created_at: new Date().toISOString()
    };

    console.log('[Comments API] Inserting comment:', commentData);

    const { data: comment, error } = await supabase
      .from('comments')
      .insert([commentData])
      .select()
      .single();

    if (error) {
      console.error('[Comments API] Supabase error:', error);
      return NextResponse.json(
        { error: 'Gagal menambahkan komentar', details: error.message },
        { status: 500 }
      );
    }

    console.log('[Comments API] Comment created successfully:', comment?.id);

    // Add default likes count
    const commentWithLikes = {
      ...comment,
      likes: 0,
      liked_by_user: false
    };

    return NextResponse.json({ comment: commentWithLikes }, { status: 201 });
  } catch (error) {
    console.error('[Comments API] Exception:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
