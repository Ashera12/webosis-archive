import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Admin Supabase client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * GET /api/school/wifi-config
 * Returns allowed WiFi SSIDs for school attendance
 * 
 * Response:
 * {
 *   allowedSSIDs: string[],
 *   config: {...}
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Fetch from school_location_config
    const { data: config, error } = await supabaseAdmin
      .from('school_location_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error) {
      // Try fetching ALL locations as fallback
      const { data: allConfigs, error: allError } = await supabaseAdmin
        .from('school_location_config')
        .select('*')
        .limit(10);

      // If we have configs, use the first one
      if (allConfigs && allConfigs.length > 0) {
        const fallbackConfig = allConfigs.find(c => c.is_active) || allConfigs[0];
        
        const allowedSSIDs = Array.isArray(fallbackConfig.allowed_wifi_ssids) 
          ? fallbackConfig.allowed_wifi_ssids 
          : [];
        const allowedIPRanges = Array.isArray(fallbackConfig.allowed_ip_ranges)
          ? fallbackConfig.allowed_ip_ranges
          : ['192.168.', '10.0.', '172.16.'];

        return NextResponse.json({
          allowedSSIDs,
          allowedIPRanges,
          config: {
            locationName: fallbackConfig.location_name,
            requireWiFi: fallbackConfig.require_wifi || false,
            isActive: fallbackConfig.is_active
          },
          isFallback: true
        });
      }
      
      // No configs at all - return permissive defaults
      return NextResponse.json({
        allowedSSIDs: ['Any WiFi'],  // Accept any SSID
        allowedIPRanges: ['0.0.0.0/0'],  // Allow ALL IPs (development mode)
        config: {
          locationName: 'Development - Permissive Mode',
          requireWiFi: false,
          isActive: true
        },
        message: '🔓 PERMISSIVE MODE: All IPs allowed for development',
        isDefault: true,
        isPermissive: true
      });
    }

    console.log('[WiFi Config API] 📋 Config found:', {
      id: config.id,
      name: config.location_name,
      });
    }

    // Extract allowed SSIDs and IP ranges from config
    const allowedSSIDs = Array.isArray(config.allowed_wifi_ssids) 
      ? config.allowed_wifi_ssids 
      : (config.allowed_wifi_ssids ? [config.allowed_wifi_ssids] : []);
    
    const allowedIPRanges = Array.isArray(config.allowed_ip_ranges)
      ? config.allowed_ip_ranges
      : (config.allowed_ip_ranges ? [config.allowed_ip_ranges] : ['192.168.', '10.0.', '172.16.']);

    return NextResponse.json({itude,
        radiusMeters: config.radius_meters,
        requireWiFi: config.require_wifi || false,
        isActive: config.is_active,
        // ✅ ALL ADMIN PANEL SECURITY SETTINGS
        network_security_level: config.network_security_level || 'medium',
        bypass_gps_validation: config.bypass_gps_validation || false,
      }
    });

  } catch (error: any) {
    console.error('[WiFi Config API] ❌ Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch WiFi config',
        allowedSSIDs: [], // Fallback to allow all
        allowedIPRanges: ['192.168.', '10.0.', '172.16.'] // Default private IP ranges
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/school/wifi-config
 * Update allowed WiFi SSIDs and IP ranges (Admin only)
 * 
 * Body:
 * {
 *   allowedSSIDs: string[],
 *   allowedIPRanges?: string[]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { allowedSSIDs, allowedIPRanges } = body;

    if (!Array.isArray(allowedSSIDs)) {
      return NextResponse.json(
        { error: 'allowedSSIDs must be an array' },
        { status: 400 }
      );
    }

    console.log('[WiFi Config API] Updating allowed SSIDs:', allowedSSIDs);
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { allowedSSIDs, allowedIPRanges } = body;

    if (!Array.isArray(allowedSSIDs)) {
      return NextResponse.json(
        { error: 'allowedSSIDs must be an array' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      allowed_wifi_ssids: allowedSSIDs,
      updated_at: new Date().toISOString()
    };

    // Add IP ranges if provided
    if (allowedIPRanges && Array.isArray(allowedIPRanges)) {
      updateData.allowed_ip_ranges = allowedIPRanges;
    }

    // Update school_location_config
    const { data, error } = await supabaseAdmin
      .from('school_location_config')
      .update(updateData)
      .eq('is_active', true)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
  }
}
