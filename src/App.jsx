import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import CoachApp from './coach_app';
import ClientApp from './client_app';

const COLORS = {
  bg: '#F0F7F2', primary: '#7BB892', primaryDark: '#5A9A70',
  primarySoft: '#D6EDDE', accent: '#F4C2C2', accentDark: '#C88A8A',
  text: '#2D3E33', textMuted: '#6B8574', border: '#D0E3D6',
};

const S = {
  inp: {
    width: '100%', padding: '14px 16px', border: `1px solid ${COLORS.border}`,
    borderRadius: '12px', fontSize: '14px', outline: 'none',
    fontFamily: 'inherit', direction: 'ltr', textAlign: 'right',
    boxSizing: 'border-box', background: 'white',
  },
};

export default function App() {
  const [session, setSession]   = useState(undefined); // undefined = loading
  const [userRole, setUserRole] = useState(undefined); // undefined = checking, null = not found, 'coach'/'client'
  const [screen, setScreen]     = useState('client'); // 'client' | 'coach'

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(session);
      if (session) {
        await detectRole(session.user.id);
      } else {
        setUserRole(null);
      }
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      if (newSession) {
        setUserRole(undefined); // reset to "checking"
        await detectRole(newSession.user.id);
      } else {
        setUserRole(null);
      }
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const detectRole = async (userId) => {
    try {
      const { data: coaches, error: coachErr } = await supabase
        .from('coaches').select('id').eq('id', userId).limit(1);
      if (coachErr) console.error('coach check:', coachErr);
      if (coaches && coaches.length > 0) { setUserRole('coach'); return; }

      const { data: clients, error: clientErr } = await supabase
        .from('clients').select('id').eq('id', userId).limit(1);
      if (clientErr) console.error('client check:', clientErr);
      if (clients && clients.length > 0) { setUserRole('client'); return; }

      setUserRole(null);
    } catch (e) {
      console.error('detectRole failed:', e);
      setUserRole(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserRole(null);
    setScreen('client');
  };

  // טוען — גם בדיקת session וגם בדיקת תפקיד
  if (session === undefined || (session && userRole === undefined)) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLORS.bg }}>
        <div style={{ textAlign: 'center' }}>
          <img src="/logo.png" alt="Sappir Barak" style={{ width: 180, marginBottom: 20 }} />
          <p style={{ color: COLORS.textMuted, fontSize: 14 }}>טוען...</p>
        </div>
      </div>
    );
  }

  // לא מחובר — הצג עמוד כניסה
  if (!session) {
    if (screen === 'coach') return <CoachLogin onBack={() => setScreen('client')} />;
    return <ClientLogin onCoachLogin={() => setScreen('coach')} />;
  }

  // מחובר אבל תפקיד לא ידוע (null = לא נמצא)
  if (userRole === null) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLORS.bg, direction: 'rtl' }}>
        <div style={{ textAlign: 'center', padding: 20 }}>
          <p style={{ color: COLORS.text, fontSize: 16, marginBottom: 16 }}>המשתמש לא נמצא במערכת.</p>
          <button onClick={handleLogout} style={{ background: COLORS.primary, color: 'white', border: 'none', padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            חזור לכניסה
          </button>
        </div>
      </div>
    );
  }

  // מחובר — הצג את האפליקציה המתאימה
  return (
    <div style={{ position: 'relative' }}>
      {userRole === 'coach' ? <CoachApp /> : <ClientApp />}
      <button onClick={handleLogout}
        style={{ position: 'fixed', top: 10, left: 10, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', padding: '6px 14px', borderRadius: 999, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', zIndex: 999 }}>
        התנתק
      </button>
    </div>
  );
}

/* ══════════════════════════════════════
   עמוד כניסה — לקוחה
══════════════════════════════════════ */
function ClientLogin({ onCoachLogin }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) { setError('יש למלא את כל השדות'); return; }
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) setError('אימייל או סיסמה שגויים');
    setLoading(false);
  };

  return (
    <div style={{ direction: 'rtl', fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif', background: `linear-gradient(135deg, ${COLORS.bg} 0%, #DDEEDE 100%)`, minHeight: '100vh', display: 'flex', flexDirection: 'column', color: COLORS.text }}>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/logo.png" alt="Sappir Barak" style={{ width: 140, height: 140, objectFit: 'contain', margin: '0 auto', display: 'block' }} />
        </div>

        <div style={{ width: '100%', maxWidth: 340, background: 'white', borderRadius: 20, padding: '28px 24px', border: `1px solid ${COLORS.border}`, boxShadow: '0 4px 16px rgba(183,148,212,0.15)' }}>
          <p style={{ fontSize: 15, color: COLORS.textMuted, margin: '0 0 20px', textAlign: 'center' }}>הכניסי פרטי התחברות</p>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, display: 'block', marginBottom: 6 }}>אימייל</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="example@email.com" style={S.inp}
              onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          </div>

          <div style={{ marginBottom: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, display: 'block', marginBottom: 6 }}>סיסמה</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" style={S.inp}
              onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          </div>

          <div style={{ textAlign: 'left', marginBottom: 16 }}>
            <button style={{ background: 'transparent', border: 'none', color: COLORS.primary, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>שכחתי סיסמה</button>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, cursor: 'pointer' }}>
            <div onClick={() => setRemember(r => !r)}
              style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${remember ? COLORS.primary : COLORS.border}`, background: remember ? COLORS.primary : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', transition: 'all 0.15s' }}>
              {remember && <span style={{ color: 'white', fontSize: 11, fontWeight: 700, lineHeight: 1 }}>✓</span>}
            </div>
            <span style={{ fontSize: 13, color: COLORS.textMuted, userSelect: 'none' }}>זכור אותי</span>
          </label>

          {error && <p style={{ fontSize: 12, color: '#C44', margin: '0 0 12px', textAlign: 'center', fontWeight: 600 }}>{error}</p>}

          <button onClick={handleLogin} disabled={loading}
            style={{ width: '100%', background: COLORS.primary, color: 'white', border: 'none', padding: 14, borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1, boxShadow: '0 4px 12px rgba(183,148,212,0.35)' }}>
            {loading ? 'נכנסת...' : 'כניסה'}
          </button>
        </div>
      </main>

      <footer style={{ padding: 20, textAlign: 'center', borderTop: `1px solid ${COLORS.border}` }}>
        <button onClick={onCoachLogin} style={{ background: 'transparent', border: 'none', color: COLORS.textMuted, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', padding: '8px 16px' }}>
          כניסת מאמנת →
        </button>
      </footer>
    </div>
  );
}

/* ══════════════════════════════════════
   עמוד כניסה — מאמנת
══════════════════════════════════════ */
function CoachLogin({ onBack }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) { setError('יש למלא את כל השדות'); return; }
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) setError('אימייל או סיסמה שגויים');
    setLoading(false);
  };

  return (
    <div style={{ direction: 'rtl', fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif', background: `linear-gradient(135deg, #2D3E33 0%, #1a2a1f 100%)`, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, color: 'white' }}>
      <button onClick={onBack} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 999, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>← חזרה</button>

      <img src="/logo.png" alt="Sappir Barak" style={{ width: 100, marginBottom: 24, filter: 'brightness(1.2)' }} />
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 24px', color: COLORS.primary }}>כניסת מאמנת</h1>

      <div style={{ width: '100%', maxWidth: 340, background: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: '28px 24px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 6 }}>אימייל</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="sappir@example.com"
            style={{ ...S.inp, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 6 }}>סיסמה</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{ ...S.inp, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, cursor: 'pointer' }}>
          <div onClick={() => setRemember(r => !r)}
            style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${remember ? COLORS.primary : 'rgba(255,255,255,0.3)'}`, background: remember ? COLORS.primary : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
            {remember && <span style={{ color: 'white', fontSize: 11, fontWeight: 700, lineHeight: 1 }}>✓</span>}
          </div>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', userSelect: 'none' }}>זכור אותי</span>
        </label>

        {error && <p style={{ fontSize: 12, color: '#ff8080', margin: '0 0 12px', textAlign: 'center', fontWeight: 600 }}>{error}</p>}

        <button onClick={handleLogin} disabled={loading}
          style={{ width: '100%', background: COLORS.primary, color: 'white', border: 'none', padding: 14, borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'נכנסת...' : 'כניסה לניהול'}
        </button>
      </div>
    </div>
  );
}
