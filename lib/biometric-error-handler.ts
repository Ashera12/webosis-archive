/**
 * Clear, actionable error messages for biometric/attendance issues
 */

export interface ErrorSolution {
  title: string;
  message: string;
  icon: string;
  solutions: string[];
  severity: 'error' | 'warning' | 'info';
  actionable: boolean;
  action?: {
    label: string;
    handler: () => void;
  };
}

export class BiometricErrorHandler {
  /**
   * Get user-friendly error message with solutions
   */
  static getErrorSolution(errorCode: string, context?: any): ErrorSolution {
    const errors: Record<string, ErrorSolution> = {
      // WebAuthn Errors
      'NotAllowedError': {
        title: 'Authentication Cancelled',
        message: 'You cancelled the biometric authentication or it timed out.',
        icon: '⏱️',
        severity: 'warning',
        actionable: true,
        solutions: [
          'Try again and complete the authentication promptly',
          'Make sure you see the authentication popup',
          'Check if your device biometric is enabled',
          'Try using a different biometric method'
        ]
      },
      
      'NotSupportedError': {
        title: 'Biometric Not Supported',
        message: 'Your browser or device doesn\'t support biometric authentication.',
        icon: '❌',
        severity: 'error',
        actionable: true,
        solutions: [
          'Update your browser to the latest version',
          'Use Chrome, Firefox, Safari, or Edge',
          'Check if your device has biometric hardware (fingerprint/face scanner)',
          'Try on a different device',
          'Use PIN code as fallback'
        ]
      },

      'SecurityError': {
        title: 'Security Requirement Not Met',
        message: 'This page requires HTTPS or localhost for biometric authentication.',
        icon: '🔒',
        severity: 'error',
        actionable: true,
        solutions: [
          'Access the site via HTTPS (https://)',
          'Contact admin to enable HTTPS',
          'Use localhost for development testing only'
        ]
      },

      'InvalidStateError': {
        title: 'Credential Already Registered',
        message: 'This biometric is already registered. You may need to re-enroll.',
        icon: '⚠️',
        severity: 'warning',
        actionable: true,
        solutions: [
          'Go to Settings → Biometric Management',
          'Request data reset from admin',
          'Re-enroll your biometric',
          'Contact support if issue persists'
        ]
      },

      // GPS Errors
      'GPS_PERMISSION_DENIED': {
        title: 'Location Permission Denied',
        message: 'You need to allow location access for attendance.',
        icon: '📍',
        severity: 'error',
        actionable: true,
        solutions: [
          'Click the location icon in address bar',
          'Select "Always allow" or "Allow"',
          'Refresh the page after allowing',
          'For iOS: Settings → Safari → Location → Allow',
          'For Android: Settings → Apps → Browser → Permissions → Location'
        ]
      },

      'GPS_TIMEOUT': {
        title: 'GPS Timeout',
        message: 'Could not get your location within time limit.',
        icon: '⏱️',
        severity: 'warning',
        actionable: true,
        solutions: [
          'Make sure you\'re outdoors or near windows',
          'Wait a few seconds and try again',
          'Turn off and on your device GPS',
          'Check if GPS/Location is enabled in device settings'
        ]
      },

      'GPS_OUT_OF_RANGE': {
        title: 'Out of School Range',
        message: 'Your current location is outside the allowed school area.',
        icon: '🚫',
        severity: 'error',
        actionable: true,
        solutions: [
          'Make sure you\'re physically at school',
          'Check your GPS accuracy (should be ±10m)',
          'Wait for better GPS signal',
          'Contact admin if you\'re at school but still getting this error'
        ]
      },

      // WiFi Errors
      'WIFI_NOT_CONNECTED': {
        title: 'School WiFi Required',
        message: 'You must be connected to school WiFi network.',
        icon: '📶',
        severity: 'error',
        actionable: true,
        solutions: [
          'Connect to school WiFi network',
          'Make sure WiFi is turned on',
          'Disconnect from cellular data',
          'Ask teacher for WiFi password if needed'
        ]
      },

      'WIFI_WRONG_NETWORK': {
        title: 'Wrong WiFi Network',
        message: 'You\'re connected to wrong WiFi. Connect to school WiFi.',
        icon: '📡',
        severity: 'error',
        actionable: true,
        solutions: [
          'Disconnect from current WiFi',
          'Connect to school WiFi network',
          'Check with admin for allowed WiFi names',
          'Make sure you\'re in school WiFi range'
        ]
      },

      // Photo Errors
      'CAMERA_PERMISSION_DENIED': {
        title: 'Camera Permission Denied',
        message: 'You need to allow camera access to take attendance photo.',
        icon: '📷',
        severity: 'error',
        actionable: true,
        solutions: [
          'Click camera icon in address bar',
          'Select "Always allow" or "Allow"',
          'Refresh page after allowing',
          'Check browser settings → Privacy → Camera'
        ]
      },

      'FACE_NOT_DETECTED': {
        title: 'Face Not Detected',
        message: 'We couldn\'t detect your face in the photo.',
        icon: '😐',
        severity: 'warning',
        actionable: true,
        solutions: [
          'Make sure your face is clearly visible',
          'Remove mask or glasses if possible',
          'Ensure good lighting',
          'Look directly at camera',
          'Try taking photo again'
        ]
      },

      'FACE_MISMATCH': {
        title: 'Face Doesn\'t Match',
        message: 'Your face doesn\'t match the registered photo.',
        icon: '⚠️',
        severity: 'error',
        actionable: true,
        solutions: [
          'Make sure it\'s really you (no photos of photos)',
          'Ensure good lighting and clear photo',
          'If your appearance changed, re-enroll biometric',
          'Remove obstructions (mask, glasses, hat)',
          'Contact support if this persists'
        ]
      },

      // Rate Limit
      'RATE_LIMIT_EXCEEDED': {
        title: 'Too Many Attempts',
        message: 'You\'ve made too many attempts. Please wait before trying again.',
        icon: '🚫',
        severity: 'error',
        actionable: true,
        solutions: [
          'Wait for cooldown period to end',
          'Check when you can try again',
          'Contact admin if urgent',
          'Don\'t spam the attendance button'
        ]
      },

      // Generic
      'UNKNOWN_ERROR': {
        title: 'Something Went Wrong',
        message: 'An unexpected error occurred.',
        icon: '❌',
        severity: 'error',
        actionable: true,
        solutions: [
          'Try refreshing the page',
          'Clear browser cache and cookies',
          'Try a different browser',
          'Contact support with error details',
          'Check your internet connection'
        ]
      }
    };

    return errors[errorCode] || errors['UNKNOWN_ERROR'];
  }

  /**
   * Display error in user-friendly toast/modal
   */
  static showError(errorCode: string, toast: any, context?: any): void {
    const solution = this.getErrorSolution(errorCode, context);
    
    const message = `${solution.icon} ${solution.title}\n\n${solution.message}\n\n💡 Solutions:\n${solution.solutions.slice(0, 3).map(s => `• ${s}`).join('\n')}`;
    
    toast.error(message, { 
      duration: solution.severity === 'error' ? 10000 : 6000,
      style: {
        maxWidth: '500px',
        whiteSpace: 'pre-line'
      }
    });
  }

  /**
   * Map common error messages to error codes
   */
  static mapErrorToCode(error: any): string {
    const errorMsg = error?.message?.toLowerCase() || '';
    const errorName = error?.name || '';

    // WebAuthn errors
    if (errorName === 'NotAllowedError') return 'NotAllowedError';
    if (errorName === 'NotSupportedError') return 'NotSupportedError';
    if (errorName === 'SecurityError') return 'SecurityError';
    if (errorName === 'InvalidStateError') return 'InvalidStateError';

    // GPS errors
    if (errorMsg.includes('permission denied') || errorMsg.includes('user denied')) {
      return 'GPS_PERMISSION_DENIED';
    }
    if (errorMsg.includes('timeout')) return 'GPS_TIMEOUT';
    if (errorMsg.includes('out of range') || errorMsg.includes('too far')) {
      return 'GPS_OUT_OF_RANGE';
    }

    // WiFi errors
    if (errorMsg.includes('wifi') && errorMsg.includes('required')) {
      return 'WIFI_NOT_CONNECTED';
    }
    if (errorMsg.includes('wrong network') || errorMsg.includes('wifi tidak sesuai')) {
      return 'WIFI_WRONG_NETWORK';
    }

    // Photo errors
    if (errorMsg.includes('camera') && errorMsg.includes('denied')) {
      return 'CAMERA_PERMISSION_DENIED';
    }
    if (errorMsg.includes('face not detected')) return 'FACE_NOT_DETECTED';
    if (errorMsg.includes('face') && errorMsg.includes('match')) {
      return 'FACE_MISMATCH';
    }

    // Rate limit
    if (errorMsg.includes('rate limit') || errorMsg.includes('too many')) {
      return 'RATE_LIMIT_EXCEEDED';
    }

    return 'UNKNOWN_ERROR';
  }

  /**
   * Handle error with automatic code mapping and display
   */
  static handle(error: any, toast: any, context?: any): void {
    const errorCode = this.mapErrorToCode(error);
    this.showError(errorCode, toast, context);
  }
}
