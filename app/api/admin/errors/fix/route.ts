import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { errorId, fixIndex } = body;

    if (!errorId) {
      return NextResponse.json({ error: 'Error ID required' }, { status: 400 });
    }

    // Get error from database
    const { data: errorLog, error: fetchError } = await supabaseAdmin
      .from('error_logs')
      .select('*')
      .eq('id', errorId)
      .single();

    if (fetchError || !errorLog) {
      return NextResponse.json({ 
        error: 'Error not found', 
        details: fetchError?.message 
      }, { status: 404 });
    }

    // Check if AI analysis exists
    if (!errorLog.ai_analysis || !errorLog.ai_analysis.suggestions) {
      return NextResponse.json({ 
        error: 'No AI analysis found. Please analyze the error first.' 
      }, { status: 400 });
    }

    const suggestions = errorLog.ai_analysis.suggestions;
    if (fixIndex >= suggestions.length) {
      return NextResponse.json({ 
        error: 'Invalid fix index' 
      }, { status: 400 });
    }

    const selectedFix = suggestions[fixIndex];

    // Update error status
    const { error: updateError } = await supabaseAdmin
      .from('error_logs')
      .update({
        fix_status: 'applied',
        applied_fix: {
          index: fixIndex,
          fix: selectedFix,
          applied_at: new Date().toISOString(),
          applied_by: session.user.id,
        },
      })
      .eq('id', errorId);

    if (updateError) {
      return NextResponse.json({ 
        error: 'Failed to update error status', 
        details: updateError.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: 'Fix suggestion recorded',
      output: `Fix applied: ${selectedFix.action}\n\nDetails: ${selectedFix.details}`,
      data: {
        errorId,
        fixIndex,
        suggestion: selectedFix,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}
