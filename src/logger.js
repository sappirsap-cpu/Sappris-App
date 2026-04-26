// ═══════════════════════════════════════════════════════════════
// src/logger.js
// מערכת לוגים + דיווח באגים — Sappir Fit
//
// שימוש:
//   import { log, logError, BugReportButton } from './logger';
//
//   log('info', 'meal_logged', { cal: 500 });
//   logError(error, 'addMeal', { clientId });
//
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';

/* ─── הגדרות ─── */
const MAX_LOCAL_LOGS = 200;       // מקסימום לוגים ב-localStorage
const LOG_KEY        = 'sappir_logs';
const SESSION_KEY    = 'sappir_session_id';
const APP_VERSION    = import.meta.env.VITE_APP_VERSION || '1.0.0';

/* ─── session ID ייחודי לכל פתיחה ─── */
function getSessionId() {
  try {
    let sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = `s_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch { return 'unknown'; }
}

/* ─── מידע על הסביבה ─── */
function getEnvInfo() {
  try {
    return {
      ua:       navigator.userAgent,
      platform: navigator.platform,
      lang:     navigator.language,
      online:   navigator.onLine,
      screen:   `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      pwa:      window.matchMedia('(display-mode: standalone)').matches,
      version:  APP_VERSION,
    };
  } catch { return {}; }
}

/* ═══════════════════════════════════════════════════════════
   שמירת לוג ב-localStorage
═══════════════════════════════════════════════════════════ */

function saveLogs(logs) {
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(logs.slice(-MAX_LOCAL_LOGS)));
  } catch { /* storage full — silent */ }
}

function loadLogs() {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
  } catch { return []; }
}

/* ═══════════════════════════════════════════════════════════
   פונקציות ציבוריות
═══════════════════════════════════════════════════════════ */

/**
 * log — רשום אירוע כללי
 * @param {'debug'|'info'|'warn'|'error'} level
 * @param {string} event  — שם האירוע (e.g. 'meal_logged')
 * @param {object} data   — מטא-דאטה נוספת
 */
export function log(level, event, data = {}) {
  const entry = {
    id:        `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    ts:        new Date().toISOString(),
    session:   getSessionId(),
    level,
    event,
    data,
  };

  // הצג ב-console בפיתוח
  if (import.meta.env.DEV) {
    const fn = level === 'error' ? console.error
             : level === 'warn'  ? console.warn
             : console.log;
    fn(`[${level.toUpperCase()}] ${event}`, data);
  }

  // שמור מקומית
  const logs = loadLogs();
  logs.push(entry);
  saveLogs(logs);

  return entry;
}

/**
 * logError — רשום שגיאה עם stack trace
 * @param {Error|string} error
 * @param {string}       context  — איפה קרה (e.g. 'addMeal')
 * @param {object}       extra    — מידע נוסף
 */
export function logError(error, context = '', extra = {}) {
  const entry = log('error', `error:${context}`, {
    message: error?.message || String(error),
    stack:   error?.stack?.slice(0, 500) || '',
    context,
    ...extra,
  });

  // שלח ל-Supabase ברקע (לא חוסם)
  sendErrorToDB(entry).catch(() => {});

  return entry;
}

/**
 * logEvent — קיצור לאירועי פעילות רגילים (info)
 */
export function logEvent(event, data = {}) {
  return log('info', event, data);
}

/* ─── שליחה ל-DB ─── */
async function sendErrorToDB(entry) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('error_logs').insert({
      session_id:  entry.session,
      user_id:     user?.id || null,
      level:       entry.level,
      event:       entry.event,
      message:     entry.data?.message || '',
      stack:       entry.data?.stack   || '',
      context:     entry.data?.context || '',
      metadata:    entry.data,
      env_info:    getEnvInfo(),
      app_version: APP_VERSION,
      created_at:  entry.ts,
    });
  } catch { /* שגיאה ב-logging — אל תזרוק שגיאה נוספת */ }
}

/* ═══════════════════════════════════════════════════════════
   Global error handlers — תופס שגיאות לא-מטופלות
═══════════════════════════════════════════════════════════ */

export function initGlobalErrorHandlers() {
  // שגיאות JS לא-מטופלות
  window.addEventListener('error', (e) => {
    logError(e.error || new Error(e.message), 'uncaught', {
      filename: e.filename,
      line: e.lineno,
      col:  e.colno,
    });
  });

  // Promise rejections לא-מטופלות
  window.addEventListener('unhandledrejection', (e) => {
    logError(e.reason || 'UnhandledRejection', 'promise', {
      promise: String(e.promise),
    });
  });

  log('info', 'app_started', getEnvInfo());
}

/* ═══════════════════════════════════════════════════════════
   יצירת דוח באג — טקסט מובנה לשיתוף
═══════════════════════════════════════════════════════════ */

async function buildBugReport(userDescription = '') {
  const logs = loadLogs().slice(-50); // 50 לוגים אחרונים
  const env  = getEnvInfo();
  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: {} }));

  const errorsOnly = logs.filter(l => l.level === 'error' || l.level === 'warn');
  const lastEvents = logs.filter(l => l.level === 'info').slice(-10);

  const lines = [
    '═══ דוח באג — Sappir Fit ═══',
    `תאריך: ${new Date().toLocaleString('he-IL')}`,
    `גרסה: ${APP_VERSION}`,
    `Session: ${getSessionId()}`,
    `משתמש: ${user?.email || 'לא מזוהה'}`,
    '',
    '── תיאור הבעיה ──',
    userDescription || '(לא סופק)',
    '',
    '── סביבה ──',
    `מכשיר: ${env.ua?.slice(0, 80)}`,
    `מסך: ${env.screen} | Viewport: ${env.viewport}`,
    `PWA: ${env.pwa ? 'כן' : 'לא'} | Online: ${env.online ? 'כן' : 'לא'}`,
    '',
    '── שגיאות אחרונות ──',
    errorsOnly.length === 0
      ? 'אין שגיאות'
      : errorsOnly.slice(-5).map(e =>
          `[${e.ts.slice(11, 19)}] ${e.event}: ${e.data?.message || ''}`
        ).join('\n'),
    '',
    '── אירועים אחרונים ──',
    lastEvents.map(e =>
      `[${e.ts.slice(11, 19)}] ${e.event}`
    ).join('\n'),
    '═══════════════════════',
  ];

  return lines.join('\n');
}

/* ═══════════════════════════════════════════════════════════
   שמירת דוח ב-Supabase (כדי שתוכלי לראות מהמאמנת)
═══════════════════════════════════════════════════════════ */

async function submitBugReport(description, reportText) {
  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: {} }));
  const { error } = await supabase.from('bug_reports').insert({
    user_id:     user?.id || null,
    user_email:  user?.email || null,
    description,
    report_text: reportText,
    env_info:    getEnvInfo(),
    app_version: APP_VERSION,
    session_id:  getSessionId(),
    logs_json:   loadLogs().slice(-50),
  });
  return { error };
}

/* ═══════════════════════════════════════════════════════════
   קומפוננטה: כפתור "דווחי על באג"
═══════════════════════════════════════════════════════════ */

const C = {
  bg: '#F5F2FA', primary: '#B19CD9', primaryDark: '#8B72B5',
  primarySoft: '#E8DFF5', text: '#2E2A3D', textMuted: '#756B85',
  border: '#DDD0EB', green: '#6BAF8A', greenSoft: '#E0F2EB',
  red: '#C88A8A', redSoft: '#FADDDD', amber: '#E8C96A',
};

export function BugReportButton({ style }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          background: 'transparent', border: `1px solid ${C.border}`,
          borderRadius: 8, padding: '6px 12px', fontSize: 12,
          color: C.textMuted, cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: 5,
          ...style,
        }}
      >
        🐛 דווחי על באג
      </button>
      {open && <BugReportModal onClose={() => setOpen(false)} />}
    </>
  );
}

function BugReportModal({ onClose }) {
  const [step, setStep] = useState('form'); // 'form' | 'preview' | 'done'
  const [description, setDescription] = useState('');
  const [reportText, setReportText] = useState('');
  const [sending, setSending] = useState(false);
  const [copyDone, setCopyDone] = useState(false);

  const handlePreview = async () => {
    const text = await buildBugReport(description);
    setReportText(text);
    setStep('preview');
  };

  const handleSend = async () => {
    setSending(true);
    const { error } = await submitBugReport(description, reportText);
    setSending(false);
    if (error) {
      alert('שגיאה בשליחה: ' + error.message);
    } else {
      setStep('done');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = reportText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopyDone(true);
    }
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(`🐛 דוח באג מאפליקציית Sappir Fit:\n\n${reportText}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 500, display: 'flex', alignItems: 'flex-end',
      direction: 'rtl',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: 'white', borderRadius: '20px 20px 0 0',
        width: '100%', maxHeight: '85vh', overflowY: 'auto',
        padding: 20,
      }}>

        {/* כותרת */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text }}>
            🐛 דיווח על באג
          </h3>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', fontSize: 20,
            cursor: 'pointer', color: C.textMuted,
          }}>✕</button>
        </div>

        {/* שלב 1: טופס */}
        {step === 'form' && (
          <>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>
              תארי מה קרה — אנחנו נאסוף אוטומטית את הלוגים הטכניים מהמכשיר שלך.
            </p>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="למשל: לחצתי על הוסף ארוחה, האפליקציה קפאה ולא הגבה..."
              rows={4}
              style={{
                width: '100%', padding: '12px 14px',
                border: `1px solid ${C.border}`, borderRadius: 12,
                fontSize: 13, fontFamily: 'inherit', resize: 'vertical',
                lineHeight: 1.5, outline: 'none', boxSizing: 'border-box',
                direction: 'rtl',
              }}
            />
            <button
              onClick={handlePreview}
              disabled={!description.trim()}
              style={{
                width: '100%', marginTop: 12,
                background: description.trim() ? C.primary : '#E0E0E0',
                color: 'white', border: 'none', padding: 13,
                borderRadius: 12, fontSize: 14, fontWeight: 700,
                cursor: description.trim() ? 'pointer' : 'default',
                fontFamily: 'inherit',
              }}
            >
              הכיני דוח →
            </button>
          </>
        )}

        {/* שלב 2: תצוגה מקדימה */}
        {step === 'preview' && (
          <>
            <p style={{ margin: '0 0 10px', fontSize: 12, color: C.textMuted }}>
              זה הדוח שייישלח — תוכלי גם להעתיק ולשלוח ב-WhatsApp:
            </p>
            <pre style={{
              background: '#F5F2FA', borderRadius: 10, padding: 12,
              fontSize: 10.5, lineHeight: 1.6, overflowX: 'auto',
              whiteSpace: 'pre-wrap', color: C.text,
              maxHeight: 260, overflowY: 'auto',
              border: `1px solid ${C.border}`,
              direction: 'ltr', textAlign: 'left',
            }}>{reportText}</pre>

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={handleSend} disabled={sending} style={{
                flex: 2, background: C.primary, color: 'white', border: 'none',
                padding: 12, borderRadius: 10, fontSize: 13, fontWeight: 700,
                cursor: sending ? 'default' : 'pointer', fontFamily: 'inherit',
                opacity: sending ? 0.6 : 1,
              }}>{sending ? 'שולח...' : '📤 שלחי ל-Sappir'}</button>

              <button onClick={handleCopy} style={{
                flex: 1, background: copyDone ? C.greenSoft : C.primarySoft,
                color: copyDone ? C.green : C.primaryDark,
                border: 'none', padding: 12, borderRadius: 10, fontSize: 13,
                fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}>{copyDone ? '✅ הועתק' : '📋 העתק'}</button>

              <button onClick={handleWhatsApp} style={{
                flex: 1, background: '#25D366', color: 'white',
                border: 'none', padding: 12, borderRadius: 10, fontSize: 13,
                fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}>💬 WA</button>
            </div>

            <button onClick={() => setStep('form')} style={{
              width: '100%', marginTop: 8,
              background: 'transparent', border: `1px solid ${C.border}`,
              padding: 10, borderRadius: 10, fontSize: 12,
              color: C.textMuted, cursor: 'pointer', fontFamily: 'inherit',
            }}>← חזרה לעריכה</button>
          </>
        )}

        {/* שלב 3: אישור */}
        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
            <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: C.text }}>
              הדוח נשלח בהצלחה!
            </p>
            <p style={{ margin: '0 0 20px', fontSize: 12, color: C.textMuted }}>
              ספיר תקבל התראה ותטפל בבעיה בהקדם
            </p>
            <button onClick={onClose} style={{
              background: C.primary, color: 'white', border: 'none',
              padding: '11px 24px', borderRadius: 10, fontSize: 14,
              fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>סגרי</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   קומפוננטה: לוח בקרה למאמנת — צפייה בלוגים ובאגים
═══════════════════════════════════════════════════════════ */

export function DevDashboard({ coachId }) {
  const [tab, setTab] = useState('bugs');
  const [bugs, setBugs] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [bugsRes, errorsRes] = await Promise.all([
      supabase.from('bug_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase.from('error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100),
    ]);
    setBugs(bugsRes.data || []);
    setErrors(errorsRes.data || []);
    setLoading(false);
  };

  const markFixed = async (id) => {
    await supabase.from('bug_reports').update({ status: 'fixed' }).eq('id', id);
    setBugs(prev => prev.map(b => b.id === id ? { ...b, status: 'fixed' } : b));
  };

  const openBugs  = bugs.filter(b => b.status !== 'fixed');
  const fixedBugs = bugs.filter(b => b.status === 'fixed');
  const critErrors = errors.filter(e => e.level === 'error');

  if (loading) return <p style={{ textAlign: 'center', color: C.textMuted, padding: 20 }}>טוענת...</p>;

  return (
    <div style={{ padding: 14, direction: 'rtl', display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* סטטוס */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[
          { label: 'באגים פתוחים', value: openBugs.length, color: openBugs.length > 0 ? C.red : C.green, icon: '🐛' },
          { label: 'שגיאות (24h)', value: critErrors.filter(e => new Date(e.created_at) > new Date(Date.now() - 86400000)).length, color: C.amber, icon: '⚠️' },
          { label: 'נפתרו', value: fixedBugs.length, color: C.green, icon: '✅' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 20 }}>{s.icon}</div>
            <p style={{ margin: '4px 0 2px', fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</p>
            <p style={{ margin: 0, fontSize: 9, color: C.textMuted }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* טאבים */}
      <div style={{ display: 'flex', gap: 4, background: '#F5F2FA', borderRadius: 10, padding: 4 }}>
        {[
          { id: 'bugs',   label: `🐛 באגים (${openBugs.length})` },
          { id: 'errors', label: `⚠️ שגיאות (${critErrors.length})` },
          { id: 'fixed',  label: `✅ נפתרו (${fixedBugs.length})` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, background: tab === t.id ? 'white' : 'transparent',
            border: 'none', borderRadius: 8, padding: '7px 4px',
            fontSize: 11, fontWeight: tab === t.id ? 700 : 500,
            color: tab === t.id ? C.primaryDark : C.textMuted,
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
          }}>{t.label}</button>
        ))}
      </div>

      {/* רשימת באגים */}
      {(tab === 'bugs' || tab === 'fixed') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(tab === 'bugs' ? openBugs : fixedBugs).length === 0 ? (
            <div style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
                {tab === 'bugs' ? '🎉 אין באגים פתוחים!' : 'עוד לא נפתרו באגים'}
              </p>
            </div>
          ) : (tab === 'bugs' ? openBugs : fixedBugs).map(bug => (
            <BugCard
              key={bug.id} bug={bug}
              expanded={expanded === bug.id}
              onToggle={() => setExpanded(expanded === bug.id ? null : bug.id)}
              onMarkFixed={tab === 'bugs' ? () => markFixed(bug.id) : null}
            />
          ))}
        </div>
      )}

      {/* לוג שגיאות */}
      {tab === 'errors' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {critErrors.length === 0 ? (
            <div style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>אין שגיאות קריטיות</p>
            </div>
          ) : critErrors.slice(0, 30).map(err => (
            <div key={err.id} style={{
              background: 'white', border: `1px solid ${C.border}`, borderRadius: 10,
              padding: '10px 12px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.red }}>
                    {err.event}
                  </p>
                  <p style={{ margin: '3px 0 0', fontSize: 11, color: C.text, lineHeight: 1.4 }}>
                    {err.message?.slice(0, 100)}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 10, color: C.textMuted }}>
                    {new Date(err.created_at).toLocaleString('he-IL')}
                    {err.user_email ? ` · ${err.user_email}` : ''}
                    {err.context ? ` · ${err.context}` : ''}
                  </p>
                </div>
                <span style={{
                  background: C.redSoft, color: C.red,
                  fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, flexShrink: 0,
                }}>ERROR</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <button onClick={loadData} style={{
        background: C.primarySoft, border: 'none', borderRadius: 10,
        padding: '10px', fontSize: 12, color: C.primaryDark, fontWeight: 600,
        cursor: 'pointer', fontFamily: 'inherit',
      }}>🔄 רענן</button>
    </div>
  );
}

function BugCard({ bug, expanded, onToggle, onMarkFixed }) {
  return (
    <div style={{
      background: 'white', border: `1px solid ${C.border}`,
      borderRadius: 12, overflow: 'hidden',
      borderRight: `4px solid ${bug.status === 'fixed' ? C.green : C.red}`,
    }}>
      <div onClick={onToggle} style={{ padding: '12px 14px', cursor: 'pointer' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text, lineHeight: 1.3 }}>
              {bug.description?.slice(0, 80) || 'ללא תיאור'}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 10, color: C.textMuted }}>
              {new Date(bug.created_at).toLocaleString('he-IL')}
              {bug.user_email ? ` · ${bug.user_email}` : ''}
              {bug.app_version ? ` · v${bug.app_version}` : ''}
            </p>
          </div>
          <span style={{ fontSize: 14, color: C.textMuted, flexShrink: 0 }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '0 14px 14px', borderTop: `1px solid ${C.border}` }}>
          {/* סביבה */}
          {bug.env_info && (
            <div style={{ background: C.bg, borderRadius: 8, padding: '8px 10px', marginTop: 10, fontSize: 10, color: C.textMuted, lineHeight: 1.6 }}>
              <strong>סביבה:</strong> {bug.env_info.ua?.slice(0, 60)} | {bug.env_info.screen} | PWA: {bug.env_info.pwa ? 'כן' : 'לא'}
            </div>
          )}

          {/* טקסט מלא */}
          <details style={{ marginTop: 8 }}>
            <summary style={{ fontSize: 11, color: C.primaryDark, cursor: 'pointer', fontWeight: 600 }}>לוגים טכניים</summary>
            <pre style={{
              background: '#1E1A2E', color: '#C8C0DC',
              borderRadius: 8, padding: 10, fontSize: 9.5,
              overflowX: 'auto', whiteSpace: 'pre-wrap', marginTop: 6,
              maxHeight: 200, overflowY: 'auto', lineHeight: 1.5,
              direction: 'ltr', textAlign: 'left',
            }}>{bug.report_text || JSON.stringify(bug.logs_json, null, 2)}</pre>
          </details>

          {onMarkFixed && (
            <button onClick={onMarkFixed} style={{
              marginTop: 10, background: C.greenSoft, color: C.green,
              border: `1px solid ${C.green}`, borderRadius: 8,
              padding: '8px 14px', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>✅ סמני כנפתר</button>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Hook: useLogger — לשימוש בקומפוננטות
═══════════════════════════════════════════════════════════ */

export function useLogger(component) {
  return {
    log:   (event, data) => log('info',  `${component}:${event}`, data),
    warn:  (event, data) => log('warn',  `${component}:${event}`, data),
    error: (err, context, extra) => logError(err, `${component}:${context}`, extra),
  };
}
