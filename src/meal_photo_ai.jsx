// ═══════════════════════════════════════════════════════════════
// src/meal_photo_ai.jsx
// זיהוי ארוחה מתמונה באמצעות Gemini AI
// ═══════════════════════════════════════════════════════════════
//
// שימוש:
//   <MealPhotoAnalyzer
//     onConfirm={(meal) => addMeal(meal)}
//     onClose={() => setShow(false)}
//   />
//
// תהליך:
//   1. המשתמשת מצלמת תמונה (input file עם capture="environment")
//   2. התמונה נשלחת ל-Edge Function שקוראת ל-Gemini
//   3. Gemini מחזיר רכיבים + מאקרו
//   4. המשתמשת רואה תוצאה, יכולה לערוך
//   5. לחיצה על "אשרי" → רושם ארוחה
//
// ═══════════════════════════════════════════════════════════════

import React, { useState, useRef } from 'react';
import { supabase } from './supabase';

const COLORS = {
  bg: '#F5F2FA', primary: '#B19CD9', primaryDark: '#8B72B5',
  primarySoft: '#E8DFF5', text: '#2E2A3D', textMuted: '#756B85',
  border: '#DDD0EB', red: '#C88A8A', green: '#6BAF8A', amber: '#E8B84B',
};

// המרת קובץ ל-base64
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// דחיסה לפני שליחה (לחסוך bandwidth)
async function compressImage(file, maxWidth = 1024, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => { img.src = e.target.result; };
    reader.onerror = reject;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('דחיסה נכשלה'));
          resolve(blob);
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function MealPhotoAnalyzer({ onConfirm, onClose }) {
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [mealType, setMealType] = useState('lunch');
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setResult(null);
    setAnalyzing(true);

    try {
      // הצגת תצוגה מקדימה
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      // דחיסה
      const compressed = await compressImage(file);
      const base64 = await fileToBase64(new File([compressed], 'meal.jpg', { type: 'image/jpeg' }));

      // שליחה ל-Edge Function
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error('לא מחוברת');

      const supabaseUrl = supabase.supabaseUrl || import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(
        `${supabaseUrl}/functions/v1/analyze-meal-photo`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ image: base64 }),
        }
      );

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || `שגיאה ${response.status}`);
      }

      setResult(data);
    } catch (e) {
      console.error('AI analysis error:', e);
      setError(e.message || 'שגיאה לא ידועה');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirm = () => {
    if (!result) return;
    const total = result.total || {};

    // חבר את שמות הרכיבים לתיאור
    const dishNames = (result.dishes || []).map(d => d.name).join(', ');

    onConfirm({
      type: mealType,
      name: dishNames || 'ארוחה',
      cal: Math.round(total.kcal || 0),
      p: Math.round(total.protein_g || 0),
      c: Math.round(total.carbs_g || 0),
      f: Math.round(total.fat_g || 0),
    });
  };

  // עדכון מאקרו ידני
  const updateMacro = (key, value) => {
    setResult({
      ...result,
      total: { ...result.total, [key]: parseFloat(value) || 0 },
    });
  };

  const confidenceColor = {
    high: COLORS.green,
    medium: COLORS.amber,
    low: COLORS.red,
  };

  const confidenceText = {
    high: 'דיוק גבוה',
    medium: 'דיוק בינוני',
    low: 'דיוק נמוך — בדקי את ההערכה',
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        zIndex: 1500, display: 'flex', alignItems: 'flex-start',
        justifyContent: 'center', padding: 16, direction: 'rtl', overflowY: 'auto',
      }}
      onMouseDown={(e) => { if (e.target === e.currentTarget && !analyzing) onClose(); }}
    >
      <div
        style={{
          background: 'white', borderRadius: 16, padding: 18,
          maxWidth: 480, width: '100%', marginTop: 20, marginBottom: 20,
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: COLORS.primaryDark }}>
            ✨ ניתוח ארוחה ב-AI
          </h3>
          {!analyzing && (
            <button onClick={onClose} style={{
              background: 'transparent', border: 'none',
              fontSize: 22, cursor: 'pointer', color: COLORS.textMuted,
              padding: '0 6px', fontFamily: 'inherit',
            }}>×</button>
          )}
        </div>

        {/* שלב 1 — בחירת תמונה */}
        {!imagePreview && !analyzing && (
          <div>
            <p style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 14, lineHeight: 1.6, textAlign: 'center' }}>
              צלמי או בחרי תמונה של הארוחה,<br/>
              ה-AI יזהה את הרכיבים ויחשב את הערכים התזונתיים.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%', background: 'linear-gradient(135deg, #B19CD9 0%, #8B72B5 100%)',
                color: 'white', border: 'none', padding: '20px 16px',
                borderRadius: 14, fontSize: 15, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                marginBottom: 10,
              }}
            >
              <span style={{ fontSize: 36 }}>📸</span>
              <span>צלמי / בחרי תמונה</span>
            </button>

            <div style={{
              background: '#FFF8E1', border: `1px solid ${COLORS.amber}`,
              borderRadius: 10, padding: 10, marginTop: 12,
            }}>
              <p style={{ margin: 0, fontSize: 11, color: '#7A5C00', lineHeight: 1.5 }}>
                💡 <b>טיפ:</b> צלמי מלמעלה, ודאי תאורה טובה, וכלול את כל הצלחת בפריים.
              </p>
            </div>
          </div>
        )}

        {/* שלב 2 — ממתינים לתשובה */}
        {analyzing && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            {imagePreview && (
              <img src={imagePreview} alt="" style={{
                width: '100%', maxHeight: 280, objectFit: 'cover',
                borderRadius: 12, marginBottom: 16,
              }} />
            )}
            <div style={{
              display: 'inline-block', padding: '10px 20px',
              background: COLORS.primarySoft, borderRadius: 24,
              fontSize: 13, fontWeight: 600, color: COLORS.primaryDark,
            }}>
              <span style={{ marginLeft: 8 }}>🤖</span>
              ה-AI בודק את הצלחת...
            </div>
            <p style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 12 }}>
              זה לוקח כ-5-10 שניות
            </p>
          </div>
        )}

        {/* שגיאה */}
        {error && !analyzing && (
          <div>
            {imagePreview && (
              <img src={imagePreview} alt="" style={{
                width: '100%', maxHeight: 200, objectFit: 'cover',
                borderRadius: 12, marginBottom: 14,
              }} />
            )}
            <div style={{
              background: '#FADDDD', borderRadius: 10, padding: 12,
              marginBottom: 12, fontSize: 13, color: '#8B4040',
            }}>
              <p style={{ margin: 0, fontWeight: 600 }}>❌ שגיאה</p>
              <p style={{ margin: '4px 0 0', fontSize: 12 }}>{error}</p>
            </div>
            <button
              onClick={() => { setError(''); setImagePreview(null); }}
              style={{
                width: '100%', background: COLORS.primary, color: 'white',
                border: 'none', padding: 12, borderRadius: 10,
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >נסי שוב</button>
          </div>
        )}

        {/* שלב 3 — תוצאה */}
        {result && !analyzing && (
          <div>
            {imagePreview && (
              <img src={imagePreview} alt="" style={{
                width: '100%', maxHeight: 200, objectFit: 'cover',
                borderRadius: 12, marginBottom: 14,
              }} />
            )}

            {/* Confidence badge */}
            <div style={{
              display: 'inline-block', background: confidenceColor[result.confidence] || COLORS.amber,
              color: 'white', padding: '4px 10px', borderRadius: 12,
              fontSize: 11, fontWeight: 700, marginBottom: 10,
            }}>
              {confidenceText[result.confidence] || 'דיוק לא ידוע'}
            </div>

            {/* תיאור */}
            {result.description && (
              <p style={{
                fontSize: 13, color: COLORS.text, margin: '0 0 12px',
                background: COLORS.bg, padding: 10, borderRadius: 8,
                lineHeight: 1.5,
              }}>
                {result.description}
              </p>
            )}

            {/* רכיבים */}
            {result.dishes && result.dishes.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: COLORS.primaryDark, margin: '0 0 6px' }}>
                  🍽️ רכיבים שזוהו:
                </p>
                {result.dishes.map((d, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '6px 8px', borderBottom: `1px solid ${COLORS.border}`,
                    fontSize: 12,
                  }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>{d.name}</span>
                      {d.estimated_amount && (
                        <span style={{ color: COLORS.textMuted, fontSize: 11 }}> · {d.estimated_amount}</span>
                      )}
                    </div>
                    <div style={{ color: COLORS.primaryDark, fontWeight: 600 }}>
                      {Math.round(d.kcal || 0)} קק״ל
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* סך הכל - ניתן לעריכה */}
            <div style={{
              background: COLORS.primarySoft, borderRadius: 10,
              padding: 12, marginBottom: 14,
            }}>
              <p style={{ fontSize: 12, fontWeight: 700, margin: '0 0 8px', color: COLORS.primaryDark }}>
                ⚖️ סך הכל לארוחה (ניתן לערוך):
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  ['קלוריות', 'kcal'],
                  ['חלבון (g)', 'protein_g'],
                  ['פחמ׳ (g)', 'carbs_g'],
                  ['שומן (g)', 'fat_g'],
                ].map(([label, key]) => (
                  <div key={key}>
                    <label style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600 }}>{label}</label>
                    <input
                      type="number"
                      value={Math.round(result.total?.[key] || 0)}
                      onChange={(e) => updateMacro(key, e.target.value)}
                      style={{
                        width: '100%', padding: '6px 8px', boxSizing: 'border-box',
                        border: `1px solid ${COLORS.border}`, borderRadius: 6,
                        fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
                        outline: 'none', textAlign: 'center', direction: 'ltr',
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* סוג ארוחה */}
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 12, fontWeight: 600, margin: '0 0 6px' }}>סוג ארוחה</p>
              <div style={{ display: 'flex', gap: 4 }}>
                {[['breakfast', '🌅', 'בוקר'], ['lunch', '🌞', 'צהריים'], ['dinner', '🌙', 'ערב'], ['snack', '🍎', 'נשנוש']].map(([id, icon, label]) => (
                  <button
                    key={id}
                    onClick={() => setMealType(id)}
                    style={{
                      flex: 1, padding: '8px 4px',
                      background: mealType === id ? COLORS.primary : COLORS.primarySoft,
                      color: mealType === id ? 'white' : COLORS.text,
                      border: 'none', borderRadius: 8,
                      fontSize: 11, fontFamily: 'inherit', cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{icon}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* כפתורי פעולה */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                onClick={() => { setResult(null); setImagePreview(null); setError(''); }}
                style={{
                  background: 'white', color: COLORS.text,
                  border: `1px solid ${COLORS.border}`, padding: 12,
                  borderRadius: 10, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >🔄 צילום חדש</button>
              <button
                onClick={handleConfirm}
                style={{
                  background: COLORS.primary, color: 'white',
                  border: 'none', padding: 12, borderRadius: 10,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >✅ רשמי ארוחה</button>
            </div>

            {/* notes */}
            {result.notes && (
              <p style={{
                fontSize: 11, color: COLORS.textMuted, marginTop: 12,
                fontStyle: 'italic', textAlign: 'center', lineHeight: 1.5,
              }}>
                💬 {result.notes}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
