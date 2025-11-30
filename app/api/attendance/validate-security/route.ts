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
  networkInfo?: {
    ipAddress: string | null;
    ipType: string;
    connectionType: string | null;
    isLocalNetwork: boolean;
    networkStrength: string;
  };
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

    // ===== 2. IP WHITELISTING - ENTERPRISE STANDARD (Google Workspace / Microsoft 365) =====
    // 🔐 STRICT MODE: SEMUA USER (Siswa, Guru, Admin) HARUS dari IP Internal Sekolah
    // Standar keamanan tinggi: Server-side IP validation dengan CIDR notation
    // NO ROLE BYPASS - Akses hanya diizinkan dari jaringan sekolah
    
    const allowedIPRanges = activeConfig.allowed_ip_ranges || [];
    const clientIP = body.networkInfo?.ipAddress || request.headers.get('x-forwarded-for')?.split(',')[0].trim() || null;
    
    console.log('[Security Validation] 🔐 IP Whitelisting Check (STRICT MODE - All Users)');
    console.log('[Security Validation] User:', {
      role: userRole,
      email: session.user.email,
      clientIP
    });
    console.log('[Security Validation] Config:', {
      allowedIPRanges,
      totalRanges: allowedIPRanges.length
    });
    
    // ⚠️ CRITICAL: Empty IP ranges = BLOCK ALL
    if (!allowedIPRanges || allowedIPRanges.length === 0) {
      console.error('[Security Validation] ❌ NO IP RANGES CONFIGURED - BLOCKING ALL USERS');
      
      await logSecurityEvent({
        user_id: userId,
        event_type: 'no_ip_ranges_configured',
        severity: 'CRITICAL',
        description: 'IP ranges not configured, blocking all access',
        metadata: {
          role: userRole,
          ip: clientIP,
          location: { lat: body.latitude, lng: body.longitude }
        }
      });
      
      return NextResponse.json({
        success: false,
        error: 'Konfigurasi IP Whitelisting belum diatur. Hubungi admin untuk setup.',
        details: {
          hint: 'Admin harus mengkonfigurasi IP ranges di halaman Attendance Settings',
          note: 'Semua user (siswa, guru, admin) harus akses dari jaringan sekolah'
        },
        action: 'BLOCK_ATTENDANCE',
        severity: 'CRITICAL',
        violations: ['NO_IP_RANGES_CONFIGURED']
      }, { status: 403 });
    }
    
    // 🔓 PERMISSIVE MODE - Allow ALL IPs (Development/Testing ONLY!)
    // ⚠️ WARNING: Gunakan hanya untuk testing, JANGAN di production
    if (allowedIPRanges.includes('0.0.0.0/0')) {
      console.warn('[Security Validation] ⚠️  PERMISSIVE MODE (0.0.0.0/0) - All IPs allowed');
      console.warn('[Security Validation] ⚠️  WARNING: This is NOT SECURE! Only use for testing!');
      
      await logSecurityEvent({
        user_id: userId,
        event_type: 'permissive_mode_access',
        severity: 'WARNING',
        description: 'Access granted via permissive mode (0.0.0.0/0) - INSECURE!',
        metadata: {
          role: userRole,
          ip: clientIP,
          location: { lat: body.latitude, lng: body.longitude }
        }
      });
      
      // Continue to next validation (tidak block, tapi tetap log)
    } 
    // 🔐 STRICT IP WHITELISTING - Applied to ALL Users (Siswa, Guru, Admin)
    else {
      console.log('[Security Validation] 🔐 STRICT MODE - IP validation enforced for ALL users');
      
      if (!clientIP) {
        violations.push('IP_NOT_DETECTED');
        securityScore -= 50;
        
        console.error('[Security Validation] ❌ IP not detected');
        
        await logSecurityEvent({
          user_id: userId,
          event_type: 'ip_not_detected',
          severity: 'HIGH',
          description: 'IP address could not be detected',
          metadata: {
            role: userRole,
            location: { lat: body.latitude, lng: body.longitude }
          }
        });
        
        return NextResponse.json({
          success: false,
          error: 'IP address tidak terdeteksi. Pastikan Anda terhubung ke internet.',
          details: {
            hint: 'Refresh halaman dan pastikan koneksi internet aktif',
            note: 'Sistem memerlukan IP address untuk validasi keamanan'
          },
          action: 'BLOCK_ATTENDANCE',
          severity: 'HIGH',
          violations,
          securityScore
        }, { status: 403 });
      }
      
      // Validate IP against whitelist (APPLIES TO ALL ROLES)
      const { isIPInAllowedRanges } = await import('@/lib/networkUtils');
      const isIPValid = isIPInAllowedRanges(clientIP, allowedIPRanges);
      
      console.log('[Security Validation] IP Whitelist Check:', {
        clientIP,
        isValid: isIPValid,
        allowedRanges: allowedIPRanges,
        userRole: userRole.toUpperCase()
      });
      
      if (!isIPValid) {
        violations.push('IP_NOT_IN_WHITELIST');
        securityScore -= 50;
        
        console.error('[Security Validation] ❌ IP NOT IN WHITELIST');
        console.error('[Security Validation] ❌ User Role:', userRole.toUpperCase());
        console.error('[Security Validation] ❌ Client IP:', clientIP);
        console.error('[Security Validation] ❌ Allowed Ranges:', allowedIPRanges);
        
        await logSecurityEvent({
          user_id: userId,
          event_type: 'ip_whitelist_failed',
          severity: 'HIGH',
          description: `${userRole.toUpperCase()} IP not in whitelist: ${clientIP}`,
          metadata: {
            role: userRole,
            client_ip: clientIP,
            allowed_ranges: allowedIPRanges,
            location: { lat: body.latitude, lng: body.longitude }
          }
        });
        
        // Error message berbeda untuk setiap role (lebih informatif)
        const roleSpecificMessage = userRole === 'siswa' 
          ? 'Siswa hanya dapat melakukan absensi dari jaringan sekolah.'
          : userRole === 'guru'
          ? 'Guru hanya dapat melakukan absensi dari jaringan sekolah.'
          : 'Admin hanya dapat melakukan absensi dari jaringan sekolah.';
        
        return NextResponse.json({
          success: false,
          error: `Akses ditolak! Anda harus terhubung ke jaringan sekolah.`,
          details: {
            role: userRole.toUpperCase(),
            yourIP: clientIP,
            allowedIPRanges: allowedIPRanges,
            hint: 'Hubungkan ke WiFi sekolah dan pastikan tidak menggunakan data seluler',
            note: roleSpecificMessage,
            solution: [
              '1. Matikan data seluler',
              '2. Connect ke WiFi sekolah',
              '3. Refresh halaman ini',
              '4. Jika masih gagal, hubungi admin untuk verifikasi IP Anda'
            ]
          },
          action: 'BLOCK_ATTENDANCE',
          severity: 'HIGH',
          violations,
          securityScore
        }, { status: 403 });
      }
      
      console.log('[Security Validation] ✅ IP VALID - Access from school network');
      console.log('[Security Validation] ✅ Role:', userRole.toUpperCase());
      console.log('[Security Validation] ✅ IP:', clientIP);
      
      await logSecurityEvent({
        user_id: userId,
        event_type: 'ip_validation_success',
        severity: 'INFO',
        description: `${userRole.toUpperCase()} IP validated: ${clientIP}`,
        metadata: {
          role: userRole,
          ip: clientIP,
          ranges: allowedIPRanges,
          location: { lat: body.latitude, lng: body.longitude }
        }
      });
    }

    console.log('[Security Validation] ✅ Network validation complete (Enterprise IP Whitelisting - STRICT MODE)');

    // ===== 3. VALIDATE LOCATION =====
    console.log('[Security Validation] Checking location...');
    
    // ✅ Check admin_settings for location requirement (key-value store)
    const { data: locationSetting } = await supabaseAdmin
      .from('admin_settings')
      .select('value')
      .eq('key', 'location_required')
      .single();
    
    // Default to TRUE (strict mode) if setting doesn't exist
    const locationRequired = locationSetting?.value !== 'false';
    
    // Also allow GPS bypass from config (backward compatibility)
    const bypassGPS = activeConfig.bypass_gps_validation === true;
    
    if (!locationRequired || bypassGPS || !body.latitude || !body.longitude) {
      console.log('[Security Validation] ⚠️ LOCATION BYPASS - Validation skipped', {
        locationRequired,
        bypassGPS,
        hasCoordinates: !!(body.latitude && body.longitude),
        reason: !locationRequired ? 'Admin set location_required=false' : 
                bypassGPS ? 'Config bypass enabled' : 
                'No GPS coordinates (HTTPS required)'
      });
      
      warnings.push('LOCATION_BYPASS_ACTIVE');
      securityScore -= 5; // Small penalty for bypass mode
      
      // 🔒 SECURITY: Log all bypass events for audit trail
      await supabaseAdmin.from('security_events').insert({
        user_id: userId,
        event_type: 'location_bypass_used',
        severity: 'LOW',
        metadata: {
          description: 'Location validation bypassed',
          reason: !locationRequired ? 'Admin disabled location_required' : 
                  bypassGPS ? 'Config GPS bypass enabled' : 
                  'No GPS coordinates provided (HTTPS required)',
          actual_location: body.latitude ? { lat: body.latitude, lng: body.longitude } : null,
          school_location: { lat: activeConfig.latitude, lng: activeConfig.longitude }
        }
      });
      
    } else {
      // NORMAL GPS VALIDATION
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
            hint: `Anda harus berada dalam radius ${allowedRadius}m dari sekolah`,
            adminHint: 'Admin dapat mengaktifkan GPS bypass mode di settings untuk testing'
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
    }

    // ===== 4. VALIDATE FINGERPRINT =====
    console.log('[Security Validation] Checking fingerprint...');
    const { data: biometric, error: bioError } = await supabaseAdmin
      .from('biometric_data')
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
      await logSecurityEvent({
        user_id: userId,
        event_type: 'FINGERPRINT_MISMATCH',
        severity: 'HIGH',
        description: 'Device fingerprint mismatch detected',
        metadata: {
          providedHash: body.fingerprintHash,
          storedHash: biometric.fingerprint_template,
          wifiSSID: body.wifiSSID,
          location: { lat: body.latitude, lng: body.longitude }
        }
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

    // ===== 6. AI ANOMALY DETECTION (Enhanced with WiFi Pattern Analysis) =====
    console.log('[Security Validation] Running enhanced AI anomaly detection...');
    const anomalyResult = await detectAnomalies({
      userId,
      currentLocation: { lat: body.latitude, lng: body.longitude },
      currentFingerprint: body.fingerprintHash,
      currentWiFi: body.wifiSSID || 'Unknown',
      timestamp: body.timestamp
    });

    if (anomalyResult.anomalyScore > 70) {
      // CRITICAL: Block attendance if anomaly score too high
      violations.push('HIGH_ANOMALY_SCORE');
      securityScore -= 30;
      
      console.error('[Security Validation] 🚨 HIGH ANOMALY SCORE:', {
        score: anomalyResult.anomalyScore,
        patterns: anomalyResult.detectedPatterns,
        recommendations: anomalyResult.recommendations
      });
      
      // Log untuk admin review
      await logSecurityEvent({
        user_id: userId,
        event_type: 'high_anomaly_detected',
        severity: 'CRITICAL',
        description: 'AI detected high anomaly score - potential security threat',
        metadata: {
          anomalyScore: anomalyResult.anomalyScore,
          detectedPatterns: anomalyResult.detectedPatterns,
          recommendations: anomalyResult.recommendations,
          wifi: body.wifiSSID || 'Unknown',
          location: { lat: body.latitude, lng: body.longitude },
          fingerprint: body.fingerprintHash
        }
      });
      
      return NextResponse.json({
        success: false,
        error: 'Pola aktivitas mencurigakan terdeteksi. Hubungi admin untuk verifikasi.',
        details: {
          anomalyScore: anomalyResult.anomalyScore,
          patterns: anomalyResult.detectedPatterns,
          recommendations: anomalyResult.recommendations
        },
        action: 'BLOCK_ATTENDANCE',
        severity: 'CRITICAL',
        violations,
        securityScore
      }, { status: 403 });
      
    } else if (anomalyResult.anomalyScore > 40) {
      // WARNING: Allow but log suspicious pattern
      warnings.push('SUSPICIOUS_PATTERN');
      securityScore -= 15;
      
      console.warn('[Security Validation] ⚠️  Suspicious pattern detected:', {
        score: anomalyResult.anomalyScore,
        patterns: anomalyResult.detectedPatterns
      });
      
      // Log untuk admin monitoring
      await logSecurityEvent({
        user_id: userId,
        event_type: 'anomaly_warning',
        severity: 'MEDIUM',
        description: 'AI detected suspicious pattern',
        metadata: {
          anomalyScore: anomalyResult.anomalyScore,
          detectedPatterns: anomalyResult.detectedPatterns,
          wifi: body.wifiSSID || 'Unknown',
          location: { lat: body.latitude, lng: body.longitude }
        }
      });
    } else if (anomalyResult.detectedPatterns.length > 0) {
      // INFO: Log detected patterns even if score is low
      console.log('[Security Validation] ℹ️  AI patterns detected:', anomalyResult.detectedPatterns);
      
      await logSecurityEvent({
        user_id: userId,
        event_type: 'anomaly_info',
        severity: 'INFO',
        description: 'AI detected patterns (low score)',
        metadata: {
          anomalyScore: anomalyResult.anomalyScore,
          detectedPatterns: anomalyResult.detectedPatterns
        }
      });
    }

    // ===== SUCCESS - ALL VALIDATIONS PASSED =====
    console.log('[Security Validation] ✅ All validations passed!');
    console.log('[Security Validation] Security Score:', securityScore);

    // Calculate distance for response (use 0 if bypassed)
    const responseDistance = (!locationRequired || bypassGPS || !body.latitude) ? 0 : calculateDistance(
      body.latitude,
      body.longitude,
      parseFloat(activeConfig.latitude),
      parseFloat(activeConfig.longitude)
    );
    const responseRadius = activeConfig.radius_meters;

    return NextResponse.json({
      success: true,
      message: 'Validasi keamanan berhasil. Silakan lanjut ambil foto.',
      data: {
        attendanceType,
        configId: activeConfig.id,
        schoolName: activeConfig.location_name,
        distance: Math.round(responseDistance),
        allowedRadius: responseRadius,
        wifiSSID: body.wifiSSID,
        securityScore,
        warnings,
        biometricVerified: true,
        locationBypassActive: !locationRequired || bypassGPS
      },
      action: 'PROCEED_PHOTO'
    });

  } catch (error: any) {
    console.error('[Security Validation] ❌ Error:', error);
    
    await logSecurityEvent({
      user_id: null,
      event_type: 'VALIDATION_ERROR',
      severity: 'CRITICAL',
      description: 'Security validation error occurred',
      metadata: {
        error: error.message,
        stack: error.stack
      }
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

async function logSecurityEvent(params: {
  user_id: string | null;
  event_type: string;
  severity: string;
  description: string;
  metadata: any;
}): Promise<void> {
  try {
    await supabaseAdmin
      .from('security_events')
      .insert({
        user_id: params.user_id,
        event_type: params.event_type,
        severity: params.severity,
        metadata: {
          ...params.metadata,
          description: params.description,
        },
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
 * AI ANOMALY DETECTION (Enhanced with WiFi Pattern Analysis)
 * Deteksi pola tidak wajar:
 * - Check-in dari lokasi berbeda dalam waktu singkat (Impossible Travel)
 * - WiFi switching pattern (Frequent WiFi changes = suspicious)
 * - WiFi-Location mismatch (Claim WiFi A but GPS shows location B)
 * - Device fingerprint changes (Multiple devices)
 * - Abnormal timing patterns (Middle of night attendance)
 */
async function detectAnomalies(params: {
  userId: string;
  currentLocation: { lat: number; lng: number };
  currentFingerprint: string;
  currentWiFi: string;
  timestamp: number;
}): Promise<{
  anomalyScore: number;
  detectedPatterns: string[];
  recommendations: string[];
}> {
  try {
    let anomalyScore = 0;
    const detectedPatterns: string[] = [];
    const recommendations: string[] = [];

    // Get last 7 days attendance for pattern analysis
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentAttendance } = await supabaseAdmin
      .from('attendance')
      .select('*')
      .eq('user_id', params.userId)
      .gte('check_in_time', sevenDaysAgo.toISOString())
      .order('check_in_time', { ascending: false })
      .limit(20);

    if (!recentAttendance || recentAttendance.length === 0) {
      // First time user, no pattern yet
      return {
        anomalyScore: 0,
        detectedPatterns: ['FIRST_TIME_USER'],
        recommendations: ['Monitor user for establishing baseline pattern']
      };
    }

    // ===== 1. WiFi SWITCHING PATTERN ANALYSIS =====
    const wifiHistory = recentAttendance
      .map(a => a.wifi_ssid)
      .filter(w => w && w.trim());
    const uniqueWiFi = new Set(wifiHistory);
    const wifiChangeRate = uniqueWiFi.size / wifiHistory.length;
    
    if (uniqueWiFi.size > 4) {
      // Terlalu banyak WiFi berbeda dalam 7 hari
      anomalyScore += 35;
      detectedPatterns.push('EXCESSIVE_WIFI_SWITCHING');
      recommendations.push('User menggunakan lebih dari 4 WiFi berbeda dalam 7 hari');
      console.log('[AI Anomaly] ⚠️  Excessive WiFi switching:', {
        uniqueNetworks: uniqueWiFi.size,
        networks: Array.from(uniqueWiFi),
        changeRate: wifiChangeRate.toFixed(2)
      });
    } else if (wifiChangeRate > 0.5) {
      // WiFi berubah > 50% dari waktu ke waktu
      anomalyScore += 20;
      detectedPatterns.push('HIGH_WIFI_CHANGE_RATE');
      recommendations.push('WiFi berubah-ubah terlalu sering');
      console.log('[AI Anomaly] ⚠️  High WiFi change rate:', wifiChangeRate.toFixed(2));
    }

    // ===== 2. WIFI CONSISTENCY CHECK =====
    // Check if current WiFi is consistent with user's pattern
    const mostCommonWiFi = getMostCommonValue(wifiHistory);
    if (mostCommonWiFi && params.currentWiFi !== mostCommonWiFi) {
      const wifiCount = wifiHistory.filter(w => w === params.currentWiFi).length;
      if (wifiCount === 0) {
        // Brand new WiFi never used before
        anomalyScore += 15;
        detectedPatterns.push('NEW_WIFI_NETWORK');
        recommendations.push(`WiFi "${params.currentWiFi}" belum pernah digunakan sebelumnya`);
        console.log('[AI Anomaly] ℹ️  New WiFi network detected:', params.currentWiFi);
      }
    }

    // ===== 3. IMPOSSIBLE TRAVEL DETECTION =====
    const lastAttendance = recentAttendance[0];
    if (lastAttendance && lastAttendance.check_in_time) {
      const lastTime = new Date(lastAttendance.check_in_time).getTime();
      const currentTime = params.timestamp;
      const timeDiffMinutes = (currentTime - lastTime) / 1000 / 60;

      if (timeDiffMinutes < 120) {
        // Check distance within last 2 hours
        const distance = calculateDistance(
          params.currentLocation.lat,
          params.currentLocation.lng,
          parseFloat(lastAttendance.latitude),
          parseFloat(lastAttendance.longitude)
        );

        // Impossible travel: >10km in <60min OR >20km in <120min
        const speedKmh = (distance / 1000) / (timeDiffMinutes / 60);
        
        if ((distance > 10000 && timeDiffMinutes < 60) || 
            (distance > 20000 && timeDiffMinutes < 120)) {
          anomalyScore += 60;
          detectedPatterns.push('IMPOSSIBLE_TRAVEL');
          recommendations.push(
            `Jarak ${(distance/1000).toFixed(1)}km dalam ${Math.round(timeDiffMinutes)} menit ` +
            `(${speedKmh.toFixed(0)} km/h) - Tidak mungkin`
          );
          console.log('[AI Anomaly] 🚨 IMPOSSIBLE TRAVEL:', {
            distance: `${(distance/1000).toFixed(1)}km`,
            time: `${Math.round(timeDiffMinutes)}min`,
            speed: `${speedKmh.toFixed(0)}km/h`
          });
        } else if (distance > 5000 && timeDiffMinutes < 60) {
          // Suspicious but possible (fast travel)
          anomalyScore += 25;
          detectedPatterns.push('FAST_TRAVEL');
          recommendations.push(`Perjalanan cepat terdeteksi: ${speedKmh.toFixed(0)} km/h`);
          console.log('[AI Anomaly] ⚠️  Fast travel:', speedKmh.toFixed(0), 'km/h');
        }
      }
    }

    // ===== 4. DEVICE FINGERPRINT CHANGES =====
    const fingerprintHistory = recentAttendance
      .map(a => a.fingerprint_hash)
      .filter(f => f && f.trim());
    const uniqueFingerprints = new Set(fingerprintHistory);
    
    if (uniqueFingerprints.size > 2) {
      // Multiple devices dalam 7 hari
      anomalyScore += 40;
      detectedPatterns.push('MULTIPLE_DEVICES');
      recommendations.push(`User menggunakan ${uniqueFingerprints.size} device berbeda`);
      console.log('[AI Anomaly] ⚠️  Multiple devices detected:', uniqueFingerprints.size);
    } else if (params.currentFingerprint && !fingerprintHistory.includes(params.currentFingerprint)) {
      // New device
      anomalyScore += 20;
      detectedPatterns.push('NEW_DEVICE');
      recommendations.push('Device baru terdeteksi');
      console.log('[AI Anomaly] ℹ️  New device fingerprint');
    }

    // ===== 5. TIME PATTERN ANALYSIS =====
    const currentHour = new Date(params.timestamp).getHours();
    
    // Abnormal hours (tengah malam 23:00 - 05:00)
    if (currentHour >= 23 || currentHour < 5) {
      anomalyScore += 30;
      detectedPatterns.push('ABNORMAL_TIME');
      recommendations.push(`Absensi pada jam tidak normal: ${currentHour}:00`);
      console.log('[AI Anomaly] ⚠️  Abnormal time:', currentHour + ':00');
    }
    
    // Weekend check (if current time is weekend)
    const currentDay = new Date(params.timestamp).getDay();
    if (currentDay === 0 || currentDay === 6) {
      anomalyScore += 15;
      detectedPatterns.push('WEEKEND_ATTENDANCE');
      recommendations.push('Absensi di hari weekend');
      console.log('[AI Anomaly] ℹ️  Weekend attendance');
    }

    // ===== 6. FREQUENCY ANALYSIS =====
    // Check if user tries to check-in multiple times per day
    const today = new Date(params.timestamp);
    today.setHours(0, 0, 0, 0);
    const todayAttendance = recentAttendance.filter(a => {
      const aDate = new Date(a.check_in_time);
      aDate.setHours(0, 0, 0, 0);
      return aDate.getTime() === today.getTime();
    });
    
    if (todayAttendance.length > 0) {
      anomalyScore += 50;
      detectedPatterns.push('DUPLICATE_CHECKIN_ATTEMPT');
      recommendations.push('User sudah check-in hari ini');
      console.log('[AI Anomaly] 🚨 Duplicate check-in attempt today');
    }

    console.log('[AI Anomaly] Final Score:', {
      score: anomalyScore,
      patterns: detectedPatterns,
      severity: anomalyScore > 70 ? 'HIGH' : anomalyScore > 40 ? 'MEDIUM' : 'LOW'
    });

    return {
      anomalyScore,
      detectedPatterns,
      recommendations
    };
  } catch (error) {
    console.error('[AI Anomaly Detection] Error:', error);
    return {
      anomalyScore: 0,
      detectedPatterns: ['DETECTION_ERROR'],
      recommendations: ['AI detection encountered an error']
    };
  }
}

// Helper: Get most common value in array
function getMostCommonValue(arr: string[]): string | null {
  if (arr.length === 0) return null;
  
  const counts: Record<string, number> = {};
  arr.forEach(item => {
    counts[item] = (counts[item] || 0) + 1;
  });
  
  let maxCount = 0;
  let mostCommon = null;
  Object.entries(counts).forEach(([value, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = value;
    }
  });
  
  return mostCommon;
}