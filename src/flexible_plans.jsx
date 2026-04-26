// ═══════════════════════════════════════════════════════════════
// src/flexible_plans.jsx
// תוכניות גמישות — בנק אימונים + תפריטי תזונה
// ═══════════════════════════════════════════════════════════════
//
// קומפוננטות מיוצאות:
//
// למאמנת:
//   <CoachWorkoutBank coachId clientId clientName onClose />
//   <CoachMealPlanEditor coachId clientId clientName onClose />
//
// למתאמנת:
//   <ClientWorkoutPicker clientId onComplete />
//   <ClientMealPlanView clientId onLogMeal />
//
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabase';

const COLORS = {
  bg: '#F5F2FA', primary: '#B19CD9', primaryDark: '#8B72B5',
  primarySoft: '#E8DFF5', accent: '#F4C2C2',
  text: '#2E2A3D', textMuted: '#756B85', border: '#DDD0EB',
  green: '#6BAF8A', greenSoft: '#E0F2EB',
  amber: '#E8B84B', amberSoft: '#FDF3D7',
  red: '#C88A8A', redSoft: '#FADDDD',
};

const card = {
  background: 'white', borderRadius: 14, padding: 14,
  border: `1px solid ${COLORS.border}`, marginBottom: 10,
};

const btn = {
  background: COLORS.primary, color: 'white', border: 'none',
  padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'inherit',
};

const btnGhost = {
  ...btn, background: 'transparent',
  color: COLORS.primaryDark, border: `1px solid ${COLORS.border}`,
};

const inp = {
  width: '100%', padding: '10px 12px', boxSizing: 'border-box',
  border: `1px solid ${COLORS.border}`, borderRadius: 10,
  fontSize: 13, fontFamily: 'inherit', outline: 'none',
};

// ═══════════════════════════════════════════════════════════════
// 🏋️ COACH — בנק אימונים ללקוחה
// ═══════════════════════════════════════════════════════════════
export function CoachWorkoutBank({ coachId, clientId, clientName, onClose }) {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | 'new' | workout object

  useEffect(() => { load(); }, [clientId]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('client_workouts')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });
    if (data) setWorkouts(data);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('למחוק את האימון?')) return;
    await supabase.from('client_workouts').update({ is_active: false }).eq('id', id);
    load();
  };

  if (editing) {
    return (
      <WorkoutEditor
        workout={editing === 'new' ? null : editing}
        coachId={coachId} clientId={clientId}
        onCancel={() => setEditing(null)}
        onSave={() => { setEditing(null); load(); }}
      />
    );
  }

  return (
    <div style={{ direction: 'rtl', padding: 16, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button onClick={onClose} style={btnGhost}>← חזרה</button>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: COLORS.primaryDark }}>
          🏋️ בנק אימונים — {clientName}
        </h2>
      </div>

      <p style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12 }}>
        הוסיפי את האימונים שהלקוחה יכולה לבצע. היא תבחר מה לעשות ומתי, ותדווח על היום.
      </p>

      <button onClick={() => setEditing('new')} style={{ ...btn, marginBottom: 14, width: '100%' }}>
        ➕ הוסיפי אימון חדש
      </button>

      {loading ? (
        <p style={{ textAlign: 'center', color: COLORS.textMuted }}>טוענת...</p>
      ) : workouts.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: 30 }}>
          <p style={{ color: COLORS.textMuted, fontSize: 14, margin: 0 }}>עדיין לא הוספת אימונים ללקוחה זו</p>
        </div>
      ) : (
        workouts.map(w => (
          <div key={w.id} style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{w.name}</h4>
                {w.description && <p style={{ margin: '4px 0 0', fontSize: 12, color: COLORS.textMuted }}>{w.description}</p>}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setEditing(w)} style={{ ...btnGhost, padding: '6px 12px', fontSize: 12 }}>✏️</button>
                <button onClick={() => handleDelete(w.id)} style={{ ...btnGhost, padding: '6px 12px', fontSize: 12, color: COLORS.red }}>🗑️</button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 11, color: COLORS.textMuted }}>
              <span style={{ background: COLORS.primarySoft, padding: '3px 8px', borderRadius: 6 }}>
                💪 {(w.exercises || []).length} תרגילים
              </span>
              {w.duration_min && (
                <span style={{ background: COLORS.primarySoft, padding: '3px 8px', borderRadius: 6 }}>
                  ⏱️ {w.duration_min} דק׳
                </span>
              )}
              {w.weekly_target > 0 && (
                <span style={{ background: COLORS.greenSoft, padding: '3px 8px', borderRadius: 6, color: COLORS.green }}>
                  🎯 {w.weekly_target}× בשבוע
                </span>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// עורך אימון בודד
// ───────────────────────────────────────────────────────────────
function WorkoutEditor({ workout, coachId, clientId, onCancel, onSave }) {
  const [name, setName] = useState(workout?.name || '');
  const [description, setDescription] = useState(workout?.description || '');
  const [duration, setDuration] = useState(workout?.duration_min || 45);
  const [weeklyTarget, setWeeklyTarget] = useState(workout?.weekly_target || 1);
  const [exercises, setExercises] = useState(workout?.exercises || []);
  const [saving, setSaving] = useState(false);

  const addExercise = () => {
    setExercises([...exercises, { name: '', sets: 3, reps: '10', rest: 60, weight: '', notes: '', icon: '💪' }]);
  };
  const updateEx = (i, field, val) => {
    const next = [...exercises];
    next[i] = { ...next[i], [field]: val };
    setExercises(next);
  };
  const removeEx = (i) => setExercises(exercises.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!name.trim()) { alert('הוסיפי שם לאימון'); return; }
    if (exercises.length === 0) { alert('הוסיפי לפחות תרגיל אחד'); return; }
    setSaving(true);
    const payload = {
      client_id: clientId, coach_id: coachId,
      name: name.trim(), description: description.trim() || null,
      duration_min: Number(duration) || null,
      weekly_target: Number(weeklyTarget) || 1,
      exercises: exercises.filter(e => e.name.trim()),
      is_active: true,
    };
    if (workout?.id) {
      await supabase.from('client_workouts').update(payload).eq('id', workout.id);
    } else {
      await supabase.from('client_workouts').insert(payload);
    }
    setSaving(false);
    onSave();
  };

  return (
    <div style={{ direction: 'rtl', padding: 16, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button onClick={onCancel} style={btnGhost}>← ביטול</button>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: COLORS.primaryDark }}>
          {workout ? '✏️ עריכה' : '➕ אימון חדש'}
        </h2>
      </div>

      <div style={card}>
        <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 600 }}>שם האימון *</p>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="פול באדי A" style={inp} />

        <p style={{ margin: '12px 0 6px', fontSize: 12, fontWeight: 600 }}>תיאור</p>
        <input value={description} onChange={e => setDescription(e.target.value)} placeholder="פטיש ירכיים, חזה ויחפים" style={inp} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
          <div>
            <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 600 }}>משך (דקות)</p>
            <input type="number" value={duration} onChange={e => setDuration(e.target.value)} style={inp} />
          </div>
          <div>
            <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 600 }}>יעד שבועי</p>
            <input type="number" value={weeklyTarget} min="1" max="7" onChange={e => setWeeklyTarget(e.target.value)} style={inp} />
          </div>
        </div>
      </div>

      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>תרגילים ({exercises.length})</h4>
          <button onClick={addExercise} style={{ ...btn, padding: '6px 12px', fontSize: 12 }}>➕ תרגיל</button>
        </div>

        {exercises.map((ex, i) => (
          <div key={i} style={{ background: COLORS.bg, borderRadius: 10, padding: 10, marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <input value={ex.name} onChange={e => updateEx(i, 'name', e.target.value)} placeholder="שם התרגיל" style={{ ...inp, flex: 1 }} />
              <button onClick={() => removeEx(i)} style={{ ...btnGhost, padding: '6px 10px', color: COLORS.red }}>🗑️</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              <input value={ex.sets} onChange={e => updateEx(i, 'sets', e.target.value)} placeholder="סטים" style={{ ...inp, fontSize: 12, padding: 8 }} />
              <input value={ex.reps} onChange={e => updateEx(i, 'reps', e.target.value)} placeholder="חזרות" style={{ ...inp, fontSize: 12, padding: 8 }} />
              <input value={ex.weight} onChange={e => updateEx(i, 'weight', e.target.value)} placeholder="משקל" style={{ ...inp, fontSize: 12, padding: 8 }} />
              <input value={ex.rest} onChange={e => updateEx(i, 'rest', e.target.value)} placeholder="מנוחה" style={{ ...inp, fontSize: 12, padding: 8 }} />
            </div>
          </div>
        ))}

        {exercises.length === 0 && (
          <p style={{ textAlign: 'center', color: COLORS.textMuted, fontSize: 12, padding: 20 }}>
            עדיין לא הוספת תרגילים
          </p>
        )}
      </div>

      <button onClick={handleSave} disabled={saving} style={{ ...btn, width: '100%', padding: 14, opacity: saving ? 0.6 : 1 }}>
        {saving ? 'שומרת...' : '💾 שמור אימון'}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 🍽️ COACH — תפריט תזונה ללקוחה
// ═══════════════════════════════════════════════════════════════
export function CoachMealPlanEditor({ coachId, clientId, clientName, onClose }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  useEffect(() => { load(); }, [clientId]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('meal_plans')
      .select('*, meal_plan_meals(*)')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });
    if (data) setPlans(data);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('למחוק את התפריט?')) return;
    await supabase.from('meal_plans').update({ is_active: false }).eq('id', id);
    load();
  };

  if (editing) {
    return (
      <MealPlanEditor
        plan={editing === 'new' ? null : editing}
        coachId={coachId} clientId={clientId}
        onCancel={() => setEditing(null)}
        onSave={() => { setEditing(null); load(); }}
      />
    );
  }

  return (
    <div style={{ direction: 'rtl', padding: 16, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button onClick={onClose} style={btnGhost}>← חזרה</button>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: COLORS.primaryDark }}>
          🍽️ תפריטי תזונה — {clientName}
        </h2>
      </div>

      <p style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12 }}>
        בני תפריטים שהלקוחה יכולה לבחור מהם. היא תבחר ארוחה כשהיא אוכלת ותדווח על היום.
      </p>

      <button onClick={() => setEditing('new')} style={{ ...btn, marginBottom: 14, width: '100%' }}>
        ➕ תפריט חדש
      </button>

      {loading ? (
        <p style={{ textAlign: 'center', color: COLORS.textMuted }}>טוענת...</p>
      ) : plans.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: 30 }}>
          <p style={{ color: COLORS.textMuted, fontSize: 14, margin: 0 }}>עדיין לא יצרת תפריטים ללקוחה זו</p>
        </div>
      ) : (
        plans.map(p => {
          const meals = p.meal_plan_meals || [];
          const total = meals.reduce((s, m) => ({
            kcal: s.kcal + (Number(m.total_kcal) || 0),
            p: s.p + (Number(m.total_p) || 0),
            c: s.c + (Number(m.total_c) || 0),
            f: s.f + (Number(m.total_f) || 0),
          }), { kcal: 0, p: 0, c: 0, f: 0 });
          return (
            <div key={p.id} style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{p.name}</h4>
                  {p.description && <p style={{ margin: '4px 0 0', fontSize: 12, color: COLORS.textMuted }}>{p.description}</p>}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setEditing(p)} style={{ ...btnGhost, padding: '6px 12px', fontSize: 12 }}>✏️</button>
                  <button onClick={() => handleDelete(p.id)} style={{ ...btnGhost, padding: '6px 12px', fontSize: 12, color: COLORS.red }}>🗑️</button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 11 }}>
                <span style={{ background: COLORS.primarySoft, padding: '3px 8px', borderRadius: 6, color: COLORS.primaryDark }}>
                  🍽️ {meals.length} ארוחות
                </span>
                <span style={{ background: COLORS.amberSoft, padding: '3px 8px', borderRadius: 6, color: '#7A5C1E' }}>
                  🔥 {Math.round(total.kcal)} קק״ל
                </span>
                <span style={{ background: COLORS.greenSoft, padding: '3px 8px', borderRadius: 6, color: COLORS.green }}>
                  💪 {Math.round(total.p)}ג חלבון
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// עורך תפריט בודד — עם מחשבון מאקרו
// ───────────────────────────────────────────────────────────────
function MealPlanEditor({ plan, coachId, clientId, onCancel, onSave }) {
  const [name, setName] = useState(plan?.name || '');
  const [description, setDescription] = useState(plan?.description || '');
  const [meals, setMeals] = useState(plan?.meal_plan_meals || []);
  const [saving, setSaving] = useState(false);
  const [editingMealIdx, setEditingMealIdx] = useState(null);

  // סיכום מאקרו של כל התפריט
  const planTotal = useMemo(() => meals.reduce((s, m) => ({
    kcal: s.kcal + (Number(m.total_kcal) || 0),
    p: s.p + (Number(m.total_p) || 0),
    c: s.c + (Number(m.total_c) || 0),
    f: s.f + (Number(m.total_f) || 0),
  }), { kcal: 0, p: 0, c: 0, f: 0 }), [meals]);

  const addMeal = () => {
    setMeals([...meals, {
      _new: true,
      name: 'ארוחה חדשה',
      meal_type: 'snack',
      items: [],
      total_kcal: 0, total_p: 0, total_c: 0, total_f: 0,
      position: meals.length,
    }]);
    setEditingMealIdx(meals.length);
  };

  const updateMeal = (idx, updated) => {
    const next = [...meals];
    next[idx] = updated;
    setMeals(next);
  };

  const removeMeal = async (idx) => {
    if (!confirm('למחוק ארוחה?')) return;
    const meal = meals[idx];
    if (meal.id) {
      await supabase.from('meal_plan_meals').delete().eq('id', meal.id);
    }
    setMeals(meals.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!name.trim()) { alert('הוסיפי שם לתפריט'); return; }
    setSaving(true);

    let planId = plan?.id;

    if (planId) {
      await supabase.from('meal_plans').update({
        name: name.trim(),
        description: description.trim() || null,
        updated_at: new Date().toISOString(),
      }).eq('id', planId);
    } else {
      const { data } = await supabase.from('meal_plans').insert({
        client_id: clientId, coach_id: coachId,
        name: name.trim(),
        description: description.trim() || null,
        is_active: true,
      }).select().single();
      planId = data?.id;
    }

    // שמור/עדכן ארוחות
    for (let i = 0; i < meals.length; i++) {
      const m = meals[i];
      const payload = {
        meal_plan_id: planId,
        name: m.name,
        meal_type: m.meal_type || 'snack',
        notes: m.notes || null,
        items: m.items || [],
        total_kcal: Number(m.total_kcal) || 0,
        total_p: Number(m.total_p) || 0,
        total_c: Number(m.total_c) || 0,
        total_f: Number(m.total_f) || 0,
        position: i,
      };
      if (m.id && !m._new) {
        await supabase.from('meal_plan_meals').update(payload).eq('id', m.id);
      } else {
        await supabase.from('meal_plan_meals').insert(payload);
      }
    }

    setSaving(false);
    onSave();
  };

  if (editingMealIdx !== null) {
    return (
      <MealEditorInPlan
        meal={meals[editingMealIdx]}
        onCancel={() => setEditingMealIdx(null)}
        onSave={(updated) => {
          updateMeal(editingMealIdx, updated);
          setEditingMealIdx(null);
        }}
      />
    );
  }

  return (
    <div style={{ direction: 'rtl', padding: 16, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button onClick={onCancel} style={btnGhost}>← ביטול</button>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: COLORS.primaryDark }}>
          {plan ? '✏️ עריכת תפריט' : '➕ תפריט חדש'}
        </h2>
      </div>

      <div style={card}>
        <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 600 }}>שם התפריט *</p>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="תפריט יום אימון" style={inp} />

        <p style={{ margin: '12px 0 6px', fontSize: 12, fontWeight: 600 }}>תיאור</p>
        <input value={description} onChange={e => setDescription(e.target.value)} placeholder="תפריט גבוה בחלבון לימי אימון" style={inp} />
      </div>

      {/* סיכום מאקרו של התפריט */}
      <div style={{ ...card, background: `linear-gradient(135deg, ${COLORS.primarySoft} 0%, white 100%)` }}>
        <h4 style={{ margin: '0 0 8px', fontSize: 14, color: COLORS.primaryDark, fontWeight: 700 }}>
          📊 סיכום מאקרו של התפריט
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          <MacroBox label="קלוריות" value={Math.round(planTotal.kcal)} unit="קק״ל" color={COLORS.amber} />
          <MacroBox label="חלבון" value={Math.round(planTotal.p)} unit="ג" color={COLORS.green} />
          <MacroBox label="פחמ׳" value={Math.round(planTotal.c)} unit="ג" color="#5C9DC8" />
          <MacroBox label="שומן" value={Math.round(planTotal.f)} unit="ג" color="#D89A6E" />
        </div>
      </div>

      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>ארוחות ({meals.length})</h4>
          <button onClick={addMeal} style={{ ...btn, padding: '6px 12px', fontSize: 12 }}>➕ ארוחה</button>
        </div>

        {meals.map((m, i) => (
          <div key={i} style={{ background: COLORS.bg, borderRadius: 10, padding: 10, marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{m.name}</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: COLORS.textMuted }}>
                  {(m.items || []).length} מזונות · {Math.round(m.total_kcal || 0)} קק״ל · {Math.round(m.total_p || 0)}ג חלבון
                </p>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => setEditingMealIdx(i)} style={{ ...btnGhost, padding: '4px 8px', fontSize: 11 }}>✏️</button>
                <button onClick={() => removeMeal(i)} style={{ ...btnGhost, padding: '4px 8px', fontSize: 11, color: COLORS.red }}>🗑️</button>
              </div>
            </div>
          </div>
        ))}

        {meals.length === 0 && (
          <p style={{ textAlign: 'center', color: COLORS.textMuted, fontSize: 12, padding: 20 }}>
            עדיין לא הוספת ארוחות
          </p>
        )}
      </div>

      <button onClick={handleSave} disabled={saving} style={{ ...btn, width: '100%', padding: 14, opacity: saving ? 0.6 : 1 }}>
        {saving ? 'שומרת...' : '💾 שמור תפריט'}
      </button>
    </div>
  );
}

function MacroBox({ label, value, unit, color }) {
  return (
    <div style={{ background: 'white', padding: 10, borderRadius: 10, textAlign: 'center', border: `1px solid ${COLORS.border}` }}>
      <p style={{ margin: 0, fontSize: 10, color: COLORS.textMuted, fontWeight: 600 }}>{label}</p>
      <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 800, color }}>{value}</p>
      <p style={{ margin: 0, fontSize: 9, color: COLORS.textMuted }}>{unit}</p>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// עריכת ארוחה בתוך תפריט — עם מאקרו ואחוזים
// ───────────────────────────────────────────────────────────────
function MealEditorInPlan({ meal, onCancel, onSave }) {
  const [name, setName] = useState(meal.name || '');
  const [mealType, setMealType] = useState(meal.meal_type || 'snack');
  const [notes, setNotes] = useState(meal.notes || '');
  const [items, setItems] = useState(meal.items || []);
  const [searchOpen, setSearchOpen] = useState(false);

  // חישוב מאקרו של הארוחה
  const total = useMemo(() => items.reduce((s, it) => ({
    kcal: s.kcal + (Number(it.kcal) || 0),
    p: s.p + (Number(it.p) || 0),
    c: s.c + (Number(it.c) || 0),
    f: s.f + (Number(it.f) || 0),
  }), { kcal: 0, p: 0, c: 0, f: 0 }), [items]);

  const addItem = (food) => {
    // food: { id, name, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g }
    const item = {
      food_id: food.id || null,
      name: food.name,
      qty: 100,
      unit: 'g',
      // ערכי מאקרו ל-100ג
      base_kcal: Number(food.kcal_per_100g) || 0,
      base_p: Number(food.protein_per_100g) || 0,
      base_c: Number(food.carbs_per_100g) || 0,
      base_f: Number(food.fat_per_100g) || 0,
      // ערכים סופיים (יחושב לפי qty)
      kcal: Number(food.kcal_per_100g) || 0,
      p: Number(food.protein_per_100g) || 0,
      c: Number(food.carbs_per_100g) || 0,
      f: Number(food.fat_per_100g) || 0,
      source: 'database',
    };
    setItems([...items, item]);
    setSearchOpen(false);
  };

  const addManualItem = () => {
    setItems([...items, {
      food_id: null,
      name: 'מזון',
      qty: 100, unit: 'g',
      base_kcal: 0, base_p: 0, base_c: 0, base_f: 0,
      kcal: 0, p: 0, c: 0, f: 0,
      source: 'manual',
    }]);
  };

  const updateItem = (i, field, val) => {
    const next = [...items];
    next[i] = { ...next[i], [field]: val };
    // חישוב מחדש לפי qty
    const it = next[i];
    if (it.unit === 'g' && it.source === 'database') {
      const factor = (Number(it.qty) || 0) / 100;
      it.kcal = it.base_kcal * factor;
      it.p = it.base_p * factor;
      it.c = it.base_c * factor;
      it.f = it.base_f * factor;
    } else if (it.unit === 'serving' && it.source === 'database') {
      const factor = Number(it.qty) || 0;
      it.kcal = it.base_kcal * factor;
      it.p = it.base_p * factor;
      it.c = it.base_c * factor;
      it.f = it.base_f * factor;
    }
    setItems(next);
  };

  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));

  const handleSave = () => {
    onSave({
      ...meal,
      name: name.trim() || 'ארוחה',
      meal_type: mealType,
      notes: notes.trim() || null,
      items,
      total_kcal: total.kcal,
      total_p: total.p,
      total_c: total.c,
      total_f: total.f,
    });
  };

  return (
    <div style={{ direction: 'rtl', padding: 16, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button onClick={onCancel} style={btnGhost}>← ביטול</button>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: COLORS.primaryDark }}>
          ✏️ {meal._new ? 'ארוחה חדשה' : 'עריכת ארוחה'}
        </h2>
      </div>

      <div style={card}>
        <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 600 }}>שם הארוחה *</p>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="ארוחת בוקר" style={inp} />

        <p style={{ margin: '12px 0 6px', fontSize: 12, fontWeight: 600 }}>סוג</p>
        <select value={mealType} onChange={e => setMealType(e.target.value)} style={inp}>
          <option value="breakfast">בוקר</option>
          <option value="lunch">צהריים</option>
          <option value="dinner">ערב</option>
          <option value="snack">ביניים</option>
        </select>

        <p style={{ margin: '12px 0 6px', fontSize: 12, fontWeight: 600 }}>הערות</p>
        <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="לפני אימון" style={inp} />
      </div>

      {/* סיכום מאקרו של הארוחה */}
      <div style={{ ...card, background: `linear-gradient(135deg, ${COLORS.primarySoft} 0%, white 100%)` }}>
        <h4 style={{ margin: '0 0 8px', fontSize: 13, color: COLORS.primaryDark, fontWeight: 700 }}>
          📊 מאקרו של הארוחה
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          <MacroBox label="קלוריות" value={Math.round(total.kcal)} unit="קק״ל" color={COLORS.amber} />
          <MacroBox label="חלבון" value={Math.round(total.p)} unit="ג" color={COLORS.green} />
          <MacroBox label="פחמ׳" value={Math.round(total.c)} unit="ג" color="#5C9DC8" />
          <MacroBox label="שומן" value={Math.round(total.f)} unit="ג" color="#D89A6E" />
        </div>
      </div>

      {/* רשימת מזונות */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>מזונות ({items.length})</h4>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setSearchOpen(true)} style={{ ...btn, padding: '6px 10px', fontSize: 11 }}>
              🔍 ממאגר
            </button>
            <button onClick={addManualItem} style={{ ...btnGhost, padding: '6px 10px', fontSize: 11 }}>
              ✏️ ידני
            </button>
          </div>
        </div>

        {items.map((it, i) => {
          const pctKcal = total.kcal > 0 ? Math.round((it.kcal / total.kcal) * 100) : 0;
          const pctP = total.p > 0 ? Math.round((it.p / total.p) * 100) : 0;

          return (
            <div key={i} style={{ background: COLORS.bg, borderRadius: 10, padding: 10, marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <input
                  value={it.name}
                  onChange={e => updateItem(i, 'name', e.target.value)}
                  style={{ ...inp, flex: 2, fontSize: 13 }}
                  placeholder="שם המזון"
                />
                <input
                  type="number" value={it.qty}
                  onChange={e => updateItem(i, 'qty', e.target.value)}
                  style={{ ...inp, flex: 1, fontSize: 13 }}
                />
                <select
                  value={it.unit}
                  onChange={e => updateItem(i, 'unit', e.target.value)}
                  style={{ ...inp, width: 70, fontSize: 12 }}
                >
                  <option value="g">גרם</option>
                  <option value="serving">מנה</option>
                </select>
                <button onClick={() => removeItem(i)} style={{ ...btnGhost, padding: '6px 8px', color: COLORS.red, fontSize: 11 }}>🗑️</button>
              </div>

              {/* מאקרו ליחידה — אם מזון ידני, ניתן לערוך */}
              {it.source === 'manual' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                  <input type="number" value={it.kcal} onChange={e => updateItem(i, 'kcal', e.target.value)} placeholder="קק״ל" style={{ ...inp, fontSize: 11, padding: 6 }} />
                  <input type="number" value={it.p} onChange={e => updateItem(i, 'p', e.target.value)} placeholder="חלבון" style={{ ...inp, fontSize: 11, padding: 6 }} />
                  <input type="number" value={it.c} onChange={e => updateItem(i, 'c', e.target.value)} placeholder="פחמ׳" style={{ ...inp, fontSize: 11, padding: 6 }} />
                  <input type="number" value={it.f} onChange={e => updateItem(i, 'f', e.target.value)} placeholder="שומן" style={{ ...inp, fontSize: 11, padding: 6 }} />
                </div>
              ) : (
                <div style={{ fontSize: 11, color: COLORS.textMuted, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span>🔥 {Math.round(it.kcal)} קק״ל ({pctKcal}%)</span>
                  <span>💪 {Math.round(it.p)}ג ({pctP}%)</span>
                  <span>🍞 {Math.round(it.c)}ג</span>
                  <span>🥑 {Math.round(it.f)}ג</span>
                </div>
              )}
            </div>
          );
        })}

        {items.length === 0 && (
          <p style={{ textAlign: 'center', color: COLORS.textMuted, fontSize: 12, padding: 20 }}>
            עדיין לא הוספת מזונות
          </p>
        )}
      </div>

      <button onClick={handleSave} style={{ ...btn, width: '100%', padding: 14 }}>
        ✅ שמור ארוחה
      </button>

      {searchOpen && <FoodSearchModal onClose={() => setSearchOpen(false)} onSelect={addItem} />}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// חיפוש מזון ממאגר
// ───────────────────────────────────────────────────────────────
function FoodSearchModal({ onClose, onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!query.trim()) { setResults([]); return; }
      setLoading(true);
      const { data } = await supabase
        .from('food_database')
        .select('*')
        .ilike('name', `%${query.trim()}%`)
        .limit(20);
      setResults(data || []);
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: 20, direction: 'rtl', overflowY: 'auto',
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: 14, padding: 16,
        maxWidth: 500, width: '100%', marginTop: 40,
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700 }}>🔍 חיפוש מזון</h3>
        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="חזה עוף, אורז, ביצים..."
          style={{ ...inp, marginBottom: 10 }}
        />

        {loading && <p style={{ textAlign: 'center', color: COLORS.textMuted }}>מחפשת...</p>}

        {!loading && results.length === 0 && query.trim() && (
          <p style={{ textAlign: 'center', color: COLORS.textMuted, fontSize: 12 }}>לא נמצאו מזונות</p>
        )}

        {results.map(f => (
          <button
            key={f.id}
            onClick={() => onSelect(f)}
            style={{
              width: '100%', textAlign: 'right', padding: 10,
              background: COLORS.bg, border: `1px solid ${COLORS.border}`,
              borderRadius: 10, marginBottom: 6, cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{f.name}</p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: COLORS.textMuted }}>
              ל-100ג: {f.kcal_per_100g || 0} קק״ל · {f.protein_per_100g || 0}ג חלבון · {f.carbs_per_100g || 0}ג פחמ׳ · {f.fat_per_100g || 0}ג שומן
            </p>
          </button>
        ))}

        <button onClick={onClose} style={{ ...btnGhost, width: '100%', marginTop: 10 }}>סגור</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 👩 CLIENT — בחירת אימון מהבנק
// ═══════════════════════════════════════════════════════════════
export function ClientWorkoutPicker({ clientId, onComplete }) {
  const [workouts, setWorkouts] = useState([]);
  const [thisWeekLogs, setThisWeekLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null); // אימון בביצוע

  useEffect(() => { load(); }, [clientId]);

  const load = async () => {
    setLoading(true);
    try {
      // בנק האימונים
      const { data: wo } = await supabase
        .from('client_workouts')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true);

      // אימונים שבוצעו השבוע
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // ראשון
      weekStart.setHours(0, 0, 0, 0);

      const { data: logs } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('client_id', clientId)
        .gte('logged_at', weekStart.toISOString());

      setWorkouts(wo || []);
      setThisWeekLogs(logs || []);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (workout) => {
    if (!confirm(`לסמן את "${workout.name}" כבוצע?`)) return;
    await supabase.from('workout_logs').insert({
      client_id: clientId,
      client_workout_id: workout.id,
      workout_name: workout.name,
      duration_min: workout.duration_min,
      logged_at: new Date().toISOString(),
    });
    if (onComplete) onComplete();
    load();
  };

  if (active) {
    return <ClientWorkoutSession workout={active} onClose={() => setActive(null)} onComplete={() => { handleComplete(active); setActive(null); }} />;
  }

  // סטטיסטיקות שבוע
  const totalTarget = workouts.reduce((s, w) => s + (Number(w.weekly_target) || 1), 0);
  const completedThisWeek = thisWeekLogs.length;
  const pct = totalTarget > 0 ? Math.round((completedThisWeek / totalTarget) * 100) : 0;

  if (loading) {
    return <p style={{ textAlign: 'center', padding: 30, color: COLORS.textMuted }}>טוענת...</p>;
  }

  if (workouts.length === 0) {
    return (
      <div style={{ ...card, textAlign: 'center', padding: 30, margin: 14 }}>
        <p style={{ fontSize: 24, margin: '0 0 8px' }}>🏋️</p>
        <p style={{ color: COLORS.textMuted, fontSize: 13, margin: 0 }}>
          המאמנת עדיין לא הגדירה לך אימונים.<br/>
          פני אליה לעזרה 💜
        </p>
      </div>
    );
  }

  return (
    <div style={{ direction: 'rtl', padding: 14 }}>
      {/* התקדמות שבוע */}
      <div style={{ ...card, background: `linear-gradient(135deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 100%)`, color: 'white', border: 'none' }}>
        <p style={{ margin: 0, fontSize: 11, opacity: 0.9 }}>השבוע שלי</p>
        <p style={{ margin: '4px 0 8px', fontSize: 24, fontWeight: 800 }}>
          {completedThisWeek} / {totalTarget} <span style={{ fontSize: 13, fontWeight: 500, opacity: 0.85 }}>אימונים</span>
        </p>
        <div style={{ height: 6, background: 'rgba(255,255,255,0.25)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: 'white', transition: 'width 0.3s' }} />
        </div>
      </div>

      <h3 style={{ fontSize: 14, fontWeight: 700, margin: '14px 0 8px' }}>
        בחרי אימון להיום
      </h3>

      {workouts.map(w => {
        const doneCount = thisWeekLogs.filter(l => l.client_workout_id === w.id).length;
        const target = Number(w.weekly_target) || 1;
        const isComplete = doneCount >= target;

        return (
          <div key={w.id} style={{ ...card, opacity: isComplete ? 0.6 : 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>
                  {isComplete && '✅ '}{w.name}
                </h4>
                {w.description && <p style={{ margin: '2px 0 0', fontSize: 11, color: COLORS.textMuted }}>{w.description}</p>}
              </div>
              <span style={{ fontSize: 11, color: isComplete ? COLORS.green : COLORS.textMuted, fontWeight: 600 }}>
                {doneCount}/{target}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, fontSize: 11, color: COLORS.textMuted, marginBottom: 10 }}>
              <span>💪 {(w.exercises || []).length} תרגילים</span>
              {w.duration_min && <span>⏱️ {w.duration_min} דק׳</span>}
            </div>
            <button
              onClick={() => setActive(w)}
              style={{ ...btn, width: '100%', padding: 10 }}
            >
              ▶ התחילי אימון
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// סשן אימון — הצגת תרגילים + סימון השלמה
// ───────────────────────────────────────────────────────────────
function ClientWorkoutSession({ workout, onClose, onComplete }) {
  const [done, setDone] = useState({});

  const exercises = workout.exercises || [];
  const allDone = exercises.length > 0 && exercises.every((_, i) => done[i]);

  return (
    <div style={{ direction: 'rtl', padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <button onClick={onClose} style={btnGhost}>← חזרה</button>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{workout.name}</h2>
      </div>

      {exercises.map((ex, i) => (
        <div key={i} style={{ ...card, background: done[i] ? COLORS.greenSoft : 'white', borderColor: done[i] ? COLORS.green : COLORS.border }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>
                {done[i] && '✅ '}{ex.name}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 11, color: COLORS.textMuted }}>
                {ex.sets} סטים × {ex.reps} חזרות {ex.weight && `· ${ex.weight}`}
              </p>
            </div>
            <button
              onClick={() => setDone({ ...done, [i]: !done[i] })}
              style={{
                ...btn,
                background: done[i] ? COLORS.green : COLORS.primarySoft,
                color: done[i] ? 'white' : COLORS.primaryDark,
                padding: '6px 14px',
                fontSize: 12,
              }}
            >
              {done[i] ? 'בוצע' : 'סמני'}
            </button>
          </div>
        </div>
      ))}

      <button
        onClick={onComplete}
        disabled={!allDone && exercises.length > 0}
        style={{
          ...btn,
          width: '100%',
          padding: 14,
          marginTop: 10,
          background: allDone ? COLORS.green : COLORS.primary,
          opacity: (!allDone && exercises.length > 0) ? 0.5 : 1,
        }}
      >
        {allDone ? '🎉 סיימתי את האימון!' : 'סמני "סיימתי"'}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 👩 CLIENT — תצוגת תפריטים
// ═══════════════════════════════════════════════════════════════
export function ClientMealPlanView({ clientId, onLogMeal }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => { load(); }, [clientId]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('meal_plans')
        .select('*, meal_plan_meals(*)')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });
      if (data) {
        // מיון ארוחות בכל תפריט לפי position
        const sorted = data.map(p => ({
          ...p,
          meal_plan_meals: (p.meal_plan_meals || []).sort((a, b) => (a.position || 0) - (b.position || 0)),
        }));
        setPlans(sorted);
        if (sorted.length > 0 && !selectedPlan) setSelectedPlan(sorted[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  const logMeal = async (m) => {
    if (!confirm(`לרשום שאכלת "${m.name}"?`)) return;
    await supabase.from('meal_logs').insert({
      client_id: clientId,
      meal_plan_meal_id: m.id,
      name: m.name,
      meal_type: m.meal_type || 'snack',
      calories: Number(m.total_kcal) || 0,
      protein_g: Number(m.total_p) || 0,
      carbs_g: Number(m.total_c) || 0,
      fat_g: Number(m.total_f) || 0,
      logged_at: new Date().toISOString(),
    });
    if (onLogMeal) onLogMeal();
    alert('✅ נרשם!');
  };

  if (loading) return <p style={{ textAlign: 'center', padding: 30, color: COLORS.textMuted }}>טוענת...</p>;

  if (plans.length === 0) {
    return (
      <div style={{ ...card, textAlign: 'center', padding: 30, margin: 14 }}>
        <p style={{ fontSize: 24, margin: '0 0 8px' }}>🍽️</p>
        <p style={{ color: COLORS.textMuted, fontSize: 13, margin: 0 }}>
          המאמנת עדיין לא הכינה לך תפריט.<br/>
          פני אליה לעזרה 💜
        </p>
      </div>
    );
  }

  return (
    <div style={{ direction: 'rtl', padding: 14 }}>
      {/* בורר תפריטים */}
      {plans.length > 1 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto' }}>
          {plans.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPlan(p)}
              style={{
                ...btn,
                whiteSpace: 'nowrap',
                background: selectedPlan?.id === p.id ? COLORS.primary : 'white',
                color: selectedPlan?.id === p.id ? 'white' : COLORS.text,
                border: `1px solid ${selectedPlan?.id === p.id ? COLORS.primary : COLORS.border}`,
                padding: '8px 14px',
                fontSize: 12,
              }}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {selectedPlan && (
        <>
          {selectedPlan.description && (
            <p style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12, padding: '0 4px' }}>
              {selectedPlan.description}
            </p>
          )}

          {(selectedPlan.meal_plan_meals || []).map(m => (
            <div key={m.id} style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{m.name}</h4>
                  {m.notes && <p style={{ margin: '2px 0 0', fontSize: 11, color: COLORS.textMuted }}>{m.notes}</p>}
                </div>
                <span style={{ fontSize: 11, color: COLORS.amber, fontWeight: 600 }}>
                  🔥 {Math.round(Number(m.total_kcal) || 0)} קק״ל
                </span>
              </div>

              {/* רשימת מזונות בארוחה */}
              {(m.items || []).length > 0 && (
                <div style={{ background: COLORS.bg, borderRadius: 8, padding: 8, margin: '8px 0' }}>
                  {(m.items || []).map((it, i) => (
                    <p key={i} style={{ margin: '2px 0', fontSize: 12, color: COLORS.text }}>
                      • {it.name} — {it.qty}{it.unit === 'g' ? 'ג' : ' מנות'}
                    </p>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, fontSize: 11, color: COLORS.textMuted, marginBottom: 8 }}>
                <span>💪 {Math.round(Number(m.total_p) || 0)}ג</span>
                <span>🍞 {Math.round(Number(m.total_c) || 0)}ג</span>
                <span>🥑 {Math.round(Number(m.total_f) || 0)}ג</span>
              </div>

              <button onClick={() => logMeal(m)} style={{ ...btn, width: '100%', padding: 10, fontSize: 13 }}>
                ✅ אכלתי את הארוחה הזו
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
