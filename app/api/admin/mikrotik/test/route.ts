import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getMikrotikConfig } from '@/lib/mikrotikAPI';

/**
 * GET /api/admin/mikrotik/test
 * 
 * Test Mikrotik connection
 * ADMIN ONLY
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    const { supabaseAdmin } = await import('@/lib/supabase/server');
    
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single();
    
    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    console.log('[Mikrotik Test] Admin testing connection');
    
    // Get config
    const config = await getMikrotikConfig();
    
    if (!config) {
      return NextResponse.json({
        success: false,
        connected: false,
        error: 'Mikrotik not configured',
        hint: 'Configure mikrotik_* settings in admin_settings'
      });
    }
    
    // Test connection by fetching devices
    const startTime = Date.now();
    
    try {
      const { getMikrotikConnectedDevices } = await import('@/lib/mikrotikAPI');
      const devices = await getMikrotikConnectedDevices(config);
      
      const duration = Date.now() - startTime;
      
      return NextResponse.json({
        success: true,
        connected: true,
        devices: devices.length,
        responseTime: duration + 'ms',
        config: {
          host: config.host,
          port: config.port,
          username: config.username,
          apiType: 'REST',
          timeout: config.timeout + 'ms'
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (connectionError: any) {
      const duration = Date.now() - startTime;
      
      return NextResponse.json({
        success: false,
        connected: false,
        error: connectionError.message,
        responseTime: duration + 'ms',
        config: {
          host: config.host,
          port: config.port,
          username: config.username
        },
        troubleshooting: [
          'Check if Mikrotik router is online',
          'Verify REST API is enabled (RouterOS 7.1+)',
          'Check IP address and port',
          'Verify username and password',
          'Check firewall rules allow API access'
        ]
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('[Mikrotik Test] Error:', error);
    
    return NextResponse.json({
      success: false,
      connected: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}
