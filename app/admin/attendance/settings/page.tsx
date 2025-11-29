'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaWifi, FaSave, FaPlus, FaTimes, FaCheckCircle, FaQrcode } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';

interface SchoolConfig {
  id?: number;
  location_name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  allowed_wifi_ssids: string[];
  is_active: boolean;
}

export default function AttendanceSettingsPage() {
  const { data: session, status } = useSession();
  const [config, setConfig] = useState<SchoolConfig>({
    location_name: '',
    latitude: 0,
    longitude: 0,
    radius_meters: 100,
    allowed_wifi_ssids: [],
    is_active: true,
  });
  const [newSSID, setNewSSID] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/admin/login');
    }
  }, [status]);

  useEffect(() => {
    if (session?.user) {
      const userRole = (session.user.role || '').toLowerCase();
      if (!['super_admin', 'admin', 'osis'].includes(userRole)) {
        redirect('/dashboard');
      } else {
        fetchConfig();
      }
    }
  }, [session]);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/attendance/config', {
        cache: 'no-store',
      });
      const data = await response.json();

      console.log('Fetched config:', data);

      if (data.success && data.data) {
        setConfig(data.data);
      } else {
        console.log('No existing config, using defaults');
      }
    } catch (error) {
      console.error('Fetch config error:', error);
      toast.error('Gagal memuat konfigurasi');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    console.log('=== SAVE CONFIG DEBUG ===');
    console.log('Config state:', config);
    
    // Validasi
    if (!config.location_name || !config.location_name.trim()) {
      toast.error('Nama lokasi harus diisi');
      return;
    }

    if (config.latitude === 0 || config.longitude === 0) {
      toast.error('Koordinat GPS harus diisi (klik "Gunakan Lokasi Saat Ini" atau isi manual)');
      return;
    }

    if (!config.radius_meters || config.radius_meters < 50) {
      toast.error('Radius minimal 50 meter');
      return;
    }

    if (config.allowed_wifi_ssids.length === 0) {
      toast.error('Minimal 1 WiFi SSID harus ditambahkan');
      return;
    }

    setSaving(true);
    const loadingToast = toast.loading('Menyimpan konfigurasi...');
    
    try {
      const payload = {
        location_name: config.location_name.trim(),
        latitude: Number(config.latitude),
        longitude: Number(config.longitude),
        radius_meters: Number(config.radius_meters),
        allowed_wifi_ssids: config.allowed_wifi_ssids,
        is_active: true,
      };
      
      console.log('Payload to send:', payload);

      const response = await fetch('/api/admin/attendance/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('Response:', data);

      toast.dismiss(loadingToast);

      if (data.success) {
        toast.success('✅ Konfigurasi berhasil disimpan!');
        await fetchConfig(); // Reload data
      } else {
        throw new Error(data.error || 'Gagal menyimpan');
      }
    } catch (error: any) {
      console.error('Save error:', error);
      toast.dismiss(loadingToast);
      toast.error(error.message || 'Gagal menyimpan konfigurasi');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSSID = () => {
    if (!newSSID.trim()) {
      toast.error('SSID tidak boleh kosong');
      return;
    }

    if (config.allowed_wifi_ssids.includes(newSSID.trim())) {
      toast.error('SSID sudah ada dalam daftar');
      return;
    }

    setConfig({
      ...config,
      allowed_wifi_ssids: [...config.allowed_wifi_ssids, newSSID.trim()],
    });
    setNewSSID('');
    toast.success('SSID ditambahkan');
  };

  const handleRemoveSSID = (ssid: string) => {
    setConfig({
      ...config,
      allowed_wifi_ssids: config.allowed_wifi_ssids.filter((s) => s !== ssid),
    });
    toast.success('SSID dihapus');
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation tidak didukung browser');
      return;
    }

    const loadingToast = toast.loading('Mendapatkan lokasi Anda...');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        console.log('GPS Location:', { lat, lon });
        
        setConfig((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lon,
        }));
        
        toast.dismiss(loadingToast);
        toast.success(`✅ Lokasi didapat! (${lat.toFixed(6)}, ${lon.toFixed(6)})`);
      },
      (error) => {
        toast.dismiss(loadingToast);
        let errorMessage = 'Gagal mendapatkan lokasi';
        
        console.error('Geolocation error:', error);
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Izin lokasi ditolak. Silakan aktifkan di pengaturan browser.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Informasi lokasi tidak tersedia.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Permintaan lokasi timeout. Coba lagi.';
            break;
        }
        
        toast.error(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Memuat konfigurasi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border-2 border-blue-100 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <FaMapMarkerAlt className="text-2xl text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Konfigurasi Absensi</h1>
              <p className="text-gray-600 dark:text-gray-300">Setup lokasi sekolah dan WiFi yang diizinkan</p>
            </div>
          </div>
        </div>

        {/* Location Config */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border-2 border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <FaMapMarkerAlt className="text-blue-600" />
            Lokasi Sekolah
          </h2>

          <div className="space-y-4">
            {/* Location Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                Nama Lokasi
              </label>
              <input
                type="text"
                value={config.location_name}
                onChange={(e) => setConfig({ ...config, location_name: e.target.value })}
                placeholder="Contoh: SMK Fithrah Insani"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all outline-none text-gray-900 dark:text-white"
              />
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={config.latitude}
                  onChange={(e) => setConfig({ ...config, latitude: parseFloat(e.target.value) })}
                  placeholder="-6.xxxxx"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all outline-none text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={config.longitude}
                  onChange={(e) => setConfig({ ...config, longitude: parseFloat(e.target.value) })}
                  placeholder="106.xxxxx"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all outline-none text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Get Current Location Button */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-700 rounded-xl p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaMapMarkerAlt className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-green-900 dark:text-green-100 mb-1">
                    Auto-Detect Lokasi
                  </h3>
                  <p className="text-xs text-green-700 dark:text-green-300 mb-3">
                    Klik tombol di bawah untuk otomatis mendapatkan koordinat GPS lokasi Anda saat ini. Pastikan GPS aktif dan browser memiliki izin lokasi.
                  </p>
                  <button
                    onClick={getCurrentLocation}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    <FaMapMarkerAlt />
                    Gunakan Lokasi Saat Ini
                  </button>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-600 dark:text-gray-300 font-semibold mb-1">
                  📍 Tips:
                </p>
                <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1 list-disc list-inside">
                  <li>Pastikan Anda berada di area sekolah saat mengklik tombol</li>
                  <li>GPS lebih akurat di outdoor (area terbuka)</li>
                  <li>Jika gagal, coba refresh halaman dan coba lagi</li>
                  <li>Atau masukkan koordinat manual dari Google Maps</li>
                </ul>
              </div>
            </div>

            {/* Radius */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                Radius (meter)
              </label>
              <input
                type="number"
                value={config.radius_meters}
                onChange={(e) => setConfig({ ...config, radius_meters: parseInt(e.target.value) })}
                placeholder="100"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all outline-none text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Jarak maksimum dari titik koordinat untuk absensi valid (rekomendasi: 100-200 meter)
              </p>
            </div>

            {/* Preview Location */}
            {config.latitude !== 0 && config.longitude !== 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4">
                <p className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-2">Preview Lokasi:</p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Koordinat: {config.latitude.toFixed(6)}, {config.longitude.toFixed(6)}
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Radius: {config.radius_meters} meter dari titik ini
                </p>
                <a
                  href={`https://www.google.com/maps?q=${config.latitude},${config.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 underline mt-2 inline-block"
                >
                  Lihat di Google Maps →
                </a>
              </div>
            )}
          </div>
        </div>

        {/* WiFi Config */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border-2 border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <FaWifi className="text-blue-600" />
            WiFi yang Diizinkan
          </h2>

          {/* Add SSID */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newSSID}
              onChange={(e) => setNewSSID(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddSSID()}
              placeholder="Masukkan nama WiFi (SSID)"
              className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all outline-none text-gray-900 dark:text-white"
            />
            <button
              onClick={handleAddSSID}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-xl transition-all flex items-center gap-2"
            >
              <FaPlus />
              Tambah
            </button>
          </div>

          {/* SSID List */}
          {config.allowed_wifi_ssids.length === 0 ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-700 rounded-xl p-4 text-center">
              <p className="text-yellow-800 dark:text-yellow-200 font-semibold">
                Belum ada WiFi yang ditambahkan
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                Minimal 1 SSID WiFi harus ditambahkan untuk validasi absensi
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {config.allowed_wifi_ssids.map((ssid, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <FaCheckCircle className="text-green-600" />
                    <span className="font-semibold text-gray-900 dark:text-white">{ssid}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveSSID(ssid)}
                    className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-all"
                  >
                    <FaTimes />
                  </button>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            💡 Tips: Tambahkan semua WiFi sekolah yang mungkin digunakan siswa/guru (WiFi kantor, WiFi lab, WiFi kelas, dll)
          </p>
        </div>

        {/* Save Button */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border-2 border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-bold rounded-xl hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <FaSave className="text-xl" />
            {saving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
          </button>
        </div>

        {/* QR Code for Attendance Link */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl shadow-xl p-6 border-2 border-indigo-200 dark:border-indigo-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FaQrcode className="text-indigo-600" />
            QR Code Link Absensi
          </h2>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Scan QR code ini untuk langsung ke halaman absensi
            </p>
            
            <div className="inline-block p-4 bg-white rounded-xl shadow-lg">
              <QRCodeSVG
                value={typeof window !== 'undefined' ? `${window.location.origin}/attendance` : 'https://webosis.vercel.app/attendance'}
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>
            
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
                {typeof window !== 'undefined' ? `${window.location.origin}/attendance` : 'https://webosis.vercel.app/attendance'}
              </p>
            </div>
            
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              💡 Bagikan QR code ini kepada siswa dan guru untuk akses mudah ke halaman absensi
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-2xl p-6">
          <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-3 text-lg">
            ℹ️ Informasi Penting
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2 list-disc list-inside">
            <li>Koordinat GPS dapat dilihat di Google Maps (klik kanan → koordinat)</li>
            <li>Radius menentukan area valid untuk absensi (rekomendasi: 100-200 meter)</li>
            <li>WiFi SSID harus sama persis dengan nama WiFi yang muncul di perangkat</li>
            <li>Perubahan konfigurasi akan langsung berlaku untuk absensi berikutnya</li>
            <li>Siswa/guru harus terhubung ke salah satu WiFi yang terdaftar DAN berada dalam radius lokasi</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
