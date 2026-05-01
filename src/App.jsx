import React, { useState, useEffect, lazy, Suspense } from 'react';
import { supabase } from './supabase';
import { ThemeProvider } from './theme_modern'; // 🎨 Updated to modern theme
import { OfflineProvider, NetworkBanner, registerServiceWorker } from './offline';

// רישום Service Worker
registerServiceWorker();

// Code splitting
const CoachApp = lazy(() => import('./coach_app'));
const ClientApp = lazy(() => import('./client_app'));

// ═══════════════════════════════════════════════════════════════
// 🎨 Modern Loading Screen - Emil Kowalski inspired
// עקרונות:
// - אנימציות חלקות < 300ms
// - ease-out curves (לא bounce!)
// - פחות "זוהר", יותר אלגנטיות
// ═══════════════════════════════════════════════════════════════
function ModernLoadingFallback() {
  const [dots, setDots] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev + 1) % 4);
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #FDFCFA 0%, #F8F6F2 100%)',
        fontFamily: 'var(--font-body, system-ui)',
      }}
    >
      {/* Logo Container */}
      <div
        style={{
          width: 120,
          height: 120,
          margin: '0 auto 32px',
          background: 'white',
          borderRadius: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
          animation: 'fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <img
          src="/logo.png"
          alt="Sappir Fit"
          style={{
            width: 80,
            height: 80,
            objectFit: 'contain',
          }}
        />
      </div>

      {/* App Name */}
      <h1
        style={{
          margin: '0 0 8px',
          fontSize: 24,
          fontWeight: 700,
          color: '#1A1713',
          fontFamily: 'var(--font-display, system-ui)',
          letterSpacing: '-0.02em',
          animation: 'fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.1s both',
        }}
      >
        Sappir Fit
      </h1>

      {/* Tagline */}
      <p
        style={{
          margin: '0 0 40px',
          fontSize: 14,
          color: '#6B6560',
          fontFamily: 'var(--font-body, system-ui)',
          animation: 'fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both',
        }}
      >
        כושר ותזונה בדרך אליך{'.'.repeat(dots)}
      </p>

      {/* Modern Progress Bar */}
      <div
        style={{
          width: 200,
          height: 3,
          background: '#E6E2DD',
          borderRadius: 3,
          overflow: 'hidden',
          animation: 'fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.3s both',
        }}
      >
        <div
          style={{
            width: '40%',
            height: '100%',
            background: 'linear-gradient(90deg, #2D5F4C, #4A9B76)',
            borderRadius: 3,
            animation: 'shimmer 1.5s ease-in-out infinite',
          }}
        />
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(500%);
          }
        }

        /* Prevent motion for accessibility */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 🎨 Modern Colors - לא סגול! 
// ירוק יער (Forest Green) - מרגיע, אלגנטי, ייחודי
// ═══════════════════════════════════════════════════════════════
const COLORS = {
  bg: '#FDFCFA',
  bgAlt: '#F8F6F2',
  primary: '#2D5F4C',
  primaryDark: '#1F4335',
  primarySoft: '#E8F2ED',
  accent: '#E8784F',
  accentDark: '#C85F3A',
  text: '#1A1713',
  textMuted: '#6B6560',
  border: '#E6E2DD',
};

// ═══════════════════════════════════════════════════════════════
// Hero Images - נשארים אותו דבר (תמונות יפות!)
// ═══════════════════════════════════════════════════════════════
const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&q=80',
  'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=1200&q=80',
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=80',
  'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=1200&q=80',
];

export default function App() {
  const [session, setSession] = useState(undefined);
  const [userRole, setUserRole] = useState(undefined);
  const [screen, setScreen] = useState('client');
  const [debugInfo, setDebugInfo] = useState('');

  // Cache role
  const cachedRoleKey = 'sappir-cached-role';
  const cachedUserIdKey = 'sappir-cached-user-id';

  const getCachedRole = (userId) => {
    try {
      const cachedId = localStorage.getItem(cachedUserIdKey);
      if (cachedId === userId) {
        return localStorage.getItem(cachedRoleKey);
      }
    } catch {}
    return null;
  };

  const setCachedRole = (userId, role) => {
    try {
      localStorage.setItem(cachedUserIdKey, userId);
      localStorage.setItem(cachedRoleKey, role || '');
    } catch {}
  };

  const clearCachedRole = () => {
    try {
      localStorage.removeItem(cachedUserIdKey);
      localStorage.removeItem(cachedRoleKey);
    } catch {}
  };

  useEffect(() => {
    let mounted = true;

    async function initSession() {
      try {
        const {
          data: { session: sess },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (sess?.user) {
          setSession(sess);
          const cached = getCachedRole(sess.user.id);
          if (cached) {
            setUserRole(cached);
          }

          const { data, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', sess.user.id)
            .maybeSingle();

          if (!mounted) return;

          if (error) {
            console.error('Error fetching role:', error);
            setDebugInfo(`Error: ${error.message}`);
          } else if (data?.role) {
            const finalRole = data.role;
            setUserRole(finalRole);
            setCachedRole(sess.user.id, finalRole);
            if (finalRole === 'coach') setScreen('coach');
          } else {
            setUserRole('client');
            setCachedRole(sess.user.id, 'client');
          }
        } else {
          setSession(null);
          setUserRole(null);
          clearCachedRole();
        }
      } catch (err) {
        if (!mounted) return;
        console.error('Session init error:', err);
        setSession(null);
        setUserRole(null);
        setDebugInfo(`Init error: ${err.message || String(err)}`);
      }
    }

    initSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSess) => {
      if (!mounted) return;
      setSession(newSess);
      if (!newSess?.user) {
        setUserRole(null);
        clearCachedRole();
      }
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUserRole(null);
      clearCachedRole();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // ═══ עיצוב חדש למסך התחברות ═══
  if (session === null) {
    return (
      <ThemeProvider>
        <OfflineProvider>
          <NetworkBanner />
          <LoginScreen />
        </OfflineProvider>
      </ThemeProvider>
    );
  }

  if (session === undefined || userRole === undefined) {
    return (
      <ThemeProvider>
        <ModernLoadingFallback />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <OfflineProvider>
        <NetworkBanner />
        <Suspense fallback={<ModernLoadingFallback />}>
          {screen === 'coach' && userRole === 'coach' ? (
            <CoachApp
              session={session}
              onLogout={handleLogout}
              onSwitchToClient={() => setScreen('client')}
            />
          ) : (
            <ClientApp
              session={session}
              onLogout={handleLogout}
              role={userRole}
              onSwitchToCoach={userRole === 'coach' ? () => setScreen('coach') : undefined}
            />
          )}
        </Suspense>
      </OfflineProvider>
    </ThemeProvider>
  );
}

// ═══════════════════════════════════════════════════════════════
// 🎨 Modern Login Screen
// עיצוב חדש לגמרי - מודרני, אלגנטי, ללא סגולים
// ═══════════════════════════════════════════════════════════════
function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('login'); // 'login' | 'signup'

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('נרשמת בהצלחה! בדוק את המייל שלך לאימות.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err.message || 'שגיאה בהתחברות');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: 'linear-gradient(135deg, #FDFCFA 0%, #F8F6F2 100%)',
        fontFamily: 'var(--font-body, system-ui)',
      }}
    >
      {/* Right Side - Hero Image */}
      <div
        style={{
          flex: 1,
          background: `url(${HERO_IMAGES[0]}) center/cover`,
          position: 'relative',
          display: 'none', // Show on desktop
        }}
        className="hero-image"
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(45, 95, 76, 0.85) 0%, rgba(31, 67, 53, 0.9) 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: 60,
            color: 'white',
          }}
        >
          <h1
            style={{
              fontSize: 48,
              fontWeight: 800,
              margin: '0 0 16px',
              fontFamily: 'var(--font-display, system-ui)',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
            }}
          >
            הדרך שלך
            <br />
            לכושר מושלם
          </h1>
          <p
            style={{
              fontSize: 18,
              lineHeight: 1.6,
              opacity: 0.95,
              maxWidth: 400,
              margin: 0,
            }}
          >
            אימון אישי, תזונה מותאמת, ומעקב יומיומי שמביא תוצאות
          </p>
        </div>
      </div>

      {/* Left Side - Login Form */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 400,
            animation: 'fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div
              style={{
                width: 72,
                height: 72,
                background: 'white',
                borderRadius: 16,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                marginBottom: 16,
              }}
            >
              <img src="/logo.png" alt="Logo" style={{ width: 48, height: 48 }} />
            </div>
            <h2
              style={{
                margin: '0 0 8px',
                fontSize: 28,
                fontWeight: 700,
                color: COLORS.text,
                fontFamily: 'var(--font-display, system-ui)',
                letterSpacing: '-0.02em',
              }}
            >
              {mode === 'login' ? 'ברוכים השבים' : 'הצטרפות'}
            </h2>
            <p style={{ margin: 0, fontSize: 14, color: COLORS.textMuted }}>
              {mode === 'login' ? 'המשך את המסע שלך' : 'התחל את המסע שלך'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleAuth} style={{ marginBottom: 24 }}>
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  color: COLORS.text,
                }}
              >
                אימייל
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: 15,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 12,
                  background: 'white',
                  color: COLORS.text,
                  fontFamily: 'var(--font-body, system-ui)',
                  transition: 'all 0.2s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = COLORS.primary;
                  e.target.style.boxShadow = '0 0 0 3px rgba(45, 95, 76, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = COLORS.border;
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  color: COLORS.text,
                }}
              >
                סיסמה
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: 15,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 12,
                  background: 'white',
                  color: COLORS.text,
                  fontFamily: 'var(--font-body, system-ui)',
                  transition: 'all 0.2s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = COLORS.primary;
                  e.target.style.boxShadow = '0 0 0 3px rgba(45, 95, 76, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = COLORS.border;
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {error && (
              <div
                style={{
                  padding: 12,
                  background: '#FEE2E2',
                  border: '1px solid #FCA5A5',
                  borderRadius: 8,
                  color: '#DC2626',
                  fontSize: 13,
                  marginBottom: 16,
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '14px 24px',
                fontSize: 16,
                fontWeight: 600,
                color: 'white',
                background: COLORS.primary,
                border: 'none',
                borderRadius: 12,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-body, system-ui)',
                boxShadow: '0 2px 8px rgba(45, 95, 76, 0.2)',
                transition: 'all 0.2s',
                opacity: isLoading ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.target.style.background = COLORS.primaryDark;
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 16px rgba(45, 95, 76, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.background = COLORS.primary;
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 8px rgba(45, 95, 76, 0.2)';
              }}
            >
              {isLoading ? 'טוען...' : mode === 'login' ? 'התחבר' : 'הרשם'}
            </button>
          </form>

          {/* Toggle Mode */}
          <p style={{ textAlign: 'center', fontSize: 14, color: COLORS.textMuted }}>
            {mode === 'login' ? 'עדיין אין לך חשבון? ' : 'כבר יש לך חשבון? '}
            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              style={{
                background: 'none',
                border: 'none',
                color: COLORS.primary,
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: 0,
                fontFamily: 'var(--font-body, system-ui)',
              }}
            >
              {mode === 'login' ? 'הרשם עכשיו' : 'התחבר'}
            </button>
          </p>
        </div>
      </div>

      {/* Responsive Styles */}
      <style>{`
        @media (min-width: 768px) {
          .hero-image {
            display: block !important;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
