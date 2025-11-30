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
    const { referencePhotoUrl, fingerprintTemplate, webauthnCredentialId } = body;

    if (!referencePhotoUrl || !fingerprintTemplate) {
      return NextResponse.json(
        { error: 'Photo dan fingerprint diperlukan' },
        { status: 400 }
      );
    }
    
    // webauthnCredentialId is OPTIONAL (null = AI-only mode)
    console.log('[Biometric Setup] Mode:', webauthnCredentialId ? 'WebAuthn + AI' : 'AI-only');

    // SECURITY: Verify photo URL belongs to this user (prevent photo swap)
    console.log('[Biometric Setup] Validating photo ownership for user:', userId);
    
    if (!referencePhotoUrl.includes(userId)) {
      console.error('[Biometric Setup] ❌ Photo URL does not belong to user:', {
        userId,
        photoUrl: referencePhotoUrl.substring(0, 100)
      });
      return NextResponse.json(
        { error: 'Invalid photo: Photo does not belong to your account' },
        { status: 403 }
      );
    }

    // SECURITY: Check if photo is already used by another user
    const { data: photoCheck } = await supabaseAdmin
      .from('user_biometric')
      .select('user_id')
      .eq('reference_photo_url', referencePhotoUrl)
      .neq('user_id', userId)
      .single();

    if (photoCheck) {
      console.error('[Biometric Setup] ❌ Photo already used by another user:', {
        currentUser: userId,
        existingUser: photoCheck.user_id
      });
      return NextResponse.json(
        { error: 'Invalid photo: This photo is already registered to another account' },
        { status: 403 }
      );
    }

    console.log('[Biometric Setup] ✅ Photo ownership verified for user:', userId);

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
          webauthn_credential_id: webauthnCredentialId,
          last_updated: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      // Log activity untuk dashboard user (UPDATE)
      await supabaseAdmin.from('user_activities').insert({
        user_id: userId,
        activity_type: 'biometric_update',
        description: 'Updated biometric registration (photo + fingerprint)',
        metadata: {
          photoUrl: referencePhotoUrl.substring(0, 100) + '...',
          fingerprintHash: fingerprintTemplate.substring(0, 16) + '...',
          hasWebAuthn: !!webauthnCredentialId,
          timestamp: new Date().toISOString()
        }
      });

      console.log('[Biometric Setup] ✅ Biometric data updated + activity logged');

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
          webauthn_credential_id: webauthnCredentialId,
        })
        .select()
        .single();

      if (error) throw error;

      // Log activity untuk dashboard user (NEW REGISTRATION)
      await supabaseAdmin.from('user_activities').insert({
        user_id: userId,
        activity_type: 'biometric_registration',
        description: 'Registered biometric authentication (photo + fingerprint)',
        metadata: {
          photoUrl: referencePhotoUrl.substring(0, 100) + '...',
          fingerprintHash: fingerprintTemplate.substring(0, 16) + '...',
          hasWebAuthn: !!webauthnCredentialId,
          registeredAt: new Date().toISOString()
        }
      });

      console.log('[Biometric Setup] ✅ Biometric data registered + activity logged');

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
