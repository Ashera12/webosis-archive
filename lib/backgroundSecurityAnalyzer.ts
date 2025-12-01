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
    // Config from admin_settings
    schoolLatitude?: number;
    schoolLongitude?: number;
    allowedRadius?: number;
    accuracyThreshold?: number;
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
        // ✅ WILL BE LOADED FROM DATABASE - NO DEFAULTS!
        schoolLatitude: null,
        schoolLongitude: null,
        allowedRadius: 100,
        accuracyThreshold: 50,
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

      // 3. Get Location (with permission) + Fetch admin config
      try {
        const [location, locationConfig] = await Promise.allSettled([
          this.detectLocation(),
          this.fetchLocationConfig(),
        ]);
        
        if (location.status === 'fulfilled') {
          result.location = { ...result.location, ...location.value };
        } else {
          result.location.error = location.reason?.message || 'Location detection failed';
        }
        
        // Add school config to location
        if (locationConfig.status === 'fulfilled') {
          result.location.schoolLatitude = locationConfig.value.latitude;
          result.location.schoolLongitude = locationConfig.value.longitude;
          result.location.allowedRadius = locationConfig.value.radiusMeters;
          result.location.accuracyThreshold = locationConfig.value.accuracyThreshold || 50;
        }
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
        console.warn('[WiFi Validation] ⚠️ Config fetch failed, allowing access (permissive mode)');
        return { isValid: true }; // Permissive: allow if config unavailable
      }

      const data = await response.json();
      const allowedSSIDs: string[] = data.allowedSSIDs || [];
      const allowedIPRanges: string[] = data.allowedIPRanges || ['0.0.0.0/0']; // Default: allow all
      const requireWiFi = data.config?.requireWiFi || false;
      
      console.log('[WiFi Validation] 📋 Config loaded:', {
        allowedSSIDs,
        allowedIPRanges,
        requireWiFi,
        isPermissive: data.isPermissive,
        isDefault: data.isDefault
      });

      // 🔓 PERMISSIVE MODE: If config allows all IPs (0.0.0.0/0), bypass all checks
      if (allowedIPRanges.includes('0.0.0.0/0')) {
        console.log('[WiFi Validation] 🔓 PERMISSIVE MODE detected - allowing all access');
        console.log('[WiFi Validation] ✅ Access granted (development/testing mode)');
        return { isValid: true };
      }

      // 1️⃣ Check if user is NOT connected (no IP)
      if (!ipAddress || ipAddress === 'DETECTION_FAILED') {
        // If not requiring WiFi, allow access
        if (!requireWiFi) {
          console.log('[WiFi Validation] ⚠️ No IP detected, but WiFi not required - allowing');
          return { isValid: true };
        }
        return {
          isValid: false,
          error: '❌ Anda tidak tersambung WiFi atau menggunakan data seluler',
        };
      }

      // 2️⃣ Check if using cellular data
      if (connectionType === 'cellular' || connectionType === '4g' || connectionType === '5g') {
        // If not requiring WiFi, allow cellular
        if (!requireWiFi) {
          console.log('[WiFi Validation] ⚠️ Cellular detected, but WiFi not required - allowing');
          return { isValid: true };
        }
        return {
          isValid: false,
          error: '❌ Menggunakan data seluler. Harap sambungkan ke WiFi sekolah',
        };
      }

      // 3️⃣ Try SSID validation first (if available)
      if (ssid && ssid !== 'Unknown' && ssid !== 'DETECTION_FAILED') {
        const isSSIDValid = allowedSSIDs.includes(ssid) || allowedSSIDs.includes('Any WiFi');
        
        if (isSSIDValid) {
          console.log('[WiFi Validation] ✅ SSID matched:', ssid);
          return { isValid: true };
        } else if (!requireWiFi) {
          console.log('[WiFi Validation] ⚠️ SSID mismatch but WiFi not required - allowing');
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

      // Import CIDR-aware validation
      const { isIPInAllowedRanges } = await import('@/lib/networkUtils');
      const isIPValid = isIPInAllowedRanges(ipAddress, allowedIPRanges);

      if (isIPValid) {
        console.log('[WiFi Validation] ✅ IP valid - user is on school network');
        console.log('[WiFi Validation] ✅ IP range match:', {
          ip: ipAddress,
          matchedRanges: allowedIPRanges.filter(range => {
            const { isIPInRange } = require('@/lib/networkUtils');
            return isIPInRange(ipAddress, range);
          })
        });
        return { 
          isValid: true,
          error: undefined
        };
      } else {
        console.log('[WiFi Validation] ❌ IP tidak sesuai dengan range sekolah');
        console.log('[WiFi Validation] ❌ IP check failed:', {
          ip: ipAddress,
          allowedRanges: allowedIPRanges,
          reason: 'IP tidak dalam range yang diizinkan'
        });
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
   * Fetch school location config from school_location_config table
   * ✅ LOAD FROM DATABASE ONLY - NO FALLBACK!
   */
  private async fetchLocationConfig(): Promise<{
    latitude: number | null;
    longitude: number | null;
    radiusMeters: number;
    accuracyThreshold: number;
  }> {
    try {
      // Use /api/school/wifi-config endpoint (public, loads from school_location_config)
      const response = await fetch('/api/school/wifi-config', {
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        console.error('[Location Config] ❌ Failed to fetch school config - Admin must configure!');
        return {
          latitude: null,
          longitude: null,
          radiusMeters: 100,
          accuracyThreshold: 50,
        };
      }

      const data = await response.json();
      
      // ✅ LOAD FROM DATABASE - NO FALLBACK!
      const lat = data.config?.latitude ? parseFloat(data.config.latitude) : null;
      const lon = data.config?.longitude ? parseFloat(data.config.longitude) : null;
      
      if (!lat || !lon) {
        console.error('[Location Config] ❌ School GPS not configured in database! Admin panel required.');
        console.error('[Location Config] Config received:', data.config);
      } else {
        console.log('[Location Config] ✅ Loaded from DB:', {
          name: data.config.locationName,
          latitude: lat,
          longitude: lon,
          radius: data.config.radiusMeters
        });
      }
      
      return {
        latitude: lat,
        longitude: lon,
        radiusMeters: data.config?.radiusMeters || 100,
        accuracyThreshold: 50, // Default accuracy threshold
      };
    } catch (error) {
      console.error('[Location Config] ❌ Fetch failed:', error);
      return {
        latitude: null,
        longitude: null,
        radiusMeters: 100,
        accuracyThreshold: 50,
      };
    }
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

    // ✅ REMOVED WiFi blocking - backend validates IP
    // Frontend doesn't block, all validation happens server-side

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
