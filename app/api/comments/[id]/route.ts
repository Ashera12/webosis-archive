import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[Comments API] DELETE request started for:', params.id);
    
    const session = await auth();
    console.log('[Comments API] Session:', {
      authenticated: !!session?.user,
      userId: session?.user?.id,
      role: session?.user?.role
    });
    
    const commentId = params.id;

    // Get comment to check ownership
    const { data: comment, error: fetchError } = await supabase
      .from('comments')
      .select('*')
      .eq('id', commentId)
      .single();

    if (fetchError || !comment) {
      console.error('[Comments API] Comment not found:', fetchError);
      return NextResponse.json(
        { error: 'Komentar tidak ditemukan', details: fetchError?.message },
        { status: 404 }
      );
    }

    console.log('[Comments API] Comment found:', {
      id: comment.id,
      authorId: comment.author_id,
      userId: comment.user_id,
      isAnonymous: comment.is_anonymous
    });

    // Check if user is authorized to delete
    const userRole = session?.user?.role?.toLowerCase();
    const isPrivileged = ['admin', 'superadmin', 'osis'].includes(userRole || '');
    const isOwner = session?.user?.id && (session.user.id === comment.user_id || session.user.id === comment.author_id);
    const isAnonymousComment = !comment.user_id && !comment.author_id;

    console.log('[Comments API] Permission check:', {
      userRole,
      isPrivileged,
      isOwner,
      isAnonymousComment,
      canDelete: isPrivileged || isOwner || isAnonymousComment
    });

    if (!isPrivileged && !isOwner && !isAnonymousComment) {
      return NextResponse.json(
        { error: 'Tidak memiliki izin untuk menghapus komentar ini' },
        { status: 403 }
      );
    }

    // Service role key bypasses RLS, so this should work
    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) {
      console.error('[Comments API] Delete error:', deleteError);
      return NextResponse.json(
        { error: 'Gagal menghapus komentar', details: deleteError.message },
        { status: 500 }
      );
    }

    console.log('[Comments API] Comment deleted successfully:', commentId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Comments API] DELETE exception:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const commentId = params.id;
    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Konten tidak boleh kosong' },
        { status: 400 }
      );
    }

    // Get comment to check ownership
    const { data: comment, error: fetchError } = await supabase
      .from('comments')
      .select('*')
      .eq('id', commentId)
      .single();

    if (fetchError || !comment) {
      return NextResponse.json(
        { error: 'Komentar tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check if user is the owner
    const isOwner = session?.user?.id && (session.user.id === comment.user_id || session.user.id === comment.author_id);

    if (!isOwner) {
      return NextResponse.json(
        { error: 'Tidak memiliki izin untuk mengedit komentar ini' },
        { status: 403 }
      );
    }

    const { data: updatedComment, error: updateError } = await supabase
      .from('comments')
      .update({ content: content.trim(), updated_at: new Date().toISOString() })
      .eq('id', commentId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating comment:', updateError);
      return NextResponse.json(
        { error: 'Gagal mengupdate komentar' },
        { status: 500 }
      );
    }

    return NextResponse.json({ comment: updatedComment });
  } catch (error) {
    console.error('Error in PATCH /api/comments/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
