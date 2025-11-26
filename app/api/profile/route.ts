import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
export const runtime = 'nodejs';

// Create Supabase admin client (bypasses RLS)
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  // Try service role key first, fallback to anon key
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

// GET /api/profile - Get current user's profile
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, nickname, nisn, nik, unit_sekolah, instagram_username, requested_role, role, photo_url, approved, email_verified, created_at, updated_at')
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
      nik: data.nik,
      instagram_username: data.instagram_username,
      role: data.role,
      is_active: !!data.approved,
      profile_image: data.photo_url ?? null,
      created_at: data.created_at,
      email_verified: !!data.email_verified,
    };

    console.log('[profile GET] User ID:', session.user.id);
    console.log('[profile GET] Role from database:', data.role);
    console.log('[profile GET] Role from session:', session.user.role);
    console.log('[profile GET] Full result:', result);

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
    const { name, profile_image, password, username, nisn, nik, unit, kelas, instagram_username } = body;

    const update: any = {};
    if (name !== undefined) update.name = name;
    if (username !== undefined) update.nickname = username;
    // NISN: set to null if empty string to avoid constraint violation
    if (nisn !== undefined) update.nisn = nisn.trim() === '' ? null : nisn;
    // NIK: set to null if empty string to avoid constraint violation
    if (nik !== undefined) update.nik = nik.trim() === '' ? null : nik;
    if (unit !== undefined) update.unit_sekolah = unit;
    if (kelas !== undefined) update.kelas = kelas;
    if (instagram_username !== undefined) {
      // Remove @ symbol and set to null if empty
      const cleaned = instagram_username.trim().replace('@', '');
      update.instagram_username = cleaned === '' ? null : cleaned;
    }
    if (profile_image !== undefined) update.photo_url = profile_image ?? null;
    
    // Hash new password if provided
    if (password && password.trim()) {
      const bcrypt = (await import('bcryptjs')).default;
      const hash = await bcrypt.hash(password, 10);
      update.password_hash = hash;
      console.log('[profile PUT] Password updated for user:', session.user.id);
    }

    console.log('[profile PUT] Updating profile:', { id: session.user.id, update });

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('users')
      .update(update)
      .eq('id', session.user.id)
      .select('id, email, name, nickname, nisn, nik, unit_sekolah, instagram_username, role, photo_url, approved, email_verified, created_at')
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
      nik: data.nik,
      unit: data.unit_sekolah,
      kelas: '', // Column doesn't exist in database
      instagram_username: data.instagram_username,
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
