// app/api/attendance/validate-security/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

interface SecurityValidation {
  latitude: number;
  longitude: number;
  wifiSSID: string;
  fingerprintHash: string;
  timestamp: number;
}

/**
 * REAL-TIME SECURITY VALIDATION
 * Dipanggil SEBELUM user ambil foto
 * Validasi WiFi + Lokasi + Fingerprint secara bersamaan
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized',
        action: 'REDIRECT_LOGIN'
      }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = (session.user.role || '').toLowerCase();

    // Role check
    if (!['siswa', 'guru'].includes(userRole)) {
      return NextResponse.json({
        success: false,
        error: 'Akses ditolak. Hanya Siswa dan Guru yang dapat melakukan absensi.',
        action: 'REDIRECT_DASHBOARD',
        severity: 'HIGH'
      }, { status: 403 });
    }

    const body: SecurityValidation = await request.json();
    const violations: string[] = [];
    const warnings: string[] = [];
    let securityScore = 100;

    console.log('[Security Validation] Starting for user:', session.user.email);
    console.log('[Security Validation] Data:', {
      lat: body.latitude.toFixed(6),
      lng: body.longitude.toFixed(6),
      wifi: body.wifiSSID,
      timestamp: new Date(body.timestamp).toISOString()
    });

    // ===== 1. GET ACTIVE CONFIG =====
    const { data: activeConfig, error: configError } = await supabaseAdmin
      .from('school_location_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (configError || !activeConfig) {
      console.error('[Security Validation] No active config:', configError);
      return NextResponse.json({
        success: false,
        error: 'Konfigurasi lokasi sekolah belum diatur. Hubungi admin untuk setup.',
        action: 'SHOW_SETUP_ERROR',
        severity: 'CRITICAL',
        violations: ['NO_SCHOOL_CONFIG']
      }, { status: 404 });
    }

    // ===== 2. VALIDATE WIFI SSID =====
    console.log('[Security Validation] Checking WiFi...');
    const allowedSSIDs = activeConfig.allowed_wifi_ssids || [];
    const isWiFiValid = allowedSSIDs.includes(body.wifiSSID.trim());

    if (!isWiFiValid) {
      violations.push('INVALID_WIFI');
      securityScore -= 40;
      
      console.error('[Security Validation] ❌ WiFi INVALID:', {
        provided: body.wifiSSID,
        allowed: allowedSSIDs
      });

      return NextResponse.json({
        success: false,
        error: `WiFi tidak valid! Anda harus terhubung ke WiFi sekolah.`,
        details: {
          yourWiFi: body.wifiSSID,
          allowedWiFi: allowedSSIDs,
          hint: 'Pastikan terhubung ke jaringan: ' + allowedSSIDs.join(', ')
        },
        action: 'BLOCK_ATTENDANCE',
        severity: 'HIGH',
        violations,
        securityScore
      }, { status: 403 });
    }

    console.log('[Security Validation] ✅ WiFi valid:', body.wifiSSID);

    // ===== 3. VALIDATE LOCATION =====
    console.log('[Security Validation] Checking location...');
    const distance = calculateDistance(
      body.latitude,
      body.longitude,
      parseFloat(activeConfig.latitude),
      parseFloat(activeConfig.longitude)
    );

    const allowedRadius = activeConfig.radius_meters;
    const isLocationValid = distance <= allowedRadius;

    console.log('[Security Validation] Distance:', {
      calculated: Math.round(distance) + 'm',
      allowed: allowedRadius + 'm',
      valid: isLocationValid
    });

    if (!isLocationValid) {
      violations.push('OUTSIDE_RADIUS');
      securityScore -= 50;

      console.error('[Security Validation] ❌ Location OUTSIDE radius');

      return NextResponse.json({
        success: false,
        error: `Anda berada di luar area sekolah!`,
        details: {
          yourDistance: Math.round(distance) + ' meter',
          allowedRadius: allowedRadius + ' meter',
          schoolName: activeConfig.location_name,
          hint: `Anda harus berada dalam radius ${allowedRadius}m dari sekolah`
        },
        action: 'BLOCK_ATTENDANCE',
        severity: 'HIGH',
        violations,
        securityScore
      }, { status: 403 });
    }

    console.log('[Security Validation] ✅ Location valid');

    // Warning jika mendekati batas radius
    if (distance > allowedRadius * 0.8) {
      warnings.push('NEAR_BOUNDARY');
      securityScore -= 10;
    }

    // ===== 4. VALIDATE FINGERPRINT =====
    console.log('[Security Validation] Checking fingerprint...');
    const { data: biometric, error: bioError } = await supabaseAdmin
      .from('user_biometric')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (bioError || !biometric) {
      console.error('[Security Validation] ❌ No biometric data');
      
      return NextResponse.json({
        success: false,
        error: 'Data biometric belum terdaftar. Silakan setup terlebih dahulu.',
        action: 'REDIRECT_SETUP',
        severity: 'MEDIUM',
        violations: ['NO_BIOMETRIC'],
        securityScore: 0
      }, { status: 400 });
    }

    // Verify fingerprint hash
    const fingerprintMatch = body.fingerprintHash === biometric.fingerprint_template;
    
    if (!fingerprintMatch) {
      violations.push('FINGERPRINT_MISMATCH');
      securityScore -= 30;

      console.error('[Security Validation] ❌ Fingerprint MISMATCH:', {
        provided: body.fingerprintHash.substring(0, 20) + '...',
        stored: biometric.fingerprint_template.substring(0, 20) + '...'
      });

      // Check if device changed
      await logSecurityEvent(userId, 'FINGERPRINT_MISMATCH', {
        providedHash: body.fingerprintHash,
        storedHash: biometric.fingerprint_template,
        wifiSSID: body.wifiSSID,
        location: { lat: body.latitude, lng: body.longitude }
      });

      return NextResponse.json({
        success: false,
        error: 'Verifikasi perangkat gagal! Device fingerprint tidak cocok.',
        details: {
          hint: 'Gunakan perangkat yang sama dengan saat pendaftaran biometric',
          suggestion: 'Jika Anda mengganti device, silakan daftar ulang biometric'
        },
        action: 'BLOCK_ATTENDANCE',
        severity: 'HIGH',
        violations,
        securityScore
      }, { status: 403 });
    }

    console.log('[Security Validation] ✅ Fingerprint valid');

    // ===== 5. CHECK DUPLICATE ATTENDANCE TODAY =====
    console.log('[Security Validation] Checking duplicate...');
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

    let attendanceType: 'check-in' | 'check-out' = 'check-in';

    if (existingAttendance) {
      if (existingAttendance.check_out_time) {
        // Sudah lengkap
        console.log('[Security Validation] ❌ Already completed today');
        
        return NextResponse.json({
          success: false,
          error: 'Anda sudah melakukan absensi lengkap hari ini.',
          details: {
            checkIn: new Date(existingAttendance.check_in_time).toLocaleTimeString('id-ID'),
            checkOut: new Date(existingAttendance.check_out_time).toLocaleTimeString('id-ID')
          },
          action: 'SHOW_COMPLETED',
          severity: 'INFO',
          violations: ['ALREADY_COMPLETED'],
          securityScore
        }, { status: 400 });
      } else {
        // Sudah check-in, bisa check-out
        attendanceType = 'check-out';
        console.log('[Security Validation] Ready for check-out');
      }
    }

    // ===== 6. AI ANOMALY DETECTION (Optional) =====
    const anomalyScore = await detectAnomalies(userId, {
      wifiSSID: body.wifiSSID,
      latitude: body.latitude,
      longitude: body.longitude,
      timestamp: body.timestamp
    });

    if (anomalyScore > 70) {
      warnings.push('SUSPICIOUS_PATTERN');
      securityScore -= 20;
      
      // Log untuk admin review
      await logSecurityEvent(userId, 'ANOMALY_DETECTED', {
        anomalyScore,
        wifiSSID: body.wifiSSID,
        location: { lat: body.latitude, lng: body.longitude }
      });
    }

    // ===== SUCCESS - ALL VALIDATIONS PASSED =====
    console.log('[Security Validation] ✅ All validations passed!');
    console.log('[Security Validation] Security Score:', securityScore);

    return NextResponse.json({
      success: true,
      message: 'Validasi keamanan berhasil. Silakan lanjut ambil foto.',
      data: {
        attendanceType,
        configId: activeConfig.id,
        schoolName: activeConfig.location_name,
        distance: Math.round(distance),
        allowedRadius,
        wifiSSID: body.wifiSSID,
        securityScore,
        warnings,
        biometricVerified: true
      },
      action: 'PROCEED_PHOTO'
    });

  } catch (error: any) {
    console.error('[Security Validation] ❌ Error:', error);
    
    await logSecurityEvent(null, 'VALIDATION_ERROR', {
      error: error.message,
      stack: error.stack
    });

    return NextResponse.json({
      success: false,
      error: 'Terjadi kesalahan saat validasi keamanan.',
      action: 'SHOW_ERROR',
      severity: 'CRITICAL'
    }, { status: 500 });
  }
}

// ===== HELPER FUNCTIONS =====

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Radius bumi dalam meter
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

async function logSecurityEvent(
  userId: string | null, 
  eventType: string, 
  metadata: any
): Promise<void> {
  try {
    await supabaseAdmin
      .from('security_events')
      .insert({
        user_id: userId,
        event_type: eventType,
        metadata,
        severity: getSeverity(eventType),
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('[Security Event Log] Failed:', error);
  }
}

function getSeverity(eventType: string): string {
  const highSeverity = ['FINGERPRINT_MISMATCH', 'LOCATION_SPOOFING', 'MULTIPLE_DEVICES'];
  const mediumSeverity = ['ANOMALY_DETECTED', 'NEAR_BOUNDARY'];
  
  if (highSeverity.includes(eventType)) return 'HIGH';
  if (mediumSeverity.includes(eventType)) return 'MEDIUM';
  return 'LOW';
}

/**
 * AI ANOMALY DETECTION
 * Deteksi pola tidak wajar:
 * - Check-in dari lokasi berbeda dalam waktu singkat
 * - WiFi switching pattern
 * - Device fingerprint changes
 */
async function detectAnomalies(
  userId: string, 
  current: {
    wifiSSID: string;
    latitude: number;
    longitude: number;
    timestamp: number;
  }
): Promise<number> {
  try {
    let anomalyScore = 0;

    // Get last 7 days attendance
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentAttendance } = await supabaseAdmin
      .from('attendance')
      .select('*')
      .eq('user_id', userId)
      .gte('check_in_time', sevenDaysAgo.toISOString())
      .order('check_in_time', { ascending: false })
      .limit(10);

    if (!recentAttendance || recentAttendance.length === 0) {
      // First time user, no pattern yet
      return 0;
    }

    // 1. Check WiFi switching pattern
    const wifiHistory = recentAttendance.map(a => a.wifi_ssid);
    const uniqueWiFi = new Set(wifiHistory);
    
    if (uniqueWiFi.size > 3) {
      // Terlalu banyak WiFi berbeda
      anomalyScore += 30;
      console.log('[Anomaly] Multiple WiFi networks detected:', uniqueWiFi.size);
    }

    // 2. Check location jumping (impossible travel)
    const lastAttendance = recentAttendance[0];
    if (lastAttendance && lastAttendance.check_in_time) {
      const lastTime = new Date(lastAttendance.check_in_time).getTime();
      const currentTime = current.timestamp;
      const timeDiffMinutes = (currentTime - lastTime) / 1000 / 60;

      if (timeDiffMinutes < 60) {
        // Check jarak dalam 1 jam terakhir
        const lastDistance = calculateDistance(
          current.latitude,
          current.longitude,
          parseFloat(lastAttendance.latitude),
          parseFloat(lastAttendance.longitude)
        );

        // Jika jarak > 5km dalam 1 jam = mencurigakan
        if (lastDistance > 5000) {
          anomalyScore += 50;
          console.log('[Anomaly] Impossible travel detected:', {
            distance: lastDistance,
            timeMinutes: timeDiffMinutes
          });
        }
      }
    }

    // 3. Check fingerprint consistency
    const fingerprintHistory = recentAttendance.map(a => a.fingerprint_hash);
    const uniqueFingerprints = new Set(fingerprintHistory);
    
    if (uniqueFingerprints.size > 2) {
      // Lebih dari 2 device berbeda = mencurigakan
      anomalyScore += 40;
      console.log('[Anomaly] Multiple devices detected:', uniqueFingerprints.size);
    }

    console.log('[Anomaly Detection] Final score:', anomalyScore);
    return anomalyScore;

  } catch (error) {
    console.error('[Anomaly Detection] Error:', error);
    return 0;
  }
}
