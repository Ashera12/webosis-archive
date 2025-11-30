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
    console.log('[WiFi Config API] Fetching school WiFi configuration...');

    // Fetch from school_location_config or create a dedicated wifi_config table
    const { data: config, error } = await supabaseAdmin
      .from('school_location_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error) {
      console.warn('[WiFi Config API] No active config found:', error.message);
      
      // Return defaults - allows private IP ranges for testing
      return NextResponse.json({
        allowedSSIDs: [],
        allowedIPRanges: ['192.168.', '10.0.', '172.16.'], // Default private IP ranges
        message: 'No WiFi restrictions configured'
      });
    }

    // Extract allowed SSIDs and IP ranges from config
    // Note: allowed_wifi_ssids and allowed_ip_ranges are TEXT[] (PostgreSQL arrays)
    const allowedSSIDs = Array.isArray(config.allowed_wifi_ssids) 
      ? config.allowed_wifi_ssids 
      : (config.allowed_wifi_ssids || []);
    
    const allowedIPRanges = Array.isArray(config.allowed_ip_ranges)
      ? config.allowed_ip_ranges
      : ['192.168.', '10.0.', '172.16.']; // Default private IP ranges

    console.log('[WiFi Config API] ✅ Allowed SSIDs:', allowedSSIDs);
    console.log('[WiFi Config API] ✅ Allowed IP Ranges:', allowedIPRanges);

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
