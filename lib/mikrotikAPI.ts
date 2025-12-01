/**
 * MIKROTIK API INTEGRATION
 * 
 * Fetch connected devices from Mikrotik router for real-time IP validation
 * Supports RouterOS API v6 and v7
 */

interface MikrotikDevice {
  macAddress: string;
  ipAddress: string;
  hostName?: string;
  interface: string;
  uptime: string;
  lastSeen: Date;
}

interface MikrotikConfig {
  host: string;      // Router IP (e.g., 192.168.88.1)
  port?: number;      // API port (default: 8728)
  username: string;
  password: string;
  timeout?: number;   // Request timeout in ms (default: 5000)
}

/**
 * Get connected devices from Mikrotik router
 * Uses REST API (requires Mikrotik RouterOS with REST API enabled)
 */
export async function getMikrotikConnectedDevices(
  config: MikrotikConfig
): Promise<MikrotikDevice[]> {
  try {
    const port = config.port || 8728;
    const timeout = config.timeout || 5000;
    
    console.log('[Mikrotik API] Fetching connected devices from:', config.host);
    
    // Mikrotik REST API endpoint (requires RouterOS 7.1+)
    // Alternative: Use /ip/dhcp-server/lease for DHCP leases
    const apiUrl = `http://${config.host}/rest/ip/dhcp-server/lease`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${config.username}:${config.password}`).toString('base64'),
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Mikrotik API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Parse Mikrotik response
    const devices: MikrotikDevice[] = data
      .filter((lease: any) => lease.status === 'bound') // Only active leases
      .map((lease: any) => ({
        macAddress: lease['mac-address'] || lease.macAddress,
        ipAddress: lease['address'] || lease.address,
        hostName: lease['host-name'] || lease.hostName || 'Unknown',
        interface: lease['server'] || lease.server || 'bridge',
        uptime: lease['uptime'] || lease.uptime || '0s',
        lastSeen: lease['last-seen'] ? new Date(lease['last-seen']) : new Date()
      }));
    
    console.log('[Mikrotik API] ✅ Fetched', devices.length, 'connected devices');
    
    return devices;
    
  } catch (error: any) {
    console.error('[Mikrotik API] ❌ Error fetching devices:', error.message);
    
    // Return empty array on error (graceful degradation)
    // Attendance can still work with IP whitelist fallback
    return [];
  }
}

/**
 * Check if IP is currently connected to Mikrotik router
 */
export async function isIPConnectedToMikrotik(
  ipAddress: string,
  config: MikrotikConfig
): Promise<boolean> {
  try {
    const devices = await getMikrotikConnectedDevices(config);
    const connected = devices.some(device => device.ipAddress === ipAddress);
    
    console.log('[Mikrotik] IP', ipAddress, connected ? '✅ CONNECTED' : '❌ NOT CONNECTED');
    
    return connected;
  } catch (error) {
    console.error('[Mikrotik] Error checking IP:', error);
    return false;
  }
}

/**
 * Get Mikrotik config from admin_settings
 */
export async function getMikrotikConfig(): Promise<MikrotikConfig | null> {
  try {
    const { supabaseAdmin } = await import('./supabase/server');
    
    const { data: settings } = await supabaseAdmin
      .from('admin_settings')
      .select('key, value')
      .in('key', [
        'mikrotik_host',
        'mikrotik_port',
        'mikrotik_username',
        'mikrotik_password',
        'mikrotik_enabled'
      ]);
    
    if (!settings || settings.length === 0) {
      console.warn('[Mikrotik] No config found in admin_settings');
      return null;
    }
    
    const settingsMap = new Map(settings.map(s => [s.key, s.value]));
    
    // Check if Mikrotik integration is enabled
    if (settingsMap.get('mikrotik_enabled') !== 'true') {
      console.log('[Mikrotik] Integration disabled');
      return null;
    }
    
    const host = settingsMap.get('mikrotik_host');
    const username = settingsMap.get('mikrotik_username');
    const password = settingsMap.get('mikrotik_password');
    
    if (!host || !username || !password) {
      console.warn('[Mikrotik] Incomplete config:', { host, username, password: '***' });
      return null;
    }
    
    return {
      host,
      port: parseInt(settingsMap.get('mikrotik_port') || '8728'),
      username,
      password,
      timeout: 5000
    };
    
  } catch (error) {
    console.error('[Mikrotik] Error loading config:', error);
    return null;
  }
}

/**
 * Validate IP with Mikrotik (if enabled) OR fallback to IP whitelist
 */
export async function validateIPWithMikrotik(
  ipAddress: string,
  allowedIPRanges: string[]
): Promise<{ valid: boolean; source: 'mikrotik' | 'whitelist' | 'error'; details?: string }> {
  try {
    // Try Mikrotik first (if configured)
    const mikrotikConfig = await getMikrotikConfig();
    
    if (mikrotikConfig) {
      console.log('[IP Validation] Using Mikrotik for IP validation');
      
      const connectedDevices = await getMikrotikConnectedDevices(mikrotikConfig);
      const isConnected = connectedDevices.some(device => device.ipAddress === ipAddress);
      
      if (isConnected) {
        return {
          valid: true,
          source: 'mikrotik',
          details: 'IP found in Mikrotik DHCP leases'
        };
      }
      
      // IP not found in Mikrotik, but might be static IP
      console.warn('[IP Validation] IP not found in Mikrotik DHCP, checking whitelist...');
    }
    
    // Fallback to IP whitelist (CIDR ranges)
    console.log('[IP Validation] Using IP whitelist for validation');
    
    const { isIPInAllowedRanges } = await import('./networkUtils');
    const isWhitelisted = isIPInAllowedRanges(ipAddress, allowedIPRanges);
    
    return {
      valid: isWhitelisted,
      source: 'whitelist',
      details: isWhitelisted 
        ? 'IP found in whitelist ranges' 
        : `IP ${ipAddress} not in allowed ranges: ${allowedIPRanges.join(', ')}`
    };
    
  } catch (error: any) {
    console.error('[IP Validation] Error:', error.message);
    
    return {
      valid: false,
      source: 'error',
      details: error.message
    };
  }
}
