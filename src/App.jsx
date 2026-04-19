import React, { useState } from 'react';
import CoachApp from './coach_app';
import ClientApp from './client_app';

/**
 * Unified demo app — combines coach and client mockups into a single experience.
 *
 * Intended flow for Sappir's review:
 *   1. She lands on a splash screen with two big buttons: "אני ספיר" or "אני מתאמנת"
 *   2. Picking one opens that side's full experience
 *   3. A small "החלף תצוגה" pill in the corner always visible, so she can flip
 *      between perspectives easily while reviewing
 *
 * This is Netlify-ready: pure React + Vite, no backend calls.
 */

const COLORS = {
  bg: '#F0F7F2',
  primary: '#7BB892',
  primaryDark: '#5A9A70',
  primarySoft: '#D6EDDE',
  accent: '#F4C2C2',
  text: '#2D3E33',
  textMuted: '#6B8574',
  border: '#D0E3D6',
};

export default function App() {
  const [role, setRole] = useState(null); // null | 'coach' | 'client' | 'coachLogin'

  if (role === null) {
    return <ClientLogin onLogin={() => setRole('client')} onCoachLogin={() => setRole('coachLogin')} />;
  }

  if (role === 'coachLogin') {
    return <CoachLogin onLogin={() => setRole('coach')} onBack={() => setRole(null)} />;
  }

  return (
    <div style={{ position: 'relative' }}>
      {role === 'coach' ? <CoachApp /> : <ClientApp />}

      <button onClick={() => setRole(null)} aria-label="התנתק"
        style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: COLORS.text,
          color: 'white',
          border: 'none',
          borderRadius: '999px',
          padding: '6px 12px',
          fontSize: '11px',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'inherit',
          direction: 'rtl',
          zIndex: 999,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          opacity: 0.85,
        }}>
        🚪 התנתק
      </button>
    </div>
  );
}

/* ================ CLIENT LOGIN — main entry, form immediately visible ================ */

function ClientLogin({ onLogin, onCoachLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      setError('יש למלא את כל השדות');
      return;
    }
    setError('');
    onLogin();
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    border: `1px solid ${COLORS.border}`,
    borderRadius: '12px',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit',
    direction: 'rtl',
    boxSizing: 'border-box',
    background: 'white',
  };

  return (
    <div style={{
      direction: 'rtl',
      fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
      background: `linear-gradient(135deg, ${COLORS.bg} 0%, #DDEEDE 100%)`,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      color: COLORS.text,
    }}>
      {/* Main content — centered */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        {/* Logo + Branding */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img
            src="/logo.png"
            alt="Sappir Barak"
            style={{
              width: '140px',
              height: '140px',
              objectFit: 'contain',
              margin: '0 auto',
              display: 'block',
            }}
          />
        </div>

        {/* Login form — immediately visible */}
        <div style={{
          width: '100%',
          maxWidth: '340px',
          background: 'white',
          borderRadius: '20px',
          padding: '28px 24px',
          border: `1px solid ${COLORS.border}`,
          boxShadow: '0 4px 16px rgba(183, 148, 212, 0.15)',
        }}>
          <p style={{ fontSize: '15px', color: COLORS.textMuted, margin: '0 0 20px 0', textAlign: 'center' }}>
            הכניסי פרטי התחברות
          </p>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: COLORS.text, display: 'block', marginBottom: '6px' }}>
              אימייל או טלפון
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>

          <div style={{ marginBottom: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: COLORS.text, display: 'block', marginBottom: '6px' }}>
              סיסמה
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>

          <div style={{ textAlign: 'left', marginBottom: '16px' }}>
            <button style={{ background: 'transparent', border: 'none', color: COLORS.primary, fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
              שכחתי סיסמה
            </button>
          </div>

          {/* Remember me */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', cursor: 'pointer', direction: 'rtl' }}>
            <div onClick={() => setRememberMe(r => !r)}
              style={{ width: '18px', height: '18px', borderRadius: '4px', border: `2px solid ${rememberMe ? COLORS.primary : COLORS.border}`, background: rememberMe ? COLORS.primary : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', transition: 'all 0.15s' }}>
              {rememberMe && <span style={{ color: 'white', fontSize: '11px', fontWeight: 700, lineHeight: 1 }}>✓</span>}
            </div>
            <span style={{ fontSize: '13px', color: COLORS.textMuted, userSelect: 'none' }}>זכור אותי</span>
          </label>

          {error && (
            <p style={{ fontSize: '12px', color: '#C44', margin: '0 0 12px 0', textAlign: 'center', fontWeight: 600 }}>
              {error}
            </p>
          )}

          <button
            onClick={handleLogin}
            style={{
              width: '100%',
              background: COLORS.primary,
              color: 'white',
              border: 'none',
              padding: '14px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 4px 12px rgba(183, 148, 212, 0.35)',
              transition: 'transform 0.1s',
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            כניסה
          </button>
        </div>
      </main>

      {/* Footer — coach login, small and subtle */}
      <footer style={{ padding: '20px', textAlign: 'center', borderTop: `1px solid ${COLORS.border}` }}>
        <button
          onClick={onCoachLogin}
          style={{
            background: 'transparent',
            border: 'none',
            color: COLORS.textMuted,
            fontSize: '13px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            padding: '8px 16px',
          }}
        >
          כניסת מנהל →
        </button>
      </footer>
    </div>
  );
}

/* ================ COACH LOGIN — separate screen with its own form ================ */

function CoachLogin({ onLogin, onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      setError('יש למלא את כל השדות');
      return;
    }
    setError('');
    onLogin();
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    border: `1px solid ${COLORS.border}`,
    borderRadius: '12px',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit',
    direction: 'rtl',
    boxSizing: 'border-box',
    background: 'white',
  };

  return (
    <div style={{
      direction: 'rtl',
      fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
      background: `linear-gradient(135deg, ${COLORS.bg} 0%, #DDEEDE 100%)`,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      color: COLORS.text,
    }}>
      <div style={{
        width: '100%',
        maxWidth: '340px',
        background: 'white',
        borderRadius: '20px',
        padding: '28px 24px',
        border: `1px solid ${COLORS.border}`,
        boxShadow: '0 4px 16px rgba(183, 148, 212, 0.15)',
      }}>
        <button
          onClick={onBack}
          style={{ background: 'transparent', border: 'none', color: COLORS.textMuted, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', padding: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          ← חזרה
        </button>

        <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0', color: COLORS.primaryDark, textAlign: 'center' }}>
          כניסת מנהל
        </h2>
        <p style={{ fontSize: '13px', color: COLORS.textMuted, margin: '0 0 20px 0', textAlign: 'center' }}>
          ממשק ניהול לקוחות ותוכניות
        </p>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: COLORS.text, display: 'block', marginBottom: '6px' }}>
            אימייל
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="sappir@example.com"
            style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: COLORS.text, display: 'block', marginBottom: '6px' }}>
            סיסמה
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
        </div>

        {/* Remember me */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', cursor: 'pointer', direction: 'rtl' }}>
          <div onClick={() => setRememberMe(r => !r)}
            style={{ width: '18px', height: '18px', borderRadius: '4px', border: `2px solid ${rememberMe ? COLORS.primaryDark : COLORS.border}`, background: rememberMe ? COLORS.primaryDark : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', transition: 'all 0.15s' }}>
            {rememberMe && <span style={{ color: 'white', fontSize: '11px', fontWeight: 700, lineHeight: 1 }}>✓</span>}
          </div>
          <span style={{ fontSize: '13px', color: COLORS.textMuted, userSelect: 'none' }}>זכור אותי</span>
        </label>

        {error && (
          <p style={{ fontSize: '12px', color: '#C44', margin: '0 0 12px 0', textAlign: 'center', fontWeight: 600 }}>
            {error}
          </p>
        )}

        <button
          onClick={handleLogin}
          style={{
            width: '100%',
            background: COLORS.primaryDark,
            color: 'white',
            border: 'none',
            padding: '14px',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
            boxShadow: '0 4px 12px rgba(155, 122, 184, 0.35)',
          }}
        >
          כניסה לניהול
        </button>
      </div>
    </div>
  );
}
