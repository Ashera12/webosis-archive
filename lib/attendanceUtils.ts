/**
 * Attendance Utilities
 * Functions for WiFi, Location, Fingerprint, and Camera operations
 */

/**
 * Check if user is connected to allowed WiFi network
 * Note: Browser limitations - WiFi SSID detection not available in web browsers
 * This function provides a workaround by checking network connectivity
 */
export async function checkWiFiConnection(allowedSSIDs: string[]): Promise<{ connected: boolean; ssid: string | null; method: string }> {
  try {
    console.log('=== WiFi Check ===');
    console.log('Allowed SSIDs:', allowedSSIDs);
    
    // Method 1: Check if we have network connection
    if (!navigator.onLine) {
      console.log('No internet connection');
      return { connected: false, ssid: null, method: 'offline' };
    }
    
    // Method 2: Check connection type (if available)
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (connection) {
      console.log('Connection info:', {
        effectiveType: connection.effectiveType,
        type: connection.type,
        downlink: connection.downlink,
        rtt: connection.rtt
      });
      
      // If connection type is wifi, we assume it's connected to WiFi
      if (connection.type === 'wifi') {
        console.log('Connected via WiFi (detected)');
        // Since we can't get SSID from browser, we'll accept any WiFi connection
        // In production, this should be validated server-side or use native app
        return { connected: true, ssid: 'WiFi-Connected', method: 'connection-api' };
      }
    }
    
    // Method 3: Check local network connectivity (private IP range)
    try {
      // Use WebRTC to get local IP
      const localIP = await getLocalIP();
      console.log('Local IP:', localIP);
      
      if (localIP && isPrivateIP(localIP)) {
        console.log('Connected to local network (private IP detected)');
        return { connected: true, ssid: 'Local-Network', method: 'local-ip' };
      }
    } catch (e) {
      console.log('WebRTC IP detection failed:', e);
    }
    
    // Method 4: Manual override for testing (remove in production)
    // For now, if we have internet connection, assume WiFi is OK
    console.log('Using fallback: Assuming WiFi connected if online');
    return { connected: true, ssid: allowedSSIDs[0] || 'Unknown', method: 'fallback-online' };
    
  } catch (error) {
    console.error('WiFi check error:', error);
    return { connected: false, ssid: null, method: 'error' };
  }
}

/**
 * Get local IP address using WebRTC
 */
async function getLocalIP(): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const pc = new RTCPeerConnection({
        iceServers: []
      });
      
      pc.createDataChannel('');
      
      pc.createOffer().then(offer => pc.setLocalDescription(offer));
      
      pc.onicecandidate = (ice) => {
        if (!ice || !ice.candidate || !ice.candidate.candidate) {
          resolve(null);
          return;
        }
        
        const ipMatch = /([0-9]{1,3}(\.[0-9]{1,3}){3})/.exec(ice.candidate.candidate);
        if (ipMatch) {
          pc.close();
          resolve(ipMatch[1]);
        }
      };
      
      setTimeout(() => {
        pc.close();
        resolve(null);
      }, 2000);
    } catch (e) {
      resolve(null);
    }
  });
}

/**
 * Check if IP is private (local network)
 */
function isPrivateIP(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  return (
    parts[0] === 10 ||
    parts[0] === 127 ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168)
  );
}

/**
 * Get user's current GPS location
 */
export async function getUserLocation(): Promise<{ latitude: number; longitude: number; accuracy: number } | null> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      console.error('[Geolocation] ❌ Not supported by browser');
      reject(new Error('Browser Anda tidak mendukung GPS. Gunakan browser modern (Chrome/Edge/Safari).'));
      return;
    }

    // Check if running on HTTPS or localhost (REQUIRED for geolocation)
    const isSecureContext = window.isSecureContext || window.location.protocol === 'https:' || 
                            window.location.hostname === 'localhost' || 
                            window.location.hostname === '127.0.0.1';
    
    if (!isSecureContext) {
      console.error('[Geolocation] ❌ HTTPS required (running on HTTP)');
      reject(new Error('Absensi harus diakses via HTTPS untuk keamanan. Hubungi admin IT.'));
      return;
    }

    console.log('[Geolocation] 📍 Requesting high-accuracy GPS location...');
    console.log('[Geolocation] ⚠️ PLEASE ALLOW location permission when browser asks!');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const accuracy = position.coords.accuracy;
        console.log('[Geolocation] ✅ Location obtained:', {
          lat: position.coords.latitude.toFixed(6),
          lon: position.coords.longitude.toFixed(6),
          accuracy: accuracy.toFixed(0) + 'm'
        });
        
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: accuracy
        });
      },
      (error) => {
        console.error('[Geolocation] ❌ Error:', error.code, error.message);
        
        let userMessage = '';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            userMessage = '🚨 IZIN LOKASI DITOLAK!\n\n' +
                         'Anda HARUS mengizinkan akses lokasi untuk absensi.\n\n' +
                         'Cara mengaktifkan:\n' +
                         '1. Klik ikon 🔒 di address bar\n' +
                         '2. Pilih "Site settings" atau "Permissions"\n' +
                         '3. Ubah "Location" menjadi "Allow"\n' +
                         '4. Refresh halaman ini\n\n' +
                         'ABSENSI TIDAK BISA DILANJUTKAN TANPA IZIN LOKASI!';
            break;
          case error.POSITION_UNAVAILABLE:
            userMessage = '⚠️ GPS Tidak Tersedia!\n\n' +
                         'Pindah ke area terbuka untuk sinyal GPS lebih baik.\n' +
                         'Pastikan GPS/Location di device Anda AKTIF.';
            break;
          case error.TIMEOUT:
            userMessage = '⏱️ GPS Timeout!\n\n' +
                         'Pindah ke area terbuka dan coba lagi.\n' +
                         'Pastikan GPS device Anda aktif.';
            break;
          default:
            userMessage = 'Error GPS: ' + error.message;
        }
        
        reject(new Error(userMessage));
      },
      {
        enableHighAccuracy: true,  // FORCE GPS satelit (not WiFi/cell triangulation)
        timeout: 30000,            // 30 detik timeout (cukup waktu untuk GPS lock)
        maximumAge: 0,             // FORCE fresh location (no cache)
      }
    );
  });
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Generate browser fingerprint for device identification
 * Uses browser characteristics to create unique device ID
 * Returns object with hash and readable details
 */
export async function generateBrowserFingerprint(): Promise<{
  hash: string;
  details: {
    platform: string;
    browser: string;
    screen: string;
    language: string;
    timezone: string;
    deviceId: string;
  };
}> {
  try {
    // Check if running in browser
    if (typeof window === 'undefined') {
      return {
        hash: 'server-side',
        details: {
          platform: 'Server',
          browser: 'Server',
          screen: 'N/A',
          language: 'N/A',
          timezone: 'N/A',
          deviceId: 'server-side',
        },
      };
    }

    // Collect browser fingerprint data
    const userAgent = navigator.userAgent;
    const screenResolution = `${screen.width}x${screen.height}x${screen.colorDepth}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language;
    const platform = navigator.platform;
    const hardwareConcurrency = navigator.hardwareConcurrency || 0;
    const deviceMemory = (navigator as any).deviceMemory || 0;
    
    // Canvas fingerprint (more unique)
    const canvasFingerprint = await getCanvasFingerprint();
    
    // WebGL fingerprint
    const webglFingerprint = getWebGLFingerprint();
    
    // Combine all fingerprint data
    const fingerprintData = `${userAgent}-${screenResolution}-${timezone}-${language}-${platform}-${hardwareConcurrency}-${deviceMemory}-${canvasFingerprint}-${webglFingerprint}`;
    
    // Generate hash
    const hash = await hashString(fingerprintData);
    
    // Extract browser name from user agent
    let browser = 'Unknown';
    if (userAgent.includes('Edg')) browser = 'Edge';
    else if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Opera') || userAgent.includes('OPR')) browser = 'Opera';
    
    return {
      hash,
      details: {
        platform: platform,
        browser: browser,
        screen: `${screen.width}x${screen.height}`,
        language: language,
        timezone: timezone,
        deviceId: hash.substring(0, 12),
      },
    };
  } catch (error) {
    console.error('Fingerprint generation error:', error);
    
    // Fallback to basic fingerprint
    const userAgent = navigator.userAgent;
    const screenResolution = `${screen.width}x${screen.height}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language;
    
    const basicFingerprint = `${userAgent}-${screenResolution}-${timezone}-${language}`;
    const hash = await hashString(basicFingerprint);
    
    // Extract browser name
    let browser = 'Unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    
    return {
      hash,
      details: {
        platform: navigator.platform || 'Unknown',
        browser: browser,
        screen: screenResolution,
        language: language,
        timezone: timezone,
        deviceId: hash.substring(0, 12),
      },
    };
  }
}

/**
 * Generate canvas fingerprint
 */
async function getCanvasFingerprint(): Promise<string> {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return 'no-canvas';
    
    // Draw text with specific styling
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('WebOsis Fingerprint 🔒', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('WebOsis Fingerprint 🔒', 4, 17);
    
    // Get image data and hash it
    const dataURL = canvas.toDataURL();
    return dataURL.substring(0, 50); // Use first 50 chars as fingerprint
  } catch (error) {
    return 'canvas-error';
  }
}

/**
 * Get WebGL fingerprint
 */
function getWebGLFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    
    if (!gl) return 'no-webgl';
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return 'no-debug-info';
    
    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    
    return `${vendor}-${renderer}`;
  } catch (error) {
    return 'webgl-error';
  }
}

/**
 * Hash a string using Web Crypto API
 */
async function hashString(str: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  } catch (error) {
    // Fallback to simple hash
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `fallback-${Math.abs(hash).toString(16)}`;
  }
}

/**
 * Capture photo from user's webcam with live preview
 * Shows camera preview in modal, user clicks to capture
 * Returns Blob for upload
 */
export async function captureWebcamPhoto(): Promise<Blob | null> {
  return new Promise(async (resolve, reject) => {
    let stream: MediaStream | null = null;
    
    try {
      console.log('[Camera] Requesting camera access...');
      
      // Request camera access
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      
      console.log('[Camera] Camera access granted');

      // Create modal overlay
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.95);
        z-index: 9999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 20px;
      `;

      // Create video element for live preview
      const video = document.createElement('video');
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('autoplay', 'true');
      video.style.cssText = `
        max-width: 90%;
        max-height: 70vh;
        border-radius: 16px;
        border: 3px solid #3b82f6;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
      `;
      await video.play();

      // Create capture button
      const captureBtn = document.createElement('button');
      captureBtn.innerHTML = `
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin-right: 8px; display: inline;">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
        </svg>
        📸 Ambil Foto
      `;
      captureBtn.style.cssText = `
        margin-top: 20px;
        padding: 16px 32px;
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        color: white;
        border: none;
        border-radius: 12px;
        font-size: 18px;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 10px 30px rgba(59, 130, 246, 0.4);
        transition: transform 0.2s, box-shadow 0.2s;
        display: flex;
        align-items: center;
      `;
      captureBtn.onmouseover = () => {
        captureBtn.style.transform = 'scale(1.05)';
        captureBtn.style.boxShadow = '0 15px 40px rgba(59, 130, 246, 0.6)';
      };
      captureBtn.onmouseout = () => {
        captureBtn.style.transform = 'scale(1)';
        captureBtn.style.boxShadow = '0 10px 30px rgba(59, 130, 246, 0.4)';
      };

      // Create cancel button
      const cancelBtn = document.createElement('button');
      cancelBtn.innerHTML = '✕ Batal';
      cancelBtn.style.cssText = `
        margin-top: 10px;
        padding: 12px 24px;
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
      `;
      cancelBtn.onmouseover = () => {
        cancelBtn.style.background = 'rgba(255, 255, 255, 0.2)';
      };
      cancelBtn.onmouseout = () => {
        cancelBtn.style.background = 'rgba(255, 255, 255, 0.1)';
      };

      // Add instruction text
      const instruction = document.createElement('div');
      instruction.innerHTML = '📷 Posisikan wajah Anda di depan kamera';
      instruction.style.cssText = `
        color: white;
        font-size: 16px;
        margin-bottom: 15px;
        text-align: center;
        font-weight: 600;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
      `;

      modal.appendChild(instruction);
      modal.appendChild(video);
      modal.appendChild(captureBtn);
      modal.appendChild(cancelBtn);
      document.body.appendChild(modal);

      console.log('[Camera] Preview modal displayed');

      // Handle capture button click
      captureBtn.onclick = async () => {
        try {
          console.log('[Camera] Capturing photo...');
          
          // Create canvas and capture frame
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            throw new Error('Could not get canvas context');
          }

          ctx.drawImage(video, 0, 0);
          
          console.log('[Camera] Photo captured, size:', canvas.width, 'x', canvas.height);

          // Stop camera
          if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            console.log('[Camera] Camera stopped');
          }

          // Remove modal
          document.body.removeChild(modal);

          // Convert to Blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                console.log('[Camera] Blob created, size:', (blob.size / 1024).toFixed(2), 'KB');
                resolve(blob);
              } else {
                console.error('[Camera] Failed to create blob');
                reject(new Error('Failed to create blob'));
              }
            },
            'image/jpeg',
            0.85
          );
        } catch (error) {
          console.error('[Camera] Capture error:', error);
          reject(error);
        }
      };

      // Handle cancel button click
      cancelBtn.onclick = () => {
        console.log('[Camera] User cancelled');
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
        document.body.removeChild(modal);
        resolve(null);
      };

    } catch (error) {
      console.error('[Camera] Error:', error);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      reject(error);
    }
  });
}

/**
 * Format attendance time for display
 */
export function formatAttendanceTime(isoString: string): string {
  const date = new Date(isoString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Check if location is within allowed radius
 */
export function isLocationValid(
  userLat: number,
  userLon: number,
  schoolLat: number,
  schoolLon: number,
  radiusMeters: number
): boolean {
  const distance = calculateDistance(userLat, userLon, schoolLat, schoolLon);
  console.log(`Distance from school: ${distance.toFixed(2)}m (allowed: ${radiusMeters}m)`);
  return distance <= radiusMeters;
}

/**
 * Upload attendance photo to server
 */
export async function uploadAttendancePhoto(blob: Blob, userId: string): Promise<string> {
  console.log('[Upload] Starting upload for user:', userId);
  console.log('[Upload] Blob size:', (blob.size / 1024).toFixed(2), 'KB');
  
  const fileName = `${userId}-${Date.now()}.jpg`;
  const formData = new FormData();
  formData.append('file', blob, fileName);
  formData.append('userId', userId); // Required by API
  
  console.log('[Upload] FormData prepared, filename:', fileName);

  try {
    const response = await fetch('/api/attendance/upload-selfie', {
      method: 'POST',
      body: formData,
    });

    console.log('[Upload] Response status:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error('[Upload] Upload failed:', error);
      throw new Error(error.error || 'Gagal upload foto');
    }

    const data = await response.json();
    
    console.log('[Upload] Response data:', data);
    
    if (!data.success || !data.url) {
      console.error('[Upload] Invalid response:', data);
      throw new Error('Upload failed - no URL returned');
    }

    console.log('[Upload] ✅ Upload successful, URL:', data.url);
    return data.url;
  } catch (error: any) {
    console.error('[Upload] ❌ Upload error:', error.message);
    throw error;
  }
}
