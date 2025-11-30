'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FaFingerprint, FaCamera, FaWifi, FaMapMarkerAlt, FaCheckCircle, FaClock, FaExclamationTriangle, FaLock } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import {
  checkWiFiConnection,
  getUserLocation,
  generateBrowserFingerprint,
  captureWebcamPhoto,
  uploadAttendancePhoto,
  formatAttendanceTime,
} from '@/lib/attendanceUtils';
import { getNetworkInfo, getWiFiNetworkDetails } from '@/lib/networkUtils';
import {
  isWebAuthnSupported,
  isPlatformAuthenticatorAvailable,
  getAuthenticatorName,
  getAuthenticatorIcon,
  registerCredential,
  authenticateCredential,
  testBiometric,
} from '@/lib/webauthn';

interface BiometricSetupData {
  referencePhotoUrl: string;
  fingerprintTemplate: string;
}

export default function AttendancePage() {
  const { data: session, status } = useSession();
  const [step, setStep] = useState<'check' | 'setup' | 'ready' | 'capture' | 'submitting'>('check');
  const [hasSetup, setHasSetup] = useState(false);
  const [requirements, setRequirements] = useState({
    role: false,
    wifi: false,
    location: false,
    biometric: false,
  });
  const [locationData, setLocationData] = useState<any>(null);
  const [wifiSSID, setWifiSSID] = useState('');
  const [fingerprintHash, setFingerprintHash] = useState('');
  const [fingerprintDetails, setFingerprintDetails] = useState<any>(null);
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [securityValidation, setSecurityValidation] = useState<any>(null);
  const [validating, setValidating] = useState(false);
  
  // Enhanced: Multi-method authentication support
  const [authMethod, setAuthMethod] = useState<'webauthn' | 'pin' | 'ai-face'>('webauthn');
  const [deviceCapabilities, setDeviceCapabilities] = useState<any>(null);
  const [pinCode, setPinCode] = useState('');
  const [aiVerification, setAiVerification] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login?callbackUrl=/attendance');
    }
  }, [status]);

  useEffect(() => {
    if (session?.user) {
      detectDeviceCapabilities();
      checkAllRequirements();
    }
  }, [session]);

  // Enhanced: Detect device biometric capabilities
  const detectDeviceCapabilities = async () => {
    console.log('[Device] 🔍 Detecting capabilities...');
    
    const webauthnSupported = isWebAuthnSupported();
    const platformAuth = await isPlatformAuthenticatorAvailable();
    const authName = getAuthenticatorName();
    const authIcon = getAuthenticatorIcon();
    
    const capabilities = {
      webauthn: webauthnSupported,
      platformAuth,
      authName,
      authIcon,
      supportsFingerprint: /android/i.test(navigator.userAgent) && platformAuth,
      supportsFaceID: /iphone|ipad/i.test(navigator.userAgent) && platformAuth,
      supportsWindowsHello: /windows/i.test(navigator.userAgent) && platformAuth,
      fallbackRequired: !platformAuth,
    };
    
    console.log('[Device] Capabilities:', capabilities);
    setDeviceCapabilities(capabilities);
    
    // Auto-select best auth method
    if (platformAuth) {
      setAuthMethod('webauthn');
      console.log('[Device] ✅ Using WebAuthn:', authName);
    } else {
      setAuthMethod('ai-face');
      console.log('[Device] ⚠️ WebAuthn unavailable, using AI Face Verification');
    }
  };

  const checkAllRequirements = async () => {
    if (!session?.user) return;

    const userRole = (session.user.role || '').toLowerCase();

    // 1. Check role (hanya siswa & guru)
    const roleValid = ['siswa', 'guru'].includes(userRole);
    if (!roleValid) {
      setRequirements(prev => ({ ...prev, role: false }));
      return;
    }

    setRequirements(prev => ({ ...prev, role: true }));

    // 2. Check biometric setup
    let biometricSetup = false;
    try {
      const bioResponse = await fetch('/api/attendance/biometric/setup');
      const bioData = await bioResponse.json();
      biometricSetup = bioData.hasSetup;
      setHasSetup(bioData.hasSetup);
      setRequirements(prev => ({ ...prev, biometric: bioData.hasSetup }));

      if (!bioData.hasSetup) {
        setStep('setup');
        return;
      }
    } catch (error) {
      console.error('Biometric check error:', error);
    }

    // 3. Check WiFi & Network Info (Enhanced with IP tracking)
    const wifiCheck = await checkWiFiConnection([]);
    console.log('WiFi check result:', wifiCheck);
    setWifiSSID(wifiCheck.ssid || 'Unknown');
    setRequirements(prev => ({ ...prev, wifi: wifiCheck.connected }));
    
    // Get comprehensive network info
    const netInfo = await getNetworkInfo();
    console.log('Network info:', netInfo);
    setNetworkInfo(netInfo);

    // 4. Check location
    const location = await getUserLocation();
    if (location) {
      setLocationData(location);
      setRequirements(prev => ({ ...prev, location: true }));
    }

    // 5. Generate fingerprint
    const fingerprint = await generateBrowserFingerprint();
    setFingerprintHash(fingerprint.hash);
    setFingerprintDetails(fingerprint.details);
    
    // Show fingerprint info to user
    console.log('🔐 Device fingerprint generated:', fingerprint.details);
    toast.success(
      `🔐 Device terdeteksi!\n` +
      `Platform: ${fingerprint.details.platform}\n` +
      `Browser: ${fingerprint.details.browser}\n` +
      `Device ID: ${fingerprint.details.deviceId}`,
      { duration: 5000 }
    );

    // 6. Check today's attendance
    checkTodayAttendance();

    // Jika semua ok, ready
    if (roleValid && biometricSetup && location) {
      setStep('ready');
    }
  };

  const checkTodayAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/attendance/history?limit=1&date=${today}`);
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        setTodayAttendance(data.data[0]);
      }
    } catch (error) {
      console.error('Check today attendance error:', error);
    }
  };

  /**
   * REAL-TIME SECURITY VALIDATION
   * Dipanggil SEBELUM user bisa ambil foto
   * Validasi WiFi + Lokasi + Fingerprint
   */
  const validateSecurity = async () => {
    if (!wifiSSID || !wifiSSID.trim()) {
      toast.error('🔒 Silakan isi nama WiFi sekolah terlebih dahulu');
      return false;
    }

    if (!locationData) {
      toast.error('📍 Lokasi belum terdeteksi. Aktifkan GPS dan refresh halaman.');
      return false;
    }

    if (!fingerprintHash) {
      toast.error('🔐 Fingerprint device belum terbentuk. Refresh halaman.');
      return false;
    }

    setValidating(true);
    const validationToast = toast.loading('🔒 Memvalidasi keamanan...');

    try {
      console.log('🔒 Starting security validation...');
      
      const response = await fetch('/api/attendance/validate-security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          wifiSSID: wifiSSID.trim(),
          fingerprintHash,
          timestamp: Date.now()
        }),
      });

      const data = await response.json();
      
      toast.dismiss(validationToast);
      
      console.log('🔒 Security validation response:', data);

      if (!response.ok || !data.success) {
        // Validation FAILED
        console.error('❌ Security validation failed:', data);
        
        // Handle different error actions
        switch (data.action) {
          case 'REDIRECT_LOGIN':
            toast.error('Sesi berakhir. Silakan login kembali.');
            setTimeout(() => redirect('/login?callbackUrl=/attendance'), 2000);
            break;
            
          case 'REDIRECT_DASHBOARD':
            toast.error(data.error || 'Akses ditolak');
            setTimeout(() => redirect('/dashboard'), 2000);
            break;
            
          case 'REDIRECT_SETUP':
            toast.error(data.error || 'Setup biometric diperlukan');
            setStep('setup');
            break;
            
          case 'BLOCK_ATTENDANCE':
            // Show detailed error
            const errorMsg = `🚫 ${data.error}`;
            const detailsMsg = data.details ? `\n\n${JSON.stringify(data.details, null, 2)}` : '';
            
            toast.error(errorMsg, {
              duration: 8000,
              style: {
                maxWidth: '500px',
                padding: '20px',
              },
            });
            
            // Log violations
            if (data.violations && data.violations.length > 0) {
              console.error('🚨 Security violations:', data.violations);
              console.error('📊 Security score:', data.securityScore);
            }
            
            // Show detailed info in console
            if (data.details) {
              console.error('❌ Validation details:', data.details);
            }
            
            // Redirect back to ready step
            setTimeout(() => setStep('ready'), 3000);
            break;
            
          case 'SHOW_COMPLETED':
            toast.success(data.error || 'Absensi sudah lengkap', {
              duration: 5000,
              icon: '✅',
            });
            setStep('ready');
            break;
            
          case 'SHOW_SETUP_ERROR':
          case 'SHOW_ERROR':
          default:
            toast.error(data.error || 'Validasi keamanan gagal');
            break;
        }
        
        return false;
      }

      // Validation SUCCESS
      console.log('✅ Security validation passed!');
      console.log('📊 Security score:', data.data.securityScore);
      
      if (data.data.warnings && data.data.warnings.length > 0) {
        console.warn('⚠️ Warnings:', data.data.warnings);
      }
      
      setSecurityValidation(data.data);
      
      // Show success with security score
      const scoreEmoji = data.data.securityScore >= 90 ? '🟢' : 
                        data.data.securityScore >= 70 ? '🟡' : '🔴';
      
      toast.success(
        <div>
          <div className="font-bold">✅ Validasi Keamanan Berhasil!</div>
          <div className="text-sm mt-1">
            {scoreEmoji} Security Score: {data.data.securityScore}/100
          </div>
          <div className="text-xs mt-1 opacity-80">
            📍 {data.data.distance}m dari sekolah • 📶 {data.data.wifiSSID}
          </div>
        </div>,
        {
          duration: 5000,
        }
      );
      
      return true;

    } catch (error: any) {
      toast.dismiss(validationToast);
      console.error('❌ Security validation error:', error);
      toast.error('Terjadi kesalahan saat validasi. Silakan coba lagi.');
      return false;
    } finally {
      setValidating(false);
    }
  };

  const handleSetupBiometric = async () => {
    console.log('[Setup] 🚀 Starting biometric setup...');
    console.log('[Setup] Photo blob exists:', !!photoBlob);
    console.log('[Setup] Fingerprint hash exists:', !!fingerprintHash);
    console.log('[Setup] Session user:', session?.user?.id);
    
    if (!photoBlob || !fingerprintHash) {
      console.error('[Setup] ❌ Missing photo or fingerprint');
      toast.error('Silakan ambil foto selfie terlebih dahulu');
      return;
    }

    if (!session?.user?.id) {
      console.error('[Setup] ❌ No session user ID');
      toast.error('Session tidak valid. Silakan login kembali.');
      return;
    }

    setLoading(true);
    
    try {
      // Step 1: Test biometric availability
      console.log('[Setup] 🔍 Testing biometric availability...');
      const biometricTest = await testBiometric();
      
      console.log('[Setup] Test result:', biometricTest);
      
      if (!biometricTest.supported) {
        console.error('[Setup] ❌ WebAuthn not supported');
        toast.error(
          <div>
            <div className="font-bold">❌ WebAuthn Not Supported</div>
            <div className="text-sm mt-1">Please update your browser or use a modern browser (Chrome, Edge, Safari, Firefox)</div>
          </div>,
          { duration: 8000 }
        );
        setLoading(false);
        return;
      }
      
      if (!biometricTest.available) {
        console.warn('[Setup] ⚠️ Platform authenticator not available');
        toast.error(
          <div>
            <div className="font-bold">⚠️ {biometricTest.type} Not Available</div>
            <div className="text-sm mt-1">Please enable biometric authentication in your device settings</div>
          </div>,
          { duration: 8000 }
        );
        setLoading(false);
        return;
      }
      
      // Show available biometric type
      console.log('[Setup] ✅ Biometric ready:', biometricTest.type);
      toast.success(
        <div>
          <div className="font-bold">✅ Biometric Ready!</div>
          <div className="text-sm mt-1">{biometricTest.icon} {biometricTest.type} available</div>
        </div>,
        { duration: 3000 }
      );
      
      // Step 2: Upload photo
      const uploadToast = toast.loading('📤 Mengupload foto...');
      
      console.log('[Setup] 📤 Starting photo upload...');
      console.log('[Setup] Photo size:', (photoBlob.size / 1024).toFixed(2), 'KB');
      
      let photoUrl: string;
      try {
        photoUrl = await uploadAttendancePhoto(photoBlob, session.user.id);
        console.log('[Setup] ✅ Photo uploaded:', photoUrl);
      } catch (uploadError: any) {
        toast.dismiss(uploadToast);
        console.error('[Setup] ❌ Photo upload failed:', uploadError);
        throw new Error(`Photo upload failed: ${uploadError.message || 'Unknown error'}`);
      }
      
      toast.dismiss(uploadToast);
      toast.success('✅ Foto berhasil diupload!');
      
      // Step 3: Register WebAuthn credential (OPTIONAL - fallback to AI-only if fails)
      console.log('[Setup] 🔐 Attempting WebAuthn credential registration...');
      
      const registerToast = toast.loading(
        <div>
          <div className="font-bold">🔐 Setting up biometric...</div>
          <div className="text-sm mt-1">{biometricTest.icon} Please authenticate with {biometricTest.type}</div>
        </div>
      );
      
      let webauthnCredentialId: string | null = null;
      
      try {
        const webauthnResult = await registerCredential(
          session.user.id,
          session.user.email || 'user',
          session.user.name || 'User'
        );
        console.log('[Setup] WebAuthn result:', webauthnResult);
        
        if (webauthnResult.success) {
          webauthnCredentialId = webauthnResult.credentialId || null;
          console.log('[Setup] ✅ WebAuthn credential registered!');
          console.log('[Setup] Credential ID:', webauthnCredentialId);
          toast.dismiss(registerToast);
          toast.success('✅ Biometric authentication configured!');
        } else {
          throw new Error(webauthnResult.error || 'Registration failed');
        }
      } catch (webauthnError: any) {
        toast.dismiss(registerToast);
        console.warn('[Setup] ⚠️ WebAuthn registration failed:', webauthnError.message);
        console.log('[Setup] 📱 Continuing with AI-only biometric mode...');
        
        // Show info but continue - this is not a fatal error
        toast(
          <div>
            <div className="font-bold">⚠️ Platform biometric unavailable</div>
            <div className="text-sm mt-1">Menggunakan AI Face Recognition saja</div>
          </div>,
          { 
            duration: 3000,
            icon: '⚠️',
          }
        );
        
        // Don't throw - continue with AI-only mode
        webauthnCredentialId = null;
      }
      
      // Step 4: Save to biometric setup API
      console.log('[Setup] 💾 Saving biometric data to database...');
      console.log('[Setup] Mode:', webauthnCredentialId ? 'WebAuthn + AI' : 'AI-only');
      
      const setupPayload = {
        referencePhotoUrl: photoUrl,
        fingerprintTemplate: fingerprintHash,
        webauthnCredentialId: webauthnCredentialId, // null = AI-only mode
      };
      
      console.log('[Setup] Setup payload:', setupPayload);
      
      const response = await fetch('/api/attendance/biometric/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setupPayload),
      });

      console.log('[Setup] API response status:', response.status);
      
      const data = await response.json();
      console.log('[Setup] API response data:', data);

      if (!response.ok) {
        console.error('[Setup] ❌ Setup save failed:', data);
        throw new Error(data.error || 'Setup gagal disimpan ke database');
      }

      console.log('[Setup] ✅ Biometric setup complete:', data);
      
      // Show detailed success message
      toast.success(
        <div>
          <div className="font-bold text-lg mb-2">🎉 Biometric Berhasil Didaftarkan!</div>
          <div className="space-y-1 text-sm">
            <div>✅ Foto: Uploaded</div>
            <div>✅ Fingerprint: {fingerprintDetails?.deviceId || 'Registered'}</div>
            <div>✅ {biometricTest.icon} {biometricTest.type}: Active</div>
            <div className="text-xs mt-2 opacity-80">Status: Siap untuk absensi!</div>
          </div>
        </div>,
        { duration: 7000 }
      );
      
      console.log('[Setup] 🎯 Updating UI state...');
      setHasSetup(true);
      setRequirements(prev => ({ ...prev, biometric: true }));
      setStep('ready');
      console.log('[Setup] ✅ Setup complete - redirecting to ready state');
      
    } catch (error: any) {
      console.error('[Setup] ❌❌❌ SETUP ERROR:', error);
      console.error('[Setup] Error name:', error.name);
      console.error('[Setup] Error message:', error.message);
      console.error('[Setup] Error stack:', error.stack);
      
      // Determine user-friendly error message
      let userMessage = error.message || 'Unknown error';
      
      if (error.name === 'NotAllowedError') {
        userMessage = 'Biometric dibatalkan atau tidak diizinkan. Silakan coba lagi dan izinkan akses biometric.';
      } else if (error.name === 'NotSupportedError') {
        userMessage = 'Biometric tidak didukung di browser ini. Gunakan Chrome, Edge, Safari, atau Firefox versi terbaru.';
      } else if (error.name === 'AbortError') {
        userMessage = 'Biometric timeout atau dibatalkan. Silakan coba lagi.';
      } else if (error.message?.includes('Photo upload failed')) {
        userMessage = 'Gagal mengupload foto. Periksa koneksi internet dan coba lagi.';
      } else if (error.message?.includes('WebAuthn registration failed')) {
        userMessage = 'Gagal mendaftarkan biometric. Pastikan browser mendukung WebAuthn.';
      } else if (error.message?.includes('Setup gagal disimpan')) {
        userMessage = 'Data biometric gagal disimpan ke database. Hubungi admin.';
      }
      
      toast.error(
        <div>
          <div className="font-bold">❌ Gagal Setup Biometric</div>
          <div className="text-sm mt-1">{userMessage}</div>
          <div className="text-xs mt-2 opacity-70">Lihat console (F12) untuk detail error</div>
        </div>,
        { duration: 8000 }
      );
    } finally {
      console.log('[Setup] 🏁 Finishing setup process...');
      setLoading(false);
    }
  };

  const handleCapturePhoto = async () => {
    setLoading(true);
    
    // Show loading toast
    const loadingToast = toast.loading('📸 Membuka kamera...');
    
    try {
      const blob = await captureWebcamPhoto();
      
      toast.dismiss(loadingToast);
      
      if (!blob) {
        toast.error('Foto tidak diambil');
        setLoading(false);
        return;
      }

      console.log('[Camera] Photo captured, size:', (blob.size / 1024).toFixed(2), 'KB');
      
      // Set photo data
      setPhotoBlob(blob);
      setPhotoPreview(URL.createObjectURL(blob));
      
      // Generate browser fingerprint
      console.log('[Camera] Generating browser fingerprint...');
      const fingerprint = await generateBrowserFingerprint();
      console.log('[Camera] Fingerprint generated:', fingerprint.hash.substring(0, 16) + '...');
      setFingerprintHash(fingerprint.hash);
      
      // Get network info for display
      console.log('[Camera] Getting network info...');
      const networkInfo = await getNetworkInfo();
      console.log('[Camera] Network info obtained:', networkInfo);
      setFingerprintDetails(networkInfo);
      
      setShowCamera(false);
      
      toast.success('✅ Foto dan fingerprint berhasil diambil!', {
        duration: 3000,
        icon: '📸',
      });
    } catch (error: any) {
      toast.dismiss(loadingToast);
      console.error('❌ Error capturing photo:', error);
      toast.error(error.message || 'Gagal mengambil foto. Pastikan kamera diizinkan.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAttendance = async () => {
    if (!wifiSSID) {
      toast.error('Silakan masukkan nama WiFi sekolah');
      return;
    }

    if (!locationData) {
      toast.error('Lokasi belum terdeteksi');
      return;
    }

    if (!photoBlob) {
      toast.error('Silakan ambil foto selfie');
      return;
    }

    setLoading(true);
    setStep('submitting');
    
    console.log('🚀 Starting attendance submission...');

    try {
      // ===== WEBAUTHN BIOMETRIC VERIFICATION =====
      console.log('[WebAuthn] 🔐 Starting biometric verification...');
      
      const biometricName = getAuthenticatorName();
      const biometricIcon = getAuthenticatorIcon();
      
      const biometricToast = toast.loading(
        <div>
          <div className="font-bold">🔐 Biometric Verification Required</div>
          <div className="text-sm mt-1">{biometricIcon} Please authenticate with {biometricName}</div>
        </div>
      );
      
      try {
        const webauthnResult = await authenticateCredential(session!.user.id!);
        
        toast.dismiss(biometricToast);
        
        if (!webauthnResult.success) {
          console.error('[WebAuthn] ❌ Authentication failed:', webauthnResult.error);
          
          toast.error(
            <div>
              <div className="font-bold">❌ Biometric Verification Failed</div>
              <div className="text-sm mt-1">{webauthnResult.error}</div>
            </div>,
            { duration: 5000 }
          );
          
          setLoading(false);
          setStep('ready');
          return;
        }
        
        console.log('[WebAuthn] ✅ Biometric verified!');
        
        toast.success(
          <div>
            <div className="font-bold">✅ Biometric Verified!</div>
            <div className="text-sm mt-1">{biometricIcon} {biometricName} authentication successful</div>
          </div>,
          { duration: 3000 }
        );
        
      } catch (webauthnError: any) {
        toast.dismiss(biometricToast);
        console.error('[WebAuthn] ❌ Verification error:', webauthnError);
        
        toast.error(
          <div>
            <div className="font-bold">❌ Biometric Error</div>
            <div className="text-sm mt-1">{webauthnError.message || 'Authentication failed'}</div>
          </div>,
          { duration: 5000 }
        );
        
        setLoading(false);
        setStep('ready');
        return;
      }
      
      // Upload foto attendance
      const uploadToast = toast.loading('📤 Mengupload foto...');
      
      console.log('📤 Uploading photo, size:', (photoBlob.size / 1024).toFixed(2), 'KB');
      const photoUrl = await uploadAttendancePhoto(photoBlob, session!.user.id!);
      
      toast.dismiss(uploadToast);
      toast.success('✅ Foto berhasil diupload!');
      
      console.log('📤 Photo uploaded:', photoUrl);
      
      // ===== AI FACE VERIFICATION =====
      const aiToast = toast.loading('🤖 Verifikasi wajah dengan AI...');
      
      try {
        console.log('🤖 Starting AI face verification...');
        
        // Get reference photo dari biometric
        const { data: biometric } = await fetch('/api/attendance/biometric/setup').then(r => r.json());
        
        if (!biometric || !biometric.referencePhotoUrl) {
          throw new Error('Reference photo not found');
        }
        
        // Convert photoBlob to base64 for AI analysis
        const photoBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;
            resolve(base64.split(',')[1]); // Remove data:image/jpeg;base64, prefix
          };
          reader.readAsDataURL(photoBlob);
        });
        
        console.log('[AI Verify] 🤖 Using Gemini Vision for ultra-accurate verification...');
        console.log('[AI Verify] Reference photo:', biometric.referencePhotoUrl.substring(0, 50) + '...');
        console.log('[AI Verify] Live selfie:', (photoBase64.length / 1024).toFixed(2), 'KB base64');
        
        const aiResponse = await fetch('/api/ai/verify-face', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            liveSelfieBase64: photoBase64,
            referencePhotoUrl: biometric.referencePhotoUrl,
            userId: session!.user.id
          }),
        });

        const aiData = await aiResponse.json();
        
        toast.dismiss(aiToast);
        
        console.log('[AI Verify] 🤖 Gemini result:', aiData);

        if (!aiData.success || !aiData.verified) {
          console.error('[AI Verify] ❌ Face verification failed:', aiData.reasons || aiData.error);
          
          // Show detailed error with reasoning
          const errorMsg = aiData.data?.reasoning 
            ? `🤖 Verifikasi AI Gagal:\n\n${aiData.data.reasoning}\n\n${aiData.reasons?.join('\n') || ''}`
            : aiData.reasons 
              ? `🤖 Verifikasi AI gagal:\n${aiData.reasons.join('\n')}`
              : aiData.error || 'Verifikasi wajah gagal';
          
          toast.error(
            <div className="max-w-md">
              <div className="font-bold text-lg mb-2">❌ Verifikasi Wajah Gagal</div>
              <div className="text-sm space-y-2">
                {aiData.data?.details?.warnings?.map((warn: string, i: number) => (
                  <div key={i}>⚠️ {warn}</div>
                ))}
                {aiData.reasons?.map((reason: string, i: number) => (
                  <div key={i}>• {reason}</div>
                ))}
              </div>
              {aiData.data?.details?.livenessIndicators && (
                <div className="mt-3 text-xs opacity-75">
                  <div className="font-semibold mb-1">Liveness Check:</div>
                  {aiData.data.details.livenessIndicators.screenDetected && <div>📱 Screen detected</div>}
                  {aiData.data.details.livenessIndicators.printDetected && <div>📄 Print detected</div>}
                  {aiData.data.details.livenessIndicators.maskDetected && <div>😷 Mask detected</div>}
                  {aiData.data.details.livenessIndicators.deepfakeDetected && <div>🎭 Deepfake detected</div>}
                </div>
              )}
              <div className="mt-3 text-xs">
                Confidence: {(aiData.data?.confidence * 100 || 0).toFixed(1)}%
              </div>
            </div>,
            { 
              duration: 12000,
              style: {
                maxWidth: '600px',
                padding: '20px'
              }
            }
          );
          
          setLoading(false);
          setStep('capture');
          return;
        }
        
        console.log('[AI Verify] ✅ Gemini verification PASSED!');
        console.log('[AI Verify] 📊 Match score:', (aiData.data.matchScore * 100).toFixed(1) + '%');
        console.log('[AI Verify] 📊 Confidence:', (aiData.data.confidence * 100).toFixed(1) + '%');
        console.log('[AI Verify] 👤 Liveness:', aiData.data.isLive ? 'REAL PERSON' : 'FAKE');
        
        toast.success(
          <div>
            <div className="font-bold text-lg mb-2">✅ Verifikasi AI Berhasil!</div>
            <div className="text-sm space-y-1">
              <div>🎯 Match: {(aiData.data.matchScore * 100).toFixed(0)}%</div>
              <div>💯 Confidence: {(aiData.data.confidence * 100).toFixed(0)}%</div>
              <div>👤 Liveness: {aiData.data.isLive ? '✅ Real Person' : '❌ Fake'}</div>
              <div className="text-xs opacity-75 mt-2">Powered by Gemini Vision AI</div>
            </div>
          </div>,
          { duration: 5000 }
        );
        
        // Store AI verification result
        setAiVerification(aiData.data);
        
      } catch (aiError: any) {
        toast.dismiss(aiToast);
        console.error('[AI Verify] ⚠️ AI verification error (non-fatal):', aiError);
        
        // AI verification gagal, tapi bisa lanjut (optional verification)
        toast('⚠️ AI verification unavailable, using fallback security checks', {
          duration: 3000,
          icon: '⚠️'
        });
      }
      
      // Submit attendance
      const submitToast = toast.loading('💾 Menyimpan data absensi...');
      
      // Get network connection info for enhanced security
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      
      const payload = {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        locationAccuracy: locationData.accuracy,
        photoSelfieUrl: photoUrl,
        fingerprintHash,
        wifiSSID: wifiSSID.trim(),
        wifiBSSID: networkInfo?.bssid || undefined,
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
        },
        networkInfo: {
          ipAddress: networkInfo?.ipAddress,
          macAddress: networkInfo?.macAddress,
          networkType: connection?.type || connection?.effectiveType,
          downlink: connection?.downlink,
          effectiveType: connection?.effectiveType,
        },
        // Include AI verification result for dashboard sync
        aiVerification: aiVerification ? {
          verified: true,
          matchScore: aiVerification.matchScore,
          confidence: aiVerification.confidence,
          isLive: aiVerification.isLive,
          provider: aiVerification.aiProvider || 'gemini-vision',
        } : undefined,
      };
      
      console.log('📤 Submitting attendance with payload:', {
        ...payload,
        photoSelfieUrl: photoUrl.substring(0, 50) + '...',
        networkInfo: payload.networkInfo,
      });
      
      const response = await fetch('/api/attendance/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      toast.dismiss(submitToast);
      
      console.log('📥 Attendance response:', data);

      if (!response.ok) {
        if (data.requireSetup) {
          setStep('setup');
          toast.error('Silakan setup biometric terlebih dahulu');
          return;
        }
        console.error('❌ Submit failed:', data.error);
        throw new Error(data.error || 'Submit gagal');
      }

      console.log('✅ Attendance submitted successfully!');
      
      toast.success(data.message || '🎉 Absensi berhasil!', {
        duration: 5000,
        icon: '✅',
      });
      
      setTodayAttendance(data.data);
      setPhotoBlob(null);
      setPhotoPreview('');
      setStep('ready');
    } catch (error: any) {
      console.error('❌ Submit attendance error:', error);
      toast.error(error.message || 'Gagal submit absensi');
      setStep('ready');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  const userRole = (session?.user.role || '').toLowerCase();
  const isAllowed = ['siswa', 'guru'].includes(userRole);

  if (!isAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full border-2 border-red-200 dark:border-red-700">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaLock className="text-4xl text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Akses Ditolak</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Halaman ini hanya dapat diakses oleh <strong>Siswa</strong> dan <strong>Guru</strong>.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Role Anda: <span className="font-semibold text-red-600">{session?.user.role || 'Unknown'}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-3 sm:p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-6 border-2 border-blue-100 dark:border-gray-700">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
              <FaFingerprint className="text-2xl sm:text-3xl text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate">Absensi {userRole === 'siswa' ? 'Siswa' : 'Guru'}</h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Sistem Absensi Biometrik & Lokasi</p>
            </div>
          </div>
        </div>

        {/* Today's Attendance Status */}
        {todayAttendance && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-700 rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <FaCheckCircle className="text-2xl sm:text-3xl text-green-600 flex-shrink-0" />
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-green-900 dark:text-green-100 truncate">Sudah Absen Hari Ini</h3>
                <p className="text-xs sm:text-sm text-green-700 dark:text-green-300">
                  {todayAttendance.check_out_time ? 'Check-in & Check-out lengkap' : 'Menunggu check-out'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-xs sm:text-sm text-green-700 dark:text-green-400 font-semibold">Check-in:</p>
                <p className="text-sm sm:text-base text-green-900 dark:text-green-100 break-words">{formatAttendanceTime(todayAttendance.check_in_time)}</p>
              </div>
              {todayAttendance.check_out_time && (
                <div>
                  <p className="text-xs sm:text-sm text-green-700 dark:text-green-400 font-semibold">Check-out:</p>
                  <p className="text-sm sm:text-base text-green-900 dark:text-green-100 break-words">{formatAttendanceTime(todayAttendance.check_out_time)}</p>
                </div>
              )}
            </div>
            {!todayAttendance.check_out_time && (
              <button
                onClick={() => {
                  setStep('capture');
                  setPhotoBlob(null);
                  setPhotoPreview('');
                }}
                className="mt-3 sm:mt-4 w-full px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm sm:text-base font-semibold rounded-xl hover:shadow-xl transition-all active:scale-95"
              >
                Check-out Sekarang
              </button>
            )}
          </div>
        )}

        {/* Requirements Check */}
        {step === 'check' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 border-2 border-gray-200 dark:border-gray-700">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">Pengecekan Persyaratan</h2>
            <div className="space-y-3 sm:space-y-4">
              {[
                { key: 'role', label: 'Role Valid (Siswa/Guru)', icon: FaCheckCircle },
                { key: 'biometric', label: 'Data Biometrik Terdaftar', icon: FaFingerprint },
                { key: 'wifi', label: 'Terhubung ke Jaringan', icon: FaWifi },
                { key: 'location', label: 'Lokasi Terdeteksi', icon: FaMapMarkerAlt },
              ].map((req) => (
                <div
                  key={req.key}
                  className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl ${
                    requirements[req.key as keyof typeof requirements]
                      ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700'
                      : 'bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-700'
                  }`}
                >
                  <req.icon
                    className={`text-xl sm:text-2xl flex-shrink-0 ${
                      requirements[req.key as keyof typeof requirements]
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  />
                  <span className="flex-1 text-sm sm:text-base font-semibold text-gray-900 dark:text-white">{req.label}</span>
                  {requirements[req.key as keyof typeof requirements] ? (
                    <span className="text-green-600 font-bold text-lg">✓</span>
                  ) : (
                    <span className="text-red-600 font-bold text-lg">✗</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Biometric Setup */}
        {step === 'setup' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 border-2 border-orange-200 dark:border-orange-700">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">Setup Biometric Pertama Kali</h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4 sm:mb-6">
              Anda perlu mendaftarkan foto selfie dan sidik jari browser untuk verifikasi absensi.
            </p>

            {!photoPreview ? (
              <button
                onClick={handleCapturePhoto}
                disabled={loading}
                className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm sm:text-base font-semibold rounded-xl hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-50"
              >
                <FaCamera className="text-lg sm:text-xl" />
                {loading ? 'Mengambil Foto...' : 'Ambil Foto Selfie'}
              </button>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                <img src={photoPreview} alt="Selfie" className="w-full rounded-xl shadow-lg" />
                <div className="flex gap-2 sm:gap-3">
                  <button
                    onClick={() => {
                      setPhotoBlob(null);
                      setPhotoPreview('');
                    }}
                    className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm sm:text-base font-semibold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all active:scale-95"
                  >
                    Ambil Ulang
                  </button>
                  <button
                    onClick={handleSetupBiometric}
                    disabled={loading}
                    className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm sm:text-base font-semibold rounded-xl hover:shadow-xl transition-all active:scale-95 disabled:opacity-50"
                  >
                    {loading ? 'Menyimpan...' : 'Daftar Biometric'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Ready to Attend */}
        {step === 'ready' && !todayAttendance && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 border-2 border-blue-200 dark:border-blue-700">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">Siap Absen</h2>
            
            {/* WiFi Input */}
            <div className="mb-4 sm:mb-6">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                <FaWifi className="inline mr-2" />
                Nama WiFi Sekolah
              </label>
              <input
                type="text"
                value={wifiSSID}
                onChange={(e) => setWifiSSID(e.target.value)}
                placeholder="Contoh: SMK-INFORMATIKA"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all outline-none text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Masukkan nama WiFi sekolah yang sedang Anda gunakan
              </p>
            </div>

            {/* Location Info */}
            {locationData && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                <p className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                  <FaMapMarkerAlt /> Lokasi Terdeteksi
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1 break-all">
                  Lat: {locationData.latitude.toFixed(6)}, Lon: {locationData.longitude.toFixed(6)}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Akurasi: {locationData.accuracy.toFixed(0)} meter
                </p>
              </div>
            )}

            {/* Security Validation Success Info */}
            {securityValidation && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 rounded-xl p-4 mb-4 sm:mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg">✓</span>
                  </div>
                  <div>
                    <p className="font-bold text-green-900 dark:text-green-100">Keamanan Tervalidasi</p>
                    <p className="text-xs text-green-700 dark:text-green-300">Silakan lanjut ambil foto</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-2">
                    <p className="text-gray-500 dark:text-gray-400">Security Score</p>
                    <p className="font-bold text-green-600">{securityValidation.securityScore}/100</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-2">
                    <p className="text-gray-500 dark:text-gray-400">Jarak</p>
                    <p className="font-bold text-blue-600">{securityValidation.distance}m</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-2">
                    <p className="text-gray-500 dark:text-gray-400">WiFi</p>
                    <p className="font-bold text-indigo-600 truncate">{securityValidation.wifiSSID}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-2">
                    <p className="text-gray-500 dark:text-gray-400">Type</p>
                    <p className="font-bold text-purple-600">{securityValidation.attendanceType}</p>
                  </div>
                </div>
                {securityValidation.warnings && securityValidation.warnings.length > 0 && (
                  <div className="mt-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-2">
                    <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-200">⚠️ Peringatan:</p>
                    <ul className="text-xs text-yellow-700 dark:text-yellow-300 mt-1 list-disc list-inside">
                      {securityValidation.warnings.map((warning: string, i: number) => (
                        <li key={i}>{warning === 'NEAR_BOUNDARY' ? 'Anda mendekati batas radius sekolah' : warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={async () => {
                // SECURITY VALIDATION FIRST
                const isValid = await validateSecurity();
                if (isValid) {
                  setStep('capture');
                }
              }}
              disabled={validating || !wifiSSID.trim() || !locationData}
              className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 sm:gap-3 text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {validating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Memvalidasi Keamanan...
                </>
              ) : (
                <>
                  <FaCamera className="text-xl sm:text-2xl" />
                  Lanjut Ambil Foto & Absen
                </>
              )}
            </button>
          </div>
        )}

        {/* Capture Photo & Submit */}
        {step === 'capture' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 border-2 border-green-200 dark:border-green-700">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">Foto Verifikasi</h2>

            {!photoPreview ? (
              <button
                onClick={handleCapturePhoto}
                disabled={loading}
                className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm sm:text-base font-semibold rounded-xl hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-50"
              >
                <FaCamera className="text-lg sm:text-xl" />
                {loading ? 'Mengambil Foto...' : 'Ambil Foto Selfie'}
              </button>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                <img src={photoPreview} alt="Selfie" className="w-full rounded-xl shadow-lg" />
                <div className="flex gap-2 sm:gap-3">
                  <button
                    onClick={() => {
                      setPhotoBlob(null);
                      setPhotoPreview('');
                    }}
                    className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm sm:text-base font-semibold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all active:scale-95"
                  >
                    Ambil Ulang
                  </button>
                  <button
                    onClick={handleSubmitAttendance}
                    disabled={loading}
                    className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm sm:text-base font-semibold rounded-xl hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <FaCheckCircle />
                    {loading ? 'Mengirim...' : 'Submit Absensi'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submitting */}
        {step === 'submitting' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center border-2 border-blue-200 dark:border-blue-700">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-900 dark:text-white font-semibold text-lg">Memproses absensi...</p>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-2">Mohon tunggu sebentar</p>
          </div>
        )}

        {/* Warning Info */}
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-2xl p-4 sm:p-6 mt-4 sm:mt-6">
          <h3 className="font-bold text-yellow-800 dark:text-yellow-200 mb-2 sm:mb-3 flex items-center gap-2 text-base sm:text-lg">
            <FaExclamationTriangle />
            Perhatian
          </h3>
          <ul className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-300 space-y-1.5 sm:space-y-2 list-disc list-inside">
            <li>Pastikan Anda terhubung ke <strong>WiFi sekolah</strong></li>
            <li>Pastikan <strong>lokasi/GPS</strong> aktif dan akurat</li>
            <li>Foto selfie akan digunakan untuk <strong>verifikasi identitas</strong></li>
            <li>Absensi hanya dapat dilakukan di <strong>area sekolah</strong></li>
            <li>Data absensi akan tercatat dan dapat dilihat oleh admin</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
