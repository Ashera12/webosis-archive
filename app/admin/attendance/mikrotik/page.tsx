'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { FaNetworkWired, FaSave, FaCheckCircle, FaTimes, FaSpinner, FaServer, FaKey, FaToggleOn, FaToggleOff, FaPlug } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface MikrotikSettings {
  mikrotik_enabled: string;
  mikrotik_host: string;
  mikrotik_port: string;
  mikrotik_username: string;
  mikrotik_password: string;
  mikrotik_api_type: string;
  mikrotik_use_dhcp: string;
  mikrotik_use_arp: string;
  mikrotik_cache_duration: string;
  ip_validation_mode: string;
  location_strict_mode: string;
  location_max_radius: string;
  location_gps_accuracy_required: string;
}

export default function MikrotikConfigPage() {
  const { data: session, status } = useSession();
  const [settings, setSettings] = useState<MikrotikSettings>({
    mikrotik_enabled: 'false',
    mikrotik_host: '',
    mikrotik_port: '8728',
    mikrotik_username: 'admin',
    mikrotik_password: '',
    mikrotik_api_type: 'rest',
    mikrotik_use_dhcp: 'true',
    mikrotik_use_arp: 'false',
    mikrotik_cache_duration: '300',
    ip_validation_mode: 'hybrid',
    location_strict_mode: 'true',
    location_max_radius: '100',
    location_gps_accuracy_required: '20', // Default 20m (good accuracy)
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/admin/login');
    }
    if (session?.user?.email) {
      fetchSettings();
      const id = setInterval(fetchSettings, 60000);
      return () => clearInterval(id);
    }
  }, [session, status]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings/mikrotik?t=' + Date.now(), { cache: 'no-store' as any });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSettings(data.settings);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings/mikrotik', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success('✅ Settings saved successfully!');
      } else {
        toast.error('❌ Failed to save: ' + (data.error || 'Unknown error'));
      }
    } catch (error: any) {
      toast.error('❌ Error: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const res = await fetch('/api/admin/mikrotik/test');
      const data = await res.json();
      setTestResult(data);
      
      if (data.connected) {
        toast.success('✅ Mikrotik connected successfully!');
      } else {
        toast.error('❌ Connection failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error: any) {
      toast.error('❌ Error: ' + error.message);
      setTestResult({ connected: false, error: error.message });
    } finally {
      setTesting(false);
    }
  };

  const fetchDevices = async () => {
    try {
      const res = await fetch('/api/admin/mikrotik/devices');
      const data = await res.json();
      
      if (data.success) {
        setDevices(data.devices);
        toast.success(`✅ Fetched ${data.count} connected devices`);
      } else {
        toast.error('❌ Failed to fetch devices: ' + (data.error || 'Unknown error'));
      }
    } catch (error: any) {
      toast.error('❌ Error: ' + error.message);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <FaNetworkWired className="text-blue-600" />
            Mikrotik Integration Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Configure Mikrotik router for real-time IP validation and device monitoring
          </p>
        </div>

        {/* Enable/Disable Toggle */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {settings.mikrotik_enabled === 'true' ? <FaToggleOn className="text-green-500" /> : <FaToggleOff className="text-gray-400" />}
                Mikrotik Integration
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {settings.mikrotik_enabled === 'true' 
                  ? '✅ Enabled - Real-time device validation active'
                  : '⚠️ Disabled - Using IP whitelist only'
                }
              </p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, mikrotik_enabled: settings.mikrotik_enabled === 'true' ? 'false' : 'true' })}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                settings.mikrotik_enabled === 'true'
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
              }`}
            >
              {settings.mikrotik_enabled === 'true' ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>

        {/* Router Configuration */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FaServer className="text-blue-600" />
            Router Configuration
          </h2>

          <div className="space-y-4">
            {/* Host */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                Router IP Address *
              </label>
              <input
                type="text"
                value={settings.mikrotik_host}
                onChange={(e) => setSettings({ ...settings, mikrotik_host: e.target.value })}
                placeholder="192.168.88.1"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all outline-none"
              />
            </div>

            {/* Port */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                API Port
              </label>
              <input
                type="text"
                value={settings.mikrotik_port}
                onChange={(e) => setSettings({ ...settings, mikrotik_port: e.target.value })}
                placeholder="8728"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all outline-none"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Default: 8728 (RouterOS API), 80/443 (REST API)
              </p>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                Username *
              </label>
              <input
                type="text"
                value={settings.mikrotik_username}
                onChange={(e) => setSettings({ ...settings, mikrotik_username: e.target.value })}
                placeholder="admin"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all outline-none"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                <FaKey className="inline mr-1" />
                Password *
              </label>
              <input
                type="password"
                value={settings.mikrotik_password}
                onChange={(e) => setSettings({ ...settings, mikrotik_password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all outline-none"
              />
            </div>

            {/* API Type */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                API Type
              </label>
              <select
                value={settings.mikrotik_api_type}
                onChange={(e) => setSettings({ ...settings, mikrotik_api_type: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all outline-none"
              >
                <option value="rest">REST API (RouterOS 7.1+)</option>
                <option value="routeros">RouterOS API (Older versions)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Validation Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Validation Settings
          </h2>

          <div className="space-y-4">
            {/* IP Validation Mode */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                IP Validation Mode
              </label>
              <select
                value={settings.ip_validation_mode}
                onChange={(e) => setSettings({ ...settings, ip_validation_mode: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all outline-none"
              >
                <option value="hybrid">✅ Hybrid (Mikrotik + Whitelist) - Recommended</option>
                <option value="mikrotik">Mikrotik Only (Strict)</option>
                <option value="whitelist">Whitelist Only (Legacy)</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Hybrid: Try Mikrotik first, fallback to IP whitelist if unavailable
              </p>
            </div>

            {/* Location Strict Mode */}
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.location_strict_mode === 'true'}
                  onChange={(e) => setSettings({ ...settings, location_strict_mode: e.target.checked ? 'true' : 'false' })}
                  className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500 rounded"
                />
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  Location Strict Mode (No Bypass)
                </span>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-7">
                Enforce strict GPS validation - disable all bypass options
              </p>
            </div>

            {/* Max Radius */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                Maximum Radius (meters)
              </label>
              <input
                type="number"
                value={settings.location_max_radius}
                onChange={(e) => setSettings({ ...settings, location_max_radius: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all outline-none"
              />
            </div>

            {/* GPS Accuracy Required */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                🎯 GPS Accuracy Required (meters)
              </label>
              <input
                type="number"
                min="5"
                max="100"
                value={settings.location_gps_accuracy_required}
                onChange={(e) => setSettings({ ...settings, location_gps_accuracy_required: e.target.value })}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Tolak absensi jika akurasi GPS lebih buruk dari nilai ini.<br />
                📍 <strong>Nilai lebih KECIL = lebih AKURAT</strong><br />
                Contoh: 5m = SANGAT AKURAT, 20m = BAIK, 50m = KURANG, 100m = BURUK<br />
                ⚠️ Direkomendasikan: 15-25 meter untuk outdoor
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
            
            <button
              onClick={handleTestConnection}
              disabled={testing || settings.mikrotik_enabled !== 'true'}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {testing ? <FaSpinner className="animate-spin" /> : <FaPlug />}
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            
            <button
              onClick={fetchDevices}
              disabled={settings.mikrotik_enabled !== 'true'}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FaServer />
              Fetch Devices
            </button>
          </div>
        </div>

        {/* Test Result */}
        {testResult && (
          <div className={`rounded-2xl shadow-xl p-6 mb-6 ${
            testResult.connected 
              ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700'
              : 'bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700'
          }`}>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              {testResult.connected ? <FaCheckCircle className="text-green-600" /> : <FaTimes className="text-red-600" />}
              Connection Test Result
            </h3>
            <pre className="bg-white dark:bg-gray-800 p-4 rounded-lg text-sm overflow-x-auto">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}

        {/* Connected Devices */}
        {devices.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-bold mb-4">
              Connected Devices ({devices.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300">IP Address</th>
                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300">MAC Address</th>
                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300">Hostname</th>
                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300">Interface</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {devices.map((device, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 text-sm font-mono">{device.ipAddress}</td>
                      <td className="px-4 py-2 text-sm font-mono">{device.macAddress}</td>
                      <td className="px-4 py-2 text-sm">{device.hostName || '-'}</td>
                      <td className="px-4 py-2 text-sm">{device.interface}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
