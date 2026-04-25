// ═══════════════════════════════════════════════════════════════
// src/pattern_reminders.jsx
// זיהוי דפוסי התנהגות + הצעת תזכורות מותאמות אישית
// ═══════════════════════════════════════════════════════════════
// ה-AI מזהה דפוסים בעקביות שלי ושואל אם רוצה תזכורת מיוחדת.
// "שמתי לב שאת פחות עקבית בימי שלישי, רוצה תזכורת בבוקר?"
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

const COLORS = {
  bg: '#F5F2FA', primary: '#B19CD9', primaryDark: '#8B72B5',
  primarySoft: '#E8DFF5', mint: '#C5B3E0', peach: '#F5D0B5',
  text: '#2E2A3D', textMuted: '#756B85', border: '#DDD0EB',
  amber: '#E8C96A', green: '#6B9B6B',
};

const card = {
  background: 'white', border: `1px solid ${COLORS.border}`,
  borderRadius: 16, padding: 16,
};

const DAYS_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

/* ═══════════════════════════════════════════════════════════
   זיהוי דפוסים מהציונים היומיים והתנהגות
═══════════════════════════════════════════════════════════ */

export async function detectPatterns(clientId) {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

  // טען ציונים מ-30 הימים האחרונים
  const { data: scores } = await supabase
    .from('daily_scores')
    .select('*')
    .eq('client_id', clientId)
    .gte('score_date', monthAgo)
    .lte('score_date', today);

  if (!scores || scores.length < 7) return []; // אין מספיק נתונים

  const patterns = [];

  // דפוס 1: יום חלש קבוע בשבוע
  const byDay = {};
  scores.forEach(s => {
    const dow = new Date(s.score_date).getDay();
    if (!byDay[dow]) byDay[dow] = [];
    byDay[dow].push(s.total_score);
  });

  Object.entries(byDay).forEach(([dow, vals]) => {
    if (vals.length < 3) return;
    const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
    const overallAvg = scores.reduce((s, v) => s + v.total_score, 0) / scores.length;
    if (avg < overallAvg - 15 && avg < 50) {
      patterns.push({
        pattern_type: 'weak_day',
        pattern_data: { day_of_week: parseInt(dow), score_avg: Math.round(avg), overall_avg: Math.round(overallAvg) },
        confidence: Math.min(100, Math.round((overallAvg - avg) * 2)),
      });
    }
  });

  // דפוס 2: ימי אימון נשמטים
  const noWorkoutDays = scores.filter(s => s.workout_pts === 0);
  if (noWorkoutDays.length >= 5) {
    const noWorkoutByDay = {};
    noWorkoutDays.forEach(s => {
      const dow = new Date(s.score_date).getDay();
      noWorkoutByDay[dow] = (noWorkoutByDay[dow] || 0) + 1;
    });
    Object.entries(noWorkoutByDay).forEach(([dow, count]) => {
      if (count >= 3) {
        patterns.push({
          pattern_type: 'no_workout_day',
          pattern_data: { day_of_week: parseInt(dow), count },
          confidence: Math.min(100, count * 25),
        });
      }
    });
  }

  // דפוס 3: streak מצוין מתמשך
  const last7 = scores.slice(0, 7);
  if (last7.length === 7 && last7.every(s => s.total_score >= 80)) {
    patterns.push({
      pattern_type: 'high_score_streak',
      pattern_data: { days: 7, avg: Math.round(last7.reduce((s, v) => s + v.total_score, 0) / 7) },
      confidence: 95,
    });
  }

  // דפוס 4: ירידה במים בימים מסוימים
  const lowWaterDays = scores.filter(s => s.water_pts < 10);
  if (lowWaterDays.length >= 5) {
    patterns.push({
      pattern_type: 'low_water',
      pattern_data: { days_count: lowWaterDays.length, period_days: 30 },
      confidence: Math.min(100, lowWaterDays.length * 10),
    });
  }

  return patterns;
}

// שמירת דפוסים שזוהו ב-DB (פעם ביום)
export async function saveDetectedPatterns(clientId, patterns) {
  if (!patterns || patterns.length === 0) return;
  const today = new Date().toISOString().slice(0, 10);

  for (const p of patterns) {
    await supabase.from('client_patterns').upsert({
      client_id: clientId,
      pattern_type: p.pattern_type,
      pattern_data: p.pattern_data,
      confidence: p.confidence,
      detected_at: today,
      is_active: true,
    }, { onConflict: 'client_id,pattern_type,detected_at' });
  }
}

export async function getActivePatterns(clientId) {
  const since = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);
  const { data } = await supabase
    .from('client_patterns')
    .select('*')
    .eq('client_id', clientId)
    .eq('is_active', true)
    .eq('user_dismissed', false)
    .gte('detected_at', since)
    .order('confidence', { ascending: false });
  return data || [];
}

export async function dismissPattern(id) {
  return supabase.from('client_patterns').update({ user_dismissed: true }).eq('id', id);
}

export async function setPatternReminder(id, time) {
  return supabase
    .from('client_patterns')
    .update({ reminder_set: true, reminder_time: time })
    .eq('id', id);
}

/* ═══════════════════════════════════════════════════════════
   טקסט ידידותי לכל דפוס
═══════════════════════════════════════════════════════════ */

function patternToHebrew(p) {
  const d = p.pattern_data || {};
  switch (p.pattern_type) {
    case 'weak_day':
      return {
        icon: '📉',
        title: `יום ${DAYS_HE[d.day_of_week]} פחות עקבי אצלך`,
        body: `הציון הממוצע שלך ביום ${DAYS_HE[d.day_of_week]} הוא ${d.score_avg} — לעומת ממוצע של ${d.overall_avg} בשאר הימים. אולי תזכורת מיוחדת בבוקר תעזור?`,
        suggestionType: 'reminder',
        defaultTime: '08:00',
      };
    case 'no_workout_day':
      return {
        icon: '💪',
        title: `אימונים מתפספסים בימי ${DAYS_HE[d.day_of_week]}`,
        body: `שמתי לב שב-${d.count} מתוך 4 ימי ${DAYS_HE[d.day_of_week]} האחרונים לא היה אימון. רוצה תזכורת אוטומטית?`,
        suggestionType: 'reminder',
        defaultTime: '07:30',
      };
    case 'high_score_streak':
      return {
        icon: '🔥',
        title: 'תותחית — שבוע מושלם!',
        body: `הציון הממוצע שלך השבוע הוא ${d.avg}. זה מדהים! תמשיכי כך 💜`,
        suggestionType: 'celebrate',
      };
    case 'low_water':
      return {
        icon: '💧',
        title: 'אפשר לשפר את ההידרציה',
        body: `ב-${d.days_count} מתוך ${d.period_days} הימים האחרונים לא הגעת ליעד המים. תזכורת אחר הצהריים תעזור?`,
        suggestionType: 'reminder',
        defaultTime: '15:00',
      };
    default:
      return null;
  }
}

/* ═══════════════════════════════════════════════════════════
   קומפוננטה: כרטיסי תובנות במסך הבית של המתאמנת
═══════════════════════════════════════════════════════════ */

export function PatternInsights({ clientId }) {
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [setting, setSetting] = useState(null);
  const [reminderTime, setReminderTime] = useState('');

  const load = async () => {
    setLoading(true);
    // הרץ זיהוי + שמור (פעם ביום)
    const lastCheck = localStorage.getItem('patterns_last_check');
    const today = new Date().toISOString().slice(0, 10);
    if (lastCheck !== today) {
      const detected = await detectPatterns(clientId);
      await saveDetectedPatterns(clientId, detected);
      localStorage.setItem('patterns_last_check', today);
    }
    const active = await getActivePatterns(clientId);
    setPatterns(active);
    setLoading(false);
  };

  useEffect(() => { if (clientId) load(); }, [clientId]);

  if (loading || patterns.length === 0) return null;

  const handleDismiss = async (id) => {
    await dismissPattern(id);
    setPatterns(prev => prev.filter(p => p.id !== id));
  };

  const handleSetReminder = async (pattern) => {
    if (!reminderTime) return;
    await setPatternReminder(pattern.id, reminderTime);
    setSetting(null);
    setReminderTime('');
    alert('✅ תזכורת נקבעה בהצלחה');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: COLORS.primaryDark }}>
        ✨ תובנות חכמות
      </p>
      {patterns.slice(0, 3).map(p => {
        const meta = patternToHebrew(p);
        if (!meta) return null;
        const isCelebrate = meta.suggestionType === 'celebrate';
        return (
          <div key={p.id} style={{
            ...card,
            background: isCelebrate
              ? 'linear-gradient(135deg, #E8DFF5 0%, #F5D0B5 100%)'
              : 'white',
            border: isCelebrate ? 'none' : `1px solid ${COLORS.border}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ fontSize: 24 }}>{meta.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: COLORS.text }}>
                  {meta.title}
                </p>
                <p style={{ margin: '4px 0 8px', fontSize: 11, color: COLORS.text, lineHeight: 1.5 }}>
                  {meta.body}
                </p>

                {setting === p.id ? (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6 }}>
                    <input type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)}
                      style={{
                        padding: 6, border: `1px solid ${COLORS.border}`,
                        borderRadius: 6, fontSize: 11, fontFamily: 'inherit', direction: 'ltr',
                      }}
                    />
                    <button onClick={() => handleSetReminder(p)} style={{
                      padding: '6px 10px', background: COLORS.primary, color: 'white',
                      border: 'none', borderRadius: 6, fontSize: 10, fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}>הגדירי</button>
                    <button onClick={() => { setSetting(null); setReminderTime(''); }} style={{
                      padding: '6px 8px', background: 'white', color: COLORS.textMuted,
                      border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 10,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}>✕</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 6 }}>
                    {meta.suggestionType === 'reminder' && (
                      <button onClick={() => { setSetting(p.id); setReminderTime(meta.defaultTime); }} style={{
                        padding: '5px 10px', background: COLORS.primary, color: 'white',
                        border: 'none', borderRadius: 6, fontSize: 10, fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}>
                        🔔 הגדירי תזכורת
                      </button>
                    )}
                    <button onClick={() => handleDismiss(p.id)} style={{
                      padding: '5px 10px', background: 'transparent',
                      border: 'none', fontSize: 10, color: COLORS.textMuted,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}>סגור ✕</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
