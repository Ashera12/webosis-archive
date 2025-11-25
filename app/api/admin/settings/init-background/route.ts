import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * Initialize default background settings
 * POST /api/admin/settings/init-background
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const defaultSettings = {
      'GLOBAL_BG_MODE': 'gradient',
      'GLOBAL_BG_SCOPE': 'all-pages',
      'GLOBAL_BG_GRADIENT': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'GLOBAL_BG_SELECTED_PAGES': JSON.stringify(['home', 'about', 'posts']),
      'GLOBAL_BG_IMAGE_OVERLAY_OPACITY': '0.3',
    };

    console.log('[init-background] Setting default background settings...');

    // Check which keys already exist
    const keys = Object.keys(defaultSettings);
    const { data: existing } = await supabaseAdmin
      .from('admin_settings')
      .select('key')
      .in('key', keys);

    const existingKeys = new Set((existing || []).map((r: any) => r.key));
    const toInsert = Object.entries(defaultSettings)
      .filter(([key]) => !existingKeys.has(key))
      .map(([key, value]) => ({ key, value }));

    let insertedCount = 0;

    if (toInsert.length > 0) {
      const { error } = await supabaseAdmin
        .from('admin_settings')
        .insert(toInsert);

      if (error) {
        console.error('[init-background] Insert error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      insertedCount = toInsert.length;
    }

    console.log('[init-background] Initialized:', { 
      total: keys.length, 
      alreadyExist: existingKeys.size,
      inserted: insertedCount 
    });

    return NextResponse.json({
      success: true,
      message: `Initialized ${insertedCount} background settings`,
      inserted: insertedCount,
      alreadyExist: existingKeys.size,
      total: keys.length,
      settings: defaultSettings
    });
  } catch (error: any) {
    console.error('[init-background] Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to initialize settings' 
    }, { status: 500 });
  }
}

/**
 * Get current background settings
 * GET /api/admin/settings/init-background
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('admin_settings')
      .select('key, value')
      .like('key', 'GLOBAL_BG_%');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const settings: Record<string, string> = {};
    (data || []).forEach((row: any) => {
      settings[row.key] = row.value;
    });

    return NextResponse.json({
      success: true,
      settings,
      count: Object.keys(settings).length
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch settings' 
    }, { status: 500 });
  }
}
