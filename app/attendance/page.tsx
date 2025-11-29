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
  capturePhotoFromWebcam,
  uploadAttendancePhoto,
  formatAttendanceTime,
} from '@/lib/attendance/utils';

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
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login');
    }
  }, [status]);

  useEffect(() => {
    if (session?.user) {
      checkAllRequirements();
    }
  }, [session]);

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

    // 3. Check WiFi
    const wifiCheck = await checkWiFiConnection();
    setRequirements(prev => ({ ...prev, wifi: wifiCheck.connected }));

    // 4. Check location
    const location = await getUserLocation();
    if (location) {
      setLocationData(location);
      setRequirements(prev => ({ ...prev, location: true }));
    }

    // 5. Generate fingerprint
    const fingerprint = await generateBrowserFingerprint();
    setFingerprintHash(fingerprint);

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

  const handleSetupBiometric = async () => {
    if (!photoBlob || !fingerprintHash) {
      toast.error('Silakan ambil foto selfie terlebih dahulu');
      return;
    }

    setLoading(true);
    try {
      // Upload foto
      const photoUrl = await uploadAttendancePhoto(photoBlob, session!.user.id!);

      // Setup biometric
      const response = await fetch('/api/attendance/biometric/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referencePhotoUrl: photoUrl,
          fingerprintTemplate: fingerprintHash,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Setup gagal');
      }

      toast.success('Biometric berhasil didaftarkan!');
      setHasSetup(true);
      setRequirements(prev => ({ ...prev, biometric: true }));
      setStep('ready');
    } catch (error: any) {
      toast.error(error.message || 'Gagal setup biometric');
    } finally {
      setLoading(false);
    }
  };

  const handleCapturePhoto = async () => {
    setLoading(true);
    try {
      const blob = await capturePhotoFromWebcam();
      if (!blob) {
        throw new Error('Gagal mengambil foto');
      }

      setPhotoBlob(blob);
      setPhotoPreview(URL.createObjectURL(blob));
      setShowCamera(false);
      toast.success('Foto berhasil diambil');
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengambil foto');
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

    try {
      // Upload foto attendance
      const photoUrl = await uploadAttendancePhoto(photoBlob, session!.user.id!);

      // Submit attendance
      const response = await fetch('/api/attendance/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          locationAccuracy: locationData.accuracy,
          photoSelfieUrl: photoUrl,
          fingerprintHash,
          wifiSSID: wifiSSID.trim(),
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.requireSetup) {
          setStep('setup');
          toast.error('Silakan setup biometric terlebih dahulu');
          return;
        }
        throw new Error(data.error || 'Submit gagal');
      }

      toast.success(data.message || 'Absensi berhasil!');
      setTodayAttendance(data.data);
      setPhotoBlob(null);
      setPhotoPreview('');
      setStep('ready');
    } catch (error: any) {
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

            <button
              onClick={() => setStep('capture')}
              className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 sm:gap-3 text-base sm:text-lg"
            >
              <FaCamera className="text-xl sm:text-2xl" />
              Lanjut Ambil Foto & Absen
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
