// ═══════════════════════════════════════════════════════════════
// src/supabase.js
// קובץ קונפיגורציה ל-Supabase עם פתרון לבעיית הניתוק
// ═══════════════════════════════════════════════════════════════
//
// 🔧 פתרונות שמיושמים כאן:
// 1. persistSession: true     — שומר session ב-localStorage
// 2. autoRefreshToken: true   — מרענן טוקן לפני שפג
// 3. detectSessionInUrl: true — תופס OAuth callbacks
// 4. storage: localStorage    — מבטיח עקביות (ב-PWA לפעמים window.localStorage לא נטען בזמן)
// 5. storageKey: 'sappir-auth' — מפתח קבוע, מונע התנגשויות
// 6. flowType: 'pkce'         — פלוס בטיחות לאחסון בדפדפן
//
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase env vars! Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Netlify env settings.');
}

// Wrapper בטוח ל-localStorage — מונע קריסה אם הוא לא זמין (iOS private mode)
const safeStorage = {
  getItem: (key) => {
    try { return globalThis.localStorage?.getItem(key) ?? null; }
    catch { return null; }
  },
  setItem: (key, value) => {
    try { globalThis.localStorage?.setItem(key, value); }
    catch (e) { console.warn('localStorage setItem failed:', e); }
  },
  removeItem: (key) => {
    try { globalThis.localStorage?.removeItem(key); }
    catch { /* silent */ }
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: safeStorage,
    storageKey: 'sappir-auth-v1',
    flowType: 'pkce',
  },
  global: {
    headers: {
      'X-Client-Info': 'sappir-fit-pwa',
    },
  },
});

// 🛡️ הגנה נוספת: כש-PWA חוזרת מ-background, רענני את ה-session
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible') {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // אם הטוקן עומד לפוג — רענן אותו עכשיו
          const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
          const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000;
          if (expiresAt < fiveMinutesFromNow) {
            await supabase.auth.refreshSession();
          }
        }
      } catch (e) { /* silent */ }
    }
  });

  // 🛡️ הגנה גם בחזרה מ-online אחרי offline
  window.addEventListener('online', async () => {
    try {
      await supabase.auth.refreshSession();
    } catch { /* silent */ }
  });
}
