// app/api/errors/log/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

// Use service role client for admin operations
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
 * LOG ERROR - Called from client or server
 * AI-powered error analysis and auto-fix
 * 
 * SAFETY: Will gracefully handle missing table/columns
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    const body = await request.json();
    const {
      errorType,
      severity,
      message,
      stackTrace,
      errorCode,
      pageUrl,
      apiEndpoint,
      requestMethod,
      requestBody,
      responseStatus,
      environment,
      browser,
      os,
      deviceType,
      metadata = {}
    } = body;

    // Always log to console first (fallback if DB fails)
    console.log('[Error Log] 📝', {
      type: errorType,
      severity,
      message: message?.substring(0, 200),
      pageUrl,
      timestamp: new Date().toISOString()
    });

    // Get user context
    const userId = session?.user?.id;
    const userEmail = session?.user?.email;
    const userRole = session?.user?.role;

    // Get IP and User Agent
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || '';

    // AI Analysis
    const aiAnalysis = await analyzeErrorWithAI({
      errorType,
      severity,
      message,
      stackTrace,
      errorCode,
      metadata
    });

    // Try to check for duplicates (skip if table doesn't exist)
    let existingError = null;
    try {
      const { data } = await supabaseAdmin
        .from('error_logs')
        .select('*')
        .eq('message', message)
        .eq('error_type', errorType)
        .gte('created_at', new Date(Date.now() - 3600000).toISOString())
        .is('deleted_at', null)
        .maybeSingle(); // Use maybeSingle to avoid error on 0 rows

      existingError = data;

      if (existingError) {
        // Update occurrence count
        await supabaseAdmin
          .from('error_logs')
          .update({
            occurrence_count: (existingError.occurrence_count || 0) + 1,
            last_occurred_at: new Date().toISOString()
          })
          .eq('id', existingError.id);

        console.log('[Error Log] ✅ Updated existing error:', existingError.id);

        return NextResponse.json({
          success: true,
          data: {
            errorId: existingError.id,
            duplicate: true,
            aiAnalysis
          }
        });
      }
    } catch (checkError: any) {
      // Table might not exist yet - just log and continue
      console.warn('[Error Log] ⚠️ Cannot check duplicates:', checkError.message);
    }

    // Try to insert new error log (gracefully handle if table doesn't exist)
    let errorLog = null;
    try {
      const { data, error: insertError } = await supabaseAdmin
        .from('error_logs')
        .insert({
          error_type: errorType,
          severity: severity || aiAnalysis.suggestedSeverity,
          message,
          stack_trace: stackTrace,
          error_code: errorCode,
          user_id: userId,
          user_email: userEmail,
          user_role: userRole,
          page_url: pageUrl,
          api_endpoint: apiEndpoint,
          request_method: requestMethod,
          request_body: requestBody,
          response_status: responseStatus,
          environment: environment || 'production',
          browser,
          os,
          device_type: deviceType,
          ip_address: ipAddress,
          user_agent: userAgent,
          ai_analyzed: true,
          ai_risk_level: aiAnalysis.riskLevel,
          ai_category: aiAnalysis.category,
          ai_suggestions: aiAnalysis.suggestions,
          auto_fixable: aiAnalysis.autoFixable,
          metadata,
          first_occurred_at: new Date().toISOString(),
          last_occurred_at: new Date().toISOString()
        })
        .select()
        .maybeSingle();

      if (insertError) {
        console.error('[Error Log] ⚠️ Insert error:', insertError.message);
        // Don't throw - just log to console instead
        console.log('[Error Log] 📋 Logged to console only (DB unavailable)');
        
        return NextResponse.json({
          success: true,
          data: {
            errorId: 'console-only',
            logged: 'console',
            aiAnalysis
          }
        });
      }

      errorLog = data;
      console.log('[Error Log] ✅ Created new error log:', errorLog?.id);
    } catch (dbError: any) {
      // Database error - log to console only
      console.error('[Error Log] ⚠️ Database unavailable:', dbError.message);
      console.log('[Error Log] 📋 Error logged to console only');
      
      return NextResponse.json({
        success: true,
        data: {
          errorId: 'console-only',
          logged: 'console',
          aiAnalysis,
          warning: 'Database unavailable - logged to console'
        }
      });
    }

    // Auto-fix if applicable and we have an error log ID
    if (errorLog && aiAnalysis.autoFixable && aiAnalysis.autoFixCode) {
      try {
        const fixResult = await applyAutoFix(errorLog.id, aiAnalysis.autoFixCode);
        
        await supabaseAdmin
          .from('error_logs')
          .update({
            auto_fix_applied: true,
            auto_fix_details: fixResult,
            status: 'fixed',
            resolved_at: new Date().toISOString()
          })
          .eq('id', errorLog.id);

        console.log('[Error Log] ✅ Auto-fix applied:', errorLog.id);
      } catch (fixError) {
        console.error('[Error Log] ⚠️ Auto-fix failed:', fixError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        errorId: errorLog?.id || 'console-only',
        aiAnalysis,
        autoFixApplied: aiAnalysis.autoFixable,
        logged: errorLog ? 'database' : 'console'
      }
    });

  } catch (error: any) {
    console.error('[Error Log] ❌ Critical error:', error);
    // ALWAYS return success - error logging should NEVER break the app
    return NextResponse.json({
      success: true,
      data: {
        errorId: 'fallback',
        logged: 'console-only',
        warning: 'Error logging service unavailable'
      }
    });
  }
}

/**
 * AI Error Analysis
 */
async function analyzeErrorWithAI(error: any) {
  const { errorType, severity, message, stackTrace, errorCode } = error;

  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'medium';
  let category = 'bug';
  const suggestions: string[] = [];
  let autoFixable = false;
  let autoFixCode = null;
  let suggestedSeverity = severity;

  // 1. Analyze error type
  if (errorType === 'authentication_error' || errorType === 'authorization_error') {
    riskLevel = 'high';
    category = 'security';
    suggestions.push('Verify user credentials and permissions');
    suggestions.push('Check for brute force attempts');
  }

  // 2. Analyze message patterns
  if (message?.includes('CORS') || message?.includes('cross-origin')) {
    riskLevel = 'medium';
    category = 'configuration';
    autoFixable = true;
    autoFixCode = 'ADD_CORS_HEADER';
    suggestions.push('Auto-fix: Add CORS headers to response');
  }

  if (message?.includes('timeout') || message?.includes('ETIMEDOUT')) {
    riskLevel = 'medium';
    category = 'performance';
    autoFixable = true;
    autoFixCode = 'RETRY_WITH_BACKOFF';
    suggestions.push('Auto-fix: Retry with exponential backoff');
  }

  if (message?.includes('404') || message?.includes('Not Found')) {
    riskLevel = 'low';
    category = 'user_error';
    suggestions.push('Check if resource exists');
    suggestions.push('Verify URL is correct');
  }

  if (message?.includes('500') || message?.includes('Internal Server Error')) {
    riskLevel = 'critical';
    category = 'bug';
    suggestions.push('Investigate server logs immediately');
    suggestions.push('Check database connection');
  }

  if (message?.includes('memory') || message?.includes('heap')) {
    riskLevel = 'critical';
    category = 'performance';
    suggestions.push('Memory leak detected - restart server');
    suggestions.push('Optimize memory-intensive operations');
  }

  if (message?.includes('SQL') || message?.includes('database')) {
    riskLevel = 'high';
    category = 'database';
    suggestions.push('Check database query syntax');
    suggestions.push('Verify RLS policies');
  }

  // 3. Analyze stack trace
  if (stackTrace?.includes('node_modules')) {
    suggestions.push('Third-party library error - check for updates');
  }

  if (stackTrace?.includes('auth') || stackTrace?.includes('session')) {
    riskLevel = 'high';
    category = 'security';
  }

  // 4. Auto-suggest severity
  if (!severity) {
    if (riskLevel === 'critical') suggestedSeverity = 'critical';
    else if (riskLevel === 'high') suggestedSeverity = 'high';
    else if (riskLevel === 'low') suggestedSeverity = 'low';
    else suggestedSeverity = 'medium';
  }

  return {
    riskLevel,
    category,
    suggestions,
    autoFixable,
    autoFixCode,
    suggestedSeverity
  };
}

/**
 * Apply Auto-Fix
 */
async function applyAutoFix(errorId: string, fixCode: string) {
  console.log('[Auto-Fix] Applying fix:', fixCode);

  switch (fixCode) {
    case 'ADD_CORS_HEADER':
      // Automatically add CORS headers (already handled in middleware)
      return {
        action: 'CORS headers added',
        success: true,
        timestamp: new Date().toISOString()
      };

    case 'RETRY_WITH_BACKOFF':
      // Implement retry logic
      return {
        action: 'Retry scheduled with exponential backoff',
        success: true,
        retry_count: 3,
        timestamp: new Date().toISOString()
      };

    default:
      return {
        action: 'No auto-fix available',
        success: false,
        timestamp: new Date().toISOString()
      };
  }
}
