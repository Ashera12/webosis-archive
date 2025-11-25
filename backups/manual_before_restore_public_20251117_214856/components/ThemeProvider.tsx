"use client";

import React, { useEffect, useState } from 'react';

export default function ThemeProvider({ children }: { children?: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const v = localStorage.getItem('ds-theme');
      return (v === 'dark' ? 'dark' : 'light');
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    // apply theme class to body so CSS tokens react
    const root = document.body;
    if (!root) return;
    if (theme === 'dark') {
      root.classList.add('ds-theme-dark');
      localStorage.setItem('ds-theme', 'dark');
    } else {
      root.classList.remove('ds-theme-dark');
      localStorage.setItem('ds-theme', 'light');
    }
  }, [theme]);

  useEffect(() => {
    // sync with system preference on first load if not set
    try {
      const stored = localStorage.getItem('ds-theme');
      if (!stored) {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark ? 'dark' : 'light');
      }
    } catch {}
  }, []);

  return (
    <>
      <div style={{ position: 'fixed', right: 12, top: 12, zIndex: 9999 }}>
        <button
          onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
          className="ds-btn"
          aria-label="Toggle theme"
          title="Toggle theme"
        >
          {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </div>
      {children}
    </>
  );
}
