import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getMikrotikConnectedDevices, getMikrotikConfig } from '@/lib/mikrotikAPI';

/**
 * GET /api/admin/mikrotik/devices
 * 
 * Fetch connected devices from Mikrotik router
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
    
    console.log('[Mikrotik API] Admin requesting connected devices');
    
    // Get Mikrotik config
    const config = await getMikrotikConfig();
    
    if (!config) {
      return NextResponse.json({
        success: false,
        error: 'Mikrotik integration not configured',
        hint: 'Configure Mikrotik settings in admin_settings table',
        requiredSettings: [
          'mikrotik_enabled = true',
          'mikrotik_host = 192.168.88.1',
          'mikrotik_username = admin',
          'mikrotik_password = ***'
        ]
      }, { status: 400 });
    }
    
    // Fetch devices
    const devices = await getMikrotikConnectedDevices(config);
    
    return NextResponse.json({
      success: true,
      devices,
      count: devices.length,
      config: {
        host: config.host,
        port: config.port,
        username: config.username,
        password: '***' // Hide password
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('[Mikrotik API] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
