import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { invalidateSettingsCache } from '@/lib/getAdminSettings';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('admin_settings')
      .select('key,value')
      .order('key');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const settings: Record<string, string> = {};
    (data || []).forEach((row: any) => {
      const k = row.key as string;
      const v = row.value ?? '';
      const shouldMask = /KEY|TOKEN|SECRET/i.test(k);
      settings[k] = shouldMask ? '***' : v;
    });

    return NextResponse.json({ settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const settings: Record<string, string> = body?.settings || {};
    const secrets: string[] = Array.isArray(body?.secrets) ? body.secrets : [];

    console.log('[/api/admin/settings] POST - Saving settings:', { 
      count: Object.keys(settings).length, 
      keys: Object.keys(settings),
      secretKeys: secrets 
    });

    if (!settings || Object.keys(settings).length === 0) {
      return NextResponse.json({ error: 'No settings provided' }, { status: 400 });
    }

    // Filter out masked values (***) - don't save these
    const filteredSettings = Object.entries(settings)
      .filter(([key, value]) => {
        const val = String(value ?? '').trim();
        // Skip ONLY if value is EXACTLY *** (not partial match)
        // This allows API keys that contain *** in the middle
        if (!val || val === '***') {
          console.log(`[/api/admin/settings] Skipping masked/empty value for ${key}: "${val}"`);
          return false;
        }
        // Log what we're about to save
        console.log(`[/api/admin/settings] Will save ${key}: ${val.substring(0, 10)}... (${val.length} chars)`);
        return true;
      })
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

    if (Object.keys(filteredSettings).length === 0) {
      return NextResponse.json({ error: 'No valid settings to save (all values were masked or empty)' }, { status: 400 });
    }

    const entries = Object.entries(filteredSettings).map(([key, value]) => ({
      key,
      value: String(value ?? ''),
      is_secret: secrets.includes(key) || /KEY|TOKEN|SECRET|PASSWORD/i.test(key),
    }));

    console.log('[/api/admin/settings] Filtered entries to save:', entries.map(e => ({ key: e.key, is_secret: e.is_secret })));

    // Determine which keys exist to avoid upsert schema cache issues
    const keys = entries.map(e => e.key);
    const { data: existing, error: selErr } = await supabaseAdmin
      .from('admin_settings')
      .select('key')
      .in('key', keys);
    
    if (selErr) {
      console.error('[/api/admin/settings] Select existing error:', selErr);
      return NextResponse.json({ error: selErr.message }, { status: 500 });
    }
    
    const existingSet = new Set((existing || []).map((r: any) => r.key));
    const toInsert = entries.filter(e => !existingSet.has(e.key));
    const toUpdate = entries.filter(e => existingSet.has(e.key));

    let insertedCount = 0;
    let updatedCount = 0;

    // Insert new rows in batch
    if (toInsert.length > 0) {
      console.log('[/api/admin/settings] Inserting new keys:', toInsert.map(e => e.key));
      const { error: insErr } = await supabaseAdmin.from('admin_settings').insert(toInsert as any);
      if (insErr) {
        console.error('[/api/admin/settings] Insert error:', insErr);
        return NextResponse.json({ error: `Insert failed: ${insErr.message}` }, { status: 500 });
      }
      insertedCount = toInsert.length;
    }

    // Update existing rows individually to avoid heterogeneous values in a single update
    for (const row of toUpdate) {
      const { error: updErr } = await supabaseAdmin
        .from('admin_settings')
        .update({ value: row.value, is_secret: row.is_secret })
        .eq('key', row.key);
      if (updErr) {
        console.error('[/api/admin/settings] Update error for key:', row.key, updErr);
        return NextResponse.json({ error: `Update failed for ${row.key}: ${updErr.message}` }, { status: 500 });
      }
      updatedCount++;
    }

    console.log('[/api/admin/settings] Save complete:', { insertedCount, updatedCount, total: entries.length });

    // Invalidate AI Manager cache so it reloads keys from database
    invalidateSettingsCache();
    console.log('[/api/admin/settings] AI settings cache invalidated - AI will reload keys on next use');

    return NextResponse.json({ 
      success: true, 
      updated: entries.length, 
      inserted: insertedCount, 
      updatedCount: updatedCount,
      message: `Successfully saved ${entries.length} settings. AI will reload keys on next use.`
    });
  } catch (error: any) {
    console.error('[/api/admin/settings] Unexpected error:', error);
    return NextResponse.json({ 
      error: error.message || 'Save failed',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
