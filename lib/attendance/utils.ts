// lib/attendance/utils.ts
/**
 * Utility functions untuk sistem absensi
 */

// Check apakah user terhubung ke WiFi yang diizinkan
export async function checkWiFiConnection(): Promise<{
  connected: boolean;
  ssid: string | null;
  bssid: string | null;
  error?: string;
}> {
  try {
    // Note: Browser tidak bisa langsung akses WiFi SSID karena privacy
    // Solusi: gunakan Network Information API (terbatas) atau minta user input
    
    // Untuk production, bisa pakai:
    // 1. Progressive Web App dengan WiFi permission
    // 2. Native app wrapper (Capacitor/Cordova)
    // 3. Manual input dari user

    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (!connection) {
      return {
        connected: false,
        ssid: null,
        bssid: null,
        error: 'Network Information API not supported',
      };
    }

    // Karena browser limitation, return placeholder
    // User harus manual confirm WiFi name di form
    return {
      connected: connection.effectiveType !== 'none',
      ssid: null, // User will input manually
      bssid: null,
    };
  } catch (error: any) {
    return {
      connected: false,
      ssid: null,
      bssid: null,
      error: error.message,
    };
  }
}

// Get lokasi user
export async function getUserLocation(): Promise<{
  latitude: number;
  longitude: number;
  accuracy: number;
} | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
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

// Generate fingerprint hash menggunakan browser fingerprinting
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
  // Simple browser fingerprint using available APIs
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  let canvasFingerprint = '';
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Browser Fingerprint', 2, 2);
    canvasFingerprint = canvas.toDataURL();
  }

  const fingerprint = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    canvasFingerprint: await hashString(canvasFingerprint),
    plugins: Array.from(navigator.plugins).map(p => p.name).join(','),
  };

  const fingerprintString = JSON.stringify(fingerprint);
  const hash = await hashString(fingerprintString);
  
  // Extract browser name from user agent
  const userAgent = navigator.userAgent;
  let browser = 'Unknown';
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  
  return {
    hash,
    details: {
      platform: navigator.platform,
      browser,
      screen: `${screen.width}x${screen.height}`,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      deviceId: hash.substring(0, 12),
    },
  };
}

// Hash string menggunakan SubtleCrypto
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Capture foto dari webcam
export async function capturePhotoFromWebcam(): Promise<Blob | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: 640, height: 480 },
      audio: false,
    });

    const video = document.createElement('video');
    video.srcObject = stream;
    video.play();

    // Wait for video to be ready
    await new Promise((resolve) => {
      video.onloadedmetadata = resolve;
    });

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      stream.getTracks().forEach(track => track.stop());
      return null;
    }

    ctx.drawImage(video, 0, 0);
    stream.getTracks().forEach(track => track.stop());

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.8);
    });
  } catch (error) {
    console.error('Camera capture error:', error);
    return null;
  }
}

// Upload foto ke Supabase Storage
export async function uploadAttendancePhoto(blob: Blob, userId: string): Promise<string> {
  const fileName = `${userId}-${Date.now()}.jpg`;
  const formData = new FormData();
  formData.append('file', blob, fileName);
  formData.append('bucket', 'attendance');
  formData.append('folder', 'selfies');

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Gagal upload foto');
  }

  const data = await response.json();
  
  if (!data.success || !data.publicUrl) {
    throw new Error('Upload failed');
  }

  return data.publicUrl;
}

// Format waktu untuk display
export function formatAttendanceTime(isoString: string): string {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

// Hitung durasi antara check-in dan check-out
export function calculateDuration(checkIn: string, checkOut?: string | null): string {
  const start = new Date(checkIn);
  const end = checkOut ? new Date(checkOut) : new Date();
  
  const diff = end.getTime() - start.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}j ${minutes}m`;
}

// Get status badge color
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    present: 'green',
    late: 'yellow',
    sick: 'orange',
    permission: 'blue',
    absent: 'red',
  };
  
  return colors[status] || 'gray';
}
