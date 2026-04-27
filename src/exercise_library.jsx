// ═══════════════════════════════════════════════════════════════
// src/exercise_library.jsx
// מאגר תרגילים גלובלי עם תרגום אוטומטי לעברית
// ═══════════════════════════════════════════════════════════════
//
// קומפוננטות:
//   <ExerciseLibraryImporter />  — כפתור לטעינת המאגר ל-Supabase (פעם אחת)
//   <ExercisePicker onSelect />  — חיפוש ובחירת תרגיל לאימון
//
// מקור הנתונים: yuhonas/free-exercise-db (Public Domain)
// 800+ תרגילים עם תמונות
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

const COLORS = {
  bg: '#F5F2FA', primary: '#B19CD9', primaryDark: '#8B72B5',
  primarySoft: '#E8DFF5', text: '#2E2A3D', textMuted: '#756B85',
  border: '#DDD0EB', red: '#C88A8A', green: '#6BAF8A',
};

// ───────────────────────────────────────────────────────────────
// תרגום סטטי — מילון מונחים נפוצים
// ───────────────────────────────────────────────────────────────
const CATEGORY_HE = {
  strength: 'כוח',
  cardio: 'אירובי',
  stretching: 'מתיחות',
  plyometrics: 'פליאומטרי',
  powerlifting: 'פאוורליפטינג',
  strongman: 'איש חזק',
  olympic_weightlifting: 'הרמת משקולות אולימפית',
};

const LEVEL_HE = {
  beginner: 'מתחילים',
  intermediate: 'בינוני',
  expert: 'מתקדמים',
};

const EQUIPMENT_HE = {
  'body only': 'משקל גוף',
  'machine': 'מכשיר',
  'other': 'אחר',
  'foam roll': 'גלגלת קצף',
  'kettlebells': 'קטלבל',
  'dumbbell': 'משקולת יד',
  'cable': 'כבל',
  'barbell': 'מוט',
  'bands': 'גומיות',
  'medicine ball': 'כדור רפואי',
  'exercise ball': 'כדור פיזיו',
  'e-z curl bar': 'מוט EZ',
};

const MUSCLE_HE = {
  'abdominals': 'בטן',
  'abductors': 'מרחיקים',
  'adductors': 'מקרבים',
  'biceps': 'יד קדמית',
  'calves': 'תאומים',
  'chest': 'חזה',
  'forearms': 'אמות',
  'glutes': 'ישבן',
  'hamstrings': 'אחורי ירך',
  'lats': 'גב רחב',
  'lower back': 'גב תחתון',
  'middle back': 'גב אמצעי',
  'neck': 'צוואר',
  'quadriceps': 'קדמי ירך',
  'shoulders': 'כתפיים',
  'traps': 'טרפז',
  'triceps': 'יד אחורית',
};

// תרגום מילים נפוצות בשם תרגיל
const WORD_HE = {
  'curl': 'כפיפה', 'press': 'דחיקה', 'squat': 'סקוואט', 'deadlift': 'דדליפט',
  'row': 'חתירה', 'fly': 'פתיחה', 'pull': 'משיכה', 'push': 'דחיפה',
  'extension': 'יישור', 'raise': 'הרמה', 'lift': 'הרמה', 'lunge': 'לאנג׳',
  'bench': 'ספסל', 'incline': 'משופע', 'decline': 'יורד', 'flat': 'שטוח',
  'dumbbell': 'משקולת', 'barbell': 'מוט', 'cable': 'כבל', 'machine': 'מכשיר',
  'kettlebell': 'קטלבל', 'band': 'גומיה', 'bodyweight': 'משקל גוף',
  'wide': 'רחב', 'narrow': 'צר', 'close': 'צמוד', 'reverse': 'הפוך',
  'standing': 'עומד', 'seated': 'יושב', 'lying': 'שוכב', 'kneeling': 'כורע',
  'one-arm': 'יד אחת', 'one arm': 'יד אחת', 'single-arm': 'יד אחת',
  'one-leg': 'רגל אחת', 'single-leg': 'רגל אחת', 'alternating': 'לסירוגין',
  'overhead': 'מעל הראש', 'front': 'קדמי', 'back': 'אחורי', 'side': 'צידי',
  'lateral': 'צידי', 'cross': 'צולב', 'twist': 'סיבוב', 'rotation': 'סיבוב',
  'crunch': 'כפיפת בטן', 'sit-up': 'סיט-אפ', 'plank': 'פלאנק', 'dip': 'דיפ',
  'pullup': 'משיכה', 'pull-up': 'משיכה', 'chinup': 'מתח', 'chin-up': 'מתח',
  'pushup': 'שכיבת סמיכה', 'push-up': 'שכיבת סמיכה',
  'leg': 'רגל', 'arm': 'יד', 'shoulder': 'כתף', 'chest': 'חזה',
  'tricep': 'יד אחורית', 'biceps': 'יד קדמית', 'bicep': 'יד קדמית',
  'glute': 'ישבן', 'calf': 'תאום', 'thigh': 'ירך', 'hip': 'אגן',
  'good': 'טוב', 'morning': 'בוקר', 'jumping': 'קפיצה', 'jump': 'קפיצה',
  'walking': 'הליכה', 'running': 'ריצה', 'sprint': 'ספרינט',
  'hammer': 'פטיש', 'concentration': 'ריכוז', 'preacher': 'מטיף',
  'spider': 'עכביש', 'zottman': 'זוטמן', 'arnold': 'ארנולד',
  'bulgarian': 'בולגרי', 'romanian': 'רומני', 'sumo': 'סומו',
  'goblet': 'גביע', 'farmer': 'איכר', 'box': 'קופסא', 'wall': 'קיר',
  'chair': 'כיסא', 'floor': 'רצפה', 'with': 'עם', 'on': 'על',
  'to': 'ל', 'and': 'ו', 'the': '', 'a': '',
};

// פונקציה להמרת שם תרגיל
function translateName(name) {
  if (!name) return '';
  let result = name.toLowerCase();
  // נסה להחליף ביטויים שלמים
  for (const [en, he] of Object.entries(WORD_HE)) {
    const re = new RegExp('\\b' + en.replace(/-/g, '\\-') + '\\b', 'gi');
    result = result.replace(re, he);
  }
  // נקה רווחים מיותרים
  result = result.replace(/\s+/g, ' ').trim();
  return result;
}

// ───────────────────────────────────────────────────────────────
// ImportButton — טעינת המאגר ל-Supabase פעם אחת
// ───────────────────────────────────────────────────────────────
export function ExerciseLibraryImporter({ onDone }) {
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [progress, setProgress] = useState(0);
  const [count, setCount] = useState(0);
  const [error, setError] = useState(null);

  const importLibrary = async () => {
    setStatus('loading');
    setProgress(0);
    setError(null);

    try {
      // בדיקה: האם המאגר כבר קיים?
      const { count: existing } = await supabase
        .from('exercise_library')
        .select('*', { count: 'exact', head: true });

      if (existing && existing > 100) {
        if (!confirm(`כבר יש ${existing} תרגילים במאגר. לטעון מחדש?`)) {
          setStatus('idle');
          return;
        }
      }

      // טעינת ה-JSON מ-GitHub
      const res = await fetch('https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json');
      if (!res.ok) throw new Error('Failed to fetch exercise database');
      const data = await res.json();

      setCount(data.length);

      // עיבוד + תרגום + העלאה במנות של 50
      const BATCH = 50;
      let inserted = 0;

      for (let i = 0; i < data.length; i += BATCH) {
        const chunk = data.slice(i, i + BATCH);
        const rows = chunk.map(ex => ({
          id: ex.id,
          name: ex.name,
          name_he: translateName(ex.name),
          category: ex.category || null,
          category_he: ex.category ? CATEGORY_HE[ex.category] || ex.category : null,
          level: ex.level || null,
          level_he: ex.level ? LEVEL_HE[ex.level] || ex.level : null,
          force: ex.force || null,
          mechanic: ex.mechanic || null,
          equipment: ex.equipment || null,
          equipment_he: ex.equipment ? EQUIPMENT_HE[ex.equipment] || ex.equipment : null,
          primary_muscles: ex.primaryMuscles || [],
          primary_muscles_he: (ex.primaryMuscles || []).map(m => MUSCLE_HE[m] || m),
          secondary_muscles: ex.secondaryMuscles || [],
          secondary_muscles_he: (ex.secondaryMuscles || []).map(m => MUSCLE_HE[m] || m),
          instructions: ex.instructions || [],
          instructions_he: ex.instructions || [],  // נשאיר באנגלית בשלב זה
          images: ex.images || [],
        }));

        const { error: upErr } = await supabase
          .from('exercise_library')
          .upsert(rows, { onConflict: 'id' });

        if (upErr) {
          console.error('Batch error:', upErr);
          throw upErr;
        }

        inserted += rows.length;
        setProgress(Math.round((inserted / data.length) * 100));
      }

      setStatus('done');
      if (onDone) onDone();
    } catch (e) {
      console.error('Import error:', e);
      setError(e.message || 'שגיאה לא ידועה');
      setStatus('error');
    }
  };

  if (status === 'done') {
    return (
      <div style={{ background: '#E0F2EB', border: `1px solid ${COLORS.green}`, borderRadius: 12, padding: 14, textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#3D7A5E' }}>
          ✅ הטעינה הסתיימה — {count} תרגילים זמינים
        </p>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div style={{ background: 'white', border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 14 }}>
        <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600 }}>
          ⏳ טוענת תרגילים... {progress}%
        </p>
        <div style={{ height: 6, background: COLORS.bg, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: COLORS.primary, transition: 'width 0.3s' }} />
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ background: '#FADDDD', border: `1px solid ${COLORS.red}`, borderRadius: 12, padding: 14 }}>
        <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#8B4040' }}>
          ❌ שגיאה: {error}
        </p>
        <button onClick={importLibrary} style={{
          background: COLORS.primary, color: 'white', border: 'none',
          padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>נסי שוב</button>
      </div>
    );
  }

  return (
    <button onClick={importLibrary} style={{
      width: '100%', background: COLORS.primary, color: 'white',
      border: 'none', padding: 14, borderRadius: 12, fontSize: 14,
      fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
    }}>
      📥 טען מאגר תרגילים (800+ תרגילים)
    </button>
  );
}

// ───────────────────────────────────────────────────────────────
// ExercisePicker — חיפוש ובחירת תרגיל
// ───────────────────────────────────────────────────────────────
export function ExercisePicker({ onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [muscleFilter, setMuscleFilter] = useState('');
  const [equipmentFilter, setEquipmentFilter] = useState('');
  const [empty, setEmpty] = useState(false);
  const [needsImport, setNeedsImport] = useState(false);

  // טעינה ראשונית
  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        let q = supabase.from('exercise_library').select('*').limit(40);

        if (query.trim()) {
          // חיפוש בעברית או אנגלית
          q = q.or(`name.ilike.%${query.trim()}%,name_he.ilike.%${query.trim()}%`);
        }
        if (muscleFilter) {
          q = q.contains('primary_muscles', [muscleFilter]);
        }
        if (equipmentFilter) {
          q = q.eq('equipment', equipmentFilter);
        }

        const { data, error, count } = await q;

        if (error) throw error;

        // אם המאגר ריק לחלוטין
        if ((!data || data.length === 0) && !query && !muscleFilter && !equipmentFilter) {
          setNeedsImport(true);
        } else {
          setNeedsImport(false);
        }

        setResults(data || []);
        setEmpty(data && data.length === 0);
      } catch (e) {
        console.error('Search error:', e);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query, muscleFilter, equipmentFilter]);

  const inp = {
    width: '100%', padding: '10px 12px', boxSizing: 'border-box',
    border: `1px solid ${COLORS.border}`, borderRadius: 10,
    fontSize: 13, fontFamily: 'inherit', outline: 'none',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: 20, direction: 'rtl', overflowY: 'auto',
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: 14, padding: 16,
        maxWidth: 600, width: '100%', marginTop: 30,
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: COLORS.primaryDark }}>
            🏋️ מאגר תרגילים
          </h3>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none',
            fontSize: 22, cursor: 'pointer', color: COLORS.textMuted,
            padding: '0 6px', fontFamily: 'inherit',
          }}>×</button>
        </div>

        {needsImport ? (
          <div>
            <p style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 12, lineHeight: 1.6 }}>
              המאגר ריק. לחצי על הכפתור כדי לטעון 800+ תרגילים מקצועיים עם תמונות.
              <br/>
              הטעינה תיקח כדקה.
            </p>
            <ExerciseLibraryImporter onDone={() => {
              setNeedsImport(false);
              setQuery('');
            }} />
          </div>
        ) : (
          <>
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="🔍 חיפוש: סקוואט, חזה, יד אחורית..."
              style={{ ...inp, marginBottom: 8 }}
            />

            {/* Filters */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
              <select
                value={muscleFilter}
                onChange={e => setMuscleFilter(e.target.value)}
                style={{ ...inp, width: 'auto', flex: 1, minWidth: 120, fontSize: 12 }}
              >
                <option value="">כל השרירים</option>
                {Object.entries(MUSCLE_HE).map(([en, he]) => (
                  <option key={en} value={en}>{he}</option>
                ))}
              </select>
              <select
                value={equipmentFilter}
                onChange={e => setEquipmentFilter(e.target.value)}
                style={{ ...inp, width: 'auto', flex: 1, minWidth: 120, fontSize: 12 }}
              >
                <option value="">כל הציוד</option>
                {Object.entries(EQUIPMENT_HE).map(([en, he]) => (
                  <option key={en} value={en}>{he}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', minHeight: 200 }}>
              {loading && <p style={{ textAlign: 'center', color: COLORS.textMuted, padding: 20 }}>מחפשת...</p>}

              {!loading && empty && (
                <p style={{ textAlign: 'center', color: COLORS.textMuted, fontSize: 12, padding: 20 }}>
                  לא נמצאו תרגילים מתאימים
                </p>
              )}

              {!loading && results.map(ex => {
                const imgUrl = ex.images && ex.images.length > 0
                  ? `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${ex.images[0]}`
                  : null;
                return (
                  <button
                    key={ex.id}
                    onClick={() => onSelect && onSelect(ex)}
                    style={{
                      width: '100%', textAlign: 'right', padding: 10, gap: 10,
                      background: COLORS.bg, border: `1px solid ${COLORS.border}`,
                      borderRadius: 10, marginBottom: 6, cursor: 'pointer',
                      fontFamily: 'inherit', display: 'flex', alignItems: 'center',
                    }}
                  >
                    {imgUrl && (
                      <img src={imgUrl} alt="" style={{
                        width: 48, height: 48, borderRadius: 8,
                        objectFit: 'cover', flexShrink: 0,
                      }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>
                        {ex.name_he || ex.name}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: COLORS.textMuted, direction: 'ltr', textAlign: 'right' }}>
                        {ex.name}
                      </p>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                        {(ex.primary_muscles_he || []).slice(0, 2).map((m, i) => (
                          <span key={i} style={{
                            background: COLORS.primarySoft,
                            color: COLORS.primaryDark,
                            fontSize: 10, fontWeight: 600,
                            padding: '2px 6px', borderRadius: 4,
                          }}>{m}</span>
                        ))}
                        {ex.equipment_he && (
                          <span style={{
                            background: '#E0F2EB',
                            color: COLORS.green,
                            fontSize: 10, fontWeight: 600,
                            padding: '2px 6px', borderRadius: 4,
                          }}>{ex.equipment_he}</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
