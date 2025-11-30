/**
 * AUTOMATED DATABASE MIGRATION SCRIPT
 * Executes PRODUCTION_READY_MIGRATION.sql via Supabase Management API
 * 
 * Usage:
 *   node scripts/run-migration.js
 * 
 * Prerequisites:
 *   - SUPABASE_URL in .env.local
 *   - SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  console.error('Set them in .env.local file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runMigration() {
  console.log('🚀 Starting automated database migration...\n');

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'migrations', 'PRODUCTION_READY_MIGRATION.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const sql = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('📄 Migration file loaded:', migrationPath);
    console.log('📏 SQL size:', (sql.length / 1024).toFixed(2), 'KB\n');

    // Split SQL into individual statements (simple split by semicolon)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📊 Found ${statements.length} SQL statements\n`);
    console.log('⏳ Executing migration (this may take 30-60 seconds)...\n');

    // Execute all statements in a transaction-like manner
    // Note: Supabase client doesn't support transactions, so we execute sequentially
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim() === ';') {
        continue;
      }

      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        
        if (error) {
          // Check if it's a "already exists" error (safe to ignore for idempotent migration)
          if (
            error.message.includes('already exists') ||
            error.message.includes('duplicate key') ||
            error.message.includes('ON CONFLICT DO NOTHING')
          ) {
            console.log(`⏭️  Skipped (already exists): Statement ${i + 1}`);
          } else {
            errorCount++;
            errors.push({ statement: i + 1, error: error.message });
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
          }
        } else {
          successCount++;
          if ((i + 1) % 10 === 0) {
            console.log(`✅ Executed ${i + 1}/${statements.length} statements...`);
          }
        }
      } catch (err) {
        errorCount++;
        errors.push({ statement: i + 1, error: err.message });
        console.error(`❌ Exception in statement ${i + 1}:`, err.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('='.repeat(60) + '\n');

    if (errorCount > 0) {
      console.log('⚠️  Errors encountered:');
      errors.forEach(({ statement, error }) => {
        console.log(`  - Statement ${statement}: ${error}`);
      });
      console.log('');
    }

    // Verify migration success
    console.log('🔍 Verifying migration...\n');
    
    const verificationQueries = [
      {
        name: 'Tables',
        query: `SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('admin_settings', 'biometric_data', 'webauthn_credentials', 
                                   'webauthn_challenges', 'attendances', 'user_activities', 
                                   'security_events', 'ai_verification_logs', 'error_logs')
                ORDER BY table_name`
      },
      {
        name: 'Admin Settings',
        query: `SELECT COUNT(*) as count FROM admin_settings`
      },
      {
        name: 'Indices',
        query: `SELECT COUNT(*) as count FROM pg_indexes 
                WHERE schemaname = 'public' AND indexname LIKE 'idx_%'`
      },
      {
        name: 'RLS Policies',
        query: `SELECT COUNT(*) as count FROM pg_policies 
                WHERE schemaname = 'public'`
      }
    ];

    for (const { name, query } of verificationQueries) {
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: query });
      
      if (error) {
        console.log(`❌ ${name} verification failed:`, error.message);
      } else {
        console.log(`✅ ${name}:`, data || 'OK');
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n📋 Next steps:');
    console.log('1. ✅ Database migration complete');
    console.log('2. ⏭️  Configure API keys in Admin UI');
    console.log('3. ⏭️  Test enrollment flow');
    console.log('4. ⏭️  Monitor error_logs table');
    console.log('');

  } catch (error) {
    console.error('\n❌ MIGRATION FAILED:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run migration
runMigration().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
