// ═══════════════════════════════════════════════════════════════
// src/feedback.jsx
// טפסי שביעות רצון אחרי תוכנית — מתאמנת ממלאת, מאמנת רואה תובנות
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
   API
═══════════════════════════════════════════════════════════ */

// בודק האם יש טופס פתוח לאותה לקוחה (שטרם מולא)
export async function getPendingFeedback(clientId) {
  const { data } = await supabase
    .from('feedback_forms')
    .select('*')
    .eq('client_id', clientId)
    .is('filled_at', null)
    .order('triggered_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

// המאמנת מפעילה טופס ידנית (אחרי 4/8/12 שבועות)
export async function triggerFeedback(coachId, clientId, weeksActive) {
  const { data, error } = await supabase
    .from('feedback_forms')
    .insert({
      coach_id: coachId,
      client_id: clientId,
      weeks_active: weeksActive,
      triggered_at: new Date().toISOString().slice(0, 10),
    })
    .select()
    .single();
  return { data, error };
}

export async function submitFeedback(formId, answers) {
  return supabase
    .from('feedback_forms')
    .update({
      ...answers,
      filled_at: new Date().toISOString(),
    })
    .eq('id', formId);
}

export async function listCoachFeedback(coachId) {
  const { data } = await supabase
    .from('feedback_forms')
    .select('*, clients(full_name)')
    .eq('coach_id', coachId)
    .not('filled_at', 'is', null)
    .order('filled_at', { ascending: false });
  return data || [];
}

/* ═══════════════════════════════════════════════════════════
   קומפוננטה: באנר "יש לך טופס למלא"
═══════════════════════════════════════════════════════════ */

export function FeedbackBanner({ clientId, onOpen }) {
  const [pending, setPending] = useState(null);

  useEffect(() => {
    if (!clientId) return;
    getPendingFeedback(clientId).then(setPending);
  }, [clientId]);

  if (!pending) return null;

  return (
    <section style={{
      ...card,
      background: 'linear-gradient(135deg, #F4C2C2 0%, #E8DFF5 100%)',
      border: 'none', cursor: 'pointer',
    }} onClick={() => onOpen(pending)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 32 }}>📝</span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: COLORS.text }}>
            יש לך טופס משוב חדש
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: COLORS.text }}>
            ספיר תשמח לשמוע מה את חושבת אחרי {pending.weeks_active || 'כמה'} שבועות בתוכנית 💜
          </p>
        </div>
        <span style={{ fontSize: 18, color: COLORS.primaryDark }}>←</span>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   קומפוננטה: טופס המשוב עצמו
═══════════════════════════════════════════════════════════ */

export function FeedbackForm({ form, onClose, onSubmit }) {
  const [answers, setAnswers] = useState({
    satisfaction: 0,
    difficulty: 0,
    meal_quality: 0,
    workout_quality: 0,
    coach_support: 0,
    what_worked: '',
    what_to_improve: '',
    would_recommend: null,
    additional_notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const setAns = (key, val) => setAnswers(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    if (answers.satisfaction === 0) {
      alert('נא לדרג את שביעות הרצון הכוללת');
      return;
    }
    setSubmitting(true);
    const { error } = await submitFeedback(form.id, answers);
    setSubmitting(false);
    if (error) {
      alert('שגיאה: ' + error.message);
    } else {
      onSubmit && onSubmit();
      onClose && onClose();
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: COLORS.bg,
      zIndex: 200, overflowY: 'auto', padding: 14,
      direction: 'rtl', fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: COLORS.primaryDark }}>
          📝 טופס משוב
        </h2>
        <button onClick={onClose} style={{
          background: 'transparent', border: 'none', fontSize: 22,
          cursor: 'pointer', color: COLORS.textMuted,
        }}>✕</button>
      </div>

      <p style={{ fontSize: 12, color: COLORS.textMuted, lineHeight: 1.6, marginBottom: 16 }}>
        תודה שאת לוקחת את הזמן למלא! זה עוזר לי לשפר את התוכניות עבור מתאמנות חדשות 💜
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        <RatingQuestion
          label="כמה את מרוצה מהתוכנית באופן כללי?"
          value={answers.satisfaction}
          onChange={(v) => setAns('satisfaction', v)}
        />

        <RatingQuestion
          label="כמה התוכנית הייתה מאתגרת?"
          value={answers.difficulty}
          onChange={(v) => setAns('difficulty', v)}
          minLabel="קלה מדי"
          maxLabel="קשה מדי"
        />

        <RatingQuestion
          label="כמה אהבת את הארוחות?"
          value={answers.meal_quality}
          onChange={(v) => setAns('meal_quality', v)}
        />

        <RatingQuestion
          label="כמה אהבת את האימונים?"
          value={answers.workout_quality}
          onChange={(v) => setAns('workout_quality', v)}
        />

        <RatingQuestion
          label="כמה הרגשת תמיכה מספיר?"
          value={answers.coach_support}
          onChange={(v) => setAns('coach_support', v)}
        />

        <div style={card}>
          <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: COLORS.text }}>
            האם תמליצי לחברה?
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { val: true, lbl: '👍 בוודאי', color: '#E8F5E9', activeColor: '#2E7D32' },
              { val: false, lbl: '🤔 לא בטוחה', color: '#FFE5E5', activeColor: '#8B2E2E' },
            ].map(opt => {
              const active = answers.would_recommend === opt.val;
              return (
                <button key={String(opt.val)} onClick={() => setAns('would_recommend', opt.val)}
                  style={{
                    flex: 1, padding: 10, borderRadius: 10,
                    border: `1px solid ${active ? opt.activeColor : COLORS.border}`,
                    background: active ? opt.color : 'white',
                    color: active ? opt.activeColor : COLORS.text,
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                  {opt.lbl}
                </button>
              );
            })}
          </div>
        </div>

        <OpenQuestion
          label="מה עבד לך הכי טוב?"
          placeholder="לדוגמה: ההקלטות בבוקר, הארוחות הקלות לבישול..."
          value={answers.what_worked}
          onChange={(v) => setAns('what_worked', v)}
        />

        <OpenQuestion
          label="מה היית רוצה לשפר?"
          placeholder="כל הצעה תתקבל בברכה 💜"
          value={answers.what_to_improve}
          onChange={(v) => setAns('what_to_improve', v)}
        />

        <OpenQuestion
          label="עוד משהו שתרצי לחלוק?"
          placeholder="אופציונלי"
          value={answers.additional_notes}
          onChange={(v) => setAns('additional_notes', v)}
        />

        <button onClick={handleSubmit} disabled={submitting} style={{
          background: COLORS.primary, color: 'white', border: 'none',
          padding: 14, borderRadius: 12,
          fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          opacity: submitting ? 0.6 : 1,
          marginTop: 8,
        }}>
          {submitting ? 'שולחת...' : '✓ שלחי טופס'}
        </button>
      </div>
    </div>
  );
}

function RatingQuestion({ label, value, onChange, minLabel = 'ממש לא', maxLabel = 'מאוד' }) {
  return (
    <div style={card}>
      <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: COLORS.text }}>
        {label}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} onClick={() => onChange(n)} style={{
            flex: 1, padding: '12px 0', borderRadius: 10,
            border: 'none',
            background: value === n ? COLORS.primary : COLORS.primarySoft,
            color: value === n ? 'white' : COLORS.primaryDark,
            fontSize: 18, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            {n}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        <span style={{ fontSize: 9, color: COLORS.textMuted }}>{minLabel}</span>
        <span style={{ fontSize: 9, color: COLORS.textMuted }}>{maxLabel}</span>
      </div>
    </div>
  );
}

function OpenQuestion({ label, placeholder, value, onChange }) {
  return (
    <div style={card}>
      <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: COLORS.text }}>
        {label}
      </p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        style={{
          width: '100%', padding: 10,
          border: `1px solid ${COLORS.border}`, borderRadius: 8,
          fontSize: 12, fontFamily: 'inherit', resize: 'vertical',
          boxSizing: 'border-box', outline: 'none',
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   צד המאמנת — תובנות מצטברות
═══════════════════════════════════════════════════════════ */

export function CoachFeedbackInsights({ coachId }) {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!coachId) return;
    listCoachFeedback(coachId).then(d => {
      setForms(d);
      setLoading(false);
    });
  }, [coachId]);

  if (loading) return <p style={{ textAlign: 'center', color: COLORS.textMuted }}>טוענת...</p>;

  if (forms.length === 0) {
    return (
      <div style={{ ...card, textAlign: 'center', padding: 30 }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>📝</div>
        <p style={{ margin: 0, fontSize: 13, color: COLORS.textMuted }}>
          עוד אין משובים שמולאו
        </p>
      </div>
    );
  }

  // ממוצעים
  const avg = (key) => {
    const vals = forms.filter(f => f[key]).map(f => f[key]);
    return vals.length > 0 ? (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1) : '–';
  };

  const recommendCount = forms.filter(f => f.would_recommend === true).length;
  const recommendPct = forms.length > 0 ? Math.round(recommendCount / forms.length * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={card}>
        <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: COLORS.text }}>
          📊 ממוצעים מתוך {forms.length} משובים
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          <Metric label="שביעות רצון" value={avg('satisfaction')} max={5} icon="💜" />
          <Metric label="קושי" value={avg('difficulty')} max={5} icon="💪" />
          <Metric label="ארוחות" value={avg('meal_quality')} max={5} icon="🍽️" />
          <Metric label="אימונים" value={avg('workout_quality')} max={5} icon="🏋️" />
          <Metric label="תמיכה" value={avg('coach_support')} max={5} icon="🤗" />
          <Metric label="ימליצו" value={`${recommendPct}%`} icon="👍" />
        </div>
      </div>

      <div style={card}>
        <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: COLORS.text }}>
          💬 משובים אחרונים
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {forms.slice(0, 10).map(f => (
            <div key={f.id} style={{
              borderRight: `3px solid ${COLORS.primary}`,
              paddingRight: 10, paddingTop: 4, paddingBottom: 4,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.text }}>
                  {f.clients?.full_name || 'אנונימי'}
                </span>
                <span style={{ fontSize: 10, color: COLORS.textMuted }}>
                  {f.weeks_active}ש' · {new Date(f.filled_at).toLocaleDateString('he-IL')}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <span key={n} style={{ fontSize: 11, color: n <= f.satisfaction ? COLORS.primary : COLORS.border }}>
                    ★
                  </span>
                ))}
              </div>
              {f.what_worked && (
                <p style={{ margin: '0 0 4px', fontSize: 11, color: COLORS.text, lineHeight: 1.4 }}>
                  <span style={{ color: COLORS.green, fontWeight: 700 }}>✓ עבד: </span>
                  {f.what_worked}
                </p>
              )}
              {f.what_to_improve && (
                <p style={{ margin: 0, fontSize: 11, color: COLORS.text, lineHeight: 1.4 }}>
                  <span style={{ color: COLORS.amber, fontWeight: 700 }}>○ לשפר: </span>
                  {f.what_to_improve}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, max, icon }) {
  return (
    <div style={{
      background: COLORS.bg, padding: 8, borderRadius: 8,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 18, marginBottom: 2 }}>{icon}</div>
      <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: COLORS.primaryDark }}>
        {value}{max ? `/${max}` : ''}
      </p>
      <p style={{ margin: '2px 0 0', fontSize: 9, color: COLORS.textMuted }}>{label}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   קומפוננטה: כפתור "שלחי טופס משוב" בפרופיל הלקוחה
═══════════════════════════════════════════════════════════ */

export function TriggerFeedbackButton({ coachId, clientId, weeksActive, onTriggered }) {
  const [sending, setSending] = useState(false);

  const handleClick = async () => {
    if (!confirm(`לשלוח טופס משוב על ${weeksActive || 'התקופה'} שבועות?`)) return;
    setSending(true);
    const { error } = await triggerFeedback(coachId, clientId, weeksActive);
    setSending(false);
    if (error) alert('שגיאה: ' + error.message);
    else {
      alert('✅ הטופס נשלח! יופיע אצל הלקוחה במסך הבית');
      onTriggered && onTriggered();
    }
  };

  return (
    <button onClick={handleClick} disabled={sending} style={{
      width: '100%', background: 'white', color: COLORS.primaryDark,
      border: `1px solid ${COLORS.primary}`, padding: '12px',
      borderRadius: '10px', fontSize: '13px', fontWeight: 600,
      cursor: 'pointer', fontFamily: 'inherit', marginBottom: '12px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      opacity: sending ? 0.6 : 1,
    }}>
      <span style={{ fontSize: 16 }}>📝</span>
      {sending ? 'שולחת...' : 'שלחי טופס משוב'}
    </button>
  );
}
