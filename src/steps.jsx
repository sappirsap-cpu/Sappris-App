// ═══════════════════════════════════════════════════════════════
// src/steps.jsx
// מעקב צעדים — דיווח ידני בינתיים, מוכן לאינטגרציה עם Capacitor
// ═══════════════════════════════════════════════════════════════
// בעתיד: כשתעטוף ב-Capacitor, החלף את logSteps עם קריאה ל-
// HealthKit (iOS) / Health Connect (Android) דרך פלאגין.
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

const COLORS = {
  primary: '#B19CD9', primaryDark: '#8B72B5', primarySoft: '#E8DFF5',
  text: '#2E2A3D', textMuted: '#756B85', border: '#DDD0EB',
  green: '#6B9B6B',
};

const card = {
  background: 'white', border: `1px solid ${COLORS.border}`,
  borderRadius: 16, padding: 16,
};

const DAILY_GOAL = 10000;

export async function logSteps(clientId, steps, source = 'manual') {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('steps_logs')
    .upsert(
      { client_id: clientId, steps: parseInt(steps), source, logged_for: today },
      { onConflict: 'client_id,logged_for' }
    )
    .select()
    .single();
  return { data, error };
}

export async function getTodaySteps(clientId) {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from('steps_logs')
    .select('steps')
    .eq('client_id', clientId)
    .eq('logged_for', today)
    .maybeSingle();
  return data?.steps || 0;
}

export async function getWeeklySteps(clientId) {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  const { data } = await supabase
    .from('steps_logs')
    .select('steps, logged_for')
    .eq('client_id', clientId)
    .gte('logged_for', weekAgo.toISOString().slice(0, 10))
    .order('logged_for', { ascending: true });
  return data || [];
}

/* ═══════════════════════════════════════════════════════════
   כרטיס דיווח צעדים למתאמנת
═══════════════════════════════════════════════════════════ */

export function StepsCard({ clientId }) {
  const [steps, setSteps] = useState(0);
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    getTodaySteps(clientId).then(s => {
      setSteps(s);
      setLoading(false);
    });
  }, [clientId]);

  const handleSave = async () => {
    const n = parseInt(input);
    if (!n || n < 0 || n > 100000) return;
    setSteps(n);
    setEditing(false);
    setInput('');
    await logSteps(clientId, n);
  };

  if (loading) return null;

  const percent = Math.min((steps / DAILY_GOAL) * 100, 100);
  const remaining = Math.max(DAILY_GOAL - steps, 0);
  const reached = steps >= DAILY_GOAL;

  return (
    <section style={{
      ...card,
      background: reached ? `linear-gradient(135deg, ${COLORS.primarySoft} 0%, white 100%)` : 'white',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 22 }}>👟</span>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: COLORS.text }}>צעדים היום</p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: COLORS.textMuted }}>
              {reached
                ? '🎉 הגעת ליעד היומי!'
                : remaining > 0 ? `נותרו ${remaining.toLocaleString()} צעדים` : 'בואי נתחיל'}
            </p>
          </div>
        </div>
        <button
          onClick={() => { setEditing(true); setInput(steps.toString()); }}
          style={{
            padding: '6px 12px', background: COLORS.primarySoft,
            color: COLORS.primaryDark, border: 'none', borderRadius: 8,
            fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          ✏️ עדכני
        </button>
      </div>

      {editing ? (
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            type="number"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="מספר צעדים"
            min="0"
            max="100000"
            autoFocus
            style={{
              flex: 1, padding: '10px 12px',
              border: `1px solid ${COLORS.border}`, borderRadius: 10,
              fontSize: 14, fontFamily: 'inherit', outline: 'none',
              direction: 'ltr', textAlign: 'right',
            }}
          />
          <button
            onClick={handleSave}
            style={{
              padding: '10px 16px', background: COLORS.primary, color: 'white',
              border: 'none', borderRadius: 10,
              fontSize: 12, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            שמור
          </button>
          <button
            onClick={() => { setEditing(false); setInput(''); }}
            style={{
              padding: '10px 12px', background: 'white',
              color: COLORS.textMuted, border: `1px solid ${COLORS.border}`,
              borderRadius: 10, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            ✕
          </button>
        </div>
      ) : (
        <>
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <p style={{
              margin: 0, fontSize: 36, fontWeight: 800,
              color: reached ? COLORS.green : COLORS.primaryDark,
              lineHeight: 1,
            }}>
              {steps.toLocaleString()}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: COLORS.textMuted }}>
              מתוך {DAILY_GOAL.toLocaleString()}
            </p>
          </div>

          <div style={{
            height: 8, background: COLORS.primarySoft,
            borderRadius: 99, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', width: `${percent}%`,
              background: reached ? COLORS.green : COLORS.primary,
              transition: 'width 0.4s',
            }} />
          </div>
        </>
      )}

      <p style={{
        margin: '10px 0 0', fontSize: 9, color: COLORS.textMuted,
        textAlign: 'center', lineHeight: 1.4,
      }}>
        💡 בעתיד: סנכרון אוטומטי עם בריאות הטלפון
      </p>
    </section>
  );
}
