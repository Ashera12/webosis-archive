import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const commentId = params.id;

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

    // Check if user is authorized to delete
    const isAdmin = session?.user?.role === 'admin';
    const isOwner = session?.user?.id === comment.author_id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Tidak memiliki izin untuk menghapus komentar ini' },
        { status: 403 }
      );
    }

    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) {
      console.error('Error deleting comment:', deleteError);
      return NextResponse.json(
        { error: 'Gagal menghapus komentar' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/comments/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
