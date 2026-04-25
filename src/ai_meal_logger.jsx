// ═══════════════════════════════════════════════════════════════
// src/ai_meal_logger.jsx
// AI Meal Logger — מתאמנת כותבת בחופשיות / מצלמת → AI מפענח
// ═══════════════════════════════════════════════════════════════

import React, { useState, useRef } from 'react';
import { supabase } from './supabase';

const COLORS = {
  bg: '#F5F2FA', primary: '#B19CD9', primaryDark: '#8B72B5',
  primarySoft: '#E8DFF5', mint: '#C5B3E0', peach: '#F5D0B5',
  text: '#2E2A3D', textMuted: '#756B85', border: '#DDD0EB',
  green: '#6B9B6B',
};

const card = {
  background: 'white', border: `1px solid ${COLORS.border}`,
  borderRadius: 16, padding: 16,
};

/* ═══════════════════════════════════════════════════════════
   1. פירוק טקסט חופשי לארוחה מובנית עם Claude
═══════════════════════════════════════════════════════════ */

export async function parseTextMeal(text) {
  const prompt = `את עוזרת תזונה. את מקבלת תיאור חופשי בעברית של ארוחה ומחזירה את הפירוט שלה.

תיאור הארוחה:
"${text}"

החזירי JSON בלבד (בלי markdown, בלי טקסט נוסף) במבנה הזה:
{
  "name": "שם הארוחה (לדוגמה 'ארוחת צהריים')",
  "items": [
    {"name": "שם הפריט בעברית", "qty": "כמות (למשל '150ג'')", "cal": 250, "p": 30, "c": 5, "f": 12}
  ],
  "total": {"cal": 250, "p": 30, "c": 5, "f": 12},
  "confidence": "high|medium|low"
}

חשוב:
- הערכי כמויות סבירות אם המתאמנת לא ציינה
- חישבי מאקרו לפי טבלאות תזונה ישראליות סטנדרטיות
- אם יש פריט שאת לא בטוחה לגביו, ציינה confidence: "low"
- כל הערכים במספרים שלמים`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      })
    });
    const json = await response.json();
    const txt = json.content?.map(c => c.text || '').join('').replace(/```json|```/g, '').trim();
    return JSON.parse(txt);
  } catch (e) {
    console.error('AI parse failed:', e);
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════
   2. פירוק תמונה של ארוחה
═══════════════════════════════════════════════════════════ */

export async function parsePhotoMeal(base64Image, mediaType = 'image/jpeg') {
  const prompt = `את עוזרת תזונה. הסתכלי על התמונה של הארוחה והעריכי את התוכן התזונתי.

החזירי JSON בלבד (בלי markdown, בלי טקסט נוסף):
{
  "name": "שם הארוחה",
  "items": [
    {"name": "שם הפריט בעברית", "qty": "כמות משוערת", "cal": 250, "p": 30, "c": 5, "f": 12}
  ],
  "total": {"cal": 250, "p": 30, "c": 5, "f": 12},
  "confidence": "high|medium|low",
  "notes": "הערות אם יש"
}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64Image } },
            { type: "text", text: prompt },
          ]
        }],
      })
    });
    const json = await response.json();
    const txt = json.content?.map(c => c.text || '').join('').replace(/```json|```/g, '').trim();
    return JSON.parse(txt);
  } catch (e) {
    console.error('AI photo parse failed:', e);
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════
   3. שמירת הארוחה אחרי שאישרה
═══════════════════════════════════════════════════════════ */

export async function saveMealFromAI(clientId, parsed, mealType = 'snack') {
  const { data: meal, error } = await supabase
    .from('meal_logs')
    .insert({
      client_id: clientId,
      meal_type: mealType,
      name: parsed.name,
      items: parsed.items,
      cal: parsed.total.cal,
      p: parsed.total.p,
      c: parsed.total.c,
      f: parsed.total.f,
      logged_at: new Date().toISOString(),
    })
    .select()
    .single();

  // שמור גם ב-ai_meal_parses
  await supabase.from('ai_meal_parses').insert({
    client_id: clientId,
    parsed_items: parsed.items,
    total_cal: parsed.total.cal,
    total_p: parsed.total.p,
    total_c: parsed.total.c,
    total_f: parsed.total.f,
    was_accepted: !error,
    meal_id: meal?.id,
  });

  return { data: meal, error };
}

/* ═══════════════════════════════════════════════════════════
   4. UI — טופס הרישום עם AI
═══════════════════════════════════════════════════════════ */

export function AIMealLogger({ clientId, onSave, onClose }) {
  const [mode, setMode] = useState('text'); // 'text' | 'photo'
  const [text, setText] = useState('');
  const [photoBase64, setPhotoBase64] = useState(null);
  const [photoMediaType, setPhotoMediaType] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [editingTotal, setEditingTotal] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const base64 = dataUrl.split(',')[1];
      const mediaType = file.type;
      setPhotoBase64(base64);
      setPhotoMediaType(mediaType);
    };
    reader.readAsDataURL(file);
  };

  const handleParse = async () => {
    setParsing(true);
    setError(null);
    setResult(null);

    let parsed;
    if (mode === 'text') {
      if (!text.trim()) { setParsing(false); return; }
      parsed = await parseTextMeal(text);
    } else {
      if (!photoBase64) { setParsing(false); return; }
      parsed = await parsePhotoMeal(photoBase64, photoMediaType);
    }

    setParsing(false);
    if (!parsed) {
      setError('לא הצלחתי לפענח. נסי שוב או הקלידי ידנית.');
      return;
    }
    setResult(parsed);
  };

  const handleAccept = async () => {
    if (!result) return;
    const { error } = await saveMealFromAI(clientId, result);
    if (error) {
      setError('שגיאה בשמירה: ' + error.message);
      return;
    }
    onSave && onSave(result);
    onClose && onClose();
  };

  const handleEditItem = (idx, field, value) => {
    const newItems = [...result.items];
    const numVal = field === 'name' || field === 'qty' ? value : parseInt(value) || 0;
    newItems[idx] = { ...newItems[idx], [field]: numVal };
    // חישוב מחדש של total
    const total = newItems.reduce(
      (acc, it) => ({
        cal: acc.cal + (it.cal || 0),
        p: acc.p + (it.p || 0),
        c: acc.c + (it.c || 0),
        f: acc.f + (it.f || 0),
      }),
      { cal: 0, p: 0, c: 0, f: 0 }
    );
    setResult({ ...result, items: newItems, total });
  };

  const removeItem = (idx) => {
    const newItems = result.items.filter((_, i) => i !== idx);
    const total = newItems.reduce(
      (acc, it) => ({
        cal: acc.cal + (it.cal || 0),
        p: acc.p + (it.p || 0),
        c: acc.c + (it.c || 0),
        f: acc.f + (it.f || 0),
      }),
      { cal: 0, p: 0, c: 0, f: 0 }
    );
    setResult({ ...result, items: newItems, total });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(46, 42, 61, 0.5)', backdropFilter: 'blur(6px)',
      zIndex: 200, display: 'flex', alignItems: 'flex-end',
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: COLORS.bg, width: '100%',
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        padding: 16, maxHeight: '90vh', overflowY: 'auto',
        direction: 'rtl', fontFamily: 'system-ui, sans-serif',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: COLORS.primaryDark }}>
            ✨ רישום מהיר עם AI
          </p>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer', color: COLORS.textMuted }}>✕</button>
        </div>

        {!result && (
          <>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              <button
                onClick={() => setMode('text')}
                style={{
                  flex: 1, padding: 10, border: 'none',
                  background: mode === 'text' ? COLORS.primary : 'white',
                  color: mode === 'text' ? 'white' : COLORS.text,
                  borderRadius: 10, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                ✍️ טקסט
              </button>
              <button
                onClick={() => setMode('photo')}
                style={{
                  flex: 1, padding: 10, border: 'none',
                  background: mode === 'photo' ? COLORS.primary : 'white',
                  color: mode === 'photo' ? 'white' : COLORS.text,
                  borderRadius: 10, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                📷 תמונה
              </button>
            </div>

            <div style={card}>
              {mode === 'text' ? (
                <>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="לדוגמה: אכלתי 150 גרם חזה עוף, חצי קופסת אורז מלא וסלט עם 2 כפות טחינה"
                    rows={5}
                    style={{
                      width: '100%', padding: 10,
                      border: `1px solid ${COLORS.border}`, borderRadius: 10,
                      fontSize: 13, fontFamily: 'inherit', resize: 'vertical',
                      boxSizing: 'border-box', outline: 'none',
                    }}
                  />
                  <p style={{ margin: '6px 0 0', fontSize: 10, color: COLORS.textMuted }}>
                    💡 ה-AI יחשב לבד את הקלוריות והמאקרו
                  </p>
                </>
              ) : (
                <>
                  {!photoBase64 ? (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        width: '100%', padding: 30,
                        background: COLORS.primarySoft,
                        border: `2px dashed ${COLORS.primary}`,
                        borderRadius: 12,
                        fontSize: 14, fontWeight: 600,
                        color: COLORS.primaryDark,
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      📷 צלמי או בחרי תמונה
                    </button>
                  ) : (
                    <>
                      <img
                        src={`data:${photoMediaType};base64,${photoBase64}`}
                        style={{ width: '100%', borderRadius: 10, marginBottom: 8 }}
                      />
                      <button
                        onClick={() => { setPhotoBase64(null); setPhotoMediaType(null); }}
                        style={{
                          width: '100%', padding: 8,
                          background: 'white', border: `1px solid ${COLORS.border}`,
                          borderRadius: 8, fontSize: 11, color: COLORS.textMuted,
                          cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        ✕ הסירי תמונה
                      </button>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFile(e.target.files?.[0])}
                  />
                </>
              )}
            </div>

            {error && (
              <div style={{
                marginTop: 12, padding: 10,
                background: '#FFE5E5', border: '1px solid #C88A8A',
                borderRadius: 10, fontSize: 12, color: '#8B2E2E',
              }}>
                {error}
              </div>
            )}

            <button
              onClick={handleParse}
              disabled={parsing || (mode === 'text' && !text.trim()) || (mode === 'photo' && !photoBase64)}
              style={{
                width: '100%', marginTop: 12,
                background: COLORS.primary, color: 'white', border: 'none',
                padding: 14, borderRadius: 12,
                fontSize: 14, fontWeight: 700,
                cursor: parsing ? 'default' : 'pointer',
                fontFamily: 'inherit', opacity: parsing ? 0.6 : 1,
              }}
            >
              {parsing ? '✨ מפענחת...' : '✨ פענחי לי'}
            </button>
          </>
        )}

        {result && (
          <>
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <input
                  value={result.name}
                  onChange={(e) => setResult({ ...result, name: e.target.value })}
                  style={{
                    flex: 1, padding: 6, border: 'none',
                    fontSize: 14, fontWeight: 700, color: COLORS.text,
                    fontFamily: 'inherit', background: 'transparent', outline: 'none',
                  }}
                />
                {result.confidence && (
                  <span style={{
                    fontSize: 9, padding: '3px 8px', borderRadius: 999,
                    background: result.confidence === 'high' ? '#E8F5E9' : result.confidence === 'medium' ? '#FFF4E5' : '#FFE5E5',
                    color: result.confidence === 'high' ? '#2E7D32' : result.confidence === 'medium' ? '#8B6914' : '#8B2E2E',
                    fontWeight: 700,
                  }}>
                    {result.confidence === 'high' ? '✓ ביטחון גבוה' :
                     result.confidence === 'medium' ? '~ ביטחון בינוני' : '! לבדוק'}
                  </span>
                )}
              </div>

              {/* פריטים */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {result.items.map((item, idx) => (
                  <div key={idx} style={{
                    display: 'grid', gridTemplateColumns: '1fr auto auto',
                    gap: 6, alignItems: 'center',
                    background: COLORS.primarySoft, borderRadius: 8, padding: 8,
                  }}>
                    <input
                      value={`${item.name} ${item.qty || ''}`}
                      onChange={(e) => {
                        const parts = e.target.value.split(' ');
                        const qty = parts[parts.length - 1];
                        const name = parts.slice(0, -1).join(' ') || parts[0];
                        handleEditItem(idx, 'name', name);
                      }}
                      style={{
                        background: 'transparent', border: 'none',
                        fontSize: 12, fontWeight: 600, color: COLORS.text,
                        fontFamily: 'inherit', outline: 'none',
                      }}
                    />
                    <input
                      type="number"
                      value={item.cal || 0}
                      onChange={(e) => handleEditItem(idx, 'cal', e.target.value)}
                      style={{
                        width: 50, background: 'white',
                        border: `1px solid ${COLORS.border}`, borderRadius: 6,
                        padding: '3px 6px', fontSize: 11,
                        fontFamily: 'inherit', textAlign: 'center', outline: 'none',
                      }}
                    />
                    <button
                      onClick={() => removeItem(idx)}
                      style={{
                        background: 'transparent', border: 'none',
                        fontSize: 12, color: COLORS.textMuted,
                        cursor: 'pointer', padding: 4,
                      }}
                    >✕</button>
                  </div>
                ))}
              </div>

              {/* סיכום */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6,
                marginTop: 12, paddingTop: 12, borderTop: `1px solid ${COLORS.border}`,
              }}>
                <Macro label="קק״ל" value={result.total.cal} color="#E89B8C" />
                <Macro label="חלבון" value={`${result.total.p}g`} color={COLORS.primary} />
                <Macro label="פחמ׳" value={`${result.total.c}g`} color={COLORS.peach} />
                <Macro label="שומן" value={`${result.total.f}g`} color={COLORS.mint} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button
                onClick={() => { setResult(null); setText(''); setPhotoBase64(null); }}
                style={{
                  flex: 1, background: 'white', color: COLORS.textMuted,
                  border: `1px solid ${COLORS.border}`,
                  padding: 12, borderRadius: 10,
                  fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                🔄 התחילי שוב
              </button>
              <button
                onClick={handleAccept}
                style={{
                  flex: 2, background: COLORS.primary, color: 'white',
                  border: 'none', padding: 12, borderRadius: 10,
                  fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                ✓ שמרי ארוחה
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Macro({ label, value, color }) {
  return (
    <div style={{
      background: 'white', padding: 8, borderRadius: 8,
      textAlign: 'center', border: `1px solid ${COLORS.border}`,
    }}>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color }}>{value}</p>
      <p style={{ margin: '2px 0 0', fontSize: 9, color: COLORS.textMuted }}>{label}</p>
    </div>
  );
}
