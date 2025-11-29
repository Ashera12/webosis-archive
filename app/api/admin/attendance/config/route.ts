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

    // Check if requesting history
    const { searchParams } = new URL(request.url);
    const showHistory = searchParams.get('history') === 'true';

    if (showHistory) {
      // Get all configs ordered by created_at desc (history/backup)
      const { data, error } = await supabase
        .from('school_location_config')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Get config history error:', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: data || [],
      });
    }

    // Get active config (default behavior)
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

    // Check if there's an existing active config
    const { data: existingConfig } = await supabase
      .from('school_location_config')
      .select('id')
      .eq('is_active', true)
      .single();

    const configData = {
      location_name,
      latitude,
      longitude,
      radius_meters,
      allowed_wifi_ssids,
      is_active,
      updated_at: new Date().toISOString(),
    };

    let data, error;

    if (existingConfig?.id) {
      // UPDATE existing config
      const result = await supabase
        .from('school_location_config')
        .update(configData)
        .eq('id', existingConfig.id)
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    } else {
      // INSERT new config (first time setup)
      // Deactivate any old configs first
      await supabase
        .from('school_location_config')
        .update({ is_active: false })
        .eq('is_active', true);

      const result = await supabase
        .from('school_location_config')
        .insert(configData)
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    }

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
      message: existingConfig?.id 
        ? 'Konfigurasi berhasil diperbarui' 
        : 'Konfigurasi berhasil disimpan',
    });
  } catch (error: any) {
    console.error('Save attendance config error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Restore backup/previous config OR activate/deactivate config
export async function PUT(request: NextRequest) {
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
    const { configId, action = 'restore' } = body; // action: 'restore', 'activate', 'deactivate'

    if (!configId) {
      return NextResponse.json(
        { success: false, error: 'Config ID is required' },
        { status: 400 }
      );
    }

    // Get the config to restore/modify
    const { data: configToModify, error: fetchError } = await supabase
      .from('school_location_config')
      .select('*')
      .eq('id', configId)
      .single();

    if (fetchError || !configToModify) {
      return NextResponse.json(
        { success: false, error: 'Config not found' },
        { status: 404 }
      );
    }

    let data, error;

    if (action === 'activate' || action === 'restore') {
      // Deactivate all configs
      await supabase
        .from('school_location_config')
        .update({ is_active: false })
        .eq('is_active', true);

      // Activate the selected config
      const result = await supabase
        .from('school_location_config')
        .update({ is_active: true })
        .eq('id', configId)
        .select()
        .single();

      data = result.data;
      error = result.error;
    } else if (action === 'deactivate') {
      // Deactivate the selected config
      const result = await supabase
        .from('school_location_config')
        .update({ is_active: false })
        .eq('id', configId)
        .select()
        .single();

      data = result.data;
      error = result.error;
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    if (error) {
      console.error('Modify config error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const messages = {
      restore: 'Konfigurasi berhasil dipulihkan',
      activate: 'Konfigurasi berhasil diaktifkan',
      deactivate: 'Konfigurasi berhasil dinonaktifkan',
    };

    return NextResponse.json({
      success: true,
      data,
      message: messages[action as keyof typeof messages],
    });
  } catch (error: any) {
    console.error('Modify attendance config error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete config permanently
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check role - only super_admin can delete
    const userRole = (session.user.role || '').toLowerCase();
    if (!['super_admin'].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Only super admin can delete configs' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const configId = searchParams.get('id');

    if (!configId) {
      return NextResponse.json(
        { success: false, error: 'Config ID is required' },
        { status: 400 }
      );
    }

    // Check if config is active
    const { data: existingConfig } = await supabase
      .from('school_location_config')
      .select('is_active')
      .eq('id', configId)
      .single();

    if (existingConfig?.is_active) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete active config. Deactivate it first.' },
        { status: 400 }
      );
    }

    // Delete the config
    const { error } = await supabase
      .from('school_location_config')
      .delete()
      .eq('id', configId);

    if (error) {
      console.error('Delete config error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Konfigurasi berhasil dihapus',
    });
  } catch (error: any) {
    console.error('Delete attendance config error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
