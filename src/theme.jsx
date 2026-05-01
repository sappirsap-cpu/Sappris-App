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
const ThemeCtx = createContext({ theme: 'light', toggle: () => {} });
export const useTheme = () => useContext(ThemeCtx);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('sappir-theme');
      if (saved === 'dark' || saved === 'light') return saved;
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

  const toggle = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  return (
    <ThemeCtx.Provider value={{ theme, toggle, isDark: theme === 'dark' }}>
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
