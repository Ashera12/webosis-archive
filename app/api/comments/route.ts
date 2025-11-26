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
        // Get author role from users table
        let authorRole = null;
        if (comment.user_id) {
          const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', comment.user_id)
            .single();
          authorRole = userData?.role || null;
        }

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
          author_role: authorRole,
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

    // Try with user_id first (new schema), fallback if column doesn't exist
    let commentData: any = {
      content_id: contentId,
      content_type: contentType,
      content: content.trim(),
      author_name: displayName,
      author_id: null, // keep null to avoid FK to auth.users
      user_id: !isAnonymous ? session?.user?.id : null,
      is_anonymous: isAnonymous,
      parent_id: parentId || null,
      created_at: new Date().toISOString()
    };

    console.log('[Comments API] Inserting comment (with user_id):', commentData);

    let { data: comment, error } = await supabase
      .from('comments')
      .insert([commentData])
      .select()
      .single();

    // Handle various schema compatibility issues
    if (error) {
      // Case 1: user_id column doesn't exist (old schema)
      if (error.message?.includes('user_id') || error.code === '42703') {
        console.log('[Comments API] Column user_id not found, retrying without it...');
        const { user_id, ...dataWithoutUserId } = commentData;
        
        const retry = await supabase
          .from('comments')
          .insert([dataWithoutUserId])
          .select()
          .single();
        
        comment = retry.data;
        error = retry.error;
      }
      // Case 2: author_id FK constraint (auth.users doesn't exist in our setup)
      // Code 23503 = foreign key violation
      else if (error.code === '23503' && error.message?.includes('author_id')) {
        console.log('[Comments API] FK constraint on author_id, using minimal data...');
        // Retry with only essential fields, let DB defaults handle the rest
        const minimalData: any = {
          content_id: contentId,
          content_type: contentType,
          content: content.trim(),
          author_name: displayName,
          is_anonymous: isAnonymous,
          parent_id: parentId || null
        };
        
        const retry = await supabase
          .from('comments')
          .insert([minimalData])
          .select()
          .single();
        
        comment = retry.data;
        error = retry.error;
      }
    }

    if (error) {
      console.error('[Comments API] Supabase error:', error);
      console.error('[Comments API] Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: 'Gagal menambahkan komentar', details: error.message, code: error.code },
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
