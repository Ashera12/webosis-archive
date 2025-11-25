import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { data: sekbid, error } = await supabaseAdmin
      .from('sekbid')
      .select('*')
      .order('id', { ascending: true })
      .limit(6); // Only return sekbid 1-6

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ sekbid: sekbid || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
