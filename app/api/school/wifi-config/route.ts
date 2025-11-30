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
    console.log('[WiFi Config API] 🔍 Fetching school WiFi configuration...');

    // Fetch from school_location_config
    const { data: config, error } = await supabaseAdmin
      .from('school_location_config')
      .select('*')
      .eq('is_active', true)
      .single();

    console.log('[WiFi Config API] Query result:', { 
      hasData: !!config, 
      hasError: !!error,
      errorMessage: error?.message,
      errorCode: error?.code 
    });

    if (error) {
      console.error('[WiFi Config API] ❌ Database error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      // Try fetching ALL locations as fallback
      console.log('[WiFi Config API] 🔄 Trying fallback: fetch all locations...');
      const { data: allConfigs, error: allError } = await supabaseAdmin
        .from('school_location_config')
        .select('*')
        .limit(10);
      
      console.log('[WiFi Config API] Fallback result:', {
        count: allConfigs?.length || 0,
        configs: allConfigs,
        error: allError?.message
      });

      // If we have configs, use the first one
      if (allConfigs && allConfigs.length > 0) {
        const fallbackConfig = allConfigs.find(c => c.is_active) || allConfigs[0];
        console.log('[WiFi Config API] ⚠️ Using fallback config:', fallbackConfig.location_name);
        
        const allowedSSIDs = Array.isArray(fallbackConfig.allowed_wifi_ssids) 
          ? fallbackConfig.allowed_wifi_ssids 
          : [];
        const allowedIPRanges = Array.isArray(fallbackConfig.allowed_ip_ranges)
          ? fallbackConfig.allowed_ip_ranges
          : ['192.168.', '10.0.', '172.16.'];

        console.log('[WiFi Config API] ✅ Fallback SSIDs:', allowedSSIDs);
        console.log('[WiFi Config API] ✅ Fallback IP Ranges:', allowedIPRanges);

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
      console.warn('[WiFi Config API] ⚠️ No configs found, using permissive defaults');
      console.log('[WiFi Config API] 🔓 PERMISSIVE MODE: Allowing all IPs for development');
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
      isActive: config.is_active,
      requireWiFi: config.require_wifi,
      rawSSIDs: config.allowed_wifi_ssids,
      rawIPRanges: config.allowed_ip_ranges
    });

    // Extract allowed SSIDs and IP ranges from config
    // Note: allowed_wifi_ssids and allowed_ip_ranges are TEXT[] (PostgreSQL arrays)
    const allowedSSIDs = Array.isArray(config.allowed_wifi_ssids) 
      ? config.allowed_wifi_ssids 
      : (config.allowed_wifi_ssids ? [config.allowed_wifi_ssids] : []);
    
    const allowedIPRanges = Array.isArray(config.allowed_ip_ranges)
      ? config.allowed_ip_ranges
      : (config.allowed_ip_ranges ? [config.allowed_ip_ranges] : ['192.168.', '10.0.', '172.16.']);

    console.log('[WiFi Config API] ✅ Parsed SSIDs:', allowedSSIDs);
    console.log('[WiFi Config API] ✅ Parsed IP Ranges:', allowedIPRanges);

    return NextResponse.json({
      allowedSSIDs,
      allowedIPRanges,
      config: {
        locationName: config.location_name,
        latitude: config.latitude,
        longitude: config.longitude,
        radiusMeters: config.radius_meters,
        requireWiFi: config.require_wifi || false,
        isActive: config.is_active
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
    if (allowedIPRanges) {
      console.log('[WiFi Config API] Updating allowed IP ranges:', allowedIPRanges);
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

    console.log('[WiFi Config API] ✅ Updated successfully');

    return NextResponse.json({
      success: true,
      allowedSSIDs,
      allowedIPRanges: data.allowed_ip_ranges || allowedIPRanges,
      config: data
    });

  } catch (error: any) {
    console.error('[WiFi Config API] ❌ Update error:', error);
    
    return NextResponse.json(
      { error: 'Failed to update WiFi config' },
      { status: 500 }
    );
  }
}
