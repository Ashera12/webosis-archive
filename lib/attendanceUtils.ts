/**
 * Attendance Utilities
 * Functions for WiFi, Location, Fingerprint, and Camera operations
 */

/**
 * Check if user is connected to allowed WiFi network
 * Note: This requires HTTPS and user permission
 */
export async function checkWiFiConnection(allowedSSIDs: string[]): Promise<{ connected: boolean; ssid: string | null }> {
  try {
    // Check if browser supports Network Information API
    if (!('connection' in navigator)) {
      console.warn('Network Information API not supported');
      return { connected: false, ssid: null };
    }

    // Note: WiFi SSID detection is limited in browsers
    // Most modern browsers don't expose WiFi SSID for security reasons
    // This is a placeholder that will need native app or specific browser extensions
    
    // For now, we'll return a mock result
    // In production, this would need:
    // 1. Native mobile app (iOS/Android) with proper permissions
    // 2. Browser extension with WiFi access
    // 3. Or backend validation via server-side network detection
    
    console.log('WiFi check - Allowed SSIDs:', allowedSSIDs);
    
    // Temporary: Always return true for testing
    // TODO: Implement proper WiFi detection
    return { connected: true, ssid: allowedSSIDs[0] || null };
  } catch (error) {
    console.error('WiFi check error:', error);
    return { connected: false, ssid: null };
  }
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
 * Uses FingerprintJS library
 */
export async function generateBrowserFingerprint(): Promise<string> {
  try {
    // Check if FingerprintJS is available
    if (typeof window === 'undefined') {
      return 'server-side';
    }

    // Dynamically import FingerprintJS
    const FingerprintJS = await import('@fingerprintjs/fingerprintjs');
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    
    return result.visitorId;
  } catch (error) {
    console.error('Fingerprint generation error:', error);
    
    // Fallback to basic fingerprint
    const userAgent = navigator.userAgent;
    const screenResolution = `${screen.width}x${screen.height}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language;
    
    const basicFingerprint = `${userAgent}-${screenResolution}-${timezone}-${language}`;
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < basicFingerprint.length; i++) {
      const char = basicFingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return `fallback-${Math.abs(hash).toString(16)}`;
  }
}

/**
 * Capture photo from user's webcam
 * Returns base64 encoded image
 */
export async function captureWebcamPhoto(): Promise<string | null> {
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

    // Convert to base64
    return canvas.toDataURL('image/jpeg', 0.8);
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
