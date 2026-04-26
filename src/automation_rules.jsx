// ═══════════════════════════════════════════════════════════════
// src/automation_rules.jsx
// חוקי אוטומציה — "אם X אז Y" לניהול לקוחות
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

const COLORS = {
  bg: '#F5F2FA', primary: '#B19CD9', primaryDark: '#8B72B5',
  primarySoft: '#E8DFF5', text: '#2E2A3D', textMuted: '#756B85',
  border: '#DDD0EB', green: '#6BAF8A', greenSoft: '#E0F2EB',
  amber: '#E8C96A', amberSoft: '#F5EECD', red: '#C88A8A', redSoft: '#FADDDD',
};

const card = {
  background: 'white', border: `1px solid ${COLORS.border}`,
  borderRadius: 16, padding: 16,
};

/* ═══════════════════════════════════════════════════════════
   הגדרות הקונדיציות והפעולות
═══════════════════════════════════════════════════════════ */

export const TRIGGER_TYPES = [
  { id: 'no_log_days', label: 'לא רשמה X ימים ברצף', icon: '📵', param: 'days', paramLabel: 'מספר ימים', defaultParam: 3 },
  { id: 'streak_reached', label: 'הגיעה ל-X ימי streak', icon: '🔥', param: 'days', paramLabel: 'ימי streak', defaultParam: 7 },
  { id: 'weight_milestone', label: 'ירדה X ק"ג מהתחלה', icon: '⚖️', param: 'kg', paramLabel: 'ק"ג שירדה', defaultParam: 5 },
  { id: 'low_score_days', label: 'ציון נמוך X ימים ברצף', icon: '⚠️', param: 'days', paramLabel: 'מספר ימים', defaultParam: 3 },
  { id: 'no_workout_days', label: 'לא התאמנה X ימים', icon: '🏃', param: 'days', paramLabel: 'מספר ימים', defaultParam: 5 },
  { id: 'target_reached', label: 'הגיעה ליעד המשקל', icon: '🎯', param: null, paramLabel: null, defaultParam: null },
  { id: 'weekly_checkin', label: 'כל יום X בשבוע', icon: '📅', param: 'day', paramLabel: 'יום (0=א׳ - 6=ש׳)', defaultParam: 0 },
];

export const ACTION_TYPES = [
  { id: 'send_message', label: 'שלחי הודעה ללקוחה', icon: '💬' },
  { id: 'send_notification', label: 'שלחי התראה ללקוחה', icon: '🔔' },
  { id: 'flag_attention', label: 'סמני לקוחה "לתשומת לב"', icon: '🚨' },
  { id: 'schedule_checkin', label: 'קבעי תזכורת לעצמך לצור קשר', icon: '📌' },
];

const DEFAULT_RULES = [
  {
    id: 'default_1',
    name: 'תזכורת לאחר 3 ימי שקט',
    trigger_type: 'no_log_days',
    trigger_param: 3,
    action_type: 'send_message',
    action_message: 'היי 💜 שמתי לב שלא רשמת כמה ימים — הכל בסדר? אני כאן אם צריך',
    is_active: true,
    is_default: true,
  },
  {
    id: 'default_2',
    name: 'חיזוק על 7 ימי streak',
    trigger_type: 'streak_reached',
    trigger_param: 7,
    action_type: 'send_message',
    action_message: 'תותחית! 🔥 שבוע רצוף — את מדהימה אותי! ממשיכים ככה 💜',
    is_active: true,
    is_default: true,
  },
  {
    id: 'default_3',
    name: 'ציון נמוך 3 ימים',
    trigger_type: 'low_score_days',
    trigger_param: 3,
    action_type: 'flag_attention',
    action_message: '',
    is_active: true,
    is_default: true,
  },
  {
    id: 'default_4',
    name: 'הגיעה ליעד המשקל 🎉',
    trigger_type: 'target_reached',
    trigger_param: null,
    action_type: 'send_message',
    action_message: 'כל הכבוד! 🎯🎉 הגעת ליעד המשקל שלך — כמה גאה אני בך! בואי נקבע יעד חדש',
    is_active: true,
    is_default: true,
  },
];

/* ═══════════════════════════════════════════════════════════
   API
═══════════════════════════════════════════════════════════ */

export async function loadAutomationRules(coachId) {
  const { data, error } = await supabase
    .from('automation_rules')
    .select('*')
    .eq('coach_id', coachId)
    .order('created_at', { ascending: true });
  return { data: data || [], error };
}

export async function saveAutomationRule(coachId, rule) {
  const payload = {
    coach_id: coachId,
    name: rule.name,
    trigger_type: rule.trigger_type,
    trigger_param: rule.trigger_param,
    action_type: rule.action_type,
    action_message: rule.action_message || '',
    is_active: rule.is_active !== false,
  };

  if (rule.id && !rule.is_default) {
    const { data, error } = await supabase
      .from('automation_rules')
      .update(payload)
      .eq('id', rule.id)
      .select()
      .single();
    return { data, error };
  } else {
    const { data, error } = await supabase
      .from('automation_rules')
      .insert(payload)
      .select()
      .single();
    return { data, error };
  }
}

export async function toggleAutomationRule(id, isActive) {
  return supabase.from('automation_rules').update({ is_active: isActive }).eq('id', id);
}

export async function deleteAutomationRule(id) {
  return supabase.from('automation_rules').delete().eq('id', id);
}

export async function seedDefaultRules(coachId) {
  const { data: existing } = await supabase
    .from('automation_rules')
    .select('id')
    .eq('coach_id', coachId)
    .limit(1);
  if (existing && existing.length > 0) return;

  const inserts = DEFAULT_RULES.map(r => ({
    coach_id: coachId,
    name: r.name,
    trigger_type: r.trigger_type,
    trigger_param: r.trigger_param,
    action_type: r.action_type,
    action_message: r.action_message,
    is_active: r.is_active,
  }));
  await supabase.from('automation_rules').insert(inserts);
}

/* ═══════════════════════════════════════════════════════════
   מנוע ביצוע — בדיקת חוקים מול לקוחות
═══════════════════════════════════════════════════════════ */

export async function evaluateRulesForCoach(coachId) {
  const [rulesRes, clientsRes] = await Promise.all([
    loadAutomationRules(coachId),
    supabase.from('clients').select('*').eq('coach_id', coachId).eq('is_archived', false),
  ]);

  const rules = (rulesRes.data || []).filter(r => r.is_active);
  const clients = clientsRes.data || [];
  const actions = []; // [{ rule, client, triggered: true }]

  for (const client of clients) {
    for (const rule of rules) {
      const triggered = await checkRuleTrigger(rule, client);
      if (triggered) {
        actions.push({ rule, client, triggered: true });
      }
    }
  }

  return actions;
}

async function checkRuleTrigger(rule, client) {
  const today = new Date().toISOString().slice(0, 10);

  switch (rule.trigger_type) {

    case 'no_log_days': {
      // בדוק כמה ימים ברצף ללא רישום ארוחה
      const daysBack = rule.trigger_param || 3;
      const since = new Date(Date.now() - daysBack * 86400000).toISOString();
      const { data } = await supabase
        .from('meal_logs')
        .select('id')
        .eq('client_id', client.id)
        .gte('logged_at', since)
        .limit(1);
      return !data || data.length === 0;
    }

    case 'streak_reached': {
      const target = rule.trigger_param || 7;
      return (client.streak || 0) === target; // בדיוק היום הגיעה
    }

    case 'weight_milestone': {
      const kgTarget = rule.trigger_param || 5;
      const dropped = (client.start_weight || client.weight) - client.weight;
      // בדוק אם הגיעה היום בדיוק (עדכון אחרון)
      const { data: wLog } = await supabase
        .from('weight_logs')
        .select('*')
        .eq('client_id', client.id)
        .gte('logged_at', new Date(Date.now() - 86400000).toISOString())
        .limit(1);
      return wLog && wLog.length > 0 && dropped >= kgTarget;
    }

    case 'low_score_days': {
      const daysBack = rule.trigger_param || 3;
      const since = new Date(Date.now() - daysBack * 86400000).toISOString().slice(0, 10);
      const { data } = await supabase
        .from('daily_scores')
        .select('total_score, score_date')
        .eq('client_id', client.id)
        .gte('score_date', since)
        .order('score_date', { ascending: false });
      if (!data || data.length < daysBack) return false;
      return data.slice(0, daysBack).every(s => s.total_score < 50);
    }

    case 'target_reached': {
      if (!client.current_weight || !client.target_weight) return false;
      const { data: wLog } = await supabase
        .from('weight_logs')
        .select('*')
        .eq('client_id', client.id)
        .gte('logged_at', new Date(Date.now() - 86400000).toISOString())
        .limit(1);
      return wLog && wLog.length > 0 &&
        Math.abs(client.current_weight - client.target_weight) <= 0.5;
    }

    case 'weekly_checkin': {
      const targetDay = rule.trigger_param || 0;
      return new Date().getDay() === targetDay;
    }

    default:
      return false;
  }
}

/* ═══════════════════════════════════════════════════════════
   ביצוע פעולה
═══════════════════════════════════════════════════════════ */

export async function executeAction(rule, client) {
  switch (rule.action_type) {
    case 'send_message':
    case 'send_notification': {
      if (!rule.action_message) break;
      // בדוק שלא נשלח כבר היום
      const today = new Date().toISOString().slice(0, 10);
      const { data: existing } = await supabase
        .from('automation_log')
        .select('id')
        .eq('rule_id', rule.id)
        .eq('client_id', client.id)
        .gte('triggered_at', today)
        .limit(1);
      if (existing && existing.length > 0) return; // כבר פעל היום

      const msg = rule.action_message
        .replace('{name}', client.full_name?.split(' ')[0] || client.name?.split(' ')[0] || '')
        .replace('{streak}', client.streak || 0);

      await supabase.from('messages').insert({
        from_id: client.coach_id,
        to_id: client.id,
        content: `🤖 ${msg}`,
        sent_at: new Date().toISOString(),
      });

      await supabase.from('automation_log').insert({
        rule_id: rule.id,
        client_id: client.id,
        action_type: rule.action_type,
        triggered_at: new Date().toISOString(),
      });
      break;
    }

    case 'flag_attention': {
      await supabase.from('clients').update({ needs_attention: true }).eq('id', client.id);
      break;
    }

    case 'schedule_checkin': {
      await supabase.from('automation_log').insert({
        rule_id: rule.id,
        client_id: client.id,
        action_type: 'checkin_reminder',
        triggered_at: new Date().toISOString(),
      });
      break;
    }
  }
}

/* ═══════════════════════════════════════════════════════════
   קומפוננטה: ניהול חוקי אוטומציה
═══════════════════════════════════════════════════════════ */

export function AutomationRulesManager({ coachId, onBack }) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editRule, setEditRule] = useState(null);
  const [saving, setSaving] = useState(false);
  const [runResults, setRunResults] = useState(null);
  const [running, setRunning] = useState(false);

  const emptyRule = {
    name: '',
    trigger_type: 'no_log_days',
    trigger_param: 3,
    action_type: 'send_message',
    action_message: '',
    is_active: true,
  };

  const load = async () => {
    setLoading(true);
    await seedDefaultRules(coachId);
    const { data } = await loadAutomationRules(coachId);
    setRules(data);
    setLoading(false);
  };

  useEffect(() => { if (coachId) load(); }, [coachId]);

  const handleToggle = async (rule) => {
    await toggleAutomationRule(rule.id, !rule.is_active);
    setRules(prev => prev.map(r => r.id === rule.id ? { ...r, is_active: !r.is_active } : r));
  };

  const handleDelete = async (id) => {
    if (!confirm('למחוק את החוק?')) return;
    await deleteAutomationRule(id);
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const handleSave = async () => {
    if (!editRule.name.trim() || !editRule.trigger_type || !editRule.action_type) {
      alert('מלאי שם, טריגר ופעולה');
      return;
    }
    setSaving(true);
    const { data, error } = await saveAutomationRule(coachId, editRule);
    setSaving(false);
    if (error) { alert('שגיאה: ' + error.message); return; }
    await load();
    setEditRule(null);
    setShowAdd(false);
  };

  const handleRunNow = async () => {
    setRunning(true);
    const actions = await evaluateRulesForCoach(coachId);
    for (const a of actions) {
      await executeAction(a.rule, a.client);
    }
    setRunResults(actions);
    setRunning(false);
  };

  const triggerMeta = (type) => TRIGGER_TYPES.find(t => t.id === type) || {};
  const actionMeta = (type) => ACTION_TYPES.find(a => a.id === type) || {};

  if (loading) return (
    <main style={{ padding: 14, textAlign: 'center', color: COLORS.textMuted }}>טוענת...</main>
  );

  return (
    <main style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12, direction: 'rtl' }}>

      {/* כותרת */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {onBack && (
          <button onClick={onBack} style={{ background: 'white', border: `1px solid ${COLORS.border}`, borderRadius: 10, width: 36, height: 36, cursor: 'pointer', fontSize: 16, fontFamily: 'inherit' }}>←</button>
        )}
        <div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: COLORS.primaryDark }}>⚡ חוקי אוטומציה</h2>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: COLORS.textMuted }}>הודעות ופעולות שיופעלו אוטומטית</p>
        </div>
      </div>

      {/* הסבר */}
      <div style={{ background: COLORS.primarySoft, borderRadius: 12, padding: '10px 14px' }}>
        <p style={{ margin: 0, fontSize: 12, color: COLORS.primaryDark, lineHeight: 1.5 }}>
          💡 חוקי אוטומציה חוסכים לך זמן — הם בודקים לקוחות אוטומטית ושולחים הודעות בזמן הנכון, בלי שתצטרכי לזכור.
        </p>
      </div>

      {/* כפתורי פעולה */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => { setEditRule({ ...emptyRule }); setShowAdd(true); }} style={{
          flex: 1, background: COLORS.primary, color: 'white', border: 'none',
          padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        }}>+ חוק חדש</button>
        <button onClick={handleRunNow} disabled={running} style={{
          background: COLORS.greenSoft, color: COLORS.green, border: `1px solid ${COLORS.green}`,
          padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700,
          cursor: running ? 'default' : 'pointer', fontFamily: 'inherit',
          opacity: running ? 0.6 : 1,
        }}>{running ? '⏳' : '▶ הפעל עכשיו'}</button>
      </div>

      {/* תוצאות הרצה */}
      {runResults !== null && (
        <div style={{ background: runResults.length > 0 ? COLORS.greenSoft : '#F5F5F5', borderRadius: 12, padding: 12 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: runResults.length > 0 ? COLORS.green : COLORS.textMuted }}>
            {runResults.length > 0
              ? `✅ הופעלו ${runResults.length} פעולות אוטומטיות`
              : '📭 לא נמצאו לקוחות שעומדות בתנאים כרגע'}
          </p>
          {runResults.map((r, i) => (
            <p key={i} style={{ margin: '4px 0 0', fontSize: 11, color: COLORS.text }}>
              {actionMeta(r.rule.action_type).icon} {r.rule.name} → {r.client.full_name || r.client.name}
            </p>
          ))}
        </div>
      )}

      {/* טופס הוספה/עריכה */}
      {(showAdd || editRule) && (
        <RuleForm
          rule={editRule || emptyRule}
          onChange={setEditRule}
          onSave={handleSave}
          onCancel={() => { setEditRule(null); setShowAdd(false); }}
          saving={saving}
        />
      )}

      {/* רשימת חוקים */}
      {rules.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: 30 }}>
          <p style={{ margin: 0, fontSize: 13, color: COLORS.textMuted }}>עוד אין חוקים. לחצי "+ חוק חדש" כדי להתחיל</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rules.map(rule => (
            <RuleCard
              key={rule.id}
              rule={rule}
              onToggle={() => handleToggle(rule)}
              onEdit={() => { setEditRule({ ...rule }); setShowAdd(false); }}
              onDelete={() => handleDelete(rule.id)}
            />
          ))}
        </div>
      )}
    </main>
  );
}

/* ═══════════════════════════════════════════════════════════
   כרטיס חוק
═══════════════════════════════════════════════════════════ */

function RuleCard({ rule, onToggle, onEdit, onDelete }) {
  const trigger = TRIGGER_TYPES.find(t => t.id === rule.trigger_type) || {};
  const action = ACTION_TYPES.find(a => a.id === rule.action_type) || {};

  return (
    <div style={{
      ...card, padding: '12px 14px',
      opacity: rule.is_active ? 1 : 0.55,
      borderRight: `4px solid ${rule.is_active ? COLORS.primary : COLORS.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {/* Toggle */}
        <button onClick={onToggle} style={{
          width: 38, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
          background: rule.is_active ? COLORS.primary : '#DDD',
          position: 'relative', flexShrink: 0, marginTop: 2,
        }}>
          <div style={{
            width: 16, height: 16, borderRadius: '50%', background: 'white',
            position: 'absolute', top: 3, transition: '0.2s',
            left: rule.is_active ? 18 : 3,
          }} />
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: COLORS.text }}>{rule.name}</p>
          <div style={{ display: 'flex', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
            <span style={{ background: COLORS.primarySoft, color: COLORS.primaryDark, borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 600 }}>
              {trigger.icon} {trigger.label?.replace('X', rule.trigger_param || '')}
            </span>
            <span style={{ fontSize: 10, color: COLORS.textMuted, alignSelf: 'center' }}>→</span>
            <span style={{ background: COLORS.greenSoft, color: COLORS.green, borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 600 }}>
              {action.icon} {action.label}
            </span>
          </div>
          {rule.action_message && (
            <p style={{ margin: '6px 0 0', fontSize: 11, color: COLORS.textMuted, lineHeight: 1.4, fontStyle: 'italic' }}>
              "{rule.action_message.slice(0, 60)}{rule.action_message.length > 60 ? '...' : ''}"
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button onClick={onEdit} style={{ background: COLORS.primarySoft, border: 'none', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', fontSize: 13 }}>✏️</button>
          <button onClick={onDelete} style={{ background: COLORS.redSoft, border: 'none', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', fontSize: 13 }}>🗑</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   טופס חוק
═══════════════════════════════════════════════════════════ */

function RuleForm({ rule, onChange, onSave, onCancel, saving }) {
  const triggerMeta = TRIGGER_TYPES.find(t => t.id === rule.trigger_type) || {};
  const inp = {
    padding: '9px 12px', border: `1px solid ${COLORS.border}`,
    borderRadius: 10, fontSize: 12, fontFamily: 'inherit',
    outline: 'none', width: '100%', boxSizing: 'border-box', background: 'white',
  };

  return (
    <div style={{ ...card, background: COLORS.primarySoft, border: `1px solid ${COLORS.primary}` }}>
      <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: COLORS.primaryDark }}>
        {rule.id ? '✏️ עריכת חוק' : '+ חוק חדש'}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* שם */}
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 11, color: COLORS.textMuted, fontWeight: 600 }}>שם החוק</p>
          <input value={rule.name} onChange={e => onChange({ ...rule, name: e.target.value })}
            placeholder='לדוגמה: "תזכורת אחרי 3 ימי שקט"' style={inp} />
        </div>

        {/* טריגר */}
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 11, color: COLORS.textMuted, fontWeight: 600 }}>🔍 כאשר...</p>
          <select value={rule.trigger_type} onChange={e => {
            const meta = TRIGGER_TYPES.find(t => t.id === e.target.value);
            onChange({ ...rule, trigger_type: e.target.value, trigger_param: meta?.defaultParam });
          }} style={inp}>
            {TRIGGER_TYPES.map(t => (
              <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
            ))}
          </select>
        </div>

        {/* פרמטר */}
        {triggerMeta.param && (
          <div>
            <p style={{ margin: '0 0 4px', fontSize: 11, color: COLORS.textMuted, fontWeight: 600 }}>{triggerMeta.paramLabel}</p>
            <input type="number" value={rule.trigger_param || ''} min={1}
              onChange={e => onChange({ ...rule, trigger_param: Number(e.target.value) })}
              style={{ ...inp, width: 100 }} />
          </div>
        )}

        {/* פעולה */}
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 11, color: COLORS.textMuted, fontWeight: 600 }}>⚡ אז...</p>
          <select value={rule.action_type} onChange={e => onChange({ ...rule, action_type: e.target.value })} style={inp}>
            {ACTION_TYPES.map(a => (
              <option key={a.id} value={a.id}>{a.icon} {a.label}</option>
            ))}
          </select>
        </div>

        {/* הודעה */}
        {(rule.action_type === 'send_message' || rule.action_type === 'send_notification') && (
          <div>
            <p style={{ margin: '0 0 4px', fontSize: 11, color: COLORS.textMuted, fontWeight: 600 }}>
              תוכן ההודעה <span style={{ fontSize: 10, fontWeight: 400 }}>({'{name}'} = שם לקוחה, {'{streak}'} = streak)</span>
            </p>
            <textarea value={rule.action_message || ''}
              onChange={e => onChange({ ...rule, action_message: e.target.value })}
              placeholder='לדוגמה: "היי {name}, שמתי לב שלא רשמת — הכל בסדר? 💜"'
              rows={3}
              style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }} />
          </div>
        )}

        {/* כפתורים */}
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button onClick={onSave} disabled={saving} style={{
            flex: 1, background: COLORS.primary, color: 'white', border: 'none',
            padding: '11px', borderRadius: 10, fontSize: 13, fontWeight: 700,
            cursor: saving ? 'default' : 'pointer', fontFamily: 'inherit',
            opacity: saving ? 0.6 : 1,
          }}>{saving ? 'שומרת...' : '💾 שמור'}</button>
          <button onClick={onCancel} style={{
            background: 'white', color: COLORS.text, border: `1px solid ${COLORS.border}`,
            padding: '11px 16px', borderRadius: 10, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
          }}>ביטול</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   קומפוננטת "הפעל בדיקה" — להצגה בדשבורד
═══════════════════════════════════════════════════════════ */

export function AutomationStatusBadge({ coachId, onOpenRules }) {
  const [ruleCount, setRuleCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    if (!coachId) return;
    loadAutomationRules(coachId).then(({ data }) => {
      setRuleCount(data.length);
      setActiveCount(data.filter(r => r.is_active).length);
    });
  }, [coachId]);

  return (
    <button onClick={onOpenRules} style={{
      background: activeCount > 0 ? COLORS.greenSoft : '#F5F5F5',
      border: `1px solid ${activeCount > 0 ? COLORS.green : COLORS.border}`,
      borderRadius: 10, padding: '8px 12px',
      display: 'flex', alignItems: 'center', gap: 8,
      cursor: 'pointer', fontFamily: 'inherit', width: '100%',
    }}>
      <span style={{ fontSize: 16 }}>⚡</span>
      <div style={{ flex: 1, textAlign: 'right' }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: activeCount > 0 ? COLORS.green : COLORS.textMuted }}>
          {activeCount > 0 ? `${activeCount} חוקים פעילים` : 'אין חוקי אוטומציה'}
        </p>
        <p style={{ margin: '1px 0 0', fontSize: 10, color: COLORS.textMuted }}>לחצי לניהול</p>
      </div>
      <span style={{ fontSize: 12, color: COLORS.textMuted }}>←</span>
    </button>
  );
}
