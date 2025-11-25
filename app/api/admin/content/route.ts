import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// API endpoint for managing page content
export async function GET(request: NextRequest) {
  try {
    console.log('[/api/admin/content] Fetching page content...');
    
    const { data, error } = await supabaseAdmin
      .from('page_content')
      .select('*')
      .order('category', { ascending: true })
      .order('page_key', { ascending: true });

    if (error) {
      console.error('[/api/admin/content] Supabase error:', error);
      throw error;
    }

    console.log('[/api/admin/content] Fetched items:', data?.length || 0);

    // Transform data to match frontend expectations
    const formattedData = data?.map((item: any) => ({
      id: item.id,
      key: item.page_key,
      title: item.page_key.split('_').map((word: string) => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' '),
      content: item.content_value || '',
      category: item.category || '',
      content_type: item.content_type || 'text',
      updated_at: item.updated_at || item.created_at
    })) || [];

    return NextResponse.json(formattedData);
  } catch (error: any) {
    console.error('[/api/admin/content] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch page content', details: error },
      { status: 500 }
    );
  }
}
