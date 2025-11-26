import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';
export const runtime = 'nodejs';

// GET /api/profile - Get current user's profile
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, nickname, nisn, unit_sekolah, kelas, role, photo_url, approved, email_verified, created_at')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('[profile GET] Supabase error:', error);
      throw error;
    }
    if (!data) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const result = {
      id: data.id,
      email: data.email,
      name: data.name,
      username: data.nickname,
      nisn: data.nisn,
      unit: data.unit_sekolah,
      kelas: data.kelas,
      role: data.role,
      is_active: !!data.approved,
      profile_image: data.photo_url ?? null,
      created_at: data.created_at,
      email_verified: !!data.email_verified,
    };

    return NextResponse.json({ success: true, data: result });
  } catch (e: any) {
    console.error('[profile GET] Exception:', e);
    return NextResponse.json({ error: e.message || 'Failed to fetch profile', details: e.toString() }, { status: 500 });
  }
}

// PUT /api/profile - Update current user's profile
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, profile_image, password, username, nisn, unit, kelas } = body;

    const update: any = {};
    if (name !== undefined) update.name = name;
    if (username !== undefined) update.nickname = username;
    if (nisn !== undefined) update.nisn = nisn;
    if (unit !== undefined) update.unit_sekolah = unit;
    if (kelas !== undefined) update.kelas = kelas;
    if (profile_image !== undefined) update.photo_url = profile_image ?? null;
    
    // Hash new password if provided
    if (password && password.trim()) {
      const bcrypt = (await import('bcryptjs')).default;
      const hash = await bcrypt.hash(password, 10);
      update.password_hash = hash;
      console.log('[profile PUT] Password updated for user:', session.user.id);
    }

    console.log('[profile PUT] Updating profile:', { id: session.user.id, update });

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(update)
      .eq('id', session.user.id)
      .select('id, email, name, nickname, nisn, unit_sekolah, kelas, role, photo_url, approved, email_verified, created_at')
      .single();

    if (error) {
      console.error('[profile PUT] Error:', error);
      throw error;
    }

    const result = {
      id: data.id,
      email: data.email,
      name: data.name,
      username: data.nickname,
      nisn: data.nisn,
      unit: data.unit_sekolah,
      kelas: data.kelas,
      role: data.role,
      is_active: !!data.approved,
      profile_image: data.photo_url ?? null,
      created_at: data.created_at,
      email_verified: !!data.email_verified,
    };

    return NextResponse.json({ success: true, data: result });
  } catch (e: any) {
    console.error('[profile PUT] Exception:', e);
    return NextResponse.json({ error: e.message || 'Failed to update profile', details: e.toString() }, { status: 500 });
  }
}
