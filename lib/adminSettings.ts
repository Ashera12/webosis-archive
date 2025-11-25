import { supabaseAdmin } from '@/lib/supabase/server';
import type { GlobalBackgroundConfig } from '@/lib/adminSettings.client';

/**
 * Server-only admin settings utilities
 * DO NOT import this file in client components!
 * Use @/lib/adminSettings.client instead for client-safe utilities.
 */

/**
 * Fetch admin_settings into a key/value map.
 * Optionally filter by prefix to avoid pulling every key (we only need GLOBAL_BG_*)
 */
export async function getAdminSettings(prefix?: string) {
  const { data, error } = await supabaseAdmin.from('admin_settings').select('key,value,is_secret');
  if (error) {
    console.error('getAdminSettings error', error);
    return {} as Record<string,string>;
  }
  const map: Record<string,string> = {};
  data.forEach(row => {
    if (row.is_secret) return; // never expose secret server-wide unless explicitly needed
    if (prefix && !row.key.startsWith(prefix)) return;
    map[row.key] = row.value || '';
  });
  return map;
}

// Re-export parseGlobalBackground for server-side use
export { parseGlobalBackground } from '@/lib/adminSettings.client';

/**
 * Set a single admin setting
 */
export async function setAdminSetting(key: string, value: string) {
  const { error } = await supabaseAdmin
    .from('admin_settings')
    .upsert({ key, value, is_secret: key.includes('TOKEN') || key.includes('KEY') || key.includes('SECRET') }, { onConflict: 'key' });
  
  if (error) {
    console.error('setAdminSetting error', error);
    throw error;
  }
}

/**
 * Set multiple admin settings at once
 */
export async function setAdminSettings(settings: Record<string, string>) {
  const rows = Object.entries(settings).map(([key, value]) => ({
    key,
    value,
    is_secret: key.includes('TOKEN') || key.includes('KEY') || key.includes('SECRET'),
  }));

  const { error } = await supabaseAdmin
    .from('admin_settings')
    .upsert(rows, { onConflict: 'key' });
  
  if (error) {
    console.error('setAdminSettings error', error);
    throw error;
  }
}

