import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { logActivity, getIpAddress, parseUserAgent } from '@/lib/activity-logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: commentId } = await params;
    const session = await auth();
    const userId = session?.user?.id || 'anonymous';

    // Check if user already liked
    const { data: existingLike } = await supabase
      .from('comment_likes')
      .select('*')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .single();

    let liked = false;
    let likes = 0;

    if (existingLike) {
      // Unlike
      await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', userId);
      liked = false;
    } else {
      // Like
      await supabase
        .from('comment_likes')
        .insert([{ comment_id: commentId, user_id: userId }]);
      liked = true;
    }

    // Get updated like count
    const { count } = await supabase
      .from('comment_likes')
      .select('*', { count: 'exact', head: true })
      .eq('comment_id', commentId);

    likes = count || 0;

    // Log like/unlike activity (only for authenticated users)
    if (userId !== 'anonymous') {
      await logActivity({
        userId,
        userName: session?.user?.name,
        userEmail: session?.user?.email,
        userRole: (session?.user as any)?.role,
        activityType: liked ? 'post_like' : 'post_unlike',
        action: liked ? 'Comment liked' : 'Comment unliked',
        description: `User ${liked ? 'liked' : 'unliked'} comment ${commentId}`,
        metadata: {
          comment_id: commentId,
          action: liked ? 'like' : 'unlike',
          total_likes: likes,
        },
        ipAddress: getIpAddress(request),
        userAgent: request.headers.get('user-agent') || undefined,
        deviceInfo: parseUserAgent(request.headers.get('user-agent') || ''),
        relatedId: commentId,
        relatedType: 'comment_like',
        status: 'success',
      });
    }

    return NextResponse.json({ liked, likes });
  } catch (error) {
    console.error('Error in POST /api/comments/[id]/like:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
