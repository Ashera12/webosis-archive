'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaWifi, FaSave, FaPlus, FaTimes, FaCheckCircle, FaQrcode, FaHistory, FaUndo, FaToggleOn, FaToggleOff, FaTrash, FaEdit } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';

interface WiFiNetwork {
  ssid: string;
  bssid?: string; // MAC address
  security_type?: string;
  frequency?: string;
  notes?: string;
}

interface NetworkConfig {
  // IP Validation
  allowed_ip_ranges?: string[]; // ["192.168.1.0/24", "10.0.0.0/24"]
  required_subnet?: string; // "192.168.1" or "10.0.0"
  enable_ip_validation?: boolean;
  enable_webrtc_detection?: boolean;
  enable_private_ip_check?: boolean;
  enable_subnet_matching?: boolean;
  
  // Network Security
  network_security_level?: 'low' | 'medium' | 'high' | 'strict';
  allowed_connection_types?: string[]; // ["wifi", "ethernet", "cellular"]
  min_network_quality?: 'excellent' | 'good' | 'fair' | 'poor';
  
  // MAC Address
  enable_mac_address_validation?: boolean;
  allowed_mac_addresses?: string[]; // MAC address whitelist
  
  // Security Features
  block_vpn?: boolean;
  block_proxy?: boolean;
  enable_network_quality_check?: boolean;
}

interface SchoolConfig extends NetworkConfig {
  id?: number;
  location_name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  allowed_wifi_ssids: string[]; // Legacy support
  wifi_networks?: WiFiNetwork[]; // New structure
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function AttendanceSettingsPage() {
  const { data: session, status } = useSession();
  const [config, setConfig] = useState<SchoolConfig>({
    location_name: '',
    latitude: 0,
    longitude: 0,
    radius_meters: 100,
    allowed_wifi_ssids: [],
    wifi_networks: [],
    is_active: true,
    // Network Monitoring defaults
    enable_ip_validation: false,
    enable_webrtc_detection: true,
    enable_private_ip_check: true,
    enable_subnet_matching: false,
    network_security_level: 'medium',
    allowed_connection_types: ['wifi'],
    min_network_quality: 'fair',
    enable_mac_address_validation: false,
    block_vpn: false,
    block_proxy: false,
    enable_network_quality_check: true,
    allowed_ip_ranges: [],
    required_subnet: '',
    allowed_mac_addresses: [],
  });
  const [configHistory, setConfigHistory] = useState<SchoolConfig[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showWiFiForm, setShowWiFiForm] = useState(false);
  const [editingWiFiIndex, setEditingWiFiIndex] = useState<number | null>(null);
  const [newWiFi, setNewWiFi] = useState<WiFiNetwork>({
    ssid: '',
    bssid: '',
    security_type: 'WPA2',
    frequency: '2.4GHz',
    notes: '',
  });
  const [newSSID, setNewSSID] = useState(''); // Legacy simple mode
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

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/admin/attendance/config?history=true', {
        cache: 'no-store',
      });
      const data = await response.json();

      if (data.success && data.data) {
        setConfigHistory(data.data);
      }
    } catch (error) {
      console.error('Fetch history error:', error);
      toast.error('Gagal memuat riwayat konfigurasi');
    }
  };

  const handleRestoreBackup = async (configId: number) => {
    if (!confirm('Yakin ingin memulihkan konfigurasi ini?')) {
      return;
    }

    const loadingToast = toast.loading('Memulihkan konfigurasi...');
    
    try {
      const response = await fetch('/api/admin/attendance/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configId, action: 'restore' }),
      });

      const data = await response.json();
      toast.dismiss(loadingToast);

      if (data.success) {
        toast.success('✅ Konfigurasi berhasil dipulihkan!');
        await fetchConfig();
        await fetchHistory();
        setShowHistory(false);
      } else {
        throw new Error(data.error || 'Gagal memulihkan');
      }
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.message || 'Gagal memulihkan konfigurasi');
    }
  };

  const handleToggleActive = async (configId: number, currentStatus: boolean) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    const loadingToast = toast.loading(currentStatus ? 'Menonaktifkan...' : 'Mengaktifkan...');
    
    try {
      const response = await fetch('/api/admin/attendance/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configId, action }),
      });

      const data = await response.json();
      toast.dismiss(loadingToast);

      if (data.success) {
        toast.success(`✅ ${data.message}`);
        await fetchConfig();
        await fetchHistory();
      } else {
        throw new Error(data.error || 'Gagal mengubah status');
      }
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.message || 'Gagal mengubah status');
    }
  };

  const handleDeleteConfig = async (configId: number) => {
    if (!confirm('⚠️ PERHATIAN: Konfigurasi akan dihapus permanen!\n\nYakin ingin menghapus?')) {
      return;
    }

    const loadingToast = toast.loading('Menghapus konfigurasi...');
    
    try {
      const response = await fetch(`/api/admin/attendance/config?id=${configId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      toast.dismiss(loadingToast);

      if (data.success) {
        toast.success('✅ Konfigurasi berhasil dihapus!');
        await fetchHistory();
      } else {
        throw new Error(data.error || 'Gagal menghapus');
      }
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.message || 'Gagal menghapus konfigurasi');
    }
  };

  const handleAddWiFi = () => {
    if (!newWiFi.ssid.trim()) {
      toast.error('SSID tidak boleh kosong');
      return;
    }

    const wifiNetworks = config.wifi_networks || [];
    
    // Check duplicate SSID
    if (wifiNetworks.some(w => w.ssid === newWiFi.ssid.trim())) {
      toast.error('WiFi dengan SSID ini sudah ada');
      return;
    }

    setConfig({
      ...config,
      wifi_networks: [...wifiNetworks, { ...newWiFi, ssid: newWiFi.ssid.trim() }],
      allowed_wifi_ssids: [...config.allowed_wifi_ssids, newWiFi.ssid.trim()], // Legacy support
    });

    // Reset form
    setNewWiFi({
      ssid: '',
      bssid: '',
      security_type: 'WPA2',
      frequency: '2.4GHz',
      notes: '',
    });
    setShowWiFiForm(false);
    toast.success('WiFi ditambahkan');
  };

  const handleRemoveWiFi = (index: number) => {
    const wifiNetworks = config.wifi_networks || [];
    const removedSSID = wifiNetworks[index].ssid;
    
    setConfig({
      ...config,
      wifi_networks: wifiNetworks.filter((_, i) => i !== index),
      allowed_wifi_ssids: config.allowed_wifi_ssids.filter(s => s !== removedSSID),
    });
    toast.success('WiFi dihapus');
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

    if (config.allowed_wifi_ssids.length === 0 && (!config.wifi_networks || config.wifi_networks.length === 0)) {
      toast.error('Minimal 1 WiFi harus ditambahkan');
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
      console.log('Save Response:', data);

      toast.dismiss(loadingToast);

      if (data.success) {
        // Show success message with info about update vs create
        const isUpdate = config.id ? true : false;
        const successMessage = data.message || (isUpdate ? 'Konfigurasi berhasil diperbarui!' : 'Konfigurasi berhasil disimpan!');
        
        // Enhanced success notification
        toast.success(
          <div>
            <div className="font-bold">✅ {successMessage}</div>
            <div className="text-sm mt-1">
              📍 {payload.location_name} • {payload.radius_meters}m • {payload.allowed_wifi_ssids.length} WiFi
            </div>
          </div>,
          { duration: 5000 }
        );

        // Reload current config
        await fetchConfig();
        
        // Also fetch history to show in list
        await fetchHistory();
        
        // Auto-open history to show the saved config
        setTimeout(() => {
          setShowHistory(true);
        }, 500);
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
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <FaMapMarkerAlt className="text-2xl text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Konfigurasi Absensi</h1>
                <p className="text-gray-600 dark:text-gray-300">Setup lokasi sekolah dan WiFi yang diizinkan</p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowHistory(!showHistory);
                if (!showHistory) fetchHistory();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all"
            >
              <FaHistory />
              <span className="hidden sm:inline">Riwayat</span>
            </button>
          </div>
        </div>

        {/* History Modal */}
        {showHistory && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border-2 border-purple-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FaHistory className="text-purple-600" />
                Riwayat Konfigurasi
              </h2>
              <button
                onClick={() => setShowHistory(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FaTimes className="text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            {configHistory.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Belum ada riwayat konfigurasi
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {configHistory.map((cfg) => (
                  <div
                    key={cfg.id}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      cfg.is_active
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-gray-900 dark:text-white">
                            {cfg.location_name}
                          </h3>
                          {cfg.is_active && (
                            <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                              Aktif
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                          <p>📍 Lat: {cfg.latitude.toFixed(6)}, Lon: {cfg.longitude.toFixed(6)}</p>
                          <p>📏 Radius: {cfg.radius_meters}m</p>
                          <p>📶 WiFi: {cfg.allowed_wifi_ssids.join(', ')}</p>
                          {cfg.created_at && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              Dibuat: {new Date(cfg.created_at).toLocaleString('id-ID')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {cfg.is_active ? (
                          <button
                            onClick={() => handleToggleActive(cfg.id!, true)}
                            className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                            title="Nonaktifkan"
                          >
                            <FaToggleOff />
                            <span className="hidden sm:inline">Nonaktifkan</span>
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleToggleActive(cfg.id!, false)}
                              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                              title="Aktifkan"
                            >
                              <FaToggleOn />
                              <span className="hidden sm:inline">Aktifkan</span>
                            </button>
                            <button
                              onClick={() => handleRestoreBackup(cfg.id!)}
                              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                              title="Pulihkan"
                            >
                              <FaUndo />
                              <span className="hidden sm:inline">Pulihkan</span>
                            </button>
                            {session?.user?.role === 'super_admin' && (
                              <button
                                onClick={() => handleDeleteConfig(cfg.id!)}
                                className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                                title="Hapus Permanen"
                              >
                                <FaTrash />
                                <span className="hidden sm:inline">Hapus</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Location Config */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border-2 border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FaMapMarkerAlt className="text-blue-600" />
              Lokasi Sekolah
            </h2>
            {config.id && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                  <FaCheckCircle className="text-green-600" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    ✓ Config Tersimpan (ID: {config.id})
                  </span>
                </div>
                {config.is_active && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                    <FaToggleOn className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Status: AKTIF
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Current Config Summary */}
          {config.id && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-700 rounded-xl p-4 mb-4">
              <h3 className="font-bold text-green-900 dark:text-green-100 mb-3 flex items-center gap-2">
                <FaCheckCircle className="text-green-600" />
                Konfigurasi Saat Ini
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Lokasi</p>
                  <p className="font-bold text-gray-900 dark:text-white">{config.location_name}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Radius</p>
                  <p className="font-bold text-gray-900 dark:text-white">{config.radius_meters}m</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">WiFi Terdaftar</p>
                  <p className="font-bold text-gray-900 dark:text-white">{config.allowed_wifi_ssids.length} network</p>
                </div>
              </div>
              {config.created_at && (
                <p className="text-xs text-green-700 dark:text-green-300 mt-3">
                  ⏰ Terakhir update: {new Date(config.updated_at || config.created_at).toLocaleString('id-ID')}
                </p>
              )}
            </div>
          )}

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
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FaWifi className="text-blue-600" />
              WiFi yang Diizinkan
            </h2>
            <button
              onClick={() => setShowWiFiForm(!showWiFiForm)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all"
            >
              <FaPlus />
              Tambah WiFi
            </button>
          </div>

          {/* WiFi Form (Advanced) */}
          {showWiFiForm && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4 mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white mb-3">Tambah WiFi Network</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    SSID (Nama WiFi) *
                  </label>
                  <input
                    type="text"
                    value={newWiFi.ssid}
                    onChange={(e) => setNewWiFi({ ...newWiFi, ssid: e.target.value })}
                    placeholder="Contoh: SMKFI2025 (5G)"
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all outline-none text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    MAC Address / BSSID (Opsional)
                  </label>
                  <input
                    type="text"
                    value={newWiFi.bssid}
                    onChange={(e) => setNewWiFi({ ...newWiFi, bssid: e.target.value })}
                    placeholder="Contoh: 00:11:22:33:44:55 (untuk validasi lebih ketat)"
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all outline-none text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Opsional. Untuk memastikan koneksi ke Access Point yang spesifik
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Keamanan
                    </label>
                    <select
                      value={newWiFi.security_type}
                      onChange={(e) => setNewWiFi({ ...newWiFi, security_type: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all outline-none text-gray-900 dark:text-white"
                    >
                      <option value="WPA2">WPA2</option>
                      <option value="WPA3">WPA3</option>
                      <option value="WPA">WPA</option>
                      <option value="Open">Open (Tanpa Password)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Frekuensi
                    </label>
                    <select
                      value={newWiFi.frequency}
                      onChange={(e) => setNewWiFi({ ...newWiFi, frequency: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all outline-none text-gray-900 dark:text-white"
                    >
                      <option value="2.4GHz">2.4GHz</option>
                      <option value="5GHz">5GHz</option>
                      <option value="Dual">Dual Band</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Catatan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={newWiFi.notes}
                    onChange={(e) => setNewWiFi({ ...newWiFi, notes: e.target.value })}
                    placeholder="Contoh: WiFi Ruang Guru Lt 2"
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all outline-none text-gray-900 dark:text-white"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleAddWiFi}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    ✓ Tambahkan
                  </button>
                  <button
                    onClick={() => {
                      setShowWiFiForm(false);
                      setNewWiFi({ ssid: '', bssid: '', security_type: 'WPA2', frequency: '2.4GHz', notes: '' });
                    }}
                    className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-medium"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* WiFi List */}
          {(config.wifi_networks && config.wifi_networks.length > 0) || config.allowed_wifi_ssids.length > 0 ? (
            <div className="space-y-2">
              {(config.wifi_networks || []).length > 0 ? (
                // New format with details
                config.wifi_networks!.map((wifi, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-700 rounded-xl"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FaWifi className="text-green-600" />
                          <span className="font-bold text-gray-900 dark:text-white">{wifi.ssid}</span>
                          <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full">
                            {wifi.frequency || '2.4GHz'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                          {wifi.bssid && <p>📡 MAC: {wifi.bssid}</p>}
                          {wifi.security_type && <p>🔒 {wifi.security_type}</p>}
                          {wifi.notes && <p>📝 {wifi.notes}</p>}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveWiFi(index)}
                        className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-all"
                        title="Hapus WiFi"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                // Legacy format (simple SSIDs)
                config.allowed_wifi_ssids.map((ssid, index) => (
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
                ))
              )}
            </div>
          ) : (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-700 rounded-xl p-4 text-center">
              <p className="text-yellow-800 dark:text-yellow-200 font-semibold">
                Belum ada WiFi yang ditambahkan
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                Minimal 1 SSID WiFi harus ditambahkan untuk validasi absensi
              </p>
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mt-4">
            <p className="text-xs text-blue-700 dark:text-blue-300 font-semibold mb-1">
              💡 Tips:
            </p>
            <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1 list-disc list-inside">
              <li>Tambahkan semua WiFi sekolah (ruang kelas, lab, kantin, dll)</li>
              <li>MAC Address opsional - gunakan jika ingin validasi lebih ketat</li>
              <li>Frekuensi 5GHz biasanya lebih stabil tapi jangkauan lebih pendek</li>
              <li>Catatan membantu admin mengidentifikasi lokasi WiFi</li>
            </ul>
          </div>
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
