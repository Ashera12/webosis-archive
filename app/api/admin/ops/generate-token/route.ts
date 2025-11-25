import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import crypto from 'crypto';
import { setAdminSetting } from '@/lib/adminSettings';

/**
 * POST /api/admin/ops/generate-token
 * Generate a secure admin ops token
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate a secure random token (32 bytes = 256 bits)
    const token = crypto.randomBytes(32).toString('hex');

    // Save to database
    await setAdminSetting('ADMIN_OPS_TOKEN', token);
    
    // Also enable ALLOW_ADMIN_OPS by default
    await setAdminSetting('ALLOW_ADMIN_OPS', 'true');

    console.log('[Generate Token] Admin ops token generated successfully');

    return NextResponse.json({
      success: true,
      token,
      message: 'Token berhasil digenerate dan disimpan. ALLOW_ADMIN_OPS otomatis diaktifkan.',
      warning: 'Simpan token ini dengan aman! Token tidak akan ditampilkan lagi setelah halaman ini ditutup.'
    });
  } catch (error: any) {
    console.error('[Generate Token] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate token', details: error.message },
      { status: 500 }
    );
  }
}
