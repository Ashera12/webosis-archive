/**
 * Theme Templates & Presets for Quick Setup
 */

export interface ThemeTemplate {
  id: string;
  name: string;
  description: string;
  preview?: string;
  dark: ThemeColors;
  light: ThemeColors;
  background?: BackgroundConfig;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
}

export interface BackgroundConfig {
  mode: 'none' | 'color' | 'gradient' | 'image';
  scope: 'all-pages' | 'homepage-only' | 'selected-pages';
  color?: string;
  gradient?: string;
  image?: string;
  overlayOpacity?: number;
  selectedPages?: string[];
}

export const THEME_TEMPLATES: ThemeTemplate[] = [
  {
    id: 'modern-purple',
    name: '🟣 Modern Purple',
    description: 'Clean and professional with purple accents',
    dark: {
      primary: '#8b5cf6',
      secondary: '#a78bfa',
      accent: '#c4b5fd',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
      textSecondary: '#cbd5e1',
      border: '#334155',
    },
    light: {
      primary: '#7c3aed',
      secondary: '#8b5cf6',
      accent: '#a78bfa',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#0f172a',
      textSecondary: '#475569',
      border: '#e2e8f0',
    },
    background: {
      mode: 'gradient',
      scope: 'all-pages',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }
  },
  {
    id: 'ocean-blue',
    name: '🌊 Ocean Blue',
    description: 'Calm and trustworthy blue theme',
    dark: {
      primary: '#0ea5e9',
      secondary: '#38bdf8',
      accent: '#7dd3fc',
      background: '#0c4a6e',
      surface: '#075985',
      text: '#f0f9ff',
      textSecondary: '#bae6fd',
      border: '#0369a1',
    },
    light: {
      primary: '#0284c7',
      secondary: '#0ea5e9',
      accent: '#38bdf8',
      background: '#ffffff',
      surface: '#f0f9ff',
      text: '#0c4a6e',
      textSecondary: '#0369a1',
      border: '#bae6fd',
    },
    background: {
      mode: 'gradient',
      scope: 'all-pages',
      gradient: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)',
    }
  },
  {
    id: 'forest-green',
    name: '🌲 Forest Green',
    description: 'Natural and eco-friendly green theme',
    dark: {
      primary: '#10b981',
      secondary: '#34d399',
      accent: '#6ee7b7',
      background: '#064e3b',
      surface: '#065f46',
      text: '#ecfdf5',
      textSecondary: '#a7f3d0',
      border: '#047857',
    },
    light: {
      primary: '#059669',
      secondary: '#10b981',
      accent: '#34d399',
      background: '#ffffff',
      surface: '#f0fdf4',
      text: '#064e3b',
      textSecondary: '#047857',
      border: '#a7f3d0',
    },
    background: {
      mode: 'gradient',
      scope: 'all-pages',
      gradient: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)',
    }
  },
  {
    id: 'sunset-orange',
    name: '🌅 Sunset Orange',
    description: 'Warm and energetic orange theme',
    dark: {
      primary: '#f97316',
      secondary: '#fb923c',
      accent: '#fdba74',
      background: '#7c2d12',
      surface: '#9a3412',
      text: '#fff7ed',
      textSecondary: '#fed7aa',
      border: '#c2410c',
    },
    light: {
      primary: '#ea580c',
      secondary: '#f97316',
      accent: '#fb923c',
      background: '#ffffff',
      surface: '#fff7ed',
      text: '#7c2d12',
      textSecondary: '#c2410c',
      border: '#fed7aa',
    },
    background: {
      mode: 'gradient',
      scope: 'all-pages',
      gradient: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)',
    }
  },
  {
    id: 'cosmic-dark',
    name: '🌌 Cosmic Dark',
    description: 'Deep space inspired dark theme',
    dark: {
      primary: '#6366f1',
      secondary: '#818cf8',
      accent: '#a5b4fc',
      background: '#141e30',
      surface: '#243b55',
      text: '#e0e7ff',
      textSecondary: '#c7d2fe',
      border: '#4f46e5',
    },
    light: {
      primary: '#4f46e5',
      secondary: '#6366f1',
      accent: '#818cf8',
      background: '#ffffff',
      surface: '#f5f7ff',
      text: '#1e1b4b',
      textSecondary: '#4338ca',
      border: '#c7d2fe',
    },
    background: {
      mode: 'gradient',
      scope: 'all-pages',
      gradient: 'linear-gradient(135deg, #141e30 0%, #243b55 100%)',
    }
  },
  {
    id: 'minimal-light',
    name: '⚪ Minimal Light',
    description: 'Clean minimal design with subtle colors',
    dark: {
      primary: '#64748b',
      secondary: '#94a3b8',
      accent: '#cbd5e1',
      background: '#1e293b',
      surface: '#334155',
      text: '#f1f5f9',
      textSecondary: '#cbd5e1',
      border: '#475569',
    },
    light: {
      primary: '#475569',
      secondary: '#64748b',
      accent: '#94a3b8',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#0f172a',
      textSecondary: '#475569',
      border: '#e2e8f0',
    },
    background: {
      mode: 'color',
      scope: 'all-pages',
      color: '#f8fafc',
    }
  },
  {
    id: 'vibrant-rainbow',
    name: '🌈 Vibrant Rainbow',
    description: 'Colorful and energetic multi-color theme',
    dark: {
      primary: '#ec4899',
      secondary: '#f472b6',
      accent: '#fbcfe8',
      background: '#831843',
      surface: '#9f1239',
      text: '#fdf2f8',
      textSecondary: '#fce7f3',
      border: '#be123c',
    },
    light: {
      primary: '#db2777',
      secondary: '#ec4899',
      accent: '#f472b6',
      background: '#ffffff',
      surface: '#fdf2f8',
      text: '#831843',
      textSecondary: '#be123c',
      border: '#fbcfe8',
    },
    background: {
      mode: 'gradient',
      scope: 'all-pages',
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    }
  },
  {
    id: 'professional-navy',
    name: '💼 Professional Navy',
    description: 'Corporate and trustworthy navy blue',
    dark: {
      primary: '#1e40af',
      secondary: '#3b82f6',
      accent: '#60a5fa',
      background: '#1e3a8a',
      surface: '#1e40af',
      text: '#dbeafe',
      textSecondary: '#bfdbfe',
      border: '#2563eb',
    },
    light: {
      primary: '#1d4ed8',
      secondary: '#2563eb',
      accent: '#3b82f6',
      background: '#ffffff',
      surface: '#eff6ff',
      text: '#1e3a8a',
      textSecondary: '#1e40af',
      border: '#bfdbfe',
    },
    background: {
      mode: 'gradient',
      scope: 'all-pages',
      gradient: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)',
    }
  },
];

/**
 * Convert theme template to admin settings format
 */
export function templateToSettings(template: ThemeTemplate, isDark: boolean): Record<string, string> {
  const colors = isDark ? template.dark : template.light;
  const settings: Record<string, string> = {
    [`THEME_${isDark ? 'DARK' : 'LIGHT'}_PRIMARY`]: colors.primary,
    [`THEME_${isDark ? 'DARK' : 'LIGHT'}_SECONDARY`]: colors.secondary,
    [`THEME_${isDark ? 'DARK' : 'LIGHT'}_ACCENT`]: colors.accent,
    [`THEME_${isDark ? 'DARK' : 'LIGHT'}_BG`]: colors.background,
    [`THEME_${isDark ? 'DARK' : 'LIGHT'}_SURFACE`]: colors.surface,
    [`THEME_${isDark ? 'DARK' : 'LIGHT'}_TEXT`]: colors.text,
    [`THEME_${isDark ? 'DARK' : 'LIGHT'}_TEXT_SECONDARY`]: colors.textSecondary,
    [`THEME_${isDark ? 'DARK' : 'LIGHT'}_BORDER`]: colors.border,
  };

  // Add background settings if present
  if (template.background) {
    settings['GLOBAL_BG_MODE'] = template.background.mode;
    settings['GLOBAL_BG_SCOPE'] = template.background.scope;
    
    if (template.background.color) {
      settings['GLOBAL_BG_COLOR'] = template.background.color;
    }
    if (template.background.gradient) {
      settings['GLOBAL_BG_GRADIENT'] = template.background.gradient;
    }
    if (template.background.image) {
      settings['GLOBAL_BG_IMAGE'] = template.background.image;
    }
    if (template.background.overlayOpacity !== undefined) {
      settings['GLOBAL_BG_IMAGE_OVERLAY_OPACITY'] = String(template.background.overlayOpacity);
    }
    if (template.background.selectedPages) {
      settings['GLOBAL_BG_SELECTED_PAGES'] = JSON.stringify(template.background.selectedPages);
    }
  }

  return settings;
}
