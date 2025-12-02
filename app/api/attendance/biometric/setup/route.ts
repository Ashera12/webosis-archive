// app/api/attendance/biometric/setup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { checkRateLimit, RateLimitPresets } from '@/lib/rateLimitRedis';
import { BiometricSetupSchema } from '@/lib/validation';
import { convertToSignedUrl } from '@/lib/signedUrls';

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

    // ✅ RATE LIMITING: 3 setup attempts per day per user (prevent abuse)
    const rateLimitCheck = await checkRateLimit(request, userId, RateLimitPresets.BIOMETRIC_SETUP, 'biometric');
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Terlalu banyak percobaan setup. Silakan coba lagi besok.',
          retryAfter: Math.ceil(rateLimitCheck.resetIn / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil(rateLimitCheck.resetIn / 1000).toString()
          }
        }
      );
    }

    const bodyRaw = await request.json();

    // ✅ INPUT VALIDATION
    const validation = BiometricSetupSchema.safeParse(bodyRaw);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Data tidak valid',
          details: validation.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const { 
      referencePhotoUrl, 
      fingerprintTemplate, 
      webauthnCredentialId,
      biometricType,
      deviceInfo
    } = validation.data;
    
    // webauthnCredentialId is OPTIONAL (null = AI-only mode)
    console.log('[Biometric Setup] Mode:', webauthnCredentialId ? 'WebAuthn + AI' : 'AI-only');
    console.log('[Biometric Setup] Biometric Type:', biometricType);
    console.log('[Biometric Setup] Device Info:', deviceInfo);

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
      .from('biometric_data')
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
      .from('biometric_data')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Update data yang sudah ada
      console.log('[Biometric Setup] 📝 Updating existing biometric data...');
      
      // Prepare update data - only include new columns if they exist in schema
      const updateData: any = {
        reference_photo_url: referencePhotoUrl,
        fingerprint_template: fingerprintTemplate,
        webauthn_credential_id: webauthnCredentialId,
        updated_at: new Date().toISOString(),
      };
      
      // Try to add new columns (biometric_type, device_info) - will be ignored if columns don't exist yet
      try {
        updateData.biometric_type = biometricType || 'fingerprint';
        updateData.device_info = deviceInfo || {};
      } catch (schemaError) {
        console.warn('[Biometric Setup] ⚠️ New columns (biometric_type, device_info) may not exist yet. SQL migration needed.');
      }
      
      const { data, error } = await supabaseAdmin
        .from('biometric_data')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        // Check if error is due to missing column
        if (error.message.includes('column') && (error.message.includes('biometric_type') || error.message.includes('device_info'))) {
          console.error('[Biometric Setup] ❌ Database schema incomplete - SQL migration required!');
          console.error('[Biometric Setup] Run: add_biometric_type_column.sql');
          
          // Retry without new columns (fallback)
          console.log('[Biometric Setup] 🔄 Retrying without new columns...');
          const { data: fallbackData, error: fallbackError } = await supabaseAdmin
            .from('biometric_data')
            .update({
              reference_photo_url: referencePhotoUrl,
              fingerprint_template: fingerprintTemplate,
              webauthn_credential_id: webauthnCredentialId,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
            .select()
            .single();
          
          if (fallbackError) throw fallbackError;
          
          console.log('[Biometric Setup] ⚠️ Data saved without biometric_type (migration needed)');
          
          return NextResponse.json({
            success: true,
            message: 'Data biometric berhasil diperbarui (mode kompatibilitas)',
            data: fallbackData,
            warning: 'Database schema incomplete - some features may not work. Contact admin.',
          });
        } else {
          throw error;
        }
      }

      // Log activity untuk dashboard user (UPDATE)
      await supabaseAdmin.from('user_activities').insert({
        user_id: userId,
        activity_type: 'biometric_update',
        description: `Updated biometric registration (${biometricType || 'fingerprint'})`,
        metadata: {
          photoUrl: referencePhotoUrl.substring(0, 100) + '...',
          fingerprintHash: fingerprintTemplate.substring(0, 16) + '...',
          biometricType: biometricType || 'fingerprint', // ✅ LOG TYPE
          deviceInfo: deviceInfo,
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
      console.log('[Biometric Setup] 📝 Creating new biometric data...');
      
      // Prepare insert data - only include new columns if they exist in schema
      const insertData: any = {
        user_id: userId,
        reference_photo_url: referencePhotoUrl,
        fingerprint_template: fingerprintTemplate,
        webauthn_credential_id: webauthnCredentialId,
      };
      
      // Try to add new columns (biometric_type, device_info)
      try {
        insertData.biometric_type = biometricType || 'fingerprint';
        insertData.device_info = deviceInfo || {};
      } catch (schemaError) {
        console.warn('[Biometric Setup] ⚠️ New columns may not exist yet. SQL migration needed.');
      }
      
      const { data, error } = await supabaseAdmin
        .from('biometric_data')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        // Check if error is due to missing column
        if (error.message.includes('column') && (error.message.includes('biometric_type') || error.message.includes('device_info'))) {
          console.error('[Biometric Setup] ❌ Database schema incomplete - SQL migration required!');
          console.error('[Biometric Setup] Run: add_biometric_type_column.sql');
          
          // Retry without new columns (fallback)
          console.log('[Biometric Setup] 🔄 Retrying without new columns...');
          const { data: fallbackData, error: fallbackError } = await supabaseAdmin
            .from('biometric_data')
            .insert({
              user_id: userId,
              reference_photo_url: referencePhotoUrl,
              fingerprint_template: fingerprintTemplate,
              webauthn_credential_id: webauthnCredentialId,
            })
            .select()
            .single();
          
          if (fallbackError) throw fallbackError;
          
          console.log('[Biometric Setup] ⚠️ Data saved without biometric_type (migration needed)');
          
          return NextResponse.json({
            success: true,
            message: 'Data biometric berhasil didaftarkan (mode kompatibilitas)',
            data: fallbackData,
            warning: 'Database schema incomplete - some features may not work. Contact admin.',
          });
        } else {
          throw error;
        }
      }

      // Log activity untuk dashboard user (NEW REGISTRATION)
      await supabaseAdmin.from('user_activities').insert({
        user_id: userId,
        activity_type: 'biometric_registration',
        description: `Registered biometric authentication (${biometricType || 'fingerprint'})`,
        metadata: {
          photoUrl: referencePhotoUrl.substring(0, 100) + '...',
          fingerprintHash: fingerprintTemplate.substring(0, 16) + '...',
          biometricType: biometricType || 'fingerprint', // ✅ LOG TYPE
          deviceInfo: deviceInfo,
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
      .from('biometric_data')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // ✅ SECURITY: Convert photo URL to signed URL
    if (data && data.reference_photo_url) {
      const signedUrl = await convertToSignedUrl(data.reference_photo_url);
      
      if (signedUrl) {
        data.reference_photo_url = signedUrl.url;
        data.photo_expires_at = signedUrl.expiresAt;
      }
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
