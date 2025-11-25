import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    console.log('[/api/admin/errors GET] Session:', { hasSession: !!session, user: session?.user?.email });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const summary = searchParams.get('summary') === 'true';

    console.log('[/api/admin/errors GET] Fetching errors, summary:', summary);

    if (summary) {
      // Get error summary for dashboard
      const { data: errors, error } = await supabaseAdmin
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('[/api/admin/errors GET] Supabase error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log('[/api/admin/errors GET] Fetched errors:', errors?.length || 0);

      // Calculate statistics
      const total = errors?.length || 0;
      const critical = errors?.filter((e: any) => e.severity === 'critical').length || 0;
      const recentCount = errors?.filter((e: any) => {
        const errorDate = new Date(e.created_at);
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        return errorDate > oneDayAgo;
      }).length || 0;

      // Group errors by message
      const grouped = errors?.reduce((acc: any, err: any) => {
        const key = err.error_message || err.message || 'Unknown';
        if (!acc[key]) {
          acc[key] = { message: key, count: 0, severity: err.severity, latest: err.created_at };
        }
        acc[key].count++;
        if (new Date(err.created_at) > new Date(acc[key].latest)) {
          acc[key].latest = err.created_at;
        }
        return acc;
      }, {});

      const topErrors = Object.values(grouped || {})
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 3);

      return NextResponse.json({
        total,
        critical,
        recent: recentCount,
        topErrors,
      });
    }

    // Get all errors
    const { data: errors, error } = await supabaseAdmin
      .from('error_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[/api/admin/errors GET] Supabase error:', error);
      
      // If table doesn't exist, return helpful message
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        return NextResponse.json({ 
          error: 'Table error_logs not found',
          hint: 'Please create the error_logs table. See ERROR_LOGS_SETUP_GUIDE.md',
          setupRequired: true,
          errors: []
        }, { status: 200 });
      }
      
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[/api/admin/errors GET] Returning errors:', errors?.length || 0);
    return NextResponse.json({ errors: errors || [] });
  } catch (error: any) {
    console.error('[/api/admin/errors GET] Exception:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { errorId, errorData, message, severity, stack, metadata } = body;

    // If errorId provided, this is an AI analysis request
    if (errorId && errorData) {
      // Simulate AI analysis (replace with actual AI call if needed)
      const aiAnalysis = {
        timestamp: new Date().toISOString(),
        error_type: errorData.error_type || 'Unknown',
        severity: determineSeverity(errorData),
        suggestions: generateSuggestions(errorData),
        root_cause: analyzeRootCause(errorData),
      };

      // Update error log with AI analysis
      const { error: updateError } = await supabaseAdmin
        .from('error_logs')
        .update({
          ai_analysis: aiAnalysis,
          fix_status: 'analyzed',
        })
        .eq('id', errorId);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        analysis: aiAnalysis,
        message: 'AI analysis completed successfully'
      });
    }

    // Otherwise, create new error log
    const { data, error } = await supabaseAdmin
      .from('error_logs')
      .insert({
        message,
        severity: severity || 'error',
        stack,
        metadata,
        user_id: session.user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper functions for AI analysis
function determineSeverity(errorData: any): string {
  if (errorData.status_code >= 500) return 'critical';
  if (errorData.status_code >= 400) return 'warning';
  return 'info';
}

function analyzeRootCause(errorData: any): string {
  const { error_message, error_stack, url, method } = errorData;
  
  if (error_message?.includes('CORS')) {
    return 'CORS policy blocking the request. Check API headers and allowed origins.';
  }
  if (error_message?.includes('404') || error_message?.includes('Not Found')) {
    return 'Resource not found. Verify endpoint URL and routing configuration.';
  }
  if (error_message?.includes('401') || error_message?.includes('Unauthorized')) {
    return 'Authentication failure. Check session token and user permissions.';
  }
  if (error_message?.includes('500')) {
    return 'Server-side error. Check API implementation and database connection.';
  }
  if (error_stack?.includes('TypeError')) {
    return 'Type error detected. Check data types and null/undefined values.';
  }
  
  return 'Error analysis inconclusive. Manual review recommended.';
}

function generateSuggestions(errorData: any): Array<{ action: string; details: string; priority: number }> {
  const suggestions = [];
  const { error_message, url, method, status_code } = errorData;

  if (error_message?.includes('CORS')) {
    suggestions.push({
      action: 'Add CORS headers to API response',
      details: 'Update API route to include: Access-Control-Allow-Origin, Access-Control-Allow-Methods, Access-Control-Allow-Headers',
      priority: 1,
    });
  }

  if (status_code === 404) {
    suggestions.push({
      action: 'Verify route configuration',
      details: `Check if route ${url} exists in app/api/ or app/ directory. Verify file naming and export.`,
      priority: 1,
    });
  }

  if (status_code === 401) {
    suggestions.push({
      action: 'Check authentication middleware',
      details: 'Verify session token is being sent in request headers. Check auth() function in API route.',
      priority: 1,
    });
  }

  if (status_code >= 500) {
    suggestions.push({
      action: 'Review server-side code',
      details: 'Check database queries, environment variables, and error handling in API route.',
      priority: 1,
    });
  }

  if (error_message?.includes('fetch')) {
    suggestions.push({
      action: 'Add error handling to fetch call',
      details: 'Wrap fetch in try-catch block and handle network errors gracefully.',
      priority: 2,
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      action: 'Enable detailed error logging',
      details: 'Add console.error statements to identify the exact failure point.',
      priority: 3,
    });
  }

  return suggestions;
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const clearAll = searchParams.get('clearAll') === 'true';

    if (clearAll) {
      const { error } = await supabaseAdmin
        .from('error_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'All errors cleared' });
    }

    if (!id) {
      return NextResponse.json({ error: 'Error ID required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('error_logs')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Error deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
