// lib/backgroundSecurityAnalyzer.ts
/**
 * BACKGROUND SECURITY ANALYZER
 * Runs automatically after login to pre-validate security requirements
 * This ensures instant feedback when user opens attendance page
 */

interface SecurityAnalysisResult {
  timestamp: string;
  userId: string;
  wifi: {
    detected: boolean;
    ssid: string;
    ipAddress: string | null;
    connectionType: string | null;
    isValid: boolean;
    validationError?: string;
  };
  location: {
    detected: boolean;
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    error?: string;
  };
  network: {
    ipAddress: string | null;
    ipType: string;
    isLocalNetwork: boolean;
    connectionType: string | null;
  };
  biometric: {
    registered: boolean;
    lastSetup?: string;
  };
  overallStatus: 'READY' | 'NEEDS_SETUP' | 'BLOCKED';
  blockReasons: string[];
  analysisCompleted: boolean;
}

class BackgroundSecurityAnalyzer {
  private static instance: BackgroundSecurityAnalyzer;
  private analysisCache: Map<string, SecurityAnalysisResult> = new Map();
  private analysisInProgress: Map<string, Promise<SecurityAnalysisResult>> = new Map();
  private readonly CACHE_DURATION_MS = 2 * 60 * 1000; // 2 minutes

  private constructor() {}

  static getInstance(): BackgroundSecurityAnalyzer {
    if (!BackgroundSecurityAnalyzer.instance) {
      BackgroundSecurityAnalyzer.instance = new BackgroundSecurityAnalyzer();
    }
    return BackgroundSecurityAnalyzer.instance;
  }

  /**
   * Start background analysis immediately after login
   */
  async startAnalysis(userId: string, userEmail: string): Promise<SecurityAnalysisResult> {
    console.log('[Background Analyzer] Starting for user:', userEmail);

    // Check if analysis is already in progress
    const inProgress = this.analysisInProgress.get(userId);
    if (inProgress) {
      console.log('[Background Analyzer] Analysis already in progress, waiting...');
      return inProgress;
    }

    // Check cache
    const cached = this.getCachedAnalysis(userId);
    if (cached) {
      console.log('[Background Analyzer] Using cached analysis');
      return cached;
    }

    // Start new analysis
    const analysisPromise = this.performAnalysis(userId, userEmail);
    this.analysisInProgress.set(userId, analysisPromise);

    try {
      const result = await analysisPromise;
      this.analysisCache.set(userId, result);
      return result;
    } finally {
      this.analysisInProgress.delete(userId);
    }
  }

  /**
   * Get cached analysis if still valid
   */
  getCachedAnalysis(userId: string): SecurityAnalysisResult | null {
    const cached = this.analysisCache.get(userId);
    if (!cached) return null;

    const age = Date.now() - new Date(cached.timestamp).getTime();
    if (age > this.CACHE_DURATION_MS) {
      this.analysisCache.delete(userId);
      return null;
    }

    return cached;
  }

  /**
   * Perform comprehensive security analysis
   */
  private async performAnalysis(userId: string, userEmail: string): Promise<SecurityAnalysisResult> {
    const result: SecurityAnalysisResult = {
      timestamp: new Date().toISOString(),
      userId,
      wifi: {
        detected: false,
        ssid: 'Unknown',
        ipAddress: null,
        connectionType: null,
        isValid: false,
      },
      location: {
        detected: false,
      },
      network: {
        ipAddress: null,
        ipType: 'unknown',
        isLocalNetwork: false,
        connectionType: null,
      },
      biometric: {
        registered: false,
      },
      overallStatus: 'NEEDS_SETUP',
      blockReasons: [],
      analysisCompleted: false,
    };

    try {
      // 1. Detect Network & WiFi (parallel)
      const [networkInfo, wifiInfo] = await Promise.allSettled([
        this.detectNetwork(),
        this.detectWiFi(),
      ]);

      if (networkInfo.status === 'fulfilled') {
        result.network = networkInfo.value;
        result.wifi.ipAddress = networkInfo.value.ipAddress;
        result.wifi.connectionType = networkInfo.value.connectionType;
      }

      if (wifiInfo.status === 'fulfilled') {
        result.wifi = { ...result.wifi, ...wifiInfo.value };
      }

      // 2. Validate WiFi against config (with IP fallback)
      const wifiValidation = await this.validateWiFi(
        result.wifi.ssid,
        result.wifi.ipAddress,
        result.wifi.connectionType
      );
      result.wifi.isValid = wifiValidation.isValid;
      if (!wifiValidation.isValid) {
        result.wifi.validationError = wifiValidation.error;
        result.blockReasons.push('INVALID_WIFI');
      }

      // 3. Get Location (with permission)
      try {
        const location = await this.detectLocation();
        result.location = location;
      } catch (error: any) {
        result.location.error = error.message;
        // Location might fail due to permission, not necessarily a blocker
      }

      // 4. Check Biometric Registration
      const biometric = await this.checkBiometricRegistration(userId);
      result.biometric = biometric;
      if (!biometric.registered) {
        result.blockReasons.push('BIOMETRIC_NOT_REGISTERED');
      }

      // 5. Determine overall status
      result.overallStatus = this.determineOverallStatus(result);
      result.analysisCompleted = true;

      console.log('[Background Analyzer] Analysis complete:', {
        status: result.overallStatus,
        blockReasons: result.blockReasons,
        wifiValid: result.wifi.isValid,
        biometricRegistered: result.biometric.registered,
      });

      // 6. Log analysis to database for monitoring
      await this.logAnalysis(userId, userEmail, result);

      return result;
    } catch (error) {
      console.error('[Background Analyzer] Analysis failed:', error);
      result.overallStatus = 'BLOCKED';
      result.blockReasons.push('ANALYSIS_FAILED');
      return result;
    }
  }

  /**
   * Detect network information
   */
  private async detectNetwork() {
    try {
      // Import dynamically to avoid SSR issues
      const { getNetworkInfo } = await import('@/lib/networkUtils');
      return await getNetworkInfo();
    } catch (error) {
      console.error('[Background Analyzer] Network detection failed:', error);
      return {
        ipAddress: null,
        ipType: 'unknown',
        isLocalNetwork: false,
        connectionType: null,
      };
    }
  }

  /**
   * Detect WiFi (browser limitation - usually returns Unknown)
   */
  private async detectWiFi() {
    try {
      const { getNetworkInfo, getWiFiNetworkDetails } = await import('@/lib/networkUtils');
      const network = await getNetworkInfo();
      
      let ssid = 'Unknown';
      try {
        const wifiDetails = await getWiFiNetworkDetails('Unknown');
        if (wifiDetails.ssid && wifiDetails.ssid !== 'Unknown') {
          ssid = wifiDetails.ssid;
        }
      } catch (err) {
        console.warn('[Background Analyzer] WiFi SSID detection not supported');
      }

      return {
        detected: network.connectionType === 'wifi',
        ssid,
        ipAddress: network.ipAddress,
        connectionType: network.connectionType,
        isValid: false, // Will be validated separately
      };
    } catch (error) {
      console.error('[Background Analyzer] WiFi detection failed:', error);
      return {
        detected: false,
        ssid: 'DETECTION_FAILED',
        ipAddress: null,
        connectionType: null,
        isValid: false,
      };
    }
  }

  /**
   * Validate WiFi against school config
   * Uses IP range validation as fallback when SSID cannot be detected
   */
  private async validateWiFi(ssid: string, ipAddress?: string | null, connectionType?: string | null): Promise<{ isValid: boolean; error?: string }> {
    try {
      // Fetch school config
      const response = await fetch('/api/school/wifi-config', {
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        return { isValid: false, error: 'Gagal memuat konfigurasi WiFi' };
      }

      const data = await response.json();
      const allowedSSIDs: string[] = data.allowedSSIDs || [];
      const allowedIPRanges: string[] = data.allowedIPRanges || ['192.168.', '10.0.', '172.16.'];
      const requireWiFi = data.config?.requireWiFi || false;

      // 1️⃣ Check if user is NOT connected (no IP)
      if (!ipAddress || ipAddress === 'DETECTION_FAILED') {
        return {
          isValid: false,
          error: '❌ Anda tidak tersambung WiFi atau menggunakan data seluler',
        };
      }

      // 2️⃣ Check if using cellular data
      if (connectionType === 'cellular' || connectionType === '4g' || connectionType === '5g') {
        return {
          isValid: false,
          error: '❌ Menggunakan data seluler. Harap sambungkan ke WiFi sekolah',
        };
      }

      // 3️⃣ Try SSID validation first (if available)
      if (ssid && ssid !== 'Unknown' && ssid !== 'DETECTION_FAILED') {
        const isSSIDValid = allowedSSIDs.includes(ssid);
        
        if (isSSIDValid) {
          return { isValid: true };
        } else {
          return {
            isValid: false,
            error: `❌ WiFi tidak sesuai: "${ssid}". Gunakan: ${allowedSSIDs.join(', ')}`,
          };
        }
      }

      // 4️⃣ Fallback: IP Range Validation (when SSID cannot be detected)
      console.log('[WiFi Validation] SSID not available, using IP range validation...');
      console.log('[WiFi Validation] IP:', ipAddress, 'Allowed ranges:', allowedIPRanges);

      const isIPValid = allowedIPRanges.some((range) => ipAddress.startsWith(range));

      if (isIPValid) {
        console.log('[WiFi Validation] ✅ IP valid - user is on school network');
        return { 
          isValid: true,
          error: undefined
        };
      } else {
        console.log('[WiFi Validation] ❌ IP tidak sesuai dengan range sekolah');
        return {
          isValid: false,
          error: `❌ WiFi tidak sesuai. IP Anda: ${ipAddress}. Sambungkan ke WiFi sekolah: ${allowedSSIDs.join(', ')}`,
        };
      }
    } catch (error) {
      console.error('[Background Analyzer] WiFi validation failed:', error);
      return { isValid: false, error: 'Gagal validasi WiFi' };
    }
  }

  /**
   * Detect location
   */
  private async detectLocation(): Promise<{
    detected: boolean;
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    error?: string;
  }> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ detected: false, error: 'Geolocation not supported' });
        return;
      }

      const timeout = setTimeout(() => {
        resolve({ detected: false, error: 'Location timeout' });
      }, 5000);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeout);
          resolve({
            detected: true,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          clearTimeout(timeout);
          resolve({
            detected: false,
            error: error.message,
          });
        },
        { timeout: 5000, maximumAge: 60000 }
      );
    });
  }

  /**
   * Check if biometric is registered
   */
  private async checkBiometricRegistration(userId: string): Promise<{
    registered: boolean;
    lastSetup?: string;
  }> {
    try {
      const response = await fetch('/api/attendance/biometric/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, checkOnly: true }),
      });

      if (!response.ok) {
        return { registered: false };
      }

      const data = await response.json();
      return {
        registered: data.registered || false,
        lastSetup: data.lastSetup,
      };
    } catch (error) {
      console.error('[Background Analyzer] Biometric check failed:', error);
      return { registered: false };
    }
  }

  /**
   * Determine overall status
   */
  private determineOverallStatus(result: SecurityAnalysisResult): 'READY' | 'NEEDS_SETUP' | 'BLOCKED' {
    // If biometric not registered, needs setup
    if (!result.biometric.registered) {
      return 'NEEDS_SETUP';
    }

    // If WiFi invalid, blocked
    if (!result.wifi.isValid) {
      return 'BLOCKED';
    }

    // All good
    return 'READY';
  }

  /**
   * Log analysis to database
   */
  private async logAnalysis(userId: string, userEmail: string, result: SecurityAnalysisResult) {
    try {
      await fetch('/api/attendance/log-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId,
          activityType: 'background_security_analysis',
          description: `Background analysis: ${result.overallStatus}`,
          status: result.overallStatus === 'READY' ? 'success' : 'warning',
          metadata: {
            ...result,
            userEmail,
          },
        }),
      });
    } catch (error) {
      console.error('[Background Analyzer] Failed to log analysis:', error);
    }
  }

  /**
   * Clear cache for user (e.g., after config change)
   */
  clearCache(userId: string) {
    this.analysisCache.delete(userId);
    console.log('[Background Analyzer] Cache cleared for user:', userId);
  }
}

export const backgroundSecurityAnalyzer = BackgroundSecurityAnalyzer.getInstance();
export type { SecurityAnalysisResult };
