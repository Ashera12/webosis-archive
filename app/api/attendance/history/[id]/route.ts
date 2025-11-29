// app/api/attendance/history/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { logActivity } from '@/lib/activity-logger';

// PUT /api/attendance/history/[id] - Edit attendance record (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin/super_admin/osis can edit
    const userRole = (session.user.role || '').toLowerCase();
    if (!['super_admin', 'admin', 'osis'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden - Only admin can edit attendance' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { check_in_time, check_out_time, status, notes } = body;

    // Get original record for audit trail
    const { data: originalRecord } = await supabaseAdmin
      .from('attendance')
      .select('*')
      .eq('id', params.id)
      .single();

    if (!originalRecord) {
      return NextResponse.json(
        { error: 'Attendance record not found' },
        { status: 404 }
      );
    }

    // Build update object (only include provided fields)
    const updateData: any = {};
    if (check_in_time) updateData.check_in_time = check_in_time;
    if (check_out_time) updateData.check_out_time = check_out_time;
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    // Update attendance record
    const { data: updatedRecord, error } = await supabaseAdmin
      .from('attendance')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Update attendance error:', error);
      throw error;
    }

    // Log edit action to activity_logs for audit trail
    await logActivity({
      userId: session.user.id,
      userName: session.user.name || session.user.email,
      userEmail: session.user.email,
      userRole: userRole,
      activityType: 'admin_action',
      action: 'Edit Attendance Record',
      description: `Admin edited attendance record ID ${params.id}`,
      metadata: {
        attendanceId: params.id,
        changes: updateData,
        originalData: originalRecord,
        updatedData: updatedRecord,
        editedBy: session.user.email,
        editedAt: new Date().toISOString(),
      },
      relatedId: params.id,
      relatedType: 'attendance',
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      data: updatedRecord,
      message: 'Attendance record updated successfully',
    });
  } catch (error: any) {
    console.error('Edit attendance error:', error);
    
    // Log failed edit attempt
    try {
      const session = await auth();
      if (session?.user) {
        await logActivity({
          userId: session.user.id,
          userName: session.user.name || session.user.email,
          userEmail: session.user.email,
          userRole: (session.user.role || '').toLowerCase(),
          activityType: 'admin_action',
          action: 'Edit Attendance Record Failed',
          description: `Failed to edit attendance record ID ${params.id}`,
          metadata: {
            attendanceId: params.id,
            error: error.message,
          },
          status: 'error',
          errorMessage: error.message,
        });
      }
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Gagal edit attendance record' 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/attendance/history/[id] - Delete attendance record (Super Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super_admin can delete
    const userRole = (session.user.role || '').toLowerCase();
    if (!['super_admin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden - Only super admin can delete attendance' },
        { status: 403 }
      );
    }

    // Get record before deleting (for audit log)
    const { data: recordToDelete } = await supabaseAdmin
      .from('attendance')
      .select('*')
      .eq('id', params.id)
      .single();

    if (!recordToDelete) {
      return NextResponse.json(
        { error: 'Attendance record not found' },
        { status: 404 }
      );
    }

    // Delete the record
    const { error } = await supabaseAdmin
      .from('attendance')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Delete attendance error:', error);
      throw error;
    }

    // Log deletion to activity_logs for audit trail
    await logActivity({
      userId: session.user.id,
      userName: session.user.name || session.user.email,
      userEmail: session.user.email,
      userRole: userRole,
      activityType: 'admin_action',
      action: 'Delete Attendance Record',
      description: `Super Admin deleted attendance record ID ${params.id}`,
      metadata: {
        attendanceId: params.id,
        deletedRecord: recordToDelete,
        deletedBy: session.user.email,
        deletedAt: new Date().toISOString(),
        reason: 'Manual deletion by super admin',
      },
      relatedId: params.id,
      relatedType: 'attendance',
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      message: 'Attendance record deleted successfully',
      deletedRecord: recordToDelete,
    });
  } catch (error: any) {
    console.error('Delete attendance error:', error);
    
    // Log failed deletion attempt
    try {
      const session = await auth();
      if (session?.user) {
        await logActivity({
          userId: session.user.id,
          userName: session.user.name || session.user.email,
          userEmail: session.user.email,
          userRole: (session.user.role || '').toLowerCase(),
          activityType: 'admin_action',
          action: 'Delete Attendance Record Failed',
          description: `Failed to delete attendance record ID ${params.id}`,
          metadata: {
            attendanceId: params.id,
            error: error.message,
          },
          status: 'error',
          errorMessage: error.message,
        });
      }
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Gagal delete attendance record' 
      },
      { status: 500 }
    );
  }
}
