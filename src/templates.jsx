// ═══════════════════════════════════════════════════════════════
// src/templates.jsx
// ספריית תבניות גלובליות — תפריטים ואימונים
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

const COLORS = {
  bg: '#F5F2FA', primary: '#B19CD9', primaryDark: '#8B72B5',
  primarySoft: '#E8DFF5', mint: '#C5B3E0', peach: '#F5D0B5',
  text: '#2E2A3D', textMuted: '#756B85', border: '#DDD0EB',
  green: '#6B9B6B', amber: '#E8C96A',
};

const card = {
  background: 'white', border: `1px solid ${COLORS.border}`,
  borderRadius: 16, padding: 16,
};

/* ═══════════════════════════════════════════════════════════
   API — תבניות תפריטים
═══════════════════════════════════════════════════════════ */

export async function listMealTemplates() {
  const { data, error } = await supabase
    .from('meal_templates')
    .select('*')
    .eq('is_public', true)
    .order('use_count', { ascending: false });
  return { data: data || [], error };
}

export async function saveMealTemplate(coachId, plan) {
  const meals = plan?.meals || [];
  const totalCal = meals.reduce((s, m) => s + (m.cal || 0), 0);
  const totalP = meals.reduce((s, m) => s + (m.p || 0), 0);
  const totalC = meals.reduce((s, m) => s + (m.c || 0), 0);
  const totalF = meals.reduce((s, m) => s + (m.f || 0), 0);

  const { data, error } = await supabase
    .from('meal_templates')
    .insert({
      created_by: coachId,
      name: plan.template_name || `תפריט ${totalCal} קק"ל`,
      description: plan.template_description || '',
      total_cal: totalCal,
      total_p: totalP,
      total_c: totalC,
      total_f: totalF,
      meals_data: meals,
      is_public: true,
    })
    .select()
    .single();
  return { data, error };
}

export async function applyMealTemplate(templateId, clientId) {
  // טען את התבנית
  const { data: template, error: tErr } = await supabase
    .from('meal_templates').select('*').eq('id', templateId).single();
  if (tErr) return { error: tErr };

  // צור meal_plan חדש ללקוחה
  const { data: plan, error: pErr } = await supabase
    .from('meal_plans')
    .insert({
      client_id: clientId,
      name: template.name,
      total_cal: template.total_cal,
      total_p: template.total_p,
      total_c: template.total_c,
      total_f: template.total_f,
      is_active: true,
    })
    .select()
    .single();
  if (pErr) return { error: pErr };

  // הוסף את הארוחות מהתבנית
  const mealsToInsert = (template.meals_data || []).map(m => ({
    plan_id: plan.id,
    key: m.key,
    name: m.name,
    items: m.items,
    cal: m.cal,
    p: m.p,
    c: m.c,
    f: m.f,
    time: m.time,
  }));
  if (mealsToInsert.length > 0) {
    const { error: mErr } = await supabase.from('plan_meals').insert(mealsToInsert);
    if (mErr) return { error: mErr };
  }

  // עדכן use_count
  await supabase.from('meal_templates')
    .update({ use_count: (template.use_count || 0) + 1 })
    .eq('id', templateId);

  // רישום אירוע (לתובנות AI)
  await supabase.from('activity_events').insert({
    user_id: (await supabase.auth.getUser()).data.user?.id,
    user_role: 'coach',
    event_type: 'meal_template_applied',
    metadata: { template_id: templateId, client_id: clientId },
  });

  return { data: plan, error: null };
}

/* ═══════════════════════════════════════════════════════════
   API — תבניות אימונים
═══════════════════════════════════════════════════════════ */

export async function listWorkoutTemplates() {
  const { data, error } = await supabase
    .from('workout_templates')
    .select('*')
    .eq('is_public', true)
    .order('use_count', { ascending: false });
  return { data: data || [], error };
}

export async function saveWorkoutTemplate(coachId, workout) {
  const { data, error } = await supabase
    .from('workout_templates')
    .insert({
      created_by: coachId,
      name: workout.name,
      description: workout.description || '',
      difficulty: workout.difficulty || 'beginner',
      duration_min: workout.duration_min || 30,
      body_focus: workout.body_focus || 'full_body',
      exercises: workout.exercises || [],
      is_public: true,
    })
    .select()
    .single();
  return { data, error };
}

export async function applyWorkoutTemplate(templateId, clientId) {
  const { data: template, error: tErr } = await supabase
    .from('workout_templates').select('*').eq('id', templateId).single();
  if (tErr) return { error: tErr };

  const { data: workout, error: wErr } = await supabase
    .from('workouts')
    .insert({
      client_id: clientId,
      name: template.name,
      description: template.description,
      difficulty: template.difficulty,
      duration_min: template.duration_min,
      is_active: true,
    })
    .select()
    .single();
  if (wErr) return { error: wErr };

  const exercisesToInsert = (template.exercises || []).map((ex, idx) => ({
    workout_id: workout.id,
    name: ex.name,
    sets: ex.sets || 3,
    reps: ex.reps || 10,
    rest_sec: ex.rest_sec || 60,
    notes: ex.notes || '',
    order_index: idx,
  }));
  if (exercisesToInsert.length > 0) {
    await supabase.from('exercises').insert(exercisesToInsert);
  }

  await supabase.from('workout_templates')
    .update({ use_count: (template.use_count || 0) + 1 })
    .eq('id', templateId);

  return { data: workout, error: null };
}

/* ═══════════════════════════════════════════════════════════
   קומפוננטה: ספריית תבניות תפריטים
═══════════════════════════════════════════════════════════ */

export function MealTemplateLibrary({ coachId, onApply, onClose }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCal, setFilterCal] = useState('all');

  useEffect(() => {
    listMealTemplates().then(({ data }) => {
      setTemplates(data);
      setLoading(false);
    });
  }, []);

  const filtered = templates.filter(t => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCal === 'low' && t.total_cal >= 1500) return false;
    if (filterCal === 'mid' && (t.total_cal < 1500 || t.total_cal > 1900)) return false;
    if (filterCal === 'high' && t.total_cal <= 1900) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="חפשי תבנית..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1, padding: '10px 12px',
            border: `1px solid ${COLORS.border}`,
            borderRadius: 10, fontSize: 13,
            fontFamily: 'inherit', outline: 'none',
          }}
        />
        {onClose && (
          <button onClick={onClose} style={{
            padding: '10px 14px', background: COLORS.primarySoft,
            color: COLORS.primaryDark, border: 'none', borderRadius: 10,
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            סגור
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {[
          { val: 'all', lbl: 'הכל' },
          { val: 'low', lbl: 'עד 1500 קק"ל' },
          { val: 'mid', lbl: '1500-1900' },
          { val: 'high', lbl: '1900+' },
        ].map(f => (
          <button
            key={f.val}
            onClick={() => setFilterCal(f.val)}
            style={{
              padding: '6px 12px', border: 'none',
              background: filterCal === f.val ? COLORS.primary : COLORS.primarySoft,
              color: filterCal === f.val ? 'white' : COLORS.primaryDark,
              borderRadius: 999, fontSize: 11, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              whiteSpace: 'nowrap',
            }}
          >
            {f.lbl}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: COLORS.textMuted, padding: 20 }}>טוענת...</p>
      ) : filtered.length === 0 ? (
        <div style={card}>
          <p style={{ margin: 0, fontSize: 13, color: COLORS.textMuted, textAlign: 'center' }}>
            {templates.length === 0 ? 'עוד אין תבניות בספרייה' : 'לא נמצאו תוצאות'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(t => (
            <div key={t.id} style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: COLORS.text }}>
                    {t.name}
                  </p>
                  {t.description && (
                    <p style={{ margin: '4px 0 0', fontSize: 11, color: COLORS.textMuted }}>
                      {t.description}
                    </p>
                  )}
                </div>
                {t.use_count > 0 && (
                  <span style={{
                    fontSize: 10, color: COLORS.primaryDark,
                    background: COLORS.primarySoft,
                    padding: '3px 8px', borderRadius: 999,
                    flexShrink: 0,
                  }}>
                    🔥 {t.use_count}
                  </span>
                )}
              </div>

              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6,
                marginBottom: 10,
              }}>
                <Stat icon="🔥" label="קק״ל" value={t.total_cal} />
                <Stat icon="🥩" label="חלבון" value={`${t.total_p}g`} />
                <Stat icon="🍞" label="פחמ׳" value={`${t.total_c}g`} />
                <Stat icon="🥑" label="שומן" value={`${t.total_f}g`} />
              </div>

              <button
                onClick={() => onApply(t)}
                style={{
                  width: '100%', background: COLORS.primary, color: 'white',
                  border: 'none', padding: 10, borderRadius: 10,
                  fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                ✨ שכפלי ללקוחה
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div style={{
      background: COLORS.bg, padding: 6, borderRadius: 8,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 14 }}>{icon}</div>
      <p style={{ margin: '2px 0 0', fontSize: 9, color: COLORS.textMuted }}>{label}</p>
      <p style={{ margin: '1px 0 0', fontSize: 11, fontWeight: 700, color: COLORS.text }}>{value}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   קומפוננטה: ספריית תבניות אימונים
═══════════════════════════════════════════════════════════ */

export function WorkoutTemplateLibrary({ coachId, onApply, onClose }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterFocus, setFilterFocus] = useState('all');

  useEffect(() => {
    listWorkoutTemplates().then(({ data }) => {
      setTemplates(data);
      setLoading(false);
    });
  }, []);

  const filtered = templates.filter(t => {
    if (filterFocus !== 'all' && t.body_focus !== filterFocus) return false;
    return true;
  });

  const focusLabels = {
    full_body: '🏋️ כל הגוף',
    upper: '💪 פלג עליון',
    lower: '🦵 פלג תחתון',
    core: '🎯 ליבה',
    cardio: '❤️ קרדיו',
  };

  const difficultyColors = {
    beginner: { bg: '#E8F5E9', color: '#2E7D32', label: 'מתחיל' },
    intermediate: { bg: '#FFF4E5', color: '#8B6914', label: 'בינוני' },
    advanced: { bg: '#FFE5E5', color: '#8B2E2E', label: 'מתקדם' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {onClose && (
        <button onClick={onClose} style={{
          alignSelf: 'flex-end',
          padding: '6px 12px', background: COLORS.primarySoft,
          color: COLORS.primaryDark, border: 'none', borderRadius: 10,
          fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          סגור
        </button>
      )}

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {[{ val: 'all', lbl: 'הכל' }, ...Object.entries(focusLabels).map(([k, v]) => ({ val: k, lbl: v }))].map(f => (
          <button
            key={f.val}
            onClick={() => setFilterFocus(f.val)}
            style={{
              padding: '6px 12px', border: 'none',
              background: filterFocus === f.val ? COLORS.primary : COLORS.primarySoft,
              color: filterFocus === f.val ? 'white' : COLORS.primaryDark,
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
        <div style={card}>
          <p style={{ margin: 0, fontSize: 13, color: COLORS.textMuted, textAlign: 'center' }}>
            לא נמצאו תוצאות
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(t => {
            const diff = difficultyColors[t.difficulty] || difficultyColors.beginner;
            return (
              <div key={t.id} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: COLORS.text }}>
                      {t.name}
                    </p>
                    {t.description && (
                      <p style={{ margin: '4px 0 0', fontSize: 11, color: COLORS.textMuted }}>
                        {t.description}
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '3px 8px', background: diff.bg, color: diff.color,
                    borderRadius: 999, fontSize: 10, fontWeight: 700,
                  }}>{diff.label}</span>
                  <span style={{
                    padding: '3px 8px', background: COLORS.primarySoft, color: COLORS.primaryDark,
                    borderRadius: 999, fontSize: 10, fontWeight: 600,
                  }}>⏱️ {t.duration_min} דק'</span>
                  <span style={{
                    padding: '3px 8px', background: COLORS.primarySoft, color: COLORS.primaryDark,
                    borderRadius: 999, fontSize: 10, fontWeight: 600,
                  }}>{focusLabels[t.body_focus] || t.body_focus}</span>
                  <span style={{
                    padding: '3px 8px', background: '#F0F0F5', color: COLORS.textMuted,
                    borderRadius: 999, fontSize: 10, fontWeight: 600,
                  }}>{(t.exercises || []).length} תרגילים</span>
                </div>

                <button
                  onClick={() => onApply(t)}
                  style={{
                    width: '100%', background: COLORS.primary, color: 'white',
                    border: 'none', padding: 10, borderRadius: 10,
                    fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  ✨ שכפלי ללקוחה
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
