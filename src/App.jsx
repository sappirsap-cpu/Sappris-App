import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import CoachApp from './coach_app';
import ClientApp from './client_app';

const COLORS = {
  bg: '#F5F2FA', primary: '#B19CD9', primaryDark: '#8B72B5',
  primarySoft: '#E8DFF5', accent: '#F4C2C2', accentDark: '#C88A8A',
  text: '#2E2A3D', textMuted: '#756B85', border: '#DDD0EB',
};

/* ═══════════════════════════════════════════════════════════
   תמונות רקע בסגנון Zepp — נשים פועלות, ספורט, אימון
   המקור: Unsplash (חינם, ללא credit)
═══════════════════════════════════════════════════════════ */
const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&q=80',
  'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=1200&q=80',
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=80',
  'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=1200&q=80',
];

export default function App() {
  const [session, setSession]   = useState(undefined);
  const [userRole, setUserRole] = useState(undefined);
  const [screen, setScreen]     = useState('client');
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        setDebugInfo('בודק session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) console.error('Session error:', error);
        if (!mounted) return;
        setSession(session);
        if (session) {
          setDebugInfo(`נמצא משתמש: ${session.user.email}`);
          await detectRole(session.user.id);
        } else {
          setDebugInfo('אין session');
          setUserRole(null);
        }
      } catch (e) {
        console.error('Init error:', e);
        if (mounted) { setSession(null); setUserRole(null); }
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      if (event === 'INITIAL_SESSION') return;
      if (event === 'TOKEN_REFRESHED') { setSession(newSession); return; }
      if (event === 'SIGNED_IN' && newSession) {
        setSession(newSession);
        setUserRole(undefined);
        await detectRole(newSession.user.id);
        return;
      }
      if (event === 'SIGNED_OUT') { setSession(null); setUserRole(null); return; }
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const detectRole = async (userId) => {
    try {
      setDebugInfo('בודק תפקיד...');
      const [coachRes, clientRes] = await Promise.all([
        supabase.from('coaches').select('id').eq('id', userId).limit(1),
        supabase.from('clients').select('id').eq('id', userId).limit(1),
      ]);
      const coaches = coachRes?.data || [];
      const clients = clientRes?.data || [];
      if (coaches.length > 0) { setDebugInfo('נמצאה מאמנת ✓'); setUserRole('coach'); return; }
      if (clients.length > 0) { setDebugInfo('נמצאה לקוחה ✓'); setUserRole('client'); return; }
      setDebugInfo('משתמש לא נמצא בטבלאות');
      setUserRole(null);
    } catch (e) {
      console.error('detectRole failed:', e);
      setDebugInfo('שגיאה: ' + e.message);
      setUserRole(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserRole(null);
    setScreen('client');
    setDebugInfo('');
  };

  // מסך טעינה
  if (session === undefined || (session && userRole === undefined)) {
    return <LoadingScreen debugInfo={debugInfo} />;
  }

  // לא מחובר
  if (!session) {
    if (screen === 'coach') return <CoachLogin onBack={() => setScreen('client')} />;
    return <ClientLogin onCoachLogin={() => setScreen('coach')} />;
  }

  // משתמש לא נמצא בטבלאות
  if (userRole === null) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLORS.bg, direction: 'rtl' }}>
        <div style={{ textAlign: 'center', padding: 20, maxWidth: 320 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <p style={{ color: COLORS.text, fontSize: 16, marginBottom: 8, fontWeight: 600 }}>המשתמש לא נמצא במערכת</p>
          {debugInfo && <p style={{ color: COLORS.textMuted, fontSize: 12, marginBottom: 16, background: COLORS.primarySoft, padding: 12, borderRadius: 8 }}>{debugInfo}</p>}
          <button onClick={handleLogout} style={{ background: COLORS.primary, color: 'white', border: 'none', padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}>
            חזור לכניסה
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {userRole === 'coach' ? <CoachApp onLogout={handleLogout} /> : <ClientApp onLogout={handleLogout} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   LOADING SCREEN — מסך טעינה מעוצב
═══════════════════════════════════════════════════════════ */
function LoadingScreen({ debugInfo }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `linear-gradient(135deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 100%)`,
      position: 'relative', overflow: 'hidden'
    }}>
      <div style={{ textAlign: 'center', animation: 'fadeInUp 0.6s ease-out' }}>
        <div style={{
          width: 140, height: 140, margin: '0 auto 24px',
          background: 'white', borderRadius: '32px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          <img src="/logo.png" alt="Sappir Barak" style={{ width: 100, height: 100, objectFit: 'contain' }} />
        </div>
        <div style={{ display: 'inline-flex', gap: 6, marginTop: 8 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%', background: 'white',
              animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite`
            }} />
          ))}
        </div>
        {debugInfo && <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 16 }}>{debugInfo}</p>}
      </div>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        @keyframes bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-10px); } }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CLIENT LOGIN — עיצוב בסגנון Zepp
═══════════════════════════════════════════════════════════ */
function ClientLogin({ onCoachLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);

  // החלפת תמונת רקע כל 5 שניות
  useEffect(() => {
    const t = setInterval(() => setImgIdx(i => (i + 1) % HERO_IMAGES.length), 5000);
    return () => clearInterval(t);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message === 'Invalid login credentials' ? 'אימייל או סיסמה שגויים' : error.message);
      setLoading(false);
      return;
    }
    if (data?.user) {
      const { data: coaches } = await supabase.from('coaches').select('id').eq('id', data.user.id).limit(1);
      if (coaches && coaches.length > 0) {
        await supabase.auth.signOut();
        setError('משתמש זה הוא מאמנת. אנא השתמשי במסך כניסת מאמנת.');
        setLoading(false);
        return;
      }
    }
  };

  return (
    <div style={{
      minHeight: '100vh', position: 'relative', overflow: 'hidden',
      direction: 'rtl', fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
    }}>
      {/* תמונות רקע מתחלפות */}
      {HERO_IMAGES.map((src, i) => (
        <div key={i} style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: i === imgIdx ? 1 : 0,
          transition: 'opacity 1.5s ease-in-out',
          filter: 'brightness(0.55)',
        }} />
      ))}

      {/* שכבת גוון סגול */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(135deg, rgba(139, 114, 181, 0.75) 0%, rgba(177, 156, 217, 0.55) 50%, rgba(46, 42, 61, 0.8) 100%)`,
      }} />

      {/* תוכן */}
      <div style={{
        position: 'relative', minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}>
        <div style={{ maxWidth: 380, width: '100%' }}>

          {/* לוגו */}
          <div style={{ textAlign: 'center', marginBottom: 32, animation: 'fadeInUp 0.8s ease-out' }}>
            <div style={{
              width: 100, height: 100, margin: '0 auto 16px',
              background: 'white', borderRadius: 24,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            }}>
              <img src="/logo.png" alt="Sappir Barak" style={{ width: 76, height: 76, objectFit: 'contain' }} />
            </div>
            <h1 style={{
              fontSize: 28, fontWeight: 800, color: 'white',
              margin: '0 0 6px', textShadow: '0 2px 8px rgba(0,0,0,0.3)',
              letterSpacing: '-0.5px',
            }}>
              Sappir Fit
            </h1>
            <p style={{
              fontSize: 15, color: 'rgba(255,255,255,0.95)',
              margin: 0, textShadow: '0 1px 4px rgba(0,0,0,0.3)',
              fontWeight: 500,
            }}>
              מוכנה להמשיך במסע? 💜
            </p>
          </div>

          {/* כרטיס Glass */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            borderRadius: 24,
            padding: 24,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            animation: 'fadeInUp 1s ease-out 0.2s both',
          }}>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                  אימייל
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  style={glassInput}
                  disabled={loading}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                  סיסמה
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={glassInput}
                  disabled={loading}
                />
              </div>

              {error && (
                <div style={{
                  background: 'rgba(232, 165, 165, 0.25)',
                  border: '1px solid rgba(232, 165, 165, 0.5)',
                  borderRadius: 10, padding: 10, fontSize: 12,
                  color: 'white', backdropFilter: 'blur(10px)',
                }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                width: '100%', marginTop: 6,
                background: loading ? 'rgba(255,255,255,0.3)' : 'white',
                color: loading ? 'rgba(255,255,255,0.7)' : COLORS.primaryDark,
                border: 'none', padding: 14, borderRadius: 12,
                fontSize: 15, fontWeight: 700,
                cursor: loading ? 'default' : 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                transition: 'transform 0.15s',
              }}
                onMouseDown={e => !loading && (e.currentTarget.style.transform = 'scale(0.98)')}
                onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {loading ? 'מתחברת...' : 'כניסה →'}
              </button>
            </form>
          </div>

          {/* קישור למאמנת */}
          <div style={{ marginTop: 20, textAlign: 'center', animation: 'fadeInUp 1.2s ease-out 0.4s both' }}>
            <button onClick={onCoachLogin} style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              padding: '10px 18px', borderRadius: 999,
            }}>
              כניסת מאמנת ←
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        input::placeholder { color: rgba(255,255,255,0.55); }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   COACH LOGIN — עיצוב מאמנת (יותר מינימלי, רקע סגול)
═══════════════════════════════════════════════════════════ */
function CoachLogin({ onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message === 'Invalid login credentials' ? 'אימייל או סיסמה שגויים' : error.message);
      setLoading(false);
      return;
    }
    if (data?.user) {
      const { data: coaches } = await supabase.from('coaches').select('id').eq('id', data.user.id).limit(1);
      if (!coaches || coaches.length === 0) {
        await supabase.auth.signOut();
        setError('אין לך הרשאת מאמנת. אנא השתמשי במסך כניסת מתאמנת.');
        setLoading(false);
        return;
      }
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 50%, #C5B3E0 100%)`,
      padding: 20, direction: 'rtl',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>

      {/* עיגולי רקע דקורטיביים */}
      <div style={{
        position: 'absolute', top: '-15%', right: '-15%',
        width: 350, height: 350, borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', left: '-10%',
        width: 280, height: 280, borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)',
      }} />

      <div style={{ maxWidth: 380, width: '100%', position: 'relative', animation: 'fadeInUp 0.7s ease-out' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 140, height: 140, margin: '0 auto 16px',
            background: 'white', borderRadius: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
          }}>
            <img src="/logo.png" alt="Sappir Barak" style={{ width: 110 }} />
          </div>
          <h1 style={{
            fontSize: 26, fontWeight: 800, color: 'white',
            margin: '0 0 6px', textShadow: '0 2px 6px rgba(0,0,0,0.2)',
          }}>
            כניסת מאמנת
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', margin: 0 }}>
            ברוכה הבאה ספיר 💜
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'white' }}>אימייל</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sappirsap@gmail.com"
              style={glassInput}
              disabled={loading}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'white' }}>סיסמה</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={glassInput}
              disabled={loading}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 10, padding: 10, fontSize: 12, color: 'white',
            }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', marginTop: 6,
            background: 'white',
            color: COLORS.primaryDark,
            border: 'none', padding: 14, borderRadius: 12,
            fontSize: 15, fontWeight: 700,
            cursor: loading ? 'default' : 'pointer',
            fontFamily: 'inherit',
            boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
            opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'מתחברת...' : 'כניסה'}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <button onClick={onBack} style={{
            background: 'transparent', border: 'none',
            color: 'white', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
            opacity: 0.9, textDecoration: 'underline',
          }}>
            ← חזרה לכניסת מתאמנת
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        input::placeholder { color: rgba(255,255,255,0.55); }
      `}</style>
    </div>
  );
}

/* סטייל משותף ל-inputs של Glass */
const glassInput = {
  width: '100%', padding: '14px 16px',
  background: 'rgba(255,255,255,0.15)',
  border: '1px solid rgba(255,255,255,0.25)',
  borderRadius: 12, fontSize: 14, outline: 'none',
  fontFamily: 'inherit', direction: 'ltr', textAlign: 'right',
  boxSizing: 'border-box',
  color: 'white',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};
