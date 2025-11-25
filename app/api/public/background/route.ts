import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { BackgroundResponseSchema, buildError, buildSuccess } from '@/lib/validation';
import crypto from 'crypto';

// Public read-only endpoint: returns only GLOBAL_BG_* settings (non-secret)
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('admin_settings')
      .select('key,value,is_secret')
      .like('key', 'GLOBAL_BG_%');

    if (error) {
      return NextResponse.json(buildError('BG_FETCH_ERROR', error.message), { status: 500 });
    }

    const settings: Record<string, string> = {};
    (data || []).forEach((row) => {
      if (row.is_secret) return;
      settings[row.key] = row.value || '';
    });

    // Validation (non-fatal; if fails send error)
    try {
      BackgroundResponseSchema.parse({ success: true, code: 'OK', settings });
    } catch (schemaErr: any) {
      return NextResponse.json(buildError('BG_SCHEMA_INVALID', 'Invalid background schema', schemaErr.errors), { status: 500 });
    }

    const payload = buildSuccess('OK', { settings });
    const etag = crypto.createHash('sha1').update(JSON.stringify(payload)).digest('hex');
    const res = NextResponse.json(payload, { status: 200 });
    res.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.headers.set('ETag', etag);
    return res;
  } catch (e: any) {
    return NextResponse.json(buildError('BG_UNEXPECTED', e.message || 'Failed'), { status: 500 });
  }
}
