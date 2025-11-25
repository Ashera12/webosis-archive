import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super_admin
    const { data: member } = await supabaseAdmin
      .from('members')
      .select('role')
      .eq('user_id', (session.user as any).id)
      .single();

    if (member?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden - Super admin only' }, { status: 403 });
    }

    // Read SQL file
    const sqlPath = path.join(process.cwd(), 'create_error_logs_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    // Split into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    const results = [];
    let errors = [];

    // Execute each statement
    for (const statement of statements) {
      try {
        // Skip comments
        if (statement.startsWith('--')) continue;
        
        const fullStatement = statement + ';';
        console.log('Executing:', fullStatement.substring(0, 100) + '...');

        // Use raw SQL query
        const { data, error } = await supabaseAdmin.rpc('exec_sql', {
          sql: fullStatement
        });

        if (error) {
          console.error('Statement error:', error);
          errors.push({ statement: statement.substring(0, 50), error: error.message });
        } else {
          results.push({ statement: statement.substring(0, 50), success: true });
        }
      } catch (e: any) {
        console.error('Exception:', e);
        errors.push({ statement: statement.substring(0, 50), error: e.message });
      }
    }

    // Verify table exists
    const { data: testData, error: verifyError } = await supabaseAdmin
      .from('error_logs')
      .select('*')
      .limit(1);

    const tableExists = !verifyError;

    return NextResponse.json({
      success: tableExists,
      tableExists,
      results,
      errors,
      message: tableExists 
        ? '✓ Table error_logs created successfully!' 
        : 'Table creation attempted. Please check Supabase Dashboard.',
    });
  } catch (error: any) {
    console.error('[/api/admin/setup-error-logs] Error:', error);
    return NextResponse.json({ 
      error: error.message,
      hint: 'Please run SQL manually in Supabase Dashboard. Check ERROR_LOGS_SETUP_GUIDE.md'
    }, { status: 500 });
  }
}
