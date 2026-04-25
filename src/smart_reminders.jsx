// ═══════════════════════════════════════════════════════════════
// src/smart_reminders.jsx
// תזכורות חכמות לפי לוח האימונים השבועי
// ═══════════════════════════════════════════════════════════════
// המאמנת מגדירה לכל לקוחה לוח אימונים שבועי (ימים + שעות).
// המערכת מתזמנת תזכורות אוטומטיות:
//   - 30 דקות לפני אימון: "לאכול משהו קל לפני האימון"
//   - 30 דקות אחרי: "כל הכבוד! לרשום את הארוחה שלאחר האימון"
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

const COLORS = {
  bg: '#F5F2FA', primary: '#B19CD9', primaryDark: '#8B72B5',
  primarySoft: '#E8DFF5', mint: '#C5B3E0', peach: '#F5D0B5',
  text: '#2E2A3D', textMuted: '#756B85', border: '#DDD0EB',
};

const DAYS_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

const card = {
  background: 'white', border: `1px solid ${COLORS.border}`,
  borderRadius: 16, padding: 16,
};

/* ═══════════════════════════════════════════════════════════
   API
═══════════════════════════════════════════════════════════ */

export async function getSchedule(clientId) {
  const { data } = await supabase
    .from('workout_schedule')
    .select('*')
    .eq('client_id', clientId);

  // החזר 7 ימים מלאים (גם אם חסרים ב-DB)
  const byDay = {};
  (data || []).forEach(d => { byDay[d.day_of_week] = d; });

  return Array.from({ length: 7 }, (_, i) => byDay[i] || {
    day_of_week: i,
    workout_time: null,
    is_rest_day: false,
    workout_id: null,
  });
}

export async function saveScheduleDay(clientId, dayOfWeek, params) {
  const { data: existing } = await supabase
    .from('workout_schedule')
    .select('id')
    .eq('client_id', clientId)
    .eq('day_of_week', dayOfWeek)
    .maybeSingle();

  const payload = {
    client_id: clientId,
    day_of_week: dayOfWeek,
    workout_time: params.workout_time || null,
    is_rest_day: !!params.is_rest_day,
    workout_id: params.workout_id || null,
  };

  if (existing) {
    return supabase.from('workout_schedule').update(payload).eq('id', existing.id);
  } else {
    return supabase.from('workout_schedule').insert(payload);
  }
}

/* ═══════════════════════════════════════════════════════════
   חישוב התזכורות הבאות מהלוח (ל-7 ימים קדימה)
═══════════════════════════════════════════════════════════ */

export async function computeUpcomingReminders(clientId) {
  const schedule = await getSchedule(clientId);
  const now = new Date();
  const upcoming = [];

  // עבור כל יום בשבוע הקרוב
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const dow = d.getDay();
    const slot = schedule.find(s => s.day_of_week === dow);
    if (!slot || !slot.workout_time || slot.is_rest_day) continue;

    // צור תאריך-שעה מלא
    const [h, m] = slot.workout_time.split(':').map(Number);
    const workoutTime = new Date(d);
    workoutTime.setHours(h, m, 0, 0);
    if (workoutTime <= now) continue;

    // 30 דקות לפני
    const preTime = new Date(workoutTime.getTime() - 30 * 60000);
    if (preTime > now) {
      upcoming.push({
        type: 'pre_workout_meal',
        scheduled_for: preTime,
        title: 'לפני האימון',
        body: '⚡ בעוד 30 דק׳ אימון! אכלי משהו קל (פרי / יוגורט / כריך קטן)',
        workout_time: workoutTime,
      });
    }
    // 30 דקות אחרי
    const postTime = new Date(workoutTime.getTime() + 30 * 60000);
    if (postTime > now) {
      upcoming.push({
        type: 'post_workout',
        scheduled_for: postTime,
        title: 'אחרי האימון',
        body: '💪 כל הכבוד! זה הזמן לארוחה עם חלבון איכותי בתוך השעתיים הקרובות',
        workout_time: workoutTime,
      });
    }
  }

  return upcoming.sort((a, b) => a.scheduled_for - b.scheduled_for);
}

/* ═══════════════════════════════════════════════════════════
   רישום ב-DB ושליחת תזכורת ברגע הנכון
═══════════════════════════════════════════════════════════ */

let scheduledTimers = [];

function clearScheduled() {
  scheduledTimers.forEach(t => clearTimeout(t));
  scheduledTimers = [];
}

async function showReminder(reminder) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

  // הגנה מפני כפילות באמצעות logging
  try {
    const { data: existing } = await supabase
      .from('smart_reminders_log')
      .select('id, sent_at')
      .eq('reminder_type', reminder.type)
      .eq('scheduled_for', reminder.scheduled_for.toISOString())
      .maybeSingle();
    if (existing?.sent_at) return; // כבר נשלח
  } catch (e) { /* ignore */ }

  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const reg = await navigator.serviceWorker.ready;
      reg.showNotification(reminder.title, {
        body: reminder.body,
        icon: '/icon-192.png',
        tag: `smart-${reminder.type}-${reminder.scheduled_for.getTime()}`,
        lang: 'he', dir: 'rtl',
        vibrate: [100, 50, 100],
      });
    } else {
      new Notification(reminder.title, {
        body: reminder.body,
        icon: '/icon-192.png',
        lang: 'he', dir: 'rtl',
      });
    }

    // לוג ב-DB
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('smart_reminders_log').upsert({
        client_id: user.id,
        reminder_type: reminder.type,
        scheduled_for: reminder.scheduled_for.toISOString(),
        sent_at: new Date().toISOString(),
        payload: { title: reminder.title, body: reminder.body },
      }, { onConflict: 'client_id,reminder_type,scheduled_for' });
    }
  } catch (e) {
    console.warn('Smart reminder failed:', e);
  }
}

export async function startSmartReminders(clientId) {
  clearScheduled();
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

  const reminders = await computeUpcomingReminders(clientId);
  const now = Date.now();

  for (const r of reminders) {
    const ms = r.scheduled_for.getTime() - now;
    if (ms < 0 || ms > 7 * 24 * 60 * 60 * 1000) continue; // עד שבוע
    const timer = setTimeout(() => showReminder(r), ms);
    scheduledTimers.push(timer);
  }
}

export function stopSmartReminders() {
  clearScheduled();
}

/* ═══════════════════════════════════════════════════════════
   קומפוננטה: עורך לוח אימונים שבועי (למאמנת)
═══════════════════════════════════════════════════════════ */

export function ScheduleEditor({ clientId, onClose }) {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await getSchedule(clientId);
    setSchedule(data);
    setLoading(false);
  };

  useEffect(() => { if (clientId) load(); }, [clientId]);

  const updateDay = (dow, patch) => {
    setSchedule(prev => prev.map(d => d.day_of_week === dow ? { ...d, ...patch } : d));
  };

  const handleSave = async () => {
    setSaving(true);
    for (const d of schedule) {
      await saveScheduleDay(clientId, d.day_of_week, {
        workout_time: d.workout_time,
        is_rest_day: d.is_rest_day,
        workout_id: d.workout_id,
      });
    }
    setSaving(false);
    onClose && onClose();
  };

  if (loading) return <p style={{ textAlign: 'center', padding: 20 }}>טוענת...</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: COLORS.text }}>
        🗓️ לוח אימונים שבועי
      </p>
      <p style={{ margin: 0, fontSize: 11, color: COLORS.textMuted, lineHeight: 1.5 }}>
        סמני באיזה ימים יש אימון ובאיזו שעה. המתאמנת תקבל תזכורת אוטומטית 30 דק׳ לפני ו-30 דק׳ אחרי.
      </p>

      {schedule.map(d => (
        <div key={d.day_of_week} style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontSize: 12, fontWeight: 700, width: 50,
              color: COLORS.primaryDark,
            }}>
              {DAYS_HE[d.day_of_week]}
            </span>

            {d.is_rest_day ? (
              <span style={{
                flex: 1, padding: 8, background: COLORS.primarySoft,
                color: COLORS.primaryDark, borderRadius: 8,
                fontSize: 12, textAlign: 'center', fontWeight: 600,
              }}>
                🧘 יום מנוחה
              </span>
            ) : (
              <input
                type="time"
                value={d.workout_time || ''}
                onChange={(e) => updateDay(d.day_of_week, { workout_time: e.target.value })}
                style={{
                  flex: 1, padding: 8,
                  border: `1px solid ${COLORS.border}`, borderRadius: 8,
                  fontSize: 13, fontFamily: 'inherit',
                  direction: 'ltr', boxSizing: 'border-box', outline: 'none',
                }}
              />
            )}

            <button
              onClick={() => updateDay(d.day_of_week, {
                is_rest_day: !d.is_rest_day,
                workout_time: d.is_rest_day ? '' : d.workout_time,
              })}
              style={{
                padding: '6px 10px',
                background: d.is_rest_day ? COLORS.primary : 'white',
                color: d.is_rest_day ? 'white' : COLORS.textMuted,
                border: `1px solid ${d.is_rest_day ? COLORS.primary : COLORS.border}`,
                borderRadius: 8, fontSize: 11, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
                whiteSpace: 'nowrap',
              }}
            >
              🧘 מנוחה
            </button>
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        {onClose && (
          <button onClick={onClose} style={{
            flex: 1, background: 'white', color: COLORS.textMuted,
            border: `1px solid ${COLORS.border}`, padding: 12, borderRadius: 10,
            fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
          }}>ביטול</button>
        )}
        <button onClick={handleSave} disabled={saving} style={{
          flex: 2, background: COLORS.primary, color: 'white',
          border: 'none', padding: 12, borderRadius: 10,
          fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          opacity: saving ? 0.6 : 1,
        }}>
          {saving ? 'שומרת...' : '💾 שמרי לוח'}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   קומפוננטה: הצגת האימון הבא למתאמנת + תזכורות
═══════════════════════════════════════════════════════════ */

export function NextWorkoutCard({ clientId }) {
  const [nextWorkout, setNextWorkout] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    (async () => {
      const reminders = await computeUpcomingReminders(clientId);
      const preWorkout = reminders.find(r => r.type === 'pre_workout_meal');
      setNextWorkout(preWorkout?.workout_time || null);
      setLoading(false);
    })();
  }, [clientId]);

  if (loading || !nextWorkout) return null;

  const now = new Date();
  const diff = nextWorkout - now;
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);

  let timeLabel;
  if (hours >= 24) {
    timeLabel = `בעוד ${Math.floor(hours / 24)} ימים`;
  } else if (hours > 0) {
    timeLabel = `בעוד ${hours}ש' ${minutes}דק'`;
  } else {
    timeLabel = `בעוד ${minutes} דקות`;
  }

  const dayName = DAYS_HE[nextWorkout.getDay()];
  const timeStr = nextWorkout.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

  return (
    <section style={{
      ...card,
      background: 'linear-gradient(135deg, #E8DFF5 0%, #C5B3E0 100%)',
      border: 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 50, height: 50, borderRadius: '50%',
          background: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24,
        }}>💪</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: COLORS.primaryDark, letterSpacing: '0.5px' }}>
            האימון הבא
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 700, color: COLORS.text }}>
            יום {dayName} ב-{timeStr}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: COLORS.text }}>
            ⏰ {timeLabel}
          </p>
        </div>
      </div>
    </section>
  );
}
