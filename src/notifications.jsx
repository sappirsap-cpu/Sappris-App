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
   Push Subscription — רישום למערכת push אמיתית
═══════════════════════════════════════════════════════════ */

// המפתח הציבורי VAPID — יש להגדיר ב-env. ברירת מחדל ריקה אם לא מוגדר.
const VAPID_PUBLIC_KEY = import.meta.env?.VITE_VAPID_PUBLIC_KEY || '';

function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export async function subscribeToPush() {
  if (!VAPID_PUBLIC_KEY) {
    return { ok: false, reason: 'Push לא מוגדר עדיין במערכת' };
  }
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { ok: false, reason: 'הדפדפן שלך לא תומך ב-Push' };
  }

  try {
    // רשום את ה-SW של ה-push
    let reg;
    try {
      reg = await navigator.serviceWorker.register('/sw-push.js');
      await navigator.serviceWorker.ready;
    } catch {
      reg = await navigator.serviceWorker.ready;
    }

    // בקש הרשאה
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return { ok: false, reason: 'לא התקבלה הרשאה' };

    // צור subscription
    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    // שמור ב-Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, reason: 'לא מחוברת' };

    const subJson = subscription.toJSON();
    await supabase.from('push_subscriptions').upsert(
      {
        user_id: user.id,
        endpoint: subJson.endpoint,
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth,
        user_agent: navigator.userAgent,
        last_used: new Date().toISOString(),
      },
      { onConflict: 'endpoint' }
    );

    return { ok: true };
  } catch (e) {
    console.error('Push subscription failed:', e);
    return { ok: false, reason: e.message };
  }
}

export async function unsubscribeFromPush() {
  try {
    if (!('serviceWorker' in navigator)) return;
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
    }
  } catch (e) {
    console.warn('Unsubscribe failed:', e);
  }
}

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
    type: 'time',  // תזכורת בשעה קבועה
  },
  meal: {
    id: 'meal',
    icon: '🥗',
    label: 'תזכורת ארוחות',
    desc: 'לפני כל ארוחה לפי הזמנים שתבחרי',
    body: 'הגיע הזמן ל{meal_name} 🥗',
    type: 'meal_based',  // תזכורת לפי שעות ארוחות
  },
  water: {
    id: 'water',
    icon: '💧',
    label: 'תזכורת שתייה',
    desc: 'תזכורת חכמה — אם עברו שעתיים בלי לשתות',
    body: 'מתי שתית בפעם האחרונה? 💧 קצת מים יעשו לך טוב',
    type: 'smart',  // תזכורת חכמה ללא שעה
  },
  evening: {
    id: 'evening',
    icon: '🌙',
    label: 'סיכום יומי',
    desc: 'בערב — "איך היה היום?"',
    defaultTime: '20:00',
    body: 'איך היה היום? 🌙 בואי נראה את הציון היומי',
    type: 'time_evening',  // תזכורת בשעה — מוגבלת לערב
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
    meal:    {
      on: false,
      meals: [
        { name: 'ארוחת בוקר', time: '08:00', minutesBefore: 15 },
        { name: 'ארוחת צהריים', time: '13:00', minutesBefore: 15 },
        { name: 'ארוחת ערב', time: '19:00', minutesBefore: 15 },
      ],
    },
    water:   {
      on: false,
      gapHours: 2,                   // עברו X שעות מאז שתייה אחרונה
      reminderAfterHour: '14:00',    // אחרי השעה הזו מזכירים גם אם לא הגיעה ליעד
    },
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
  scheduledTimers.forEach(t => {
    clearTimeout(t);
    clearInterval(t);  // אם זה interval, clearInterval יעבוד; אם timeout, יתעלם
  });
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

  // 1. תזכורות לפי שעה (sleep, evening)
  ['sleep', 'evening'].forEach(type => {
    const pref = prefs[type];
    if (!pref?.on || !pref.time) return;
    const ms = msUntilTime(pref.time);
    const timer = setTimeout(async () => {
      await showNotification(type);
      startReminders(); // תזמון מחדש למחר
    }, ms);
    scheduledTimers.push(timer);
  });

  // 2. תזכורות ארוחות — לפי כל ארוחה ב-meals[]
  const mealPref = prefs.meal;
  if (mealPref?.on && Array.isArray(mealPref.meals)) {
    mealPref.meals.forEach((meal, idx) => {
      if (!meal.time) return;
      const reminderTime = subtractMinutes(meal.time, meal.minutesBefore || 15);
      const ms = msUntilTime(reminderTime);
      const timer = setTimeout(async () => {
        await showMealNotification(meal);
        startReminders();
      }, ms);
      scheduledTimers.push(timer);
    });
  }

  // 3. תזכורת שתייה חכמה — בודקים כל 30 דקות
  const waterPref = prefs.water;
  if (waterPref?.on) {
    const checkInterval = setInterval(async () => {
      await checkSmartWaterReminder(waterPref);
    }, 30 * 60 * 1000);
    // נשתמש ב-clearInterval כשנעצור (clearScheduled תומך גם ב-intervals)
    scheduledTimers.push(checkInterval);
    // בדיקה ראשונית מיידית
    checkSmartWaterReminder(waterPref);
  }
}

// עוזר: מחסר X דקות משעה בפורמט HH:MM
function subtractMinutes(hhmm, minutes) {
  const [h, m] = hhmm.split(':').map(Number);
  const total = h * 60 + m - minutes;
  const newH = Math.floor((total + 1440) / 60) % 24;
  const newM = ((total % 60) + 60) % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

async function showMealNotification(meal) {
  if (Notification.permission !== 'granted') return;
  const today = new Date().toISOString().slice(0, 10);
  const key = `sappir_last_meal_${meal.name}`;
  if (localStorage.getItem(key) === today) return;

  const body = `הגיע הזמן ל${meal.name} 🥗`;
  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const reg = await navigator.serviceWorker.ready;
      reg.showNotification('Sappir Fit', {
        body, icon: '/icon-192.png', tag: `sappir-meal-${meal.name}`,
        lang: 'he', dir: 'rtl',
      });
    } else {
      new Notification('Sappir Fit', { body, icon: '/icon-192.png', lang: 'he', dir: 'rtl' });
    }
    localStorage.setItem(key, today);
  } catch (e) { /* silent */ }
}

// בדיקה חכמה לתזכורת מים
async function checkSmartWaterReminder(waterPref) {
  if (Notification.permission !== 'granted') return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().slice(0, 10);
    const todayStart = `${today}T00:00:00`;

    // בדוק אם כבר נשלחה תזכורת מים בשעה האחרונה (להימנע מספאם)
    const lastSentKey = 'sappir_last_water_check';
    const lastSent = localStorage.getItem(lastSentKey);
    if (lastSent) {
      const lastSentTime = new Date(lastSent).getTime();
      if (Date.now() - lastSentTime < 90 * 60 * 1000) return; // לא יותר מאחת ל-90 דקות
    }

    // טען את כל דיווחי המים של היום
    const { data: waterLogs } = await supabase
      .from('water_logs')
      .select('amount_ml, logged_at')
      .eq('client_id', user.id)
      .gte('logged_at', todayStart)
      .order('logged_at', { ascending: false });

    if (!waterLogs) return;

    // טען יעד מהפרופיל
    const { data: profile } = await supabase
      .from('clients').select('daily_water_goal_ml').eq('id', user.id).maybeSingle();
    const goal = profile?.daily_water_goal_ml || 2500;

    const totalToday = waterLogs.reduce((s, w) => s + (w.amount_ml || 0), 0);
    const reachedGoal = totalToday >= goal;

    // אם הגיעה ליעד — אין צורך
    if (reachedGoal) return;

    const now = new Date();

    // תנאי 1: עברו X שעות מהדיווח האחרון
    const gapHours = waterPref.gapHours || 2;
    const lastDrink = waterLogs[0];
    let needsReminder = false;
    let reminderBody = '';

    if (!lastDrink) {
      // אם השעה כבר אחרי 10:00 ועוד לא שתתה כלום
      if (now.getHours() >= 10) {
        needsReminder = true;
        reminderBody = 'בוקר טוב! 💧 שכחת לרשום שתייה היום? בואי נתחיל';
      }
    } else {
      const lastDrinkTime = new Date(lastDrink.logged_at);
      const hoursSince = (now - lastDrinkTime) / (1000 * 60 * 60);
      if (hoursSince >= gapHours) {
        needsReminder = true;
        const hrs = Math.floor(hoursSince);
        reminderBody = `עברו ${hrs} שעות מאז המים האחרונים 💧 כוס מים תעזור!`;
      }
    }

    // תנאי 2: שעת היום אחרי X ועוד לא הגיעה ליעד
    const [reminderH] = (waterPref.reminderAfterHour || '14:00').split(':').map(Number);
    if (!needsReminder && now.getHours() >= reminderH) {
      const remaining = goal - totalToday;
      if (remaining > 500) {
        needsReminder = true;
        reminderBody = `נשארו ${remaining}מ"ל ליעד היומי 💧 בואי נסגור את זה ביחד`;
      }
    }

    if (!needsReminder) return;

    // שלח את התזכורת
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const reg = await navigator.serviceWorker.ready;
      reg.showNotification('Sappir Fit', {
        body: reminderBody, icon: '/icon-192.png', tag: 'sappir-water',
        lang: 'he', dir: 'rtl',
      });
    } else {
      new Notification('Sappir Fit', {
        body: reminderBody, icon: '/icon-192.png', lang: 'he', dir: 'rtl',
      });
    }
    localStorage.setItem(lastSentKey, now.toISOString());
  } catch (e) {
    console.warn('Smart water check failed:', e);
  }
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

    // נסה גם להירשם ל-Push (אם מוגדר)
    const pushResult = await subscribeToPush();
    if (pushResult.ok) {
      showToast('✅ התראות הופעלו (כולל push ברקע)');
    } else {
      showToast('✅ התראות הופעלו (רק כשהאפליקציה פתוחה)');
    }

    const newPrefs = { ...prefs, enabled: true };
    setPrefs(newPrefs);
    saveReminderPrefs(newPrefs);
    startReminders();
  };

  const handleDisable = async () => {
    const newPrefs = { ...prefs, enabled: false };
    setPrefs(newPrefs);
    saveReminderPrefs(newPrefs);
    stopReminders();
    await unsubscribeFromPush();
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
    // שעה לתזכורות time / time_evening
    const newPrefs = {
      ...prefs,
      [type]: { ...prefs[type], time },
    };
    setPrefs(newPrefs);
    saveReminderPrefs(newPrefs);
    if (newPrefs.enabled) startReminders();
  };

  const updateMeal = (idx, patch) => {
    const newMeals = [...prefs.meal.meals];
    newMeals[idx] = { ...newMeals[idx], ...patch };
    const newPrefs = { ...prefs, meal: { ...prefs.meal, meals: newMeals } };
    setPrefs(newPrefs);
    saveReminderPrefs(newPrefs);
    if (newPrefs.enabled) startReminders();
  };

  const addMeal = () => {
    const newMeals = [...prefs.meal.meals, { name: 'ארוחה', time: '12:00', minutesBefore: 15 }];
    const newPrefs = { ...prefs, meal: { ...prefs.meal, meals: newMeals } };
    setPrefs(newPrefs);
    saveReminderPrefs(newPrefs);
  };

  const removeMeal = (idx) => {
    const newMeals = prefs.meal.meals.filter((_, i) => i !== idx);
    const newPrefs = { ...prefs, meal: { ...prefs.meal, meals: newMeals } };
    setPrefs(newPrefs);
    saveReminderPrefs(newPrefs);
    if (newPrefs.enabled) startReminders();
  };

  const updateWaterPref = (patch) => {
    const newPrefs = { ...prefs, water: { ...prefs.water, ...patch } };
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.values(REMINDER_TYPES).map(meta => {
              const p = prefs[meta.id];
              const active = p.on;

              // כרטיס בסיסי לכל תזכורת
              return (
                <div key={meta.id} style={{
                  padding: 12,
                  background: active ? COLORS.primarySoft : '#F8F6FB',
                  borderRadius: 12,
                  border: `1px solid ${active ? COLORS.primary : COLORS.border}`,
                  transition: 'all 0.2s',
                }}>
                  {/* שורה ראשית: אייקון + שם + toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 24 }}>{meta.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: COLORS.text }}>
                        {meta.label}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 10, color: COLORS.textMuted, lineHeight: 1.4 }}>
                        {meta.desc}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleReminder(meta.id)}
                      style={{
                        width: 44, height: 26, borderRadius: 13,
                        background: active ? COLORS.primary : COLORS.border,
                        border: 'none', cursor: 'pointer',
                        position: 'relative', transition: 'background 0.2s',
                        flexShrink: 0,
                      }}
                    >
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%',
                        background: 'white', position: 'absolute', top: 3,
                        right: active ? 3 : 21,
                        transition: 'right 0.2s',
                      }} />
                    </button>
                  </div>

                  {/* תוכן ספציפי לכל סוג — מופיע רק כשפעיל */}
                  {active && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${COLORS.border}` }}>

                      {/* תזכורת לפי שעה (sleep) */}
                      {meta.type === 'time' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, color: COLORS.textMuted }}>בשעה:</span>
                          <input
                            type="time"
                            value={p.time}
                            onChange={(e) => setTime(meta.id, e.target.value)}
                            style={{
                              flex: 1, background: 'white',
                              border: `1px solid ${COLORS.border}`, borderRadius: 8,
                              padding: '6px 10px', fontSize: 13, fontFamily: 'inherit',
                              direction: 'ltr', outline: 'none',
                            }}
                          />
                        </div>
                      )}

                      {/* תזכורת לפי שעה — מוגבלת לערב (evening) */}
                      {meta.type === 'time_evening' && (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 11, color: COLORS.textMuted }}>בשעה:</span>
                            <input
                              type="time"
                              value={p.time}
                              min="18:00" max="23:00"
                              onChange={(e) => {
                                // אכיפת טווח 18-23
                                const [h] = e.target.value.split(':').map(Number);
                                if (h < 18 || h > 23) return;
                                setTime(meta.id, e.target.value);
                              }}
                              style={{
                                flex: 1, background: 'white',
                                border: `1px solid ${COLORS.border}`, borderRadius: 8,
                                padding: '6px 10px', fontSize: 13, fontFamily: 'inherit',
                                direction: 'ltr', outline: 'none',
                              }}
                            />
                          </div>
                          <p style={{ margin: '6px 0 0', fontSize: 9, color: COLORS.textMuted, textAlign: 'center' }}>
                            💡 ניתן לבחור רק בין 18:00 ל-23:00
                          </p>
                        </div>
                      )}

                      {/* תזכורת ארוחות מובנית */}
                      {meta.type === 'meal_based' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {p.meals.map((m, idx) => (
                            <div key={idx} style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr auto auto auto',
                              gap: 6, alignItems: 'center',
                              background: 'white', padding: 8, borderRadius: 8,
                            }}>
                              <input
                                type="text"
                                value={m.name}
                                onChange={(e) => updateMeal(idx, { name: e.target.value })}
                                placeholder="שם הארוחה"
                                style={{
                                  border: `1px solid ${COLORS.border}`, borderRadius: 6,
                                  padding: '4px 8px', fontSize: 11, fontFamily: 'inherit',
                                  outline: 'none', minWidth: 0,
                                }}
                              />
                              <input
                                type="time"
                                value={m.time}
                                onChange={(e) => updateMeal(idx, { time: e.target.value })}
                                style={{
                                  border: `1px solid ${COLORS.border}`, borderRadius: 6,
                                  padding: '4px 6px', fontSize: 11, fontFamily: 'inherit',
                                  direction: 'ltr', outline: 'none',
                                }}
                              />
                              <select
                                value={m.minutesBefore || 15}
                                onChange={(e) => updateMeal(idx, { minutesBefore: parseInt(e.target.value) })}
                                style={{
                                  border: `1px solid ${COLORS.border}`, borderRadius: 6,
                                  padding: '4px 6px', fontSize: 11, fontFamily: 'inherit',
                                  background: 'white', outline: 'none',
                                }}
                              >
                                <option value="0">בזמן</option>
                                <option value="15">15 דק׳ לפני</option>
                                <option value="30">30 דק׳ לפני</option>
                                <option value="60">שעה לפני</option>
                              </select>
                              <button
                                onClick={() => removeMeal(idx)}
                                style={{
                                  background: 'transparent', border: 'none',
                                  fontSize: 14, color: COLORS.textMuted,
                                  cursor: 'pointer', padding: 4,
                                }}
                              >🗑</button>
                            </div>
                          ))}
                          <button
                            onClick={addMeal}
                            style={{
                              background: 'white', color: COLORS.primaryDark,
                              border: `1px dashed ${COLORS.primary}`,
                              padding: 8, borderRadius: 8,
                              fontSize: 11, fontWeight: 600,
                              cursor: 'pointer', fontFamily: 'inherit',
                            }}
                          >
                            + הוסיפי ארוחה
                          </button>
                        </div>
                      )}

                      {/* תזכורת מים חכמה */}
                      {meta.type === 'smart' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            background: 'white', padding: 8, borderRadius: 8,
                          }}>
                            <span style={{ fontSize: 11, color: COLORS.textMuted, flex: 1 }}>
                              תזכירי לי אם עברו
                            </span>
                            <select
                              value={p.gapHours || 2}
                              onChange={(e) => updateWaterPref({ gapHours: parseInt(e.target.value) })}
                              style={{
                                border: `1px solid ${COLORS.border}`, borderRadius: 6,
                                padding: '4px 6px', fontSize: 11, fontFamily: 'inherit',
                                background: 'white', outline: 'none',
                              }}
                            >
                              <option value="1">שעה</option>
                              <option value="2">שעתיים</option>
                              <option value="3">3 שעות</option>
                              <option value="4">4 שעות</option>
                            </select>
                            <span style={{ fontSize: 11, color: COLORS.textMuted }}>
                              ללא מים
                            </span>
                          </div>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            background: 'white', padding: 8, borderRadius: 8,
                          }}>
                            <span style={{ fontSize: 11, color: COLORS.textMuted, flex: 1 }}>
                              + תזכירי אחרי השעה
                            </span>
                            <input
                              type="time"
                              value={p.reminderAfterHour || '14:00'}
                              onChange={(e) => updateWaterPref({ reminderAfterHour: e.target.value })}
                              style={{
                                border: `1px solid ${COLORS.border}`, borderRadius: 6,
                                padding: '4px 6px', fontSize: 11, fontFamily: 'inherit',
                                direction: 'ltr', outline: 'none', width: 80,
                              }}
                            />
                            <span style={{ fontSize: 11, color: COLORS.textMuted }}>
                              אם לא ביעד
                            </span>
                          </div>
                        </div>
                      )}

                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p style={{
            margin: '12px 0 0', fontSize: 10, color: COLORS.textMuted,
            lineHeight: 1.5, textAlign: 'center',
          }}>
            💡 התזכורת של מים תופעל רק אם עוד לא הגעת ליעד
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
