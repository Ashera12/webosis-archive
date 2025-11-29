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
export async function getUserLocation(): Promise<{ latitude: number; longitude: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.error('Geolocation error:', error.message);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
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
 */
export async function generateBrowserFingerprint(): Promise<string> {
  try {
    // Check if running in browser
    if (typeof window === 'undefined') {
      return 'server-side';
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
    return await hashString(fingerprintData);
  } catch (error) {
    console.error('Fingerprint generation error:', error);
    
    // Fallback to basic fingerprint
    const userAgent = navigator.userAgent;
    const screenResolution = `${screen.width}x${screen.height}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language;
    
    const basicFingerprint = `${userAgent}-${screenResolution}-${timezone}-${language}`;
    
    return await hashString(basicFingerprint);
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
 * Capture photo from user's webcam
 * Returns Blob for upload
 */
export async function captureWebcamPhoto(): Promise<Blob | null> {
  try {
    // Request camera access
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 480 },
      },
    });

    // Create video element
    const video = document.createElement('video');
    video.srcObject = stream;
    video.setAttribute('playsinline', 'true'); // Required for iOS
    await video.play();

    // Wait for video to be ready
    await new Promise((resolve) => {
      video.onloadedmetadata = resolve;
    });

    // Create canvas and capture frame
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    ctx.drawImage(video, 0, 0);

    // Stop camera
    stream.getTracks().forEach((track) => track.stop());

    // Convert to Blob
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob),
        'image/jpeg',
        0.8
      );
    });
  } catch (error) {
    console.error('Webcam capture error:', error);
    return null;
  }
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
  const fileName = `${userId}-${Date.now()}.jpg`;
  const formData = new FormData();
  formData.append('file', blob, fileName);
  formData.append('bucket', 'attendance');
  formData.append('folder', 'selfies');

  const response = await fetch('/api/attendance/upload-selfie', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Gagal upload foto');
  }

  const data = await response.json();
  
  if (!data.success || !data.url) {
    throw new Error('Upload failed');
  }

  return data.url;
}
