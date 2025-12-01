'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { FaMapMarkerAlt, FaTimes, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

export default function LocationPermissionPrompt() {
  const { data: session } = useSession();
  const [show, setShow] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'checking'>('checking');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (session?.user) {
      checkLocationPermission();
    }
  }, [session]);

  const checkLocationPermission = async () => {
    // Check if geolocation API is available
    if (!navigator.geolocation) {
      console.log('[Location] Geolocation not supported');
      setShow(false);
      return;
    }

    // Check if permission already granted
    if (typeof navigator.permissions !== 'undefined') {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        
        if (permission.state === 'granted') {
          setPermissionStatus('granted');
          getCurrentLocation();
          setShow(false);
        } else if (permission.state === 'denied') {
          setPermissionStatus('denied');
          setShow(true);
        } else {
          setPermissionStatus('prompt');
          setShow(true);
        }
        
        // Listen for permission changes
        permission.addEventListener('change', () => {
          if (permission.state === 'granted') {
            setPermissionStatus('granted');
            getCurrentLocation();
            setShow(false);
          }
        });
      } catch (error) {
        console.error('[Location] Permission check error:', error);
        setPermissionStatus('prompt');
        setShow(true);
      }
    } else {
      // Fallback for browsers without permissions API
      setPermissionStatus('prompt');
      setShow(true);
    }
  };

  const getCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setLocation(loc);
        setPermissionStatus('granted');
        
        // Log to server for security analysis
        logLocationAccess(loc, position.coords.accuracy);
      },
      (error) => {
        console.error('[Location] Error getting location:', error);
        if (error.code === error.PERMISSION_DENIED) {
          setPermissionStatus('denied');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const logLocationAccess = async (location: { lat: number; lng: number }, accuracy: number) => {
    try {
      await fetch('/api/security/log-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: location.lat,
          longitude: location.lng,
          accuracy,
          timestamp: new Date().toISOString(),
          event_type: 'location_permission_granted'
        })
      });
      console.log('[Location] ✅ Location logged to server for security analysis');
    } catch (error) {
      console.error('[Location] Failed to log location:', error);
    }
  };

  const handleAllow = () => {
    setShow(false);
    getCurrentLocation();
  };

  const handleDismiss = () => {
    setShow(false);
    // Log that user dismissed permission request
    fetch('/api/security/log-location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'location_permission_dismissed',
        timestamp: new Date().toISOString()
      })
    }).catch(console.error);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <FaMapMarkerAlt className="text-blue-600 dark:text-blue-400 text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Location Access Required
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                For attendance security
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        <div className="space-y-3 mb-6">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Sistem keamanan absensi memerlukan akses lokasi Anda untuk:
          </p>
          
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
              <span>Validasi Anda berada di area sekolah</span>
            </li>
            <li className="flex items-start gap-2">
              <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
              <span>Mencegah pemalsuan lokasi absensi</span>
            </li>
            <li className="flex items-start gap-2">
              <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
              <span>Analisis keamanan pola absensi</span>
            </li>
          </ul>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-3 mt-4">
            <div className="flex items-start gap-2">
              <FaExclamationTriangle className="text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-yellow-800 dark:text-yellow-200">
                <p className="font-bold mb-1">Penting:</p>
                <p>Tanpa akses lokasi, Anda tidak dapat melakukan absensi. Permission ini HANYA digunakan saat absensi, tidak tracking 24/7.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors"
          >
            Nanti Saja
          </button>
          <button
            onClick={handleAllow}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors"
          >
            Izinkan Akses
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
          Lokasi Anda hanya digunakan untuk validasi absensi dan tidak disimpan secara permanen
        </p>
      </div>
    </div>
  );
}
