// app/api/attendance/biometric/setup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = (session.user.role || '').toLowerCase();

    // Hanya siswa dan guru yang bisa setup biometric
    if (!['siswa', 'guru'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Hanya siswa dan guru yang dapat setup biometric' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { referencePhotoUrl, fingerprintTemplate } = body;

    if (!referencePhotoUrl || !fingerprintTemplate) {
      return NextResponse.json(
        { error: 'Photo dan fingerprint diperlukan' },
        { status: 400 }
      );
    }

    // Cek apakah sudah ada data biometric
    const { data: existing } = await supabaseAdmin
      .from('user_biometric')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Update data yang sudah ada
      const { data, error } = await supabaseAdmin
        .from('user_biometric')
        .update({
          reference_photo_url: referencePhotoUrl,
          fingerprint_template: fingerprintTemplate,
          last_updated: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: 'Data biometric berhasil diperbarui',
        data,
      });
    } else {
      // Insert data baru
      const { data, error } = await supabaseAdmin
        .from('user_biometric')
        .insert({
          user_id: userId,
          reference_photo_url: referencePhotoUrl,
          fingerprint_template: fingerprintTemplate,
        })
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: 'Data biometric berhasil didaftarkan',
        data,
      });
    }
  } catch (error: any) {
    console.error('Biometric setup error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal setup biometric' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const { data, error } = await supabaseAdmin
      .from('user_biometric')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return NextResponse.json({
      success: true,
      hasSetup: !!data,
      data: data || null,
    });
  } catch (error: any) {
    console.error('Biometric check error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal cek biometric' },
      { status: 500 }
    );
  }
}
