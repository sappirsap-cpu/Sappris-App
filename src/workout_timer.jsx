// ═══════════════════════════════════════════════════════════════
// src/workout_timer.jsx
// טיימר אימון: סטים, מנוחה אוטומטית, התראה כשנגמרת המנוחה
// זמני המנוחה נקבעים ע"י המאמנת בלבד.
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';

const COLORS = {
  bg: '#F5F2FA', primary: '#B19CD9', primaryDark: '#8B72B5',
  primarySoft: '#E8DFF5', mint: '#C5B3E0', peach: '#F5D0B5',
  text: '#2E2A3D', textMuted: '#756B85', border: '#DDD0EB',
  green: '#6B9B6B', red: '#C88A8A', amber: '#E8C96A',
};

const card = {
  background: 'white', border: `1px solid ${COLORS.border}`,
  borderRadius: 16, padding: 16,
};

/* ═══════════════════════════════════════════════════════════
   צליל סיום מנוחה (וויברציה + ביפ)
═══════════════════════════════════════════════════════════ */

function playEndSound() {
  try {
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

    // ביפ סינתטי דרך Web Audio API
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);

    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      osc2.connect(gain);
      osc2.frequency.value = 1000;
      osc2.start();
      osc2.stop(ctx.currentTime + 0.3);
    }, 300);
  } catch (e) { /* ignore */ }
}

/* ═══════════════════════════════════════════════════════════
   טיימר מנוחה — popup שעולה בסוף סט
═══════════════════════════════════════════════════════════ */

export function RestTimer({ seconds, onDone, onSkip }) {
  const [remaining, setRemaining] = useState(seconds);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          playEndSound();
          setTimeout(onDone, 500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [onDone]);

  const percent = ((seconds - remaining) / seconds) * 100;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(46,42,61,0.7)', backdropFilter: 'blur(8px)',
      zIndex: 250,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      direction: 'rtl', fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        background: 'white', borderRadius: 24, padding: 32,
        maxWidth: 320, width: '90%', textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: COLORS.primaryDark, letterSpacing: '1px' }}>
          ⏸️ מנוחה
        </p>

        {/* עיגול ספירה */}
        <div style={{ position: 'relative', width: 200, height: 200, margin: '20px auto' }}>
          <svg width={200} height={200} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={100} cy={100} r={90} fill="none" stroke={COLORS.primarySoft} strokeWidth={10} />
            <circle
              cx={100} cy={100} r={90}
              fill="none"
              stroke={remaining <= 5 ? COLORS.red : COLORS.primary}
              strokeWidth={10}
              strokeDasharray={`${(percent / 100) * 565} 565`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 1s linear' }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column',
          }}>
            <p style={{
              margin: 0, fontSize: 56, fontWeight: 800,
              color: remaining <= 5 ? COLORS.red : COLORS.text,
              lineHeight: 1,
              animation: remaining <= 5 ? 'pulse 0.5s infinite' : 'none',
            }}>
              {remaining}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: COLORS.textMuted }}>שניות</p>
          </div>
        </div>

        <button onClick={onSkip} style={{
          background: COLORS.primarySoft, color: COLORS.primaryDark,
          border: 'none', padding: '10px 24px', borderRadius: 999,
          fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          דלגי על מנוחה ⏭
        </button>

        <style>{`@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }`}</style>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   קומפוננטת אימון פעיל — רץ בזמן האימון
═══════════════════════════════════════════════════════════ */

export function ActiveWorkout({ workout, exercises, clientId, onClose, onComplete }) {
  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [setsDone, setSetsDone] = useState({});  // {exId: count}
  const [resting, setResting] = useState(null);  // seconds or null
  const [startedAt] = useState(Date.now());

  const ex = exercises[currentExIdx];
  if (!ex) return null;

  const completedSets = setsDone[ex.id] || 0;
  const totalSets = ex.sets || 3;

  const completeSet = () => {
    const newSetsDone = { ...setsDone, [ex.id]: completedSets + 1 };
    setSetsDone(newSetsDone);

    // אם הוא הסט האחרון של התרגיל — עבור לתרגיל הבא
    if (completedSets + 1 >= totalSets) {
      if (currentExIdx + 1 < exercises.length) {
        setTimeout(() => setCurrentExIdx(currentExIdx + 1), 600);
      } else {
        // האימון נגמר!
        finishWorkout(newSetsDone);
        return;
      }
    } else {
      // הצג טיימר מנוחה — מהמספר שהמאמנת הגדירה
      const restSec = ex.rest_seconds || 60;
      setResting(restSec);
    }
  };

  const finishWorkout = async (finalSetsDone) => {
    const durationSec = Math.round((Date.now() - startedAt) / 1000);
    const totalSets = Object.values(finalSetsDone).reduce((s, v) => s + v, 0);

    // שמור session ב-DB
    await supabase.from('workout_sessions').insert({
      client_id: clientId,
      workout_id: workout.id,
      started_at: new Date(startedAt).toISOString(),
      completed_at: new Date().toISOString(),
      total_duration_sec: durationSec,
      total_sets: totalSets,
      exercises_done: Object.entries(finalSetsDone).map(([exId, count]) => ({
        exercise_id: parseInt(exId), sets_completed: count,
      })),
    });

    onComplete && onComplete({ durationSec, totalSets });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: COLORS.bg,
      zIndex: 200, overflowY: 'auto', padding: 14,
      direction: 'rtl', fontFamily: 'system-ui, sans-serif',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <button onClick={onClose} style={{
          background: 'transparent', border: 'none', fontSize: 22,
          cursor: 'pointer', color: COLORS.textMuted,
        }}>✕</button>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: COLORS.primaryDark }}>
          {workout?.name || 'אימון'} · {currentExIdx + 1}/{exercises.length}
        </p>
        <div style={{ width: 22 }} />
      </div>

      {/* התקדמות אימון */}
      <div style={{
        height: 6, background: COLORS.primarySoft,
        borderRadius: 99, overflow: 'hidden', marginBottom: 16,
      }}>
        <div style={{
          height: '100%',
          width: `${((currentExIdx + completedSets / totalSets) / exercises.length) * 100}%`,
          background: COLORS.primary, transition: 'width 0.4s',
        }} />
      </div>

      {/* תרגיל נוכחי */}
      <div style={{ ...card, textAlign: 'center', padding: 24, marginBottom: 12 }}>
        <p style={{ margin: 0, fontSize: 11, color: COLORS.textMuted, letterSpacing: '0.5px' }}>
          תרגיל {currentExIdx + 1}
        </p>
        <h3 style={{ margin: '6px 0 14px', fontSize: 20, fontWeight: 800, color: COLORS.text }}>
          {ex.name}
        </h3>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
          marginBottom: 16,
        }}>
          <Stat icon="🔁" label="סטים" value={`${completedSets}/${totalSets}`} />
          <Stat icon="🎯" label="חזרות" value={ex.reps || '—'} />
          <Stat icon="⏱" label="מנוחה" value={`${ex.rest_seconds || 60}שנ׳`} />
        </div>

        {ex.notes && (
          <div style={{
            background: COLORS.primarySoft, padding: 10, borderRadius: 8,
            fontSize: 11, color: COLORS.text, marginBottom: 14,
            textAlign: 'right',
          }}>
            💡 {ex.notes}
          </div>
        )}

        <button onClick={completeSet} disabled={!!resting} style={{
          width: '100%', background: COLORS.primary, color: 'white',
          border: 'none', padding: '16px', borderRadius: 12,
          fontSize: 16, fontWeight: 700, cursor: resting ? 'default' : 'pointer',
          fontFamily: 'inherit', opacity: resting ? 0.5 : 1,
        }}>
          ✓ סיימתי סט {completedSets + 1}
        </button>
      </div>

      {/* רשימת תרגילים — לוקח את הבא */}
      {currentExIdx + 1 < exercises.length && (
        <div style={{ ...card, opacity: 0.7 }}>
          <p style={{ margin: 0, fontSize: 11, color: COLORS.textMuted }}>
            הבא בתור: <span style={{ fontWeight: 700, color: COLORS.text }}>
              {exercises[currentExIdx + 1].name}
            </span>
          </p>
        </div>
      )}

      {/* טיימר מנוחה */}
      {resting !== null && (
        <RestTimer
          seconds={resting}
          onDone={() => setResting(null)}
          onSkip={() => setResting(null)}
        />
      )}
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div style={{
      background: COLORS.bg, padding: 8, borderRadius: 8,
    }}>
      <div style={{ fontSize: 16 }}>{icon}</div>
      <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 800, color: COLORS.text }}>{value}</p>
      <p style={{ margin: '2px 0 0', fontSize: 9, color: COLORS.textMuted }}>{label}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   מסך סיום אימון
═══════════════════════════════════════════════════════════ */

export function WorkoutCompleteModal({ stats, onClose }) {
  const minutes = Math.floor((stats?.durationSec || 0) / 60);
  const seconds = (stats?.durationSec || 0) % 60;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(46,42,61,0.6)', backdropFilter: 'blur(8px)',
      zIndex: 250,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      direction: 'rtl', fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        background: `linear-gradient(145deg, white 0%, ${COLORS.primarySoft} 100%)`,
        borderRadius: 28, padding: 32,
        maxWidth: 340, width: '100%', textAlign: 'center',
        animation: 'popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>🎉</div>
        <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: COLORS.text }}>
          סיימת את האימון!
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: COLORS.textMuted }}>
          כל הכבוד! 💜
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
          <div style={{ background: 'white', padding: 12, borderRadius: 12 }}>
            <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: COLORS.primaryDark }}>
              {minutes}:{String(seconds).padStart(2, '0')}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 10, color: COLORS.textMuted }}>זמן כולל</p>
          </div>
          <div style={{ background: 'white', padding: 12, borderRadius: 12 }}>
            <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: COLORS.primaryDark }}>
              {stats?.totalSets || 0}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 10, color: COLORS.textMuted }}>סטים שהושלמו</p>
          </div>
        </div>

        <button onClick={onClose} style={{
          width: '100%', background: COLORS.primary, color: 'white',
          border: 'none', padding: 14, borderRadius: 12,
          fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          ✓ תודה!
        </button>

        <style>{`@keyframes popIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }`}</style>
      </div>
    </div>
  );
}
