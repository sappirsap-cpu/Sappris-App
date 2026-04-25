// ═══════════════════════════════════════════════════════════════
// src/coach_tools.jsx
// כלי עזר למאמנת: תבניות הודעות, ייצוא CSV, ארכיון
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
   1. תבניות הודעות מהירות
═══════════════════════════════════════════════════════════ */

const DEFAULT_TEMPLATES = [
  { category: 'encouragement', icon: '💪', title: 'חיזוק', body: 'את עושה עבודה מדהימה! 💜 ממשיכה בדיוק ככה' },
  { category: 'encouragement', icon: '🔥', title: 'streak מצוין', body: 'תותחית! ראיתי שכבר שבוע רצוף את עקבית — מרשים אותי 🔥' },
  { category: 'reminder',      icon: '🔔', title: 'תזכורת רישום', body: 'היי 💜 שמתי לב שלא רשמת היום — הכל בסדר?' },
  { category: 'reminder',      icon: '💧', title: 'תזכורת מים', body: 'אל תשכחי לשתות מים היום! 💧 קצת יותר אנרגיה מחכה לך' },
  { category: 'milestone',     icon: '🎯', title: 'הגעת ליעד', body: 'איזה כיף! הגעת לאבן דרך משמעותית 🎉 גאה בך מאוד' },
  { category: 'check_in',      icon: '☕', title: 'איך את?', body: 'בוקר טוב ☕ איך את מרגישה היום? משהו על הלב?' },
];

export async function listMessageTemplates(coachId) {
  const { data, error } = await supabase
    .from('message_templates')
    .select('*')
    .eq('coach_id', coachId)
    .order('use_count', { ascending: false });
  return { data: data || [], error };
}

export async function saveMessageTemplate(coachId, template) {
  const { data, error } = await supabase
    .from('message_templates')
    .insert({
      coach_id: coachId,
      category: template.category || 'custom',
      title: template.title,
      body: template.body,
      icon: template.icon || '💜',
    })
    .select()
    .single();
  return { data, error };
}

export async function deleteMessageTemplate(id) {
  return supabase.from('message_templates').delete().eq('id', id);
}

export async function incrementTemplateUsage(id) {
  // עדכון use_count
  const { data: t } = await supabase.from('message_templates').select('use_count').eq('id', id).single();
  if (t) {
    await supabase.from('message_templates').update({ use_count: (t.use_count || 0) + 1 }).eq('id', id);
  }
}

export async function seedDefaultTemplates(coachId) {
  // בדיקה אם כבר יש
  const { data: existing } = await supabase.from('message_templates').select('id').eq('coach_id', coachId).limit(1);
  if (existing && existing.length > 0) return; // כבר יש

  const inserts = DEFAULT_TEMPLATES.map(t => ({ ...t, coach_id: coachId }));
  await supabase.from('message_templates').insert(inserts);
}

/* קומפוננטת בורר תבניות מהיר — מוצגת בתוך מסך הצ׳אט */
export function MessageTemplatePicker({ coachId, onSelect, onClose }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newIcon, setNewIcon] = useState('💜');

  useEffect(() => {
    if (!coachId) return;
    seedDefaultTemplates(coachId).then(() => {
      listMessageTemplates(coachId).then(({ data }) => {
        setTemplates(data);
        setLoading(false);
      });
    });
  }, [coachId]);

  const handleSelect = async (t) => {
    onSelect(t.body);
    incrementTemplateUsage(t.id);
  };

  const handleAdd = async () => {
    if (!newTitle.trim() || !newBody.trim()) return;
    const { data } = await saveMessageTemplate(coachId, {
      title: newTitle.trim(),
      body: newBody.trim(),
      icon: newIcon,
      category: 'custom',
    });
    if (data) setTemplates(prev => [data, ...prev]);
    setNewTitle(''); setNewBody(''); setAdding(false);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('למחוק את התבנית?')) return;
    await deleteMessageTemplate(id);
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(46,42,61,0.5)', backdropFilter: 'blur(6px)',
      zIndex: 100, display: 'flex', alignItems: 'flex-end',
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'white', width: '100%',
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        padding: 16, maxHeight: '70vh', overflowY: 'auto',
        direction: 'rtl', fontFamily: 'system-ui, sans-serif',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: COLORS.text }}>💬 תבניות מהירות</p>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', fontSize: 18,
            cursor: 'pointer', color: COLORS.textMuted,
          }}>✕</button>
        </div>

        {loading ? <p style={{ textAlign: 'center', padding: 20 }}>טוענת...</p> : (
          <>
            {!adding && (
              <button
                onClick={() => setAdding(true)}
                style={{
                  width: '100%', marginBottom: 12,
                  background: COLORS.primarySoft, color: COLORS.primaryDark,
                  border: `1px dashed ${COLORS.primary}`, padding: 10, borderRadius: 10,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                + תבנית חדשה
              </button>
            )}

            {adding && (
              <div style={{ ...card, marginBottom: 12, background: COLORS.primarySoft }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  <input
                    value={newIcon}
                    onChange={(e) => setNewIcon(e.target.value)}
                    placeholder="💜"
                    style={{
                      width: 50, padding: 8, border: `1px solid ${COLORS.border}`,
                      borderRadius: 8, fontSize: 16, textAlign: 'center', fontFamily: 'inherit',
                    }}
                  />
                  <input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="שם התבנית"
                    style={{
                      flex: 1, padding: 8, border: `1px solid ${COLORS.border}`,
                      borderRadius: 8, fontSize: 12, fontFamily: 'inherit',
                    }}
                  />
                </div>
                <textarea
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  placeholder="טקסט ההודעה"
                  rows={3}
                  style={{
                    width: '100%', padding: 8, border: `1px solid ${COLORS.border}`,
                    borderRadius: 8, fontSize: 12, fontFamily: 'inherit',
                    resize: 'vertical', boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <button onClick={handleAdd} style={{
                    flex: 1, background: COLORS.primary, color: 'white',
                    border: 'none', padding: 8, borderRadius: 8,
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  }}>שמרי</button>
                  <button onClick={() => setAdding(false)} style={{
                    background: 'white', color: COLORS.textMuted,
                    border: `1px solid ${COLORS.border}`, padding: 8, borderRadius: 8,
                    fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                  }}>ביטול</button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {templates.map(t => (
                <div key={t.id}
                  onClick={() => handleSelect(t)}
                  style={{
                    ...card, padding: 12, cursor: 'pointer',
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                  }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{t.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: COLORS.text }}>
                      {t.title}
                    </p>
                    <p style={{
                      margin: '4px 0 0', fontSize: 11, color: COLORS.textMuted,
                      lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    }}>
                      {t.body}
                    </p>
                    {t.use_count > 0 && (
                      <p style={{ margin: '4px 0 0', fontSize: 9, color: COLORS.primary }}>
                        🔥 {t.use_count} שימושים
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleDelete(t.id, e)}
                    style={{
                      background: 'transparent', border: 'none', fontSize: 14,
                      color: COLORS.textMuted, cursor: 'pointer', flexShrink: 0,
                    }}
                  >🗑️</button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   2. ייצוא CSV של נתוני לקוחה
═══════════════════════════════════════════════════════════ */

export async function exportClientCSV(clientId) {
  // טען את כל הנתונים
  const [profile, scores, sleep, weights, meals] = await Promise.all([
    supabase.from('clients').select('*').eq('id', clientId).single(),
    supabase.from('daily_scores').select('*').eq('client_id', clientId).order('score_date', { ascending: false }),
    supabase.from('sleep_logs').select('*').eq('client_id', clientId).order('logged_for', { ascending: false }),
    supabase.from('weight_logs').select('*').eq('client_id', clientId).order('logged_at', { ascending: false }),
    supabase.from('meals').select('*').eq('client_id', clientId).order('logged_at', { ascending: false }).limit(500),
  ]);

  const name = profile.data?.full_name || 'client';
  const today = new Date().toISOString().slice(0, 10);

  // בנה CSV
  let csv = '\uFEFF'; // BOM לעברית
  csv += `=== דוח של ${name} ===\n`;
  csv += `הופק בתאריך: ${today}\n\n`;

  csv += `--- ציונים יומיים ---\n`;
  csv += `תאריך,ציון כולל,אימון,קלוריות,חלבון,מים,שינה\n`;
  (scores.data || []).forEach(s => {
    csv += `${s.score_date},${s.total_score},${s.workout_pts},${s.calories_pts},${s.protein_pts},${s.water_pts},${s.sleep_pts}\n`;
  });

  csv += `\n--- שעות שינה ---\n`;
  csv += `תאריך,שעות\n`;
  (sleep.data || []).forEach(s => {
    csv += `${s.logged_for},${s.hours}\n`;
  });

  csv += `\n--- מעקב משקל ---\n`;
  csv += `תאריך,משקל (ק"ג)\n`;
  (weights.data || []).forEach(w => {
    csv += `${w.logged_at?.slice(0, 10) || ''},${w.weight}\n`;
  });

  csv += `\n--- ארוחות אחרונות (500) ---\n`;
  csv += `תאריך,שם,קלוריות,חלבון,פחמימות,שומן\n`;
  (meals.data || []).forEach(m => {
    csv += `${m.logged_at?.slice(0, 10) || ''},"${(m.name || '').replace(/"/g, '""')}",${m.cal || 0},${m.p || 0},${m.c || 0},${m.f || 0}\n`;
  });

  // הורדה
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${name.replace(/\s/g, '_')}_${today}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/* ═══════════════════════════════════════════════════════════
   3. ארכיון לקוחות
═══════════════════════════════════════════════════════════ */

export async function archiveClient(clientId, reason = '') {
  return supabase
    .from('clients')
    .update({
      is_archived: true,
      archived_at: new Date().toISOString(),
      archive_reason: reason,
    })
    .eq('id', clientId);
}

export async function unarchiveClient(clientId) {
  return supabase
    .from('clients')
    .update({
      is_archived: false,
      archived_at: null,
      archive_reason: null,
    })
    .eq('id', clientId);
}

/* קומפוננטת רשימת ארכיון */
export function ArchivedClientsList({ coachId, onUnarchive }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('coach_id', coachId)
      .eq('is_archived', true)
      .order('archived_at', { ascending: false });
    setClients(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (coachId) load();
  }, [coachId]);

  const handleUnarchive = async (clientId, name) => {
    if (!confirm(`להחזיר את ${name} ללקוחות הפעילים?`)) return;
    await unarchiveClient(clientId);
    load();
    onUnarchive && onUnarchive();
  };

  if (loading) return <p style={{ textAlign: 'center', padding: 20, color: COLORS.textMuted }}>טוענת...</p>;

  if (clients.length === 0) {
    return (
      <div style={{ ...card, textAlign: 'center', padding: 30 }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>📦</div>
        <p style={{ margin: 0, fontSize: 13, color: COLORS.textMuted }}>אין לקוחות בארכיון</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={{ margin: '0 0 4px', fontSize: 11, color: COLORS.textMuted, textAlign: 'center' }}>
        {clients.length} לקוחות בארכיון
      </p>
      {clients.map(c => (
        <div key={c.id} style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: COLORS.text }}>
                {c.full_name}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 10, color: COLORS.textMuted }}>
                בארכיון מאז: {c.archived_at?.slice(0, 10)}
                {c.archive_reason && ` · ${c.archive_reason}`}
              </p>
            </div>
            <button
              onClick={() => handleUnarchive(c.id, c.full_name)}
              style={{
                padding: '6px 10px', background: COLORS.primarySoft,
                color: COLORS.primaryDark, border: 'none', borderRadius: 8,
                fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              ↩️ החזירי
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
