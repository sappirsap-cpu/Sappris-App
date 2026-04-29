// ═══════════════════════════════════════════════════════════════
// src/widgets.jsx
// מערכת קוביות מודולרית — עמודים שניתן להחליף בהם קוביות
// ═══════════════════════════════════════════════════════════════
//
// שימוש:
//
//   import { ModularPage, WIDGET_REGISTRY } from './widgets';
//
//   <ModularPage
//     pageId="dashboard"          // id ייחודי לעמוד (לשמירת הסידור)
//     defaultWidgets={['stats', 'feed']}
//     availableWidgets={['stats', 'feed', 'goals', 'reminders']}
//     widgetProps={{ clients, coachProfile }}
//   />
//
// כל widget הוא פונקציה ב-WIDGET_REGISTRY שמחזירה JSX.
// המאמנת יכולה להחליף קוביות דרך כפתור ⚙️ למעלה.
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';

const COLORS = {
  bg: '#F5F2FA', primary: '#B19CD9', primaryDark: '#8B72B5',
  primarySoft: '#E8DFF5', text: '#2E2A3D', textMuted: '#756B85',
  border: '#DDD0EB', red: '#C88A8A', green: '#6BAF8A', amber: '#E8B84B',
};

// ───────────────────────────────────────────────────────────────
// Registry של כל ה-widgets הזמינים
// (מתמלא דינמית מהקוד הקורא)
// ───────────────────────────────────────────────────────────────
export const WIDGET_REGISTRY = {};

export function registerWidget(id, config) {
  WIDGET_REGISTRY[id] = config;
}

// ───────────────────────────────────────────────────────────────
// Persistence — שמירה והטענה מ-localStorage
// ───────────────────────────────────────────────────────────────
function loadLayout(pageId, defaultIds) {
  try {
    const saved = localStorage.getItem(`sappir-layout-${pageId}`);
    if (saved) return JSON.parse(saved);
  } catch {}
  return defaultIds;
}

function saveLayout(pageId, ids) {
  try {
    localStorage.setItem(`sappir-layout-${pageId}`, JSON.stringify(ids));
  } catch {}
}

// ───────────────────────────────────────────────────────────────
// ModularPage — קומפוננטה ראשית
// ───────────────────────────────────────────────────────────────
export function ModularPage({
  pageId,
  defaultWidgets = [],
  availableWidgets = [],
  widgetProps = {},
  title,
  showCustomize = true,
}) {
  const [layout, setLayout] = useState(() => loadLayout(pageId, defaultWidgets));
  const [editing, setEditing] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState(null);
  const isFirstRender = React.useRef(true);

  // שמור רק אחרי השינוי הראשון של המשתמשת — לא בrender הראשוני
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    saveLayout(pageId, layout);
  }, [pageId, layout]);

  const addWidget = (id) => {
    if (layout.includes(id)) return;
    setLayout([...layout, id]);
  };
  const removeWidget = (id) => {
    setLayout(layout.filter(w => w !== id));
  };
  const moveWidget = (from, to) => {
    if (from === to) return;
    const next = [...layout];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setLayout(next);
  };
  const resetLayout = () => {
    if (!confirm('לחזור לסידור ברירת המחדל?')) return;
    setLayout(defaultWidgets);
    setEditing(false);
  };

  const handleDragStart = (idx) => setDraggedIdx(idx);
  const handleDragOver = (e, idx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;
    moveWidget(draggedIdx, idx);
    setDraggedIdx(idx);
  };
  const handleDragEnd = () => setDraggedIdx(null);

  // קוביות שניתן להוסיף (זמינות אבל לא בלייאאוט הנוכחי)
  const addable = availableWidgets.filter(id => !layout.includes(id) && WIDGET_REGISTRY[id]);

  return (
    <div style={{ direction: 'rtl' }}>
      {/* כותרת + כפתור הגדרות */}
      {(title || showCustomize) && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 12, padding: '0 4px',
        }}>
          {title && (
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: COLORS.primaryDark }}>
              {title}
            </h2>
          )}
          {showCustomize && (
            <button
              onClick={() => setEditing(!editing)}
              style={{
                background: editing ? COLORS.primary : COLORS.primarySoft,
                color: editing ? 'white' : COLORS.primaryDark,
                border: 'none', borderRadius: 10, padding: '6px 12px',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {editing ? '✓ סיום' : '⚙️ התאמה'}
            </button>
          )}
        </div>
      )}

      {/* רשימת קוביות בלייאאוט */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {layout.map((id, idx) => {
          const widget = WIDGET_REGISTRY[id];
          if (!widget) return null;

          return (
            <div
              key={id}
              style={{
                position: 'relative',
                transition: 'opacity 0.2s',
              }}
            >
              {editing && (
                <div style={{
                  position: 'absolute', top: 6, left: 6, zIndex: 5,
                  display: 'flex', gap: 4,
                }}>
                  <button
                    onClick={() => removeWidget(id)}
                    style={{
                      background: COLORS.red, color: 'white', border: 'none',
                      borderRadius: '50%', width: 30, height: 30,
                      cursor: 'pointer', fontSize: 16, fontFamily: 'inherit',
                      fontWeight: 700,
                    }}
                    title="הסר קובייה"
                  >×</button>
                  <button
                    onClick={() => idx > 0 && moveWidget(idx, idx - 1)}
                    disabled={idx === 0}
                    style={{
                      background: idx === 0 ? '#ccc' : COLORS.primary,
                      color: 'white', border: 'none',
                      borderRadius: '50%', width: 30, height: 30,
                      cursor: idx === 0 ? 'default' : 'pointer',
                      fontSize: 14, fontFamily: 'inherit',
                      fontWeight: 700,
                    }}
                    title="העלה למעלה"
                  >↑</button>
                  <button
                    onClick={() => idx < layout.length - 1 && moveWidget(idx, idx + 1)}
                    disabled={idx === layout.length - 1}
                    style={{
                      background: idx === layout.length - 1 ? '#ccc' : COLORS.primary,
                      color: 'white', border: 'none',
                      borderRadius: '50%', width: 30, height: 30,
                      cursor: idx === layout.length - 1 ? 'default' : 'pointer',
                      fontSize: 14, fontFamily: 'inherit',
                      fontWeight: 700,
                    }}
                    title="הורד למטה"
                  >↓</button>
                </div>
              )}

              <widget.render {...widgetProps} />
            </div>
          );
        })}

        {layout.length === 0 && (
          <div style={{
            background: 'white', borderRadius: 14, padding: 30,
            textAlign: 'center', border: `2px dashed ${COLORS.border}`,
          }}>
            <p style={{ fontSize: 24, margin: '0 0 8px' }}>📦</p>
            <p style={{ color: COLORS.textMuted, fontSize: 13, margin: 0 }}>
              אין קוביות בלייאאוט. לחצי על ⚙️ כדי להוסיף.
            </p>
          </div>
        )}
      </div>

      {/* פאנל הוספת קוביות (מופיע רק במצב עריכה) */}
      {editing && (
        <div style={{
          background: 'white', borderRadius: 14, padding: 14,
          marginTop: 12, border: `2px dashed ${COLORS.primary}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: COLORS.primaryDark }}>
              ➕ הוסיפי קובייה
            </h4>
            <button
              onClick={resetLayout}
              style={{
                background: 'transparent', color: COLORS.textMuted,
                border: `1px solid ${COLORS.border}`, borderRadius: 8,
                padding: '4px 10px', fontSize: 11, cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              🔄 ברירת מחדל
            </button>
          </div>

          {addable.length === 0 ? (
            <p style={{ fontSize: 12, color: COLORS.textMuted, textAlign: 'center', margin: '12px 0' }}>
              כל הקוביות הזמינות כבר בלייאאוט שלך
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {addable.map(id => {
                const w = WIDGET_REGISTRY[id];
                return (
                  <button
                    key={id}
                    onClick={() => addWidget(id)}
                    style={{
                      background: COLORS.primarySoft, color: COLORS.primaryDark,
                      border: 'none', borderRadius: 10, padding: 10,
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      fontFamily: 'inherit', textAlign: 'right',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{w.icon || '📊'}</span>
                    <span>{w.title}</span>
                  </button>
                );
              })}
            </div>
          )}

          <p style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 12, marginBottom: 0, textAlign: 'center' }}>
            💡 גררי את הקוביות כדי לסדר אותן מחדש · לחצי × כדי להסיר
          </p>
        </div>
      )}
    </div>
  );
}
