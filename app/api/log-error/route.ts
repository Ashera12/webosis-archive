import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      error_type,
      error_message,
      error_stack,
      url,
      status_code,
      user_agent,
      context,
      method,
    } = body;

    // Validate required fields
    if (!error_message) {
      return NextResponse.json({ error: 'error_message is required' }, { status: 400 });
    }

    // Get client IP
    const ip_address = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';

    // Insert error log
    const { error } = await supabaseAdmin
      .from('error_logs')
      .insert({
        error_type: error_type || 'runtime_error',
        error_message,
        error_stack,
        url,
        status_code,
        user_agent,
        ip_address,
        method: method || 'GET',
        context,
        severity: determineSeverity(status_code, error_message),
      });

    if (error) {
      const msg = (error as any)?.message || String(error);
      // If table missing, don't fail logging pipeline; surface setup hint
      if (msg.toLowerCase().includes('relation') && msg.toLowerCase().includes('error_logs') && msg.toLowerCase().includes('does not exist')) {
        console.warn('[/api/log-error] error_logs table missing. Returning setupRequired=true');
        return NextResponse.json({ success: true, setupRequired: true });
      }
      console.error('[/api/log-error] Failed to log error:', error);
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[/api/log-error] Exception:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function determineSeverity(statusCode?: number, message?: string): string {
  if (!statusCode && !message) return 'low';
  
  if (statusCode) {
    if (statusCode >= 500) return 'critical';
    if (statusCode >= 400) return 'medium';
  }
  
  const msg = message?.toLowerCase() || '';
  if (msg.includes('cors') || msg.includes('network') || msg.includes('fetch failed')) {
    return 'high';
  }
  if (msg.includes('unauthorized') || msg.includes('forbidden')) {
    return 'medium';
  }
  
  return 'low';
}
