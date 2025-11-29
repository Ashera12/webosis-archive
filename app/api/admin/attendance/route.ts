// app/api/admin/attendance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user.role || '').toLowerCase();
    
    // Hanya admin, super_admin, osis yang bisa akses
    if (!['super_admin', 'admin', 'osis'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const role = searchParams.get('role'); // filter by siswa/guru
    const status = searchParams.get('status'); // filter by status
    const date = searchParams.get('date'); // filter by date (YYYY-MM-DD)
    const userId = searchParams.get('userId'); // filter by specific user

    let query = supabaseAdmin
      .from('attendance')
      .select('*', { count: 'exact' })
      .order('check_in_time', { ascending: false });

    if (role) {
      query = query.eq('user_role', role);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      query = query
        .gte('check_in_time', startDate.toISOString())
        .lte('check_in_time', endDate.toISOString());
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Admin attendance error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal ambil data absensi' },
      { status: 500 }
    );
  }
}

// Update status attendance (untuk admin)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user.role || '').toLowerCase();
    
    if (!['super_admin', 'admin', 'osis'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { attendanceId, status, notes, isVerified } = body;

    if (!attendanceId) {
      return NextResponse.json({ error: 'Attendance ID diperlukan' }, { status: 400 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (isVerified !== undefined) {
      updateData.is_verified = isVerified;
      if (isVerified) {
        updateData.verified_at = new Date().toISOString();
        updateData.verified_by = session.user.id;
      }
    }

    const { data, error } = await supabaseAdmin
      .from('attendance')
      .update(updateData)
      .eq('id', attendanceId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Data absensi berhasil diperbarui',
      data,
    });
  } catch (error: any) {
    console.error('Update attendance error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal update absensi' },
      { status: 500 }
    );
  }
}

// Delete attendance (hanya super_admin)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user.role || '').toLowerCase();
    
    if (userRole !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden - Super Admin only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const attendanceId = searchParams.get('id');

    if (!attendanceId) {
      return NextResponse.json({ error: 'Attendance ID diperlukan' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('attendance')
      .delete()
      .eq('id', attendanceId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Data absensi berhasil dihapus',
    });
  } catch (error: any) {
    console.error('Delete attendance error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal hapus absensi' },
      { status: 500 }
    );
  }
}
