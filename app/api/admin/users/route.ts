import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/apiAuth';
import { createClient } from '@supabase/supabase-js';
export const runtime = 'nodejs';

const ALLOWED_ROLES = new Set(['super_admin','admin','moderator','osis','siswa','guru','other']);

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // If service role missing, try anon fallback (read-only). Avoid hard 500 so admin UI still shows something.
    let client: any = supabaseAdmin;
    let usingFallback = false;
    if (!serviceRole) {
      if (supabaseUrl && anonKey) {
        console.warn('[admin/users GET] Service role missing, using anon fallback');
        client = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
        usingFallback = true;
      } else {
        console.error('[admin/users GET] Missing Supabase env vars (service + anon)');
        return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
      }
    }
    const authErr = await requirePermission('users:read');
    if (authErr) return authErr;

    const { data, error } = await client
      .from('users')
      .select('id, email, name, nickname, unit_sekolah, nik, nisn, requested_role, role, photo_url, approved, rejected, rejection_reason, email_verified, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[admin/users GET] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const users = (data || [])
      .filter((u: any) => u.id && u.email)
      .map((u: any) => ({
        id: u.id,
        email: u.email,
        name: u.name ?? null,
        nickname: u.nickname ?? null,
        unit_sekolah: u.unit_sekolah ?? null,
        nik: u.nik ?? null,
        nisn: u.nisn ?? null,
        requested_role: u.requested_role ?? null,
        role: (u.role || 'osis'),
        is_active: !!u.approved,
        rejected: !!u.rejected,
        rejection_reason: u.rejection_reason ?? null,
        email_verified: !!u.email_verified,
        profile_image: u.photo_url ?? null,
        created_at: u.created_at,
        last_login: null as string | null,
      }));

    console.log(`[admin/users GET] Returning ${users.length} users${usingFallback ? ' (anon fallback)' : ''}`);
    return NextResponse.json({ users, fallback: usingFallback });
  } catch (e: any) {
    console.error('[admin/users GET] Unexpected error', e);
    return NextResponse.json({ error: e.message || 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('[admin/users POST] Missing Supabase env vars');
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }
    const authErr = await requirePermission('users:create');
    if (authErr) return authErr;

    const body = await request.json();
    const { email, name, role, password, is_active, profile_image, reject, rejection_reason } = body;

    if (!email || !name) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 });
    }

    const dbRole = (role && ALLOWED_ROLES.has(role)) ? role : 'osis';

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        name,
        role: dbRole,
        password_hash: null,
        approved: reject ? false : (is_active ?? true),
        rejected: !!reject,
        rejection_reason: reject ? (rejection_reason || 'Ditolak tanpa alasan tertulis') : null,
        photo_url: profile_image ?? null,
      })
      .select('id, email, name, role, photo_url, approved, rejected, rejection_reason, created_at')
      .single();

    if (error) throw error;

    const result = {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      is_active: !!data.approved,
      rejected: !!data.rejected,
      rejection_reason: data.rejection_reason ?? null,
      profile_image: data.photo_url ?? null,
      created_at: data.created_at,
      last_login: null as string | null,
    };

    return NextResponse.json({ success: true, data: result });
  } catch (e: any) {
    console.error('[admin/users POST] Unexpected error', e);
    return NextResponse.json({ error: e.message || 'Failed to create user' }, { status: 500 });
  }
}

// Approve or reject existing user (sets approved=true or rejected=true) - requires users:approve permission
export async function PUT(request: NextRequest) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('[admin/users PUT] Missing Supabase env vars');
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }
    const authErr = await requirePermission('users:approve');
    if (authErr) return authErr;
    const body = await request.json().catch(() => ({}));
    const id = body.id as string | undefined;
    const reject = body.reject as boolean | undefined;
    const rejection_reason = body.rejection_reason as string | undefined;
    const restore = body.restore as boolean | undefined; // restore previously rejected -> pending
    if (!id) {
      return NextResponse.json({ error: 'User id diperlukan' }, { status: 400 });
    }
    // Promote role from requested_role if present when approving
    const { data: rows } = await supabaseAdmin.from('users').select('id, role, requested_role').eq('id', id).limit(1);
    let newRole: string | undefined;
    if (rows && rows[0]) {
      const r = rows[0] as any;
      if (r.role === 'pending' && r.requested_role) {
        newRole = r.requested_role;
      }
    }
    const updateObj: any = {};
    if (restore) {
      // Move rejected user back to pending (approved=false, rejected=false)
      updateObj.rejected = false;
      updateObj.rejection_reason = null;
      updateObj.approved = false;
    } else if (reject) {
      updateObj.rejected = true;
      updateObj.rejection_reason = rejection_reason || 'Ditolak';
      updateObj.approved = false;
    } else {
      updateObj.approved = true;
      updateObj.rejected = false;
      updateObj.rejection_reason = null;
    }
    if (newRole) updateObj.role = newRole;
    
    console.log('[admin/users PUT approve] Updating user:', { id, updateObj });
    
    // Update user approval status without restrictive conditions
    // This ensures approval works even if user was previously approved/rejected
    const { data: updatedUser, error: updErr } = await supabaseAdmin
      .from('users')
      .update(updateObj)
      .eq('id', id)
      .select('id, email, approved, rejected, role')
      .single();
    
    if (updErr) {
      console.error('[admin/users PUT approve] Error:', updErr);
      return NextResponse.json({ error: 'Gagal menyetujui user' }, { status: 500 });
    }
    
    console.log('[admin/users PUT approve] SUCCESS:', updatedUser);
    
    return NextResponse.json({ 
      ok: true, 
      restored: !!restore, 
      rejected: !!reject, 
      approved: !restore && !reject,
      user: updatedUser 
    });
  } catch (e: any) {
    console.error('[admin/users PUT] Unexpected error', e);
    return NextResponse.json({ error: e.message || 'Failed to approve user' }, { status: 500 });
  }
}
