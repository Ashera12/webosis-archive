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

    // 1. Get active config & STRICT WiFi validation
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

    // STRICT WiFi validation - must match allowed WiFi list
    const allowedWiFiList = locationConfigs[0].allowed_wifi_ssids || [];
    const providedWiFi = body.wifiSSID?.trim() || '';
    const isWiFiValid = allowedWiFiList.some((ssid: string) => 
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
            hint: 'Pastikan terhubung ke: ' + allowedWiFiList.join(', ')
          }
        },
        { status: 403 }
      );
    }
    
    console.log('[Attendance Submit] ✅ WiFi validated (STRICT MODE):', providedWiFi);

    // 2. Validasi lokasi - harus dalam radius sekolah
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

    // 3. Cek apakah user sudah punya data biometric
    const { data: biometric } = await supabaseAdmin
      .from('user_biometric')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!biometric) {
      return NextResponse.json(
        { error: 'Biometric belum terdaftar', requireSetup: true },
        { status: 400 }
      );
    }

    // 4. Verifikasi fingerprint hash
    if (body.fingerprintHash !== biometric.fingerprint_template) {
      return NextResponse.json(
        { error: 'Verifikasi sidik jari gagal. Silakan coba lagi' },
        { status: 403 }
      );
    }

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
