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
      
      // Return empty array - allows all WiFi for testing
      return NextResponse.json({
        allowedSSIDs: [],
        message: 'No WiFi restrictions configured'
      });
    }

    // Extract allowed SSIDs from config
    // Assuming school_location_config has a 'allowed_wifi_ssids' column (JSON array)
    const allowedSSIDs = config.allowed_wifi_ssids || [];

    console.log('[WiFi Config API] ✅ Allowed SSIDs:', allowedSSIDs);

    return NextResponse.json({
      allowedSSIDs,
      config: {
        schoolName: config.school_name,
        radiusMeters: config.radius_meters,
        requireWiFi: config.require_wifi || false
      }
    });

  } catch (error: any) {
    console.error('[WiFi Config API] ❌ Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch WiFi config',
        allowedSSIDs: [] // Fallback to allow all
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/school/wifi-config
 * Update allowed WiFi SSIDs (Admin only)
 * 
 * Body:
 * {
 *   allowedSSIDs: string[]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { allowedSSIDs } = body;

    if (!Array.isArray(allowedSSIDs)) {
      return NextResponse.json(
        { error: 'allowedSSIDs must be an array' },
        { status: 400 }
      );
    }

    console.log('[WiFi Config API] Updating allowed SSIDs:', allowedSSIDs);

    // Update school_location_config
    const { data, error } = await supabaseAdmin
      .from('school_location_config')
      .update({ 
        allowed_wifi_ssids: allowedSSIDs,
        updated_at: new Date().toISOString()
      })
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
