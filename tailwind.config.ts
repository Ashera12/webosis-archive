import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './contexts/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
        'playfair': ['Playfair Display', 'serif'],
      },
      borderRadius: {
        'ds': '12px',
        'ds-lg': '1rem',
        'ds-2xl': '1.25rem',
      },
      boxShadow: {
        'ds-soft': '0 8px 24px rgba(2,6,23,0.06)',
        'ds-card': '0 6px 18px rgba(11,22,34,0.06)',
        'ds-glow': '0 10px 30px rgba(201,168,106,0.08)'
      },
      colors: {
        'warning': '#facc15',
        'warning-dark': '#eab308',
        'primary-gold': '#D4AF37',
        'primary-gold-light': '#E6C547',
        'primary-gold-dark': '#B8941F',
        // Design-system tokens (OSIS branding)
        'ds-bg': '#fbf7f3',
        'ds-panel': 'rgba(255,255,255,0.75)',
        'ds-muted': '#5b5b5b',
        'ds-accent': '#c49b6d',
        'ds-accent-dark': '#c9a86a',
        'ds-dark-bg': '#0b0c10',
        'ds-text-light': '#071133',
        'ds-text-dark': '#e6eef6',
        // Gold accents
        'gold-100': '#F6E7C6',
        'gold-200': '#E6C547',
        'gold-300': '#D4AF37',
        'gold-400': '#B8941F',
        'gold-500': '#A47A00',
        'ds-border-gold': 'rgba(212,175,55,0.12)'
      },
      backgroundImage: {
        'back2-bg': "url('/images/back2-bg.jpg')",
        'back2-gradient': 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
      },
      keyframes: {
        'fade-in': {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'fade-in-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-subtle': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-subtle': {
          '0%': { transform: 'scale(0.985)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'slide-in-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(50px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
      },
      animation: {
        'fade-in': 'fade-in 1.2s cubic-bezier(0.33,1,0.68,1)',
        'fade-up': 'fade-up 0.72s cubic-bezier(0.33,1,0.68,1) both',
        'fade-in-subtle': 'fade-in-subtle 0.9s cubic-bezier(0.33,1,0.68,1) both',
        'scale-subtle': 'scale-subtle 0.7s cubic-bezier(0.33,1,0.68,1) both',
        'fade-in-up': 'fade-in-up 0.8s cubic-bezier(0.33,1,0.68,1) forwards',
        'slide-in-up': 'slide-in-up 0.8s cubic-bezier(0.33,1,0.68,1) forwards',
      },
      transitionTimingFunction: {
        'premium': 'cubic-bezier(0.33,1,0.68,1)',
      },
      spacing: {
        'compact-x': '1rem',
        'compact-y': '1.5rem',
      },
      fontSize: {
        'mobile-hero': '1.75rem',
        'mobile-sub': '1.125rem',
        'mobile-body': '1rem',
      },
      
      backdropBlur: {
        'xs': '2px',
      },
    },
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '2rem',
        lg: '4rem',
        xl: '5rem',
        '2xl': '6rem',
      },
    },
  },
  plugins: [],
};

export default config;