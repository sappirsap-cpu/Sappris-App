// ═══════════════════════════════════════════════════════════════
// src/theme_modern.jsx
// עיצוב מודרני 2026 - בהשראת Emil Kowalski ו-Impeccable
//
// שינויים עיקריים:
// ✓ ללא גרדיאנטים סגולים (anti-pattern)
// ✓ פונטים ייחודיים במקום Inter
// ✓ אנימציות חלקות עם ease-out curves
// ✓ צבעים עם tinting נכון (OKLCH inspired)
// ✓ Micro-interactions מעודנות
// ═══════════════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useEffect } from 'react';

/* ─── Google Fonts ─── */
// DM Sans - גופן מודרני ונקי (במקום Inter)
// Bricolage Grotesque - לכותרות דרמטיות
function loadFonts() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('modern-fonts')) return;
  
  const link = document.createElement('link');
  link.id = 'modern-fonts';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap';
  document.head.appendChild(link);
}

/* ─── Modern CSS Variables ─── */
const LIGHT = `
  :root {
    /* Colors - inspired by nature, not generic purple */
    --bg:           #FDFCFA;
    --bg-alt:       #F8F6F2;
    --card:         #FFFFFF;
    --primary:      #2D5F4C;        /* Forest green - אלגנטי ומרגיע */
    --primary-dark: #1F4335;
    --primary-soft: #E8F2ED;
    --accent:       #E8784F;        /* Warm terracotta */
    --accent-dark:  #C85F3A;
    --accent-soft:  #FFF3EF;
    
    /* Typography */
    --text:         #1A1713;
    --text-muted:   #6B6560;
    --text-subtle:  #9B9490;
    
    /* UI Elements */
    --border:       #E6E2DD;
    --border-light: #F2EFEA;
    --header-bg:    rgba(255, 255, 255, 0.85);
    --input-bg:     #FAFAF9;
    --nav-bg:       rgba(255, 255, 255, 0.95);
    
    /* Status colors */
    --success:      #2D8B5F;
    --success-soft: #E6F7EF;
    --warning:      #D97706;
    --warning-soft: #FEF3E2;
    --error:        #DC2626;
    --error-soft:   #FEE2E2;
    
    /* Shadows - soft and realistic */
    --shadow-sm:    0 1px 2px rgba(0, 0, 0, 0.04);
    --shadow:       0 2px 8px rgba(0, 0, 0, 0.06);
    --shadow-md:    0 4px 16px rgba(0, 0, 0, 0.08);
    --shadow-lg:    0 8px 32px rgba(0, 0, 0, 0.1);
    
    /* Typography scale */
    --font-display: 'Bricolage Grotesque', system-ui, sans-serif;
    --font-body:    'DM Sans', system-ui, sans-serif;
    --font-mono:    ui-monospace, 'Cascadia Code', monospace;
  }
`;

const DARK = `
  :root[data-theme="dark"] {
    /* Dark mode - warm, not harsh */
    --bg:           #0F0E0D;
    --bg-alt:       #1A1816;
    --card:         #1F1D1B;
    --primary:      #4A9B76;
    --primary-dark: #357254;
    --primary-soft: #1A2621;
    --accent:       #F5956F;
    --accent-dark:  #D97854;
    --accent-soft:  #2A1A14;
    
    --text:         #F5F3F0;
    --text-muted:   #B0ABA5;
    --text-subtle:  #7A7571;
    
    --border:       #2F2D2A;
    --border-light: #252321;
    --header-bg:    rgba(26, 24, 22, 0.9);
    --input-bg:     #252321;
    --nav-bg:       rgba(26, 24, 22, 0.95);
    
    --success:      #3DA876;
    --success-soft: #152820;
    --warning:      #F59E0B;
    --warning-soft: #2A1F0A;
    --error:        #EF4444;
    --error-soft:   #2A1414;
    
    --shadow-sm:    0 1px 2px rgba(0, 0, 0, 0.5);
    --shadow:       0 2px 8px rgba(0, 0, 0, 0.6);
    --shadow-md:    0 4px 16px rgba(0, 0, 0, 0.7);
    --shadow-lg:    0 8px 32px rgba(0, 0, 0, 0.8);
  }
`;

/* ─── Modern Animations ─── */
// Emil Kowalski principles:
// - UI animations < 300ms
// - Use custom easing (not CSS defaults)
// - Perceived performance matters
const ANIMATIONS = `
  /* Smooth transitions */
  * {
    transition-duration: 0.2s;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); /* ease-out */
  }
  
  /* Specific elements need faster/different timing */
  button, a, [role="button"] {
    transition-duration: 0.15s;
  }
  
  /* Background and color changes */
  *:where([style*="background"], [class*="bg-"]) {
    transition-property: background-color, border-color;
    transition-duration: 0.25s;
  }
  
  /* Text color */
  *:where([style*="color"], [class*="text-"]) {
    transition-property: color;
    transition-duration: 0.15s;
  }
  
  /* Transform animations (performant) */
  *:where([style*="transform"]) {
    transition-property: transform, opacity;
    transition-duration: 0.3s;
    transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1); /* spring */
  }
  
  /* Prevent transition on page load */
  .no-transition,
  .no-transition * {
    transition: none !important;
  }
  
  /* Micro-interactions */
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes slideIn {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  @keyframes bounce {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-6px); }
  }
  
  /* Hover states - subtle and elegant */
  button:not(:disabled):hover,
  a:hover,
  [role="button"]:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
  
  button:not(:disabled):active,
  a:active,
  [role="button"]:active {
    transform: translateY(0);
    box-shadow: var(--shadow-sm);
  }
  
  /* Focus states - accessible */
  :focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
    border-radius: 4px;
  }
  
  /* Reduce motion for accessibility */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

/* ─── Inject styles ─── */
function injectModernStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('theme-modern')) return;
  
  loadFonts();
  
  const style = document.createElement('style');
  style.id = 'theme-modern';
  style.textContent = LIGHT + DARK + ANIMATIONS;
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
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    injectModernStyles();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('sappir-theme', theme);
    } catch {}
  }, [theme]);

  const toggle = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));

  return (
    <ThemeCtx.Provider value={{ theme, toggle, isDark: theme === 'dark' }}>
      {children}
    </ThemeCtx.Provider>
  );
}

/* ─── Modern Toggle Button ─── */
// With smooth animation and better UX
export function ThemeToggle({ style = {} }) {
  const { theme, toggle, isDark } = useTheme();
  const [isPressed, setIsPressed] = useState(false);

  return (
    <button
      onClick={() => {
        setIsPressed(true);
        setTimeout(() => setIsPressed(false), 200);
        toggle();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsPressed(true);
          setTimeout(() => setIsPressed(false), 200);
          toggle();
        }
      }}
      title={isDark ? 'עבור למצב בהיר' : 'עבור למצב כהה'}
      aria-label={isDark ? 'עבור למצב בהיר' : 'עבור למצב כהה'}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        width: 44,
        height: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: 20,
        boxShadow: 'var(--shadow)',
        transform: isPressed ? 'scale(0.95)' : 'scale(1)',
        transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        ...style,
      }}
    >
      <span
        style={{
          display: 'inline-block',
          transform: isPressed ? 'rotate(20deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {isDark ? '☀️' : '🌙'}
      </span>
    </button>
  );
}

/* ─── Settings Row with modern switch ─── */
export function ThemeSettingRow() {
  const { theme, toggle, isDark } = useTheme();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 0',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div>
        <p
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--text)',
            fontFamily: 'var(--font-body)',
          }}
        >
          {isDark ? '🌙 מצב לילה' : '☀️ מצב יום'}
        </p>
        <p
          style={{
            margin: '4px 0 0',
            fontSize: 13,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
          }}
        >
          {isDark ? 'נוח לעיניים בשעות הערב' : 'בהיר ומרענן'}
        </p>
      </div>

      {/* Modern iOS-style toggle */}
      <button
        onClick={toggle}
        aria-label={isDark ? 'כבה מצב לילה' : 'הפעל מצב לילה'}
        style={{
          width: 52,
          height: 30,
          borderRadius: 15,
          background: isDark ? 'var(--primary)' : 'var(--border)',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background-color 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          padding: 0,
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: 'white',
            position: 'absolute',
            top: 2,
            left: isDark ? 24 : 2,
            transition: 'left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          }}
        />
      </button>
    </div>
  );
}
