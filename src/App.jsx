import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import CoachApp from './coach_app';
import ClientApp from './client_app';

const COLORS = {
  bg: '#F5F2FA', primary: '#B19CD9', primaryDark: '#8B72B5',
  primarySoft: '#E8DFF5', accent: '#F4C2C2', accentDark: '#C88A8A',
  text: '#2E2A3D', textMuted: '#756B85', border: '#DDD0EB',
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
        
        if (error) {
          console.error('Session error:', error);
        }
        
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
        if (mounted) {
          setSession(null);
          setUserRole(null);
        }
      }
    };
    
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      
      console.log('Auth event:', event);
      
      // התעלם מ-INITIAL_SESSION כי init כבר טיפל בזה
      if (event === 'INITIAL_SESSION') return;
      
      // TOKEN_REFRESHED - רק עדכן session, אל תעשה detectRole שוב
      if (event === 'TOKEN_REFRESHED') {
        setSession(newSession);
        return;
      }
      
      // SIGNED_IN - משתמש חדש נכנס
      if (event === 'SIGNED_IN' && newSession) {
        setSession(newSession);
        setUserRole(undefined);
        await detectRole(newSession.user.id);
        return;
      }
      
      // SIGNED_OUT - משתמש יצא
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUserRole(null);
        return;
      }
    });

    return () => { 
      mounted = false; 
      subscription.unsubscribe(); 
    };
  }, []);

  const detectRole = async (userId) => {
    try {
      setDebugInfo('בודק תפקיד...');
      
      // בדוק את שניהם במקביל - ללא Timeout!
      const [coachRes, clientRes] = await Promise.all([
        supabase.from('coaches').select('id').eq('id', userId).limit(1),
        supabase.from('clients').select('id').eq('id', userId).limit(1),
      ]);
      
      const coaches = coachRes?.data || [];
      const clients = clientRes?.data || [];
      
      if (coaches.length > 0) {
        setDebugInfo('נמצאה מאמנת ✓');
        setUserRole('coach');
        return;
      }
      
      if (clients.length > 0) {
        setDebugInfo('נמצאה לקוחה ✓');
        setUserRole('client');
        return;
      }

      console.warn('User not found in coaches or clients:', userId);
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

  // מסך טעינה משופר
  if (session === undefined || (session && userRole === undefined)) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: `linear-gradient(135deg, ${COLORS.bg} 0%, ${COLORS.primarySoft} 100%)`,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background decoration */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-20%',
          width: '100%',
          height: '100%',
          background: COLORS.primary,
          opacity: 0.03,
          borderRadius: '50%',
        }} />
        
        <div style={{ 
          textAlign: 'center', 
          position: 'relative',
          animation: 'fadeInUp 0.6s ease-out'
        }}>
          <div style={{
            width: 140,
            height: 140,
            margin: '0 auto 24px',
            background: 'white',
            borderRadius: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(123, 184, 146, 0.15)',
            animation: 'pulse 2s ease-in-out infinite'
          }}>
            <img src="/logo.png" alt="Sappir Barak" style={{ 
              width: 100, 
              height: 100,
              objectFit: 'contain'
            }} />
          </div>
          
          <div style={{
            display: 'inline-flex',
            gap: 6,
            marginTop: 8
          }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: COLORS.primary,
                animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite`
              }} />
            ))}
          </div>
          
          {debugInfo && (
            <p style={{ 
              color: COLORS.textMuted, 
              fontSize: 12, 
              marginTop: 16,
              opacity: 0.7
            }}>{debugInfo}</p>
          )}
        </div>

        <style>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.05);
            }
          }
          
          @keyframes bounce {
            0%, 60%, 100% {
              transform: translateY(0);
            }
            30% {
              transform: translateY(-10px);
            }
          }
        `}</style>
      </div>
    );
  }

  // לא מחובר — הצג עמוד כניסה
  if (!session) {
    if (screen === 'coach') return <CoachLogin onBack={() => setScreen('client')} />;
    return <ClientLogin onCoachLogin={() => setScreen('coach')} />;
  }

  // מחובר אבל תפקיד לא ידוע
  if (userRole === null) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLORS.bg, direction: 'rtl' }}>
        <div style={{ textAlign: 'center', padding: 20, maxWidth: 320 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <p style={{ color: COLORS.text, fontSize: 16, marginBottom: 8, fontWeight: 600 }}>המשתמש לא נמצא במערכת</p>
          {debugInfo && (
            <p style={{ color: COLORS.textMuted, fontSize: 12, marginBottom: 16, background: COLORS.primarySoft, padding: 12, borderRadius: 8 }}>
              {debugInfo}
            </p>
          )}
          <button onClick={handleLogout} style={{ 
            background: COLORS.primary, 
            color: 'white', 
            border: 'none', 
            padding: '12px 24px', 
            borderRadius: 12, 
            fontSize: 14, 
            fontWeight: 600, 
            cursor: 'pointer', 
            fontFamily: 'inherit',
            width: '100%'
          }}>
            חזור לכניסה
          </button>
        </div>
      </div>
    );
  }

  // מחובר — הצג את האפליקציה המתאימה
  return (
    <div style={{ position: 'relative' }}>
      {userRole === 'coach' ? <CoachApp onLogout={handleLogout} /> : <ClientApp onLogout={handleLogout} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CLIENT LOGIN
═══════════════════════════════════════════════════════════ */
function ClientLogin({ onCoachLogin }) {
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

    // בדוק אם המשתמש הוא באמת לקוחה ולא מאמנת
    if (data?.user) {
      const { data: coaches } = await supabase
        .from('coaches').select('id').eq('id', data.user.id).limit(1);
      
      if (coaches && coaches.length > 0) {
        // זה מאמנת שמנסה להתחבר במסך לקוחה - נתק
        await supabase.auth.signOut();
        setError('משתמש זה הוא מאמנת. אנא השתמשי במסך כניסת מאמנת.');
        setLoading(false);
        return;
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${COLORS.bg} 0%, white 100%)`, padding: '20px', direction: 'rtl' }}>
      <div style={{ maxWidth: '380px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img src="/logo.png" alt="Sappir Barak" style={{ width: '200px', marginBottom: '16px' }} />
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: COLORS.primaryDark, margin: '0 0 8px 0' }}>כניסת מתאמנת</h1>
          <p style={{ fontSize: '14px', color: COLORS.textMuted, margin: 0 }}>היי! מוכנה להמשיך במסע? 💚</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: COLORS.text }}>אימייל</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="wonder@sappir.app"
              style={S.inp}
              disabled={loading}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: COLORS.text }}>סיסמה</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={S.inp}
              disabled={loading}
            />
          </div>

          {error && (
            <div style={{ background: '#FADDDD', border: '1px solid #E8A5A5', borderRadius: '10px', padding: '12px', fontSize: '13px', color: '#C88A8A' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{ 
            width: '100%', 
            background: COLORS.primary, 
            color: 'white', 
            border: 'none', 
            padding: '14px', 
            borderRadius: '12px', 
            fontSize: '15px', 
            fontWeight: 600, 
            cursor: loading ? 'default' : 'pointer', 
            fontFamily: 'inherit',
            opacity: loading ? 0.6 : 1
          }}>
            {loading ? 'מתחברת...' : 'כניסה'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button onClick={onCoachLogin} style={{ background: 'transparent', border: 'none', color: COLORS.primary, fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>
            כניסת מאמנת ←
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   COACH LOGIN
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

    // בדוק אם המשתמש הוא באמת מאמנת ולא לקוחה
    if (data?.user) {
      const { data: coaches } = await supabase
        .from('coaches').select('id').eq('id', data.user.id).limit(1);
      
      if (!coaches || coaches.length === 0) {
        // זה לא מאמנת - נתק
        await supabase.auth.signOut();
        setError('אין לך הרשאת מאמנת. אנא השתמשי במסך כניסת מתאמנת.');
        setLoading(false);
        return;
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 100%)`, padding: '20px', direction: 'rtl' }}>
      <div style={{ maxWidth: '380px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '140px', height: '140px', margin: '0 auto 16px', background: 'white', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/logo.png" alt="Sappir Barak" style={{ width: '110px' }} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'white', margin: '0 0 8px 0' }}>כניסת מאמנת</h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', margin: 0 }}>ברוכה הבאה ספיר 💚</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'white' }}>אימייל</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sappirsap@gmail.com"
              style={S.inp}
              disabled={loading}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'white' }}>סיסמה</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={S.inp}
              disabled={loading}
            />
          </div>

          {error && (
            <div style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '10px', padding: '12px', fontSize: '13px', color: 'white' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{ 
            width: '100%', 
            background: 'white', 
            color: COLORS.primaryDark, 
            border: 'none', 
            padding: '14px', 
            borderRadius: '12px', 
            fontSize: '15px', 
            fontWeight: 600, 
            cursor: loading ? 'default' : 'pointer', 
            fontFamily: 'inherit',
            opacity: loading ? 0.7 : 1
          }}>
            {loading ? 'מתחברת...' : 'כניסה'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', opacity: 0.9 }}>
            ← חזרה לכניסת מתאמנת
          </button>
        </div>
      </div>
    </div>
  );
}
