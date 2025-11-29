// app/api/attendance/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '30');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { data, error, count } = await supabaseAdmin
      .from('attendance')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('check_in_time', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Attendance history error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal ambil riwayat absensi' },
      { status: 500 }
    );
  }
}
