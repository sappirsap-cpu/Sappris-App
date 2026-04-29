// ═══════════════════════════════════════════════════════════════
// src/food_sources.jsx
// אינטגרציה עם מאגרי מזון חיצוניים
// ═══════════════════════════════════════════════════════════════
//
// 1. משרד הבריאות (MoH) - טעינה חד-פעמית ל-Supabase
// 2. Open Food Facts - חיפוש דינמי בזמן אמת
//
// קומפוננטות מיוצאות:
//   <MoHImportButton />           — כפתור לטעינת מאגר משרד הבריאות
//   <UnifiedFoodSearch onSelect /> — חיפוש מאוחד (DB מקומי + OFF)
//   <BarcodeFoodLookup onResult /> — חיפוש לפי ברקוד מ-OFF
//
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

const COLORS = {
  bg: '#F5F2FA', primary: '#B19CD9', primaryDark: '#8B72B5',
  primarySoft: '#E8DFF5', text: '#2E2A3D', textMuted: '#756B85',
  border: '#DDD0EB', red: '#C88A8A', green: '#6BAF8A', amber: '#E8B84B',
};

// ───────────────────────────────────────────────────────────────
// 🇮🇱 משרד הבריאות — טעינה
// ───────────────────────────────────────────────────────────────
//
// המאגר זמין ב-data.gov.il כקובץ Excel.
// אנחנו טוענים את הJSON שמתועד ב-CKAN dataset
// ───────────────────────────────────────────────────────────────
const MOH_DATASET_URL = 'https://data.gov.il/api/3/action/datastore_search?resource_id=64dc4e3a-ad88-4b9b-9eb8-d51d56998e29&limit=10000';

export function MoHImportButton({ onDone }) {
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [count, setCount] = useState(0);
  const [error, setError] = useState(null);
  const [lastImport, setLastImport] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('food_imports')
        .select('*')
        .eq('source', 'moh')
        .eq('status', 'success')
        .order('imported_at', { ascending: false })
        .limit(1);
      if (data && data.length > 0) setLastImport(data[0]);
    })();
  }, []);

  const importMoH = async () => {
    setStatus('loading');
    setProgress(0);
    setError(null);

    try {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) throw new Error('לא מחובר');

      // בדיקה: כמה כבר קיימים
      const { count: existing } = await supabase
        .from('food_database')
        .select('*', { count: 'exact', head: true })
        .eq('source', 'moh');

      if (existing && existing > 1000) {
        if (!confirm(`כבר יש ${existing} מזונות ממשרד הבריאות. לטעון מחדש?`)) {
          setStatus('idle');
          return;
        }
      }

      // קריאה ל-Edge Function (לא fetch ישיר — CORS חוסם)
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error('אין session תקף');

      const supabaseUrl = supabase.supabaseUrl || import.meta.env.VITE_SUPABASE_URL;

      // הצגת progress פונקציונאלי (אין לנו progress אמיתי כי הכל קורה ב-Edge Function)
      setProgress(20);
      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 5, 90));
      }, 1500);

      const response = await fetch(
        `${supabaseUrl}/functions/v1/import-moh-foods`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        }
      );

      clearInterval(progressInterval);

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || `שגיאה ${response.status}`);
      }

      setCount(result.imported || 0);
      setProgress(100);
      setStatus('done');
      if (onDone) onDone();
    } catch (e) {
      console.error('MoH import error:', e);
      setError(e.message || 'שגיאה לא ידועה');
      setStatus('error');

      try {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('food_imports').insert({
          source: 'moh',
          total_items: 0,
          status: 'failed',
          error: e.message,
          imported_by: user?.id,
        });
      } catch {}
    }
  };

  if (status === 'done') {
    return (
      <div style={{
        background: '#E0F2EB', border: `1px solid ${COLORS.green}`,
        borderRadius: 12, padding: 14, textAlign: 'center',
      }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#3D7A5E' }}>
          ✅ המאגר נטען בהצלחה — {count} פריטים
        </p>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div style={{ background: 'white', border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 14 }}>
        <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600 }}>
          ⏳ טוענת מאגר משרד הבריאות... {progress}%
        </p>
        <div style={{ height: 6, background: COLORS.bg, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            width: `${progress}%`, height: '100%',
            background: COLORS.primary, transition: 'width 0.3s',
          }} />
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{
        background: '#FADDDD', border: `1px solid ${COLORS.red}`,
        borderRadius: 12, padding: 14,
      }}>
        <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#8B4040' }}>
          ❌ שגיאה: {error}
        </p>
        <button onClick={importMoH} style={{
          background: COLORS.primary, color: 'white', border: 'none',
          padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>נסי שוב</button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={importMoH} style={{
        width: '100%', background: COLORS.primary, color: 'white',
        border: 'none', padding: 14, borderRadius: 12, fontSize: 14,
        fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
      }}>
        📥 טעני מאגר משרד הבריאות (4500+ פריטים)
      </button>

      {lastImport && (
        <p style={{ fontSize: 11, color: COLORS.textMuted, margin: '8px 0 0', textAlign: 'center' }}>
          טעינה אחרונה: {new Date(lastImport.imported_at).toLocaleDateString('he-IL')} ({lastImport.total_items} פריטים)
        </p>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// 🌍 Open Food Facts — חיפוש דינמי
// ───────────────────────────────────────────────────────────────
const OFF_API = 'https://world.openfoodfacts.org/api/v2';

async function searchOFF(query) {
  if (!query || query.length < 2) return [];
  try {
    const url = `${OFF_API}/search?search_terms=${encodeURIComponent(query)}` +
      `&fields=code,product_name,product_name_he,brands,image_thumb_url,nutriments,categories_tags` +
      `&page_size=20`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'SappirFit/1.0 (sappir.fitness)' },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.products || []).map(formatOFFProduct).filter(Boolean);
  } catch (e) {
    console.warn('OFF search error:', e);
    return [];
  }
}

async function lookupOFFBarcode(barcode) {
  try {
    const res = await fetch(`${OFF_API}/product/${barcode}.json`, {
      headers: { 'User-Agent': 'SappirFit/1.0 (sappir.fitness)' },
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.status !== 1) return null;
    return formatOFFProduct(json.product);
  } catch (e) {
    return null;
  }
}

function formatOFFProduct(p) {
  if (!p) return null;
  const n = p.nutriments || {};
  const name = p.product_name_he || p.product_name || p.product_name_en;
  if (!name) return null;
  return {
    source: 'off',
    source_id: p.code,
    barcode: p.code,
    name,
    brand: p.brands || null,
    image_url: p.image_thumb_url || null,
    kcal_per_100g: parseFloat(n['energy-kcal_100g']) || (parseFloat(n.energy_100g) / 4.184) || 0,
    protein_per_100g: parseFloat(n.proteins_100g) || 0,
    carbs_per_100g: parseFloat(n.carbohydrates_100g) || 0,
    fat_per_100g: parseFloat(n.fat_100g) || 0,
    fiber_per_100g: parseFloat(n.fiber_100g) || null,
    sugar_per_100g: parseFloat(n.sugars_100g) || null,
    sodium_per_100g: parseFloat(n.sodium_100g * 1000) || null,
  };
}

// ───────────────────────────────────────────────────────────────
// חיפוש מאוחד — מקומי + OFF
// ───────────────────────────────────────────────────────────────
export function UnifiedFoodSearch({ onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const [localResults, setLocalResults] = useState([]);
  const [offResults, setOffResults] = useState([]);
  const [loadingLocal, setLoadingLocal] = useState(false);
  const [loadingOff, setLoadingOff] = useState(false);
  const [searchOff, setSearchOff] = useState(false);

  // חיפוש מקומי (מהיר — מ-Supabase)
  useEffect(() => {
    const t = setTimeout(async () => {
      if (!query.trim()) {
        setLocalResults([]);
        return;
      }
      setLoadingLocal(true);
      try {
        const { data } = await supabase
          .from('food_database')
          .select('*')
          .ilike('name', `%${query.trim()}%`)
          .limit(20);
        setLocalResults(data || []);
      } catch (e) {
        console.warn('Local search error:', e);
        setLocalResults([]);
      } finally {
        setLoadingLocal(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  // חיפוש OFF (איטי יותר — חיצוני)
  const triggerOffSearch = async () => {
    if (!query.trim()) return;
    setSearchOff(true);
    setLoadingOff(true);
    try {
      const results = await searchOFF(query.trim());
      setOffResults(results);
    } finally {
      setLoadingOff(false);
    }
  };

  const handleSelect = async (food) => {
    // אם זה מ-OFF, שמור עותק מקומי לפעם הבאה
    if (food.source === 'off' && food.source_id) {
      try {
        await supabase.from('food_database').upsert({
          source: 'off',
          source_id: food.source_id,
          barcode: food.barcode,
          name: food.name,
          brand: food.brand,
          image_url: food.image_url,
          kcal_per_100g: food.kcal_per_100g,
          protein_per_100g: food.protein_per_100g,
          carbs_per_100g: food.carbs_per_100g,
          fat_per_100g: food.fat_per_100g,
          fiber_per_100g: food.fiber_per_100g,
          sugar_per_100g: food.sugar_per_100g,
          sodium_per_100g: food.sodium_per_100g,
        }, { onConflict: 'source,source_id' });
      } catch {}
    }
    if (onSelect) onSelect(food);
  };

  const inp = {
    width: '100%', padding: '10px 12px', boxSizing: 'border-box',
    border: `1px solid ${COLORS.border}`, borderRadius: 10,
    fontSize: 13, fontFamily: 'inherit', outline: 'none',
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
        zIndex: 1000, display: 'flex', alignItems: 'flex-start',
        justifyContent: 'center', padding: 20, direction: 'rtl', overflowY: 'auto',
      }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose && onClose(); }}
    >
      <div
        style={{
          background: 'white', borderRadius: 14, padding: 16,
          maxWidth: 600, width: '100%', marginTop: 30,
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: COLORS.primaryDark }}>
            🔍 חיפוש מזון
          </h3>
          {onClose && (
            <button onClick={onClose} style={{
              background: 'transparent', border: 'none',
              fontSize: 22, cursor: 'pointer', color: COLORS.textMuted,
              padding: '0 6px', fontFamily: 'inherit',
            }}>×</button>
          )}
        </div>

        <input
          autoFocus
          value={query}
          onChange={e => { setQuery(e.target.value); setSearchOff(false); }}
          placeholder="חזה עוף, אורז, מרק עוף..."
          style={{ ...inp, marginBottom: 10 }}
        />

        <div style={{ flex: 1, overflowY: 'auto', minHeight: 200 }}>
          {/* תוצאות מקומיות */}
          {loadingLocal && (
            <p style={{ textAlign: 'center', color: COLORS.textMuted, padding: 10, fontSize: 12 }}>
              מחפשת במאגר מקומי...
            </p>
          )}

          {!loadingLocal && localResults.length > 0 && (
            <>
              <p style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, margin: '4px 0 6px', textTransform: 'uppercase' }}>
                🇮🇱 מאגר מקומי ({localResults.length})
              </p>
              {localResults.map(f => <FoodResultRow key={`local-${f.id}`} food={f} onSelect={handleSelect} />)}
            </>
          )}

          {/* כפתור חיפוש OFF */}
          {query.trim().length >= 2 && !loadingOff && !searchOff && (
            <button
              onClick={triggerOffSearch}
              style={{
                width: '100%', marginTop: 10, background: 'transparent',
                border: `1px dashed ${COLORS.primary}`, color: COLORS.primaryDark,
                padding: 10, borderRadius: 10, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              🌍 חפשי גם ב-Open Food Facts (מוצרים מסחריים)
            </button>
          )}

          {loadingOff && (
            <p style={{ textAlign: 'center', color: COLORS.textMuted, padding: 10, fontSize: 12 }}>
              מחפשת במאגר עולמי...
            </p>
          )}

          {!loadingOff && searchOff && offResults.length > 0 && (
            <>
              <p style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, margin: '12px 0 6px', textTransform: 'uppercase' }}>
                🌍 Open Food Facts ({offResults.length})
              </p>
              {offResults.map(f => <FoodResultRow key={`off-${f.source_id}`} food={f} onSelect={handleSelect} />)}
            </>
          )}

          {!loadingOff && searchOff && offResults.length === 0 && (
            <p style={{ textAlign: 'center', color: COLORS.textMuted, fontSize: 12, padding: 10 }}>
              לא נמצאו מוצרים ב-OFF
            </p>
          )}

          {!loadingLocal && localResults.length === 0 && query.trim() && !searchOff && (
            <p style={{ textAlign: 'center', color: COLORS.textMuted, fontSize: 12, padding: 10 }}>
              לא נמצאו תוצאות במאגר המקומי. נסי לחפש ב-OFF למעלה.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function FoodResultRow({ food, onSelect }) {
  const isOff = food.source === 'off';
  return (
    <button
      onClick={() => onSelect(food)}
      style={{
        width: '100%', textAlign: 'right', padding: 10, gap: 10,
        background: COLORS.bg, border: `1px solid ${COLORS.border}`,
        borderRadius: 10, marginBottom: 6, cursor: 'pointer',
        fontFamily: 'inherit', display: 'flex', alignItems: 'center',
      }}
    >
      {food.image_url ? (
        <img src={food.image_url} alt="" style={{
          width: 40, height: 40, borderRadius: 6,
          objectFit: 'cover', flexShrink: 0,
        }} />
      ) : (
        <div style={{
          width: 40, height: 40, borderRadius: 6, flexShrink: 0,
          background: isOff ? '#E0F2EB' : COLORS.primarySoft,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16,
        }}>{isOff ? '🌍' : '🇮🇱'}</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {food.name}
          {food.brand && <span style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 400 }}> · {food.brand}</span>}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: COLORS.textMuted }}>
          ל-100ג: {Math.round(food.kcal_per_100g || 0)} קק״ל ·
          {' '}{Math.round(food.protein_per_100g || 0)}ג חלבון ·
          {' '}{Math.round(food.carbs_per_100g || 0)}ג פחמ׳ ·
          {' '}{Math.round(food.fat_per_100g || 0)}ג שומן
        </p>
      </div>
    </button>
  );
}

// ───────────────────────────────────────────────────────────────
// חיפוש לפי ברקוד
// ───────────────────────────────────────────────────────────────
export function BarcodeFoodLookup({ onResult, onClose }) {
  const [barcode, setBarcode] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const handleLookup = async () => {
    setError('');
    if (!barcode.trim() || barcode.trim().length < 8) {
      setError('הקלידי ברקוד תקין (לפחות 8 ספרות)');
      return;
    }
    setSearching(true);
    try {
      // נסה קודם במאגר המקומי
      const { data: local } = await supabase
        .from('food_database')
        .select('*')
        .eq('barcode', barcode.trim())
        .limit(1);

      if (local && local.length > 0) {
        if (onResult) onResult(local[0]);
        return;
      }

      // אם לא נמצא — חפש ב-OFF
      const result = await lookupOFFBarcode(barcode.trim());
      if (!result) {
        setError('לא נמצא מוצר עם ברקוד זה');
        return;
      }

      // שמור למטמון
      try {
        await supabase.from('food_database').upsert({
          source: 'off', source_id: result.source_id, barcode: result.barcode,
          name: result.name, brand: result.brand, image_url: result.image_url,
          kcal_per_100g: result.kcal_per_100g,
          protein_per_100g: result.protein_per_100g,
          carbs_per_100g: result.carbs_per_100g, fat_per_100g: result.fat_per_100g,
          fiber_per_100g: result.fiber_per_100g,
          sugar_per_100g: result.sugar_per_100g,
          sodium_per_100g: result.sodium_per_100g,
        }, { onConflict: 'source,source_id' });
      } catch {}

      if (onResult) onResult(result);
    } catch (e) {
      setError('שגיאה: ' + e.message);
    } finally {
      setSearching(false);
    }
  };

  const inp = {
    width: '100%', padding: '10px 12px', boxSizing: 'border-box',
    border: `1px solid ${COLORS.border}`, borderRadius: 10,
    fontSize: 14, fontFamily: 'inherit', outline: 'none',
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
        zIndex: 1000, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: 20, direction: 'rtl',
      }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose && onClose(); }}
    >
      <div
        style={{
          background: 'white', borderRadius: 14, padding: 20,
          maxWidth: 400, width: '100%',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: COLORS.primaryDark, textAlign: 'center' }}>
          📦 חיפוש לפי ברקוד
        </h3>
        <p style={{ fontSize: 12, color: COLORS.textMuted, textAlign: 'center', marginBottom: 12 }}>
          הקלידי את הברקוד מהאריזה
        </p>

        <input
          autoFocus
          type="text"
          inputMode="numeric"
          value={barcode}
          onChange={e => setBarcode(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder="7290000000000"
          style={{ ...inp, marginBottom: 12, textAlign: 'center', letterSpacing: 1 }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleLookup(); }}
        />

        {error && (
          <div style={{
            background: '#FADDDD', borderRadius: 8, padding: 8,
            marginBottom: 10, fontSize: 12, color: '#8B4040', textAlign: 'center',
          }}>{error}</div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button onClick={onClose} disabled={searching} style={{
            background: 'white', color: COLORS.text,
            border: `1px solid ${COLORS.border}`, padding: 12,
            borderRadius: 10, fontSize: 14, fontWeight: 600,
            cursor: searching ? 'default' : 'pointer', fontFamily: 'inherit',
          }}>ביטול</button>
          <button onClick={handleLookup} disabled={searching} style={{
            background: COLORS.primary, color: 'white', border: 'none',
            padding: 12, borderRadius: 10, fontSize: 14, fontWeight: 600,
            cursor: searching ? 'default' : 'pointer', fontFamily: 'inherit',
            opacity: searching ? 0.5 : 1,
          }}>{searching ? 'מחפשת...' : 'חפשי'}</button>
        </div>
      </div>
    </div>
  );
}
