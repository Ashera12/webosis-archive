import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');
    const contentType = searchParams.get('contentType');

    if (!contentId || !contentType) {
      return NextResponse.json(
        { error: 'contentId dan contentType diperlukan' },
        { status: 400 }
      );
    }

    const { data: comments, error } = await supabase
      .from('comments')
      .select('*')
      .eq('content_id', contentId)
      .eq('content_type', contentType)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json(
        { error: 'Gagal mengambil komentar' },
        { status: 500 }
      );
    }

    return NextResponse.json({ comments: comments || [] });
  } catch (error) {
    console.error('Error in GET /api/comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    const { contentId, contentType, content, authorName } = body;

    if (!contentId || !contentType || !content) {
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
      created_at: new Date().toISOString()
    };

    const { data: comment, error } = await supabase
      .from('comments')
      .insert([commentData])
      .select()
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      return NextResponse.json(
        { error: 'Gagal menambahkan komentar' },
        { status: 500 }
      );
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
