/**
 * Browser Permission Request Helper
 * Handles camera, location, and biometric permissions with clear UI
 */

export interface PermissionResult {
  granted: boolean;
  error?: string;
  state?: 'granted' | 'denied' | 'prompt';
}

export class PermissionManager {
  /**
   * Request camera permission
   */
  static async requestCamera(): Promise<PermissionResult> {
    try {
      // Check if MediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return {
          granted: false,
          error: 'Camera API not supported in this browser. Please use Chrome, Firefox, Safari, or Edge.'
        };
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });

      // Stop stream immediately (we just needed permission)
      stream.getTracks().forEach(track => track.stop());

      return {
        granted: true,
        state: 'granted'
      };

    } catch (error: any) {
      console.error('[Permission] Camera denied:', error);
      
      if (error.name === 'NotAllowedError') {
        return {
          granted: false,
          error: 'Camera permission denied. Click camera icon in address bar to allow.',
          state: 'denied'
        };
      } else if (error.name === 'NotFoundError') {
        return {
          granted: false,
          error: 'No camera found on this device.'
        };
      } else {
        return {
          granted: false,
          error: `Camera error: ${error.message}`
        };
      }
    }
  }

  /**
   * Request location permission
   */
  static async requestLocation(): Promise<PermissionResult> {
    try {
      // Check if Geolocation API is available
      if (!navigator.geolocation) {
        return {
          granted: false,
          error: 'Geolocation API not supported. Please use a modern browser.'
        };
      }

      // Request location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      });

      console.log('[Permission] Location granted:', position.coords);

      return {
        granted: true,
        state: 'granted'
      };

    } catch (error: any) {
      console.error('[Permission] Location denied:', error);

      if (error.code === 1) { // PERMISSION_DENIED
        return {
          granted: false,
          error: 'Location permission denied. Click location icon in address bar to allow.',
          state: 'denied'
        };
      } else if (error.code === 2) { // POSITION_UNAVAILABLE
        return {
          granted: false,
          error: 'Location unavailable. Make sure GPS is enabled.'
        };
      } else if (error.code === 3) { // TIMEOUT
        return {
          granted: false,
          error: 'Location request timed out. Try again.'
        };
      } else {
        return {
          granted: false,
          error: `Location error: ${error.message}`
        };
      }
    }
  }

  /**
   * Check biometric availability (without requesting)
   */
  static async checkBiometric(): Promise<PermissionResult> {
    try {
      // Check WebAuthn support
      if (!window.PublicKeyCredential) {
        return {
          granted: false,
          error: 'Biometric authentication not supported in this browser.'
        };
      }

      // Check platform authenticator availability
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();

      if (!available) {
        return {
          granted: false,
          error: 'No biometric hardware found on this device.'
        };
      }

      return {
        granted: true,
        state: 'granted'
      };

    } catch (error: any) {
      return {
        granted: false,
        error: `Biometric check failed: ${error.message}`
      };
    }
  }

  /**
   * Request all permissions at once
   */
  static async requestAll(): Promise<{
    camera: PermissionResult;
    location: PermissionResult;
    biometric: PermissionResult;
  }> {
    const results = {
      camera: await this.requestCamera(),
      location: await this.requestLocation(),
      biometric: await this.checkBiometric()
    };

    console.log('[Permission] All results:', results);
    return results;
  }

  /**
   * Show permission instructions based on browser
   */
  static getInstructions(permission: 'camera' | 'location' | 'biometric'): string[] {
    const userAgent = navigator.userAgent.toLowerCase();
    const isChrome = userAgent.includes('chrome');
    const isFirefox = userAgent.includes('firefox');
    const isSafari = userAgent.includes('safari') && !isChrome;
    const isEdge = userAgent.includes('edge');

    const instructions: Record<string, string[]> = {
      camera: [
        '1. Click the camera icon 📷 in your browser address bar',
        '2. Select "Always allow" or "Allow"',
        '3. Refresh the page',
        isChrome ? '4. Chrome: Settings → Privacy → Camera → Allow' :
        isFirefox ? '4. Firefox: Permissions → Camera → Allow' :
        isSafari ? '4. Safari: Websites → Camera → Allow' :
        '4. Check browser settings for camera permissions'
      ],
      location: [
        '1. Click the location icon 📍 in your browser address bar',
        '2. Select "Always allow" or "Allow"',
        '3. Make sure GPS is enabled on your device',
        isChrome ? '4. Chrome: Settings → Privacy → Location → Allow' :
        isFirefox ? '4. Firefox: Permissions → Location → Allow' :
        isSafari ? '4. Safari: Websites → Location → Allow' :
        '4. Check browser settings for location permissions'
      ],
      biometric: [
        '1. Enable biometric authentication in device settings',
        '2. Set up fingerprint or face recognition',
        '3. Make sure browser supports WebAuthn',
        '4. Use latest browser version (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)'
      ]
    };

    return instructions[permission] || ['No instructions available'];
  }

  /**
   * Auto-request permissions with user-friendly UI
   */
  static async requestWithUI(
    permissions: ('camera' | 'location' | 'biometric')[],
    onUpdate?: (permission: string, result: PermissionResult) => void
  ): Promise<Record<string, PermissionResult>> {
    const results: Record<string, PermissionResult> = {};

    for (const permission of permissions) {
      console.log(`[Permission] Requesting ${permission}...`);

      let result: PermissionResult;

      switch (permission) {
        case 'camera':
          result = await this.requestCamera();
          break;
        case 'location':
          result = await this.requestLocation();
          break;
        case 'biometric':
          result = await this.checkBiometric();
          break;
        default:
          result = { granted: false, error: 'Unknown permission' };
      }

      results[permission] = result;

      if (onUpdate) {
        onUpdate(permission, result);
      }

      // If denied, don't continue (user needs to fix first)
      if (!result.granted) {
        console.warn(`[Permission] ${permission} denied, stopping chain`);
        break;
      }
    }

    return results;
  }
}
