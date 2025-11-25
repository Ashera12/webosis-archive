import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content && content !== '') {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('page_content')
      .update({ 
        content_value: content,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating page content:', error);
    return NextResponse.json(
      { error: 'Failed to update page content' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('page_content')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting page content:', error);
    return NextResponse.json(
      { error: 'Failed to delete page content' },
      { status: 500 }
    );
  }
}
