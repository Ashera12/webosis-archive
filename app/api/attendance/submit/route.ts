// app/api/attendance/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { logActivity, getIpAddress, parseUserAgent } from '@/lib/activity-logger';

interface AttendanceSubmit {
  latitude: number;
  longitude: number;
  locationAccuracy: number;
  photoSelfieUrl: string;
  fingerprintHash: string;
  wifiSSID: string;
  wifiBSSID?: string;
  deviceInfo: {
    userAgent: string;
    platform: string;
    language: string;
  };
  networkInfo?: {
    ipAddress?: string;
    macAddress?: string;
    networkType?: string;
    downlink?: number;
    effectiveType?: string;
  };
  aiVerification?: {
    verified: boolean;
    matchScore: number;
    confidence: number;
    isLive: boolean;
    provider: string;
  };
  notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = (session.user.role || '').toLowerCase();

    // Hanya siswa dan guru yang bisa submit absensi
    if (!['siswa', 'guru'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Hanya siswa dan guru yang dapat melakukan absensi' },
        { status: 403 }
      );
    }

    const body: AttendanceSubmit = await request.json();

    // Extract security info from request
    const clientIp = getIpAddress(request);
    const userAgent = request.headers.get('user-agent') || '';
    const deviceInfo = parseUserAgent(userAgent);
    
    // Security logging
    console.log('[Attendance Security] 🔐 Request Info:', {
      userId,
      userRole,
      clientIp,
      wifiSSID: body.wifiSSID,
      wifiBSSID: body.wifiBSSID,
      macAddress: body.networkInfo?.macAddress,
      location: `${body.latitude},${body.longitude}`,
      accuracy: body.locationAccuracy,
      device: `${deviceInfo.browser} on ${deviceInfo.os}`,
    });

    // 1. Get active config & admin settings
    const { data: locationConfigs } = await supabaseAdmin
      .from('school_location_config')
      .select('*')
      .eq('is_active', true);

    if (!locationConfigs || locationConfigs.length === 0) {
      return NextResponse.json(
        { error: 'Konfigurasi lokasi sekolah belum diatur' },
        { status: 500 }
      );
    }

    // 🔒 SECURITY: Check admin settings (key-value store)
    const { data: wifiSetting } = await supabaseAdmin
      .from('admin_settings')
      .select('value')
      .eq('key', 'wifi_required')
      .single();
    
    const { data: locationSetting } = await supabaseAdmin
      .from('admin_settings')
      .select('value')
      .eq('key', 'location_required')
      .single();
    
    // Default to TRUE (strict mode) for security
    const wifiRequired = wifiSetting?.value !== 'false'; 
    const locationRequired = locationSetting?.value !== 'false';

    console.log('[Attendance Submit] 🔒 Security Settings:', {
      wifiRequired: wifiRequired ? '✅ STRICT' : '⚠️ BYPASS',
      locationRequired: locationRequired ? '✅ STRICT' : '⚠️ BYPASS',
      providedWiFi: body.wifiSSID,
      providedLocation: `${body.latitude},${body.longitude}`,
    });

    // CONDITIONAL WiFi validation
    if (wifiRequired) {
      const allowedWiFiList = locationConfigs[0].allowed_wifi_ssids || [];
      const providedWiFi = body.wifiSSID?.trim() || '';
      const isWiFiValid = allowedWiFiList.length === 0 || allowedWiFiList.some((ssid: string) => 
        ssid.toLowerCase() === providedWiFi.toLowerCase()
      );
      
      if (!isWiFiValid) {
        console.error('[Attendance Submit] ❌ WiFi validation failed:', {
          provided: providedWiFi,
          allowed: allowedWiFiList
        });
        
        return NextResponse.json(
          { 
            error: 'WiFi tidak valid! Anda harus terhubung ke WiFi sekolah yang terdaftar.',
            details: {
              providedWiFi: providedWiFi,
              allowedWiFi: allowedWiFiList,
              hint: allowedWiFiList.length > 0 
                ? 'Pastikan terhubung ke: ' + allowedWiFiList.join(', ')
                : 'Belum ada WiFi terdaftar - hubungi admin'
            }
          },
          { status: 403 }
        );
      }
      
      console.log('[Attendance Submit] ✅ WiFi validated (STRICT MODE):', providedWiFi);
    } else {
      console.log('[Attendance Submit] ⏭️ WiFi validation BYPASSED (not required)');
    }

    // 2. CONDITIONAL Location validation
    if (locationRequired) {
      const isInSchoolRadius = locationConfigs.some((config) => {
        const distance = calculateDistance(
          body.latitude,
          body.longitude,
          parseFloat(config.latitude),
          parseFloat(config.longitude)
        );
        return distance <= config.radius_meters;
      });

      if (!isInSchoolRadius) {
        return NextResponse.json(
          { error: 'Anda berada di luar area sekolah. Absensi hanya dapat dilakukan di lokasi sekolah' },
          { status: 403 }
        );
      }
      
      console.log('[Attendance Submit] ✅ Location validated (within radius)');
    } else {
      console.log('[Attendance Submit] ⏭️ Location validation BYPASSED (not required)');
    }

    // 3. CHECK BIOMETRIC DATA - First time or verification?
    console.log('[Attendance Submit] 🔍 Checking biometric enrollment status...');
    
    const { data: biometric, error: biometricError } = await supabaseAdmin
      .from('biometric_data')
      .select('*')
      .eq('user_id', userId)
      .single();

    const isFirstTimeAttendance = !biometric || biometricError?.code === 'PGRST116';
    
    if (isFirstTimeAttendance) {
      console.log('[Attendance Submit] 🎉 FIRST TIME ATTENDANCE - Starting enrollment...');
      
      // ==========================================
      // FIRST TIME: ENROLLMENT MODE
      // Save biometric data for future verification
      // ==========================================
      
      const { error: enrollError } = await supabaseAdmin
        .from('biometric_data')
        .insert({
          user_id: userId,
          reference_photo_url: body.photoSelfieUrl,
          fingerprint_template: body.fingerprintHash,
          is_first_attendance_enrollment: true,
          enrollment_status: 'complete',
          created_at: new Date().toISOString(),
        });

      if (enrollError) {
        console.error('[Attendance Submit] ❌ Enrollment save failed:', enrollError);
        return NextResponse.json(
          { error: 'Gagal menyimpan data enrollment' },
          { status: 500 }
        );
      }

      console.log('[Attendance Submit] ✅ Enrollment data saved successfully');
      
      // Continue to save attendance below with enrollment flag
      
    } else {
      console.log('[Attendance Submit] ✅ Returning user - verification mode');
      // Verification logic continues below
    }

    // 4. VERIFY BIOMETRIC (Only for returning users)
    if (!isFirstTimeAttendance) {
      console.log('[Attendance Submit] 🔐 Verifying biometric data...');
      console.log('[Attendance Submit] Stored fingerprint:', biometric.fingerprint_template?.substring(0, 20) + '...');
      console.log('[Attendance Submit] Provided fingerprint:', body.fingerprintHash?.substring(0, 20) + '...');
      
      const fingerprintMatch = body.fingerprintHash === biometric.fingerprint_template;
      
      if (!fingerprintMatch) {
        console.error('[Attendance Submit] ❌ Fingerprint mismatch!');
      
      // Log security violation
      await logActivity({
        userId,
        userName: session.user.name || undefined,
        userEmail: session.user.email || undefined,
        userRole,
        activityType: 'security_validation',
        action: 'Fingerprint verification failed',
        description: `Fingerprint mismatch detected - possible device change or spoofing attempt`,
        metadata: {
          stored_fingerprint_preview: biometric.fingerprint_template?.substring(0, 20),
          provided_fingerprint_preview: body.fingerprintHash?.substring(0, 20),
          location: `${body.latitude}, ${body.longitude}`,
          wifi_ssid: body.wifiSSID,
        },
        ipAddress: clientIp,
        userAgent,
        deviceInfo,
        status: 'failure',
      });
      
      return NextResponse.json(
        { error: 'Verifikasi sidik jari gagal. Device tidak dikenali. Gunakan device yang sama saat setup.' },
        { status: 403 }
      );
    }

    console.log('[Attendance Submit] ✅ Fingerprint verified!');

    // 5. VERIFY AI FACE RECOGNITION (if photo provided)
    let aiVerificationResult = null;
    
    if (body.photoSelfieUrl && biometric.reference_photo_url) {
      console.log('[Attendance Submit] 📸 Verifying face with AI...');
      console.log('[Attendance Submit] Reference photo (DB):', biometric.reference_photo_url.substring(0, 80) + '...');
      console.log('[Attendance Submit] Current selfie:', body.photoSelfieUrl.substring(0, 80) + '...');

      try {
        // Call AI verification API (automatically fetches reference from database)
        const aiResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://osissmktest.biezz.my.id'}/api/ai/verify-face`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            currentPhotoUrl: body.photoSelfieUrl,
            // referencePhotoUrl will be fetched from database in verify-face API
          }),
        });

        const aiData = await aiResponse.json();
        aiVerificationResult = aiData;

        console.log('[Attendance Submit] 🤖 AI verification result:', {
          verified: aiData.verified,
          matchScore: aiData.matchScore,
          confidence: aiData.confidence,
          isLive: aiData.isLive,
          provider: aiData.provider,
        });

        // AI verification must pass (75% match minimum)
        if (!aiData.verified || aiData.matchScore < 0.75) {
          console.error('[Attendance Submit] ❌ AI face verification failed!');
          
          // Log security violation
          await logActivity({
            userId,
            userName: session.user.name || undefined,
            userEmail: session.user.email || undefined,
            userRole,
            activityType: 'security_validation',
            action: 'AI face verification failed',
            description: `Face mismatch detected - Match score: ${(aiData.matchScore * 100).toFixed(1)}%`,
            metadata: {
              match_score: aiData.matchScore,
              confidence: aiData.confidence,
              is_live: aiData.isLive,
              provider: aiData.provider,
              threshold: 0.75,
              location: `${body.latitude}, ${body.longitude}`,
            },
            ipAddress: clientIp,
            userAgent,
            deviceInfo,
            status: 'failure',
          });

          return NextResponse.json(
            { 
              error: `Verifikasi wajah gagal. Tingkat kemiripan: ${(aiData.matchScore * 100).toFixed(1)}% (minimum 75%). Gunakan foto wajah Anda sendiri.`,
              aiVerification: {
                verified: false,
                matchScore: aiData.matchScore,
                threshold: 0.75,
              }
            },
            { status: 403 }
          );
        }

        console.log('[Attendance Submit] ✅ AI face verification passed!');
      } catch (aiError: any) {
        console.error('[Attendance Submit] ❌ AI verification error:', aiError);
        return NextResponse.json(
          { error: `AI verification failed: ${aiError.message}. Please try again.` },
          { status: 500 }
        );
      }
    } else {
      console.log('[Attendance Submit] ⏭️ Skipping AI verification (no photo provided or no reference photo in database)');
    }
    } // End of verification block for returning users

    // 5. Cek apakah sudah absen hari ini
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: existingAttendance } = await supabaseAdmin
      .from('attendance')
      .select('*')
      .eq('user_id', userId)
      .gte('check_in_time', today.toISOString())
      .lt('check_in_time', tomorrow.toISOString())
      .single();

    if (existingAttendance && !existingAttendance.check_out_time) {
      // Sudah check-in, sekarang check-out
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('attendance')
        .update({ check_out_time: new Date().toISOString() })
        .eq('id', existingAttendance.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Log activity - attendance checkout
      await logActivity({
        userId,
        userName: session.user.name || undefined,
        userEmail: session.user.email || undefined,
        userRole,
        activityType: 'attendance_checkout',
        action: 'User checked out from school',
        description: `Absen pulang di ${body.wifiSSID}`,
        metadata: {
          attendance_id: updated.id,
          location: `${body.latitude}, ${body.longitude}`,
          wifi_ssid: body.wifiSSID,
          accuracy: body.locationAccuracy,
        },
        ipAddress: getIpAddress(request),
        userAgent: request.headers.get('user-agent') || undefined,
        deviceInfo: parseUserAgent(request.headers.get('user-agent') || ''),
        locationData: {
          latitude: body.latitude,
          longitude: body.longitude,
          accuracy: body.locationAccuracy,
        },
        relatedId: updated.id.toString(),
        relatedType: 'attendance',
        status: 'success',
      });

      return NextResponse.json({
        success: true,
        type: 'check-out',
        message: 'Check-out berhasil!',
        data: updated,
      });
    } else if (existingAttendance && existingAttendance.check_out_time) {
      return NextResponse.json(
        { error: 'Anda sudah melakukan absensi hari ini' },
        { status: 400 }
      );
    }

    // 6. Insert data absensi baru (check-in) with ENHANCED SECURITY DATA
    const { data: attendance, error } = await supabaseAdmin
      .from('attendance')
      .insert({
        user_id: userId,
        user_name: session.user.name || session.user.email,
        user_role: userRole,
        latitude: body.latitude,
        longitude: body.longitude,
        location_accuracy: body.locationAccuracy,
        photo_selfie_url: body.photoSelfieUrl,
        fingerprint_hash: body.fingerprintHash,
        wifi_ssid: body.wifiSSID,
        wifi_bssid: body.wifiBSSID,
        is_enrollment_attendance: isFirstTimeAttendance, // NEW: Flag for first-time enrollment
        biometric_method_used: biometric?.biometric_type || 'fingerprint', // ✅ NEW: Log which method was used
        device_info: {
          ...body.deviceInfo,
          // Enhanced security tracking
          clientIp,
          macAddress: body.networkInfo?.macAddress,
          networkType: body.networkInfo?.networkType,
          downlink: body.networkInfo?.downlink,
          effectiveType: body.networkInfo?.effectiveType,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          device_type: deviceInfo.device_type,
          is_mobile: deviceInfo.is_mobile,
          // AI Verification Data
          ai_verification: body.aiVerification || null,
          // Biometric device info
          biometric_device: biometric?.device_info || null,
        },
        notes: body.notes,
        status: 'present',
        is_verified: false,
      })
      .select()
      .single();

    if (error) throw error;

    // Log activity - attendance checkin with ENHANCED SECURITY METADATA
    await logActivity({
      userId,
      userName: session.user.name || undefined,
      userEmail: session.user.email || undefined,
      userRole,
      activityType: 'attendance_checkin',
      action: 'User checked in to school',
      description: `Absen masuk di ${body.wifiSSID} (IP: ${clientIp})${body.aiVerification ? ` - AI: ${(body.aiVerification.matchScore * 100).toFixed(0)}% match` : ''}`,
      metadata: {
        attendance_id: attendance.id,
        location: `${body.latitude}, ${body.longitude}`,
        wifi_ssid: body.wifiSSID,
        wifi_bssid: body.wifiBSSID,
        mac_address: body.networkInfo?.macAddress,
        client_ip: clientIp,
        network_type: body.networkInfo?.networkType,
        downlink: body.networkInfo?.downlink,
        effective_type: body.networkInfo?.effectiveType,
        accuracy: body.locationAccuracy,
        fingerprint_verified: true,
        webauthn_verified: true,
        // AI Verification metadata for dashboard
        ai_verified: body.aiVerification?.verified || false,
        ai_match_score: body.aiVerification?.matchScore || 0,
        ai_confidence: body.aiVerification?.confidence || 0,
        ai_is_live: body.aiVerification?.isLive || false,
        ai_provider: body.aiVerification?.provider || 'none',
      },
      ipAddress: clientIp,
      userAgent,
      deviceInfo,
      locationData: {
        latitude: body.latitude,
        longitude: body.longitude,
        accuracy: body.locationAccuracy,
      },
      relatedId: attendance.id.toString(),
      relatedType: 'attendance',
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      type: 'check-in',
      message: 'Check-in berhasil!',
      data: attendance,
    });
  } catch (error: any) {
    console.error('Attendance submit error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal submit absensi' },
      { status: 500 }
    );
  }
}

// Haversine formula untuk hitung jarak antara 2 koordinat
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Radius bumi dalam meter
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Jarak dalam meter
}

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}
