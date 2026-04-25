// ═══════════════════════════════════════════════════════════════
// src/insights.jsx
// תובנות AI שבועיות — דפוסי לקוחות + ייעול תהליכי האפליקציה
// ═══════════════════════════════════════════════════════════════
// רץ אוטומטית כל יום ראשון בבוקר (אם לא רץ עוד השבוע).
// משתמש ב-Claude API דרך קריאת fetch בצד הלקוח.
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

const COLORS = {
  bg: '#F5F2FA', primary: '#B19CD9', primaryDark: '#8B72B5',
  primarySoft: '#E8DFF5', mint: '#C5B3E0', peach: '#F5D0B5',
  text: '#2E2A3D', textMuted: '#756B85', border: '#DDD0EB',
  green: '#6B9B6B', amber: '#E8C96A', red: '#C88A8A',
};

const card = {
  background: 'white', border: `1px solid ${COLORS.border}`,
  borderRadius: 16, padding: 16,
};

/* ═══════════════════════════════════════════════════════════
   תאריכים — ראשון של השבוע הנוכחי / הקודם
═══════════════════════════════════════════════════════════ */

function getSundayOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0=ראשון
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dateStr(d) {
  return d.toISOString().slice(0, 10);
}

/* ═══════════════════════════════════════════════════════════
   איסוף נתונים גולמיים על השבוע האחרון
═══════════════════════════════════════════════════════════ */

async function gatherWeeklyData(coachId) {
  const weekStart = getSundayOfWeek();
  weekStart.setDate(weekStart.getDate() - 7); // השבוע שעבר
  const weekStartStr = dateStr(weekStart);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndStr = dateStr(weekEnd);

  // 1. כל הלקוחות של המאמנת
  const { data: clients } = await supabase
    .from('clients')
    .select('id, full_name, current_weight, target_weight, start_weight, streak, created_at')
    .eq('coach_id', coachId);

  if (!clients || clients.length === 0) return null;

  const clientIds = clients.map(c => c.id);

  // 2. ציונים יומיים מהשבוע
  const { data: scores } = await supabase
    .from('daily_scores')
    .select('*')
    .in('client_id', clientIds)
    .gte('score_date', weekStartStr)
    .lte('score_date', weekEndStr);

  // 3. ארוחות מהשבוע
  const { data: meals } = await supabase
    .from('meals')
    .select('client_id, logged_at')
    .in('client_id', clientIds)
    .gte('logged_at', weekStartStr);

  // 4. אימונים שהושלמו השבוע
  const { data: completions } = await supabase
    .from('exercises')
    .select('workout_id, done, workouts!inner(client_id)')
    .gte('updated_at', weekStartStr);

  // 5. אירועי פעילות של המאמנת (לצורך תובנות אוטומציה)
  const { data: events } = await supabase
    .from('activity_events')
    .select('event_type, duration_ms, created_at, metadata')
    .eq('user_id', coachId)
    .gte('created_at', weekStartStr);

  // 6. הודעות שנשלחו השבוע (כדי להבין כמות תקשורת)
  const { data: messages } = await supabase
    .from('messages')
    .select('from_id, to_id, created_at')
    .or(`from_id.eq.${coachId},to_id.eq.${coachId}`)
    .gte('created_at', weekStartStr);

  return {
    weekStart: weekStartStr,
    weekEnd: weekEndStr,
    clients,
    scores: scores || [],
    meals: meals || [],
    completions: completions || [],
    events: events || [],
    messages: messages || [],
  };
}

/* ═══════════════════════════════════════════════════════════
   תובנות מבוססות-חוקים — מהיר, ללא AI
═══════════════════════════════════════════════════════════ */

function generateRuleBasedInsights(data) {
  if (!data) return [];
  const insights = [];
  const { clients, scores, meals, events, weekStart } = data;

  // ───── תובנות על לקוחות ─────

  // לקוחות שלא דיווחו 3+ ימים
  const today = new Date().toISOString().slice(0, 10);
  const inactiveClients = clients.filter(c => {
    const clientMeals = meals.filter(m => m.client_id === c.id);
    if (clientMeals.length === 0) return true;
    const lastMeal = clientMeals
      .map(m => m.logged_at.slice(0, 10))
      .sort()
      .reverse()[0];
    const daysSince = Math.floor((new Date(today) - new Date(lastMeal)) / 86400000);
    return daysSince >= 3;
  });

  if (inactiveClients.length > 0) {
    insights.push({
      insight_type: 'client_pattern',
      severity: 'action_needed',
      title: `${inactiveClients.length} לקוחות לא דיווחו 3+ ימים`,
      body: `הלקוחות הבאים לא רשמו ארוחות מספר ימים: ${inactiveClients.map(c => c.full_name).join(', ')}. שווה לשלוח הודעת תזכורת אישית.`,
      action_data: {
        type: 'send_message',
        client_ids: inactiveClients.map(c => c.id),
        suggested_message: 'היי 💜 שמתי לב שלא רשמת כמה ימים — הכל בסדר? אני כאן אם צריך משהו ✨',
      },
    });
  }

  // לקוחות עם streak מצוין
  const topPerformers = clients.filter(c => (c.streak || 0) >= 7);
  if (topPerformers.length > 0) {
    insights.push({
      insight_type: 'client_pattern',
      severity: 'info',
      title: `🔥 ${topPerformers.length} לקוחות עם streak של 7+ ימים`,
      body: `${topPerformers.map(c => `${c.full_name} (${c.streak} ימים)`).join(', ')}. שווה לשלוח להן הודעת חיזוק!`,
      action_data: {
        type: 'send_message',
        client_ids: topPerformers.map(c => c.id),
        suggested_message: 'תותחית! ראיתי שכבר {streak} ימים את עקבית — אני כל כך גאה בך 💜🔥',
      },
    });
  }

  // לקוחות שהציון השבועי שלהן ירד מהשבוע הקודם
  const clientAvgScores = {};
  clients.forEach(c => {
    const cs = scores.filter(s => s.client_id === c.id);
    if (cs.length > 0) {
      clientAvgScores[c.id] = {
        name: c.full_name,
        avg: Math.round(cs.reduce((s, x) => s + x.total_score, 0) / cs.length),
        days: cs.length,
      };
    }
  });

  const lowScorers = Object.values(clientAvgScores).filter(c => c.avg < 50 && c.days >= 3);
  if (lowScorers.length > 0) {
    insights.push({
      insight_type: 'client_pattern',
      severity: 'warning',
      title: `⚠️ ${lowScorers.length} לקוחות עם ציון נמוך השבוע`,
      body: `הלקוחות עם ציון ממוצע מתחת ל-50: ${lowScorers.map(c => `${c.name} (${c.avg}/100)`).join(', ')}. ייתכן שחסר להן תמיכה או שהיעדים גבוהים מדי.`,
      action_data: { type: 'review_clients', client_names: lowScorers.map(c => c.name) },
    });
  }

  // לקוחות שהגיעו ליעד המשקל
  const reachedTarget = clients.filter(c => {
    if (!c.current_weight || !c.target_weight) return false;
    return Math.abs(c.current_weight - c.target_weight) <= 0.5;
  });
  if (reachedTarget.length > 0) {
    insights.push({
      insight_type: 'client_pattern',
      severity: 'info',
      title: `🎯 ${reachedTarget.length} לקוחות הגיעו ליעד המשקל!`,
      body: `${reachedTarget.map(c => c.full_name).join(', ')} הגיעו ליעד המשקל שלהן. זה הזמן לקבוע יעד חדש או לעבור למצב שמירה.`,
      action_data: { type: 'celebrate_clients', client_ids: reachedTarget.map(c => c.id) },
    });
  }

  // ───── תובנות על האפליקציה (אוטומציה) ─────

  // איזה תהליך גוזל הכי הרבה זמן?
  const eventTimings = {};
  events.forEach(e => {
    if (!e.duration_ms) return;
    if (!eventTimings[e.event_type]) eventTimings[e.event_type] = { count: 0, totalMs: 0 };
    eventTimings[e.event_type].count++;
    eventTimings[e.event_type].totalMs += e.duration_ms;
  });

  const eventLabels = {
    meal_plan_created: 'יצירת תפריטים',
    workout_assigned: 'הקצאת אימונים',
    macro_calculated: 'חישוב מאקרו',
    message_sent: 'שליחת הודעות',
    client_updated: 'עדכון פרטי לקוחות',
  };

  const slowProcesses = Object.entries(eventTimings)
    .map(([type, stats]) => ({
      type,
      label: eventLabels[type] || type,
      count: stats.count,
      avgMs: stats.totalMs / stats.count,
      totalMin: Math.round(stats.totalMs / 60000),
    }))
    .filter(p => p.totalMin >= 10)
    .sort((a, b) => b.totalMin - a.totalMin);

  if (slowProcesses.length > 0) {
    const top = slowProcesses[0];
    let suggestion = '';
    if (top.type === 'meal_plan_created' && top.count >= 3) {
      suggestion = `שווה לשמור את התפריטים הפופולריים שלך כתבניות בספרייה — תוכלי לשכפל ללקוחות חדשות בלחיצה אחת במקום לבנות מחדש.`;
    } else if (top.type === 'workout_assigned' && top.count >= 3) {
      suggestion = `הקצית אימונים ${top.count} פעמים השבוע — אפשר ליצור תוכניות אימון כתבניות חוזרות.`;
    } else if (top.type === 'macro_calculated' && top.count >= 5) {
      suggestion = `חישוב המאקרו לוקח לך הרבה זמן — אם רוב הלקוחות שלך עם פרופיל דומה, אפשר לשמור תבנית מאקרו ברירת מחדל.`;
    } else {
      suggestion = `שווה לבדוק אם אפשר לאוטומט חלק מהשלבים החוזרים בתהליך הזה.`;
    }

    insights.push({
      insight_type: 'app_workflow',
      severity: 'info',
      title: `⏱️ "${top.label}" לקח ${top.totalMin} דקות השבוע`,
      body: `${suggestion}`,
      action_data: { type: 'workflow_optimization', event_type: top.type, stats: top },
    });
  }

  // הודעות חוזרות — אם המאמנת שלחה את אותה הודעה ל-3+ לקוחות
  const messageCount = data.messages.filter(m => m.from_id === data.clients[0]?.coach_id || m.to_id !== data.clients[0]?.coach_id).length;
  if (messageCount >= 20) {
    insights.push({
      insight_type: 'app_workflow',
      severity: 'info',
      title: `💬 שלחת ${messageCount} הודעות השבוע`,
      body: `אם יש הודעות שאת שולחת באופן קבוע (תזכורות, ברכות, חיזוקים), שווה ליצור תבניות הודעות שיהיו זמינות בלחיצה אחת.`,
      action_data: { type: 'message_templates_suggestion' },
    });
  }

  return insights;
}

/* ═══════════════════════════════════════════════════════════
   תובנות מבוססות-AI — דורש Claude API
═══════════════════════════════════════════════════════════ */

async function generateAiInsights(data) {
  if (!data) return [];

  const prompt = `את מנתחת נתונים של מאמנת כושר. אתן לך נתונים על השבוע האחרון של המאמנת והלקוחות שלה.

נתונים:
- ${data.clients.length} לקוחות פעילים
- ${data.scores.length} ימי ציון נרשמו השבוע
- ${data.meals.length} ארוחות נרשמו
- ${data.completions.length} תרגילים הושלמו

ציוני לקוחות (ממוצע שבועי):
${data.clients.slice(0, 10).map(c => {
  const cs = data.scores.filter(s => s.client_id === c.id);
  const avg = cs.length > 0 ? Math.round(cs.reduce((s, x) => s + x.total_score, 0) / cs.length) : 'ללא דיווח';
  return `- ${c.full_name}: ${avg}/100 (${cs.length} ימים), streak: ${c.streak || 0}`;
}).join('\n')}

תני 2-3 תובנות קצרות ומעשיות (לכל היותר 80 מילים לתובנה). פורמט JSON בלבד:
[{"title": "כותרת קצרה", "body": "תוכן", "severity": "info|warning|action_needed"}]`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      })
    });
    const json = await response.json();
    const text = json.content?.map(c => c.text || '').join('').replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(text);
    return parsed.map(p => ({
      insight_type: 'weekly_summary',
      severity: p.severity || 'info',
      title: p.title,
      body: p.body,
      action_data: { source: 'ai' },
    }));
  } catch (e) {
    console.warn('AI insights failed:', e);
    return [];
  }
}

/* ═══════════════════════════════════════════════════════════
   הפונקציה הראשית — יוצרת תובנות לשבוע
═══════════════════════════════════════════════════════════ */

export async function generateWeeklyInsights(coachId) {
  const weekStart = getSundayOfWeek();
  const weekStartStr = dateStr(weekStart);

  // בדוק אם כבר רץ השבוע
  const { data: existing } = await supabase
    .from('ai_insights')
    .select('id')
    .eq('coach_id', coachId)
    .eq('week_starting', weekStartStr)
    .limit(1);

  if (existing && existing.length > 0) {
    return { alreadyRan: true };
  }

  // אסוף נתונים
  const data = await gatherWeeklyData(coachId);
  if (!data) return { alreadyRan: false, count: 0 };

  // צור תובנות (חוקים + AI)
  const ruleInsights = generateRuleBasedInsights(data);
  const aiInsights = await generateAiInsights(data);

  const allInsights = [...ruleInsights, ...aiInsights].map(i => ({
    coach_id: coachId,
    week_starting: weekStartStr,
    ...i,
  }));

  if (allInsights.length === 0) return { alreadyRan: false, count: 0 };

  // שמור ב-DB
  const { error } = await supabase.from('ai_insights').insert(allInsights);
  if (error) {
    console.error('Save insights error:', error);
    return { alreadyRan: false, count: 0, error };
  }

  return { alreadyRan: false, count: allInsights.length };
}

/* ═══════════════════════════════════════════════════════════
   קומפוננטה: מסך תובנות במאמנת
═══════════════════════════════════════════════════════════ */

export function InsightsScreen({ coachId }) {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadInsights();
    // הפעל אוטומטית פעם אחת ביום ראשון
    autoGenerateIfSunday();
  }, [coachId]);

  const autoGenerateIfSunday = async () => {
    if (!coachId) return;
    const today = new Date();
    if (today.getDay() !== 0) return; // רק ביום ראשון
    setGenerating(true);
    await generateWeeklyInsights(coachId);
    setGenerating(false);
    loadInsights();
  };

  const loadInsights = async () => {
    if (!coachId) return;
    setLoading(true);
    const { data } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('coach_id', coachId)
      .eq('is_dismissed', false)
      .order('created_at', { ascending: false })
      .limit(30);
    setInsights(data || []);
    setLoading(false);
  };

  const handleManualGenerate = async () => {
    setGenerating(true);
    const result = await generateWeeklyInsights(coachId);
    setGenerating(false);
    if (result.alreadyRan) {
      alert('התובנות לשבוע הזה כבר נוצרו 💜');
    } else if (result.count > 0) {
      loadInsights();
    } else {
      alert('לא נמצאו תובנות חדשות השבוע — אולי עוד אין מספיק נתונים');
    }
  };

  const handleDismiss = async (id) => {
    await supabase.from('ai_insights').update({ is_dismissed: true }).eq('id', id);
    setInsights(prev => prev.filter(i => i.id !== id));
  };

  const handleMarkRead = async (id) => {
    await supabase.from('ai_insights').update({ is_read: true }).eq('id', id);
    setInsights(prev => prev.map(i => i.id === id ? { ...i, is_read: true } : i));
  };

  const filtered = insights.filter(i => {
    if (filter === 'clients') return i.insight_type === 'client_pattern' || i.insight_type === 'weekly_summary';
    if (filter === 'app') return i.insight_type === 'app_workflow';
    return true;
  });

  const severityStyles = {
    info: { bg: COLORS.primarySoft, border: COLORS.primary, icon: '💡' },
    warning: { bg: '#FFF4E5', border: COLORS.amber, icon: '⚠️' },
    action_needed: { bg: '#FFE5E5', border: COLORS.red, icon: '🚨' },
  };

  return (
    <main style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: COLORS.primaryDark }}>
          ✨ תובנות AI
        </h2>
        <button
          onClick={handleManualGenerate}
          disabled={generating}
          style={{
            padding: '8px 14px',
            background: COLORS.primary, color: 'white',
            border: 'none', borderRadius: 10,
            fontSize: 12, fontWeight: 600,
            cursor: generating ? 'default' : 'pointer',
            fontFamily: 'inherit',
            opacity: generating ? 0.6 : 1,
          }}
        >
          {generating ? '🔄 מייצרת...' : '🔄 רענני'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        {[
          { val: 'all', lbl: 'הכל' },
          { val: 'clients', lbl: '👥 על לקוחות' },
          { val: 'app', lbl: '⚙️ ייעול עבודה' },
        ].map(f => (
          <button
            key={f.val}
            onClick={() => setFilter(f.val)}
            style={{
              padding: '6px 12px', border: 'none',
              background: filter === f.val ? COLORS.primary : COLORS.primarySoft,
              color: filter === f.val ? 'white' : COLORS.primaryDark,
              borderRadius: 999, fontSize: 11, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}
          >
            {f.lbl}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: COLORS.textMuted, padding: 20 }}>טוענת...</p>
      ) : filtered.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✨</div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: COLORS.text }}>
            אין תובנות חדשות
          </p>
          <p style={{ margin: '6px 0 16px', fontSize: 12, color: COLORS.textMuted, lineHeight: 1.5 }}>
            התובנות נוצרות אוטומטית כל יום ראשון בבוקר.<br/>
            אפשר גם לרענן ידנית בכפתור למעלה.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(insight => {
            const sev = severityStyles[insight.severity] || severityStyles.info;
            return (
              <div key={insight.id} style={{
                ...card,
                background: sev.bg,
                border: `1px solid ${sev.border}`,
                opacity: insight.is_read ? 0.85 : 1,
              }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 22 }}>{sev.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: COLORS.text }}>
                      {insight.title}
                    </p>
                    <p style={{ margin: '6px 0 0', fontSize: 12, color: COLORS.text, lineHeight: 1.5 }}>
                      {insight.body}
                    </p>

                    {insight.action_data?.suggested_message && (
                      <div style={{
                        marginTop: 10, padding: 10,
                        background: 'rgba(255,255,255,0.5)', borderRadius: 8,
                        fontSize: 11, color: COLORS.text, fontStyle: 'italic',
                      }}>
                        💬 הצעת הודעה: "{insight.action_data.suggested_message}"
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                      {!insight.is_read && (
                        <button
                          onClick={() => handleMarkRead(insight.id)}
                          style={{
                            padding: '5px 10px', background: 'white',
                            border: `1px solid ${sev.border}`, borderRadius: 8,
                            fontSize: 10, fontWeight: 600, color: COLORS.text,
                            cursor: 'pointer', fontFamily: 'inherit',
                          }}
                        >
                          ✓ קראתי
                        </button>
                      )}
                      <button
                        onClick={() => handleDismiss(insight.id)}
                        style={{
                          padding: '5px 10px', background: 'transparent',
                          border: 'none', fontSize: 10, color: COLORS.textMuted,
                          cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        סגור ✕
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p style={{ fontSize: 10, color: COLORS.textMuted, textAlign: 'center', marginTop: 8 }}>
        💡 התובנות מתעדכנות אוטומטית בכל יום ראשון בבוקר
      </p>
    </main>
  );
}
