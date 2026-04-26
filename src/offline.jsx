// ═══════════════════════════════════════════════════════════════
// src/offline.jsx
// Offline Mode — תור פעולות + Optimistic Updates + Network Status
//
// שילוב:
//   import { OfflineProvider, useOffline, useOptimisticMeals,
//            NetworkBanner } from './offline';
//
//   // בראש האפליקציה:
//   <OfflineProvider><App /></OfflineProvider>
//
//   // באנר רשת (בתוך header):
//   <NetworkBanner />
//
//   // במקום supabase.from('meal_logs').insert:
//   const { addMeal, meals } = useOptimisticMeals(clientId);
// ═══════════════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from './supabase';

/* ─── Context ─── */
const OfflineCtx = createContext({ isOnline: true, queueSize: 0 });
export const useOffline = () => useContext(OfflineCtx);

/* ─── Persistent Queue ─── */
const QUEUE_KEY = 'sappir-offline-queue';

function loadQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch { return []; }
}

function saveQueue(q) {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch {}
}

/* ─── Execute a queued action ─── */
async function executeAction(action) {
  const { type, table, payload, id } = action;
  try {
    if (type === 'insert') {
      await supabase.from(table).insert(payload);
    } else if (type === 'update') {
      await supabase.from(table).update(payload.data).eq('id', payload.id);
    } else if (type === 'delete') {
      await supabase.from(table).delete().eq('id', payload.id);
    }
    return true;
  } catch (e) {
    console.warn('[Offline] Failed to execute queued action:', e);
    return false;
  }
}

/* ─── Provider ─── */
export function OfflineProvider({ children }) {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [queue, setQueue]   = useState(loadQueue);
  const [flushing, setFlushing] = useState(false);
  const flushRef = useRef(false);

  // Network events
  useEffect(() => {
    const goOnline  = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Flush queue when online
  useEffect(() => {
    if (!isOnline || queue.length === 0 || flushRef.current) return;

    const flush = async () => {
      flushRef.current = true;
      setFlushing(true);
      const current = loadQueue();
      const remaining = [];

      for (const action of current) {
        const ok = await executeAction(action);
        if (!ok) remaining.push(action); // retry later
      }

      saveQueue(remaining);
      setQueue(remaining);
      setFlushing(false);
      flushRef.current = false;
    };

    flush();
  }, [isOnline]);

  const enqueue = useCallback((action) => {
    const entry = { ...action, _queuedAt: Date.now(), _id: Math.random().toString(36).slice(2) };
    setQueue(prev => {
      const next = [...prev, entry];
      saveQueue(next);
      return next;
    });
  }, []);

  return (
    <OfflineCtx.Provider value={{ isOnline, queueSize: queue.length, flushing, enqueue }}>
      {children}
    </OfflineCtx.Provider>
  );
}

/* ─── Network Banner ─── */
export function NetworkBanner() {
  const { isOnline, queueSize, flushing } = useOffline();
  const [show, setShow] = useState(false);
  const [justCameBack, setJustCameBack] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShow(true);
      setJustCameBack(false);
    } else if (show) {
      // was offline, now online
      setJustCameBack(true);
      setTimeout(() => { setShow(false); setJustCameBack(false); }, 3000);
    }
  }, [isOnline]);

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', top: 58, left: 0, right: 0, zIndex: 150,
      background: justCameBack ? 'var(--green-soft, #E0F2EB)' : 'var(--amber-soft, #FDF3D7)',
      borderBottom: `1px solid ${justCameBack ? 'var(--green, #6BAF8A)' : 'var(--amber, #E8B84B)'}`,
      padding: '8px 16px',
      display: 'flex', alignItems: 'center', gap: 8,
      direction: 'rtl', fontSize: 12, fontWeight: 600,
      color: justCameBack ? 'var(--green, #3D7A5E)' : '#7A5C1E',
      transition: 'all 0.3s',
    }}>
      <span style={{ fontSize: 16 }}>{justCameBack ? '✅' : '📵'}</span>
      <span>
        {justCameBack
          ? flushing
            ? `מסנכרן ${queueSize} פעולות...`
            : 'חזרת לאינטרנט! הנתונים עודכנו'
          : queueSize > 0
            ? `אין אינטרנט — ${queueSize} פעולות ממתינות`
            : 'אין אינטרנט — שינויים יישמרו כשתחזרי'}
      </span>
      {flushing && (
        <div style={{
          width: 14, height: 14, borderRadius: '50%',
          border: '2px solid var(--green, #6BAF8A)',
          borderTopColor: 'transparent',
          animation: 'networkSpin 0.8s linear infinite',
          marginRight: 'auto',
        }} />
      )}
      <style>{`@keyframes networkSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ─── Optimistic Meal Logging ─── */
export function useOptimisticMeals(clientId) {
  const { isOnline, enqueue } = useOffline();
  const [optimisticMeals, setOptimisticMeals] = useState([]);

  const addMealOptimistic = useCallback(async (mealData) => {
    const tempId = `temp_${Date.now()}`;
    const optimistic = {
      ...mealData,
      id: tempId,
      _pending: true,
      logged_at: new Date().toISOString(),
    };

    // הצג מיד
    setOptimisticMeals(prev => [...prev, optimistic]);

    if (!isOnline) {
      // שמור לתור
      enqueue({ type: 'insert', table: 'meal_logs', payload: { ...mealData, client_id: clientId } });
      return { data: optimistic, error: null, offline: true };
    }

    // שלח לשרת
    try {
      const { data, error } = await supabase
        .from('meal_logs')
        .insert({ ...mealData, client_id: clientId })
        .select()
        .single();

      if (error) throw error;

      // החלף temp ב-real
      setOptimisticMeals(prev => prev.filter(m => m.id !== tempId));
      return { data, error: null };
    } catch (err) {
      // ביטול optimistic
      setOptimisticMeals(prev => prev.filter(m => m.id !== tempId));
      // שמור לתור לניסיון מחדש
      enqueue({ type: 'insert', table: 'meal_logs', payload: { ...mealData, client_id: clientId } });
      return { data: null, error: err, queued: true };
    }
  }, [isOnline, clientId, enqueue]);

  const removeMealOptimistic = useCallback(async (id) => {
    setOptimisticMeals(prev => prev.filter(m => m.id !== id));

    if (!isOnline) {
      enqueue({ type: 'delete', table: 'meal_logs', payload: { id } });
      return;
    }
    await supabase.from('meal_logs').delete().eq('id', id);
  }, [isOnline, enqueue]);

  return { optimisticMeals, addMealOptimistic, removeMealOptimistic };
}

/* ─── Optimistic Weight Log ─── */
export function useOptimisticWeight(clientId) {
  const { isOnline, enqueue } = useOffline();

  const logWeightOptimistic = useCallback(async (weight) => {
    const payload = { client_id: clientId, weight: Number(weight), logged_at: new Date().toISOString() };

    if (!isOnline) {
      enqueue({ type: 'insert', table: 'weight_logs', payload });
      return { data: { ...payload, id: `temp_${Date.now()}` }, offline: true };
    }

    const { data, error } = await supabase.from('weight_logs').insert(payload).select().single();
    return { data, error };
  }, [isOnline, clientId, enqueue]);

  return { logWeightOptimistic };
}

/* ─── Optimistic Water Log ─── */
export function useOptimisticWater(clientId) {
  const { isOnline, enqueue } = useOffline();

  const addWaterOptimistic = useCallback(async (ml) => {
    const payload = { client_id: clientId, amount_ml: ml, logged_at: new Date().toISOString() };

    if (!isOnline) {
      enqueue({ type: 'insert', table: 'water_logs', payload });
      return { offline: true };
    }

    await supabase.from('water_logs').insert(payload);
    return {};
  }, [isOnline, clientId, enqueue]);

  return { addWaterOptimistic };
}

/* ─── Service Worker Registration (PWA) ─── */
export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // SW לא זמין — ממשיכים בלעדיו
    });
  });
}
