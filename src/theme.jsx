// ═══════════════════════════════════════════════════════════════
// src/theme.jsx
// Dark Mode — Context + CSS Variables
//
// שילוב:
//   1. עטוף ב-main.jsx:
//      import { ThemeProvider } from './theme';
//      <ThemeProvider><App /></ThemeProvider>
//
//   2. כפתור מיתוג בהגדרות:
//      import { ThemeToggle } from './theme';
//      <ThemeToggle />
//
//   3. CSS Variables — כבר מוחלות אוטומטית על :root
//      var(--bg), var(--card), var(--text), var(--border) וכו'
// ═══════════════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useEffect } from 'react';

/* ─── CSS Variables ─── */
const LIGHT = `
  :root {
    --bg:           #FDFCFA;
    --card:         #FFFFFF;
    --primary:      #2D5F4C;
    --primary-dark: #1F4335;
    --primary-soft: #E8F2ED;
    --text:         #1A1713;
    --text-muted:   #6B6560;
    --border:       #E6E2DD;
    --header-bg:    #FFFFFF;
    --input-bg:     #FAFAF9;
    --nav-bg:       #FFFFFF;
    --green:        #2D8B5F;
    --green-soft:   #E6F7EF;
    --amber:        #D97706;
    --amber-soft:   #FEF3E2;
    --red:          #DC2626;
    --red-soft:     #FEE2E2;
    --shadow:       rgba(0,0,0,0.06);
  }
`;

const DARK = `
  :root[data-theme="dark"] {
    --bg:           #0F0E0D;
    --card:         #1F1D1B;
    --primary:      #4A9B76;
    --primary-dark: #357254;
    --primary-soft: #1A2621;
    --text:         #F5F3F0;
    --text-muted:   #B0ABA5;
    --border:       #2F2D2A;
    --header-bg:    #1A1816;
    --input-bg:     #252321;
    --nav-bg:       #1A1816;
    --green:        #3DA876;
    --green-soft:   #152820;
    --amber:        #F59E0B;
    --amber-soft:   #2A1F0A;
    --red:          #EF4444;
    --red-soft:     #2A1414;
    --shadow:       rgba(0,0,0,0.5);
  }
  
  /* Glass theme - dark with animated blobs background */
  :root[data-theme="glass"] {
    --bg:           transparent;
    --card:         rgba(255,255,255,0.06);
    --primary:      #4A9B76;
    --primary-dark: #357254;
    --primary-soft: rgba(74, 155, 118, 0.15);
    --text:         #F5F3F0;
    --text-muted:   rgba(245, 243, 240, 0.65);
    --border:       rgba(255,255,255,0.12);
    --header-bg:    rgba(0,0,0,0.4);
    --input-bg:     rgba(255,255,255,0.05);
    --nav-bg:       rgba(0,0,0,0.6);
    --green:        #3DA876;
    --green-soft:   rgba(61, 168, 118, 0.15);
    --amber:        #F59E0B;
    --amber-soft:   rgba(245, 158, 11, 0.15);
    --red:          #EF4444;
    --red-soft:     rgba(239, 68, 68, 0.15);
    --shadow:       rgba(0,0,0,0.5);
  }
  
  /* Animated background for glass theme */
  :root[data-theme="glass"] body::before {
    content: '';
    position: fixed;
    inset: 0;
    z-index: -2;
    background: #000;
    pointer-events: none;
  }
  :root[data-theme="glass"] body::after {
    content: '';
    position: fixed;
    inset: 0;
    z-index: -1;
    background-image: 
      radial-gradient(circle at 80% 20%, rgba(74, 155, 118, 0.4), transparent 40%),
      radial-gradient(circle at 20% 80%, rgba(125, 211, 168, 0.3), transparent 40%),
      radial-gradient(circle at 50% 50%, rgba(232, 120, 79, 0.15), transparent 40%),
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 100% 100%, 100% 100%, 100% 100%, 32px 32px, 32px 32px;
    pointer-events: none;
    animation: sappirisGlassBg 20s ease-in-out infinite;
  }
  
  @keyframes sappirisGlassBg {
    0%, 100% { background-position: 80% 20%, 20% 80%, 50% 50%, 0 0, 0 0; }
    50% { background-position: 70% 30%, 30% 70%, 60% 40%, 0 0, 0 0; }
  }
`;

/* ─── Inject styles once ─── */
function injectThemeStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('theme-vars')) return;
  const style = document.createElement('style');
  style.id = 'theme-vars';
  style.textContent = LIGHT + DARK + `
    * { transition: background-color 0.25s ease, border-color 0.2s ease, color 0.15s ease; }
    /* Prevent transition on page load */
    .no-transition, .no-transition * { transition: none !important; }
  `;
  document.head.appendChild(style);
}

/* ─── Context ─── */
const ThemeCtx = createContext({ theme: 'light', setTheme: () => {}, toggle: () => {} });
export const useTheme = () => useContext(ThemeCtx);

const VALID_THEMES = ['light', 'dark', 'glass'];

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem('sappir-theme');
      if (VALID_THEMES.includes(saved)) return saved;
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch { return 'light'; }
  });

  useEffect(() => {
    injectThemeStyles();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('sappir-theme', theme); } catch {}
  }, [theme]);

  const setTheme = (newTheme) => {
    if (VALID_THEMES.includes(newTheme)) {
      setThemeState(newTheme);
    }
  };

  const toggle = () => setThemeState(t => t === 'light' ? 'dark' : 'light');

  return (
    <ThemeCtx.Provider value={{ theme, setTheme, toggle, isDark: theme === 'dark' || theme === 'glass', isGlass: theme === 'glass' }}>
      {children}
    </ThemeCtx.Provider>
  );
}

/* ─── Toggle Button ─── */
export function ThemeToggle({ style = {} }) {
  const { theme, toggle, isDark } = useTheme();
  return (
    <button
      onClick={toggle}
      title={isDark ? 'מצב בהיר' : 'מצב כהה'}
      style={{
        background: isDark ? '#2D2645' : '#F5F2FA',
        border: `1px solid ${isDark ? '#3D3560' : '#DDD0EB'}`,
        borderRadius: 10,
        width: 40, height: 40,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', fontSize: 18,
        transition: 'all 0.2s',
        ...style,
      }}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}

/* ─── Row for settings screen ─── */
export function ThemeSettingRow() {
  const { theme, toggle, isDark } = useTheme();
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <div>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
          {isDark ? '🌙 מצב כהה' : '☀️ מצב בהיר'}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
          {isDark ? 'לחצי לעבור למצב בהיר' : 'לחצי לעבור למצב כהה'}
        </p>
      </div>
      {/* Toggle Switch */}
      <button onClick={toggle} style={{
        width: 46, height: 26, borderRadius: 13,
        background: isDark ? 'var(--primary)' : 'var(--border)',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background 0.25s',
      }}>
        <div style={{
          width: 20, height: 20, borderRadius: '50%',
          background: 'white',
          position: 'absolute', top: 3,
          left: isDark ? 23 : 3,
          transition: 'left 0.25s cubic-bezier(0.34,1.56,0.64,1)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        }} />
      </button>
    </div>
  );
}
