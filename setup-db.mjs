import { supabaseAdmin } from './lib/supabase/server';
import fs from 'fs';
import path from 'path';

async function setupErrorLogsTable() {
  try {
    console.log('Setting up error_logs table...');
    
    const sql = fs.readFileSync(
      path.join(process.cwd(), 'create_error_logs_table.sql'),
      'utf-8'
    );
    
    // Execute SQL using Supabase Admin
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { 
      sql_query: sql 
    });
    
    if (error) {
      console.error('Error creating table:', error);
      
      // Alternative: Use direct SQL execution
      console.log('\nTrying alternative method...');
      const statements = sql
        .split(';')
        .filter(s => s.trim())
        .map(s => s.trim() + ';');
      
      for (const statement of statements) {
        if (statement.includes('CREATE TABLE') || 
            statement.includes('CREATE INDEX') || 
            statement.includes('ALTER TABLE') ||
            statement.includes('CREATE POLICY') ||
            statement.includes('COMMENT ON')) {
          console.log(`Executing: ${statement.substring(0, 50)}...`);
          const { error: stmtError } = await supabaseAdmin.from('_').rpc('exec_sql', {
            sql_query: statement
          });
          if (stmtError) {
            console.error('Statement error:', stmtError);
          }
        }
      }
    } else {
      console.log('✓ Table created successfully!');
    }
    
    // Verify table exists
    const { data: tables, error: verifyError } = await supabaseAdmin
      .from('error_logs')
      .select('*')
      .limit(1);
    
    if (verifyError) {
      console.error('Table verification failed:', verifyError);
      console.log('\n⚠️  Please run the SQL manually in Supabase Dashboard');
      console.log('SQL is in: create_error_logs_table.sql');
    } else {
      console.log('✓ Table verified!');
    }
    
  } catch (err) {
    console.error('Setup error:', err);
    console.log('\n⚠️  Please run the SQL manually in Supabase Dashboard');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Open SQL Editor');
    console.log('3. Paste the SQL from create_error_logs_table.sql');
    console.log('4. Click Run');
  }
}

setupErrorLogsTable();
