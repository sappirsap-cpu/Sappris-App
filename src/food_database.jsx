// ═══════════════════════════════════════════════════════════════
// src/food_database.jsx
// מאגר מזון ישראלי + חיפוש + סריקת ברקוד + רישום ארוחה מהיר
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from './supabase';

const COLORS = {
  bg: '#F5F2FA', primary: '#B19CD9', primaryDark: '#8B72B5',
  primarySoft: '#E8DFF5', text: '#2E2A3D', textMuted: '#756B85',
  border: '#DDD0EB', green: '#6BAF8A', greenSoft: '#E0F2EB',
  amber: '#E8C96A', amberSoft: '#F5EECD', red: '#C88A8A',
};

const card = {
  background: 'white', border: `1px solid ${COLORS.border}`,
  borderRadius: 16, padding: 16,
};

/* ═══════════════════════════════════════════════════════════
   מאגר מזון ישראלי מובנה — 80+ מוצרים נפוצים
═══════════════════════════════════════════════════════════ */

export const ISRAELI_FOODS = [
  // ── לחם ולחמניות ──
  { id: 'f001', name: 'לחם אחיד פרוסה', category: 'לחם', cal_per_100: 248, protein: 8.5, carbs: 50, fat: 2.5, fiber: 3, unit: 'פרוסה (35g)', unit_g: 35 },
  { id: 'f002', name: 'לחם מחיטה מלאה פרוסה', category: 'לחם', cal_per_100: 230, protein: 9, carbs: 44, fat: 2, fiber: 6, unit: 'פרוסה (35g)', unit_g: 35 },
  { id: 'f003', name: 'פיתה לבנה', category: 'לחם', cal_per_100: 270, protein: 9, carbs: 55, fat: 1.5, fiber: 2, unit: 'פיתה (60g)', unit_g: 60 },
  { id: 'f004', name: 'פיתה מחיטה מלאה', category: 'לחם', cal_per_100: 245, protein: 10, carbs: 48, fat: 1.5, fiber: 7, unit: 'פיתה (60g)', unit_g: 60 },
  { id: 'f005', name: 'לחמניה', category: 'לחם', cal_per_100: 265, protein: 9, carbs: 52, fat: 3, fiber: 2, unit: 'לחמניה (70g)', unit_g: 70 },

  // ── חלבונים ──
  { id: 'p001', name: 'חזה עוף מבושל', category: 'חלבון', cal_per_100: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, unit: '100g', unit_g: 100 },
  { id: 'p002', name: 'ביצה קשה', category: 'חלבון', cal_per_100: 155, protein: 13, carbs: 1, fat: 11, fiber: 0, unit: 'ביצה (60g)', unit_g: 60 },
  { id: 'p003', name: 'טונה בשמן (מסוננת)', category: 'חלבון', cal_per_100: 200, protein: 30, carbs: 0, fat: 9, fiber: 0, unit: 'פחית (160g)', unit_g: 160 },
  { id: 'p004', name: 'גבינה 5%', category: 'גבינה', cal_per_100: 90, protein: 11, carbs: 3, fat: 3.5, fiber: 0, unit: '100g', unit_g: 100 },
  { id: 'p005', name: 'גבינה 9%', category: 'גבינה', cal_per_100: 130, protein: 10, carbs: 3, fat: 8, fiber: 0, unit: '100g', unit_g: 100 },
  { id: 'p006', name: 'קוטג׳ 3%', category: 'גבינה', cal_per_100: 80, protein: 11, carbs: 3.5, fat: 3, fiber: 0, unit: '100g', unit_g: 100 },
  { id: 'p007', name: 'יוגורט 3%', category: 'חלב', cal_per_100: 70, protein: 4, carbs: 5, fat: 3, fiber: 0, unit: '100g', unit_g: 100 },
  { id: 'p008', name: 'יוגורט 0%', category: 'חלב', cal_per_100: 50, protein: 5, carbs: 6, fat: 0.2, fiber: 0, unit: '100g', unit_g: 100 },
  { id: 'p009', name: 'טופו טבעי', category: 'חלבון', cal_per_100: 76, protein: 8, carbs: 2, fat: 4, fiber: 0.5, unit: '100g', unit_g: 100 },
  { id: 'p010', name: 'סלמון אפוי', category: 'חלבון', cal_per_100: 208, protein: 20, carbs: 0, fat: 13, fiber: 0, unit: '100g', unit_g: 100 },
  { id: 'p011', name: 'חזה הודו פרוס', category: 'חלבון', cal_per_100: 105, protein: 22, carbs: 0.5, fat: 1.5, fiber: 0, unit: '100g', unit_g: 100 },

  // ── דגנים ופחמימות ──
  { id: 'c001', name: 'אורז לבן מבושל', category: 'דגנים', cal_per_100: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, unit: '100g', unit_g: 100 },
  { id: 'c002', name: 'אורז מלא מבושל', category: 'דגנים', cal_per_100: 112, protein: 2.6, carbs: 24, fat: 0.9, fiber: 1.8, unit: '100g', unit_g: 100 },
  { id: 'c003', name: 'פסטה מבושלת', category: 'דגנים', cal_per_100: 158, protein: 5.8, carbs: 31, fat: 0.9, fiber: 1.8, unit: '100g', unit_g: 100 },
  { id: 'c004', name: 'קוואקר גולמי', category: 'דגנים', cal_per_100: 389, protein: 17, carbs: 66, fat: 7, fiber: 10, unit: '30g', unit_g: 30 },
  { id: 'c005', name: 'קינואה מבושלת', category: 'דגנים', cal_per_100: 120, protein: 4.4, carbs: 21, fat: 1.9, fiber: 2.8, unit: '100g', unit_g: 100 },
  { id: 'c006', name: 'בטטה אפויה', category: 'ירקות עמילניים', cal_per_100: 90, protein: 2, carbs: 21, fat: 0.1, fiber: 3.3, unit: '100g', unit_g: 100 },
  { id: 'c007', name: 'תפוח אדמה מבושל', category: 'ירקות עמילניים', cal_per_100: 77, protein: 2, carbs: 17, fat: 0.1, fiber: 2.2, unit: '100g', unit_g: 100 },

  // ── ירקות ──
  { id: 'v001', name: 'מלפפון', category: 'ירקות', cal_per_100: 15, protein: 0.7, carbs: 3.6, fat: 0.1, fiber: 0.5, unit: 'מלפפון בינוני (120g)', unit_g: 120 },
  { id: 'v002', name: 'עגבנייה', category: 'ירקות', cal_per_100: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, unit: 'עגבנייה בינונית (120g)', unit_g: 120 },
  { id: 'v003', name: 'פלפל אדום', category: 'ירקות', cal_per_100: 31, protein: 1, carbs: 6, fat: 0.3, fiber: 2.1, unit: '100g', unit_g: 100 },
  { id: 'v004', name: 'חסה', category: 'ירקות', cal_per_100: 15, protein: 1.4, carbs: 2.9, fat: 0.2, fiber: 1.3, unit: 'כוס (30g)', unit_g: 30 },
  { id: 'v005', name: 'גזר', category: 'ירקות', cal_per_100: 41, protein: 0.9, carbs: 9.6, fat: 0.2, fiber: 2.8, unit: 'גזר בינוני (80g)', unit_g: 80 },
  { id: 'v006', name: 'ברוקולי מבושל', category: 'ירקות', cal_per_100: 35, protein: 2.4, carbs: 7.2, fat: 0.4, fiber: 3.3, unit: 'כוס (90g)', unit_g: 90 },

  // ── פירות ──
  { id: 'fr001', name: 'תפוח', category: 'פירות', cal_per_100: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, unit: 'תפוח בינוני (180g)', unit_g: 180 },
  { id: 'fr002', name: 'בננה', category: 'פירות', cal_per_100: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, unit: 'בננה בינונית (120g)', unit_g: 120 },
  { id: 'fr003', name: 'תפוז', category: 'פירות', cal_per_100: 47, protein: 0.9, carbs: 12, fat: 0.1, fiber: 2.4, unit: 'תפוז בינוני (180g)', unit_g: 180 },
  { id: 'fr004', name: 'ענבים', category: 'פירות', cal_per_100: 69, protein: 0.7, carbs: 18, fat: 0.2, fiber: 0.9, unit: 'כוס (150g)', unit_g: 150 },
  { id: 'fr005', name: 'אבוקדו', category: 'פירות', cal_per_100: 160, protein: 2, carbs: 9, fat: 15, fiber: 7, unit: 'חצי (80g)', unit_g: 80 },
  { id: 'fr006', name: 'אבטיח', category: 'פירות', cal_per_100: 30, protein: 0.6, carbs: 7.6, fat: 0.2, fiber: 0.4, unit: 'פרוסה (200g)', unit_g: 200 },

  // ── שומנים ──
  { id: 'fat001', name: 'שמן זית', category: 'שמנים', cal_per_100: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, unit: 'כפית (5g)', unit_g: 5 },
  { id: 'fat002', name: 'חמאת בוטנים', category: 'שומנים', cal_per_100: 588, protein: 25, carbs: 20, fat: 50, fiber: 6, unit: 'כף (16g)', unit_g: 16 },
  { id: 'fat003', name: 'שקדים', category: 'אגוזים', cal_per_100: 579, protein: 21, carbs: 22, fat: 50, fiber: 12.5, unit: 'חופן (30g)', unit_g: 30 },
  { id: 'fat004', name: 'טחינה גולמית', category: 'שמנים', cal_per_100: 595, protein: 17, carbs: 21, fat: 53, fiber: 9, unit: 'כף (15g)', unit_g: 15 },

  // ── קטניות ──
  { id: 'leg001', name: 'עדשים מבושלים', category: 'קטניות', cal_per_100: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 7.9, unit: '100g', unit_g: 100 },
  { id: 'leg002', name: 'חומוס מבושל', category: 'קטניות', cal_per_100: 164, protein: 8.9, carbs: 27, fat: 2.6, fiber: 7.6, unit: '100g', unit_g: 100 },
  { id: 'leg003', name: 'שעועית שחורה מבושלת', category: 'קטניות', cal_per_100: 132, protein: 8.9, carbs: 24, fat: 0.5, fiber: 8.7, unit: '100g', unit_g: 100 },
  { id: 'leg004', name: 'פלאפל (יחידה)', category: 'קטניות', cal_per_100: 270, protein: 9, carbs: 26, fat: 14, fiber: 4, unit: 'יחידה (30g)', unit_g: 30 },
  { id: 'leg005', name: 'חומוס ממרח', category: 'קטניות', cal_per_100: 177, protein: 8, carbs: 16, fat: 10, fiber: 4, unit: 'כף (30g)', unit_g: 30 },

  // ── מוצרי חלב ──
  { id: 'd001', name: 'חלב 1%', category: 'חלב', cal_per_100: 45, protein: 3.5, carbs: 5, fat: 1, fiber: 0, unit: 'כוס (240ml)', unit_g: 240 },
  { id: 'd002', name: 'גבינה צהובה 9%', category: 'גבינה', cal_per_100: 300, protein: 24, carbs: 2, fat: 21, fiber: 0, unit: 'פרוסה (20g)', unit_g: 20 },
  { id: 'd003', name: 'שמנת חמוצה 15%', category: 'חלב', cal_per_100: 140, protein: 2.7, carbs: 3.4, fat: 13, fiber: 0, unit: 'כף (15g)', unit_g: 15 },
  { id: 'd004', name: 'לבן 1%', category: 'חלב', cal_per_100: 50, protein: 3.5, carbs: 5.5, fat: 1, fiber: 0, unit: '100g', unit_g: 100 },

  // ── אוכל ישראלי מוכן ──
  { id: 'isr001', name: 'שקשוקה (מנה)', category: 'מנות ישראליות', cal_per_100: 100, protein: 7, carbs: 8, fat: 5, fiber: 2, unit: 'מנה (250g)', unit_g: 250 },
  { id: 'isr002', name: 'שניצל עוף (100g)', category: 'מנות ישראליות', cal_per_100: 230, protein: 19, carbs: 10, fat: 13, fiber: 0.5, unit: '100g', unit_g: 100 },
  { id: 'isr003', name: 'כדורי גבינה (יחידה)', category: 'מנות ישראליות', cal_per_100: 220, protein: 6, carbs: 18, fat: 14, fiber: 0.5, unit: 'יחידה (40g)', unit_g: 40 },
  { id: 'isr004', name: 'חציל צלוי', category: 'ירקות', cal_per_100: 35, protein: 0.8, carbs: 8.7, fat: 0.2, fiber: 2.5, unit: '100g', unit_g: 100 },

  // ── שתייה ──
  { id: 'dr001', name: 'קפה שחור', category: 'שתייה', cal_per_100: 2, protein: 0.3, carbs: 0, fat: 0, fiber: 0, unit: 'כוס (240ml)', unit_g: 0 },
  { id: 'dr002', name: 'לאטה עם חלב 1%', category: 'שתייה', cal_per_100: 47, protein: 3.4, carbs: 4.9, fat: 1, fiber: 0, unit: 'כוס (240ml)', unit_g: 240 },
  { id: 'dr003', name: 'מיץ תפוזים טבעי', category: 'שתייה', cal_per_100: 45, protein: 0.7, carbs: 10.4, fat: 0.2, fiber: 0.2, unit: 'כוס (240ml)', unit_g: 240 },
];

/* ═══════════════════════════════════════════════════════════
   API — ל-Supabase
═══════════════════════════════════════════════════════════ */

export async function searchFoodDB(query) {
  // חיפוש מקומי במאגר המובנה
  const q = query.toLowerCase().trim();
  if (!q) return ISRAELI_FOODS.slice(0, 20);
  return ISRAELI_FOODS.filter(f =>
    f.name.toLowerCase().includes(q) ||
    f.category.toLowerCase().includes(q)
  ).slice(0, 30);
}

export async function logMealFromFood(clientId, foodItem, grams, mealType = 'snack') {
  const ratio = grams / 100;
  const cal = Math.round(foodItem.cal_per_100 * ratio);
  const protein = Math.round(foodItem.protein * ratio * 10) / 10;
  const carbs = Math.round(foodItem.carbs * ratio * 10) / 10;
  const fat = Math.round(foodItem.fat * ratio * 10) / 10;

  const { data, error } = await supabase
    .from('meal_logs')
    .insert({
      client_id: clientId,
      name: foodItem.name,
      meal_type: mealType,
      calories: cal,
      protein_g: protein,
      carbs_g: carbs,
      fat_g: fat,
      grams: grams,
      food_id: foodItem.id,
      logged_at: new Date().toISOString(),
    })
    .select()
    .single();

  return { data, error };
}

export async function searchBarcode(barcode) {
  // ניסיון לחיפוש ב-Open Food Facts עם מוצרים ישראליים
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
    );
    const data = await res.json();
    if (data.status === 1 && data.product) {
      const p = data.product;
      const nutriments = p.nutriments || {};
      return {
        found: true,
        food: {
          id: `barcode_${barcode}`,
          name: p.product_name_he || p.product_name || 'מוצר לא ידוע',
          category: p.categories_tags?.[0]?.replace('en:', '') || 'כללי',
          cal_per_100: Math.round(nutriments['energy-kcal_100g'] || 0),
          protein: Math.round((nutriments.proteins_100g || 0) * 10) / 10,
          carbs: Math.round((nutriments.carbohydrates_100g || 0) * 10) / 10,
          fat: Math.round((nutriments.fat_100g || 0) * 10) / 10,
          fiber: Math.round((nutriments.fiber_100g || 0) * 10) / 10,
          unit: '100g', unit_g: 100,
          barcode,
        },
      };
    }
  } catch (e) { /* fail silently */ }
  return { found: false };
}

/* ═══════════════════════════════════════════════════════════
   קומפוננטה ראשית: חיפוש ורישום מזון
═══════════════════════════════════════════════════════════ */

export function FoodSearchAndLog({ clientId, mealType = 'snack', onLogged, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(ISRAELI_FOODS.slice(0, 15));
  const [selectedFood, setSelectedFood] = useState(null);
  const [grams, setGrams] = useState('');
  const [logging, setLogging] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [tab, setTab] = useState('search'); // 'search' | 'scan'

  const categories = [...new Set(ISRAELI_FOODS.map(f => f.category))];
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => {
    const filtered = ISRAELI_FOODS.filter(f => {
      const matchQ = !query || f.name.toLowerCase().includes(query.toLowerCase()) || f.category.toLowerCase().includes(query.toLowerCase());
      const matchCat = !activeCategory || f.category === activeCategory;
      return matchQ && matchCat;
    });
    setResults(filtered.slice(0, 30));
  }, [query, activeCategory]);

  const handleSelectFood = (food) => {
    setSelectedFood(food);
    setGrams(String(food.unit_g));
  };

  const handleLog = async () => {
    if (!selectedFood || !grams) return;
    setLogging(true);
    const { error } = await logMealFromFood(clientId, selectedFood, Number(grams), mealType);
    setLogging(false);
    if (error) { alert('שגיאה: ' + error.message); return; }
    onLogged && onLogged({ food: selectedFood, grams: Number(grams) });
    setSelectedFood(null);
    setGrams('');
    setQuery('');
  };

  const handleBarcodeScan = async (barcode) => {
    const { found, food } = await searchBarcode(barcode);
    if (found) {
      setScanResult(food);
      setSelectedFood(food);
      setGrams('100');
    } else {
      alert('מוצר לא נמצא במאגר. נסי לחפש ידנית.');
    }
    setShowScanner(false);
  };

  const calcNutrients = (food, g) => {
    if (!food || !g) return null;
    const ratio = g / 100;
    return {
      cal: Math.round(food.cal_per_100 * ratio),
      protein: Math.round(food.protein * ratio * 10) / 10,
      carbs: Math.round(food.carbs * ratio * 10) / 10,
      fat: Math.round(food.fat * ratio * 10) / 10,
    };
  };

  const nutrients = calcNutrients(selectedFood, Number(grams));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, direction: 'rtl' }}>

      {/* כותרת */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: COLORS.primaryDark }}>🔍 חיפוש מזון</h3>
        {onClose && <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 18, cursor: 'pointer', color: COLORS.textMuted }}>✕</button>}
      </div>

      {/* טאבים */}
      <div style={{ display: 'flex', gap: 4, background: '#F5F2FA', borderRadius: 10, padding: 4 }}>
        {[
          { id: 'search', label: '🔍 חיפוש' },
          { id: 'scan', label: '📷 ברקוד' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, background: tab === t.id ? 'white' : 'transparent',
            border: 'none', borderRadius: 8, padding: '7px',
            fontSize: 12, fontWeight: tab === t.id ? 700 : 500,
            color: tab === t.id ? COLORS.primaryDark : COLORS.textMuted,
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
          }}>{t.label}</button>
        ))}
      </div>

      {/* תוכן */}
      {tab === 'search' && (
        <>
          {/* חיפוש */}
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="חפשי מוצר... (חזה עוף, ביצה, לחם...)"
            style={{ padding: '10px 14px', border: `1px solid ${COLORS.border}`, borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: 'white' }}
            autoFocus
          />

          {/* קטגוריות */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            <button onClick={() => setActiveCategory(null)} style={{
              background: !activeCategory ? COLORS.primary : 'white',
              color: !activeCategory ? 'white' : COLORS.text,
              border: `1px solid ${!activeCategory ? COLORS.primary : COLORS.border}`,
              borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0,
            }}>הכל</button>
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(activeCategory === cat ? null : cat)} style={{
                background: activeCategory === cat ? COLORS.primary : 'white',
                color: activeCategory === cat ? 'white' : COLORS.text,
                border: `1px solid ${activeCategory === cat ? COLORS.primary : COLORS.border}`,
                borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0,
              }}>{cat}</button>
            ))}
          </div>

          {/* תוצאות */}
          <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {results.map(food => (
              <FoodItem key={food.id} food={food}
                selected={selectedFood?.id === food.id}
                onSelect={() => handleSelectFood(food)} />
            ))}
            {results.length === 0 && (
              <p style={{ textAlign: 'center', color: COLORS.textMuted, fontSize: 12, padding: 16 }}>לא נמצאו תוצאות</p>
            )}
          </div>
        </>
      )}

      {tab === 'scan' && (
        <BarcodeScanner onScan={handleBarcodeScan} onCancel={() => setTab('search')} />
      )}

      {/* בחירה ורישום */}
      {selectedFood && (
        <div style={{ ...card, background: COLORS.primarySoft, border: `1px solid ${COLORS.primary}` }}>
          <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: COLORS.primaryDark }}>{selectedFood.name}</p>

          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 4px', fontSize: 11, color: COLORS.textMuted }}>כמות (גרם)</p>
              <input
                type="number" value={grams} min={1}
                onChange={e => setGrams(e.target.value)}
                style={{ padding: '9px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 10, fontSize: 14, fontFamily: 'inherit', width: '100%', boxSizing: 'border-box', fontWeight: 700, textAlign: 'center', outline: 'none' }}
              />
            </div>
            {/* מנות מהירות */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {[selectedFood.unit_g, 50, 100, 150].filter((v, i, arr) => arr.indexOf(v) === i && v > 0).slice(0, 3).map(g => (
                <button key={g} onClick={() => setGrams(String(g))} style={{
                  background: Number(grams) === g ? COLORS.primary : 'white',
                  color: Number(grams) === g ? 'white' : COLORS.text,
                  border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '6px 10px',
                  fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                }}>{g}g</button>
              ))}
            </div>
          </div>

          {/* תצוגת ערכים */}
          {nutrients && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
              {[
                { label: 'קלוריות', value: nutrients.cal, unit: '' },
                { label: 'חלבון', value: nutrients.protein, unit: 'g' },
                { label: 'פחמימות', value: nutrients.carbs, unit: 'g' },
                { label: 'שומן', value: nutrients.fat, unit: 'g' },
              ].map(n => (
                <div key={n.label} style={{ background: 'white', borderRadius: 8, padding: '6px 4px', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: COLORS.primaryDark }}>{n.value}{n.unit}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 9, color: COLORS.textMuted }}>{n.label}</p>
                </div>
              ))}
            </div>
          )}

          <button onClick={handleLog} disabled={logging || !grams} style={{
            width: '100%', background: COLORS.primary, color: 'white', border: 'none',
            padding: '11px', borderRadius: 10, fontSize: 13, fontWeight: 700,
            cursor: logging || !grams ? 'default' : 'pointer', fontFamily: 'inherit',
            opacity: logging || !grams ? 0.6 : 1,
          }}>{logging ? 'רושמת...' : `✅ רשמי ${nutrients?.cal || 0} קק"ל`}</button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   פריט מזון ברשימה
═══════════════════════════════════════════════════════════ */

function FoodItem({ food, selected, onSelect }) {
  return (
    <div onClick={onSelect} style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 12px', background: selected ? COLORS.primarySoft : 'white',
      border: `1px solid ${selected ? COLORS.primary : COLORS.border}`,
      borderRadius: 10, cursor: 'pointer',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: COLORS.text }}>{food.name}</p>
        <p style={{ margin: '2px 0 0', fontSize: 10, color: COLORS.textMuted }}>{food.category} · {food.unit}</p>
      </div>
      <div style={{ textAlign: 'left', flexShrink: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: COLORS.primaryDark }}>
          {Math.round(food.cal_per_100 * food.unit_g / 100)} קק"ל
        </p>
        <p style={{ margin: '1px 0 0', fontSize: 9, color: COLORS.textMuted }}>
          {Math.round(food.protein * food.unit_g / 100)}g חלב
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   סורק ברקוד (HTML5 BarcodeDetector API)
═══════════════════════════════════════════════════════════ */

function BarcodeScanner({ onScan, onCancel }) {
  const videoRef = useRef(null);
  const [supported, setSupported] = useState(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const hasAPI = 'BarcodeDetector' in window;
    setSupported(hasAPI);
    if (!hasAPI) return;

    let stream;
    let detector;
    let animId;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 } },
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
        detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'code_128', 'qr_code'] });
        setScanning(true);

        const detect = async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) {
            animId = requestAnimationFrame(detect);
            return;
          }
          const barcodes = await detector.detect(videoRef.current).catch(() => []);
          if (barcodes.length > 0) {
            setScanning(false);
            stream.getTracks().forEach(t => t.stop());
            onScan(barcodes[0].rawValue);
            return;
          }
          animId = requestAnimationFrame(detect);
        };
        animId = requestAnimationFrame(detect);
      } catch (e) {
        setSupported(false);
      }
    };

    startCamera();
    return () => {
      if (animId) cancelAnimationFrame(animId);
      stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  if (supported === false) {
    return (
      <div style={{ ...card, textAlign: 'center', padding: 20 }}>
        <p style={{ margin: 0, fontSize: 14, color: COLORS.text }}>📷 סריקת ברקוד לא זמינה בדפדפן זה</p>
        <p style={{ margin: '8px 0 12px', fontSize: 12, color: COLORS.textMuted }}>הכניסי ברקוד ידנית:</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={manualBarcode} onChange={e => setManualBarcode(e.target.value)}
            placeholder="729775029999"
            style={{ flex: 1, padding: '10px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', direction: 'ltr' }} />
          <button onClick={() => manualBarcode && onScan(manualBarcode)} style={{
            background: COLORS.primary, color: 'white', border: 'none',
            padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>חפש</button>
        </div>
        <button onClick={onCancel} style={{ marginTop: 10, background: 'transparent', border: 'none', color: COLORS.textMuted, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>← חזרה לחיפוש</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#000', aspectRatio: '4/3' }}>
        <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        {/* מסגרת סריקה */}
        <div style={{
          position: 'absolute', inset: '20% 10%',
          border: `3px solid ${COLORS.primary}`,
          borderRadius: 12, boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
        }} />
        {scanning && (
          <div style={{
            position: 'absolute', bottom: 16, left: 0, right: 0,
            textAlign: 'center', color: 'white', fontSize: 12,
          }}>סורקת... כוונני את הברקוד לתוך המסגרת</div>
        )}
      </div>
      <p style={{ margin: 0, fontSize: 11, color: COLORS.textMuted, textAlign: 'center' }}>
        מחפש ב-Open Food Facts — מאגר 3 מיליון מוצרים עולמי
      </p>
      <button onClick={onCancel} style={{
        background: 'white', border: `1px solid ${COLORS.border}`,
        padding: '10px', borderRadius: 10, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
      }}>← חזרה לחיפוש</button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ווידג'ט מובנה — כפתור רישום מהיר (לשימוש בכל מקום)
═══════════════════════════════════════════════════════════ */

export function QuickFoodLogButton({ clientId, mealType, onLogged }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} style={{
        background: COLORS.primary, color: 'white', border: 'none',
        padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700,
        cursor: 'pointer', fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span>🍽️</span> הוסיפי ארוחה
      </button>

      {open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 300, display: 'flex', alignItems: 'flex-end',
        }} onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div style={{
            background: 'white', borderRadius: '20px 20px 0 0',
            padding: 16, width: '100%', maxHeight: '85vh', overflowY: 'auto',
          }}>
            <FoodSearchAndLog
              clientId={clientId}
              mealType={mealType}
              onLogged={(info) => {
                setOpen(false);
                onLogged && onLogged(info);
              }}
              onClose={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
