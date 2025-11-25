/**
 * lib/adminConfig.ts
 * Centralized runtime configuration helper. Reads from admin_settings table,
 * fallback to process.env. This enables live config updates via /admin/settings
 * without requiring redeploy.
 */

import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * Get a config value from admin_settings if exists, else from process.env.
 * Returns empty string if neither exists.
 * 
 * PRIORITY ORDER (CRITICAL):
 * 1. Database (admin_settings) - allows live updates via UI
 * 2. Environment variables - fallback only
 * 
 * Exception: ADMIN_OPS_TOKEN always from .env for security
 */
export async function getConfig(key: string): Promise<string | null> {
  // Special case: ADMIN_OPS_TOKEN always from .env for security
  if (key === 'ADMIN_OPS_TOKEN' && process.env.ADMIN_OPS_TOKEN) {
    return process.env.ADMIN_OPS_TOKEN;
  }
  
  // 1. FIRST: Try database (allows live updates without redeploy)
  try {
    const { data, error } = await supabaseAdmin
      .from('admin_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle(); // Use maybeSingle to avoid error if not found
    
    if (!error && data?.value) {
      // Database has this key and it's not empty - use it!
      const preview = data.value.length > 20 ? data.value.substring(0, 20) + '...' : data.value;
      console.log(`[getConfig] Using DB value for ${key}: ${preview} (${data.value.length} chars)`);
      return data.value;
    }
  } catch (error) {
    console.error(`[getConfig] DB read error for ${key}:`, error);
    // Continue to fallback
  }
  
  // 2. FALLBACK: Try environment variable
  const envValue = process.env[key];
  if (envValue) {
    const preview = envValue.length > 20 ? envValue.substring(0, 20) + '...' : envValue;
    console.log(`[getConfig] Using ENV fallback for ${key}: ${preview} (${envValue.length} chars)`);
    return envValue;
  }
  
  // 3. Not found anywhere
  console.log(`[getConfig] No value found for ${key}`);
  return null;
}

/**
 * Get a boolean config value (true if value is 'true', else false).
 */
export async function getConfigBoolean(key: string): Promise<boolean> {
  const val = await getConfig(key);
  return val === 'true';
}

/**
 * Update a config value in admin_settings. Upserts into DB if available.
 * If no DB, returns error.
 */
export async function updateConfig(key: string, value: string): Promise<{ ok: boolean; error?: string }> {
  // Some Supabase setups have schema cache issues for PK on admin_settings.
  // Use manual upsert by key to avoid depending on PK discovery.
  try {
    const { data: existing } = await supabaseAdmin
      .from('admin_settings')
      .select('key')
      .eq('key', key)
      .single();
    if (existing) {
      const { error } = await supabaseAdmin
        .from('admin_settings')
        .update({ value })
        .eq('key', key);
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    } else {
      const { error } = await supabaseAdmin
        .from('admin_settings')
        .insert({ key, value } as any);
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    }
  } catch (e: any) {
    return { ok: false, error: e.message || 'updateConfig failed' };
  }
}
