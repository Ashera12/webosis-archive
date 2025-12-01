import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/admin/settings/mikrotik
 * Fetch Mikrotik settings from admin_settings table
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
    
    // Fetch all Mikrotik and location settings
    const { data: settingsData } = await supabaseAdmin
      .from('admin_settings')
      .select('key, value')
      .in('key', [
        'mikrotik_enabled',
        'mikrotik_host',
        'mikrotik_port',
        'mikrotik_username',
        'mikrotik_password',
        'mikrotik_api_type',
        'mikrotik_use_dhcp',
        'mikrotik_use_arp',
        'mikrotik_cache_duration',
        'ip_validation_mode',
        'location_strict_mode',
        'location_max_radius',
        'location_gps_accuracy_required'
      ]);
    
    const settings: any = {};
    settingsData?.forEach(s => {
      settings[s.key] = s.value || '';
    });
    
    return NextResponse.json({
      success: true,
      settings
    });
    
  } catch (error: any) {
    console.error('[Mikrotik Settings API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * POST /api/admin/settings/mikrotik
 * Update Mikrotik settings
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
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
    
    const body = await request.json();
    
    console.log('[Mikrotik Settings API] Updating settings:', Object.keys(body));
    
    // Update each setting individually
    const updates = Object.entries(body).map(([key, value]) => {
      return supabaseAdmin
        .from('admin_settings')
        .upsert({
          key,
          value: String(value),
          category: key.includes('location') ? 'attendance' : 'security',
          is_secret: ['mikrotik_password', 'mikrotik_host', 'mikrotik_username'].includes(key),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        });
    });
    
    await Promise.all(updates);
    
    console.log('[Mikrotik Settings API] ✅ Settings updated successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully'
    });
    
  } catch (error: any) {
    console.error('[Mikrotik Settings API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}
