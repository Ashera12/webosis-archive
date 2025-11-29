/**
 * Utility to get admin settings from database
 * Used by AI Manager and other services to get API keys
 */

import { supabaseAdmin } from '@/lib/supabase/server';

interface AdminSetting {
  key: string;
  value: string;
  is_secret: boolean;
}

let settingsCache: Record<string, string> = {};
let cacheTime = 0;
const CACHE_TTL = 60000; // 1 minute cache

/**
 * Get admin settings from database with caching
 */
export async function getAdminSettings(): Promise<Record<string, string>> {
  const now = Date.now();
  
  // Return cached settings if still fresh
  if (cacheTime > 0 && (now - cacheTime) < CACHE_TTL) {
    return settingsCache;
  }

  try {
    const { data: settings, error } = await supabaseAdmin
      .from('admin_settings')
      .select('key, value, is_secret');

    if (error) {
      console.error('[Admin Settings] Error fetching settings:', error);
      return settingsCache; // Return cached data on error
    }

    if (!settings || settings.length === 0) {
      console.warn('[Admin Settings] No settings found in database');
      return {};
    }

    // Build settings object
    const settingsObj: Record<string, string> = {};
    settings.forEach((setting: AdminSetting) => {
      if (setting.value && setting.value.trim() !== '') {
        settingsObj[setting.key] = setting.value;
      }
    });

    // Update cache
    settingsCache = settingsObj;
    cacheTime = now;

    console.log('[Admin Settings] Loaded settings:', Object.keys(settingsObj).join(', '));

    return settingsObj;
  } catch (error) {
    console.error('[Admin Settings] Exception fetching settings:', error);
    return settingsCache; // Return cached data on error
  }
}

/**
 * Get a specific setting value
 */
export async function getAdminSetting(key: string): Promise<string | null> {
  const settings = await getAdminSettings();
  return settings[key] || null;
}

/**
 * Get AI API keys from admin settings
 */
export async function getAIApiKeys(): Promise<{
  gemini: string | null;
  openai: string | null;
  anthropic: string | null;
}> {
  const settings = await getAdminSettings();
  
  return {
    gemini: settings['GEMINI_API_KEY'] || null,
    openai: settings['OPENAI_API_KEY'] || null,
    anthropic: settings['ANTHROPIC_API_KEY'] || null,
  };
}

/**
 * Invalidate settings cache (call after updating settings)
 */
export function invalidateSettingsCache(): void {
  settingsCache = {};
  cacheTime = 0;
  console.log('[Admin Settings] Cache invalidated');
}

/**
 * Get AI configuration from admin settings
 */
export async function getAIConfig(): Promise<{
  geminiModel: string;
  openaiModel: string;
  enableAI: boolean;
}> {
  const settings = await getAdminSettings();
  
  return {
    geminiModel: settings['GEMINI_MODEL'] || 'models/gemini-1.5-flash',
    openaiModel: settings['OPENAI_MODEL'] || 'gpt-4o-mini',
    enableAI: settings['ENABLE_AI_FEATURES'] !== 'false',
  };
}
