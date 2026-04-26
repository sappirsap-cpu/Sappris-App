import React, { useState, useMemo, useEffect, useRef } from 'react';
import { supabase } from './supabase';
import { CoachClientWellness, CoachWeeklyOverview } from './wellness';
import { MealTemplateLibrary, WorkoutTemplateLibrary, saveMealTemplate, saveWorkoutTemplate, applyMealTemplate, applyWorkoutTemplate } from './templates';
import { InsightsScreen, generateWeeklyInsights } from './insights';
import { MessageTemplatePicker, exportClientCSV, archiveClient, ArchivedClientsList } from './coach_tools';
import { CoachChallengesManager } from './challenges';
import { ProgressPhotosGallery } from './progress_photos';
import { VoiceRecorderButton, VoiceMessagePlayer } from './voice_messages';
import { BroadcastsManager } from './voice_broadcasts';
import { ScheduleEditor } from './smart_reminders';
import { CoachFeedbackInsights, TriggerFeedbackButton } from './feedback';
import { CoachWorkoutBank, CoachMealPlanEditor } from './flexible_plans';

// ═══════════════════════════════════════════════════════════════
// 🌙 DARK MODE — CSS overrides for inline styles
// ═══════════════════════════════════════════════════════════════
if (typeof document !== 'undefined' && !document.getElementById('coach-dark-mode')) {
  const s = document.createElement('style');
  s.id = 'coach-dark-mode';
  s.textContent = `
    /* ============= DARK MODE (Coach) ============= */
    /* רק על coach-main ובתוכו - לא על login */
    [data-theme="dark"] .coach-main {
      background: #12101E !important;
      color: #EDE3F5 !important;
    }

    /* רקעים לבנים → כהים — רק בתוך coach-main */
    [data-theme="dark"] .coach-main [style*="background: white"],
    [data-theme="dark"] .coach-main [style*="background:white"],
    [data-theme="dark"] .coach-main [style*="background: '#fff'"],
    [data-theme="dark"] .coach-main [style*="background: #fff"],
    [data-theme="dark"] .coach-main [style*="background:#fff"],
    [data-theme="dark"] .coach-main [style*="background: #FFFFFF"],
    [data-theme="dark"] .coach-main [style*="background:#FFFFFF"],
    [data-theme="dark"] .coach-main [style*="background:'white'"] {
      background-color: #1E1A2E !important;
    }

    /* רקע עיקרי */
    [data-theme="dark"] .coach-main [style*="background: #F5F2FA"],
    [data-theme="dark"] .coach-main [style*="background:#F5F2FA"],
    [data-theme="dark"] .coach-main [style*="background: #F8F6FB"],
    [data-theme="dark"] .coach-main [style*="background:#F8F6FB"] {
      background-color: #12101E !important;
    }

    /* רקע סגול בהיר → סגול כהה */
    [data-theme="dark"] .coach-main [style*="background: #E8DFF5"],
    [data-theme="dark"] .coach-main [style*="background:#E8DFF5"],
    [data-theme="dark"] .coach-main [style*="background: #EDE3F5"],
    [data-theme="dark"] .coach-main [style*="background:#EDE3F5"],
    [data-theme="dark"] .coach-main [style*="background: #E0D4EB"],
    [data-theme="dark"] .coach-main [style*="background:#E0D4EB"] {
      background-color: #2D2645 !important;
    }

    /* טקסטים כהים → בהירים */
    [data-theme="dark"] .coach-main [style*="color: #2E2A3D"],
    [data-theme="dark"] .coach-main [style*="color:#2E2A3D"] {
      color: #F0E8FA !important;
    }
    [data-theme="dark"] .coach-main [style*="color: #756B85"],
    [data-theme="dark"] .coach-main [style*="color:#756B85"] {
      color: #B0A0C5 !important;
    }
    [data-theme="dark"] .coach-main [style*="color: #8B72B5"],
    [data-theme="dark"] .coach-main [style*="color:#8B72B5"] {
      color: #D4C2EC !important;
    }
    [data-theme="dark"] .coach-main [style*="color: #B19CD9"],
    [data-theme="dark"] .coach-main [style*="color:#B19CD9"] {
      color: #D8C5F0 !important;
    }
    [data-theme="dark"] .coach-main [style*="color: black"],
    [data-theme="dark"] .coach-main [style*="color:black"],
    [data-theme="dark"] .coach-main [style*="color: #000"],
    [data-theme="dark"] .coach-main [style*="color:#000"] {
      color: #F0E8FA !important;
    }
    [data-theme="dark"] .coach-main [style*="color: #9B9B9B"],
    [data-theme="dark"] .coach-main [style*="color:#9B9B9B"],
    [data-theme="dark"] .coach-main [style*="color: #666"],
    [data-theme="dark"] .coach-main [style*="color:#666"] {
      color: #B0A0C5 !important;
    }

    /* גבולות */
    [data-theme="dark"] .coach-main [style*="1px solid #DDD0EB"],
    [data-theme="dark"] .coach-main [style*="1px solid #E0D4EB"],
    [data-theme="dark"] .coach-main [style*="1px solid rgba(0,0,0,0.1)"],
    [data-theme="dark"] .coach-main [style*="1px solid #ECEAEC"] {
      border-color: #3D3560 !important;
    }
    [data-theme="dark"] .coach-main [style*="borderTop: 1px solid"] {
      border-top-color: #3D3560 !important;
    }
    [data-theme="dark"] .coach-main [style*="borderBottom: 1px solid"] {
      border-bottom-color: #3D3560 !important;
    }
    [data-theme="dark"] .coach-main [style*="borderLeft: 1px solid"] {
      border-left-color: #3D3560 !important;
    }
    [data-theme="dark"] .coach-main [style*="borderRight: 1px solid"] {
      border-right-color: #3D3560 !important;
    }

    /* Inputs בתוך coach-main בלבד */
    [data-theme="dark"] .coach-main input,
    [data-theme="dark"] .coach-main textarea,
    [data-theme="dark"] .coach-main select {
      background: #252235 !important;
      color: #F0E8FA !important;
      border-color: #3D3560 !important;
    }
    [data-theme="dark"] .coach-main input::placeholder,
    [data-theme="dark"] .coach-main textarea::placeholder {
      color: #7A6E92 !important;
    }
    [data-theme="dark"] .coach-main input:disabled {
      background: #1A1626 !important;
      color: #7A6E92 !important;
    }

    /* כפתורים primary - בהירים יותר */
    [data-theme="dark"] .coach-main [style*="background: #B19CD9"],
    [data-theme="dark"] .coach-main [style*="background:#B19CD9"] {
      background-color: #C5B3E0 !important;
      color: #1E1A2E !important;
    }
    [data-theme="dark"] .coach-main [style*="background: #8B72B5"],
    [data-theme="dark"] .coach-main [style*="background:#8B72B5"] {
      background-color: #A693C5 !important;
    }

    /* רקעי warning/error/success — ניטרליזציה */
    [data-theme="dark"] .coach-main [style*="background: #FADDDD"],
    [data-theme="dark"] .coach-main [style*="background:#FADDDD"] {
      background-color: #3A1F1F !important;
    }
    [data-theme="dark"] .coach-main [style*="background: #FDF3D7"],
    [data-theme="dark"] .coach-main [style*="background:#FDF3D7"] {
      background-color: #2E2510 !important;
    }
    [data-theme="dark"] .coach-main [style*="background: #E0F2EB"],
    [data-theme="dark"] .coach-main [style*="background:#E0F2EB"] {
      background-color: #1A3028 !important;
    }
  `;
  document.head.appendChild(s);
}

// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// 🎭 PAGE TRANSITIONS — מעבר מסכים חלק
// ═══════════════════════════════════════════════════════════════

// הוסף פעם אחת ל-<head> את ה-keyframes
if (typeof document !== 'undefined' && !document.getElementById('coach-transitions')) {
  const s = document.createElement('style');
  s.id = 'coach-transitions';
  s.textContent = `
    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(28px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes slideInUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeInScale {
      from { opacity: 0; transform: scale(0.97); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes tabFadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes shimmer {
      0%   { background-position: 200% center; }
      100% { background-position: -200% center; }
    }
    @keyframes toastIn {
      from { opacity: 0; transform: translateX(-50%) translateY(12px) scale(0.94); }
      to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
    }
    @keyframes toastOut {
      from { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
      to   { opacity: 0; transform: translateX(-50%) translateY(10px) scale(0.94); }
    }
    @keyframes springPress {
      0%   { transform: scale(1); }
      35%  { transform: scale(0.92); }
      65%  { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
    @keyframes pullSpin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(s);
}

/**
 * AnimatedScreen — עוטף כל sub-view / טאב לאנימציית כניסה
 * direction: 'right' | 'up' | 'fade'
 */
function AnimatedScreen({ children, direction = 'right', duration = 220 }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const anim = { right: 'slideInRight', up: 'slideInUp', fade: 'fadeInScale' }[direction] || 'slideInRight';
  return (
    <div style={{
      animation: mounted ? `${anim} ${duration}ms cubic-bezier(0.25,0.46,0.45,0.94) forwards` : 'none',
      opacity: mounted ? undefined : 0,
    }}>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 🍞 TOAST SYSTEM — הודעות עם סוגים וצבעים
// ═══════════════════════════════════════════════════════════════

const TOAST_TYPES = {
  success: { bg: '#E0F2EB', border: '#6BAF8A', icon: '✅', color: '#3D7A5E' },
  error:   { bg: '#FADDDD', border: '#C88A8A', icon: '❌', color: '#8B4040' },
  info:    { bg: '#E8DFF5', border: '#B19CD9', icon: '💜', color: '#8B72B5' },
  saved:   { bg: '#E8DFF5', border: '#B19CD9', icon: '💾', color: '#8B72B5' },
  sent:    { bg: '#E0F2EB', border: '#6BAF8A', icon: '📤', color: '#3D7A5E' },
  warning: { bg: '#FDF3D7', border: '#E8B84B', icon: '⚠️', color: '#7A5C1E' },
};

function detectToastType(msg) {
  if (!msg) return 'info';
  if (msg.startsWith('✅') || msg.startsWith('🎉') || msg.startsWith('🔥')) return 'success';
  if (msg.startsWith('❌'))  return 'error';
  if (msg.startsWith('⚠️')) return 'warning';
  if (msg.startsWith('💾') || msg.startsWith('📋')) return 'saved';
  if (msg.startsWith('📤') || msg.startsWith('💜') || msg.startsWith('💬')) return 'sent';
  return 'info';
}

function RichToast({ message, type, onDone }) {
  const [exiting, setExiting] = React.useState(false);
  const s = TOAST_TYPES[type] || TOAST_TYPES.info;
  React.useEffect(() => {
    const t1 = setTimeout(() => setExiting(true), 2200);
    const t2 = setTimeout(onDone, 2520);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  return (
    <div style={{
      position: 'fixed', bottom: 88, left: '50%',
      background: s.bg, border: `1px solid ${s.border}`,
      borderRadius: 999, padding: '10px 18px',
      display: 'flex', alignItems: 'center', gap: 8,
      boxShadow: '0 4px 20px rgba(0,0,0,0.14)',
      fontSize: 13, fontWeight: 600, color: s.color,
      whiteSpace: 'nowrap', zIndex: 200, direction: 'rtl',
      animation: exiting
        ? 'toastOut 0.32s ease forwards'
        : 'toastIn 0.36s cubic-bezier(0.34,1.56,0.64,1) forwards',
    }}>
      <span style={{ fontSize: 15 }}>{s.icon}</span>
      <span>{message}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 🌀 SPRING BUTTON
// ═══════════════════════════════════════════════════════════════

function SpringButton({ onClick, children, style = {}, haptic = 'light', disabled = false, ...rest }) {
  const [anim, setAnim] = React.useState(false);
  const handleClick = React.useCallback((e) => {
    if (disabled) return;
    try {
      const patterns = { light: [8], medium: [15], success: [8, 40, 8], error: [20, 30, 20] };
      navigator.vibrate?.(patterns[haptic] || [8]);
    } catch {}
    setAnim(true);
    setTimeout(() => setAnim(false), 400);
    onClick?.(e);
  }, [onClick, disabled, haptic]);
  return (
    <button {...rest} disabled={disabled} onClick={handleClick} style={{
      ...style,
      animation: anim ? 'springPress 0.38s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'none',
      opacity: disabled ? 0.5 : (style.opacity ?? 1),
      cursor: disabled ? 'default' : 'pointer',
    }}>
      {children}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
// 💀 SKELETON SCREENS
// ═══════════════════════════════════════════════════════════════

function Shimmer({ w = '100%', h = 14, r = 8, style = {} }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: 'linear-gradient(90deg,#EDE3F5 25%,#F5F2FA 50%,#EDE3F5 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.6s ease-in-out infinite', flexShrink: 0, ...style }} />;
}

function DashboardSkeleton() {
  return (
    <main style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ background: 'white', border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 14 }}>
            <Shimmer w="40%" h={22} r={6} style={{ margin: '0 auto 6px' }} />
            <Shimmer w="60%" h={10} r={5} style={{ margin: '0 auto' }} />
          </div>
        ))}
      </div>
      <div style={{ background: 'white', border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 14 }}>
        <Shimmer w="35%" h={13} r={6} style={{ marginBottom: 12 }} />
        {[0,1,2].map(i => (
          <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < 2 ? `1px solid ${COLORS.border}` : 'none' }}>
            <Shimmer w={20} h={20} r={10} />
            <div style={{ flex: 1 }}>
              <Shimmer w="70%" h={11} r={5} style={{ marginBottom: 4 }} />
              <Shimmer w="30%" h={9} r={4} />
            </div>
          </div>
        ))}
      </div>
      {[0,1,2].map(i => (
        <div key={i} style={{ background: 'white', border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 14 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
            <Shimmer w={40} h={40} r={20} />
            <div style={{ flex: 1 }}>
              <Shimmer w="55%" h={13} r={6} style={{ marginBottom: 6 }} />
              <Shimmer w="40%" h={10} r={5} />
            </div>
            <Shimmer w={32} h={32} r={8} />
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[0,1,2,3,4,5,6].map(j => <Shimmer key={j} w={32} h={18} r={4} />)}
          </div>
        </div>
      ))}
    </main>
  );
}

// ═══════════════════════════════════════════════════════════════
// ↓ PULL TO REFRESH
// ═══════════════════════════════════════════════════════════════

function usePullToRefresh(onRefresh, threshold = 65) {
  const [pulling, setPulling]       = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [progress, setProgress]     = React.useState(0);
  const startY = React.useRef(null);

  React.useEffect(() => {
    const onStart = (e) => {
      if ((window.scrollY || document.documentElement.scrollTop) > 5) return;
      startY.current = e.touches[0].clientY;
    };
    const onMove = (e) => {
      if (startY.current === null || refreshing) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta <= 0) { startY.current = null; return; }
      const pct = Math.min(delta / threshold, 1.3);
      setProgress(pct);
      if (pct > 0.15) setPulling(true);
    };
    const onEnd = async (e) => {
      if (startY.current === null) return;
      const delta = e.changedTouches[0].clientY - startY.current;
      startY.current = null;
      setPulling(false);
      setProgress(0);
      if (delta >= threshold && !refreshing) {
        try { navigator.vibrate?.([15]); } catch {}
        setRefreshing(true);
        try { await onRefresh(); } catch {}
        setRefreshing(false);
      }
    };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove',  onMove,  { passive: true });
    window.addEventListener('touchend',   onEnd,   { passive: true });
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove',  onMove);
      window.removeEventListener('touchend',   onEnd);
    };
  }, [onRefresh, refreshing, threshold]);

  return { pulling, refreshing, progress };
}

function PullIndicator({ pulling, refreshing, progress }) {
  if (!pulling && !refreshing) return null;
  const r = 11, circ = 2 * Math.PI * r;
  return (
    <div style={{ position: 'fixed', top: 66, left: '50%', transform: 'translateX(-50%)', zIndex: 50, background: 'white', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.14)', border: `1px solid ${COLORS.border}` }}>
      {refreshing ? (
        <svg width={24} height={24} viewBox="0 0 24 24" style={{ animation: 'pullSpin 0.8s linear infinite' }}>
          <circle cx={12} cy={12} r={r} fill="none" stroke={COLORS.primary} strokeWidth={2.2} strokeDasharray={`${circ * 0.75} ${circ * 0.25}`} />
        </svg>
      ) : (
        <svg width={24} height={24} viewBox="0 0 24 24">
          <circle cx={12} cy={12} r={r} fill="none" stroke={COLORS.border} strokeWidth={1.5} />
          <circle cx={12} cy={12} r={r} fill="none" stroke={COLORS.primary} strokeWidth={2.2}
            strokeDasharray={`${circ * Math.min(progress, 1)} ${circ}`}
            strokeLinecap="round" transform="rotate(-90 12 12)" />
        </svg>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════

// 📊 רישום אירועי פעילות לתובנות AI
async function logEvent(type, durationMs, metadata) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('activity_events').insert({
      user_id: user.id,
      user_role: 'coach',
      event_type: type,
      duration_ms: durationMs || null,
      metadata: metadata || null,
    });
  } catch (e) { /* fail silently */ }
}


/**
 * Coach-side mockup v4 — Sappir Barak.
 *
 * 5 improvements inspired by competitor analysis:
 *   1. "Logged today" live counter in dashboard stats
 *   2. Weekly heatmap per client (Sun–Sat colored boxes)
 *   3. Meal library filtered by meal type (breakfast/lunch/dinner/snack) + AI create button
 *   4. Workout library with summary cards (exercises count, days/week, total exercises)
 *   5. Bottom navigation bar (כללי / לקוחות / מנות / אימונים / הגדרות)
 */

const COLORS = {
  bg: '#F5F2FA',
  primary: '#B19CD9',
  primaryDark: '#8B72B5',
  primarySoft: '#E8DFF5',
  accent: '#F4C2C2',
  mint: '#C5B3E0',
  mintSoft: '#EDE3F5',
  peach: '#F5D0B5',
  peachSoft: '#FBE8D7',
  sky: '#A495C5',
  skySoft: '#E0D4EB',
  amber: '#E8C96A',
  amberSoft: '#F5EECD',
  red: '#E8A5A5',
  redSoft: '#FADDDD',
  text: '#2E2A3D',
  textMuted: '#756B85',
  border: '#DDD0EB',
};

const DAYS_HEB = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

const INITIAL_CLIENTS = [
  {
    id: 1, name: 'לירון כהן', weight: 68, target: 62, streak: 14, lastLog: 0, status: 'on-track', unread: 0, startWeight: 74,
    height: 165, age: 34, sex: 'female', activity: 'moderate', goal: 'lose',
    macroSplit: { carb: 50, protein: 25, fat: 25 },
    savedGoals: { kcal: 1800, carbG: 225, proteinG: 113, fatG: 50 },
    plan: 'מודרך',
    weekLog: ['logged', 'logged', 'logged', 'logged', 'logged', 'partial', 'none'],
    loggedToday: true,
  },
  {
    id: 2, name: 'מיכל לוי', weight: 74, target: 68, streak: 7, lastLog: 1, status: 'on-track', unread: 2, startWeight: 79,
    height: 170, age: 38, sex: 'female', activity: 'light', goal: 'lose',
    macroSplit: { carb: 45, protein: 30, fat: 25 },
    savedGoals: { kcal: 1750, carbG: 197, proteinG: 131, fatG: 49 },
    plan: 'מודרך',
    weekLog: ['logged', 'logged', 'missed', 'logged', 'logged', 'logged', 'none'],
    loggedToday: true,
  },
  {
    id: 3, name: 'יעל אברמוב', weight: 81, target: 72, streak: 0, lastLog: 4, status: 'at-risk', unread: 0, startWeight: 83,
    height: 168, age: 42, sex: 'female', activity: 'sedentary', goal: 'lose',
    macroSplit: { carb: 40, protein: 35, fat: 25 },
    savedGoals: null,
    plan: 'חופשי',
    weekLog: ['missed', 'missed', 'missed', 'missed', 'none', 'none', 'none'],
    loggedToday: false,
  },
  {
    id: 4, name: 'נועה שפירא', weight: 65, target: 63, streak: 28, lastLog: 0, status: 'on-track', unread: 0, startWeight: 71,
    height: 172, age: 29, sex: 'female', activity: 'very_active', goal: 'maintain',
    macroSplit: { carb: 50, protein: 25, fat: 25 },
    savedGoals: { kcal: 2100, carbG: 263, proteinG: 131, fatG: 58 },
    plan: 'מודרך',
    weekLog: ['logged', 'logged', 'logged', 'logged', 'logged', 'logged', 'none'],
    loggedToday: true,
  },
  {
    id: 5, name: 'רוני דהן', weight: 72, target: 65, streak: 0, lastLog: 6, status: 'inactive', unread: 1, startWeight: 75,
    height: 163, age: 45, sex: 'female', activity: 'light', goal: 'lose',
    macroSplit: { carb: 45, protein: 30, fat: 25 },
    savedGoals: null,
    plan: 'חופשי',
    weekLog: ['missed', 'none', 'none', 'none', 'none', 'none', 'none'],
    loggedToday: false,
  },
  {
    id: 6, name: 'שירה בן-דוד', weight: 69, target: 64, streak: 3, lastLog: 0, status: 'on-track', unread: 0, startWeight: 73,
    height: 167, age: 36, sex: 'female', activity: 'moderate', goal: 'lose',
    macroSplit: { carb: 50, protein: 25, fat: 25 },
    savedGoals: { kcal: 1850, carbG: 231, proteinG: 116, fatG: 51 },
    plan: 'מודרך',
    weekLog: ['logged', 'logged', 'logged', 'partial', 'none', 'none', 'none'],
    loggedToday: false,
  },
];

const MEAL_LIBRARY = [
  { id: 'm1', type: 'breakfast', name: 'שיבולת שועל עם בננה ושקדים', desc: 'פחמימות איטיות, מצוין לפני אימון', cal: 320, p: 12, c: 52, f: 8 },
  { id: 'm2', type: 'breakfast', name: 'יוגורט יווני עם גרנולה', desc: 'חלבון גבוה, קל ומשביע', cal: 280, p: 20, c: 30, f: 6 },
  { id: 'm3', type: 'breakfast', name: 'טוסט אבוקדו עם 2 ביצים', desc: 'שומנים בריאים + חלבון', cal: 380, p: 18, c: 28, f: 20 },
  { id: 'm4', type: 'breakfast', name: 'שייק חלבון', desc: 'סקופ אבקה, בננה, חלב שקדים', cal: 290, p: 28, c: 30, f: 5 },
  { id: 'm5', type: 'breakfast', name: 'קוטג׳ עם ירקות', desc: 'קוטג׳ 5% עם מלפפון ועגבנייה', cal: 180, p: 15, c: 8, f: 7 },
  { id: 'm6', type: 'lunch', name: 'חזה עוף עם אורז מלא', desc: 'ארוחה קלאסית לבניית שריר', cal: 520, p: 38, c: 55, f: 8 },
  { id: 'm7', type: 'lunch', name: 'סלט קינואה עם טונה', desc: 'עשיר בחלבון ובסיבים', cal: 450, p: 32, c: 40, f: 12 },
  { id: 'm8', type: 'lunch', name: 'סלמון עם בטטה', desc: 'אומגה 3 + פחמימות מורכבות', cal: 500, p: 30, c: 42, f: 18 },
  { id: 'm9', type: 'lunch', name: 'שווארמה הודו בפיתה', desc: 'גבוה בחלבון, משביע', cal: 480, p: 35, c: 45, f: 14 },
  { id: 'm10', type: 'lunch', name: 'קערת בודהא', desc: 'קינואה, חומוס, ירקות צלויים, טחינה', cal: 520, p: 18, c: 60, f: 20 },
  { id: 'm11', type: 'dinner', name: 'סלט ירקות עם חזה עוף', desc: 'קל וטעים לארוחת ערב', cal: 350, p: 30, c: 15, f: 18 },
  { id: 'm12', type: 'dinner', name: 'חביתת ירקות', desc: '3 ביצים עם פלפלים ופטריות', cal: 300, p: 22, c: 8, f: 20 },
  { id: 'm13', type: 'dinner', name: 'דג מושט עם ירקות', desc: 'קל, מלא חלבון', cal: 280, p: 28, c: 12, f: 10 },
  { id: 'm14', type: 'dinner', name: 'מרק עדשים', desc: 'חם, משביע, מלא סיבים', cal: 320, p: 18, c: 45, f: 4 },
  { id: 'm15', type: 'snack', name: 'שקדים (30g)', desc: 'שומנים בריאים, קריספי', cal: 170, p: 6, c: 6, f: 15 },
  { id: 'm16', type: 'snack', name: 'תפוח + חמאת בוטנים', desc: 'פחמ׳ + שומן — עוצר רעב', cal: 200, p: 5, c: 28, f: 9 },
  { id: 'm17', type: 'snack', name: 'פרוטאין בר', desc: 'נוח, 20g חלבון', cal: 220, p: 20, c: 25, f: 6 },
  { id: 'm18', type: 'snack', name: 'גזר + חומוס', desc: 'סיבים + חלבון צמחי', cal: 180, p: 8, c: 22, f: 7 },
];

const WORKOUT_LIBRARY = [
  { id: 'w1', name: 'Upper/Lower Split', desc: 'בסיסי ויעיל — 4 ימים בשבוע', days: 4, sessions: 4, exercises: 18 },
  { id: 'w2', name: 'גוף מלא 3x שבוע', desc: 'אימון גוף מלא לשלוש פעמים', days: 3, sessions: 3, exercises: 13 },
  { id: 'w3', name: 'פלג גוף עליון', desc: 'התמקדות בחזה, גב וכתפיים', days: 2, sessions: 2, exercises: 10 },
  { id: 'w4', name: 'רגליים וישבן', desc: 'סקוואט, היפ תראסט, לאנג׳', days: 2, sessions: 2, exercises: 8 },
];

/* פורמט זמן יחסי - "לפני שעה", "אתמול", "לפני 3 ימים" וכו' */
function formatRelativeTime(isoDate) {
  const now = new Date();
  const then = new Date(isoDate);
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);
  
  if (diffMin < 1) return 'עכשיו';
  if (diffMin < 60) return `לפני ${diffMin} דק׳`;
  
  const timeStr = then.toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'});
  
  if (diffHr < 24 && now.getDate() === then.getDate()) return `היום ${timeStr}`;
  if (diffDay === 1) return `אתמול ${timeStr}`;
  if (diffDay < 7) return `לפני ${diffDay} ימים`;
  
  return then.toLocaleDateString('he-IL', {day:'numeric', month:'numeric'});
}

/* 📄 ייצוא דוח לקוחה ל-PDF - פותח חלון הדפסה של הדפדפן */
function exportClientReport(client, weightSeries, recentLogs, progressPhotos) {
  const c = client;
  const today = new Date().toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
  const dropped = c.startWeight ? (c.startWeight - c.weight).toFixed(1) : '0';
  const toGo = (c.weight - c.target).toFixed(1);
  
  // גרף SVG
  const series = weightSeries && weightSeries.length > 0 ? weightSeries : [{date:'התחלה', w: c.startWeight || c.weight}, {date:'היום', w: c.weight}];
  const minW = Math.min(...series.map(p => p.w), c.target) - 1;
  const maxW = Math.max(...series.map(p => p.w)) + 1;
  const range = maxW - minW || 1;
  const W = 700, H = 250, pad = {t: 20, r: 30, b: 40, l: 50};
  const pW = W - pad.l - pad.r, pH = H - pad.t - pad.b;
  const xStep = series.length > 1 ? pW / (series.length - 1) : pW;
  const yFor = w => pad.t + pH - ((w - minW) / range) * pH;
  const pathD = series.map((p, i) => `${i === 0 ? 'M' : 'L'} ${pad.l + i * xStep} ${yFor(p.w)}`).join(' ');
  
  // יעדי תזונה
  const goals = c.savedGoals || {};
  
  // סטטיסטיקה על הרישומים
  const stats = { meals: 0, weights: 0, workouts: 0, water: 0 };
  (recentLogs || []).forEach(l => {
    if (l.type === '🥗') stats.meals++;
    else if (l.type === '⚖️') stats.weights++;
    else if (l.type === '🏋️') stats.workouts++;
    else if (l.type === '💧') stats.water++;
  });
  
  const html = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
<meta charset="UTF-8">
<title>דוח התקדמות - ${c.name}</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body {
    font-family: 'Rubik', 'Segoe UI', Tahoma, sans-serif;
    margin: 0; padding: 20px; color: #2E2A3D;
    direction: rtl; background: white;
    line-height: 1.5;
  }
  h1 { color: #8B72B5; font-size: 28px; margin: 0 0 8px; font-weight: 700; }
  h2 { color: #8B72B5; font-size: 18px; margin: 20px 0 10px; font-weight: 700;
       border-bottom: 2px solid #E8DFF5; padding-bottom: 6px; }
  .header {
    display: flex; justify-content: space-between; align-items: flex-start;
    border-bottom: 3px solid #B19CD9; padding-bottom: 16px; margin-bottom: 20px;
  }
  .header-left { flex: 1; }
  .header-right { text-align: left; font-size: 11px; color: #756B85; }
  .stats-grid {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 10px; margin: 14px 0;
  }
  .stat-box {
    background: #F5F2FA; border: 1px solid #DDD0EB;
    border-radius: 8px; padding: 12px; text-align: center;
  }
  .stat-value { font-size: 22px; font-weight: 700; color: #8B72B5; margin: 0; }
  .stat-label { font-size: 10px; color: #756B85; margin: 4px 0 0; }
  .macro-grid {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 8px; margin: 10px 0;
  }
  .macro-box {
    background: white; border: 1px solid #DDD0EB;
    border-radius: 6px; padding: 10px; text-align: center;
  }
  .macro-value { font-size: 16px; font-weight: 700; color: #2E2A3D; margin: 0; }
  .macro-label { font-size: 10px; color: #756B85; margin: 2px 0 0; }
  .log-list {
    list-style: none; padding: 0; margin: 0;
  }
  .log-item {
    display: flex; gap: 10px; padding: 8px 0;
    border-bottom: 1px solid #E8DFF5; font-size: 12px;
  }
  .log-icon { font-size: 16px; }
  .log-text { flex: 1; }
  .log-date { color: #756B85; font-size: 10px; }
  .photos-grid {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 8px; margin: 10px 0;
  }
  .photo-box {
    aspect-ratio: 3/4; border-radius: 8px; overflow: hidden;
    border: 1px solid #DDD0EB; position: relative;
    background: #F5F2FA;
  }
  .photo-box img { width: 100%; height: 100%; object-fit: cover; }
  .photo-date {
    position: absolute; bottom: 0; left: 0; right: 0;
    background: rgba(0,0,0,0.7); color: white;
    font-size: 9px; padding: 2px; text-align: center;
  }
  .footer {
    margin-top: 30px; padding-top: 16px; border-top: 1px solid #DDD0EB;
    text-align: center; font-size: 10px; color: #756B85;
  }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none; }
    h2 { page-break-after: avoid; }
    .photo-box, .stat-box { page-break-inside: avoid; }
  }
  .print-btn {
    position: fixed; bottom: 20px; left: 20px;
    background: #8B72B5; color: white; border: none;
    padding: 14px 24px; border-radius: 12px;
    font-size: 14px; font-weight: 700; cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 1000;
  }
</style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">
    📄 הדפס / שמור כ-PDF
  </button>
  
  <div class="header">
    <div class="header-left">
      <h1>🌸 דוח התקדמות אישי</h1>
      <p style="margin: 4px 0 0; font-size: 14px; color: #756B85;">${c.name}</p>
    </div>
    <div class="header-right">
      <p style="margin: 0;">תאריך: ${today}</p>
      <p style="margin: 4px 0 0;">מאמנת: ספיר ברק</p>
    </div>
  </div>
  
  <h2>📊 סיכום נתונים</h2>
  <div class="stats-grid">
    <div class="stat-box">
      <p class="stat-value">${c.weight}</p>
      <p class="stat-label">משקל נוכחי (ק״ג)</p>
    </div>
    <div class="stat-box">
      <p class="stat-value">${c.startWeight || '-'}</p>
      <p class="stat-label">משקל התחלתי (ק״ג)</p>
    </div>
    <div class="stat-box">
      <p class="stat-value" style="color: ${dropped > 0 ? '#4A7A5E' : '#2E2A3D'};">
        ${dropped > 0 ? '↓' : ''} ${Math.abs(dropped)}
      </p>
      <p class="stat-label">ירידה (ק״ג)</p>
    </div>
    <div class="stat-box">
      <p class="stat-value">${c.target}</p>
      <p class="stat-label">יעד (ק״ג)</p>
    </div>
  </div>
  
  ${goals.kcal ? `
  <h2>🎯 יעדי תזונה יומיים</h2>
  <div class="macro-grid">
    <div class="macro-box">
      <p class="macro-value">${goals.kcal}</p>
      <p class="macro-label">קלוריות</p>
    </div>
    <div class="macro-box">
      <p class="macro-value">${goals.proteinG}g</p>
      <p class="macro-label">חלבונים</p>
    </div>
    <div class="macro-box">
      <p class="macro-value">${goals.carbG}g</p>
      <p class="macro-label">פחמימות</p>
    </div>
    <div class="macro-box">
      <p class="macro-value">${goals.fatG}g</p>
      <p class="macro-label">שומנים</p>
    </div>
  </div>
  ` : ''}
  
  <h2>📉 גרף התקדמות משקל</h2>
  <div style="background: #F5F2FA; border-radius: 10px; padding: 16px;">
    <svg viewBox="0 0 ${W} ${H}" style="width: 100%; height: auto;">
      <line x1="${pad.l}" y1="${yFor(c.target)}" x2="${W - pad.r}" y2="${yFor(c.target)}" 
            stroke="#4A7A5E" stroke-dasharray="5 5" stroke-width="1.5"/>
      <text x="${W - pad.r - 4}" y="${yFor(c.target) - 6}" font-size="11" fill="#4A7A5E" text-anchor="end">
        יעד ${c.target} ק״ג
      </text>
      <path d="${pathD}" stroke="#8B72B5" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      ${series.map((p, i) => `
        <g>
          <circle cx="${pad.l + i * xStep}" cy="${yFor(p.w)}" r="5" fill="white" stroke="#8B72B5" stroke-width="2.5"/>
          <text x="${pad.l + i * xStep}" y="${yFor(p.w) - 10}" font-size="11" fill="#2E2A3D" text-anchor="middle" font-weight="700">
            ${p.w}
          </text>
          <text x="${pad.l + i * xStep}" y="${H - 12}" font-size="10" fill="#756B85" text-anchor="middle">
            ${p.date}
          </text>
        </g>
      `).join('')}
    </svg>
  </div>
  
  <h2>📋 סטטיסטיקת פעילות</h2>
  <div class="stats-grid">
    <div class="stat-box">
      <p class="stat-value">${stats.meals}</p>
      <p class="stat-label">ארוחות שנרשמו</p>
    </div>
    <div class="stat-box">
      <p class="stat-value">${stats.workouts}</p>
      <p class="stat-label">אימונים שהושלמו</p>
    </div>
    <div class="stat-box">
      <p class="stat-value">${stats.weights}</p>
      <p class="stat-label">עדכוני משקל</p>
    </div>
    <div class="stat-box">
      <p class="stat-value">${stats.water}</p>
      <p class="stat-label">רישומי שתייה</p>
    </div>
  </div>
  
  ${recentLogs && recentLogs.length > 0 ? `
  <h2>📝 רישומים אחרונים</h2>
  <ul class="log-list">
    ${recentLogs.slice(0, 15).map(l => `
      <li class="log-item">
        <span class="log-icon">${l.type}</span>
        <div class="log-text">
          <div>${l.text}</div>
          <div class="log-date">${l.date}</div>
        </div>
      </li>
    `).join('')}
  </ul>
  ` : ''}
  
  ${progressPhotos && progressPhotos.length > 0 ? `
  <h2>📸 תמונות התקדמות</h2>
  <div class="photos-grid">
    ${progressPhotos.slice(0, 8).map(p => `
      <div class="photo-box">
        <img src="${p.photo_url}" alt="${p.label || 'התקדמות'}" />
        <div class="photo-date">
          ${new Date(p.created_at).toLocaleDateString('he-IL', {day:'numeric', month:'numeric', year:'2-digit'})}
          ${p.label ? ' · ' + p.label : ''}
        </div>
      </div>
    `).join('')}
  </div>
  ` : ''}
  
  <div class="footer">
    <p style="margin: 0;">💜 דוח זה נוצר אוטומטית על ידי אפליקציית המעקב של ספיר ברק</p>
    <p style="margin: 4px 0 0;">${today}</p>
  </div>
  
  <script>
    // הצעה אוטומטית להדפסה אחרי שהדף נטען
    window.addEventListener('load', () => {
      setTimeout(() => {
        // רק מציג את הכפתור - המשתמש יוכל להדפיס בכל רגע
      }, 500);
    });
  </script>
</body>
</html>`;
  
  // פתח בחלון חדש
  const blob = new Blob([html], {type: 'text/html;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  
  // ניקוי זיכרון אחרי דקה
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

/* ========== MAIN APP ========== */

export default function App({ onLogout }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coachProfile, setCoachProfile] = useState(null);
  const [tab, setTab] = useState('dashboard');
  const [subView, setSubView] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [chatMessages, setChatMessages] = useState({}); // { clientId: [messages] }

  // טען נתונים מ-Supabase
  useEffect(() => {
    loadAll();
  }, []);

  // 🔔 Realtime - הודעות חדשות מלקוחות בזמן אמת
  useEffect(() => {
    let channel = null;
    
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel('coach-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `to_id=eq.${user.id}`,
          },
          (payload) => {
            const newMsg = payload.new;
            console.log('🔔 [Realtime] הודעה חדשה מלקוחה:', newMsg);
            
            // הוסף להתראות
            setNotifications(prev => [newMsg, ...prev]);
            
            // מצא את שם הלקוחה
            const client = clients.find(c => c.id === newMsg.from_id);
            const clientName = client?.firstName || client?.name || 'לקוחה';
            
            // הוסף לשיחה של הלקוחה
            setChatMessages(prev => ({
              ...prev,
              [newMsg.from_id]: [
                ...(prev[newMsg.from_id] || []),
                {
                  id: newMsg.id,
                  from: 'client',
                  text: newMsg.content,
                  time: new Date(newMsg.sent_at).toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'}),
                  read: false,
                }
              ]
            }));
            
            // הצג Toast
            setToast(`💬 ${clientName}: ${(newMsg.content || '').slice(0, 40)}${newMsg.content?.length > 40 ? '...' : ''}`);
            setTimeout(() => setToast(null), 4000);
            
            // רטט
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
          }
        )
        .subscribe();
    };
    
    setupRealtime();
    
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [clients]);

  const loadMessages = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // טען הודעות שמופנות למאמנת (מלקוחות אליה)
    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('to_id', user.id)
      .order('sent_at', { ascending: false });

    if (msgs) {
      const unread = msgs.filter(m => !m.read);
      setNotifications(unread);
      
      // ארגן הודעות לפי לקוחה
      const byClient = {};
      msgs.forEach(m => {
        if (!byClient[m.from_id]) byClient[m.from_id] = [];
        byClient[m.from_id].push({
          id: m.id,
          from: 'client',
          text: m.content,
          time: new Date(m.sent_at).toLocaleTimeString('he-IL', {hour:'2-digit',minute:'2-digit'}),
          read: m.read,
          message_type: m.message_type || 'text',
          audio_url: m.audio_url,
          audio_duration_sec: m.audio_duration_sec,
        });
      });

      // הוסף הודעות שספיר שלחה (כדי שיראה את השיחה המלאה)
      const { data: sentMsgs } = await supabase
        .from('messages')
        .select('*')
        .eq('from_id', user.id)
        .order('sent_at', { ascending: false });

      if (sentMsgs) {
        sentMsgs.forEach(m => {
          if (!byClient[m.to_id]) byClient[m.to_id] = [];
          byClient[m.to_id].push({
            id: m.id,
            from: 'coach',
            text: m.content,
            time: new Date(m.sent_at).toLocaleTimeString('he-IL', {hour:'2-digit',minute:'2-digit'}),
            read: true,
            message_type: m.message_type || 'text',
            audio_url: m.audio_url,
            audio_duration_sec: m.audio_duration_sec,
          });
        });
      }

      // מיין הודעות בכל שיחה לפי זמן
      Object.keys(byClient).forEach(id => {
        byClient[id].sort((a,b) => a.id > b.id ? 1 : -1);
      });

      setChatMessages(byClient);
    }
  };

  const loadAll = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // טען פרופיל מאמנת
      const { data: coaches } = await supabase.from('coaches').select('*').eq('id', user.id).limit(1);
      if (coaches?.[0]) setCoachProfile(coaches[0]);

      // טען לקוחות (לא מארכיון)
      const { data: clientsData } = await supabase
        .from('clients')
        .select('*')
        .eq('coach_id', user.id)
        .or('is_archived.is.null,is_archived.eq.false')
        .order('full_name');

      if (clientsData) {
        setClients(clientsData.map(c => ({
          id: c.id, name: c.full_name, email: c.email || '',
          weight: c.current_weight || c.start_weight || 0,
          target: c.target_weight || 0, streak: c.streak || 0,
          startWeight: c.start_weight || 0, height: c.height_cm || 0,
          age: Math.floor((new Date() - new Date(c.birth_date)) / 31557600000) || 30,
          sex: c.sex || 'female', activity: c.activity_level || 'moderate',
          goal: c.goal || 'lose',
          savedGoals: c.daily_calorie_goal ? {
            kcal: c.daily_calorie_goal, carbG: c.daily_carb_goal,
            proteinG: c.daily_protein_goal, fatG: c.daily_fat_goal
          } : null,
          plan: 'מודרך', weekLog: Array(7).fill('none'),
          loggedToday: false, lastLog: 0, status: 'on-track',
          unread: 0, macroSplit: { carb: 50, protein: 25, fat: 25 },
        })));
      }

      // טען הודעות בטעינה ראשונית
      await loadMessages();
    } catch (e) {
      console.error('loadAll error:', e);
    } finally {
      setLoading(false);
    }
  };

  const [toast, setToast] = useState(null); // { message, type }
  const showToast = React.useCallback((text, type) => {
    const resolvedType = type || detectToastType(text);
    try { navigator.vibrate?.(resolvedType === 'error' ? [20, 30, 20] : resolvedType === 'success' || resolvedType === 'saved' || resolvedType === 'sent' ? [8, 40, 8] : [8]); } catch {}
    setToast({ message: text, type: resolvedType, id: Date.now() });
    setTimeout(() => setToast(null), 2600);
  }, []);

  const markMessagesRead = async (clientId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('messages').update({ read: true })
      .eq('from_id', clientId).eq('to_id', user.id).eq('read', false);
    await loadMessages();
  };

  const openChatWith = (c) => {
    markMessagesRead(c.id);
    setSelectedClient(c); 
    setSubView('chat');
  };

  const sendMessageToClient = async (text, voice = null) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !selectedClient) return;
    if (!voice && !text?.trim()) return;
    await supabase.from('messages').insert({
      from_id: user.id,
      to_id: selectedClient.id,
      content: voice ? '🎙️ הודעה קולית' : text.trim(),
      message_type: voice ? 'voice' : 'text',
      audio_url: voice?.audio_url || null,
      audio_duration_sec: voice?.audio_duration_sec || null,
    });
    logEvent('message_sent', null, { to: selectedClient.id, type: voice ? 'voice' : 'text' });
    await loadMessages();
  };

  const updateClient = async (id, patch) => {
    // עדכן ב-Supabase
    const dbPatch = {};
    if ('weight' in patch) dbPatch.current_weight = patch.weight;
    if ('target' in patch) dbPatch.target_weight = patch.target;
    if ('savedGoals' in patch && patch.savedGoals) {
      dbPatch.daily_calorie_goal = patch.savedGoals.kcal;
      dbPatch.daily_carb_goal = patch.savedGoals.carbG;
      dbPatch.daily_protein_goal = patch.savedGoals.proteinG;
      dbPatch.daily_fat_goal = patch.savedGoals.fatG;
    }
    if ('email' in patch) dbPatch.email = patch.email;
    if ('name' in patch) dbPatch.full_name = patch.name;

    if (Object.keys(dbPatch).length > 0) {
      await supabase.from('clients').update(dbPatch).eq('id', id);
    }

    // עדכן בstate
    setClients((list) => list.map((c) => c.id === id ? { ...c, ...patch } : c));
    if (selectedClient?.id === id) setSelectedClient((s) => ({ ...s, ...patch }));
  };

  const openClient = (c) => { setSelectedClient(c); setSubView('clientProfile'); };
  const openMessage = (c) => { setSelectedClient(c); setSubView('message'); };
  const openMacro = (c) => { setSelectedClient(c); setSubView('macro'); };
  const goBack = () => { setSubView(null); setSelectedClient(null); };

  // Stats
  const loggedToday = clients.filter((c) => c.loggedToday).length;
  const needsAttention = clients.filter((c) => c.status !== 'on-track');
  const activeCount = clients.filter((c) => c.status === 'on-track').length;

  const { pulling, refreshing, progress: pullProgress } = usePullToRefresh(loadAll);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="coach-main" style={{ direction: 'rtl', fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif', background: 'var(--bg, ' + COLORS.bg + ')', minHeight: '100vh', paddingBottom: '72px', width: '100%', maxWidth: '900px', margin: '0 auto', position: 'relative', color: 'var(--text, ' + COLORS.text + ')' }}>

      <PullIndicator pulling={pulling} refreshing={refreshing} progress={pullProgress} />

      {/* Header */}
      <header style={{ background: 'white', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${COLORS.border}`, position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo.png" alt="Sappir Barak" style={{ width: '38px', height: '38px', objectFit: 'contain', borderRadius: '10px' }} />
          <div>
            <p style={{ fontSize: '11px', color: COLORS.textMuted, margin: 0 }}>בוקר טוב,</p>
            <h1 style={{ fontSize: '16px', fontWeight: 700, color: COLORS.primaryDark, margin: 0 }}>{coachProfile?.full_name?.split(' ')[0] || 'ספיר'} 💜</h1>
          </div>
        </div>
        <button onClick={() => setShowNotifs(s => !s)} style={{ background: COLORS.primarySoft, border: `1px solid ${COLORS.border}`, borderRadius: '10px', width: '40px', height: '40px', position: 'relative', cursor: 'pointer', fontSize: '18px', fontFamily: 'inherit' }}>
          🔔
          {notifications.length > 0 && (
            <span style={{ position: 'absolute', top: '-4px', left: '-4px', background: COLORS.red, color: 'white', fontSize: '10px', fontWeight: 700, borderRadius: '999px', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{notifications.length}</span>
          )}
        </button>
      </header>

      {/* Sub-views — כל אחד עטוף ב-AnimatedScreen */}
      {subView === 'clientProfile' && selectedClient && <AnimatedScreen direction="right"><ClientProfile client={selectedClient} onBack={goBack} onMessage={() => { markMessagesRead(selectedClient.id); setSubView('chat'); }} onEditGoals={() => setSubView('macro')} onEdit={() => setSubView('editClient')} onSchedule={() => setSubView('schedule')} onWorkoutSchedule={() => setSubView('workoutSchedule')} onProgress={() => setSubView('progress')} /></AnimatedScreen>}
      {subView === 'schedule' && selectedClient && (
        <AnimatedScreen direction="right">
          <CoachMealPlanEditor
            coachId={coachProfile?.id}
            clientId={selectedClient.id}
            clientName={selectedClient.name}
            onClose={() => { setSubView('clientProfile'); showToast('💾 התפריט נשמר'); }}
          />
        </AnimatedScreen>
      )}
      {subView === 'workoutSchedule' && selectedClient && (
        <AnimatedScreen direction="right">
          <CoachWorkoutBank
            coachId={coachProfile?.id}
            clientId={selectedClient.id}
            clientName={selectedClient.name}
            onClose={() => { setSubView('clientProfile'); showToast('💾 הבנק נשמר'); }}
          />
        </AnimatedScreen>
      )}
      {subView === 'progress' && selectedClient && <AnimatedScreen direction="right"><ClientProgress client={selectedClient} onBack={() => setSubView('clientProfile')} /></AnimatedScreen>}
      {subView === 'addClient' && <AnimatedScreen direction="up"><AddClientModal onBack={goBack} showToast={showToast} onCreated={() => { loadAll(); goBack(); }} /></AnimatedScreen>}
      {subView === 'editClient' && selectedClient && <AnimatedScreen direction="right"><EditClientDetails client={selectedClient} onBack={() => setSubView('clientProfile')} onSave={(patch) => { updateClient(selectedClient.id, patch); logEvent('client_updated', null, { client_id: selectedClient.id }); showToast(`💾 פרטים נשמרו`); setSubView('clientProfile'); }} /></AnimatedScreen>}
      {subView === 'macro' && selectedClient && <AnimatedScreen direction="right"><MacroCalc client={selectedClient} onBack={goBack} onSave={(patch) => { updateClient(selectedClient.id, patch); logEvent('macro_calculated', null, { client_id: selectedClient.id }); showToast(`💾 יעדים נשמרו ל${selectedClient.name.split(' ')[0]}`); goBack(); }} /></AnimatedScreen>}
      {subView === 'macroPicker' && <AnimatedScreen direction="up"><MacroClientPicker clients={clients} onBack={goBack} onPick={(c) => openMacro(c)} /></AnimatedScreen>}
      {subView === 'message' && selectedClient && <AnimatedScreen direction="up"><MessageCompose client={selectedClient} text={messageText} setText={setMessageText} onBack={goBack} onSend={() => showToast('💜 הודעה נשלחה')} /></AnimatedScreen>}
      {subView === 'newClient' && <AnimatedScreen direction="up"><AddClientModal onBack={goBack} showToast={showToast} onCreated={() => { loadAll(); goBack(); }} /></AnimatedScreen>}
      {subView === 'chat' && selectedClient && <AnimatedScreen direction="right"><CoachChat client={selectedClient} messages={chatMessages[selectedClient.id] || []} onBack={goBack} onSend={sendMessageToClient} coachId={coachProfile?.id} /></AnimatedScreen>}

      {/* Notifications dropdown */}
      {showNotifs && (
        <div style={{ position: 'fixed', top: 70, right: 16, background: 'white', border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 12, width: 280, maxHeight: 400, overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 100, direction: 'rtl' }}>
          <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: COLORS.primaryDark }}>🔔 התראות חדשות</h4>
          {notifications.length === 0 ? (
            <p style={{ fontSize: 12, color: COLORS.textMuted, textAlign: 'center', padding: 20, margin: 0 }}>אין התראות חדשות</p>
          ) : (
            notifications.map(n => {
              const client = clients.find(c => c.id === n.from_id);
              if (!client) return null;
              return (
                <div key={n.id} onClick={() => { setShowNotifs(false); openChatWith(client); }} 
                  style={{ padding: 10, background: COLORS.primarySoft, borderRadius: 10, marginBottom: 6, cursor: 'pointer' }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: COLORS.primaryDark }}>{client.name}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: COLORS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.content}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 10, color: COLORS.textMuted }}>{new Date(n.sent_at).toLocaleString('he-IL', {day:'numeric',month:'numeric',hour:'2-digit',minute:'2-digit'})}</p>
                </div>
              );
            })
          )}
        </div>
      )}
      {showNotifs && <div onClick={() => setShowNotifs(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />}

      {/* Tab content — כל טאב עטוף ב-AnimatedScreen */}
      {!subView && tab === 'dashboard' && (
        <AnimatedScreen key="dashboard" direction="fade">
          <DashboardTab
            clients={clients}
            coachProfile={coachProfile}
            loggedToday={loggedToday}
            activeCount={activeCount}
            needsAttention={needsAttention}
            onOpenClient={openClient}
            onOpenMessage={openMessage}
            onOpenMacro={() => setSubView('macroPicker')}
            onNewClient={() => setSubView('newClient')}
            showToast={showToast}
          />
        </AnimatedScreen>
      )}
      {!subView && tab === 'clients' && (
        <AnimatedScreen key="clients" direction="fade">
          <ClientsTab clients={clients} onOpenClient={openClient} onOpenMessage={openMessage} onNewClient={() => setSubView('newClient')} />
        </AnimatedScreen>
      )}
      {!subView && tab === 'meals' && <AnimatedScreen key="meals" direction="fade"><MealsTab showToast={showToast} /></AnimatedScreen>}
      {!subView && tab === 'workouts' && <AnimatedScreen key="workouts" direction="fade"><WorkoutsTab showToast={showToast} /></AnimatedScreen>}
      {!subView && tab === 'insights' && coachProfile?.id && (
        <AnimatedScreen key="insights" direction="fade">
          <main style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <InsightsScreen coachId={coachProfile.id} />
            <div style={{ height: 1, background: COLORS.border, margin: '8px 0' }} />
            <div>
              <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: COLORS.primaryDark }}>📝 משובי לקוחות</h3>
              <CoachFeedbackInsights coachId={coachProfile.id} />
            </div>
          </main>
        </AnimatedScreen>
      )}
      {!subView && tab === 'challenges' && coachProfile?.id && (
        <AnimatedScreen key="challenges" direction="fade">
          <main style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: COLORS.primaryDark }}>🏆 אתגרים</h2>
            <CoachChallengesManager coachId={coachProfile.id} />
            <div style={{ height: 1, background: COLORS.border, margin: '8px 0' }} />
            <BroadcastsManager coachId={coachProfile.id} />
          </main>
        </AnimatedScreen>
      )}
      {!subView && tab === 'settings' && <AnimatedScreen key="settings" direction="fade"><SettingsTab showToast={showToast} onLogout={onLogout} coachId={coachProfile?.id} /></AnimatedScreen>}

      {/* Toast — Rich version */}
      {toast && <RichToast key={toast.id} message={toast.message} type={toast.type} onDone={() => setToast(null)} />}

      {/* BOTTOM NAV — improvement #5 */}
      <BottomNav tab={tab} setTab={(t) => { setTab(t); setSubView(null); setSelectedClient(null); }} />
    </div>
  );
}

/* ===================== BOTTOM NAV ===================== */
function BottomNav({ tab, setTab }) {
  const tabs = [
    { id: 'dashboard', label: 'כללי', icon: 'dashboard' },
    { id: 'clients', label: 'לקוחות', icon: 'clients' },
    { id: 'challenges', label: 'אתגרים', icon: 'challenges' },
    { id: 'insights', label: 'תובנות', icon: 'insights' },
    { id: 'meals', label: 'תזונה', icon: 'food' },
    { id: 'workouts', label: 'אימונים', icon: 'workout' },
    { id: 'settings', label: 'הגדרות', icon: 'settings' },
  ];
  const [isWide, setIsWide] = React.useState(() => typeof window !== 'undefined' && window.innerWidth >= 768);
  const [collapsed, setCollapsed] = React.useState(() => {
    try { return localStorage.getItem('sappir-sidebar-collapsed') === '1'; } catch { return false; }
  });

  React.useEffect(() => {
    const onResize = () => setIsWide(window.innerWidth >= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem('sappir-sidebar-collapsed', next ? '1' : '0'); } catch {}
  };

  // ─── תפריט צד למסך רחב ───
  if (isWide) {
    const sidebarWidth = collapsed ? 60 : 200;
    return (
      <>
        <nav style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: sidebarWidth,
          background: 'var(--card, white)',
          borderLeft: `1px solid var(--border, ${COLORS.border})`,
          display: 'flex', flexDirection: 'column',
          padding: '14px 8px', gap: 4, zIndex: 30,
          transition: 'width 0.25s cubic-bezier(0.25,0.46,0.45,0.94)',
          boxShadow: '-2px 0 12px rgba(0,0,0,0.04)',
        }}>
          {/* Logo + collapse */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', padding: '8px 4px 14px', borderBottom: `1px solid var(--border, ${COLORS.border})`, marginBottom: 8 }}>
            {!collapsed && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <img src="/logo.png" alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'contain' }} />
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary-dark, ' + COLORS.primaryDark + ')' }}>Sappir Fit</span>
              </div>
            )}
            <button onClick={toggleCollapse} style={{
              background: 'var(--primary-soft, ' + COLORS.primarySoft + ')',
              border: 'none', borderRadius: 8, width: 28, height: 28,
              cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
              color: 'var(--primary-dark, ' + COLORS.primaryDark + ')',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {collapsed ? '◀' : '▶'}
            </button>
          </div>

          {tabs.map((t) => {
            const isActive = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} title={collapsed ? t.label : ''}
                style={{
                  background: isActive ? 'var(--primary-soft, ' + COLORS.primarySoft + ')' : 'transparent',
                  border: 'none', borderRadius: 10,
                  padding: collapsed ? '10px 0' : '10px 12px',
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  gap: 12,
                  transition: 'background 0.15s',
                  position: 'relative',
                }}>
                <CoachNavIcon name={t.icon} active={isActive} />
                {!collapsed && (
                  <span style={{
                    fontSize: 13,
                    color: isActive ? 'var(--primary-dark, ' + COLORS.primaryDark + ')' : 'var(--text, ' + COLORS.text + ')',
                    fontWeight: isActive ? 700 : 500,
                  }}>{t.label}</span>
                )}
                {isActive && (
                  <div style={{
                    position: 'absolute', right: -8, top: '50%',
                    transform: 'translateY(-50%)', width: 3, height: 22,
                    background: 'var(--primary, ' + COLORS.primary + ')', borderRadius: 4,
                  }} />
                )}
              </button>
            );
          })}
        </nav>
        {/* Spacer to push content from sidebar */}
        <style>{`
          @media (min-width: 768px) {
            body, #root { padding-right: ${sidebarWidth}px !important; transition: padding-right 0.25s; }
          }
        `}</style>
      </>
    );
  }

  // ─── תפריט תחתון למסך צר (מובייל) ───
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      maxWidth: '440px', margin: '0 auto',
      background: 'var(--nav-bg, white)',
      borderTop: `1px solid var(--border, ${COLORS.border})`,
      display: 'flex', justifyContent: 'space-around',
      padding: '8px 0 10px 0', zIndex: 25,
    }}>
      {tabs.map((t) => (
        <button key={t.id} onClick={() => setTab(t.id)}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '4px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', minWidth: '56px' }}>
          <CoachNavIcon name={t.icon} active={tab === t.id} />
          <span style={{ fontSize: '10px', color: tab === t.id ? 'var(--primary-dark, ' + COLORS.primaryDark + ')' : 'var(--text-muted, #9B9B9B)', fontWeight: tab === t.id ? 600 : 500 }}>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

/* ===================== NAV ICON ===================== */
function CoachNavIcon({ name, active }) {
  const color = active ? COLORS.primary : '#B0B0B0';
  const size = 22;
  
  const icons = {
    dashboard: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
      </svg>
    ),
    clients: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
      </svg>
    ),
    food: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/>
      </svg>
    ),
    workout: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"/>
      </svg>
    ),
    settings: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94 0 .31.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
      </svg>
    ),
    insights: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M12 2L9.5 8.5L3 9L8 13.5L6.5 20L12 16.5L17.5 20L16 13.5L21 9L14.5 8.5L12 2Z"/>
      </svg>
    ),
    challenges: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M5 9V3h14v6c0 3.31-2.69 6-6 6h-2c-3.31 0-6-2.69-6-6zm-2 0c0 4.42 3.58 8 8 8v3H7v2h10v-2h-4v-3c4.42 0 8-3.58 8-8V3a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6z"/>
      </svg>
    ),
  };
  
  return icons[name] || icons.dashboard;
}

/* ===================== DASHBOARD TAB ===================== */
function DashboardTab({ clients, coachProfile, loggedToday, activeCount, needsAttention, onOpenClient, onOpenMessage, onOpenMacro, onNewClient, showToast }) {
  const today = new Date();
  const dayStr = today.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <main style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <p style={{ fontSize: '13px', color: COLORS.textMuted, margin: 0, textAlign: 'right' }}>{dayStr}</p>

      {/* IMPROVEMENT #1 — "logged today" stat */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        <StatCard value={activeCount} label="פעילים" color={COLORS.primaryDark} />
        <StatCard value={loggedToday} label="רשמו היום" color={COLORS.mint} />
        <StatCard value={needsAttention.length} label="ממתינים" color={needsAttention.length > 0 ? COLORS.red : COLORS.textMuted} />
      </div>

      {/* 💜 סקירה שבועית של כל הלקוחות */}
      {coachProfile?.id && <CoachWeeklyOverview coachId={coachProfile.id} />}

      {/* 🔔 פיד פעילות אחרונה */}
      <ActivityFeed clients={clients} onOpenClient={onOpenClient} />

      {/* Attention banner */}
      {needsAttention.length > 0 && (
        <div style={{ background: COLORS.amberSoft, border: `1px solid ${COLORS.amber}`, borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#8B6914' }}>
            ⚠️ {needsAttention.length} לקוחות לא רשמו היום
          </span>
          <span style={{ fontSize: '18px' }}>←</span>
        </div>
      )}

      {/* Search */}
      <input placeholder="🔍 חיפוש לקוח..." style={inputStyle} />

      {/* Client filter chips */}
      <ClientFilterChips clients={clients} />

      {/* IMPROVEMENT #2 — Client cards with weekly heatmap */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {clients.map((c) => (
          <ClientCardWithWeek key={c.id} client={c} onOpen={() => onOpenClient(c)} onMessage={() => onOpenMessage(c)} />
        ))}
      </div>
    </main>
  );
}

function ClientFilterChips({ clients }) {
  const [filter, setFilter] = useState('all');
  const filters = [
    { id: 'all', label: `הכל ${clients.length}` },
    { id: 'active', label: `פעילים ${clients.filter(c => c.status === 'on-track').length}` },
    { id: 'attention', label: `ממתינים ${clients.filter(c => c.status !== 'on-track').length}` },
  ];
  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      {filters.map((f) => (
        <button key={f.id} onClick={() => setFilter(f.id)} style={{
          background: filter === f.id ? COLORS.primary : 'white',
          color: filter === f.id ? 'white' : COLORS.text,
          border: `1px solid ${filter === f.id ? COLORS.primary : COLORS.border}`,
          borderRadius: '999px', padding: '6px 14px', fontSize: '12px', fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>{f.label}</button>
      ))}
    </div>
  );
}

/* ===================== 🔔 ACTIVITY FEED ===================== */
function ActivityFeed({ clients, onOpenClient }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadActivity();

    // 🔄 עדכון אוטומטי בזמן אמת
    let channels = [];
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const clientIds = clients.map(c => c.id);
      if (clientIds.length === 0) return;

      // האזנה לטבלאות שונות
      const tables = ['meal_logs', 'weight_logs', 'workout_logs', 'water_logs'];
      tables.forEach(table => {
        const ch = supabase
          .channel(`activity-${table}`)
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: table,
          }, (payload) => {
            const data = payload.new;
            if (!clientIds.includes(data.client_id)) return;
            loadActivity(); // רענן את כל הפיד
          })
          .subscribe();
        channels.push(ch);
      });
    };

    setupRealtime();

    // רענון כל דקה למקרה שמשהו פספסנו
    const interval = setInterval(loadActivity, 60000);

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
      clearInterval(interval);
    };
  }, [clients.length]);

  const loadActivity = async () => {
    if (clients.length === 0) { setLoading(false); return; }
    const clientIds = clients.map(c => c.id);

    try {
      const [meals, weights, workouts, water] = await Promise.all([
        supabase.from('meal_logs').select('*').in('client_id', clientIds).order('logged_at', {ascending:false}).limit(20),
        supabase.from('weight_logs').select('*').in('client_id', clientIds).order('logged_at', {ascending:false}).limit(10),
        supabase.from('workout_logs').select('*').in('client_id', clientIds).order('logged_at', {ascending:false}).limit(10),
        supabase.from('water_logs').select('*').in('client_id', clientIds).order('logged_at', {ascending:false}).limit(10),
      ]);

      const all = [];
      const byClient = {};
      clients.forEach(c => { byClient[c.id] = c; });

      (meals.data || []).forEach(m => {
        const c = byClient[m.client_id];
        if (!c) return;
        all.push({
          id: 'meal-' + m.id,
          time: new Date(m.logged_at).getTime(),
          clientId: c.id,
          clientName: c.firstName || c.name,
          icon: '🥗',
          text: `${c.firstName || c.name} רשמה ${m.name} (${m.calories || 0} קק״ל)`,
          date: formatRelativeTime(m.logged_at),
        });
      });

      (weights.data || []).forEach(w => {
        const c = byClient[w.client_id];
        if (!c) return;
        all.push({
          id: 'weight-' + w.id,
          time: new Date(w.logged_at).getTime(),
          clientId: c.id,
          clientName: c.firstName || c.name,
          icon: '⚖️',
          text: `${c.firstName || c.name} עדכנה משקל: ${w.weight} ק״ג`,
          date: formatRelativeTime(w.logged_at),
        });
      });

      (workouts.data || []).forEach(w => {
        const c = byClient[w.client_id];
        if (!c) return;
        all.push({
          id: 'workout-' + w.id,
          time: new Date(w.logged_at).getTime(),
          clientId: c.id,
          clientName: c.firstName || c.name,
          icon: '🏋️',
          text: `${c.firstName || c.name} סיימה אימון`,
          date: formatRelativeTime(w.logged_at),
        });
      });

      all.sort((a, b) => b.time - a.time);
      setActivities(all.slice(0, 15));
    } catch (e) {
      console.error('ActivityFeed loadActivity error:', e);
    } finally {
      setLoading(false);
    }
  };

  const shown = expanded ? activities : activities.slice(0, 4);

  return (
    <section style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <h4 style={{ fontSize: 13, fontWeight: 700, margin: 0, color: COLORS.primaryDark }}>🔔 פעילות אחרונה</h4>
        {activities.length > 0 && <span style={{ fontSize: 10, color: COLORS.textMuted }}>🔄 בזמן אמת</span>}
      </div>
      
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 4px' }}>
              <Shimmer w={20} h={20} r={10} />
              <div style={{ flex: 1 }}>
                <Shimmer w="70%" h={11} r={5} style={{ marginBottom: 4 }} />
                <Shimmer w="30%" h={9} r={4} />
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <p style={{ textAlign: 'center', color: COLORS.textMuted, fontSize: 12, padding: 16, margin: 0 }}>
          אין עדיין פעילות. הלקוחות שלך טרם רשמו מידע באפליקציה.
        </p>
      ) : (
        <>
          {shown.map((a, i) => {
            const client = clients.find(c => c.id === a.clientId);
            return (
              <div
                key={a.id}
                onClick={() => client && onOpenClient(client)}
                style={{
                  display: 'flex', gap: 10, padding: '10px 4px',
                  borderBottom: i < shown.length - 1 ? `1px solid ${COLORS.border}` : 'none',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 18 }}>{a.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, color: COLORS.text, lineHeight: 1.4 }}>{a.text}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 10, color: COLORS.textMuted }}>{a.date}</p>
                </div>
              </div>
            );
          })}
          {activities.length > 4 && (
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                width: '100%', background: 'transparent', color: COLORS.primary,
                border: 'none', padding: '8px 0 0', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {expanded ? '▲ הצג פחות' : `▼ הצג עוד ${activities.length - 4}`}
            </button>
          )}
        </>
      )}
    </section>
  );
}

/* IMPROVEMENT #2 — Client card with weekly heatmap */
function ClientCardWithWeek({ client, onOpen, onMessage }) {
  const c = client;
  const weekColors = {
    logged: COLORS.primary,
    partial: COLORS.amber,
    missed: COLORS.red,
    none: '#E8E8E8',
  };

  return (
    <div onClick={onOpen} style={{ background: 'white', border: `1px solid ${COLORS.border}`, borderRadius: '14px', padding: '14px', cursor: 'pointer' }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <div style={avatarStyle}>{c.name.charAt(0)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: COLORS.text }}>{c.name}</p>
            {c.plan && <span style={{ background: COLORS.text, color: 'white', fontSize: '9px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px' }}>{c.plan}</span>}
            {c.unread > 0 && <span style={{ background: COLORS.red, color: 'white', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '999px' }}>{c.unread}</span>}
          </div>
          <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: COLORS.textMuted }}>
            {c.loggedToday ? '✅ רשמה היום' : `⏳ לפני ${c.lastLog} ימים`}
            {c.savedGoals ? ` · ${c.savedGoals.kcal} / ` : ''}
          </p>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onMessage(); }} style={{ background: COLORS.primarySoft, border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}>💬</button>
      </div>

      {/* Weekly heatmap — IMPROVEMENT #2 */}
      <div style={{ display: 'flex', gap: '4px', justifyContent: 'space-between' }}>
        {c.weekLog.map((status, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
            <div style={{
              width: '32px', height: '18px', borderRadius: '4px',
              background: weekColors[status],
              opacity: status === 'none' ? 0.4 : 1,
            }} />
            <span style={{ fontSize: '9px', color: COLORS.textMuted }}>{DAYS_HEB[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===================== CLIENTS TAB ===================== */
function ClientsTab({ clients, onOpenClient, onOpenMessage, onNewClient }) {
  const [search, setSearch] = useState('');
  const filtered = clients.filter((c) => c.name.includes(search.trim()));

  return (
    <main style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: COLORS.primaryDark }}>ניהול לקוחות</h2>
        <button onClick={onNewClient} style={{ background: COLORS.primary, color: 'white', border: 'none', padding: '8px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>+ לקוחה חדשה</button>
      </div>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 חיפוש..." style={inputStyle} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filtered.map((c) => (
          <div key={c.id} onClick={() => onOpenClient(c)} style={{ background: 'white', border: `1px solid ${COLORS.border}`, borderRadius: '14px', padding: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ ...avatarStyle, width: '44px', height: '44px', fontSize: '16px' }}>{c.name.charAt(0)}</div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: COLORS.text }}>{c.name}</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: COLORS.textMuted }}>
                <StatusBadge status={c.status} /> · {c.savedGoals ? `${c.savedGoals.kcal} קק״ל` : 'ללא יעד'}
              </p>
            </div>
            <span style={{ fontSize: '18px', color: COLORS.textMuted }}>←</span>
          </div>
        ))}
      </div>
    </main>
  );
}


/* ═══════════════════════════════════════════════════════════
   NUTRITION TAB — ספיר יוצרת ארוחות
═══════════════════════════════════════════════════════════ */
function MealsTab({ showToast }) {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [coachId, setCoachId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setCoachId(user.id);
      const { data } = await supabase
        .from('clients')
        .select('id, full_name')
        .eq('coach_id', user.id)
        .or('is_archived.is.null,is_archived.eq.false')
        .order('full_name');
      if (data) setClients(data);
    } catch (e) {
      console.error('MealsTab load error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main style={{ padding: 14 }}>
        <p style={{ textAlign: 'center', color: COLORS.textMuted }}>טוענת...</p>
      </main>
    );
  }

  // אם בחרה לקוחה — מציג את עורך התפריטים שלה
  if (selectedClient) {
    return (
      <CoachMealPlanEditor
        coachId={coachId}
        clientId={selectedClient.id}
        clientName={selectedClient.full_name}
        onClose={() => { setSelectedClient(null); showToast('💾 התפריט נשמר'); }}
      />
    );
  }

  // מסך בחירת לקוחה
  return (
    <main style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: COLORS.primaryDark }}>
          🍽️ תפריטי תזונה
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: COLORS.textMuted }}>
          בחרי לקוחה כדי לבנות לה תפריטים
        </p>
      </div>

      {clients.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 14, padding: 30, textAlign: 'center', border: `1px solid ${COLORS.border}` }}>
          <p style={{ fontSize: 24, margin: '0 0 8px' }}>👥</p>
          <p style={{ color: COLORS.textMuted, fontSize: 14, margin: 0 }}>
            עדיין אין לך לקוחות פעילות
          </p>
        </div>
      ) : (
        clients.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedClient(c)}
            style={{
              background: 'white',
              border: `1px solid ${COLORS.border}`,
              borderRadius: 14,
              padding: 14,
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: COLORS.text,
              textAlign: 'right',
            }}
          >
            <span>{c.full_name}</span>
            <span style={{ color: COLORS.primary, fontSize: 18 }}>←</span>
          </button>
        ))
      )}
    </main>
  );
}


/* ═══════════════════════════════════════════════════════════
   MEAL EDITOR — יצירת/עריכת ארוחה
═══════════════════════════════════════════════════════════ */
function MealEditor({ meal, onBack, showToast }) {
  const [name, setName] = useState(meal?.name || '');
  const [items, setItems] = useState(meal?.items || []);
  const [savedFoods, setSavedFoods] = useState([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingSavedFood, setEditingSavedFood] = useState(null);
  const searchTimer = useRef(null);

  const saveEditedFood = async () => {
    if (!editingSavedFood) return;
    const updated = {
      name: editingSavedFood.name,
      calories: parseFloat(editingSavedFood.calories) || 0,
      protein_g: parseFloat(editingSavedFood.protein_g) || 0,
      carbs_g: parseFloat(editingSavedFood.carbs_g) || 0,
      fat_g: parseFloat(editingSavedFood.fat_g) || 0,
    };
    await supabase.from('coach_foods').update(updated).eq('id', editingSavedFood.id);
    setSavedFoods(prev => prev.map(f => f.id === editingSavedFood.id ? {...f, ...updated} : f));
    setEditingSavedFood(null);
    showToast('💾 המאכל עודכן');
  };

  const deleteSavedFood = async (id) => {
    if (!confirm('למחוק את המאכל מהמאגר? זה לא ישפיע על הארוחות שכבר נשמרו איתו.')) return;
    await supabase.from('coach_foods').delete().eq('id', id);
    setSavedFoods(prev => prev.filter(f => f.id !== id));
    showToast('🗑️ נמחק');
  };

  useEffect(() => { loadSavedFoods(); }, []);

  const loadSavedFoods = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('coach_foods').select('*').eq('coach_id', user.id).order('created_at', { ascending: false });
    if (data) setSavedFoods(data);
  };

  // חיפוש ב-Open Food Facts
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (search.trim().length < 3) {
      setSearchResults([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(search)}&search_simple=1&action=process&json=1&page_size=8&fields=product_name,product_name_he,brands,nutriments`;
        const res = await fetch(url);
        const data = await res.json();
        const results = (data.products || [])
          .filter(p => (p.product_name_he || p.product_name) && p.nutriments?.['energy-kcal_100g'])
          .map(p => ({
            name: (p.product_name_he || p.product_name) + (p.brands ? ` (${p.brands.split(',')[0]})` : ''),
            cal: Math.round(p.nutriments['energy-kcal_100g'] || 0),
            p: Math.round((p.nutriments.proteins_100g || 0) * 10) / 10,
            c: Math.round((p.nutriments.carbohydrates_100g || 0) * 10) / 10,
            f: Math.round((p.nutriments.fat_100g || 0) * 10) / 10,
            icon: '🛒',
            source: 'off',
          }));
        setSearchResults(results);
      } catch(e) { console.error(e); }
      setSearching(false);
    }, 600);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  // חיפוש במאגר השמור
  const savedMatches = search.trim()
    ? savedFoods.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
    : savedFoods;

  // הוספת פריט לארוחה + שמירה למאגר אם לא קיים
  const addItemToMeal = async (food, quantity = 100) => {
    const qty = parseFloat(quantity) || 100;
    const r = qty / 100;
    
    const newItem = {
      name: food.name,
      quantity_g: qty,
      cal: food.cal * r,
      p: food.p * r,
      c: food.c * r,
      f: food.f * r,
      icon: food.icon || '🍽️',
    };
    
    setItems(prev => [...prev, newItem]);
    
    // שמור למאגר אם לא קיים (כדי שיופיע בחיפוש בפעם הבאה)
    if (food.source === 'off' || food.source === 'manual') {
      const { data: { user } } = await supabase.auth.getUser();
      const exists = savedFoods.find(sf => sf.name === food.name);
      if (!exists) {
        const { data } = await supabase.from('coach_foods').insert({
          coach_id: user.id,
          name: food.name,
          quantity_g: 100,
          calories: food.cal,
          protein_g: food.p,
          carbs_g: food.c,
          fat_g: food.f,
          icon: food.icon || '🍽️',
          source: food.source || 'manual',
        }).select();
        if (data?.[0]) setSavedFoods(prev => [data[0], ...prev]);
      }
    }
    
    setSearch('');
    setSearchResults([]);
    showToast(`✅ ${food.name} נוסף`);
  };

  const updateItemQuantity = (index, newQty) => {
    const qty = parseFloat(newQty) || 0;
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const origQty = item.quantity_g || 100;
      const r = qty / origQty;
      return {
        ...item,
        quantity_g: qty,
        cal: item.cal * r,
        p: item.p * r,
        c: item.c * r,
        f: item.f * r,
      };
    }));
  };

  const removeItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const totals = items.reduce((t, i) => ({
    cal: t.cal + (i.cal || 0),
    p: t.p + (i.p || 0),
    c: t.c + (i.c || 0),
    f: t.f + (i.f || 0),
  }), { cal: 0, p: 0, c: 0, f: 0 });

  const handleSave = async () => {
    if (!name.trim() || items.length === 0) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const mealData = {
      coach_id: user.id,
      name: name.trim(),
      items,
      total_calories: totals.cal,
      total_protein_g: totals.p,
      total_carbs_g: totals.c,
      total_fat_g: totals.f,
    };
    
    if (meal?.id) {
      await supabase.from('meals').update(mealData).eq('id', meal.id);
      logEvent('meal_updated', null, { meal_id: meal.id });
    } else {
      const { data: created } = await supabase.from('meals').insert(mealData).select().single();
      logEvent('meal_plan_created', null, { meal_id: created?.id, items_count: items.length });
    }
    
    setSaving(false);
    onBack();
  };

  return (
    <main style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <BackHeader onBack={onBack} title={meal?.id ? 'עריכת ארוחה' : 'ארוחה חדשה'} />

      <section style={cardStyle}>
        <Field label="שם הארוחה">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="לדוגמה: ארוחת בוקר פרוטאין" style={inputStyle} autoFocus={!meal?.id} />
        </Field>
      </section>

      {/* סיכום */}
      <section style={{ ...cardStyle, background: COLORS.primarySoft, border: `1px solid ${COLORS.primary}` }}>
        <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 700, color: COLORS.primaryDark }}>📊 סה״כ</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
          <div><p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: COLORS.text }}>{Math.round(totals.cal)}</p><p style={{ margin: 0, fontSize: 10, color: COLORS.textMuted }}>קק״ל</p></div>
          <div><p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: COLORS.sky }}>{Math.round(totals.p)}g</p><p style={{ margin: 0, fontSize: 10, color: COLORS.textMuted }}>חלבון</p></div>
          <div><p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: COLORS.primaryDark }}>{Math.round(totals.c)}g</p><p style={{ margin: 0, fontSize: 10, color: COLORS.textMuted }}>פחמ׳</p></div>
          <div><p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#C88968' }}>{Math.round(totals.f)}g</p><p style={{ margin: 0, fontSize: 10, color: COLORS.textMuted }}>שומן</p></div>
        </div>
      </section>

      {/* פריטים שנוספו */}
      {items.length > 0 && (
        <section style={cardStyle}>
          <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 700, color: COLORS.primaryDark }}>🍴 מאכלים בארוחה</p>
          {items.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, background: COLORS.bg, borderRadius: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                <p style={{ margin: '2px 0 0', fontSize: 10, color: COLORS.textMuted }}>
                  {Math.round(item.cal)} קק״ל · חלבון {Math.round(item.p)}g
                </p>
              </div>
              <input type="number" value={item.quantity_g} onChange={e => updateItemQuantity(idx, e.target.value)} style={{ width: 55, padding: 4, border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 11, textAlign: 'center', fontFamily: 'inherit' }} />
              <span style={{ fontSize: 10, color: COLORS.textMuted }}>g</span>
              <button onClick={() => removeItem(idx)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, color: '#C88A8A' }}>✕</button>
            </div>
          ))}
        </section>
      )}

      {/* הוסיפי מאכל */}
      <section style={cardStyle}>
        <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 700, color: COLORS.primaryDark }}>➕ הוסיפי מאכל</p>
        
        <input 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          placeholder="חפשי מזון או בחרי מהמאגר..." 
          style={{ ...inputStyle, marginBottom: 10 }} 
        />

        <button onClick={() => setShowManual(!showManual)} style={{ 
          width: '100%', background: showManual ? COLORS.primarySoft : 'white', 
          color: COLORS.text, border: `1px solid ${COLORS.border}`, 
          padding: 10, borderRadius: 10, fontSize: 12, fontWeight: 600, 
          cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10 
        }}>
          {showManual ? '✕ סגרי' : '✏️ הוספה ידנית'}
        </button>

        {showManual && (
          <ManualFoodInput onAdd={(f) => { addItemToMeal({...f, source: 'manual'}); setShowManual(false); }} />
        )}

        {/* מאגר שמור */}
        {savedMatches.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <p style={{ fontSize: 11, color: COLORS.textMuted, margin: '0 0 6px' }}>📚 מהמאגר שלך:</p>
            {savedMatches.slice(0, 8).map(f => (
              editingSavedFood?.id === f.id ? (
                <div key={f.id} style={{ padding: 10, background: COLORS.primarySoft, borderRadius: 8, marginBottom: 4 }}>
                  <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 600 }}>עריכת "{f.name}"</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 4, marginBottom: 6 }}>
                    <input value={editingSavedFood.name} onChange={e => setEditingSavedFood({...editingSavedFood, name: e.target.value})} style={inputStyle} />
                    <input type="number" value={editingSavedFood.calories} onChange={e => setEditingSavedFood({...editingSavedFood, calories: e.target.value})} placeholder="קק״ל" style={{ ...inputStyle, textAlign: 'center' }} />
                    <input type="number" value={editingSavedFood.protein_g} onChange={e => setEditingSavedFood({...editingSavedFood, protein_g: e.target.value})} placeholder="P" style={{ ...inputStyle, textAlign: 'center' }} />
                    <input type="number" value={editingSavedFood.carbs_g} onChange={e => setEditingSavedFood({...editingSavedFood, carbs_g: e.target.value})} placeholder="C" style={{ ...inputStyle, textAlign: 'center' }} />
                    <input type="number" value={editingSavedFood.fat_g} onChange={e => setEditingSavedFood({...editingSavedFood, fat_g: e.target.value})} placeholder="F" style={{ ...inputStyle, textAlign: 'center' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => saveEditedFood()} style={{ flex: 1, background: COLORS.primary, color: 'white', border: 'none', padding: 8, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>💾 שמרי</button>
                    <button onClick={() => setEditingSavedFood(null)} style={{ background: 'white', color: COLORS.text, border: `1px solid ${COLORS.border}`, padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>ביטול</button>
                  </div>
                </div>
              ) : (
                <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, background: COLORS.bg, borderRadius: 8, marginBottom: 4 }}>
                  <div onClick={() => addItemToMeal({
                    name: f.name, cal: f.calories, p: f.protein_g, c: f.carbs_g, f: f.fat_g, icon: f.icon
                  })} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0, cursor: 'pointer' }}>
                    <span style={{ fontSize: 16 }}>{f.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</p>
                      <p style={{ margin: 0, fontSize: 10, color: COLORS.textMuted }}>{Math.round(f.calories)} קק״ל / 100g</p>
                    </div>
                    <span style={{ fontSize: 16, color: COLORS.primary }}>+</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setEditingSavedFood({...f}); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14, padding: 4, color: COLORS.primary }} title="ערוך">✏️</button>
                  <button onClick={(e) => { e.stopPropagation(); deleteSavedFood(f.id); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14, padding: 4, color: '#C88A8A' }} title="מחקי">🗑️</button>
                </div>
              )
            ))}
          </div>
        )}

        {/* תוצאות Open Food Facts */}
        {search.trim().length >= 3 && (
          <div style={{ marginTop: 10 }}>
            <p style={{ fontSize: 11, color: COLORS.textMuted, margin: '0 0 6px' }}>🛒 מ-Open Food Facts:</p>
            {searching && <p style={{ fontSize: 11, color: COLORS.textMuted, textAlign: 'center' }}>מחפשת...</p>}
            {searchResults.map((f, i) => (
              <div key={i} onClick={() => addItemToMeal(f)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, background: COLORS.bg, borderRadius: 8, cursor: 'pointer', marginBottom: 4 }}>
                <span style={{ fontSize: 16 }}>{f.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</p>
                  <p style={{ margin: 0, fontSize: 10, color: COLORS.textMuted }}>{f.cal} קק״ל / 100g</p>
                </div>
                <span style={{ fontSize: 16, color: COLORS.primary }}>+</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <SpringButton onClick={handleSave} haptic="success" disabled={!name.trim() || items.length === 0 || saving} style={{
        width: '100%', background: COLORS.primary, color: 'white', border: 'none',
        padding: '14px', borderRadius: '12px', fontSize: '14px', fontWeight: 600,
        cursor: (name.trim() && items.length > 0 && !saving) ? 'pointer' : 'default',
        opacity: (name.trim() && items.length > 0 && !saving) ? 1 : 0.5, fontFamily: 'inherit',
      }}>
        {saving ? 'שומרת...' : '💾 שמרי ארוחה'}
      </SpringButton>

      {/* כפתור שמירה כתבנית גלובלית */}
      {meal?.id && (
        <button
          onClick={async () => {
            const totalCal = items.reduce((s, it) => s + (it.cal || 0), 0);
            const totalP = items.reduce((s, it) => s + (it.p || 0), 0);
            const totalC = items.reduce((s, it) => s + (it.c || 0), 0);
            const totalF = items.reduce((s, it) => s + (it.f || 0), 0);
            const desc = prompt('תיאור קצר לתבנית (אופציונלי):', '');
            const { data: { user } } = await supabase.auth.getUser();
            const { error } = await saveMealTemplate(user.id, {
              template_name: name,
              template_description: desc || '',
              meals: [{ key: 'main', name, items, cal: totalCal, p: totalP, c: totalC, f: totalF }],
            });
            if (error) showToast('❌ שגיאה: ' + error.message);
            else showToast('✨ נשמר בספריית התבניות');
          }}
          style={{
            width: '100%', background: 'white', color: COLORS.primaryDark,
            border: `1px solid ${COLORS.primary}`,
            padding: '12px', borderRadius: '12px', fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit', marginTop: 8,
          }}
        >
          ✨ שמרי גם בספריית התבניות הציבורית
        </button>
      )}
    </main>
  );
}

/* ═══════════════════════════════════════════════════════════
   MANUAL FOOD INPUT
═══════════════════════════════════════════════════════════ */
function ManualFoodInput({ onAdd }) {
  const [name, setName] = useState('');
  const [cal, setCal] = useState('');
  const [p, setP] = useState('');
  const [c, setC] = useState('');
  const [f, setF] = useState('');
  const [icon, setIcon] = useState('🍽️');

  const ICONS = ['🍽️', '🥗', '🍗', '🍎', '🥑', '🥛', '🥚', '🍞', '🥜', '🫐', '🍌', '🥕'];

  const submit = () => {
    if (!name.trim() || !cal) return;
    onAdd({
      name: name.trim(),
      cal: parseFloat(cal) || 0,
      p: parseFloat(p) || 0,
      c: parseFloat(c) || 0,
      f: parseFloat(f) || 0,
      icon,
    });
    setName(''); setCal(''); setP(''); setC(''); setF('');
  };

  return (
    <div style={{ padding: 10, background: COLORS.primarySoft, borderRadius: 10, marginBottom: 10 }}>
      <p style={{ margin: '0 0 8px', fontSize: 11, color: COLORS.textMuted }}>הזיני את הערכים ל-100g:</p>
      
      <div style={{ display: 'flex', gap: 4, marginBottom: 8, overflowX: 'auto' }}>
        {ICONS.map(ic => (
          <button key={ic} onClick={() => setIcon(ic)} style={{
            width: 34, height: 34, borderRadius: 8,
            border: `2px solid ${icon === ic ? COLORS.primary : COLORS.border}`,
            background: icon === ic ? 'white' : COLORS.bg,
            cursor: 'pointer', fontSize: 16, fontFamily: 'inherit', flexShrink: 0,
          }}>{ic}</button>
        ))}
      </div>

      <input value={name} onChange={e => setName(e.target.value)} placeholder="שם המאכל" style={{ ...inputStyle, marginBottom: 6 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 4, marginBottom: 8 }}>
        <input type="number" value={cal} onChange={e => setCal(e.target.value)} placeholder="קק״ל" style={{ ...inputStyle, textAlign: 'center', direction: 'ltr' }} />
        <input type="number" value={p} onChange={e => setP(e.target.value)} placeholder="חלבון" style={{ ...inputStyle, textAlign: 'center', direction: 'ltr' }} />
        <input type="number" value={c} onChange={e => setC(e.target.value)} placeholder="פחמ׳" style={{ ...inputStyle, textAlign: 'center', direction: 'ltr' }} />
        <input type="number" value={f} onChange={e => setF(e.target.value)} placeholder="שומן" style={{ ...inputStyle, textAlign: 'center', direction: 'ltr' }} />
      </div>
      <button onClick={submit} disabled={!name.trim() || !cal} style={{
        width: '100%', background: COLORS.primary, color: 'white', border: 'none',
        padding: 10, borderRadius: 8, fontSize: 12, fontWeight: 600,
        cursor: (name.trim() && cal) ? 'pointer' : 'default',
        opacity: (name.trim() && cal) ? 1 : 0.5, fontFamily: 'inherit',
      }}>
        + הוסיפי
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   WORKOUTS TAB — בנק אימונים לכל לקוחה
═══════════════════════════════════════════════════════════ */
function WorkoutsTab({ showToast }) {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [coachId, setCoachId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setCoachId(user.id);
      const { data } = await supabase
        .from('clients')
        .select('id, full_name')
        .eq('coach_id', user.id)
        .or('is_archived.is.null,is_archived.eq.false')
        .order('full_name');
      if (data) setClients(data);
    } catch (e) {
      console.error('WorkoutsTab load error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main style={{ padding: 14 }}>
        <p style={{ textAlign: 'center', color: COLORS.textMuted }}>טוענת...</p>
      </main>
    );
  }

  if (selectedClient) {
    return (
      <CoachWorkoutBank
        coachId={coachId}
        clientId={selectedClient.id}
        clientName={selectedClient.full_name}
        onClose={() => { setSelectedClient(null); showToast('💾 הבנק נשמר'); }}
      />
    );
  }

  return (
    <main style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: COLORS.primaryDark }}>
          🏋️ בנק אימונים
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: COLORS.textMuted }}>
          בחרי לקוחה כדי לבנות לה אימונים. היא תבחר מתי לעשות כל אימון.
        </p>
      </div>

      {clients.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 14, padding: 30, textAlign: 'center', border: `1px solid ${COLORS.border}` }}>
          <p style={{ fontSize: 24, margin: '0 0 8px' }}>👥</p>
          <p style={{ color: COLORS.textMuted, fontSize: 14, margin: 0 }}>
            עדיין אין לך לקוחות פעילות
          </p>
        </div>
      ) : (
        clients.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedClient(c)}
            style={{
              background: 'white',
              border: `1px solid ${COLORS.border}`,
              borderRadius: 14,
              padding: 14,
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: COLORS.text,
              textAlign: 'right',
            }}
          >
            <span>{c.full_name}</span>
            <span style={{ color: COLORS.primary, fontSize: 18 }}>←</span>
          </button>
        ))
      )}
    </main>
  );
}


/* ═══════════════════════════════════════════════════════════
   WORKOUT EDITOR
═══════════════════════════════════════════════════════════ */
function WorkoutEditor({ workout, onBack, showToast }) {
  const [name, setName] = useState(workout?.name || '');
  const [exercises, setExercises] = useState(workout?.exercises || []);
  const [savedExercises, setSavedExercises] = useState([]);
  const [search, setSearch] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadSaved(); }, []);

  const loadSaved = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('coach_exercises').select('*').eq('coach_id', user.id).order('created_at', { ascending: false });
    if (data) setSavedExercises(data);
  };

  const savedMatches = search.trim()
    ? savedExercises.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
    : savedExercises;

  const addExerciseToWorkout = async (ex) => {
    const newEx = {
      name: ex.name,
      sets: ex.sets || 3,
      reps: ex.reps || '10',
      weight: ex.weight_kg || ex.weight || null,
      rest: ex.rest_seconds || ex.rest || 60,
      icon: ex.icon || '💪',
      video_url: ex.video_url || null,
      notes: ex.notes || null,
    };
    setExercises(prev => [...prev, newEx]);
    
    // שמור למאגר אם חדש
    const { data: { user } } = await supabase.auth.getUser();
    const exists = savedExercises.find(se => se.name === ex.name);
    if (!exists && ex.name) {
      const { data } = await supabase.from('coach_exercises').insert({
        coach_id: user.id,
        name: ex.name,
        sets: newEx.sets,
        reps: newEx.reps,
        weight_kg: newEx.weight,
        rest_seconds: newEx.rest,
        icon: newEx.icon,
        video_url: newEx.video_url,
        notes: newEx.notes,
      }).select();
      if (data?.[0]) setSavedExercises(prev => [data[0], ...prev]);
    }
    
    setSearch('');
    showToast(`✅ ${ex.name} נוסף`);
  };

  const removeExercise = (idx) => {
    setExercises(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!name.trim() || exercises.length === 0) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const data = {
      coach_id: user.id,
      name: name.trim(),
      exercises,
    };
    if (workout?.id) {
      await supabase.from('workouts').update(data).eq('id', workout.id);
      logEvent('workout_updated', null, { workout_id: workout.id });
    } else {
      const { data: created } = await supabase.from('workouts').insert(data).select().single();
      logEvent('workout_assigned', null, { workout_id: created?.id, exercises_count: exercises.length });
    }
    setSaving(false);
    onBack();
  };

  return (
    <main style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <BackHeader onBack={onBack} title={workout?.id ? 'עריכת אימון' : 'אימון חדש'} />

      <section style={cardStyle}>
        <Field label="שם האימון">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="לדוגמה: אימון רגליים" style={inputStyle} autoFocus={!workout?.id} />
        </Field>
      </section>

      {/* תרגילים שנוספו */}
      {exercises.length > 0 && (
        <section style={cardStyle}>
          <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 700, color: COLORS.primaryDark }}>💪 תרגילים ({exercises.length})</p>
          {exercises.map((ex, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, background: COLORS.bg, borderRadius: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: COLORS.textMuted, minWidth: 18 }}>{idx + 1}.</span>
              <span style={{ fontSize: 20 }}>{ex.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.name}</p>
                <p style={{ margin: '2px 0 0', fontSize: 10, color: COLORS.textMuted }}>
                  {ex.sets}×{ex.reps}
                  {ex.weight ? ` · ${ex.weight}ק״ג` : ''}
                  {ex.video_url ? ' · 📺' : ''}
                </p>
              </div>
              <button onClick={() => removeExercise(idx)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, color: '#C88A8A' }}>✕</button>
            </div>
          ))}
        </section>
      )}

      {/* הוסיפי תרגיל */}
      <section style={cardStyle}>
        <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 700, color: COLORS.primaryDark }}>➕ הוסיפי תרגיל</p>
        
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="חפשי במאגר או הוסיפי חדש..." style={{ ...inputStyle, marginBottom: 10 }} />

        <button onClick={() => setShowManual(!showManual)} style={{
          width: '100%', background: showManual ? COLORS.primarySoft : 'white',
          color: COLORS.text, border: `1px solid ${COLORS.border}`,
          padding: 10, borderRadius: 10, fontSize: 12, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10,
        }}>
          {showManual ? '✕ סגרי' : '➕ תרגיל חדש'}
        </button>

        {showManual && (
          <ManualExerciseInput onAdd={(ex) => { addExerciseToWorkout(ex); setShowManual(false); }} />
        )}

        {/* מאגר שמור */}
        {savedMatches.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <p style={{ fontSize: 11, color: COLORS.textMuted, margin: '0 0 6px' }}>📚 מהמאגר שלך:</p>
            {savedMatches.slice(0, 10).map(ex => (
              <div key={ex.id} onClick={() => addExerciseToWorkout(ex)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, background: COLORS.bg, borderRadius: 8, cursor: 'pointer', marginBottom: 4 }}>
                <span style={{ fontSize: 18 }}>{ex.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600 }}>{ex.name}</p>
                  <p style={{ margin: 0, fontSize: 10, color: COLORS.textMuted }}>
                    {ex.sets}×{ex.reps}{ex.weight_kg ? ` · ${ex.weight_kg}ק״ג` : ''}{ex.video_url ? ' · 📺' : ''}
                  </p>
                </div>
                <span style={{ fontSize: 16, color: COLORS.primary }}>+</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <SpringButton onClick={handleSave} haptic="success" disabled={!name.trim() || exercises.length === 0 || saving} style={{
        width: '100%', background: COLORS.primary, color: 'white', border: 'none',
        padding: '14px', borderRadius: '12px', fontSize: '14px', fontWeight: 600,
        cursor: (name.trim() && exercises.length > 0 && !saving) ? 'pointer' : 'default',
        opacity: (name.trim() && exercises.length > 0 && !saving) ? 1 : 0.5, fontFamily: 'inherit',
      }}>
        {saving ? 'שומרת...' : '💾 שמרי אימון'}
      </SpringButton>
      {workout?.id && (
        <button
          onClick={async () => {
            const desc = prompt('תיאור קצר לתבנית (אופציונלי):', '');
            const focus = prompt('פוקוס הגוף: full_body / upper / lower / core / cardio', 'full_body');
            const difficulty = prompt('רמת קושי: beginner / intermediate / advanced', 'beginner');
            const duration = parseInt(prompt('משך משוער בדקות:', '30')) || 30;
            const { data: { user } } = await supabase.auth.getUser();
            const { error } = await saveWorkoutTemplate(user.id, {
              name,
              description: desc || '',
              difficulty: difficulty || 'beginner',
              duration_min: duration,
              body_focus: focus || 'full_body',
              exercises,
            });
            if (error) showToast('❌ שגיאה: ' + error.message);
            else showToast('✨ נשמר בספריית התבניות');
          }}
          style={{
            width: '100%', background: 'white', color: COLORS.primaryDark,
            border: `1px solid ${COLORS.primary}`,
            padding: '12px', borderRadius: '12px', fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit', marginTop: 8,
          }}
        >
          ✨ שמרי גם בספריית התבניות הציבורית
        </button>
      )}
    </main>
  );
}

/* ═══════════════════════════════════════════════════════════
   MANUAL EXERCISE INPUT
═══════════════════════════════════════════════════════════ */
function ManualExerciseInput({ onAdd }) {
  const [name, setName] = useState('');
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState('10');
  const [weight, setWeight] = useState('');
  const [rest, setRest] = useState(60);
  const [icon, setIcon] = useState('💪');
  const [videoUrl, setVideoUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const ICONS = ['💪', '🏋️‍♀️', '🏋️', '🦵', '🍑', '🚶‍♀️', '🧘‍♀️', '🤸‍♀️', '🚣', '📦', '🔥', '⚡'];

  // העלאת וידאו מהגלריה
  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // בדיקת גודל - מקסימום 50MB
    if (file.size > 50 * 1024 * 1024) {
      alert('הסרטון גדול מדי (מקסימום 50MB). נסי סרטון קצר יותר או העלי ליוטיוב.');
      return;
    }

    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploading(false); return; }

    // שם ייחודי
    const ext = file.name.split('.').pop() || 'mp4';
    const fileName = `${user.id}/exercise_${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from('exercise-videos')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (upErr) {
      console.error('Upload error:', upErr);
      alert('שגיאה בהעלאה: ' + upErr.message);
      setUploading(false);
      return;
    }

    // קבל URL ציבורי
    const { data: urlData } = supabase.storage.from('exercise-videos').getPublicUrl(fileName);
    setVideoUrl(urlData.publicUrl);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const submit = () => {
    if (!name.trim()) return;
    onAdd({
      name: name.trim(),
      sets: parseInt(sets) || 3,
      reps: reps.trim() || '10',
      weight: weight ? parseFloat(weight) : null,
      rest: parseInt(rest) || 60,
      icon,
      video_url: videoUrl.trim() || null,
      notes: notes.trim() || null,
    });
    setName(''); setWeight(''); setVideoUrl(''); setNotes('');
  };

  return (
    <div style={{ padding: 10, background: COLORS.primarySoft, borderRadius: 10, marginBottom: 10 }}>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="שם התרגיל" style={{ ...inputStyle, marginBottom: 6 }} />
      
      <div style={{ display: 'flex', gap: 4, marginBottom: 8, overflowX: 'auto' }}>
        {ICONS.map(ic => (
          <button key={ic} onClick={() => setIcon(ic)} style={{
            width: 34, height: 34, borderRadius: 8,
            border: `2px solid ${icon === ic ? COLORS.primary : COLORS.border}`,
            background: icon === ic ? 'white' : COLORS.bg,
            cursor: 'pointer', fontSize: 16, fontFamily: 'inherit', flexShrink: 0,
          }}>{ic}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
        <div>
          <label style={{ fontSize: 10, color: COLORS.textMuted, display: 'block', marginBottom: 2 }}>סטים</label>
          <input type="number" value={sets} onChange={e => setSets(e.target.value)} style={{ ...inputStyle, textAlign: 'center' }} />
        </div>
        <div>
          <label style={{ fontSize: 10, color: COLORS.textMuted, display: 'block', marginBottom: 2 }}>חזרות</label>
          <input value={reps} onChange={e => setReps(e.target.value)} style={{ ...inputStyle, textAlign: 'center' }} />
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
        <div>
          <label style={{ fontSize: 10, color: COLORS.textMuted, display: 'block', marginBottom: 2 }}>משקל (ק״ג)</label>
          <input type="number" step="0.5" value={weight} onChange={e => setWeight(e.target.value)} placeholder="20" style={{ ...inputStyle, textAlign: 'center' }} />
        </div>
        <div>
          <label style={{ fontSize: 10, color: COLORS.textMuted, display: 'block', marginBottom: 2 }}>מנוחה (שנ׳)</label>
          <input type="number" value={rest} onChange={e => setRest(e.target.value)} style={{ ...inputStyle, textAlign: 'center' }} />
        </div>
      </div>
      
      {/* 📹 העלאת סרטון */}
      <div style={{ marginBottom: 6 }}>
        <label style={{ fontSize: 10, color: COLORS.textMuted, display: 'block', marginBottom: 4 }}>📹 סרטון הדגמה (אופציונלי)</label>
        
        {videoUrl ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 8, background: 'white', borderRadius: 8, border: `1px solid ${COLORS.border}` }}>
            <span style={{ fontSize: 14 }}>✅</span>
            <span style={{ flex: 1, fontSize: 11, color: COLORS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {videoUrl.includes('youtube') || videoUrl.includes('youtu.be') ? '📺 סרטון יוטיוב' : '📹 סרטון שהועלה'}
            </span>
            <button onClick={() => setVideoUrl('')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, color: COLORS.accentDark }}>✕</button>
          </div>
        ) : (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              style={{ display: 'none' }}
            />
            <button 
              onClick={() => fileRef.current?.click()} 
              disabled={uploading}
              style={{
                width: '100%', background: uploading ? COLORS.primarySoft : 'white',
                color: COLORS.primaryDark, border: `1px solid ${COLORS.border}`,
                padding: 10, borderRadius: 8, fontSize: 12, fontWeight: 600,
                cursor: uploading ? 'default' : 'pointer', fontFamily: 'inherit',
                marginBottom: 4
              }}
            >
              {uploading ? '⏳ מעלה סרטון...' : '📹 העלי סרטון מהגלריה'}
            </button>
            <input 
              value={videoUrl} 
              onChange={e => setVideoUrl(e.target.value)} 
              placeholder="או הדביקי קישור ל-YouTube" 
              style={{ ...inputStyle, direction: 'ltr', fontSize: 11 }} 
            />
          </>
        )}
      </div>
      
      <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="הערות (אופציונלי)" style={{ ...inputStyle, marginBottom: 8 }} />
      
      <button onClick={submit} disabled={!name.trim() || uploading} style={{
        width: '100%', background: COLORS.primary, color: 'white', border: 'none',
        padding: 10, borderRadius: 8, fontSize: 12, fontWeight: 600,
        cursor: (name.trim() && !uploading) ? 'pointer' : 'default',
        opacity: (name.trim() && !uploading) ? 1 : 0.5, fontFamily: 'inherit',
      }}>
        + הוסיפי
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   WEEKLY SCHEDULE — שיוך לוח שבועי ללקוחה (תמיכה בבחירה מרובה)
═══════════════════════════════════════════════════════════ */
function WeeklySchedule({ client, onBack, showToast }) {
  // schedule = { 0: [{id, meal_id, workout_id}, ...], 1: [...], ... }
  const [schedule, setSchedule] = useState({});
  const [meals, setMeals] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDay, setEditDay] = useState(null);

  const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  useEffect(() => { loadData(); }, [client.id]);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [schedRes, mealsRes, workoutsRes] = await Promise.all([
      supabase.from('client_schedule').select('*').eq('client_id', client.id).order('order_index'),
      supabase.from('meals').select('id, name, total_calories').eq('coach_id', user.id).order('name'),
      supabase.from('workouts').select('id, name').eq('coach_id', user.id).order('name'),
    ]);

    // בנה מערך לכל יום
    const schedMap = {};
    (schedRes.data || []).forEach(s => {
      if (!schedMap[s.day_of_week]) schedMap[s.day_of_week] = [];
      schedMap[s.day_of_week].push(s);
    });
    setSchedule(schedMap);
    setMeals(mealsRes.data || []);
    setWorkouts(workoutsRes.data || []);
    setLoading(false);
  };

  // שמור את כל הבחירות של היום - מוחק את הישנות ומכניס חדשות
  const saveDay = async (day, selectedMealIds, selectedWorkoutIds) => {
    // מחק את כל הקיימים של היום
    await supabase.from('client_schedule').delete().eq('client_id', client.id).eq('day_of_week', day);
    
    const inserts = [];
    let orderIdx = 0;
    
    // כל שילוב של מנה ואימון הופך לשורה
    // לפי הלוגיקה: כל מנה היא שורה בפני עצמה, כל אימון גם
    selectedMealIds.forEach(mId => {
      inserts.push({
        client_id: client.id,
        day_of_week: day,
        meal_id: mId,
        workout_id: null,
        order_index: orderIdx++,
      });
    });
    
    selectedWorkoutIds.forEach(wId => {
      inserts.push({
        client_id: client.id,
        day_of_week: day,
        meal_id: null,
        workout_id: wId,
        order_index: orderIdx++,
      });
    });
    
    if (inserts.length > 0) {
      const { data } = await supabase.from('client_schedule').insert(inserts).select();
      if (data) setSchedule(prev => ({ ...prev, [day]: data }));
    } else {
      setSchedule(prev => ({ ...prev, [day]: [] }));
    }
    
    showToast('💾 נשמר');
    setEditDay(null);
  };

  if (loading) return (
    <main style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[0,1,2,3,4].map(i => (
        <div key={i} style={{ background: 'white', border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 14 }}>
          <Shimmer w="25%" h={13} r={6} style={{ marginBottom: 10 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <Shimmer h={36} r={8} style={{ flex: 1 }} />
            <Shimmer h={36} r={8} style={{ flex: 2 }} />
          </div>
        </div>
      ))}
    </main>
  );

  const getMealName = (id) => meals.find(m => m.id === id)?.name || 'ללא';
  const getWorkoutName = (id) => workouts.find(w => w.id === id)?.name || 'ללא';

  if (editDay !== null) {
    const daySched = schedule[editDay] || [];
    const selectedMealIds = daySched.filter(s => s.meal_id).map(s => s.meal_id);
    const selectedWorkoutIds = daySched.filter(s => s.workout_id).map(s => s.workout_id);
    
    return (
      <DayPicker
        dayName={DAYS[editDay]}
        meals={meals}
        workouts={workouts}
        initialMealIds={selectedMealIds}
        initialWorkoutIds={selectedWorkoutIds}
        onBack={() => setEditDay(null)}
        onSave={(mIds, wIds) => saveDay(editDay, mIds, wIds)}
      />
    );
  }

  return (
    <main style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <BackHeader onBack={onBack} title={`לוח שבועי: ${client.name.split(' ')[0]}`} />

      {(meals.length === 0 && workouts.length === 0) && (
        <div style={{ padding: 16, background: '#FFF4CC', border: '1px solid #F5D76E', borderRadius: 10, fontSize: 12, color: '#8B6914' }}>
          ⚠️ קודם צרי ארוחות ואימונים בלשוניות תזונה/אימונים
        </div>
      )}

      {DAYS.map((dayName, idx) => {
        const daySched = schedule[idx] || [];
        const mealNames = daySched.filter(s => s.meal_id).map(s => getMealName(s.meal_id));
        const workoutNames = daySched.filter(s => s.workout_id).map(s => getWorkoutName(s.workout_id));
        const hasContent = mealNames.length > 0 || workoutNames.length > 0;
        
        return (
          <div
            key={idx}
            onClick={() => setEditDay(idx)}
            style={{
              background: 'white',
              border: `1px solid ${hasContent ? COLORS.primary : COLORS.border}`,
              borderRadius: 12,
              padding: 14,
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: hasContent ? 8 : 0 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: COLORS.primaryDark }}>📅 יום {dayName}</p>
              <span style={{ fontSize: 11, color: COLORS.textMuted }}>{hasContent ? 'ערכי' : 'הגדרי'} ←</span>
            </div>
            {hasContent && (
              <div>
                {mealNames.length > 0 && <p style={{ margin: 0, fontSize: 11 }}>🍽️ <strong>ארוחות:</strong> {mealNames.join(' · ')}</p>}
                {workoutNames.length > 0 && <p style={{ margin: '4px 0 0', fontSize: 11 }}>💪 <strong>אימונים:</strong> {workoutNames.join(' · ')}</p>}
              </div>
            )}
          </div>
        );
      })}
    </main>
  );
}

/* ═══════════════════════════════════════════════════════════
   DAY PICKER — בחירה מרובה (checkboxes)
═══════════════════════════════════════════════════════════ */
function DayPicker({ dayName, meals, workouts, initialMealIds, initialWorkoutIds, onBack, onSave }) {
  const [mealIds, setMealIds] = useState(initialMealIds || []);
  const [workoutIds, setWorkoutIds] = useState(initialWorkoutIds || []);

  const toggleMeal = (id) => {
    setMealIds(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };
  const toggleWorkout = (id) => {
    setWorkoutIds(prev => prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]);
  };

  return (
    <main style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <BackHeader onBack={onBack} title={`יום ${dayName}`} />
      
      <div style={{ padding: 10, background: COLORS.primarySoft, borderRadius: 10, fontSize: 11, color: COLORS.primaryDark }}>
        💡 אפשר לבחור כמה ארוחות וכמה אימונים ליום אחד
      </div>
      
      <section style={cardStyle}>
        <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: COLORS.primaryDark }}>
          🍽️ ארוחות ({mealIds.length} נבחרו)
        </h4>
        {meals.length === 0 ? (
          <p style={{ textAlign: 'center', color: COLORS.textMuted, fontSize: 12, padding: 8 }}>אין ארוחות. צרי בלשונית "תזונה" למטה.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {meals.map(m => {
              const selected = mealIds.includes(m.id);
              return (
                <button key={m.id} onClick={() => toggleMeal(m.id)} style={{
                  background: selected ? COLORS.primary : COLORS.bg,
                  color: selected ? 'white' : COLORS.text,
                  border: `1px solid ${selected ? COLORS.primary : COLORS.border}`,
                  borderRadius: 10, padding: 12, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'right',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: 4,
                    border: `2px solid ${selected ? 'white' : COLORS.border}`,
                    background: selected ? 'white' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, color: COLORS.primary, fontWeight: 700, flexShrink: 0,
                  }}>{selected ? '✓' : ''}</span>
                  <span style={{ flex: 1 }}>{m.name} · {Math.round(m.total_calories || 0)} קק״ל</span>
                </button>
              );
            })}
          </div>
        )}
      </section>
      
      <section style={cardStyle}>
        <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: COLORS.primaryDark }}>
          💪 אימונים ({workoutIds.length} נבחרו)
        </h4>
        {workouts.length === 0 ? (
          <p style={{ textAlign: 'center', color: COLORS.textMuted, fontSize: 12, padding: 8 }}>אין אימונים. צרי בלשונית "אימונים" למטה.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {workouts.map(w => {
              const selected = workoutIds.includes(w.id);
              return (
                <button key={w.id} onClick={() => toggleWorkout(w.id)} style={{
                  background: selected ? COLORS.primary : COLORS.bg,
                  color: selected ? 'white' : COLORS.text,
                  border: `1px solid ${selected ? COLORS.primary : COLORS.border}`,
                  borderRadius: 10, padding: 12, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'right',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: 4,
                    border: `2px solid ${selected ? 'white' : COLORS.border}`,
                    background: selected ? 'white' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, color: COLORS.primary, fontWeight: 700, flexShrink: 0,
                  }}>{selected ? '✓' : ''}</span>
                  <span style={{ flex: 1 }}>{w.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>
      
      <button onClick={() => onSave(mealIds, workoutIds)} style={{
        width: '100%', background: COLORS.primary, color: 'white', border: 'none',
        padding: 14, borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
      }}>💾 שמרי לוח</button>
    </main>
  );
}


/* ===================== SETTINGS TAB ===================== */
function SettingsTab({ showToast, onLogout, coachId }) {
  const [showArchive, setShowArchive] = useState(false);
  const [isDark, setIsDark] = React.useState(
    () => document.documentElement.getAttribute('data-theme') === 'dark'
  );

  const toggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    try { localStorage.setItem('sappir-theme', next ? 'dark' : 'light'); } catch {}
  };

  return (
    <main style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: COLORS.primaryDark }}>הגדרות</h2>

      {/* 🌙 Dark Mode */}
      <section style={cardStyle}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px 0', color: COLORS.text }}>תצוגה</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: COLORS.text }}>{isDark ? '🌙 מצב כהה' : '☀️ מצב בהיר'}</p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: COLORS.textMuted }}>לחצי לשינוי מצב תצוגה</p>
          </div>
          <button onClick={toggleDark} style={{ width: 48, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer', background: isDark ? COLORS.primaryDark : COLORS.border, position: 'relative', transition: 'background 0.25s' }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, transition: 'left 0.25s cubic-bezier(0.34,1.56,0.64,1)', left: isDark ? 22 : 3 }} />
          </button>
        </div>
      </section>

      <section style={cardStyle}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px 0', color: COLORS.text }}>מיתוג</h3>
        <Field label="שם האפליקציה">
          <input defaultValue="Sappir Fit" style={inputStyle} />
        </Field>
        <Field label="כתובת URL ללוגו (אופציונלי)">
          <input defaultValue="https://yoursite.com/logo.png" style={inputStyle} />
        </Field>
        <Field label="צבע המותג">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: COLORS.primary, border: `1px solid ${COLORS.border}` }} />
            <input defaultValue="#B19CD9" style={{ ...inputStyle, direction: 'ltr', width: '120px' }} />
          </div>
        </Field>
        <button onClick={() => showToast('💾 הגדרות נשמרו')} style={primaryBtnStyle}>שמרי שינויים</button>
      </section>

      {/* 📦 ארכיון לקוחות */}
      <section style={cardStyle}>
        <button
          onClick={() => setShowArchive(!showArchive)}
          style={{
            width: '100%', background: 'transparent', border: 'none',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            cursor: 'pointer', padding: 0, fontFamily: 'inherit',
          }}
        >
          <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: COLORS.text }}>
            📦 ארכיון לקוחות
          </h3>
          <span style={{ fontSize: 18, color: COLORS.textMuted }}>{showArchive ? '▲' : '▼'}</span>
        </button>
        {showArchive && coachId && (
          <div style={{ marginTop: 14 }}>
            <ArchivedClientsList coachId={coachId} onUnarchive={() => showToast('✅ הוחזרה לפעילות')} />
          </div>
        )}
      </section>

      <section style={cardStyle}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 10px 0', color: COLORS.text }}>חשבון</h3>
        <button onClick={onLogout} style={{ width: '100%', background: 'white', color: '#C88A8A', border: '1px solid #E8A5A5', padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>🚪 התנתקי</button>
      </section>
    </main>
  );
}

/* ===================== SHARED COMPONENTS ===================== */

const inputStyle = { width: '100%', padding: '10px 12px', border: `1px solid ${COLORS.border}`, borderRadius: '10px', fontSize: '13px', outline: 'none', fontFamily: 'inherit', direction: 'rtl', boxSizing: 'border-box' };
const avatarStyle = { width: '40px', height: '40px', borderRadius: '50%', background: COLORS.primarySoft, color: COLORS.primaryDark, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, flexShrink: 0 };
const cardStyle = { background: 'white', border: `1px solid ${COLORS.border}`, borderRadius: '16px', padding: '16px' };
const primaryBtnStyle = { width: '100%', background: COLORS.primary, color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' };

function StatCard({ value, label, color }) {
  return (
    <div style={{ background: 'white', border: `1px solid ${COLORS.border}`, borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
      <p style={{ margin: 0, fontSize: '28px', fontWeight: 700, color, lineHeight: 1 }}>{value}</p>
      <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: COLORS.textMuted }}>{label}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = { 'on-track': 'פעיל', 'at-risk': 'ממתין', 'inactive': 'לא פעיל' };
  const colorMap = { 'on-track': COLORS.primary, 'at-risk': COLORS.amber, 'inactive': COLORS.red };
  return <span style={{ color: colorMap[status], fontWeight: 600 }}>{map[status]}</span>;
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <label style={{ fontSize: '12px', fontWeight: 600, color: COLORS.text, display: 'block', marginBottom: '6px' }}>{label}</label>
      {children}
    </div>
  );
}

function BackHeader({ onBack, title, subtitle, rightAction }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button onClick={onBack} style={{ background: 'white', border: `1px solid ${COLORS.border}`, borderRadius: '10px', width: '36px', height: '36px', cursor: 'pointer', fontSize: '16px', fontFamily: 'inherit' }}>←</button>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: COLORS.primaryDark, lineHeight: 1.2 }}>{title}</h2>
          {subtitle && <p style={{ fontSize: '11px', color: COLORS.textMuted, margin: '2px 0 0 0' }}>{subtitle}</p>}
        </div>
      </div>
      {rightAction}
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div>
      <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color, lineHeight: 1.1 }}>{value}</p>
      <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: COLORS.textMuted }}>{label}</p>
    </div>
  );
}

/* ===================== CLIENT PROFILE ===================== */
function ClientProfile({ client, onBack, onMessage, onEditGoals, onEdit, onSchedule, onProgress, onWorkoutSchedule }) {
  const [tab, setTab] = useState('overview');
  const [realWeights, setRealWeights] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [progressPhotos, setProgressPhotos] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const c = client;
  
  // טען משקלים אמיתיים מה-DB
  useEffect(() => {
    const loadWeights = async () => {
      const { data } = await supabase
        .from('weight_logs')
        .select('*')
        .eq('client_id', c.id)
        .order('logged_at', { ascending: true })
        .limit(20);
      
      if (data && data.length > 0) {
        setRealWeights(data.map(w => ({
          date: new Date(w.logged_at).toLocaleDateString('he-IL', {day:'numeric', month:'numeric'}),
          w: parseFloat(w.weight),
        })));
      }
    };
    
    // טען פעילות אחרונה מכל הטבלאות
    const loadRecentActivity = async () => {
      const [mealsRes, weightsRes, waterRes, workoutsRes] = await Promise.all([
        supabase.from('meal_logs').select('*').eq('client_id', c.id).order('logged_at', {ascending:false}).limit(10),
        supabase.from('weight_logs').select('*').eq('client_id', c.id).order('logged_at', {ascending:false}).limit(5),
        supabase.from('water_logs').select('amount_ml, logged_at').eq('client_id', c.id).order('logged_at', {ascending:false}).limit(5),
        supabase.from('workout_logs').select('*').eq('client_id', c.id).order('logged_at', {ascending:false}).limit(5),
      ]);
      
      const allLogs = [];
      
      (mealsRes.data || []).forEach(m => allLogs.push({
        time: new Date(m.logged_at).getTime(),
        date: formatRelativeTime(m.logged_at),
        type: '🥗',
        text: `${m.name} — ${m.calories || 0} קק״ל`,
      }));
      
      (weightsRes.data || []).forEach(w => allLogs.push({
        time: new Date(w.logged_at).getTime(),
        date: formatRelativeTime(w.logged_at),
        type: '⚖️',
        text: `משקל: ${w.weight} ק״ג`,
      }));
      
      (waterRes.data || []).forEach(w => allLogs.push({
        time: new Date(w.logged_at).getTime(),
        date: formatRelativeTime(w.logged_at),
        type: '💧',
        text: `שתייה: ${w.amount_ml} מ״ל`,
      }));
      
      (workoutsRes.data || []).forEach(w => allLogs.push({
        time: new Date(w.logged_at).getTime(),
        date: formatRelativeTime(w.logged_at),
        type: '🏋️',
        text: `אימון הושלם`,
      }));
      
      allLogs.sort((a,b) => b.time - a.time);
      setRecentLogs(allLogs.slice(0, 10));
    };
    
    // טען תמונות התקדמות
    const loadPhotos = async () => {
      const { data } = await supabase
        .from('progress_photos')
        .select('*')
        .eq('client_id', c.id)
        .order('created_at', {ascending:false})
        .limit(12);
      
      if (data) setProgressPhotos(data);
    };
    
    loadWeights();
    loadRecentActivity();
    loadPhotos();
  }, [c.id]);
  
  // מחיקת לקוחה
  const handleDeleteClient = async () => {
    setDeleting(true);
    try {
      // קרא ל-Edge Function שמוחקת גם מ-auth
      const { data: authData } = await supabase.auth.getSession();
      const token = authData?.session?.access_token;

      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/delete-client`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ clientId: c.id }),
        }
      );

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to delete');
      }
      
      // חזור למסך הקודם
      onBack();
    } catch (err) {
      alert('שגיאה במחיקה: ' + err.message);
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };
  
  // אם יש משקלים אמיתיים - השתמש בהם, אחרת הצג רק את הנוכחי
  const weightSeries = realWeights.length > 0 ? realWeights : [
    { date: 'התחלה', w: c.startWeight || c.weight },
    { date: 'היום', w: c.weight },
  ];
  const minW = Math.min(...weightSeries.map(p => p.w), c.target) - 1;
  const maxW = Math.max(...weightSeries.map(p => p.w)) + 1;
  const range = maxW - minW;
  const chartW = 380, chartH = 140;
  const pad = { top: 20, right: 12, bottom: 24, left: 32 };
  const plotW = chartW - pad.left - pad.right, plotH = chartH - pad.top - pad.bottom;
  const xStep = weightSeries.length > 1 ? plotW / (weightSeries.length - 1) : plotW;
  const yFor = (w) => pad.top + plotH - ((w - minW) / range) * plotH;
  const pathD = weightSeries.map((p, i) => `${i === 0 ? 'M' : 'L'} ${pad.left + i * xStep} ${yFor(p.w)}`).join(' ');
  const targetY = yFor(c.target);
  const dropped = (c.startWeight - c.weight).toFixed(1);
  const toGo = (c.weight - c.target).toFixed(1);

  return (
    <main style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <BackHeader onBack={onBack} title={c.name} rightAction={
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={onEdit} style={{ background: COLORS.primarySoft, color: COLORS.primaryDark, border: `1px solid ${COLORS.border}`, padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>✏️ ערוך</button>
          <button onClick={onMessage} style={{ background: COLORS.primary, color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>💬 הודעה</button>
        </div>
      } />
      
      {/* Action buttons - תוכנית גמישה */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
        <button onClick={onWorkoutSchedule} style={{ background: COLORS.primary, color: 'white', border: 'none', padding: '12px 6px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '22px' }}>🏋️</span>
          בנק אימונים
        </button>
        <button onClick={onSchedule} style={{ background: COLORS.primary, color: 'white', border: 'none', padding: '12px 6px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '22px' }}>🍽️</span>
          תפריטי תזונה
        </button>
      </div>

      <button onClick={onProgress} style={{ width: '100%', background: 'white', color: COLORS.primaryDark, border: `1px solid ${COLORS.border}`, padding: '12px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>📊</span>
        התקדמות ומדדים
      </button>

      {/* 📝 שלחי טופס משוב */}
      {client.coach_id && (
        <TriggerFeedbackButton
          coachId={client.coach_id}
          clientId={c.id}
          weeksActive={Math.floor((new Date() - new Date(client.created_at || Date.now())) / (7 * 86400000))}
        />
      )}

      {/* 📄 כפתור ייצוא דוח */}
      <button onClick={() => exportClientReport(c, weightSeries, recentLogs, progressPhotos)} style={{
        width: '100%', background: 'white', color: COLORS.primaryDark,
        border: `1px solid ${COLORS.border}`, padding: '10px',
        borderRadius: '10px', fontSize: '13px', fontWeight: 600,
        cursor: 'pointer', fontFamily: 'inherit', marginBottom: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 16 }}>📄</span>
        ייצא דוח התקדמות
      </button>

      {/* Dialog אישור מחיקה */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }} onClick={() => !deleting && setShowDeleteConfirm(false)}>
          <div style={{
            background: 'white', borderRadius: '16px', padding: '24px',
            maxWidth: '400px', width: '100%',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚠️</div>
              <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: '#C62828' }}>
                מחיקת לקוחה
              </h3>
              <p style={{ margin: 0, fontSize: '14px', color: COLORS.text, lineHeight: 1.6 }}>
                האם את בטוחה שברצונך למחוק את <strong>{c.name}</strong>?
              </p>
              <p style={{ margin: '12px 0 0', fontSize: '12px', color: COLORS.textMuted, lineHeight: 1.5 }}>
                פעולה זו תמחק לצמיתות את כל הנתונים שלה: משקל, ארוחות, אימונים, תמונות והודעות.
                <br/><strong>לא ניתן לשחזר את המידע!</strong>
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                style={{
                  background: 'white', color: COLORS.text,
                  border: `1px solid ${COLORS.border}`, padding: '12px',
                  borderRadius: '10px', fontSize: '14px', fontWeight: 600,
                  cursor: deleting ? 'default' : 'pointer',
                  fontFamily: 'inherit', opacity: deleting ? 0.5 : 1,
                }}
              >
                ביטול
              </button>
              <button 
                onClick={handleDeleteClient}
                disabled={deleting}
                style={{
                  background: '#C62828', color: 'white',
                  border: 'none', padding: '12px',
                  borderRadius: '10px', fontSize: '14px', fontWeight: 600,
                  cursor: deleting ? 'default' : 'pointer',
                  fontFamily: 'inherit', opacity: deleting ? 0.5 : 1,
                }}
              >
                {deleting ? 'מוחק...' : 'מחק לצמיתות'}
              </button>
            </div>
          </div>
        </div>
      )}

      <section style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div style={{ ...avatarStyle, width: '52px', height: '52px', fontSize: '18px' }}>{c.name.charAt(0)}</div>
          <div>
            <p style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>{c.name}</p>
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
              <StatusBadge status={c.status} />
              {c.streak > 0 && <span style={{ color: COLORS.peach, fontSize: '12px', fontWeight: 600 }}>🔥 {c.streak} ימים</span>}
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
          <MiniStat label="משקל נוכחי" value={`${c.weight} ק״ג`} color={COLORS.primaryDark} />
          <MiniStat label="ירדה" value={`${dropped}-`} color="#4A7A5E" />
          <MiniStat label="עד היעד" value={`${toGo} ק״ג`} color="#B88968" />
        </div>
      </section>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: 'white', border: `1px solid ${COLORS.border}`, borderRadius: '10px', padding: '4px' }}>
        {[{ id: 'overview', label: '📊 סקירה' }, { id: 'logs', label: '📝 יומן' }, { id: 'photos', label: '📸 תמונות' }].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, background: tab === t.id ? COLORS.primary : 'transparent', color: tab === t.id ? 'white' : COLORS.text,
            border: 'none', borderRadius: '8px', padding: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          {/* 💜 דוח שבועי ותגי הישג */}
          <CoachClientWellness client={client} />

          {/* 📸 תמונות התקדמות (קריאה בלבד) */}
          <section style={cardStyle}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px 0', color: COLORS.primaryDark }}>📸 תמונות התקדמות</h4>
            <ProgressPhotosGallery clientId={c.id} viewOnly={true} />
          </section>

          <section style={cardStyle}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px 0', color: COLORS.primaryDark }}>📉 התקדמות משקל</h4>
            <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: '100%', height: 'auto' }}>
              <line x1={pad.left} y1={targetY} x2={chartW - pad.right} y2={targetY} stroke={COLORS.mint} strokeDasharray="4 4" strokeWidth="1.5" />
              <text x={chartW - pad.right - 2} y={targetY - 4} fontSize="9" fill="#4A7A5E" textAnchor="end">יעד {c.target}</text>
              <path d={pathD} stroke={COLORS.primary} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              {weightSeries.map((p, i) => (
                <g key={i}>
                  <circle cx={pad.left + i * xStep} cy={yFor(p.w)} r="4" fill="white" stroke={COLORS.primary} strokeWidth="2" />
                  <text x={pad.left + i * xStep} y={yFor(p.w) - 8} fontSize="9" fill={COLORS.text} textAnchor="middle" fontWeight="600">{p.w}</text>
                  <text x={pad.left + i * xStep} y={chartH - 6} fontSize="9" fill={COLORS.textMuted} textAnchor="middle">{p.date}</text>
                </g>
              ))}
            </svg>
          </section>

          <section style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, margin: 0, color: COLORS.primaryDark }}>📋 יעדי תזונה</h4>
              {c.savedGoals && <span style={{ fontSize: '10px', color: COLORS.textMuted }}>מחושב אישית</span>}
            </div>
            {c.savedGoals ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <GoalRow label="קלוריות" value={`${c.savedGoals.kcal} קק״ל`} />
                <GoalRow label="חלבונים" value={`${c.savedGoals.proteinG}g`} />
                <GoalRow label="פחמימות" value={`${c.savedGoals.carbG}g`} />
                <GoalRow label="שומנים" value={`${c.savedGoals.fatG}g`} />
              </div>
            ) : (
              <div style={{ background: COLORS.amberSoft, border: `1px solid ${COLORS.amber}`, borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: '#8B6914', margin: 0, fontWeight: 600 }}>⚠️ עדיין לא נקבעו יעדים</p>
              </div>
            )}
            <button onClick={onEditGoals} style={{ ...primaryBtnStyle, marginTop: '10px', padding: '10px', fontSize: '13px' }}>
              🧮 {c.savedGoals ? 'ערכי יעדים' : 'חשבי יעדים'}
            </button>
          </section>
        </>
      )}

      {tab === 'logs' && (
        <section style={cardStyle}>
          <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px 0', color: COLORS.primaryDark }}>📝 רישומים אחרונים</h4>
          {recentLogs.length === 0 ? (
            <p style={{ textAlign: 'center', color: COLORS.textMuted, fontSize: 12, padding: 20 }}>
              עדיין אין רישומים
            </p>
          ) : recentLogs.map((l, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', padding: '10px 0', borderBottom: i < recentLogs.length - 1 ? `1px solid ${COLORS.border}` : 'none' }}>
              <span style={{ fontSize: '18px' }}>{l.type}</span>
              <div>
                <p style={{ margin: 0, fontSize: '12px', color: COLORS.text }}>{l.text}</p>
                <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: COLORS.textMuted }}>{l.date}</p>
              </div>
            </div>
          ))}
        </section>
      )}

      {tab === 'photos' && (
        <section style={cardStyle}>
          <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px 0', color: COLORS.primaryDark }}>📸 תמונות התקדמות</h4>
          {progressPhotos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 16px', color: COLORS.textMuted }}>
              <span style={{ fontSize: 36, opacity: 0.5 }}>📸</span>
              <p style={{ fontSize: 12, margin: '8px 0 4px' }}>עדיין אין תמונות התקדמות</p>
              <p style={{ fontSize: 11, margin: 0 }}>הלקוחה יכולה להעלות תמונות מהאפליקציה שלה</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {progressPhotos.map((p, i) => (
                <div key={p.id} style={{ aspectRatio: '3/4', borderRadius: '10px', overflow: 'hidden', position: 'relative', border: `1px solid ${COLORS.border}`, background: COLORS.primarySoft }}>
                  <img 
                    src={p.photo_url} 
                    alt={p.label || 'תמונת התקדמות'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    onClick={() => window.open(p.photo_url, '_blank')}
                  />
                  <span style={{ position: 'absolute', bottom: '4px', left: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '10px', padding: '3px 6px', borderRadius: '4px', textAlign: 'center' }}>
                    {new Date(p.created_at).toLocaleDateString('he-IL', {day:'numeric', month:'numeric', year:'2-digit'})}
                  </span>
                  {p.label && (
                    <span style={{ position: 'absolute', top: '4px', right: '4px', background: 'white', fontSize: '9px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', color: COLORS.primaryDark }}>
                      {p.label}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 📥 ייצוא CSV וארכיון */}
      <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: `1px solid ${COLORS.border}`, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <button onClick={async () => {
          try {
            await exportClientCSV(c.id);
          } catch (e) {
            alert('שגיאה: ' + e.message);
          }
        }} style={{
          background: 'white', color: COLORS.primaryDark,
          border: `1px solid ${COLORS.primary}`, padding: '12px',
          borderRadius: '10px', fontSize: '12px', fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <span style={{ fontSize: 14 }}>📥</span>
          ייצוא CSV
        </button>
        <button onClick={async () => {
          const reason = prompt('סיבה לארכיון (אופציונלי):', '');
          if (reason === null) return; // ביטול
          if (!confirm(`להעביר את ${c.name} לארכיון? ניתן לשחזר בכל עת.`)) return;
          await archiveClient(c.id, reason);
          alert('הלקוחה הועברה לארכיון');
          onBack();
        }} style={{
          background: 'white', color: '#8B6914',
          border: '1px solid #E8C96A', padding: '12px',
          borderRadius: '10px', fontSize: '12px', fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <span style={{ fontSize: 14 }}>📦</span>
          העברה לארכיון
        </button>
      </div>

      {/* 🗑️ כפתור מחיקת לקוחה - בתחתית! */}
      <div style={{ marginTop: '12px' }}>
        <button onClick={() => setShowDeleteConfirm(true)} style={{
          width: '100%', background: 'white', color: '#C62828',
          border: '1px solid #FFCDD2', padding: '12px',
          borderRadius: '10px', fontSize: '13px', fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>🗑️</span>
          מחק לקוחה לצמיתות
        </button>
      </div>
    </main>
  );
}

function GoalRow({ label, value }) {
  return (
    <div style={{ background: COLORS.primarySoft, borderRadius: '8px', padding: '8px 10px' }}>
      <p style={{ margin: 0, fontSize: '10px', color: COLORS.textMuted }}>{label}</p>
      <p style={{ margin: '2px 0 0 0', fontSize: '13px', fontWeight: 700, color: COLORS.primaryDark }}>{value}</p>
    </div>
  );
}

/* ===================== MACRO CALC ===================== */
const ACTIVITY_MULTIPLIER = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
const GOAL_OFFSET = { lose: -500, maintain: 0, gain: 300 };

function MacroCalc({ client, onBack, onSave }) {
  const [weight, setWeight] = useState(client.weight);
  const [height, setHeight] = useState(client.height);
  const [age, setAge] = useState(client.age);
  const [activity, setActivity] = useState(client.activity);
  const [goal, setGoal] = useState(client.goal);
  const [carbPct, setCarbPct] = useState(client.macroSplit.carb);
  const [proteinPct, setProteinPct] = useState(client.macroSplit.protein);
  const [fatPct, setFatPct] = useState(client.macroSplit.fat);
  const [manualOverride, setManualOverride] = useState(false);
  const [manualKcal, setManualKcal] = useState(client.savedGoals?.kcal ?? 1800);

  const bmr = Math.round(10 * weight + 6.25 * height - 5 * age - 161);
  const tdee = Math.round(bmr * ACTIVITY_MULTIPLIER[activity]);
  const computedKcal = Math.round(tdee + GOAL_OFFSET[goal]);
  const finalKcal = manualOverride ? manualKcal : computedKcal;
  const carbG = Math.round((finalKcal * carbPct / 100) / 4);
  const proteinG = Math.round((finalKcal * proteinPct / 100) / 4);
  const fatG = Math.round((finalKcal * fatPct / 100) / 9);
  const totalPct = carbPct + proteinPct + fatPct;

  return (
    <main style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <BackHeader onBack={onBack} title="מחשבון מאקרו" subtitle={`עבור ${client.name}`} />
      <section style={cardStyle}>
        <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 12px 0', color: COLORS.primaryDark }}>👤 נתונים אישיים</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          <Field label="משקל"><input type="number" value={weight} onChange={(e) => setWeight(+e.target.value || 0)} style={{ ...inputStyle, direction: 'ltr', textAlign: 'right', padding: '8px' }} /></Field>
          <Field label="גובה"><input type="number" value={height} onChange={(e) => setHeight(+e.target.value || 0)} style={{ ...inputStyle, direction: 'ltr', textAlign: 'right', padding: '8px' }} /></Field>
          <Field label="גיל"><input type="number" value={age} onChange={(e) => setAge(+e.target.value || 0)} style={{ ...inputStyle, direction: 'ltr', textAlign: 'right', padding: '8px' }} /></Field>
        </div>
        <Field label="רמת פעילות">
          <select value={activity} onChange={(e) => setActivity(e.target.value)} style={inputStyle}>
            <option value="sedentary">🛋️ יושבנית</option>
            <option value="light">🚶 קלה (1-3/שבוע)</option>
            <option value="moderate">🏃 בינונית (3-5/שבוע)</option>
            <option value="active">💪 פעילה (6-7/שבוע)</option>
            <option value="very_active">🏆 ספורטאית</option>
          </select>
        </Field>
        <Field label="מטרה">
          <div style={{ display: 'flex', gap: '6px' }}>
            {[{ id: 'lose', label: '📉 ירידה' }, { id: 'maintain', label: '⚖️ שמירה' }, { id: 'gain', label: '📈 עלייה' }].map((g) => (
              <button key={g.id} onClick={() => setGoal(g.id)} style={{
                flex: 1, background: goal === g.id ? COLORS.primary : 'white', color: goal === g.id ? 'white' : COLORS.text,
                border: `1px solid ${goal === g.id ? COLORS.primary : COLORS.border}`, borderRadius: '10px', padding: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
              }}>{g.label}</button>
            ))}
          </div>
        </Field>
      </section>

      <section style={{ ...cardStyle, background: COLORS.primarySoft, border: `1px solid ${COLORS.primary}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center', marginBottom: '10px' }}>
          <div><p style={{ margin: 0, fontSize: '11px', color: COLORS.textMuted }}>BMR</p><p style={{ margin: '2px 0 0 0', fontSize: '15px', fontWeight: 700, color: COLORS.primaryDark }}>{bmr}</p></div>
          <div><p style={{ margin: 0, fontSize: '11px', color: COLORS.textMuted }}>TDEE</p><p style={{ margin: '2px 0 0 0', fontSize: '15px', fontWeight: 700, color: COLORS.primaryDark }}>{tdee}</p></div>
          <div><p style={{ margin: 0, fontSize: '11px', color: COLORS.textMuted }}>מומלץ</p><p style={{ margin: '2px 0 0 0', fontSize: '15px', fontWeight: 700, color: COLORS.primaryDark }}>{computedKcal}</p></div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
          <input type="checkbox" checked={manualOverride} onChange={(e) => setManualOverride(e.target.checked)} style={{ accentColor: COLORS.primary }} />
          כתיבה ידנית
        </label>
        {manualOverride && <input type="number" value={manualKcal} onChange={(e) => setManualKcal(+e.target.value || 0)} style={{ ...inputStyle, marginTop: '8px', background: 'white', direction: 'ltr', textAlign: 'right' }} />}
      </section>

      <section style={cardStyle}>
        <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 12px 0', color: COLORS.primaryDark }}>🥗 חלוקת מאקרו · {finalKcal} קק״ל</h4>
        {[{ label: 'פחמימות', pct: carbPct, set: setCarbPct, color: COLORS.primary, g: carbG, k: carbG * 4 },
          { label: 'חלבונים', pct: proteinPct, set: setProteinPct, color: COLORS.peach, g: proteinG, k: proteinG * 4 },
          { label: 'שומנים', pct: fatPct, set: setFatPct, color: COLORS.mint, g: fatG, k: fatG * 9 }].map((m) => (
          <div key={m.label} style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600 }}>{m.label}</span>
              <span style={{ color: COLORS.textMuted }}><strong style={{ color: m.color }}>{m.pct}%</strong> · {m.g}g · {m.k} קק״ל</span>
            </div>
            <input type="range" min={0} max={100} value={m.pct} onChange={(e) => m.set(+e.target.value)} style={{ width: '100%', accentColor: m.color }} />
          </div>
        ))}
        <div style={{ background: totalPct === 100 ? COLORS.mintSoft : COLORS.amberSoft, color: totalPct === 100 ? '#4A7A5E' : '#8B6914', padding: '10px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, textAlign: 'center' }}>
          {totalPct === 100 ? '✅ 100%' : `⚠️ ${totalPct}% — יש לאזן ל-100%`}
        </div>
      </section>

      <button onClick={() => onSave({ weight, height, age, activity, goal, macroSplit: { carb: carbPct, protein: proteinPct, fat: fatPct }, savedGoals: { kcal: finalKcal, carbG, proteinG, fatG } })} disabled={totalPct !== 100} style={{ ...primaryBtnStyle, opacity: totalPct === 100 ? 1 : 0.4 }}>
        💾 שמרי יעדים ל{client.name.split(' ')[0]}
      </button>
    </main>
  );
}

/* ===================== MACRO PICKER ===================== */
function MacroClientPicker({ clients, onBack, onPick }) {
  return (
    <main style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <BackHeader onBack={onBack} title="מחשבון מאקרו" subtitle="בחרי לקוחה" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {clients.map((c) => (
          <button key={c.id} onClick={() => onPick(c)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', border: `1px solid ${COLORS.border}`, borderRadius: '12px', background: 'white', cursor: 'pointer', fontFamily: 'inherit', direction: 'rtl', textAlign: 'right' }}>
            <div style={avatarStyle}>{c.name.charAt(0)}</div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>{c.name}</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: COLORS.textMuted }}>{c.savedGoals ? `🎯 ${c.savedGoals.kcal} קק״ל` : '⚠️ ללא יעד'}</p>
            </div>
            <span style={{ fontSize: '16px', color: COLORS.textMuted }}>←</span>
          </button>
        ))}
      </div>
    </main>
  );
}

/* ===================== MESSAGE ===================== */
function MessageCompose({ client, text, setText, onBack, onSend }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  const templates = [
    'בוקר טוב, זוכרת שיש לך אימון היום 💪',
    'איך ההרגשה אחרי האימון?',
    `${client.name.split(' ')[0]}, כבוד! המשיכי ככה 💜`,
    'אני פה לכל שאלה',
  ];

  // טען הודעות היסטוריות עם הלקוחה
  useEffect(() => {
    loadMessages();
  }, [client.id]);

  // גלול לתחתית כשמתווספות הודעות
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo(0, scrollRef.current.scrollHeight);
    }
  }, [messages]);

  const loadMessages = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // טען את כל ההודעות בין ספיר ללקוחה
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(from_id.eq.${user.id},to_id.eq.${client.id}),and(from_id.eq.${client.id},to_id.eq.${user.id})`)
      .order('sent_at', { ascending: true });

    if (data) {
      setMessages(data.map(m => ({
        id: m.id,
        from: m.from_id === user.id ? 'coach' : 'client',
        text: m.content,
        time: new Date(m.sent_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
        date: new Date(m.sent_at).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' }),
      })));
    }

    // סמן את הודעות הלקוחה כנקראות
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('to_id', user.id)
      .eq('from_id', client.id);

    setLoading(false);
  };

  const handleSend = async () => {
    if (!text.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase.from('messages').insert({
      from_id: user.id,
      to_id: client.id,
      content: text.trim(),
    }).select();

    if (data && data[0]) {
      logEvent('message_sent', null, { to: client.id });
      setMessages(prev => [...prev, {
        id: data[0].id,
        from: 'coach',
        text: data[0].content,
        time: new Date(data[0].sent_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
        date: new Date(data[0].sent_at).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' }),
      }]);
      setText('');
      onSend && onSend();
    }
  };

  return (
    <main style={{ padding: '14px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)', gap: '10px' }}>
      <BackHeader onBack={onBack} title={`שיחה עם ${client.name}`} />
      
      {/* תיבת הודעות */}
      <section ref={scrollRef} style={{ ...cardStyle, flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '200px' }}>
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '8px 0' }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ display: 'flex', justifyContent: i % 2 === 0 ? 'flex-start' : 'flex-end' }}>
                <Shimmer w={`${55 + i * 10}%`} h={36} r={14} />
              </div>
            ))}
          </div>
        )}
        {!loading && messages.length === 0 && (
          <p style={{ textAlign: 'center', color: COLORS.textMuted, fontSize: '13px', margin: 'auto 0' }}>
            עדיין אין הודעות.<br/>שלחי הודעה ראשונה 💜
          </p>
        )}
        {messages.map(m => {
          const isFromCoach = m.from === 'coach';
          const isVoice = m.message_type === 'voice' || m.audio_url;
          return (
            <div key={m.id} style={{
              maxWidth: '82%',
              padding: '9px 12px',
              borderRadius: '14px',
              fontSize: '13px',
              lineHeight: 1.5,
              alignSelf: isFromCoach ? 'flex-end' : 'flex-start',
              background: isFromCoach ? COLORS.primary : COLORS.primarySoft,
              color: isFromCoach ? 'white' : COLORS.text,
            }}>
              {isVoice
                ? <VoiceMessagePlayer url={m.audio_url} duration={m.audio_duration_sec} isFromMe={isFromCoach}/>
                : <p style={{ margin: 0 }}>{m.text}</p>
              }
              <p style={{ margin: '3px 0 0', fontSize: '10px', opacity: 0.7 }}>{m.time}</p>
            </div>
          );
        })}
      </section>

      {/* תבניות מהירות */}
      <section style={{ ...cardStyle, padding: '8px 10px' }}>
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
          {templates.map((t, i) => (
            <button key={i} onClick={() => setText(t)} style={{ 
              background: COLORS.primarySoft, 
              border: `1px solid ${COLORS.border}`, 
              borderRadius: '999px', 
              padding: '6px 12px', 
              fontSize: '11px', 
              color: COLORS.primaryDark, 
              cursor: 'pointer', 
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}>{t}</button>
          ))}
        </div>
      </section>

      {/* תיבת כתיבה */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input 
          value={text} 
          onChange={(e) => setText(e.target.value)} 
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="כתבי הודעה..." 
          style={{ ...inputStyle, direction: 'rtl' }} 
        />
        <button onClick={handleSend} disabled={!text.trim()} style={{ 
          background: COLORS.primary, 
          color: 'white', 
          border: 'none', 
          padding: '10px 18px', 
          borderRadius: '10px', 
          fontSize: '13px', 
          fontWeight: 600, 
          cursor: text.trim() ? 'pointer' : 'default', 
          opacity: text.trim() ? 1 : 0.4, 
          fontFamily: 'inherit',
          whiteSpace: 'nowrap'
        }}>שלחי</button>
      </div>
    </main>
  );
}

/* ===================== NEW CLIENT ===================== */
function NewClient({ onBack, onInvite }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState(1);
  const code = 'SPR-' + Math.random().toString(36).slice(2, 8).toUpperCase();
  const canProceed = firstName.trim() && lastName.trim() && phone.trim();
  const fullName = `${firstName} ${lastName}`.trim();
  const waLink = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(`היי ${firstName} 💚\nזו ספיר. הורידי את האפליקציה והזיני:\n\n${code}`)}`;

  if (step === 2) {
    return (
      <main style={{ padding: '14px' }}>
        <BackHeader onBack={() => setStep(1)} title="הזמאכל חדש" />
        <section style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎉</div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0', color: COLORS.primaryDark }}>{fullName} נוספה!</h3>
          <div style={{ background: COLORS.primarySoft, border: `2px dashed ${COLORS.primary}`, borderRadius: '12px', padding: '16px', margin: '16px 0' }}>
            <p style={{ fontSize: '11px', color: COLORS.textMuted, margin: '0 0 4px 0' }}>קוד גישה</p>
            <p style={{ fontSize: '22px', fontWeight: 700, margin: 0, color: COLORS.primaryDark, letterSpacing: '2px', fontFamily: 'monospace' }}>{code}</p>
          </div>
          <a href={waLink} target="_blank" rel="noopener noreferrer" style={{ display: 'block', background: '#25D366', color: 'white', padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, textDecoration: 'none', marginBottom: '8px' }}>💬 שלחי בוואטסאפ</a>
          <button onClick={() => { navigator.clipboard?.writeText(code); alert('הועתק!'); }} style={{ ...primaryBtnStyle, background: 'white', color: COLORS.primaryDark, border: `1px solid ${COLORS.border}`, marginBottom: '12px' }}>📋 העתיקי</button>
          <button onClick={() => onInvite(fullName)} style={primaryBtnStyle}>סיימתי</button>
        </section>
      </main>
    );
  }

  return (
    <main style={{ padding: '14px' }}>
      <BackHeader onBack={onBack} title="לקוחה חדשה" />
      <section style={cardStyle}>
        <Field label="שם פרטי"><input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="מיכל" style={inputStyle} /></Field>
        <Field label="שם משפחה"><input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="לוי" style={inputStyle} /></Field>
        <Field label="טלפון (וואטסאפ)"><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="050-1234567" style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }} /></Field>
        <button onClick={() => setStep(2)} disabled={!canProceed} style={{ ...primaryBtnStyle, opacity: canProceed ? 1 : 0.4 }}>המשיכי ←</button>
      </section>
    </main>
  );

/* ===================== EDIT CLIENT DETAILS ===================== */
function EditClientDetails({ client, onBack, onSave }) {
  const [name, setName] = useState(client.name || '');
  const [email, setEmail] = useState(client.email || '');
  const [phone, setPhone] = useState(client.phone || '');
  const [height, setHeight] = useState(client.height || '');
  const [age, setAge] = useState(client.age || '');
  const [target, setTarget] = useState(client.target || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    
    // עדכן ב-Supabase
    await supabase.from('clients').update({
      full_name: name,
      email: email,
      phone: phone,
      height_cm: parseInt(height) || null,
      age: parseInt(age) || null,
      target_weight: parseFloat(target) || null,
    }).eq('id', client.id);

    // עדכן ב-state
    onSave({
      name,
      email,
      phone,
      height: parseInt(height) || client.height,
      age: parseInt(age) || client.age,
      target: parseFloat(target) || client.target,
    });
    
    setSaving(false);
  };

  const cardStyle = { 
    background: 'white', 
    border: '1px solid #DDD0EB', 
    borderRadius: '16px', 
    padding: '16px' 
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    border: '1px solid #DDD0EB',
    borderRadius: '10px',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit',
    direction: 'rtl',
    boxSizing: 'border-box',
  };

  return (
    <main style={{ padding: '14px', direction: 'rtl' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        marginBottom: '16px',
        background: 'white',
        padding: '12px 16px',
        borderRadius: '12px',
        border: '1px solid #DDD0EB'
      }}>
        <button onClick={onBack} style={{ 
          background: 'transparent', 
          border: 'none', 
          fontSize: '20px', 
          cursor: 'pointer',
          padding: '4px'
        }}>←</button>
        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#8B72B5' }}>
          עריכת פרטי {client.name.split(' ')[0]}
        </h2>
      </div>

      <section style={cardStyle}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 16px', color: '#8B72B5' }}>
          פרטים אישיים
        </h3>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#2E2A3D' }}>
            שם מלא
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="שם מלא"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#2E2A3D' }}>
            אימייל ליצירת קשר
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@gmail.com"
            style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }}
          />
          <p style={{ fontSize: '11px', color: '#756B85', margin: '4px 0 0' }}>
            זה לא אותו האימייל של ההתחברות
          </p>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#2E2A3D' }}>
            טלפון
          </label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="050-1234567"
            style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#2E2A3D' }}>
              גובה (ס״מ)
            </label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="165"
              style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#2E2A3D' }}>
              גיל
            </label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="30"
              style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#2E2A3D' }}>
            משקל יעד (ק״ג)
          </label>
          <input
            type="number"
            step="0.1"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="65"
            style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }}
          />
        </div>

        <button onClick={handleSave} disabled={saving || !name.trim()} style={{ 
          width: '100%', 
          background: '#B19CD9', 
          color: 'white', 
          border: 'none', 
          padding: '14px', 
          borderRadius: '12px', 
          fontSize: '14px', 
          fontWeight: 600, 
          cursor: (saving || !name.trim()) ? 'default' : 'pointer', 
          fontFamily: 'inherit',
          opacity: (saving || !name.trim()) ? 0.5 : 1
        }}>
          {saving ? 'שומר...' : '💾 שמור שינויים'}
        </button>
      </section>
    </main>
  );
}

}

/* ═══════════════════════════════════════════════════════════
   COACH CHAT — דו שיח עם לקוחה
═══════════════════════════════════════════════════════════ */
function CoachChat({ client, messages, onBack, onSend, coachId }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    await onSend(text);
    setText('');
    setSending(false);
  };

  const handleSendVoice = async (voice) => {
    setSending(true);
    await onSend(null, voice);
    setSending(false);
  };

  // הודעות מהירות לקיצור דרך
  const quickTemplates = [
    `${client.name.split(' ')[0]}, כבוד! המשיכי ככה 💜`,
    'איך ההרגשה היום?',
    'אני פה לכל שאלה',
  ];

  return (
    <main style={{ padding: '0', direction: 'rtl', height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'white', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${COLORS.border}` }}>
        <button onClick={onBack} style={{ background: 'transparent', border: 'none', fontSize: 22, cursor: 'pointer', padding: 4 }}>←</button>
        <div style={{ ...avatarStyle, width: 40, height: 40, fontSize: 15 }}>{client.name.charAt(0)}</div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{client.name}</p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: COLORS.primaryDark }}>● פעילה</p>
        </div>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 8, background: COLORS.bg }}>
        {messages.length === 0 && (
          <p style={{ textAlign: 'center', color: COLORS.textMuted, fontSize: 13, margin: 'auto 0' }}>אין עדיין הודעות. כתבי הודעה ראשונה!</p>
        )}
        {messages.map(m => {
          const isFromCoach = m.from === 'coach';
          const isVoice = m.message_type === 'voice' || m.audio_url;
          return (
            <div key={m.id} style={{
              maxWidth: '82%',
              padding: '9px 13px',
              borderRadius: 14,
              fontSize: 13,
              lineHeight: 1.5,
              alignSelf: isFromCoach ? 'flex-end' : 'flex-start',
              background: isFromCoach ? COLORS.primary : 'white',
              color: isFromCoach ? 'white' : COLORS.text,
              border: isFromCoach ? 'none' : `1px solid ${COLORS.border}`,
              boxShadow: isFromCoach ? 'none' : '0 1px 2px rgba(0,0,0,0.04)',
            }}>
              {isVoice
                ? <VoiceMessagePlayer url={m.audio_url} duration={m.audio_duration_sec} isFromMe={isFromCoach}/>
                : <p style={{ margin: 0 }}>{m.text}</p>
              }
              <p style={{ margin: '3px 0 0', fontSize: 10, opacity: 0.7 }}>{m.time}</p>
            </div>
          );
        })}
      </div>

      <div style={{ padding: '10px 14px', background: 'white', borderTop: `1px solid ${COLORS.border}` }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, overflowX: 'auto', paddingBottom: 4 }}>
          <button onClick={() => setShowPicker(true)} style={{
            background: COLORS.primary,
            border: 'none',
            borderRadius: 999,
            padding: '4px 12px',
            fontSize: 11,
            fontWeight: 700,
            color: 'white',
            cursor: 'pointer',
            fontFamily: 'inherit',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>💬 תבניות</button>
          {quickTemplates.map((t, i) => (
            <button key={i} onClick={() => setText(t)} style={{
              background: COLORS.primarySoft,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 999,
              padding: '4px 10px',
              fontSize: 11,
              color: COLORS.primaryDark,
              cursor: 'pointer',
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}>{t}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <VoiceRecorderButton userId={coachId} onSend={handleSendVoice} disabled={sending} />
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="כתבי הודעה..."
            disabled={sending}
            style={{
              flex: 1,
              padding: '10px 14px',
              border: `1px solid ${COLORS.border}`,
              borderRadius: 10,
              fontSize: 13,
              outline: 'none',
              fontFamily: 'inherit',
              direction: 'rtl',
            }}
          />
          <button onClick={handleSend} disabled={!text.trim() || sending} style={{
            background: COLORS.primary,
            color: 'white',
            border: 'none',
            padding: '0 18px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            cursor: (!text.trim() || sending) ? 'default' : 'pointer',
            opacity: (!text.trim() || sending) ? 0.4 : 1,
            fontFamily: 'inherit',
          }}>שלחי</button>
        </div>
      </div>

      {/* בורר תבניות הודעות */}
      {showPicker && coachId && (
        <MessageTemplatePicker
          coachId={coachId}
          onSelect={(body) => {
            setText(body);
            setShowPicker(false);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </main>
  );
}

/* ═══════════════════════════════════════════════════════════
   NUTRITION PLAN CREATOR — יוצרת תוכנית תזונה ללקוחה
═══════════════════════════════════════════════════════════ */

function ClientProgress({ client, onBack }) {
  const [tab, setTab] = useState('meals');
  const [meals, setMeals] = useState([]);
  const [weights, setWeights] = useState([]);
  const [waterLogs, setWaterLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, [client.id]);

  const loadProgress = async () => {
    // טען ארוחות של שבוע אחרון
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [mealsRes, weightsRes, waterRes] = await Promise.all([
      supabase.from('meal_logs').select('*').eq('client_id', client.id).gte('logged_at', weekAgo.toISOString()).order('logged_at', { ascending: false }),
      supabase.from('weight_logs').select('*').eq('client_id', client.id).order('logged_at', { ascending: false }).limit(30),
      supabase.from('water_logs').select('*').eq('client_id', client.id).gte('logged_at', weekAgo.toISOString()),
    ]);

    setMeals(mealsRes.data || []);
    setWeights(weightsRes.data || []);
    setWaterLogs(waterRes.data || []);
    setLoading(false);
  };

  // סיכום ארוחות לפי יום
  const mealsByDay = {};
  meals.forEach(m => {
    const day = new Date(m.logged_at).toLocaleDateString('he-IL');
    if (!mealsByDay[day]) mealsByDay[day] = { meals: [], totalCal: 0, totalP: 0 };
    mealsByDay[day].meals.push(m);
    mealsByDay[day].totalCal += m.calories || 0;
    mealsByDay[day].totalP += m.protein_g || 0;
  });

  // סיכום מים לפי יום
  const waterByDay = {};
  waterLogs.forEach(w => {
    const day = new Date(w.logged_at).toLocaleDateString('he-IL');
    if (!waterByDay[day]) waterByDay[day] = 0;
    waterByDay[day] += w.amount_ml || 0;
  });

  if (loading) {
    return (
      <main style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Shimmer w={36} h={36} r={10} />
          <Shimmer w="40%" h={16} r={7} />
        </div>
        <div style={{ background: 'white', border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 16 }}>
          <Shimmer w="35%" h={13} r={6} style={{ marginBottom: 12 }} />
          <Shimmer h={120} r={10} />
        </div>
        {[0,1].map(i => (
          <div key={i} style={{ background: 'white', border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Shimmer w="40%" h={12} r={5} />
              <Shimmer w={50} h={12} r={5} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[0,1,2,3].map(j => <Shimmer key={j} h={10} r={4} style={{ flex: 1 }} />)}
            </div>
          </div>
        ))}
      </main>
    );
  }

  const mealIcon = { breakfast: '☀️', lunch: '🌞', dinner: '🌙', snack: '🍎' };

  return (
    <main style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <BackHeader onBack={onBack} title={`התקדמות ${client.name.split(' ')[0]}`} />

      <div style={{ display: 'flex', gap: '4px', background: 'white', border: `1px solid ${COLORS.border}`, borderRadius: '10px', padding: '4px' }}>
        {[
          { id: 'meals', label: '🍽️ תזונה' },
          { id: 'weight', label: '⚖️ משקל' },
          { id: 'water', label: '💧 מים' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1,
            background: tab === t.id ? COLORS.primary : 'transparent',
            color: tab === t.id ? 'white' : COLORS.text,
            border: 'none', borderRadius: '8px', padding: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'meals' && (
        <>
          {Object.entries(mealsByDay).length === 0 && (
            <section style={{ ...cardStyle, textAlign: 'center', color: COLORS.textMuted, fontSize: '13px' }}>
              אין רישומי ארוחות בשבוע האחרון
            </section>
          )}
          {Object.entries(mealsByDay).map(([day, data]) => (
            <section key={day} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: COLORS.primaryDark }}>{day}</h4>
                <span style={{ fontSize: '12px', color: COLORS.textMuted }}>
                  {data.totalCal} קק״ל · {data.totalP}g חלבון
                </span>
              </div>
              {data.meals.map(m => (
                <div key={m.id} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '6px', 
                  background: COLORS.bg, 
                  borderRadius: '8px', 
                  marginBottom: '4px' 
                }}>
                  <span>{mealIcon[m.meal_type] || '🍽️'}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 600 }}>{m.name}</p>
                    <p style={{ margin: 0, fontSize: '10px', color: COLORS.textMuted }}>
                      {m.calories} קק״ל · {new Date(m.logged_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </section>
          ))}
        </>
      )}

      {tab === 'weight' && (
        <section style={cardStyle}>
          <h4 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 700, color: COLORS.primaryDark }}>
            📉 היסטוריית משקל
          </h4>
          {weights.length === 0 && (
            <p style={{ textAlign: 'center', color: COLORS.textMuted, fontSize: '12px' }}>
              אין רישומי משקל
            </p>
          )}
          {weights.map((w, i) => {
            const prev = weights[i + 1];
            const diff = prev ? +(w.weight - prev.weight).toFixed(1) : null;
            return (
              <div key={w.id} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '10px', 
                background: i === 0 ? COLORS.primarySoft : COLORS.bg, 
                borderRadius: '8px', 
                marginBottom: '6px',
                border: `1px solid ${COLORS.border}`
              }}>
                <span style={{ fontSize: '11px', color: COLORS.textMuted }}>
                  {new Date(w.logged_at).toLocaleDateString('he-IL')}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 700 }}>{w.weight} ק״ג</span>
                  {diff !== null && (
                    <span style={{ 
                      fontSize: '11px', 
                      color: diff < 0 ? COLORS.primaryDark : '#C88A8A', 
                      fontWeight: 600 
                    }}>
                      {diff > 0 ? '+' : ''}{diff}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {tab === 'water' && (
        <section style={cardStyle}>
          <h4 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 700, color: COLORS.primaryDark }}>
            💧 צריכת מים שבועית
          </h4>
          {Object.entries(waterByDay).length === 0 && (
            <p style={{ textAlign: 'center', color: COLORS.textMuted, fontSize: '12px' }}>
              אין רישומי שתייה
            </p>
          )}
          {Object.entries(waterByDay).map(([day, amount]) => (
            <div key={day} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '10px', 
              background: COLORS.bg, 
              borderRadius: '8px', 
              marginBottom: '6px',
              border: `1px solid ${COLORS.border}`
            }}>
              <span style={{ fontSize: '12px' }}>{day}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '100px', height: '6px', background: '#E5DEF0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${Math.min(100, (amount / 2500) * 100)}%`, 
                    height: '100%', 
                    background: '#A896C7' 
                  }} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, minWidth: '50px' }}>{amount} מ״ל</span>
              </div>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}

/* ═══════════════════════════════════════════════════════════
   ADD CLIENT — הוספת לקוחה חדשה
═══════════════════════════════════════════════════════════ */
function AddClientModal({ onBack, showToast, onCreated }) {
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [startWeight, setStartWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const fullName = `${firstName} ${lastName}`.trim();
  const canGoStep2 = firstName.trim() && lastName.trim();
  const canCreate = email.trim() && password.length >= 8 && startWeight && targetWeight;

  // צור אימייל טכני אוטומטי מהשם
  const generateEmail = () => {
    const clean = firstName.trim().toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 10);
    const suffix = Math.random().toString(36).substring(2, 6);
    return `${clean || 'user'}${suffix}@sappir.app`;
  };

  const generatePassword = () => {
    const base = firstName.trim().charAt(0).toUpperCase() + firstName.trim().slice(1, 5);
    const num = Math.floor(1000 + Math.random() * 9000);
    return `${base || 'User'}${num}!`;
  };

  const handleGenerate = () => {
    setEmail(generateEmail());
    setPassword(generatePassword());
  };

  const handleCreate = async () => {
    setCreating(true);
    setError('');

    try {
      const { data: { user: coach } } = await supabase.auth.getUser();
      if (!coach) {
        setError('שגיאה: לא מזוהה מאמנת');
        setCreating(false);
        return;
      }

      // קרא ל-Edge Function ליצירת הלקוחה
      const { data: authData } = await supabase.auth.getSession();
      const token = authData?.session?.access_token;

      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/create-client`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: email,
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            birthDate: null,
            startWeight: parseFloat(startWeight) || null,
            target: parseFloat(targetWeight) || null,
            height: parseFloat(height) || null,
            coachId: coach.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || data.error) {
        setError(data.error || 'שגיאה ביצירת הלקוחה');
        setCreating(false);
        return;
      }

      // הצלחה! שמור את הפרטים להצגה
      setResult({
        fullName: data.client.fullName,
        email: data.client.email,
        tempPassword: data.tempPassword,
      });
      setStep(3);
      
      // רענן את רשימת הלקוחות
      setTimeout(() => {
        onCreated();
      }, 2000);

    } catch (e) {
      setError('שגיאה: ' + e.message);
    } finally {
      setCreating(false);
    }
  };

  if (step === 3 && result) {
    return (
      <main style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <BackHeader onBack={onBack} title="יצירת לקוחה חדשה" />
        
        <section style={{ ...cardStyle, background: '#E8F5E8', border: `2px solid #4CAF50`, textAlign: 'center', padding: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px', color: '#2E7D32' }}>
            הלקוחה נוצרה בהצלחה!
          </h3>
          <p style={{ fontSize: '13px', color: COLORS.text, margin: '0 0 20px', lineHeight: 1.5 }}>
            {result.fullName} יכולה עכשיו להתחבר לאפליקציה
          </p>

          <div style={{ background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '16px', textAlign: 'right' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: COLORS.primaryDark, margin: '0 0 10px' }}>
              📧 פרטי התחברות ללקוחה:
            </p>
            <div style={{ fontSize: '13px', fontFamily: 'monospace', direction: 'ltr', textAlign: 'right' }}>
              <p style={{ margin: '6px 0' }}><strong>אימייל:</strong> {result.email}</p>
              <p style={{ margin: '6px 0' }}><strong>סיסמה זמנית:</strong> {result.tempPassword}</p>
            </div>
            <p style={{ fontSize: '10px', color: COLORS.textMuted, margin: '10px 0 0', lineHeight: 1.5 }}>
              💡 שלחי ללקוחה את פרטי ההתחברות במייל או ב-WhatsApp. 
              מומלץ שהיא תשנה את הסיסמה בכניסה הראשונה.
            </p>
          </div>

          <button 
            onClick={() => {
              const text = `שלום ${result.fullName}! 👋\n\nפרטי ההתחברות לאפליקציה:\n\n📧 אימייל: ${result.email}\n🔐 סיסמה: ${result.tempPassword}\n\nקישור: https://your-app.netlify.app\n\nמומלץ לשנות את הסיסמה בכניסה הראשונה 💜`;
              if (navigator.clipboard) {
                navigator.clipboard.writeText(text);
                showToast('📋 פרטים הועתקו ללוח!');
              }
            }}
            style={{ 
              width: '100%', 
              background: 'white', 
              color: COLORS.primaryDark, 
              border: `1px solid ${COLORS.border}`, 
              padding: '12px', 
              borderRadius: '10px', 
              fontSize: '13px', 
              fontWeight: 600, 
              cursor: 'pointer', 
              fontFamily: 'inherit',
              marginBottom: '8px'
            }}
          >
            📋 העתיקי הודעה לשליחה
          </button>
          
          <button 
            onClick={onBack}
            style={{ 
              width: '100%', 
              background: COLORS.primary, 
              color: 'white', 
              border: 'none', 
              padding: '12px', 
              borderRadius: '10px', 
              fontSize: '13px', 
              fontWeight: 600, 
              cursor: 'pointer', 
              fontFamily: 'inherit' 
            }}
          >
            סגור ✓
          </button>
        </section>
      </main>
    );
  }

  if (step === 2) {
    return (
      <main style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <BackHeader onBack={() => setStep(1)} title="פרטים ויעדים" />
        
        <section style={cardStyle}>
          <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 700, color: COLORS.primaryDark }}>
            🔐 פרטי התחברות
          </h4>
          <p style={{ fontSize: '11px', color: COLORS.textMuted, margin: '0 0 10px' }}>
            לחצי "צרי אוטומטית" או הזיני ידנית
          </p>
          <button onClick={handleGenerate} style={{ 
            width: '100%', 
            background: COLORS.primarySoft, 
            color: COLORS.primaryDark, 
            border: `1px solid ${COLORS.border}`, 
            padding: '10px', 
            borderRadius: '10px', 
            fontSize: '12px', 
            fontWeight: 600, 
            cursor: 'pointer', 
            fontFamily: 'inherit',
            marginBottom: '10px'
          }}>
            ✨ צרי פרטי התחברות אוטומטית
          </button>

          <Field label="אימייל טכני (להתחברות)">
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@sappir.app" style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }} />
          </Field>
          <Field label="סיסמה (לפחות 8 תווים)">
            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password123!" style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }} />
          </Field>
        </section>

        <section style={cardStyle}>
          <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 700, color: COLORS.primaryDark }}>
            📏 פרטים אישיים
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Field label="גובה (ס״מ)">
              <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="165" style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }} />
            </Field>
            <Field label="גיל">
              <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="30" style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }} />
            </Field>
          </div>
        </section>

        <section style={cardStyle}>
          <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 700, color: COLORS.primaryDark }}>
            ⚖️ יעדי משקל
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Field label="משקל התחלתי (ק״ג)">
              <input type="number" step="0.1" value={startWeight} onChange={(e) => setStartWeight(e.target.value)} placeholder="70" style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }} />
            </Field>
            <Field label="משקל יעד (ק״ג)">
              <input type="number" step="0.1" value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} placeholder="65" style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }} />
            </Field>
          </div>
        </section>

        {error && (
          <div style={{ background: '#FADDDD', border: '1px solid #E8A5A5', borderRadius: '10px', padding: '12px', fontSize: '13px', color: '#C88A8A' }}>
            {error}
          </div>
        )}

        <button onClick={handleCreate} disabled={!canCreate || creating} style={{ 
          width: '100%', 
          background: COLORS.primary, 
          color: 'white', 
          border: 'none', 
          padding: '14px', 
          borderRadius: '12px', 
          fontSize: '14px', 
          fontWeight: 600, 
          cursor: (canCreate && !creating) ? 'pointer' : 'default', 
          fontFamily: 'inherit',
          opacity: (canCreate && !creating) ? 1 : 0.5,
        }}>
          {creating ? 'יוצרת...' : 'המשיכי ←'}
        </button>
      </main>
    );
  }

  return (
    <main style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <BackHeader onBack={onBack} title="לקוחה חדשה" />
      
      <section style={cardStyle}>
        <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 700, color: COLORS.primaryDark }}>
          👤 פרטים בסיסיים
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <Field label="שם פרטי">
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="וונדר" style={inputStyle} />
          </Field>
          <Field label="שם משפחה">
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="וומן" style={inputStyle} />
          </Field>
        </div>
        <Field label="טלפון">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="050-1234567" style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }} />
        </Field>
      </section>

      <button onClick={() => setStep(2)} disabled={!canGoStep2} style={{ 
        width: '100%', 
        background: COLORS.primary, 
        color: 'white', 
        border: 'none', 
        padding: '14px', 
        borderRadius: '12px', 
        fontSize: '14px', 
        fontWeight: 600, 
        cursor: canGoStep2 ? 'pointer' : 'default', 
        fontFamily: 'inherit',
        opacity: canGoStep2 ? 1 : 0.5,
      }}>
        המשיכי ←
      </button>
    </main>
  );
}

/* ═══════════════════════════════════════════════════════════
   MEAL PLAN BUILDER — ספיר בונה תפריט ללקוחה עם גרירה
═══════════════════════════════════════════════════════════ */
