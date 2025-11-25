import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sekbidId = searchParams.get('sekbid_id');
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('program_kerja')
      .select(`
        *,
        sekbid:sekbid_id (
          id,
          name,
          description,
          color,
          icon
        )
      `)
      .order('start_date', { ascending: false });

    // Filter by sekbid if provided
    if (sekbidId) {
      query = query.eq('sekbid_id', parseInt(sekbidId));
    }

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching program kerja:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ proker: data || [] });
  } catch (error: any) {
    console.error('Error in GET /api/proker:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
