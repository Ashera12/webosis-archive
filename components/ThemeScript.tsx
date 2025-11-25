// This script runs before React hydration to prevent flash of wrong theme
const themeScript = `
  (function() {
    function getThemePreference() {
      if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
        return localStorage.getItem('theme');
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    const theme = getThemePreference();
    document.documentElement.classList.add('no-transition');
    document.documentElement.classList.add(theme);
    
    // Remove no-transition class after a brief delay
    setTimeout(() => {
      document.documentElement.classList.remove('no-transition');
    }, 1);
  })();
`;

export default function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />;
}