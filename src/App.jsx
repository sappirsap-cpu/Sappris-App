import React, { useState, useEffect, lazy, Suspense } from 'react';
import { supabase } from './supabase';
import { ThemeProvider } from './theme';
import { OfflineProvider, NetworkBanner, registerServiceWorker } from './offline';

// רישום Service Worker — פעם אחת
registerServiceWorker();

// ═══════════════════════════════════════════════════════════════
// ⚡ CODE SPLITTING — CoachApp ו-ClientApp נטענות רק כשצריך
// מוריד את bundle הראשוני בכ-60-70%
// ═══════════════════════════════════════════════════════════════
const CoachApp  = lazy(() => import('./coach_app'));
const ClientApp = lazy(() => import('./client_app'));

// Fallback — מסך טעינה בזמן שהקובץ מגיע מהרשת
function AppLoadingFallback() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1F4335 0%, #2D5F4C 100%)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 100, height: 100, margin: '0 auto 20px',
          background: 'white', borderRadius: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}>
          <img src="/logo.png" alt="" style={{ width: 72, objectFit: 'contain' }} />
        </div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: 7, height: 7, borderRadius: '50%', background: 'white',
              animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
        <style>{`
          @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-8px)} }
        `}</style>
      </div>
    </div>
  );
}

const COLORS = {
  bg: '#FDFCFA', primary: '#2D5F4C', primaryDark: '#1F4335',
  primarySoft: '#E8F2ED', accent: '#E8784F', accentDark: '#C85F3A',
  text: '#1A1713', textMuted: '#6B6560', border: '#E6E2DD',
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

  // 🔧 Cache role בlocalStorage כדי לא להיכנס למצב "loading" בכל reload
  const cachedRoleKey = 'sappir-cached-role';
  const cachedUserIdKey = 'sappir-cached-user-id';

  const getCachedRole = (userId) => {
    try {
      const cachedId = localStorage.getItem(cachedUserIdKey);
      if (cachedId === userId) {
        return localStorage.getItem(cachedRoleKey);
      }
    } catch { /* silent */ }
    return null;
  };

  const setCachedRole = (userId, role) => {
    try {
      localStorage.setItem(cachedUserIdKey, userId);
      localStorage.setItem(cachedRoleKey, role || '');
    } catch { /* silent */ }
  };

  const clearCachedRole = () => {
    try {
      localStorage.removeItem(cachedUserIdKey);
      localStorage.removeItem(cachedRoleKey);
    } catch { /* silent */ }
  };

  useEffect(() => {
    let mounted = true;
    let initDone = false;

    const init = async () => {
      try {
        setDebugInfo('בודק session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) console.error('Session error:', error);
        if (!mounted) return;
        setSession(session);
        if (session) {
          setDebugInfo(`נמצא משתמש: ${session.user.email}`);
          // 🚀 השתמש ב-cache קודם — חוויית טעינה מיידית
          const cached = getCachedRole(session.user.id);
          if (cached === 'coach' || cached === 'client') {
            setUserRole(cached);
            // טען רענון ברקע כדי לוודא שהוא עדיין נכון
            detectRole(session.user.id, true);
          } else {
            await detectRole(session.user.id);
          }
        } else {
          setDebugInfo('אין session');
          setUserRole(null);
          clearCachedRole();
        }
        initDone = true;
      } catch (e) {
        console.error('Init error:', e);
        if (mounted) {
          // 🛡️ אם init נכשל אבל יש cache — אל תוציא את המשתמש
          const cached = localStorage.getItem(cachedRoleKey);
          if (!cached) {
            setSession(null);
            setUserRole(null);
          }
        }
        initDone = true;
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      // התעלם מ-INITIAL_SESSION — init כבר טיפל
      if (event === 'INITIAL_SESSION') return;
      // TOKEN_REFRESHED — רק עדכון session, לא לטעון תפקיד מחדש
      if (event === 'TOKEN_REFRESHED') { setSession(newSession); return; }
      if (event === 'USER_UPDATED') { setSession(newSession); return; }
      if (event === 'SIGNED_IN' && newSession) {
        // אם זה אותו user שכבר זוהה, אל תעשה כלום (מונע race condition)
        if (initDone && session?.user?.id === newSession.user.id && userRole) {
          setSession(newSession);
          return;
        }
        setSession(newSession);
        const cached = getCachedRole(newSession.user.id);
        if (cached === 'coach' || cached === 'client') {
          setUserRole(cached);
          detectRole(newSession.user.id, true);
        } else {
          setUserRole(undefined);
          await detectRole(newSession.user.id);
        }
        return;
      }
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUserRole(null);
        clearCachedRole();
        return;
      }
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  // backgroundOnly=true → רץ ברקע, לא משנה state אם המידע עדיין תואם
  const detectRole = async (userId, backgroundOnly = false) => {
    try {
      if (!backgroundOnly) setDebugInfo('בודק תפקיד...');

      // בדוק כל טבלה בנפרד — אם אחת נכשלת בגלל RLS, השנייה עדיין תעבוד
      let isCoach = false;
      let isClient = false;

      try {
        const { data: coaches } = await supabase.from('coaches').select('id').eq('id', userId).limit(1);
        if (coaches && coaches.length > 0) isCoach = true;
      } catch (e) {
        console.warn('coaches check failed:', e);
      }

      try {
        const { data: clients } = await supabase.from('clients').select('id').eq('id', userId).limit(1);
        if (clients && clients.length > 0) isClient = true;
      } catch (e) {
        console.warn('clients check failed:', e);
      }

      let role = null;
      if (isCoach) role = 'coach';
      else if (isClient) role = 'client';

      if (role) {
        if (!backgroundOnly) setDebugInfo(role === 'coach' ? 'נמצאה מאמנת ✓' : 'נמצאה לקוחה ✓');
        setUserRole(role);
        setCachedRole(userId, role);
      } else {
        // לא מצאנו - בדוק cache לפני שמתנתק
        if (backgroundOnly) return;

        const cached = getCachedRole(userId);
        if (cached === 'coach' || cached === 'client') {
          setUserRole(cached);
          setDebugInfo('עובדת ממטמון');
          return;
        }

        if (!backgroundOnly) setDebugInfo('משתמש לא נמצא בטבלאות');
        setUserRole(null);
      }
    } catch (e) {
      console.error('detectRole failed:', e);
      if (backgroundOnly) return;
      const cached = getCachedRole(userId);
      if (cached === 'coach' || cached === 'client') {
        setUserRole(cached);
        setDebugInfo('עובדת במצב לא מקוון');
        return;
      }
      setDebugInfo('שגיאה: ' + e.message);
      setUserRole(null);
    }
  };

  const handleLogout = async () => {
    clearCachedRole();
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
    <ThemeProvider>
      <OfflineProvider>
        <div style={{ position: 'relative' }}>
          <NetworkBanner />
          <Suspense fallback={<AppLoadingFallback />}>
            {userRole === 'coach' ? <CoachApp onLogout={handleLogout} /> : <ClientApp onLogout={handleLogout} />}
          </Suspense>
        </div>
      </OfflineProvider>
    </ThemeProvider>
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
      let msg = error.message;
      if (msg === 'Invalid login credentials') {
        msg = 'אימייל או סיסמה שגויים';
      } else if (msg.includes('Email not confirmed')) {
        msg = 'האימייל עדיין לא אומת. בדקי בתיבת הדואר.';
      }
      setError(msg);
      setLoading(false);
      return;
    }
    if (data?.user) {
      // בדוק אם המשתמש הוא מאמנת
      const { data: coaches } = await supabase.from('coaches').select('id').eq('id', data.user.id).limit(1);
      if (coaches && coaches.length > 0) {
        await supabase.auth.signOut();
        setError('משתמש זה הוא מאמנת. אנא השתמשי במסך כניסת מאמנת.');
        setLoading(false);
        return;
      }

      // וודא שהמתאמנת קיימת בטבלת clients
      const { data: client } = await supabase.from('clients').select('id, is_archived').eq('id', data.user.id).limit(1);
      if (!client || client.length === 0) {
        await supabase.auth.signOut();
        setError('החשבון שלך לא נמצא במערכת. פני למאמנת.');
        setLoading(false);
        return;
      }
      if (client[0].is_archived) {
        await supabase.auth.signOut();
        setError('החשבון שלך הועבר לארכיון. פני למאמנת.');
        setLoading(false);
        return;
      }
      // הכל תקין — onAuthStateChange של App יזהה ויטען
    }
  };

  return (
    <div data-theme="dark" style={{
      minHeight: '100vh', position: 'relative', overflow: 'hidden',
      direction: 'rtl', fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
      background: '#000',
    }}>
      {/* Animated background blobs */}
      <div style={{
        position: 'absolute', top: -120, right: -80,
        width: 320, height: 320, borderRadius: '50%',
        background: 'linear-gradient(135deg, #2D5F4C, #4A9B76)',
        filter: 'blur(70px)', opacity: 0.7,
        animation: 'sappirisBlob1 15s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -100, left: -100,
        width: 380, height: 380, borderRadius: '50%',
        background: 'linear-gradient(135deg, #4A9B76, #7DD3A8)',
        filter: 'blur(70px)', opacity: 0.6,
        animation: 'sappirisBlob2 18s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: '40%', left: '20%',
        width: 220, height: 220, borderRadius: '50%',
        background: 'linear-gradient(135deg, #E8784F, #F5956F)',
        filter: 'blur(70px)', opacity: 0.4,
        animation: 'sappirisBlob1 12s ease-in-out infinite reverse',
        pointerEvents: 'none',
      }} />

      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        pointerEvents: 'none',
      }} />

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.5) 100%)',
        pointerEvents: 'none',
      }} />

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 2, minHeight: '100vh',
        display: 'flex', flexDirection: 'column', padding: '50px 28px 32px',
        maxWidth: 420, margin: '0 auto',
      }}>

        {/* Live status pill */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '0.5px solid rgba(255,255,255,0.12)',
          padding: '7px 14px', borderRadius: 100,
          alignSelf: 'flex-end', marginBottom: 32,
          animation: 'sappirisLoginSlideRight 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s backwards',
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#4ADE80', boxShadow: '0 0 10px #4ADE80',
            animation: 'sappirisLoginPulse 2s ease-in-out infinite',
          }} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>מאמנת אישית בהישג יד</span>
        </div>

        {/* Logo + Brand */}
        <div style={{
          textAlign: 'center', marginBottom: 36,
          animation: 'sappirisLoginSlideUp 0.7s cubic-bezier(0.4, 0, 0.2, 1) backwards',
        }}>
          <div style={{
            display: 'inline-block', position: 'relative', marginBottom: 24,
            animation: 'sappirisLoginFloat 4s ease-in-out infinite',
          }}>
            <div style={{
              position: 'absolute', inset: -6,
              background: 'linear-gradient(135deg, #4A9B76, #7DD3A8, #E8784F)',
              borderRadius: 32, filter: 'blur(12px)', opacity: 0.7, zIndex: -1,
            }} />
            <div style={{
              width: 110, height: 110, borderRadius: 28,
              background: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 8px 32px rgba(0,0,0,0.4)',
              padding: 12,
            }}>
              <img src="/logo.png" alt="Sappir Barak" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
          </div>

          <h1 style={{
            margin: 0, fontSize: 42, fontWeight: 800, color: 'white',
            letterSpacing: '-0.04em', lineHeight: 1,
            background: 'linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.7) 100%)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>Sappir Fitness</h1>
          <p style={{
            margin: '12px 0 0', fontSize: 14,
            color: 'rgba(255,255,255,0.6)', fontWeight: 500,
          }}>הדרך שלך לכושר ובריאות</p>
        </div>

        {/* Glass Login Card */}
        <div style={{
          background: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 28,
          padding: '28px 24px',
          marginBottom: 16,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
          animation: 'sappirisLoginSlideUp 0.7s cubic-bezier(0.4, 0, 0.2, 1) 0.2s backwards',
        }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
            <div style={{
              width: 4, height: 20,
              background: 'linear-gradient(180deg, #4A9B76, #7DD3A8)',
              borderRadius: 4,
            }} />
            <h2 style={{
              margin: 0, fontSize: 22, fontWeight: 700, color: 'white',
              letterSpacing: '-0.02em',
            }}>ברוכה השבה</h2>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div>
              <label style={{
                display: 'block', fontSize: 11, fontWeight: 600,
                color: 'rgba(255,255,255,0.7)', marginBottom: 8,
                letterSpacing: '0.05em', textTransform: 'uppercase',
              }}>אימייל</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="sappris-login-input"
                  disabled={loading}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 16,
                    padding: '16px 50px 16px 18px',
                    color: 'white', fontSize: 15,
                    fontFamily: 'inherit', outline: 'none',
                    direction: 'ltr', textAlign: 'right',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxSizing: 'border-box',
                  }}
                />
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', right: 18, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.5 }}>
                  <rect width="20" height="16" x="2" y="4" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
              </div>
            </div>

            <div>
              <label style={{
                display: 'block', fontSize: 11, fontWeight: 600,
                color: 'rgba(255,255,255,0.7)', marginBottom: 8,
                letterSpacing: '0.05em', textTransform: 'uppercase',
              }}>סיסמה</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="sappris-login-input"
                  disabled={loading}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 16,
                    padding: '16px 50px 16px 18px',
                    color: 'white', fontSize: 15,
                    fontFamily: 'inherit', outline: 'none',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxSizing: 'border-box',
                  }}
                />
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', right: 18, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.5 }}>
                  <rect width="18" height="11" x="3" y="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
            </div>

            {error && (
              <div style={{
                background: 'rgba(220, 38, 38, 0.15)',
                border: '1px solid rgba(220, 38, 38, 0.3)',
                borderRadius: 12, padding: 12, fontSize: 12,
                color: '#FCA5A5', backdropFilter: 'blur(10px)',
              }}>{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="sappris-login-btn-primary"
              style={{
                width: '100%', marginTop: 8,
                padding: 16, border: 'none', borderRadius: 16,
                background: loading ? 'rgba(74, 155, 118, 0.5)' : 'linear-gradient(135deg, #4A9B76 0%, #2D5F4C 100%)',
                color: 'white', fontSize: 15, fontWeight: 700,
                cursor: loading ? 'default' : 'pointer',
                fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                position: 'relative', overflow: 'hidden',
                boxShadow: '0 0 30px rgba(74,155,118,0.4), 0 8px 24px rgba(45,95,76,0.3)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <span>{loading ? 'מתחברת...' : 'כניסה'}</span>
              {!loading && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6l-6 6 6 6"/>
                  <path d="M3 12h18"/>
                </svg>
              )}
            </button>
          </form>
        </div>

        {/* Coach login button */}
        <button
          onClick={onCoachLogin}
          className="sappris-login-btn-secondary"
          style={{
            width: '100%', padding: 14, borderRadius: 16,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'white', fontSize: 13, fontWeight: 600,
            fontFamily: 'inherit',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            animation: 'sappirisLoginSlideUp 0.7s cubic-bezier(0.4, 0, 0.2, 1) 0.3s backwards',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
            <circle cx="12" cy="8" r="5"/>
            <path d="M20 21a8 8 0 0 0-16 0"/>
          </svg>
          <span>כניסת מאמנת</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
            <path d="M9 6l-6 6 6 6"/>
          </svg>
        </button>

      </div>

      <style>{`
        @keyframes sappirisBlob1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(40px, -60px) scale(1.1); }
          66% { transform: translate(-30px, 40px) scale(0.9); }
        }
        @keyframes sappirisBlob2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-50px, 50px) scale(1.15); }
        }
        @keyframes sappirisLoginSlideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes sappirisLoginSlideRight {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes sappirisLoginFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes sappirisLoginPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
        @keyframes sappirisLoginGlow {
          0%, 100% { box-shadow: 0 0 30px rgba(74,155,118,0.4), 0 8px 24px rgba(45,95,76,0.3); }
          50% { box-shadow: 0 0 50px rgba(74,155,118,0.6), 0 8px 24px rgba(45,95,76,0.4); }
        }
        @keyframes sappirisLoginShimmer {
          0% { left: -100%; }
          100% { left: 200%; }
        }

        .sappris-login-input:focus {
          background: rgba(255,255,255,0.08) !important;
          border-color: rgba(74,155,118,0.6) !important;
          box-shadow: 0 0 0 4px rgba(74,155,118,0.15) !important;
        }
        .sappris-login-input::placeholder {
          color: rgba(255,255,255,0.35);
        }

        .sappris-login-btn-primary {
          animation: sappirisLoginGlow 3s ease-in-out infinite;
        }
        .sappris-login-btn-primary::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          animation: sappirisLoginShimmer 3s ease-in-out infinite;
        }
        .sappris-login-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
        }
        .sappris-login-btn-primary:active:not(:disabled) {
          transform: translateY(0);
        }

        .sappris-login-btn-secondary:hover {
          background: rgba(255,255,255,0.1) !important;
          border-color: rgba(255,255,255,0.25) !important;
          transform: translateY(-1px);
        }
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
      // נסה לוודא שזו מאמנת — אם הקריאה נכשלת מסיבה כלשהי, אל תחסום
      try {
        const { data: coaches, error: cErr } = await supabase
          .from('coaches')
          .select('id')
          .eq('id', data.user.id)
          .limit(1);

        if (!cErr && coaches !== null && coaches.length === 0) {
          await supabase.auth.signOut();
          setError('אין לך הרשאת מאמנת. אנא השתמשי במסך כניסת מתאמנת.');
          setLoading(false);
          return;
        }
      } catch (e) {
        console.warn('Coach check failed (allowing login):', e);
      }
      // הכל תקין — onAuthStateChange של App יזהה ויטען
    }
  };

  return (
    <div data-theme="dark" style={{
      minHeight: '100vh', position: 'relative', overflow: 'hidden',
      direction: 'rtl', fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
      background: '#000',
    }}>
      {/* Animated background blobs */}
      <div style={{
        position: 'absolute', top: -120, right: -80,
        width: 320, height: 320, borderRadius: '50%',
        background: 'linear-gradient(135deg, #2D5F4C, #4A9B76)',
        filter: 'blur(70px)', opacity: 0.7,
        animation: 'sappirisBlob1 15s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -100, left: -100,
        width: 380, height: 380, borderRadius: '50%',
        background: 'linear-gradient(135deg, #4A9B76, #7DD3A8)',
        filter: 'blur(70px)', opacity: 0.6,
        animation: 'sappirisBlob2 18s ease-in-out infinite',
        pointerEvents: 'none',
      }} />

      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        pointerEvents: 'none',
      }} />

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.5) 100%)',
        pointerEvents: 'none',
      }} />

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 2, minHeight: '100vh',
        display: 'flex', flexDirection: 'column', padding: '50px 28px 32px',
        maxWidth: 420, margin: '0 auto',
      }}>

        {/* Coach pill */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(232, 120, 79, 0.15)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '0.5px solid rgba(232, 120, 79, 0.3)',
          padding: '7px 14px', borderRadius: 100,
          alignSelf: 'flex-end', marginBottom: 32,
          animation: 'sappirisLoginSlideRight 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s backwards',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E8784F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="5"/>
            <path d="M20 21a8 8 0 0 0-16 0"/>
          </svg>
          <span style={{ fontSize: 11, color: '#FFA47A', fontWeight: 600 }}>מסך מאמנת</span>
        </div>

        {/* Logo + Brand */}
        <div style={{
          textAlign: 'center', marginBottom: 36,
          animation: 'sappirisLoginSlideUp 0.7s cubic-bezier(0.4, 0, 0.2, 1) backwards',
        }}>
          <div style={{
            display: 'inline-block', position: 'relative', marginBottom: 24,
            animation: 'sappirisLoginFloat 4s ease-in-out infinite',
          }}>
            <div style={{
              position: 'absolute', inset: -6,
              background: 'linear-gradient(135deg, #4A9B76, #7DD3A8, #E8784F)',
              borderRadius: 32, filter: 'blur(12px)', opacity: 0.7, zIndex: -1,
            }} />
            <div style={{
              width: 110, height: 110, borderRadius: 28,
              background: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 8px 32px rgba(0,0,0,0.4)',
              padding: 12,
            }}>
              <img src="/logo.png" alt="Sappir Barak" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
          </div>

          <h1 style={{
            margin: 0, fontSize: 42, fontWeight: 800, color: 'white',
            letterSpacing: '-0.04em', lineHeight: 1,
            background: 'linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.7) 100%)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>Sappir Fitness</h1>
          <p style={{
            margin: '12px 0 0', fontSize: 14,
            color: 'rgba(255,255,255,0.6)', fontWeight: 500,
          }}>ברוכה הבאה ספיר 💚</p>
        </div>

        {/* Glass Login Card */}
        <div style={{
          background: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 28,
          padding: '28px 24px',
          marginBottom: 16,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
          animation: 'sappirisLoginSlideUp 0.7s cubic-bezier(0.4, 0, 0.2, 1) 0.2s backwards',
        }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
            <div style={{
              width: 4, height: 20,
              background: 'linear-gradient(180deg, #4A9B76, #7DD3A8)',
              borderRadius: 4,
            }} />
            <h2 style={{
              margin: 0, fontSize: 22, fontWeight: 700, color: 'white',
              letterSpacing: '-0.02em',
            }}>כניסת מאמנת</h2>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div>
              <label style={{
                display: 'block', fontSize: 11, fontWeight: 600,
                color: 'rgba(255,255,255,0.7)', marginBottom: 8,
                letterSpacing: '0.05em', textTransform: 'uppercase',
              }}>אימייל</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sappirsap@gmail.com"
                  className="sappris-login-input"
                  disabled={loading}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 16,
                    padding: '16px 50px 16px 18px',
                    color: 'white', fontSize: 15,
                    fontFamily: 'inherit', outline: 'none',
                    direction: 'ltr', textAlign: 'right',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxSizing: 'border-box',
                  }}
                />
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', right: 18, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.5 }}>
                  <rect width="20" height="16" x="2" y="4" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
              </div>
            </div>

            <div>
              <label style={{
                display: 'block', fontSize: 11, fontWeight: 600,
                color: 'rgba(255,255,255,0.7)', marginBottom: 8,
                letterSpacing: '0.05em', textTransform: 'uppercase',
              }}>סיסמה</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="sappris-login-input"
                  disabled={loading}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 16,
                    padding: '16px 50px 16px 18px',
                    color: 'white', fontSize: 15,
                    fontFamily: 'inherit', outline: 'none',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxSizing: 'border-box',
                  }}
                />
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', right: 18, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.5 }}>
                  <rect width="18" height="11" x="3" y="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
            </div>

            {error && (
              <div style={{
                background: 'rgba(220, 38, 38, 0.15)',
                border: '1px solid rgba(220, 38, 38, 0.3)',
                borderRadius: 12, padding: 12, fontSize: 12,
                color: '#FCA5A5', backdropFilter: 'blur(10px)',
              }}>{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="sappris-login-btn-primary"
              style={{
                width: '100%', marginTop: 8,
                padding: 16, border: 'none', borderRadius: 16,
                background: loading ? 'rgba(74, 155, 118, 0.5)' : 'linear-gradient(135deg, #4A9B76 0%, #2D5F4C 100%)',
                color: 'white', fontSize: 15, fontWeight: 700,
                cursor: loading ? 'default' : 'pointer',
                fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                position: 'relative', overflow: 'hidden',
                boxShadow: '0 0 30px rgba(74,155,118,0.4), 0 8px 24px rgba(45,95,76,0.3)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <span>{loading ? 'מתחברת...' : 'כניסה'}</span>
              {!loading && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6l-6 6 6 6"/>
                  <path d="M3 12h18"/>
                </svg>
              )}
            </button>
          </form>
        </div>

        {/* Back button */}
        <button
          onClick={onBack}
          className="sappris-login-btn-secondary"
          style={{
            width: '100%', padding: 14, borderRadius: 16,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'white', fontSize: 13, fontWeight: 600,
            fontFamily: 'inherit',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            animation: 'sappirisLoginSlideUp 0.7s cubic-bezier(0.4, 0, 0.2, 1) 0.3s backwards',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
            <path d="M15 6l6 6-6 6"/>
          </svg>
          <span>חזרה לכניסת מתאמנת</span>
        </button>

      </div>
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
