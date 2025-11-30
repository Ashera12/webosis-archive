import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/attendance/detect-ip
 * Server-side IP detection (fallback when WebRTC fails)
 * 
 * Returns user's IP address from request headers
 */
export async function GET(request: NextRequest) {
  try {
    // Try multiple header sources (Vercel, Cloudflare, nginx, etc.)
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfIP = request.headers.get('cf-connecting-ip');
    
    // x-forwarded-for can have multiple IPs (client, proxy1, proxy2...)
    // First IP is the original client
    let detectedIP = null;
    
    if (forwardedFor) {
      const ips = forwardedFor.split(',').map(ip => ip.trim());
      detectedIP = ips[0]; // First IP is the client
    } else if (realIP) {
      detectedIP = realIP;
    } else if (cfIP) {
      detectedIP = cfIP;
    }

    console.log('[Detect IP API] 🔍 Headers:', {
      'x-forwarded-for': forwardedFor,
      'x-real-ip': realIP,
      'cf-connecting-ip': cfIP,
      'detected': detectedIP
    });

    // Determine if IP is local/private
    const isLocalNetwork = detectedIP ? isPrivateIP(detectedIP) : false;
    
    // Determine connection type based on IP
    let connectionType = 'unknown';
    if (detectedIP) {
      if (isLocalNetwork) {
        connectionType = 'wifi'; // Assume WiFi if on private network
      } else {
        connectionType = 'cellular'; // Assume cellular if public IP
      }
    }

    console.log('[Detect IP API] ✅ Result:', {
      ip: detectedIP,
      isLocalNetwork,
      connectionType
    });

    return NextResponse.json({
      success: true,
      ipAddress: detectedIP,
      isLocalNetwork,
      connectionType,
      source: forwardedFor ? 'x-forwarded-for' : realIP ? 'x-real-ip' : cfIP ? 'cf-connecting-ip' : 'none',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[Detect IP API] ❌ Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to detect IP',
      ipAddress: null,
      isLocalNetwork: false,
      connectionType: 'unknown'
    }, { status: 500 });
  }
}

/**
 * Check if IP is in private range
 */
function isPrivateIP(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  
  if (parts.length !== 4) return false;
  
  // Validate each octet is 0-255
  if (parts.some(p => isNaN(p) || p < 0 || p > 255)) return false;
  
  // 10.0.0.0 - 10.255.255.255
  if (parts[0] === 10) return true;
  
  // 172.16.0.0 - 172.31.255.255
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  
  // 192.168.0.0 - 192.168.255.255
  if (parts[0] === 192 && parts[1] === 168) return true;
  
  // 127.0.0.0 - 127.255.255.255 (localhost)
  if (parts[0] === 127) return true;
  
  // 100.64.0.0 - 100.127.255.255 (Carrier-grade NAT)
  if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;
  
  return false;
}
