/**
 * Client-safe admin settings utilities
 * This file can be imported in client components
 */

export interface GlobalBackgroundConfig {
  mode: 'none' | 'color' | 'gradient' | 'image';
  scope?: 'all-pages' | 'homepage-only' | 'selected-pages';
  selectedPages?: string[];
  color?: string;
  gradient?: string;
  imageUrl?: string;
  imageOverlayColor?: string;
  imageOverlayOpacity?: number;
  imageStyle?: 'cover' | 'contain' | 'smart-fit';
  imagePosition?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top left' | 'top right' | 'bottom left' | 'bottom right';
  imageOverlayScope?: 'full' | 'image';
  fixed?: boolean;
}

export function parseGlobalBackground(settings: Record<string,string>): GlobalBackgroundConfig {
  // Check if ANY custom background setting is present
  const hasCustomSettings = settings.GLOBAL_BG_MODE && 
    (settings.GLOBAL_BG_COLOR || settings.GLOBAL_BG_GRADIENT || settings.GLOBAL_BG_IMAGE);
  
  // If no custom settings, return 'none' mode to use CSS variables
  if (!hasCustomSettings) {
    return {
      mode: 'none',
      scope: 'all-pages'
    };
  }
  
  // Otherwise parse the settings normally
  const mode = (settings.GLOBAL_BG_MODE as GlobalBackgroundConfig['mode']) || 'none';
  const scope = (settings.GLOBAL_BG_SCOPE as GlobalBackgroundConfig['scope']) || 'all-pages';
  let selectedPages: string[] | undefined = undefined;
  if (settings.GLOBAL_BG_SELECTED_PAGES) {
    try {
      const parsed = JSON.parse(settings.GLOBAL_BG_SELECTED_PAGES);
      if (Array.isArray(parsed)) selectedPages = parsed.filter(Boolean);
      else if (typeof settings.GLOBAL_BG_SELECTED_PAGES === 'string') {
        selectedPages = settings.GLOBAL_BG_SELECTED_PAGES.split(',').map(s=>s.trim()).filter(Boolean);
      }
    } catch {
      selectedPages = (settings.GLOBAL_BG_SELECTED_PAGES || '')
        .split(',')
        .map(s=>s.trim())
        .filter(Boolean);
    }
  }
  const imageOverlayOpacity = settings.GLOBAL_BG_IMAGE_OVERLAY_OPACITY 
    ? Math.min(1, Math.max(0, parseFloat(settings.GLOBAL_BG_IMAGE_OVERLAY_OPACITY))) 
    : 0.3;
  
  // Determine if dark mode is active (only for returning defaults, not for applying)
  const isDarkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const isDarkSystemPreference = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Default gradients (only used if mode is none)
  const lightGradient = 'linear-gradient(to bottom, #f9fafb 0%, #ffffff 50%, #f3f4f6 100%)';
  const darkGradient = 'linear-gradient(to bottom, #111827 0%, #1f2937 50%, #0f172a 100%)';
  
  let gradient: string | undefined;
  if (mode === 'gradient') {
    gradient = settings.GLOBAL_BG_GRADIENT;
  } else if (mode === 'none') {
    // For 'none' mode, return the default gradient for info, but body won't apply it
    gradient = (isDarkMode || isDarkSystemPreference) ? darkGradient : lightGradient;
  }
  
  return {
    mode,
    scope,
    selectedPages,
    color: settings.GLOBAL_BG_COLOR || undefined,
    gradient,
    imageUrl: settings.GLOBAL_BG_IMAGE || undefined,
    imageOverlayColor: settings.GLOBAL_BG_IMAGE_OVERLAY_COLOR || undefined,
    imageOverlayOpacity,
    imageStyle: (['contain','smart-fit'].includes(settings.GLOBAL_BG_IMAGE_STYLE) ? settings.GLOBAL_BG_IMAGE_STYLE : 'cover') as any,
    imagePosition: (settings.GLOBAL_BG_IMAGE_POSITION as any) || 'center',
    imageOverlayScope: (settings.GLOBAL_BG_IMAGE_OVERLAY_SCOPE === 'image' ? 'image' : 'full'),
    fixed: settings.GLOBAL_BG_IMAGE_FIXED === 'true'
  };
}

// Client-side helper to fetch and parse background
export async function fetchGlobalBackground(): Promise<GlobalBackgroundConfig> {
  try {
    // Use public background endpoint (no auth required)
    const res = await fetch('/api/public/background', { cache: 'no-store' });
    if (!res.ok) {
      console.warn('Background settings fetch failed:', res.status);
      // Return empty settings so parseGlobalBackground applies CSS variable defaults
      return parseGlobalBackground({});
    }
    // Guard against HTML response (e.g., error overlay or proxy page)
    const text = await res.text();
    if (text.trim().startsWith('<')) {
      console.warn('Background settings returned HTML, falling back to CSS defaults');
      return parseGlobalBackground({});
    }
    const json = JSON.parse(text);
    const settings = json.settings || json.values || {};
    if (process.env.NODE_ENV === 'development') {
      console.log('[fetchGlobalBackground] Raw public settings:', settings);
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[fetchGlobalBackground] Fetched settings:', settings);
    }
    
    return parseGlobalBackground(settings);
  } catch (error) {
    console.error('Failed to fetch background settings:', error);
    // Return empty settings so parseGlobalBackground applies CSS variable defaults
    return parseGlobalBackground({});
  }
}
