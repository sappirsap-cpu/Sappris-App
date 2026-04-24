// ═══════════════════════════════════════════════════════════════
// src/notifications.jsx
// מערכת תזכורות מקומיות + הגדרות
// ═══════════════════════════════════════════════════════════════
// התזכורות רצות כ-Web Notifications כשהאפליקציה פתוחה/ברקע.
// אין צורך בשרת — רק service worker + setTimeout מסונכרן לשעון.
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

const COLORS = {
  primary: '#B19CD9', primaryDark: '#8B72B5', primarySoft: '#E8DFF5',
  text: '#2E2A3D', textMuted: '#756B85', border: '#DDD0EB',
  mint: '#C5B3E0', peach: '#F5D0B5', sky: '#A495C5',
};

/* ═══════════════════════════════════════════════════════════
   הגדרות התזכורות — אילו מופעלות ובאיזה שעה
═══════════════════════════════════════════════════════════ */

export const REMINDER_TYPES = {
  sleep: {
    id: 'sleep',
    icon: '😴',
    label: 'תזכורת שינה',
    desc: 'בבוקר — "כמה שעות ישנת הלילה?"',
    defaultTime: '09:00',
    body: 'בוקר טוב! 💜 כמה שעות ישנת הלילה?',
  },
  meal: {
    id: 'meal',
    icon: '🥗',
    label: 'תזכורת ארוחות',
    desc: 'צהריים — "לא שכחת לרשום את הארוחות?"',
    defaultTime: '14:00',
    body: 'שעת צהריים 🥗 רשמת את הארוחות של היום?',
  },
  water: {
    id: 'water',
    icon: '💧',
    label: 'תזכורת שתייה',
    desc: 'אחר הצהריים — רק אם לא הגעת ליעד',
    defaultTime: '16:00',
    body: 'רגע של הידרציה 💧 בואי נסגור את יעד השתייה!',
  },
  evening: {
    id: 'evening',
    icon: '🌙',
    label: 'סיכום יומי',
    desc: 'ערב — "איך היה היום? עדכני את הציון"',
    defaultTime: '20:00',
    body: 'איך היה היום? 🌙 בואי נראה את הציון היומי',
  },
};

/* ═══════════════════════════════════════════════════════════
   קריאה/שמירה של העדפות ב-localStorage
═══════════════════════════════════════════════════════════ */

const STORAGE_KEY = 'sappir_notifications_v1';

export function getReminderPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultPrefs();
    return { ...getDefaultPrefs(), ...JSON.parse(raw) };
  } catch {
    return getDefaultPrefs();
  }
}

function getDefaultPrefs() {
  return {
    enabled: false,
    sleep:   { on: false, time: '09:00' },
    meal:    { on: false, time: '14:00' },
    water:   { on: false, time: '16:00' },
    evening: { on: false, time: '20:00' },
  };
}

export function saveReminderPrefs(prefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

/* ═══════════════════════════════════════════════════════════
   בקשת הרשאה + תזמון תזכורות
═══════════════════════════════════════════════════════════ */

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    return { ok: false, reason: 'הדפדפן שלך לא תומך בהתראות' };
  }
  if (Notification.permission === 'granted') {
    return { ok: true };
  }
  if (Notification.permission === 'denied') {
    return { ok: false, reason: 'ההתראות חסומות. אפשרי דרך הגדרות הדפדפן.' };
  }
  const result = await Notification.requestPermission();
  return result === 'granted'
    ? { ok: true }
    : { ok: false, reason: 'לא התקבלה הרשאה להתראות' };
}

/* ═══════════════════════════════════════════════════════════
   תזמון התזכורות — מתרחש ברקע כשהאפליקציה פתוחה
═══════════════════════════════════════════════════════════ */

let scheduledTimers = [];

function clearScheduled() {
  scheduledTimers.forEach(t => clearTimeout(t));
  scheduledTimers = [];
}

function msUntilTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(h, m, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  return target - now;
}

async function showNotification(type) {
  if (Notification.permission !== 'granted') return;
  const meta = REMINDER_TYPES[type];
  if (!meta) return;

  // בדוק שהיום לא נשלחה כבר תזכורת מהסוג הזה (מונע כפילות אם הדף רוענן)
  const key = `sappir_last_${type}`;
  const today = new Date().toISOString().slice(0, 10);
  if (localStorage.getItem(key) === today) return;

  // בדוק אם רלוונטי — לא לשלוח תזכורת שינה אם כבר דיווחה
  const shouldSkip = await shouldSkipReminder(type);
  if (shouldSkip) return;

  try {
    // העדף service worker אם קיים (עובד ב-PWA ברקע)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const reg = await navigator.serviceWorker.ready;
      reg.showNotification('Sappir Fit', {
        body: meta.body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: `sappir-${type}`,
        lang: 'he',
        dir: 'rtl',
      });
    } else {
      new Notification('Sappir Fit', {
        body: meta.body,
        icon: '/icon-192.png',
        tag: `sappir-${type}`,
        lang: 'he',
        dir: 'rtl',
      });
    }
    localStorage.setItem(key, today);
  } catch (e) {
    console.warn('Notification failed:', e);
  }
}

// בודק אם כבר אין טעם לתזכר (למשל: כבר דיווחה שינה היום)
async function shouldSkipReminder(type) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const today = new Date().toISOString().slice(0, 10);

    if (type === 'sleep') {
      const { data } = await supabase
        .from('sleep_logs')
        .select('id').eq('client_id', user.id).eq('logged_for', today).maybeSingle();
      return !!data;
    }
    if (type === 'water') {
      // דלג אם הגיעה ליעד מים
      const { data: waterLogs } = await supabase
        .from('water_logs')
        .select('amount_ml').eq('client_id', user.id).gte('logged_at', today);
      const { data: profile } = await supabase
        .from('clients').select('daily_water_goal_ml').eq('id', user.id).maybeSingle();
      const total = (waterLogs || []).reduce((s, w) => s + w.amount_ml, 0);
      const goal = profile?.daily_water_goal_ml || 2500;
      return total >= goal;
    }
  } catch { /* ignore */ }
  return false;
}

/* פעיל — תזמן את כל התזכורות הפעילות */
export function startReminders() {
  clearScheduled();
  const prefs = getReminderPrefs();
  if (!prefs.enabled || Notification.permission !== 'granted') return;

  Object.keys(REMINDER_TYPES).forEach(type => {
    const pref = prefs[type];
    if (!pref?.on) return;
    const ms = msUntilTime(pref.time);
    const timer = setTimeout(async () => {
      await showNotification(type);
      // תזמן שוב בעוד 24 שעות
      startReminders();
    }, ms);
    scheduledTimers.push(timer);
  });
}

export function stopReminders() {
  clearScheduled();
}

/* ═══════════════════════════════════════════════════════════
   קומפוננטה: מסך הגדרות תזכורות
═══════════════════════════════════════════════════════════ */

export function NotificationSettings() {
  const [prefs, setPrefs] = useState(getReminderPrefs());
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const [toast, setToast] = useState(null);

  const showToast = (t) => {
    setToast(t);
    setTimeout(() => setToast(null), 2500);
  };

  const handleEnable = async () => {
    const { ok, reason } = await requestNotificationPermission();
    if (!ok) {
      showToast(reason);
      return;
    }
    setPermission('granted');
    const newPrefs = { ...prefs, enabled: true };
    setPrefs(newPrefs);
    saveReminderPrefs(newPrefs);
    startReminders();
    showToast('✅ התראות הופעלו');
  };

  const handleDisable = () => {
    const newPrefs = { ...prefs, enabled: false };
    setPrefs(newPrefs);
    saveReminderPrefs(newPrefs);
    stopReminders();
    showToast('❌ התראות בוטלו');
  };

  const toggleReminder = (type) => {
    const newPrefs = {
      ...prefs,
      [type]: { ...prefs[type], on: !prefs[type].on },
    };
    setPrefs(newPrefs);
    saveReminderPrefs(newPrefs);
    if (newPrefs.enabled) startReminders();
  };

  const setTime = (type, time) => {
    const newPrefs = {
      ...prefs,
      [type]: { ...prefs[type], time },
    };
    setPrefs(newPrefs);
    saveReminderPrefs(newPrefs);
    if (newPrefs.enabled) startReminders();
  };

  const testNotification = async () => {
    const { ok } = await requestNotificationPermission();
    if (!ok) {
      showToast('לא התקבלה הרשאה');
      return;
    }
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const reg = await navigator.serviceWorker.ready;
        reg.showNotification('Sappir Fit', {
          body: '💜 זו התראה לדוגמה — נראה מצוין!',
          icon: '/icon-192.png',
          tag: 'sappir-test',
          lang: 'he', dir: 'rtl',
        });
      } else {
        new Notification('Sappir Fit', {
          body: '💜 זו התראה לדוגמה — נראה מצוין!',
          icon: '/icon-192.png',
          lang: 'he', dir: 'rtl',
        });
      }
    } catch (e) {
      showToast('שגיאה: ' + e.message);
    }
  };

  const card = {
    background: 'white', border: `1px solid ${COLORS.border}`,
    borderRadius: 16, padding: 16,
  };

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* כרטיס ראשי — הפעלה כוללת */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: prefs.enabled ? COLORS.primary : COLORS.primarySoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
          }}>
            🔔
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: COLORS.text }}>תזכורות יומיות</p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: COLORS.textMuted }}>
              {prefs.enabled && permission === 'granted' ? 'פעילות' :
               permission === 'denied' ? 'חסומות בדפדפן' : 'כבויות'}
            </p>
          </div>
          {permission !== 'denied' && (
            <button
              onClick={prefs.enabled ? handleDisable : handleEnable}
              style={{
                width: 52, height: 30, borderRadius: 15,
                background: prefs.enabled ? COLORS.primary : COLORS.border,
                border: 'none', cursor: 'pointer',
                position: 'relative', transition: 'background 0.2s',
              }}
            >
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: 'white', position: 'absolute', top: 3,
                right: prefs.enabled ? 3 : 25,
                transition: 'right 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </button>
          )}
        </div>

        {permission === 'denied' && (
          <div style={{
            background: '#FFF4E5', border: '1px solid #F5D76E',
            borderRadius: 10, padding: 10, fontSize: 11, color: '#8B6914',
            lineHeight: 1.5,
          }}>
            ⚠️ ההתראות חסומות. אפשרי דרך הגדרות הדפדפן:
            Chrome → נעילה ליד ה-URL → התראות → אפשר
          </div>
        )}

        {permission === 'granted' && prefs.enabled && (
          <button
            onClick={testNotification}
            style={{
              width: '100%', marginTop: 8,
              background: COLORS.primarySoft, color: COLORS.primaryDark,
              border: `1px solid ${COLORS.border}`,
              padding: 10, borderRadius: 10,
              fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            🧪 שלחי לי התראה לדוגמה
          </button>
        )}
      </div>

      {/* רשימת 4 התזכורות */}
      {prefs.enabled && (
        <div style={{ ...card, opacity: permission === 'granted' ? 1 : 0.5 }}>
          <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: COLORS.text }}>
            בחרי אילו תזכורות לקבל
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.values(REMINDER_TYPES).map(meta => {
              const p = prefs[meta.id];
              return (
                <div key={meta.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: 10,
                  background: p.on ? COLORS.primarySoft : '#F8F6FB',
                  borderRadius: 10,
                  border: `1px solid ${p.on ? COLORS.primary : COLORS.border}`,
                  transition: 'all 0.2s',
                }}>
                  <span style={{ fontSize: 24 }}>{meta.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: COLORS.text }}>
                      {meta.label}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 10, color: COLORS.textMuted }}>
                      {meta.desc}
                    </p>
                  </div>

                  <input
                    type="time"
                    value={p.time}
                    onChange={(e) => setTime(meta.id, e.target.value)}
                    disabled={!p.on}
                    style={{
                      background: 'white', border: `1px solid ${COLORS.border}`,
                      borderRadius: 6, padding: '4px 6px',
                      fontSize: 11, fontFamily: 'inherit',
                      direction: 'ltr', width: 80,
                      opacity: p.on ? 1 : 0.5,
                    }}
                  />

                  <button
                    onClick={() => toggleReminder(meta.id)}
                    style={{
                      width: 40, height: 24, borderRadius: 12,
                      background: p.on ? COLORS.primary : COLORS.border,
                      border: 'none', cursor: 'pointer',
                      position: 'relative', transition: 'background 0.2s',
                      flexShrink: 0,
                    }}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      background: 'white', position: 'absolute', top: 3,
                      right: p.on ? 3 : 19,
                      transition: 'right 0.2s',
                    }} />
                  </button>
                </div>
              );
            })}
          </div>

          <p style={{
            margin: '12px 0 0', fontSize: 10, color: COLORS.textMuted,
            lineHeight: 1.5, textAlign: 'center',
          }}>
            💡 תזכורות שינה ומים לא יישלחו אם כבר דיווחת/שתית מספיק היום
          </p>
        </div>
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 100, left: '50%',
          transform: 'translateX(-50%)',
          background: COLORS.text, color: 'white',
          padding: '10px 18px', borderRadius: 999,
          fontSize: 13, fontWeight: 500, zIndex: 100,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          whiteSpace: 'nowrap',
        }}>
          {toast}
        </div>
      )}
    </section>
  );
}
