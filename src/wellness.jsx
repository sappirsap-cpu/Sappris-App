// ═══════════════════════════════════════════════════════════════
// src/wellness.jsx
// כל הלוגיקה והקומפוננטות של שינה / ציון יומי / הישגים / דוח שבועי
// ═══════════════════════════════════════════════════════════════
// איך להשתמש:
// 1. שמרי את הקובץ כ-src/wellness.jsx
// 2. ב-client_app.jsx: import { SleepCard, DailyScoreCard, BadgesCard, WeeklyReportCard } from './wellness';
// 3. ב-coach_app.jsx:  import { CoachClientWellness, CoachWeeklyOverview } from './wellness';
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

const COLORS = {
  bg: '#F5F2FA',
  primary: '#B19CD9',
  primaryDark: '#8B72B5',
  primarySoft: '#E8DFF5',
  mint: '#C5B3E0',
  peach: '#F5D0B5',
  peachSoft: '#FBE8D7',
  sky: '#A495C5',
  amber: '#E8C96A',
  amberSoft: '#F5EECD',
  text: '#2E2A3D',
  textMuted: '#756B85',
  border: '#DDD0EB',
};

const card = {
  background: 'white',
  border: `1px solid ${COLORS.border}`,
  borderRadius: 16,
  padding: 16,
};

/* ═══════════════════════════════════════════════════════════════
   1. לוגיקת חישוב ציון יומי (0-100)
   5 מדדים × 20 נק׳ = 100. כל מדד מנורמל לאחוז השלמה.
═══════════════════════════════════════════════════════════════ */

export function computeDailyScore({
  workoutDone,          // boolean — האם השלימה אימון היום (או יום מנוחה מתוכנן)
  isRestDay = false,    // יום מנוחה מתוכנן? ניתן 20 מלא
  calories,             // קלוריות שאכלה היום
  calorieGoal,
  protein,              // גרם חלבון
  proteinGoal,
  waterMl,
  waterGoalMl,
  sleepHours,           // שעות שינה מהלילה הקודם
}) {
  // אימון: 20 אם השלימה או יום מנוחה, 0 אחרת
  const workout_pts = (workoutDone || isRestDay) ? 20 : 0;

  // קלוריות: מלא 20 אם ±10% מהיעד, ירידה לינארית מחוץ לטווח
  const calRatio = calorieGoal > 0 ? calories / calorieGoal : 0;
  let calories_pts = 0;
  if (calRatio >= 0.9 && calRatio <= 1.1) calories_pts = 20;
  else if (calRatio >= 0.75 && calRatio <= 1.25) calories_pts = 14;
  else if (calRatio >= 0.5 && calRatio <= 1.5) calories_pts = 8;
  else if (calRatio > 0) calories_pts = 4;

  // חלבון: אחוז מהיעד, מוגבל ל-20
  const proteinRatio = proteinGoal > 0 ? Math.min(protein / proteinGoal, 1) : 0;
  const protein_pts = Math.round(proteinRatio * 20);

  // מים: אחוז מהיעד, מוגבל ל-20
  const waterRatio = waterGoalMl > 0 ? Math.min(waterMl / waterGoalMl, 1) : 0;
  const water_pts = Math.round(waterRatio * 20);

  // שינה: 7-9 שעות = מלא, 6 או 10 = 14, 5 או 11 = 8, פחות = 4
  let sleep_pts = 0;
  if (sleepHours >= 7 && sleepHours <= 9) sleep_pts = 20;
  else if (sleepHours >= 6 && sleepHours <= 10) sleep_pts = 14;
  else if (sleepHours >= 5 && sleepHours <= 11) sleep_pts = 8;
  else if (sleepHours > 0) sleep_pts = 4;

  const total_score = workout_pts + calories_pts + protein_pts + water_pts + sleep_pts;

  return { total_score, workout_pts, calories_pts, protein_pts, water_pts, sleep_pts };
}

/* ═══════════════════════════════════════════════════════════════
   2. כתיבה/קריאה מ-Supabase
═══════════════════════════════════════════════════════════════ */

export async function saveSleep(clientId, hours) {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('sleep_logs')
    .upsert(
      { client_id: clientId, hours: +hours, logged_for: today },
      { onConflict: 'client_id,logged_for' }
    )
    .select()
    .single();
  return { data, error };
}

export async function getTodaySleep(clientId) {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from('sleep_logs')
    .select('hours')
    .eq('client_id', clientId)
    .eq('logged_for', today)
    .maybeSingle();
  return data?.hours || 0;
}

export async function saveDailyScore(clientId, breakdown) {
  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabase
    .from('daily_scores')
    .upsert(
      {
        client_id: clientId,
        score_date: today,
        total_score: breakdown.total_score,
        workout_pts: breakdown.workout_pts,
        calories_pts: breakdown.calories_pts,
        protein_pts: breakdown.protein_pts,
        water_pts: breakdown.water_pts,
        sleep_pts: breakdown.sleep_pts,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'client_id,score_date' }
    );
  return { error };
}

export async function getWeeklyScores(clientId) {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  const { data } = await supabase
    .from('daily_scores')
    .select('*')
    .eq('client_id', clientId)
    .gte('score_date', weekAgo.toISOString().slice(0, 10))
    .order('score_date', { ascending: true });
  return data || [];
}

/* ═══════════════════════════════════════════════════════════════
   3. הגדרת תגי הישג וחישוב זכיות
═══════════════════════════════════════════════════════════════ */

export const BADGES = {
  perfect_day:   { icon: '⭐', label: 'יום מושלם',     desc: 'ציון 95+ ביום אחד' },
  workout_done:  { icon: '💪', label: 'אלופת אימון',  desc: 'השלמת אימון היום' },
  protein_hero:  { icon: '🥩', label: 'מלכת החלבון',  desc: 'השגת יעד חלבון' },
  hydration:     { icon: '💧', label: 'הידרציה מלאה', desc: 'השגת יעד מים' },
  good_sleep:    { icon: '😴', label: 'שינה טובה',    desc: '7-9 שעות שינה' },
  week_streak:   { icon: '🔥', label: 'שבוע רצוף',    desc: '7 ימים עם ציון 60+' },
  early_bird:    { icon: '🌅', label: 'ציפור בוקר',   desc: 'דיווח לפני 10:00' },
};

export async function checkAndAwardBadges(clientId, breakdown, sleepHours) {
  const earned = [];
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();

  const toAward = [];
  if (breakdown.total_score >= 95) toAward.push('perfect_day');
  if (breakdown.workout_pts === 20) toAward.push('workout_done');
  if (breakdown.protein_pts === 20) toAward.push('protein_hero');
  if (breakdown.water_pts === 20) toAward.push('hydration');
  if (sleepHours >= 7 && sleepHours <= 9) toAward.push('good_sleep');
  if (now.getHours() < 10) toAward.push('early_bird');

  // בדוק streak שבועי
  const { data: lastWeek } = await supabase
    .from('daily_scores')
    .select('score_date, total_score')
    .eq('client_id', clientId)
    .gte('score_date', new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10))
    .order('score_date', { ascending: false });

  if (lastWeek && lastWeek.length >= 7 && lastWeek.every(d => d.total_score >= 60)) {
    toAward.push('week_streak');
  }

  // הוסף לדטאבייס (UNIQUE מונע כפילויות)
  for (const code of toAward) {
    const { error } = await supabase.from('achievements').insert({
      client_id: clientId,
      badge_code: code,
      metadata: { score: breakdown.total_score },
    });
    if (!error) earned.push(code);
  }

  return earned;
}

export async function getRecentBadges(clientId, days = 7) {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data } = await supabase
    .from('achievements')
    .select('*')
    .eq('client_id', clientId)
    .gte('earned_at', since)
    .order('earned_at', { ascending: false });
  return data || [];
}

/* ═══════════════════════════════════════════════════════════════
   4. קומפוננטה: דיווח שינה (למסך הבית של המתאמנת)
═══════════════════════════════════════════════════════════════ */

export function SleepCard({ clientId, onUpdate }) {
  const [hours, setHours] = useState(0);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    getTodaySleep(clientId).then(h => {
      setHours(h);
      setSaved(h > 0);
      setLoading(false);
    });
  }, [clientId]);

  const handleSave = async (h) => {
    setHours(h);
    await saveSleep(clientId, h);
    setSaved(true);
    if (onUpdate) onUpdate(h);
  };

  if (loading) return null;

  return (
    <section style={{ ...card, background: saved ? COLORS.primarySoft : 'white' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>😴</span>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: COLORS.text }}>שעות שינה אתמול</p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: COLORS.textMuted }}>
              {saved ? `רשמת ${hours} שעות ✓` : 'איך ישנת?'}
            </p>
          </div>
        </div>
        {saved && <span style={{ fontSize: 20, color: COLORS.primaryDark }}>{hours}h</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4 }}>
        {[5, 6, 7, 8, 9, 10].map(h => {
          const isSelected = hours === h;
          const isGood = h >= 7 && h <= 9;
          return (
            <button
              key={h}
              onClick={() => handleSave(h)}
              style={{
                background: isSelected ? COLORS.primary : (isGood ? COLORS.primarySoft : 'white'),
                color: isSelected ? 'white' : COLORS.text,
                border: `1px solid ${isSelected ? COLORS.primary : COLORS.border}`,
                borderRadius: 10,
                padding: '10px 0',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {h}
            </button>
          );
        })}
      </div>
      <p style={{ margin: '8px 0 0', fontSize: 10, color: COLORS.textMuted, textAlign: 'center' }}>
        💡 7-9 שעות אופטימלי להתאוששות
      </p>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   5. קומפוננטה: ציון יומי עם פירוט
═══════════════════════════════════════════════════════════════ */

export function DailyScoreCard({ breakdown }) {
  if (!breakdown) return null;
  const { total_score, workout_pts, calories_pts, protein_pts, water_pts, sleep_pts } = breakdown;

  const getScoreColor = (s) => {
    if (s >= 80) return '#6B9B6B';
    if (s >= 60) return COLORS.primaryDark;
    if (s >= 40) return '#C9A34E';
    return '#C88A8A';
  };

  const getScoreLabel = (s) => {
    if (s >= 90) return 'יום מושלם! ⭐';
    if (s >= 75) return 'יום מצוין 💜';
    if (s >= 60) return 'יום טוב 👍';
    if (s >= 40) return 'יש מקום לשיפור';
    return 'בואי נתחיל';
  };

  const metrics = [
    { icon: '💪', label: 'אימון',   pts: workout_pts  },
    { icon: '🔥', label: 'קלוריות', pts: calories_pts },
    { icon: '🥩', label: 'חלבון',   pts: protein_pts  },
    { icon: '💧', label: 'מים',     pts: water_pts    },
    { icon: '😴', label: 'שינה',    pts: sleep_pts    },
  ];

  return (
    <section style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
        {/* עיגול ציון */}
        <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
          <svg width={72} height={72} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={36} cy={36} r={32} fill="none" stroke={COLORS.primarySoft} strokeWidth={6} />
            <circle
              cx={36} cy={36} r={32}
              fill="none"
              stroke={getScoreColor(total_score)}
              strokeWidth={6}
              strokeDasharray={`${(total_score / 100) * 201} 201`}
              strokeLinecap="round"
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 700, color: getScoreColor(total_score),
          }}>
            {total_score}
          </div>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: COLORS.text }}>ציון היום</p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: COLORS.textMuted }}>{getScoreLabel(total_score)}</p>
        </div>
      </div>

      {/* 5 בארים */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {metrics.map(m => (
          <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, width: 20 }}>{m.icon}</span>
            <span style={{ fontSize: 11, color: COLORS.textMuted, width: 50 }}>{m.label}</span>
            <div style={{ flex: 1, height: 6, background: COLORS.primarySoft, borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(m.pts / 20) * 100}%`,
                background: m.pts === 20 ? '#6B9B6B' : COLORS.primary,
                transition: 'width 0.4s',
              }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.text, width: 30, textAlign: 'left' }}>
              {m.pts}/20
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   6. קומפוננטה: תגי הישג
═══════════════════════════════════════════════════════════════ */

export function BadgesCard({ clientId }) {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    getRecentBadges(clientId, 30).then(b => {
      setBadges(b);
      setLoading(false);
    });
  }, [clientId]);

  if (loading) return null;

  // קבץ לפי badge_code (רק אחד מכל סוג)
  const unique = {};
  badges.forEach(b => { if (!unique[b.badge_code]) unique[b.badge_code] = b; });
  const recent = Object.values(unique).slice(0, 6);

  return (
    <section style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: COLORS.text }}>🏆 הישגים אחרונים</p>
        <span style={{ fontSize: 11, color: COLORS.textMuted }}>{recent.length}/7</span>
      </div>

      {recent.length === 0 ? (
        <p style={{ margin: 0, fontSize: 12, color: COLORS.textMuted, textAlign: 'center', padding: '12px 0' }}>
          עוד לא זכית בתגים — דווחי היום ותקבלי הראשון! 💜
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {Object.entries(BADGES).slice(0, 6).map(([code, meta]) => {
            const earned = unique[code];
            return (
              <div key={code} style={{
                background: earned ? COLORS.primarySoft : '#F8F6FB',
                border: `1px solid ${earned ? COLORS.primary : COLORS.border}`,
                borderRadius: 12,
                padding: 10,
                textAlign: 'center',
                opacity: earned ? 1 : 0.4,
              }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{meta.icon}</div>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: COLORS.text }}>{meta.label}</p>
                <p style={{ margin: '2px 0 0', fontSize: 9, color: COLORS.textMuted, lineHeight: 1.3 }}>
                  {meta.desc}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   7. קומפוננטה: דוח שבועי (משותף ללקוחה ולמאמנת)
═══════════════════════════════════════════════════════════════ */

export function WeeklyReportCard({ clientId, clientName = null }) {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    getWeeklyScores(clientId).then(s => {
      setScores(s);
      setLoading(false);
    });
  }, [clientId]);

  if (loading || scores.length === 0) {
    return (
      <section style={card}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: COLORS.text }}>📊 דוח שבועי</p>
        <p style={{ margin: '8px 0 0', fontSize: 12, color: COLORS.textMuted, textAlign: 'center', padding: '12px 0' }}>
          {loading ? 'טוענת...' : 'עוד לא צברנו מספיק נתונים — דווחי עוד כמה ימים 💜'}
        </p>
      </section>
    );
  }

  const avgScore = Math.round(scores.reduce((s, d) => s + d.total_score, 0) / scores.length);
  const avgWorkout = Math.round(scores.reduce((s, d) => s + d.workout_pts, 0) / scores.length);
  const avgCal = Math.round(scores.reduce((s, d) => s + d.calories_pts, 0) / scores.length);
  const avgProtein = Math.round(scores.reduce((s, d) => s + d.protein_pts, 0) / scores.length);
  const avgWater = Math.round(scores.reduce((s, d) => s + d.water_pts, 0) / scores.length);
  const avgSleep = Math.round(scores.reduce((s, d) => s + d.sleep_pts, 0) / scores.length);

  // גרף בארים
  const days = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
  const todayIdx = new Date().getDay();
  const weekData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const match = scores.find(s => s.score_date === dateStr);
    weekData.push({
      day: days[d.getDay()],
      score: match?.total_score || 0,
      isToday: i === 0,
    });
  }

  // מצא את החלש ביותר להציע שיפור
  const breakdown = [
    { label: 'אימון',   avg: avgWorkout,  icon: '💪' },
    { label: 'קלוריות', avg: avgCal,      icon: '🔥' },
    { label: 'חלבון',   avg: avgProtein,  icon: '🥩' },
    { label: 'מים',     avg: avgWater,    icon: '💧' },
    { label: 'שינה',    avg: avgSleep,    icon: '😴' },
  ].sort((a, b) => b.avg - a.avg);
  const weakest = breakdown[breakdown.length - 1];
  const strongest = breakdown[0];

  return (
    <section style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: COLORS.text }}>
            📊 דוח שבועי{clientName ? ` · ${clientName}` : ''}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: COLORS.textMuted }}>
            {scores.length} ימי דיווח · ממוצע {avgScore}/100
          </p>
        </div>
      </div>

      {/* גרף בארים של השבוע */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 90, marginBottom: 14, padding: '0 4px' }}>
        {weekData.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: '100%',
              height: `${Math.max((d.score / 100) * 70, 3)}px`,
              background: d.isToday ? COLORS.primary : (d.score >= 60 ? COLORS.mint : COLORS.primarySoft),
              borderRadius: 6,
              transition: 'height 0.4s',
            }} />
            <span style={{ fontSize: 10, color: d.isToday ? COLORS.primaryDark : COLORS.textMuted, fontWeight: d.isToday ? 700 : 500 }}>
              {d.day}
            </span>
          </div>
        ))}
      </div>

      {/* תובנות */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ background: '#E8F5E9', borderRadius: 10, padding: 10 }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#2E7D32' }}>
            💚 נקודת חוזק: {strongest.icon} {strongest.label} ({strongest.avg}/20 בממוצע)
          </p>
        </div>
        <div style={{ background: COLORS.amberSoft, borderRadius: 10, padding: 10 }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#8B6914' }}>
            🎯 לשיפור: {weakest.icon} {weakest.label} ({weakest.avg}/20 בממוצע)
          </p>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   8. קומפוננטה לצד המאמנת: סקירת כל הלקוחות
═══════════════════════════════════════════════════════════════ */

export function CoachWeeklyOverview({ coachId }) {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!coachId) return;
    (async () => {
      const { data } = await supabase
        .from('weekly_client_summary')
        .select('*')
        .eq('coach_id', coachId)
        .order('avg_score', { ascending: false });
      setSummary(data || []);
      setLoading(false);
    })();
  }, [coachId]);

  if (loading) return null;

  return (
    <section style={card}>
      <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: COLORS.text }}>
        📊 סקירה שבועית · כל הלקוחות
      </p>

      {summary.length === 0 ? (
        <p style={{ margin: 0, fontSize: 12, color: COLORS.textMuted, textAlign: 'center', padding: '12px 0' }}>
          אין עדיין נתונים
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {summary.map(c => {
            const scoreColor = c.avg_score >= 75 ? '#6B9B6B' :
                               c.avg_score >= 50 ? COLORS.primaryDark :
                               c.avg_score >= 30 ? '#C9A34E' : '#C88A8A';
            return (
              <div key={c.client_id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: 10, background: COLORS.bg, borderRadius: 10,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: scoreColor, color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, flexShrink: 0,
                }}>
                  {c.avg_score}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: COLORS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.full_name}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 10, color: COLORS.textMuted }}>
                    {c.days_logged}/7 ימים · ~{c.avg_sleep_hours_est}h שינה
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   9. קומפוננטה לצד המאמנת: דוח מלא של לקוחה אחת
═══════════════════════════════════════════════════════════════ */

export function CoachClientWellness({ client }) {
  if (!client) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <BadgesCard clientId={client.id} />
      <WeeklyReportCard clientId={client.id} clientName={client.name} />
    </div>
  );
}
