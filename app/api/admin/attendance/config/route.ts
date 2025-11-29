import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check role
    const userRole = (session.user.role || '').toLowerCase();
    if (!['super_admin', 'admin', 'osis'].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get active config
    const { data, error } = await supabase
      .from('school_location_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Get config error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || null,
    });
  } catch (error: any) {
    console.error('Get attendance config error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check role
    const userRole = (session.user.role || '').toLowerCase();
    if (!['super_admin', 'admin', 'osis'].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      location_name,
      latitude,
      longitude,
      radius_meters,
      allowed_wifi_ssids,
      is_active = true,
    } = body;

    // Validation
    if (!location_name || !latitude || !longitude || !radius_meters) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!Array.isArray(allowed_wifi_ssids) || allowed_wifi_ssids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one WiFi SSID is required' },
        { status: 400 }
      );
    }

    // Deactivate all existing configs first
    await supabase
      .from('school_location_config')
      .update({ is_active: false })
      .eq('is_active', true);

    // Insert or update config
    const configData = {
      location_name,
      latitude,
      longitude,
      radius_meters,
      allowed_wifi_ssids,
      is_active,
    };

    const { data, error } = await supabase
      .from('school_location_config')
      .insert(configData)
      .select()
      .single();

    if (error) {
      console.error('Save config error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Konfigurasi berhasil disimpan',
    });
  } catch (error: any) {
    console.error('Save attendance config error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
