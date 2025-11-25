/**
 * lib/errorMonitoring.ts
 * Centralized error monitoring utility for AI-powered auto-fix system
 */

import { supabaseAdmin } from '@/lib/supabase/server';

export type ErrorType = 'api_error' | '404_page' | 'runtime_error' | 'build_error';

export interface ErrorLogData {
  errorType: ErrorType;
  url?: string;
  method?: string;
  statusCode?: number;
  errorMessage?: string;
  errorStack?: string;
  userAgent?: string;
  ipAddress?: string;
  userId?: string;
  requestBody?: any;
  responseBody?: any;
  headers?: any;
  context?: any; // component name, file path, etc.
}

/**
 * Log error to database for AI analysis
 */
export async function logError(data: ErrorLogData): Promise<{ ok: boolean; id?: string }> {
  try {
    const { data: inserted, error } = await supabaseAdmin
      .from('error_logs')
      .insert({
        error_type: data.errorType,
        url: data.url,
        method: data.method,
        status_code: data.statusCode,
        error_message: data.errorMessage,
        error_stack: data.errorStack,
        user_agent: data.userAgent,
        ip_address: data.ipAddress,
        user_id: data.userId || null,
        request_body: data.requestBody || null,
        response_body: data.responseBody || null,
        headers: data.headers || null,
        context: data.context || null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to log error:', error);
      return { ok: false };
    }

    return { ok: true, id: inserted?.id };
  } catch (e) {
    console.error('Error logging error:', e);
    return { ok: false };
  }
}

/**
 * Get recent errors for analysis
 */
export async function getRecentErrors(limit = 50, errorType?: ErrorType) {
  try {
    let query = supabaseAdmin
      .from('error_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (errorType) {
      query = query.eq('error_type', errorType);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { ok: true, errors: data || [] };
  } catch (e) {
    console.error('Failed to get recent errors:', e);
    return { ok: false, errors: [] };
  }
}

/**
 * Update error with AI analysis
 */
export async function updateErrorAnalysis(errorId: string, analysis: any, fixStatus: string) {
  try {
    const { error } = await supabaseAdmin
      .from('error_logs')
      .update({
        ai_analysis: analysis,
        fix_status: fixStatus,
      })
      .eq('id', errorId);

    if (error) throw error;
    return { ok: true };
  } catch (e) {
    console.error('Failed to update error analysis:', e);
    return { ok: false };
  }
}

/**
 * Mark error as fixed
 */
export async function markErrorFixed(errorId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('error_logs')
      .update({
        fix_status: 'fix_applied',
        fix_applied_at: new Date().toISOString(),
      })
      .eq('id', errorId);

    if (error) throw error;
    return { ok: true };
  } catch (e) {
    console.error('Failed to mark error as fixed:', e);
    return { ok: false };
  }
}
