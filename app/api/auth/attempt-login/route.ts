import { NextRequest, NextResponse } from 'next/server';
import { logActivity, getIpAddress, parseUserAgent } from '@/lib/activity-logger';

// POST /api/auth/attempt-login { email, password }
// Validates credentials and returns detailed error message without creating session
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    let { email, password } = body as { email?: string; password?: string };
    
    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email dan password harus diisi' 
      }, { status: 400 });
    }
    
    email = email.trim().toLowerCase();
    
    // Import auth logic
    const bcrypt = (await import('bcryptjs')).default;
    const { supabaseAdmin } = await import('@/lib/supabase/server');
    
    // Find user
    const { data: user, error: userErr } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role, password_hash, email_verified, approved')
      .ilike('email', email)
      .maybeSingle();
    
    if (userErr || !user) {
      return NextResponse.json({
        success: false,
        error: `Email "${email}" tidak terdaftar. Silakan registrasi terlebih dahulu.`,
        code: 'USER_NOT_FOUND'
      });
    }
    
    if (!user.password_hash) {
      return NextResponse.json({
        success: false,
        error: 'Akun Anda belum memiliki password. Silakan hubungi admin.',
        code: 'NO_PASSWORD'
      });
    }
    
    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    
    if (!valid) {
      // Log failed login attempt
      await logActivity({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userRole: user.role,
        activityType: 'login',
        action: 'Login attempt failed - Invalid password',
        description: `Failed login attempt for ${email}`,
        metadata: { email, reason: 'invalid_password' },
        ipAddress: getIpAddress(req),
        userAgent: req.headers.get('user-agent') || undefined,
        deviceInfo: parseUserAgent(req.headers.get('user-agent') || ''),
        status: 'failure',
      });
      
      return NextResponse.json({
        success: false,
        error: 'Password salah. Silakan periksa kembali password Anda.',
        code: 'INVALID_PASSWORD'
      });
    }
    
    // Check email verification
    if (!user.email_verified) {
      return NextResponse.json({
        success: false,
        error: 'Email belum diverifikasi. Silakan cek inbox/spam Anda.',
        code: 'UNVERIFIED_EMAIL',
        email: user.email
      });
    }
    
    // Check approval
    if (!user.approved) {
      console.log('[attempt-login] User NOT approved:', { 
        user_id: user.id, 
        email: user.email, 
        approved: user.approved,
        email_verified: user.email_verified 
      });
      return NextResponse.json({
        success: false,
        error: 'Akun sudah diverifikasi tetapi menunggu persetujuan admin.',
        code: 'NOT_APPROVED'
      });
    }
    
    console.log('[attempt-login] SUCCESS - User approved:', { 
      user_id: user.id, 
      email: user.email, 
      approved: user.approved 
    });
    
    // Log successful login validation
    await logActivity({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      activityType: 'login',
      action: 'Login credentials validated',
      description: `User ${email} successfully validated credentials`,
      metadata: { email, method: 'credentials' },
      ipAddress: getIpAddress(req),
      userAgent: req.headers.get('user-agent') || undefined,
      deviceInfo: parseUserAgent(req.headers.get('user-agent') || ''),
      status: 'success',
    });
    
    // All checks passed
    return NextResponse.json({
      success: true,
      message: 'Kredensial valid. Silakan lanjutkan login.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
    
  } catch (e: any) {
    console.error('[attempt-login] exception', e?.message || e);
    return NextResponse.json({ 
      success: false,
      error: 'Terjadi kesalahan server.' 
    }, { status: 500 });
  }
}
