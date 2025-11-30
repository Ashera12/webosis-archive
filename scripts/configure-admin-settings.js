#!/usr/bin/env node

/**
 * AUTOMATED ADMIN SETTINGS CONFIGURATION
 * 
 * Configures admin_settings table with production-ready defaults
 * Can be run multiple times safely (idempotent)
 * 
 * Usage:
 *   node scripts/configure-admin-settings.js
 *   node scripts/configure-admin-settings.js --with-api-keys
 * 
 * Options:
 *   --with-api-keys  Prompt for AI API keys and configure them
 */

import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  console.error('Set them in .env.local file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Production-ready defaults
const DEFAULT_SETTINGS = [
  // Attendance Settings
  { key: 'location_required', value: 'true', description: 'Require geolocation for attendance', category: 'attendance', is_secret: false },
  { key: 'wifi_required', value: 'true', description: 'Require WiFi connection for attendance', category: 'attendance', is_secret: false },
  { key: 'ai_verification_required', value: 'true', description: 'Require AI face verification', category: 'attendance', is_secret: false },
  { key: 'webauthn_required', value: 'false', description: 'Require WebAuthn passkey', category: 'attendance', is_secret: false },
  
  // AI Model Configuration
  { key: 'ai_model_primary', value: 'gemini-2.0-flash-exp', description: 'Primary AI model for face verification', category: 'ai', is_secret: false },
  { key: 'ai_model_fallback', value: 'gpt-4o-mini', description: 'Fallback AI model', category: 'ai', is_secret: false },
  { key: 'ai_match_threshold', value: '0.75', description: 'Minimum face match score (0.0-1.0)', category: 'ai', is_secret: false },
  { key: 'ai_confidence_threshold', value: '0.70', description: 'Minimum confidence score', category: 'ai', is_secret: false },
  
  // Background Settings
  { key: 'background_type', value: 'gradient', description: 'Background type: color, gradient, image', category: 'appearance', is_secret: false },
  { key: 'background_color', value: '#1a1a2e', description: 'Solid background color (hex)', category: 'appearance', is_secret: false },
  { key: 'background_gradient', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', description: 'Gradient CSS', category: 'appearance', is_secret: false },
  
  // Email Settings (disabled by default)
  { key: 'smtp_enabled', value: 'false', description: 'Enable email notifications', category: 'email', is_secret: false },
  { key: 'smtp_port', value: '587', description: 'SMTP server port', category: 'email', is_secret: false },
  
  // Security Settings
  { key: 'rate_limit_enabled', value: 'true', description: 'Enable rate limiting', category: 'security', is_secret: false },
  { key: 'rate_limit_provider', value: 'redis', description: 'Rate limit provider: memory, redis, upstash', category: 'security', is_secret: false },
  { key: 'session_timeout_minutes', value: '60', description: 'Session timeout in minutes', category: 'security', is_secret: false },
  { key: 'max_login_attempts', value: '5', description: 'Max failed login attempts before lockout', category: 'security', is_secret: false },
  
  // Storage Settings (✅ SIGNED URLS ENABLED)
  { key: 'storage_provider', value: 'supabase', description: 'Storage provider: supabase, cloudinary, s3', category: 'storage', is_secret: false },
  { key: 'storage_signed_urls', value: 'true', description: 'Use signed URLs for photos (security)', category: 'storage', is_secret: false },
  { key: 'storage_url_expiry_hours', value: '24', description: 'Signed URL expiration in hours', category: 'storage', is_secret: false },
  { key: 'max_photo_size_mb', value: '10', description: 'Maximum photo upload size in MB', category: 'storage', is_secret: false }
];

// API keys (will be set to NULL if not provided)
const API_KEY_SETTINGS = [
  { key: 'GEMINI_API_KEY', description: 'Google Gemini API Key for AI verification', category: 'ai', is_secret: true },
  { key: 'OPENAI_API_KEY', description: 'OpenAI API Key for backup AI provider', category: 'ai', is_secret: true },
  { key: 'ANTHROPIC_API_KEY', description: 'Anthropic Claude API Key for chat', category: 'ai', is_secret: true },
  { key: 'HUGGINGFACE_API_KEY', description: 'HuggingFace API Key for image generation', category: 'ai', is_secret: true }
];

async function promptForApiKeys() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query) => new Promise((resolve) => rl.question(query, resolve));

  console.log('\n🔐 API Key Configuration (Optional)');
  console.log('Press ENTER to skip any key\n');

  const apiKeys = {};

  for (const setting of API_KEY_SETTINGS) {
    const answer = await question(`${setting.description}:\n> `);
    if (answer && answer.trim()) {
      apiKeys[setting.key] = answer.trim();
    }
  }

  rl.close();
  return apiKeys;
}

async function configureSettings() {
  console.log('🚀 Configuring admin settings...\n');

  try {
    // Check if table exists
    const { data: existingSettings, error: fetchError } = await supabase
      .from('admin_settings')
      .select('key, value')
      .limit(1);

    if (fetchError && fetchError.code === '42P01') {
      console.error('❌ Error: admin_settings table does not exist');
      console.error('Run database migration first: node scripts/run-migration.js');
      process.exit(1);
    }

    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Configure default settings
    console.log('📝 Configuring default settings...\n');

    for (const setting of DEFAULT_SETTINGS) {
      const { data, error } = await supabase
        .from('admin_settings')
        .upsert(setting, { onConflict: 'key' })
        .select();

      if (error) {
        console.error(`❌ Error setting ${setting.key}:`, error.message);
        errorCount++;
      } else {
        console.log(`✅ ${setting.key} = ${setting.value}`);
        successCount++;
      }
    }

    // Handle API keys
    const withApiKeys = process.argv.includes('--with-api-keys');
    let apiKeys = {};

    if (withApiKeys) {
      apiKeys = await promptForApiKeys();
    }

    // Set API keys (NULL if not provided)
    console.log('\n🔑 Configuring API keys...\n');

    for (const setting of API_KEY_SETTINGS) {
      const value = apiKeys[setting.key] || null;
      
      const { data, error } = await supabase
        .from('admin_settings')
        .upsert(
          {
            key: setting.key,
            value,
            description: setting.description,
            category: setting.category,
            is_secret: setting.is_secret
          },
          { onConflict: 'key' }
        )
        .select();

      if (error) {
        console.error(`❌ Error setting ${setting.key}:`, error.message);
        errorCount++;
      } else {
        if (value) {
          console.log(`✅ ${setting.key} = ****** (configured)`);
          successCount++;
        } else {
          console.log(`⏭️  ${setting.key} = NULL (not configured)`);
          skippedCount++;
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 CONFIGURATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Configured: ${successCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('='.repeat(60) + '\n');

    // Verify configuration
    console.log('🔍 Verifying configuration...\n');

    const { data: allSettings, error: verifyError } = await supabase
      .from('admin_settings')
      .select('*')
      .order('category, key');

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
    } else {
      console.log(`✅ Total settings: ${allSettings?.length || 0}`);
      
      // Group by category
      const byCategory = {};
      allSettings?.forEach(setting => {
        if (!byCategory[setting.category]) {
          byCategory[setting.category] = [];
        }
        byCategory[setting.category].push(setting);
      });

      Object.keys(byCategory).forEach(category => {
        console.log(`\n📂 ${category.toUpperCase()}:`);
        byCategory[category].forEach(setting => {
          const displayValue = setting.is_secret 
            ? (setting.value ? '****** (configured)' : 'NULL (not set)')
            : setting.value;
          console.log(`   ${setting.key} = ${displayValue}`);
        });
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ CONFIGURATION COMPLETED!');
    console.log('='.repeat(60));
    console.log('\n📋 Next steps:');
    console.log('1. ✅ Admin settings configured');
    
    if (skippedCount > 0) {
      console.log('2. ⚠️  Some API keys not configured - add them via Admin UI');
    } else {
      console.log('2. ✅ All API keys configured');
    }
    
    console.log('3. ⏭️  Test enrollment flow');
    console.log('4. ⏭️  Monitor application logs');
    console.log('');

  } catch (error) {
    console.error('\n❌ CONFIGURATION FAILED:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run configuration
configureSettings().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
