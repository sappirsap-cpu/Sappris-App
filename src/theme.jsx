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
    --bg:           #F5F2FA;
    --card:         #FFFFFF;
    --primary:      #B19CD9;
    --primary-dark: #8B72B5;
    --primary-soft: #E8DFF5;
    --text:         #2E2A3D;
    --text-muted:   #756B85;
    --border:       #DDD0EB;
    --header-bg:    #FFFFFF;
    --input-bg:     #FFFFFF;
    --nav-bg:       #FFFFFF;
    --green:        #6BAF8A;
    --green-soft:   #E0F2EB;
    --amber:        #E8B84B;
    --amber-soft:   #FDF3D7;
    --red:          #C88A8A;
    --red-soft:     #FADDDD;
    --shadow:       rgba(0,0,0,0.08);
  }
`;

const DARK = `
  :root[data-theme="dark"] {
    --bg:           #12101E;
    --card:         #1E1A2E;
    --primary:      #C5B3E0;
    --primary-dark: #A08DC5;
    --primary-soft: #2D2645;
    --text:         #EDE3F5;
    --text-muted:   #9B8BAD;
    --border:       #3D3560;
    --header-bg:    #1A1628;
    --input-bg:     #252235;
    --nav-bg:       #1A1628;
    --green:        #7BC49A;
    --green-soft:   #1A3028;
    --amber:        #E8C96A;
    --amber-soft:   #2E2510;
    --red:          #D4A0A0;
    --red-soft:     #3A1A1A;
    --shadow:       rgba(0,0,0,0.35);
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
