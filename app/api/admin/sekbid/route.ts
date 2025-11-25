import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requirePermission } from '@/lib/apiAuth';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const authErr = await requirePermission('sekbid:read');
    if (authErr) return authErr;

    const { data: sekbid, error } = await supabaseAdmin
      .from('sekbid')
      .select('*')
      .lte('id', 6) // Only sekbid 1-6
      .order('id', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(sekbid || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
