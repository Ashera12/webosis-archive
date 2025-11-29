/**
 * Advanced Network Detection Utilities
 * Detect IP Address, Network Info, WiFi Details for Enhanced Security
 */

export interface NetworkInfo {
  ipAddress: string | null;
  ipType: 'private' | 'public' | 'unknown';
  connectionType: string | null;
  effectiveType: string | null;
  downlink: number | null;
  rtt: number | null;
  saveData: boolean;
  isLocalNetwork: boolean;
  networkStrength: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
}

export interface WiFiNetworkDetails {
  ssid: string;
  ipAddress: string | null;
  gateway: string | null;
  subnet: string | null;
  isPrivateNetwork: boolean;
  connectionQuality: number; // 0-100
  timestamp: number;
}

/**
 * Get comprehensive network information
 */
export async function getNetworkInfo(): Promise<NetworkInfo> {
  const networkInfo: NetworkInfo = {
    ipAddress: null,
    ipType: 'unknown',
    connectionType: null,
    effectiveType: null,
    downlink: null,
    rtt: null,
    saveData: false,
    isLocalNetwork: false,
    networkStrength: 'unknown'
  };

  try {
    // 1. Get Connection API data (if available)
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;
    
    if (connection) {
      networkInfo.connectionType = connection.type || null;
      networkInfo.effectiveType = connection.effectiveType || null;
      networkInfo.downlink = connection.downlink || null;
      networkInfo.rtt = connection.rtt || null;
      networkInfo.saveData = connection.saveData || false;
      
      // Determine network strength based on RTT and downlink
      if (connection.rtt && connection.downlink) {
        if (connection.rtt < 100 && connection.downlink > 5) {
          networkInfo.networkStrength = 'excellent';
        } else if (connection.rtt < 200 && connection.downlink > 2) {
          networkInfo.networkStrength = 'good';
        } else if (connection.rtt < 500 && connection.downlink > 1) {
          networkInfo.networkStrength = 'fair';
        } else {
          networkInfo.networkStrength = 'poor';
        }
      }
    }

    // 2. Get Local IP Address using WebRTC
    const localIP = await getLocalIPAddress();
    if (localIP) {
      networkInfo.ipAddress = localIP;
      networkInfo.ipType = isPrivateIP(localIP) ? 'private' : 'public';
      networkInfo.isLocalNetwork = isPrivateIP(localIP);
    }

  } catch (error) {
    console.error('[Network Utils] Error getting network info:', error);
  }

  return networkInfo;
}

/**
 * Get local IP address using WebRTC
 */
export async function getLocalIPAddress(): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      
      pc.createDataChannel('');
      
      pc.createOffer().then(offer => pc.setLocalDescription(offer));
      
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          pc.close();
          resolve(null);
        }
      }, 3000); // 3 second timeout
      
      pc.onicecandidate = (ice) => {
        if (!ice || !ice.candidate || !ice.candidate.candidate) {
          return;
        }
        
        const candidateStr = ice.candidate.candidate;
        const ipRegex = /([0-9]{1,3}\\.){3}[0-9]{1,3}/;
        const match = candidateStr.match(ipRegex);
        
        if (match && !resolved) {
          resolved = true;
          clearTimeout(timeout);
          pc.close();
          resolve(match[0]);
        }
      };
      
    } catch (error) {
      console.error('[Network Utils] WebRTC IP detection failed:', error);
      resolve(null);
    }
  });
}

/**
 * Check if IP is in private range
 */
export function isPrivateIP(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  
  if (parts.length !== 4) return false;
  
  // 10.0.0.0 - 10.255.255.255
  if (parts[0] === 10) return true;
  
  // 172.16.0.0 - 172.31.255.255
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  
  // 192.168.0.0 - 192.168.255.255
  if (parts[0] === 192 && parts[1] === 168) return true;
  
  // 127.0.0.0 - 127.255.255.255 (localhost)
  if (parts[0] === 127) return true;
  
  return false;
}

/**
 * Validate IP address is within allowed subnet
 */
export function isIPInSubnet(ip: string, subnet: string, mask: string): boolean {
  try {
    const ipParts = ip.split('.').map(Number);
    const subnetParts = subnet.split('.').map(Number);
    const maskParts = mask.split('.').map(Number);
    
    if (ipParts.length !== 4 || subnetParts.length !== 4 || maskParts.length !== 4) {
      return false;
    }
    
    for (let i = 0; i < 4; i++) {
      if ((ipParts[i] & maskParts[i]) !== (subnetParts[i] & maskParts[i])) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('[Network Utils] IP subnet validation error:', error);
    return false;
  }
}

/**
 * Calculate network similarity score (0-100)
 * Higher score = more similar network characteristics
 */
export function calculateNetworkSimilarity(
  current: NetworkInfo,
  reference: NetworkInfo
): number {
  let score = 0;
  let checks = 0;
  
  // IP Address match (30 points)
  if (current.ipAddress && reference.ipAddress) {
    checks++;
    if (current.ipAddress === reference.ipAddress) {
      score += 30;
    } else {
      // Partial match for same subnet (15 points)
      const currentSubnet = current.ipAddress.split('.').slice(0, 3).join('.');
      const refSubnet = reference.ipAddress.split('.').slice(0, 3).join('.');
      if (currentSubnet === refSubnet) {
        score += 15;
      }
    }
  }
  
  // IP Type match (20 points)
  if (current.ipType && reference.ipType) {
    checks++;
    if (current.ipType === reference.ipType) {
      score += 20;
    }
  }
  
  // Connection Type match (20 points)
  if (current.connectionType && reference.connectionType) {
    checks++;
    if (current.connectionType === reference.connectionType) {
      score += 20;
    }
  }
  
  // Network Strength similarity (15 points)
  if (current.networkStrength && reference.networkStrength) {
    checks++;
    const strengthMap = { excellent: 4, good: 3, fair: 2, poor: 1, unknown: 0 };
    const currentStrength = strengthMap[current.networkStrength];
    const refStrength = strengthMap[reference.networkStrength];
    const diff = Math.abs(currentStrength - refStrength);
    score += 15 * (1 - diff / 4);
  }
  
  // RTT similarity (15 points)
  if (current.rtt !== null && reference.rtt !== null) {
    checks++;
    const diff = Math.abs(current.rtt - reference.rtt);
    if (diff < 50) {
      score += 15;
    } else if (diff < 100) {
      score += 10;
    } else if (diff < 200) {
      score += 5;
    }
  }
  
  return checks > 0 ? score : 0;
}

/**
 * Get comprehensive WiFi network details
 */
export async function getWiFiNetworkDetails(ssid: string): Promise<WiFiNetworkDetails> {
  const networkInfo = await getNetworkInfo();
  
  const details: WiFiNetworkDetails = {
    ssid: ssid,
    ipAddress: networkInfo.ipAddress,
    gateway: null, // Browser cannot detect gateway
    subnet: null,  // Browser cannot detect subnet
    isPrivateNetwork: networkInfo.isLocalNetwork,
    connectionQuality: 0,
    timestamp: Date.now()
  };
  
  // Calculate connection quality score (0-100)
  let qualityScore = 0;
  
  // IP detection (20 points)
  if (networkInfo.ipAddress) qualityScore += 20;
  
  // Private network (20 points)
  if (networkInfo.isLocalNetwork) qualityScore += 20;
  
  // Network strength (40 points)
  const strengthScores = {
    excellent: 40,
    good: 30,
    fair: 20,
    poor: 10,
    unknown: 0
  };
  qualityScore += strengthScores[networkInfo.networkStrength];
  
  // Connection stability (20 points)
  if (networkInfo.rtt && networkInfo.rtt < 100) {
    qualityScore += 20;
  } else if (networkInfo.rtt && networkInfo.rtt < 200) {
    qualityScore += 10;
  }
  
  details.connectionQuality = qualityScore;
  
  // Try to infer subnet from IP
  if (networkInfo.ipAddress && isPrivateIP(networkInfo.ipAddress)) {
    const parts = networkInfo.ipAddress.split('.');
    details.subnet = `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    details.gateway = `${parts[0]}.${parts[1]}.${parts[2]}.1`; // Common gateway
  }
  
  return details;
}

/**
 * Validate network matches expected configuration
 */
export interface NetworkValidationResult {
  valid: boolean;
  score: number;
  reasons: string[];
  warnings: string[];
}

export function validateNetwork(
  currentNetwork: WiFiNetworkDetails,
  allowedNetworks: Array<{
    ssid: string;
    ipRange?: string;
    subnet?: string;
    minQuality?: number;
  }>
): NetworkValidationResult {
  const result: NetworkValidationResult = {
    valid: false,
    score: 0,
    reasons: [],
    warnings: []
  };
  
  // Find matching SSID
  const matchedNetwork = allowedNetworks.find(
    net => net.ssid.toLowerCase() === currentNetwork.ssid.toLowerCase()
  );
  
  if (!matchedNetwork) {
    result.reasons.push('SSID tidak terdaftar dalam daftar WiFi yang diizinkan');
    return result;
  }
  
  result.score += 30; // SSID match
  
  // Check IP range if specified
  if (matchedNetwork.ipRange && currentNetwork.ipAddress) {
    const [rangeStart, rangeEnd] = matchedNetwork.ipRange.split('-');
    const currentIP = currentNetwork.ipAddress;
    
    // Simple range check (can be enhanced)
    const currentParts = currentIP.split('.').map(Number);
    const startParts = rangeStart.split('.').map(Number);
    const endParts = rangeEnd.split('.').map(Number);
    
    const currentNum = currentParts[3];
    const startNum = startParts[3];
    const endNum = endParts[3];
    
    if (currentNum >= startNum && currentNum <= endNum) {
      result.score += 30; // IP range match
    } else {
      result.warnings.push('IP address di luar range yang diizinkan');
      result.score += 10; // Partial credit
    }
  } else if (!currentNetwork.ipAddress) {
    result.warnings.push('IP address tidak terdeteksi');
  } else {
    result.score += 20; // No range specified, give partial credit
  }
  
  // Check subnet if specified
  if (matchedNetwork.subnet && currentNetwork.subnet) {
    if (matchedNetwork.subnet === currentNetwork.subnet) {
      result.score += 20; // Subnet match
    } else {
      result.warnings.push('Subnet tidak sesuai');
    }
  } else {
    result.score += 10; // No subnet check
  }
  
  // Check connection quality
  const minQuality = matchedNetwork.minQuality || 50;
  if (currentNetwork.connectionQuality >= minQuality) {
    result.score += 20; // Quality sufficient
  } else {
    result.warnings.push(`Kualitas koneksi rendah: ${currentNetwork.connectionQuality}/${minQuality}`);
    result.score += 10; // Partial credit
  }
  
  // Valid if score >= 70
  result.valid = result.score >= 70;
  
  if (!result.valid) {
    result.reasons.push('Skor validasi jaringan terlalu rendah');
  }
  
  return result;
}
