import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/apiAuth';
export const runtime = 'nodejs';

const ALLOWED_ROLES = new Set(['super_admin','admin','moderator','osis','siswa','guru','other']);

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authErr = await requirePermission('users:edit');
    if (authErr) return authErr;

    const { id } = await params;
    const body = await request.json();
    const { name, role, is_active, profile_image, password } = body;

    const update: any = {};
    if (name !== undefined) update.name = name;
    if (role !== undefined) update.role = ALLOWED_ROLES.has(role) ? role : undefined;
    if (is_active !== undefined) {
      update.approved = !!is_active;
      // Clear rejection when approving AND ensure email is verified
      if (is_active) {
        update.rejected = false;
        update.rejection_reason = null;
        update.email_verified = true; // Ensure verified when approving
      }
    }
    if (profile_image !== undefined) update.photo_url = profile_image ?? null;
    
    // Hash new password if provided
    if (password && password.trim()) {
      const bcrypt = (await import('bcryptjs')).default;
      const hash = await bcrypt.hash(password, 10);
      update.password_hash = hash;
      console.log('[admin/users/[id] PUT] Password hashed successfully');
    }

    console.log('[admin/users/[id] PUT] Updating user:', { id, update, is_active });

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(update)
      .eq('id', id)
      .select('id, email, name, role, photo_url, approved, email_verified, created_at')
      .single();

    if (error) {
      console.error('[admin/users/[id] PUT] Error:', error);
      throw error;
    }
    
    console.log('[admin/users/[id] PUT] SUCCESS - approved value:', data.approved, 'is_active will be:', !!data.approved);

    const result = {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      is_active: !!data.approved,
      profile_image: data.photo_url ?? null,
      created_at: data.created_at,
      last_login: null as string | null,
      email_verified: !!data.email_verified,
    };

    return NextResponse.json({ success: true, data: result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authErr = await requirePermission('users:delete');
    if (authErr) return authErr;

    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'User deleted' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to delete user' }, { status: 500 });
  }
}
