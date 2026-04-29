import React, { useState, useRef, useEffect } from 'react';
import { supabase } from './supabase';
import {
  SleepCard,
  DailyScoreCard,
  BadgesCard,
  WeeklyReportCard,
  computeDailyScore,
  saveDailyScore,
  checkAndAwardBadges,
  getTodaySleep,
  isTodayRestDay,
  updateStreak,
} from './wellness';
import { NotificationSettings, startReminders, getReminderPrefs } from './notifications';
import { BadgeCelebration } from './celebration';
import { StepsCard } from './steps';
import { AIMealLogger } from './ai_meal_logger';
import { ClientChallengesList } from './challenges';
import { PhotoReminderBanner, ProgressPhotosGallery } from './progress_photos';
import { VoiceRecorderButton, VoiceMessagePlayer } from './voice_messages';
import { BroadcastPlayer } from './voice_broadcasts';
import { NextWorkoutCard, startSmartReminders } from './smart_reminders';
import { FeedbackBanner, FeedbackForm } from './feedback';
import { PatternInsights } from './pattern_reminders';
import { ClientWorkoutPicker, ClientMealPlanView } from './flexible_plans';
import { BarcodeScanner } from './barcode_scanner';
import { MealPhotoAnalyzer } from './meal_photo_ai';
import { ActiveWorkout, WorkoutCompleteModal } from './workout_timer';

const COLORS = {
  bg:'#F5F2FA',primary:'#B19CD9',primaryDark:'#8B72B5',primarySoft:'#E8DFF5',
  accent:'#F4C2C2',accentDark:'#C88A8A',mint:'#C5B3E0',mintSoft:'#EDE3F5',
  peach:'#F5D0B5',peachSoft:'#FBE8D7',sky:'#A495C5',skySoft:'#E0D4EB',
  amber:'#E8C96A',amberSoft:'#F5EECD',text:'#2E2A3D',textMuted:'#756B85',border:'#DDD0EB',
};

// ═══════════════════════════════════════════════════════════════
// 🌙 DARK MODE — CSS overrides for inline styles
// ═══════════════════════════════════════════════════════════════
if (typeof document !== 'undefined' && !document.getElementById('client-dark-mode')) {
  const s = document.createElement('style');
  s.id = 'client-dark-mode';
  s.textContent = `
    [data-theme="dark"] .client-main {
      background: #12101E !important;
      color: #EDE3F5 !important;
    }
    [data-theme="dark"] .client-main [style*="background: white"],
    [data-theme="dark"] .client-main [style*="background:white"],
    [data-theme="dark"] .client-main [style*="background: '#fff'"],
    [data-theme="dark"] .client-main [style*="background: #fff"],
    [data-theme="dark"] .client-main [style*="background:#fff"],
    [data-theme="dark"] .client-main [style*="background: #FFFFFF"],
    [data-theme="dark"] .client-main [style*="background:#FFFFFF"] {
      background-color: #1E1A2E !important;
    }
    [data-theme="dark"] .client-main [style*="background: #F5F2FA"],
    [data-theme="dark"] .client-main [style*="background:#F5F2FA"],
    [data-theme="dark"] .client-main [style*="background: #F8F6FB"],
    [data-theme="dark"] .client-main [style*="background:#F8F6FB"] {
      background-color: #12101E !important;
    }
    [data-theme="dark"] .client-main [style*="background: #E8DFF5"],
    [data-theme="dark"] .client-main [style*="background:#E8DFF5"],
    [data-theme="dark"] .client-main [style*="background: #EDE3F5"],
    [data-theme="dark"] .client-main [style*="background:#EDE3F5"] {
      background-color: #2D2645 !important;
    }
    [data-theme="dark"] .client-main [style*="color: #2E2A3D"],
    [data-theme="dark"] .client-main [style*="color:#2E2A3D"] {
      color: #F0E8FA !important;
    }
    [data-theme="dark"] .client-main [style*="color: #756B85"],
    [data-theme="dark"] .client-main [style*="color:#756B85"] {
      color: #B0A0C5 !important;
    }
    [data-theme="dark"] .client-main [style*="color: #8B72B5"],
    [data-theme="dark"] .client-main [style*="color:#8B72B5"] {
      color: #D4C2EC !important;
    }
    [data-theme="dark"] .client-main [style*="color: #B19CD9"],
    [data-theme="dark"] .client-main [style*="color:#B19CD9"] {
      color: #D8C5F0 !important;
    }
    [data-theme="dark"] .client-main [style*="color: black"],
    [data-theme="dark"] .client-main [style*="color:black"],
    [data-theme="dark"] .client-main [style*="color: #000"],
    [data-theme="dark"] .client-main [style*="color:#000"] {
      color: #F0E8FA !important;
    }
    [data-theme="dark"] .client-main [style*="1px solid #DDD0EB"],
    [data-theme="dark"] .client-main [style*="1px solid #E0D4EB"] {
      border-color: #3D3560 !important;
    }
    [data-theme="dark"] .client-main [style*="borderTop: 1px solid"] {
      border-top-color: #3D3560 !important;
    }
    [data-theme="dark"] .client-main [style*="borderBottom: 1px solid"] {
      border-bottom-color: #3D3560 !important;
    }
    [data-theme="dark"] .client-main input,
    [data-theme="dark"] .client-main textarea,
    [data-theme="dark"] .client-main select {
      background: #252235 !important;
      color: #F0E8FA !important;
      border-color: #3D3560 !important;
    }
    [data-theme="dark"] .client-main input::placeholder,
    [data-theme="dark"] .client-main textarea::placeholder {
      color: #7A6E92 !important;
    }
    [data-theme="dark"] .client-main [style*="background: #B19CD9"],
    [data-theme="dark"] .client-main [style*="background:#B19CD9"] {
      background-color: #C5B3E0 !important;
      color: #1E1A2E !important;
    }
    [data-theme="dark"] .client-main [style*="background: #FADDDD"],
    [data-theme="dark"] .client-main [style*="background:#FADDDD"] {
      background-color: #3A1F1F !important;
    }
    [data-theme="dark"] .client-main [style*="background: #FDF3D7"],
    [data-theme="dark"] .client-main [style*="background:#FDF3D7"] {
      background-color: #2E2510 !important;
    }
    [data-theme="dark"] .client-main [style*="background: #E0F2EB"],
    [data-theme="dark"] .client-main [style*="background:#E0F2EB"] {
      background-color: #1A3028 !important;
    }
  `;
  document.head.appendChild(s);
}

// ═══════════════════════════════════════════════════════════════
// 🎭 UI UPGRADES — Transitions · Toast · Skeleton · Pull
// ═══════════════════════════════════════════════════════════════

if (typeof document !== 'undefined' && !document.getElementById('client-transitions')) {
  const s = document.createElement('style');
  s.id = 'client-transitions';
  s.textContent = `
    @keyframes tabSlide {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes shimmerC {
      0%   { background-position: 200% center; }
      100% { background-position: -200% center; }
    }
    @keyframes toastInC {
      from { opacity: 0; transform: translateX(-50%) translateY(12px) scale(0.94); }
      to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
    }
    @keyframes toastOutC {
      from { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
      to   { opacity: 0; transform: translateX(-50%) translateY(10px) scale(0.94); }
    }
    @keyframes springC {
      0%  { transform: scale(1); } 35% { transform: scale(0.92); }
      65% { transform: scale(1.05); } 100% { transform: scale(1); }
    }
    @keyframes pullSpinC {
      from { transform: rotate(0deg); } to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(s);
}

function AnimatedTab({ children, tabId }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, [tabId]);
  return (
    <div style={{ animation: mounted ? 'tabSlide 0.2s ease forwards' : 'none', opacity: mounted ? undefined : 0 }}>
      {children}
    </div>
  );
}

const CLIENT_TOAST_TYPES = {
  success: { bg: '#E0F2EB', border: '#6BAF8A', icon: '✅', color: '#3D7A5E' },
  error:   { bg: '#FADDDD', border: '#C88A8A', icon: '❌', color: '#8B4040' },
  info:    { bg: '#E8DFF5', border: '#B19CD9', icon: '💜', color: '#8B72B5' },
  saved:   { bg: '#E8DFF5', border: '#B19CD9', icon: '💾', color: '#8B72B5' },
};

function detectClientToastType(msg) {
  if (!msg) return 'info';
  if (msg.startsWith('✅') || msg.startsWith('💪') || msg.startsWith('🎉')) return 'success';
  if (msg.startsWith('❌')) return 'error';
  if (msg.startsWith('💾')) return 'saved';
  return 'info';
}

function ClientRichToast({ message, type, onDone }) {
  const [ex, setEx] = React.useState(false);
  const s = CLIENT_TOAST_TYPES[type] || CLIENT_TOAST_TYPES.info;
  React.useEffect(() => {
    const t1 = setTimeout(() => setEx(true), 2200);
    const t2 = setTimeout(onDone, 2520);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  return (
    <div style={{ position: 'fixed', bottom: 82, left: '50%', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 999, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 18px rgba(0,0,0,0.13)', fontSize: 13, fontWeight: 600, color: s.color, whiteSpace: 'nowrap', zIndex: 200, direction: 'rtl', animation: ex ? 'toastOutC 0.32s ease forwards' : 'toastInC 0.36s cubic-bezier(0.34,1.56,0.64,1) forwards' }}>
      <span style={{ fontSize: 15 }}>{s.icon}</span>
      <span>{message}</span>
    </div>
  );
}

function useClientPullToRefresh(onRefresh, threshold = 65) {
  const [pulling, setPulling] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const startY = React.useRef(null);
  React.useEffect(() => {
    const onStart = (e) => { if ((window.scrollY || 0) > 5) return; startY.current = e.touches[0].clientY; };
    const onMove = (e) => {
      if (startY.current === null || refreshing) return;
      const d = e.touches[0].clientY - startY.current;
      if (d <= 0) { startY.current = null; return; }
      const pct = Math.min(d / threshold, 1.3);
      setProgress(pct);
      if (pct > 0.15) setPulling(true);
    };
    const onEnd = async (e) => {
      if (startY.current === null) return;
      const d = e.changedTouches[0].clientY - startY.current;
      startY.current = null; setPulling(false); setProgress(0);
      if (d >= threshold && !refreshing) {
        try { navigator.vibrate?.([15]); } catch {}
        setRefreshing(true);
        try { await onRefresh(); } catch {}
        setRefreshing(false);
      }
    };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd, { passive: true });
    return () => { window.removeEventListener('touchstart', onStart); window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onEnd); };
  }, [onRefresh, refreshing, threshold]);
  return { pulling, refreshing, progress };
}

function ClientPullIndicator({ pulling, refreshing, progress }) {
  if (!pulling && !refreshing) return null;
  const r = 11, circ = 2 * Math.PI * r;
  return (
    <div style={{ position: 'fixed', top: 64, left: '50%', transform: 'translateX(-50%)', zIndex: 50, background: 'white', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.13)', border: `1px solid ${COLORS.border}` }}>
      {refreshing
        ? <svg width={22} height={22} viewBox="0 0 24 24" style={{ animation: 'pullSpinC 0.8s linear infinite' }}><circle cx={12} cy={12} r={r} fill="none" stroke={COLORS.primary} strokeWidth={2} strokeDasharray={`${circ*0.75} ${circ*0.25}`} /></svg>
        : <svg width={22} height={22} viewBox="0 0 24 24"><circle cx={12} cy={12} r={r} fill="none" stroke={COLORS.border} strokeWidth={1.5} /><circle cx={12} cy={12} r={r} fill="none" stroke={COLORS.primary} strokeWidth={2} strokeDasharray={`${circ*Math.min(progress,1)} ${circ}`} strokeLinecap="round" transform="rotate(-90 12 12)" /></svg>
      }
    </div>
  );
}

function ClientSpringButton({ onClick, children, style={}, haptic='light', disabled=false, ...rest }) {
  const [anim, setAnim] = React.useState(false);
  const handle = React.useCallback((e) => {
    if (disabled) return;
    try { const p={light:[8],medium:[15],success:[8,40,8],error:[20,30,20]}; navigator.vibrate?.(p[haptic]||[8]); } catch{}
    setAnim(true); setTimeout(()=>setAnim(false),400); onClick?.(e);
  }, [onClick,disabled,haptic]);
  return (
    <button {...rest} disabled={disabled} onClick={handle} style={{ ...style, animation:anim?'springC 0.38s cubic-bezier(0.34,1.56,0.64,1) forwards':'none', opacity:disabled?0.5:(style.opacity??1), cursor:disabled?'default':'pointer' }}>
      {children}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════

const FOOD_LIB=[
  // חלבונים
  {id:'f1',name:'חזה עוף 100g',   cal:165,p:31,c:0, f:3, icon:'🍗',cat:'חלבון'},
  {id:'f2',name:'חזה הודו 100g',  cal:135,p:30,c:0, f:1, icon:'🦃',cat:'חלבון'},
  {id:'f3',name:'בשר בקר רזה 100g',cal:200,p:26,c:0, f:10,icon:'🥩',cat:'חלבון'},
  {id:'f4',name:'סלמון 120g',     cal:250,p:25,c:0, f:16,icon:'🐟',cat:'חלבון'},
  {id:'f5',name:'טונה במים 100g', cal:116,p:26,c:0, f:1, icon:'🐟',cat:'חלבון'},
  {id:'f6',name:'ביצה אחת',       cal:72, p:6, c:0, f:5, icon:'🥚',cat:'חלבון'},
  {id:'f7',name:'חלבון מי גבינה סקופ',cal:120,p:24,c:3,f:1,icon:'💪',cat:'חלבון'},
  {id:'f8',name:'טופו 100g',      cal:76, p:8, c:2, f:5, icon:'🥢',cat:'חלבון'},
  
  // מוצרי חלב
  {id:'f9',name:'יוגורט יווני 150g',cal:130,p:17,c:7,f:4,icon:'🥛',cat:'חלב'},
  {id:'f10',name:'קוטג׳ 5% 200g',  cal:142,p:16,c:6, f:6, icon:'🧀',cat:'חלב'},
  {id:'f11',name:'גבינה לבנה 5% 100g',cal:100,p:11,c:3,f:5,icon:'🧀',cat:'חלב'},
  {id:'f12',name:'חלב 2% כוס',    cal:122,p:8, c:12,f:5, icon:'🥛',cat:'חלב'},
  {id:'f13',name:'גבינת פטה 30g', cal:75, p:4, c:1, f:6, icon:'🧀',cat:'חלב'},
  
  // פחמימות
  {id:'f14',name:'אורז מלא 100g',  cal:216,p:5, c:45,f:2, icon:'🍚',cat:'פחמימה'},
  {id:'f15',name:'אורז לבן 100g',  cal:130,p:3, c:28,f:0, icon:'🍚',cat:'פחמימה'},
  {id:'f16',name:'קינואה 100g',    cal:120,p:4, c:21,f:2, icon:'🌾',cat:'פחמימה'},
  {id:'f17',name:'פסטה מלאה 100g', cal:131,p:5, c:25,f:1, icon:'🍝',cat:'פחמימה'},
  {id:'f18',name:'בטטה 150g',      cal:129,p:3, c:30,f:0, icon:'🍠',cat:'פחמימה'},
  {id:'f19',name:'תפוח אדמה 150g', cal:116,p:3, c:26,f:0, icon:'🥔',cat:'פחמימה'},
  {id:'f20',name:'לחם מלא פרוסה',  cal:80, p:4, c:15,f:1, icon:'🍞',cat:'פחמימה'},
  {id:'f21',name:'לחמנייה',        cal:200,p:7, c:38,f:3, icon:'🍞',cat:'פחמימה'},
  {id:'f22',name:'פיתה מלאה',      cal:170,p:6, c:34,f:2, icon:'🫓',cat:'פחמימה'},
  {id:'f23',name:'שיבולת שועל 50g',cal:190,p:7, c:33,f:3, icon:'🥣',cat:'פחמימה'},
  
  // קטניות
  {id:'f24',name:'עדשים מבושלות 100g',cal:116,p:9,c:20,f:0,icon:'🫘',cat:'קטנית'},
  {id:'f25',name:'חומוס מבושל 100g',cal:164,p:9, c:27,f:3, icon:'🫘',cat:'קטנית'},
  {id:'f26',name:'שעועית לבנה 100g',cal:127,p:9, c:23,f:1, icon:'🫘',cat:'קטנית'},
  {id:'f27',name:'טחינה גולמית כף',cal:89,p:3, c:3, f:8, icon:'🥜',cat:'קטנית'},
  
  // פירות
  {id:'f28',name:'בננה',           cal:89, p:1, c:23,f:0, icon:'🍌',cat:'פרי'},
  {id:'f29',name:'תפוח',           cal:95, p:0, c:25,f:0, icon:'🍎',cat:'פרי'},
  {id:'f30',name:'תפוז',           cal:62, p:1, c:15,f:0, icon:'🍊',cat:'פרי'},
  {id:'f31',name:'קיווי',          cal:42, p:1, c:10,f:0, icon:'🥝',cat:'פרי'},
  {id:'f32',name:'תותים 100g',     cal:32, p:1, c:8, f:0, icon:'🍓',cat:'פרי'},
  {id:'f33',name:'אוכמניות 100g',  cal:57, p:1, c:14,f:0, icon:'🫐',cat:'פרי'},
  {id:'f34',name:'אבטיח 200g',     cal:60, p:1, c:15,f:0, icon:'🍉',cat:'פרי'},
  {id:'f35',name:'ענבים 100g',     cal:67, p:1, c:17,f:0, icon:'🍇',cat:'פרי'},
  
  // ירקות
  {id:'f36',name:'עגבנייה',        cal:22, p:1, c:5, f:0, icon:'🍅',cat:'ירק'},
  {id:'f37',name:'מלפפון',         cal:16, p:1, c:4, f:0, icon:'🥒',cat:'ירק'},
  {id:'f38',name:'גזר',            cal:25, p:1, c:6, f:0, icon:'🥕',cat:'ירק'},
  {id:'f39',name:'ברוקולי 100g',   cal:34, p:3, c:7, f:0, icon:'🥦',cat:'ירק'},
  {id:'f40',name:'חסה כוס',        cal:5,  p:0, c:1, f:0, icon:'🥬',cat:'ירק'},
  {id:'f41',name:'פלפל אדום',      cal:31, p:1, c:7, f:0, icon:'🫑',cat:'ירק'},
  {id:'f42',name:'כרוב 100g',      cal:25, p:1, c:6, f:0, icon:'🥬',cat:'ירק'},
  
  // שומנים בריאים
  {id:'f43',name:'אבוקדו חצי',     cal:120,p:1, c:6, f:11,icon:'🥑',cat:'שומן'},
  {id:'f44',name:'שמן זית כף',     cal:120,p:0, c:0, f:14,icon:'🫒',cat:'שומן'},
  {id:'f45',name:'שקדים 30g',      cal:173,p:6, c:6, f:15,icon:'🌰',cat:'שומן'},
  {id:'f46',name:'אגוזי מלך 30g',  cal:185,p:4, c:4, f:18,icon:'🌰',cat:'שומן'},
  {id:'f47',name:'חמאת בוטנים כף', cal:90, p:4, c:3, f:8, icon:'🥜',cat:'שומן'},
  
  // חטיפים ואחר
  {id:'f48',name:'חטיף חלבון',     cal:200,p:20,c:15,f:7, icon:'🍫',cat:'חטיף'},
  {id:'f49',name:'פירות יבשים 30g',cal:120,p:1, c:30,f:0, icon:'🍇',cat:'חטיף'},
  {id:'f50',name:'שוקולד מריר 20g',cal:120,p:2, c:9, f:9, icon:'🍫',cat:'חטיף'},
];

const EX_LIB=[
  {id:'e1',name:'פלאנק',           sets:3,reps:'45 שנ׳',rest:30,icon:'🧘‍♀️'},
  {id:'e2',name:'כפיפות בטן',      sets:3,reps:'20',    rest:30,icon:'💪'},
  {id:'e3',name:'שכיבות שמיכה',    sets:4,reps:'12',    rest:60,icon:'🤸‍♀️'},
  {id:'e4',name:'מתח',             sets:3,reps:'8',     rest:90,icon:'🏋️'},
  {id:'e5',name:'חתירה עם משקולת', sets:4,reps:'12',    rest:60,icon:'🚣'},
  {id:'e6',name:'כפות רגליים',     sets:4,reps:'20',    rest:30,icon:'🦵'},
];

const DEFAULT_EXERCISES=[
  {id:1,name:'סקוואט עם מוט', sets:4,reps:'10',rest:90,icon:'🏋️‍♀️',done:false},
  {id:2,name:'היפ תראסט',     sets:4,reps:'12',rest:60,icon:'🍑',   done:false},
  {id:3,name:'דדליפט רומני',  sets:3,reps:'10',rest:90,icon:'💪',   done:false},
  {id:4,name:'לאנג׳ הליכה',   sets:3,reps:'12',rest:60,icon:'🚶‍♀️',done:false},
  {id:5,name:'קפיצות קופסה',  sets:3,reps:'15',rest:45,icon:'📦',   done:false},
];

// חיפוש ב-Open Food Facts API (מאגר מוצרים עולמי חינמי)
async function searchOpenFoodFacts(query) {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=15&fields=product_name,product_name_he,brands,image_small_url,nutriments,serving_size,code`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.products) return [];
    
    return data.products
      .filter(p => {
        const n = p.nutriments || {};
        return (p.product_name_he || p.product_name) && (n['energy-kcal_100g'] || n.energy_100g);
      })
      .map(p => {
        const n = p.nutriments || {};
        const cal = Math.round(n['energy-kcal_100g'] || (n.energy_100g ? n.energy_100g / 4.184 : 0));
        return {
          id: 'off_' + p.code,
          name: `${p.product_name_he || p.product_name} 100g`,
          brand: p.brands ? p.brands.split(',')[0].trim() : '',
          cal: cal,
          p: Math.round((n.proteins_100g || 0) * 10) / 10,
          c: Math.round((n.carbohydrates_100g || 0) * 10) / 10,
          f: Math.round((n.fat_100g || 0) * 10) / 10,
          icon: '🛒',
          image: p.image_small_url,
          cat: 'מוצר',
        };
      })
      .slice(0, 10);
  } catch (e) {
    console.error('Open Food Facts search error:', e);
    return [];
  }
}

const AI_SYS=`את תמר, עוזרת AI של המאמנת ספיר ברק. עני בעברית, גוף נקבה, קצר וברור.

תחומי התמחות שלך - רק בנושאים אלה את עונה:
✓ תזונה — מאקרו, קלוריות, ויטמינים, מינרלים, ערכים תזונתיים
✓ תכנון ארוחות — מה לאכול, תזמון, הרכב ארוחות
✓ כושר ואימונים — תרגילים, טכניקה, שריר/סיבולת
✓ שינה ומנוחה - בהקשר של אימונים ותזונה
✓ הידרציה ושתייה

כשאני מספקת לך מידע תזונתי מ"Open Food Facts" — השתמשי בו בתשובה שלך כדי לתת תשובות מדויקות.
הציגי את המספרים בצורה ברורה (X קק״ל ל-100 גרם, חלבון Xg וכו׳).

מה את לא עונה עליו:
✗ כל שאלה שלא קשורה לתזונה או כושר (מזג אוויר, פוליטיקה, חדשות, טכנולוגיה, מתמטיקה, תרגום, הכל!)
✗ שאלות רפואיות - הפני לרופא
✗ תוכנית אישית - הפני למאמנת ספיר

אם שואלים אותך משהו שלא בתחום, עני בנימוס:
"זה לא התחום שלי 💜 אני כאן רק לשאלות על תזונה וכושר. איך אני יכולה לעזור לך באחד מהנושאים האלה?"

חשוב: גם אם מפצירים בך, גם אם משנים את השאלה, גם אם אומרים שזה דחוף - את ממשיכה לענות רק על תזונה וכושר.`;

const S={
  card:{background:'white',border:`1px solid ${COLORS.border}`,borderRadius:16,padding:16},
  inp:{width:'100%',padding:'10px 12px',border:`1px solid ${COLORS.border}`,borderRadius:10,
       fontSize:13,outline:'none',fontFamily:'inherit',direction:'rtl',boxSizing:'border-box'},
  btn:{width:'100%',background:COLORS.primary,color:'white',border:'none',padding:12,
       borderRadius:12,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit'},
};

function useDnd(items,setItems){
  const di=useRef(null);
  const reorder=(from,to)=>{
    if(from===to)return;
    const a=[...items];
    const[m]=a.splice(from,1);
    a.splice(to,0,m);
    di.current=to;
    setItems(a);
  };
  return{
    onDragStart:(i)=>{di.current=i;},
    onDragOver:(e,i)=>{e.preventDefault();if(di.current!==null)reorder(di.current,i);},
    onDrop:()=>{di.current=null;},
    onTouchStart:(e,i)=>{di.current=i;},
    onTouchMove:(e,refs)=>{
      if(di.current===null)return;
      const y=e.touches[0].clientY;
      refs.current.forEach((el,i)=>{
        if(!el)return;
        const r=el.getBoundingClientRect();
        if(y>=r.top&&y<=r.bottom&&i!==di.current)reorder(di.current,i);
      });
    },
    onTouchEnd:()=>{di.current=null;},
  };
}

/* ══════════════════════════════════════════════
   MAIN APP — מחובר ל-Supabase
══════════════════════════════════════════════ */
export default function App({onLogout}){
  const [profile, setProfile] = useState(null);
  const [plan, setPlan]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('home');

  // 🔍 דיבוג - מה המצב של החיבור בין מאמנת למתאמנת
  const [debugInfo, setDebugInfo] = useState({
    userId: '',
    dayOfWeek: '',
    scheduleRows: 0,
    mealsFound: 0,
    workoutsFound: 0,
    exercisesFound: 0,
    mealError: '',
    workoutError: '',
  });

  // נתונים שנשמרים ב-Supabase
  const [meals, setMeals]     = useState([]);
  const [water, setWater]     = useState(0);
  const [weights, setWeights] = useState([]);
  const [messages, setMessages] = useState([]);
  const [exs, setExs]         = useState(DEFAULT_EXERCISES);
  const [unread, setUnread]   = useState(0);
  const [chat, setChat]       = useState(false);

  // 💜 Wellness — שינה וציון יומי
  const [sleepHours, setSleepHours] = useState(0);
  const [dailyBreakdown, setDailyBreakdown] = useState(null);
  const [isRestDay, setIsRestDay] = useState(false);

  // 🎉 חגיגת תגים חדשים
  const [celebrationBadges, setCelebrationBadges] = useState([]);

  // 🔥 אנימציית streak כשעולה
  const [streakPulse, setStreakPulse] = useState(false);
  const prevStreakRef = useRef(0);

  // ✨ AI meal logger
  const [showAILogger, setShowAILogger] = useState(false);
  const [showHeaderScanner, setShowHeaderScanner] = useState(false);
  const [scannerLookingUp, setScannerLookingUp] = useState(false);
  const [scannerError, setScannerError] = useState('');

  // 📸 גלריית תמונות
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);

  // 📝 טופס משוב
  const [activeFeedback, setActiveFeedback] = useState(null);

  // 🏋️ אימון פעיל
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [completedStats, setCompletedStats] = useState(null);

  // 🍞 Rich Toast state
  const [clientToast, setClientToast] = useState(null);
  const showToast = React.useCallback((text, type) => {
    try { navigator.vibrate?.(detectClientToastType(type || text) === 'error' ? [20, 30, 20] : [8, 40, 8]); } catch {}
    setClientToast({ message: text, type: type || detectClientToastType(text), id: Date.now() });
    setTimeout(() => setClientToast(null), 2600);
  }, []);

  // ↓ Pull to refresh
  const reloadData = React.useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: {} }));
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    const [mealsRes, waterRes] = await Promise.all([
      supabase.from('meal_logs').select('*').eq('client_id', user.id).gte('logged_at', today).order('logged_at', { ascending: true }),
      supabase.from('water_logs').select('amount_ml').eq('client_id', user.id).gte('logged_at', today),
    ]);
    if (mealsRes.data) setMeals(mealsRes.data.map(m => ({ id: m.id, name: m.name, cal: m.calories, p: m.protein_g, c: m.carbs_g, f: m.fat_g, planKey: m.meal_type, time: new Date(m.logged_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) })));
    if (waterRes.data) setWater(waterRes.data.reduce((s, w) => s + w.amount_ml, 0));
  }, []);

  const { pulling, refreshing, progress: pullProg } = useClientPullToRefresh(reloadData);

  // טעינה ראשונית
  useEffect(() => {
    loadAll();
  }, []);

  // 💜 חישוב ושמירת ציון יומי בכל שינוי במדדים
  useEffect(() => {
    if (!profile || loading) return;

    const totalCal = meals.reduce((s, m) => s + (m.cal || 0), 0);
    const totalProt = meals.reduce((s, m) => s + (m.p || 0), 0);
    const workoutDone = exs.length > 0 && exs.every(e => e.done);

    const breakdown = computeDailyScore({
      workoutDone,
      isRestDay,
      calories: totalCal,
      calorieGoal: profile.daily_calorie_goal || 1800,
      protein: totalProt,
      proteinGoal: profile.daily_protein_goal || 113,
      waterMl: water,
      waterGoalMl: profile.daily_water_goal_ml || 2500,
      sleepHours,
    });

    setDailyBreakdown(breakdown);

    // שמור ב-DB ובדוק תגים (רק אם יש פעילות כלשהי)
    if (breakdown.total_score > 0) {
      (async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await saveDailyScore(user.id, breakdown);
        const earned = await checkAndAwardBadges(user.id, breakdown, sleepHours, isRestDay);
        if (earned.length > 0) {
          // 🎉 הצג מסך חגיגי עם קונפטי
          setCelebrationBadges(earned);
        }
        // עדכן streak
        const newStreak = await updateStreak(user.id);
        if (newStreak !== profile.streak) {
          if (newStreak > (prevStreakRef.current || 0)) {
            setStreakPulse(true);
            setTimeout(() => setStreakPulse(false), 2000);
            showToast(`🔥 streak עלה ל-${newStreak} ימים!`);
          }
          prevStreakRef.current = newStreak;
          setProfile(prev => ({ ...prev, streak: newStreak }));
        }
      })();
    }
  }, [meals, water, exs, sleepHours, isRestDay, profile, loading]);

  // 🔔 הפעל תזכורות מתוזמנות בעלייה ראשונית
  useEffect(() => {
    if (loading) return;
    const prefs = getReminderPrefs();
    if (prefs.enabled && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      startReminders();
      // תזכורות חכמות לפי לוח האימונים
      if (profile?.id) startSmartReminders(profile.id);
    }
  }, [loading, profile?.id]);

  // 🔔 Realtime - קבלת הודעות חדשות מהמאמנת בזמן אמת
  useEffect(() => {
    let channel = null;
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel('client-notifications')
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
            console.log('🔔 [Realtime] הודעה חדשה:', newMsg);
            
            // הוסף להודעות
            setMessages(prev => [...prev, {
              id: newMsg.id,
              from: 'coach',
              text: newMsg.content,
              time: new Date(newMsg.sent_at).toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'}),
            }]);
            
            // עדכן מונה לא נקראו (רק אם לא נמצא במסך ההודעות)
            setUnread(prev => tab === 'messages' ? 0 : prev + 1);
            
            // הצג Toast עם תצוגה מקדימה
            showToast(`💬 הודעה חדשה: ${(newMsg.content || '').slice(0, 50)}${newMsg.content?.length > 50 ? '...' : ''}`);
            
            // רטט (אם הטלפון תומך)
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
          }
        )
        .subscribe();
    };
    
    setupRealtime();
    
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [tab]);

  const loadAll = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // טען פרופיל לקוחה
    const { data: clientsData } = await supabase
      .from('clients')
      .select('*')
      .eq('id', user.id)
      .limit(1);
    const clientData = clientsData?.[0];

    if (clientData) setProfile(clientData);

    // טען לוח שבועי של היום הנוכחי - תמיכה בכמה ארוחות
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=ראשון, 6=שבת
    
    console.log('🔍 [DEBUG] Loading for client:', user.id);
    console.log('🔍 [DEBUG] Day of week:', dayOfWeek);
    
    const { data: scheduleData, error: schedErr } = await supabase
      .from('client_schedule')
      .select('*, meals(*)')
      .eq('client_id', user.id)
      .eq('day_of_week', dayOfWeek)
      .not('meal_id', 'is', null)
      .order('order_index');
    
    console.log('🔍 [DEBUG] Meal schedule data:', scheduleData);
    console.log('🔍 [DEBUG] Meal schedule error:', schedErr);
    
    const todayMeals = (scheduleData || [])
      .map(s => s.meals)
      .filter(Boolean);
    
    console.log('🔍 [DEBUG] Today meals extracted:', todayMeals);
    
    // עדכון debug info
    setDebugInfo(prev => ({
      ...prev,
      userId: user.id.slice(0, 8) + '...',
      dayOfWeek: ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'][dayOfWeek],
      scheduleRows: (scheduleData || []).length,
      mealsFound: todayMeals.length,
      mealError: schedErr ? (schedErr.message || JSON.stringify(schedErr)) : '',
    }));
    
    if (todayMeals.length > 0) {
      const newPlan = { 
        meals: todayMeals.map(m => ({
          name: m.name,
          key: m.id,
          items: m.items || [],
          totalCal: Math.round(m.total_calories || 0),
          totalP: Math.round(m.total_protein_g || 0),
          totalC: Math.round(m.total_carbs_g || 0),
          totalF: Math.round(m.total_fat_g || 0),
        }))
      };
      setPlan(newPlan);
      console.log('✅ [DEBUG] Plan set with', todayMeals.length, 'meals');
    } else {
      console.log('⚠️ [DEBUG] No meals found for today');
    }

    // טען ארוחות של היום
    const todayStr = new Date().toISOString().slice(0,10);
    const { data: mealsData } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('client_id', user.id)
      .gte('logged_at', todayStr)
      .order('logged_at', { ascending: true });

    if (mealsData) setMeals(mealsData.map(m => ({
      id: m.id, name: m.name, cal: m.calories,
      p: m.protein_g, c: m.carbs_g, f: m.fat_g,
      planKey: m.meal_type,
      time: new Date(m.logged_at).toLocaleTimeString('he-IL', {hour:'2-digit',minute:'2-digit'}),
    })));

    // טען היסטוריית משקל
    const { data: weightData } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('client_id', user.id)
      .order('logged_at', { ascending: true });

    if (weightData) setWeights(weightData.map(w => ({
      id: w.id,
      date: new Date(w.logged_at).toLocaleDateString('he-IL', {day:'numeric',month:'numeric'}),
      w: w.weight,
    })));

    // טען שתייה של היום
    const { data: waterData } = await supabase
      .from('water_logs')
      .select('amount_ml')
      .eq('client_id', user.id)
      .gte('logged_at', todayStr);

    if (waterData) setWater(waterData.reduce((s,w)=>s+w.amount_ml, 0));

    // טען שעות שינה של היום ובדוק אם היום הוא יום מנוחה
    const [sleep, restDay] = await Promise.all([
      getTodaySleep(user.id),
      isTodayRestDay(user.id),
    ]);
    setSleepHours(sleep);
    setIsRestDay(restDay);

    // טען הודעות
    const { data: msgsData } = await supabase
      .from('messages')
      .select('*')
      .eq('to_id', user.id)
      .order('sent_at', { ascending: true });

    if (msgsData) {
      setMessages(msgsData.map(m => ({
        id: m.id, from: 'coach', text: m.content,
        time: new Date(m.sent_at).toLocaleTimeString('he-IL', {hour:'2-digit',minute:'2-digit'}),
      })));
      setUnread(msgsData.filter(m => !m.read).length);
    }

    // טען אימון של היום - תמיכה בכמה אימונים
    const { data: workoutSched, error: woErr } = await supabase
      .from('client_schedule')
      .select('*, workouts(*)')
      .eq('client_id', user.id)
      .eq('day_of_week', dayOfWeek)
      .not('workout_id', 'is', null)
      .order('order_index');
    
    console.log('🔍 [DEBUG] Workout schedule data:', workoutSched);
    console.log('🔍 [DEBUG] Workout schedule error:', woErr);
    
    // צרף את כל התרגילים מכל האימונים של היום
    const allExercises = [];
    let exIdx = 0;
    (workoutSched || []).forEach(s => {
      const w = s.workouts;
      console.log('🔍 [DEBUG] Processing workout:', w);
      if (w?.exercises?.length) {
        w.exercises.forEach(ex => {
          allExercises.push({
            id: `ex-${exIdx++}`,
            name: ex.name,
            sets: ex.sets || 3,
            reps: ex.reps || '10',
            rest: ex.rest || 60,
            weight: ex.weight,
            icon: ex.icon || '💪',
            videoUrl: ex.video_url,
            notes: ex.notes,
            workoutName: w.name,
            done: false,
          });
        });
      }
    });
    
    console.log('🔍 [DEBUG] All exercises to show:', allExercises);
    
    // עדכון debug info - אימונים
    setDebugInfo(prev => ({
      ...prev,
      workoutsFound: (workoutSched || []).filter(s => s.workouts).length,
      exercisesFound: allExercises.length,
      workoutError: woErr ? (woErr.message || JSON.stringify(woErr)) : '',
    }));
    
    if (allExercises.length > 0) setExs(allExercises);

    setLoading(false);
  };

  const addMeal = async (meal) => {
    const { data: { user } } = await supabase.auth.getUser();

    // Optimistic update — הצג מיד
    const tempId = `temp_${Date.now()}`;
    const optimistic = {
      id: tempId, name: meal.name, cal: meal.cal,
      p: meal.p || 0, c: meal.c || 0, f: meal.f || 0,
      planKey: meal.planKey || meal.type || 'snack',
      time: new Date().toLocaleTimeString('he-IL', {hour:'2-digit',minute:'2-digit'}),
      _pending: true,
    };
    setMeals(prev => [...prev, optimistic]);
    showToast(`✅ ${meal.name} נרשמה`);

    // אם אין אינטרנט — שמור בתור
    if (!navigator.onLine) {
      try {
        const q = JSON.parse(localStorage.getItem('sappir-offline-queue') || '[]');
        q.push({ type: 'insert', table: 'meal_logs', payload: {
          client_id: user.id, name: meal.name,
          meal_type: meal.planKey || meal.type || 'snack',
          calories: meal.cal, protein_g: meal.p || 0,
          carbs_g: meal.c || 0, fat_g: meal.f || 0,
        }});
        localStorage.setItem('sappir-offline-queue', JSON.stringify(q));
      } catch {}
      return;
    }

    // שלח לשרת
    const { data: inserted, error } = await supabase.from('meal_logs').insert({
      client_id: user.id,
      name: meal.name,
      meal_type: meal.planKey || meal.type || 'snack',
      calories: meal.cal,
      protein_g: meal.p || 0,
      carbs_g: meal.c || 0,
      fat_g: meal.f || 0,
    }).select();

    if (error) {
      // ביטול optimistic
      setMeals(prev => prev.filter(m => m.id !== tempId));
      showToast('❌ שגיאה ברישום');
      return;
    }
    const data = inserted?.[0];
    if (data) {
      // החלף temp ב-real
      setMeals(prev => prev.map(m => m.id === tempId ? {
        id: data.id, name: data.name, cal: data.calories,
        p: data.protein_g, c: data.carbs_g, f: data.fat_g,
        planKey: data.meal_type,
        time: new Date(data.logged_at).toLocaleTimeString('he-IL', {hour:'2-digit',minute:'2-digit'}),
      } : m));
    }
  };

  const removeMeal = async (id) => {
    // Optimistic remove
    setMeals(prev => prev.filter(m => m.id !== id));
    if (!navigator.onLine) {
      try {
        const q = JSON.parse(localStorage.getItem('sappir-offline-queue') || '[]');
        q.push({ type: 'delete', table: 'meal_logs', payload: { id } });
        localStorage.setItem('sappir-offline-queue', JSON.stringify(q));
      } catch {}
      return;
    }
    await supabase.from('meal_logs').delete().eq('id', id);
  };

  const addWater = async (ml) => {
    const { data: { user } } = await supabase.auth.getUser();
    // Optimistic
    setWater(w => Math.min(w + ml, 5000));
    showToast(`💧 +${ml} מ״ל`);
    if (!navigator.onLine) {
      try {
        const q = JSON.parse(localStorage.getItem('sappir-offline-queue') || '[]');
        q.push({ type: 'insert', table: 'water_logs', payload: { client_id: user.id, amount_ml: ml } });
        localStorage.setItem('sappir-offline-queue', JSON.stringify(q));
      } catch {}
      return;
    }
    await supabase.from('water_logs').insert({ client_id: user.id, amount_ml: ml });
  };

  // האזנה להודעות מה-Service Worker (מתזכורת מים) + URL params
  useEffect(() => {
    // 1. בדיקה אם נפתח דרך URL מתזכורת
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'add_water') {
      const amount = parseInt(params.get('amount')) || 250;
      addWater(amount);
      // נקה את ה-URL
      window.history.replaceState({}, '', window.location.pathname);
    }

    // 2. האזנה להודעות מה-SW
    const handler = (event) => {
      if (event.data?.type === 'add_water') {
        const amount = event.data.amount_ml || 250;
        addWater(amount);
      }
    };
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handler);
      return () => navigator.serviceWorker.removeEventListener('message', handler);
    }
  }, []);

  const logWeight = async (w) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: inserted, error } = await supabase.from('weight_logs').insert({
      client_id: user.id, weight: +w,
    }).select();

    if (error) { console.error('logWeight error:', error); return; }
    const data = inserted?.[0];
    if (data) {
      const d = new Date(data.logged_at).toLocaleDateString('he-IL', {day:'numeric',month:'numeric'});
      setWeights(prev => [...prev, { id: data.id, date: d, w: +w }]);

      // עדכן משקל נוכחי בפרופיל
      await supabase.from('clients').update({ current_weight: +w }).eq('id', user.id);
      setProfile(prev => ({ ...prev, current_weight: +w }));
      showToast('⚖️ משקל נשמר');
    }
  };

  const deleteWeight = async (id) => {
    await supabase.from('weight_logs').delete().eq('id', id);
    setWeights(prev => prev.filter(w => w.id !== id));
    showToast('🗑️ נמחק');
  };

  const sendMessage = async (text, voice = null) => {
    const { data: { user } } = await supabase.auth.getUser();
    const newMsg = voice
      ? { id: Date.now(), from: 'client', audio_url: voice.audio_url, audio_duration_sec: voice.audio_duration_sec, message_type: 'voice', time: 'עכשיו' }
      : { id: Date.now(), from: 'client', text, time: 'עכשיו' };
    setMessages(prev => [...prev, newMsg]);

    // שמור ב-Supabase (to = המאמנת)
    if (profile?.coach_id) {
      await supabase.from('messages').insert({
        from_id: user.id,
        to_id: profile.coach_id,
        content: voice ? '🎙️ הודעה קולית' : text,
        message_type: voice ? 'voice' : 'text',
        audio_url: voice?.audio_url || null,
        audio_duration_sec: voice?.audio_duration_sec || null,
      });
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: COLORS.bg, direction: 'rtl' }}>
        <header style={{ background: 'white', padding: '14px 18px', borderBottom: `1px solid ${COLORS.border}` }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ width: 100, height: 18, borderRadius: 8, background: 'linear-gradient(90deg,#EDE3F5 25%,#F5F2FA 50%,#EDE3F5 75%)', backgroundSize: '200% 100%', animation: 'shimmerC 1.6s ease-in-out infinite' }} />
          </div>
        </header>
        <main style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Daily ring skeleton */}
          <div style={{ background: 'white', border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 170, height: 170, borderRadius: '50%', background: 'linear-gradient(90deg,#EDE3F5 25%,#F5F2FA 50%,#EDE3F5 75%)', backgroundSize: '200% 100%', animation: 'shimmerC 1.6s ease-in-out infinite' }} />
          </div>
          {/* Macros skeleton */}
          <div style={{ background: 'white', border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 14 }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ width: '25%', height: 10, borderRadius: 4, background: 'linear-gradient(90deg,#EDE3F5 25%,#F5F2FA 50%,#EDE3F5 75%)', backgroundSize: '200% 100%', animation: 'shimmerC 1.6s ease-in-out infinite' }} />
                  <div style={{ width: '15%', height: 10, borderRadius: 4, background: 'linear-gradient(90deg,#EDE3F5 25%,#F5F2FA 50%,#EDE3F5 75%)', backgroundSize: '200% 100%', animation: 'shimmerC 1.6s ease-in-out infinite' }} />
                </div>
                <div style={{ height: 8, borderRadius: 4, background: 'linear-gradient(90deg,#EDE3F5 25%,#F5F2FA 50%,#EDE3F5 75%)', backgroundSize: '200% 100%', animation: 'shimmerC 1.6s ease-in-out infinite' }} />
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:COLORS.bg,direction:'rtl'}}>
        <p style={{color:COLORS.text}}>שגיאה בטעינת הפרופיל</p>
      </div>
    );
  }

  const p = {
    id: profile.id,
    firstName: profile.full_name?.split(' ')[0] || 'שלום',
    weight: profile.current_weight || profile.start_weight || 70,
    startWeight: profile.start_weight || 75,
    target: profile.target_weight || 65,
    streak: profile.streak || 0,
    dailyCalorieGoal: profile.daily_calorie_goal || 1800,
    dailyProteinGoal: profile.daily_protein_goal || 113,
    dailyCarbGoal: profile.daily_carb_goal || 225,
    dailyFatGoal: profile.daily_fat_goal || 50,
    dailyWaterGoalMl: profile.daily_water_goal_ml || 2500,
    age: profile.age || 30,
    sex: profile.sex || 'female',
    height: profile.height_cm || 165,
    goal: profile.goal || 'lose',
  };

  // בנה todayPlan מהמבנה החדש של Supabase
  const todayPlan = plan?.meals?.length ? 
    plan.meals.reduce((acc, m) => {
      acc[m.key] = {
        name: m.name,
        cal: Math.round(m.totalCal || 0),
        p: Math.round(m.totalP || 0),
        c: 0, f: 0,
        items: (m.items || []).map(i => i.name),
        meals: m.items || [],
      };
      return acc;
    }, {})
    : {};

  const cal  = meals.reduce((s,m)=>s+(m.cal||0),0);
  const prot = meals.reduce((s,m)=>s+(m.p||0),0);
  const carb = meals.reduce((s,m)=>s+(m.c||0),0);
  const fat  = meals.reduce((s,m)=>s+(m.f||0),0);
  const rem  = Math.max(0, p.dailyCalorieGoal - cal);
  const calPct = Math.min(100, Math.round(cal/p.dailyCalorieGoal*100));
  const wPct   = Math.min(100, Math.round(water/p.dailyWaterGoalMl*100));
  const done   = exs.filter(e=>e.done).length;

  const NAV=[
    {id:'home',label:'בית',icon:'home'},
    {id:'eat',label:'תזונה',icon:'food'},
    {id:'workout',label:'אימון',icon:'workout'},
    {id:'stats',label:'סטטיסטיקות',icon:'chart'},
    {id:'settings',label:'הגדרות',icon:'settings'},
  ];

  return(
    <div className="client-main" style={{direction:'rtl',fontFamily:'system-ui,-apple-system,"Segoe UI",sans-serif',
      background:COLORS.bg,minHeight:'100vh',paddingBottom:72,maxWidth:420,margin:'0 auto',
      position:'relative',color:COLORS.text}}>

      <ClientPullIndicator pulling={pulling} refreshing={refreshing} progress={pullProg} />

      {/* header */}
      <header style={{background:'white',padding:'14px 18px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:`1px solid ${COLORS.border}`,position:'sticky',top:0,zIndex:20}}>
        <div>
          <p style={{fontSize:12,color:COLORS.textMuted,margin:0}}>שלום,</p>
          <h1 style={{fontSize:18,fontWeight:700,color:COLORS.primaryDark,margin:0}}>{p.firstName} 💚</h1>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <button onClick={()=>setShowHeaderScanner(true)}
            style={{background:COLORS.primarySoft,border:`1px solid ${COLORS.border}`,borderRadius:10,width:40,height:40,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center'}}
            title="סרקי ברקוד">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={COLORS.primaryDark} strokeWidth="2.2" strokeLinecap="round">
              <line x1="4" y1="6" x2="4" y2="18" />
              <line x1="7" y1="6" x2="7" y2="18" />
              <line x1="10" y1="6" x2="10" y2="18" strokeWidth="3" />
              <line x1="14" y1="6" x2="14" y2="18" />
              <line x1="17" y1="6" x2="17" y2="18" strokeWidth="3" />
              <line x1="20" y1="6" x2="20" y2="18" />
            </svg>
          </button>
          <button onClick={()=>{setTab('messages');setUnread(0);}}
            style={{background:COLORS.primarySoft,border:`1px solid ${COLORS.border}`,borderRadius:10,width:40,height:40,position:'relative',cursor:'pointer',fontSize:18,fontFamily:'inherit'}}>
            💬
            {unread>0&&<span style={{position:'absolute',top:-4,left:-4,background:COLORS.accentDark,color:'white',fontSize:10,fontWeight:700,borderRadius:999,width:18,height:18,display:'flex',alignItems:'center',justifyContent:'center'}}>{unread}</span>}
          </button>
        </div>
      </header>

      {/* HOME */}
      {tab==='home'&&(
        <AnimatedTab tabId="home">
        <main style={{padding:14,display:'flex',flexDirection:'column',gap:14}}>
          {/* 🔔 באנר תזכורות חכם */}
          <ReminderBanner 
            meals={meals} 
            water={water} 
            weights={weights} 
            plan={plan} 
            onTabChange={setTab} 
          />
          
          {/* calorie bar — מלבני, קומפקטי */}
          <section style={{...S.card, padding: 16}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:10}}>
              <div>
                <p style={{margin:0,fontSize:11,color:COLORS.textMuted,fontWeight:600}}>קלוריות נותרו</p>
                <p style={{margin:'2px 0 0',fontSize:32,fontWeight:700,color:COLORS.text,lineHeight:1}}>{rem}</p>
              </div>
              <div style={{textAlign:'left'}}>
                <p style={{margin:0,fontSize:11,color:COLORS.textMuted}}>נצרכו</p>
                <p style={{margin:'2px 0 0',fontSize:16,fontWeight:700,color:COLORS.primaryDark,lineHeight:1}}>
                  {cal} <span style={{fontSize:11,color:COLORS.textMuted,fontWeight:400}}>/ {p.dailyCalorieGoal}</span>
                </p>
              </div>
            </div>
            <div style={{height:10,background:COLORS.primarySoft,borderRadius:5,overflow:'hidden'}}>
              <div style={{
                height:'100%', width:`${Math.min(100, calPct)}%`,
                background:`linear-gradient(90deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
                borderRadius:5, transition:'width 0.4s ease',
              }}/>
            </div>
          </section>

          {/* macros */}
          <section style={S.card}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,textAlign:'center'}}>
              {[['חלבון',prot,p.dailyProteinGoal,'#B88968'],['פחמ׳',carb,p.dailyCarbGoal,COLORS.primaryDark],['שומן',fat,p.dailyFatGoal,COLORS.sky]].map(([l,v,g,c])=>(
                <div key={l}>
                  <p style={{margin:0,fontSize:15,fontWeight:700,color:c}}>{v}<span style={{fontSize:10,color:COLORS.textMuted}}>/{g}g</span></p>
                  <div style={{height:4,background:COLORS.primarySoft,borderRadius:99,overflow:'hidden',margin:'4px 0 2px'}}>
                    <div style={{height:'100%',width:`${Math.min(100,g?v/g*100:0)}%`,background:c}}/>
                  </div>
                  <p style={{margin:0,fontSize:10,color:COLORS.textMuted}}>{l}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 🧘 אינדיקטור יום מנוחה */}
          {isRestDay && (
            <section style={{...S.card, background: 'linear-gradient(135deg, #E8DFF5 0%, #F4C2C2 100%)', border: 'none', padding: 14, textAlign: 'center'}}>
              <div style={{fontSize: 28, marginBottom: 4}}>🧘‍♀️</div>
              <p style={{margin: 0, fontSize: 13, fontWeight: 700, color: COLORS.primaryDark}}>היום יום מנוחה</p>
              <p style={{margin: '2px 0 0', fontSize: 11, color: COLORS.text}}>תני לגוף להתאושש — זה חלק מהאימון 💜</p>
            </section>
          )}

          {/* 💪 כרטיס האימון הבא — הועבר למעלה */}
          {!isRestDay && <NextWorkoutCard clientId={profile.id} />}

          {/* 📊 סטטיסטיקות — צעדים, שינה, ציון יומי */}
          <StepsCard clientId={profile.id} />
          <DailyScoreCard breakdown={dailyBreakdown} />
          <SleepCard clientId={profile.id} onUpdate={(h) => setSleepHours(h)} />

          {/* streak + water */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div style={{
              ...S.card, borderColor: COLORS.peach, padding: 14,
              display: 'flex', alignItems: 'center', gap: 10,
              transform: streakPulse ? 'scale(1.05)' : 'scale(1)',
              boxShadow: streakPulse ? '0 0 0 4px rgba(245, 208, 181, 0.4)' : 'none',
              transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}>
              <div style={{
                background: COLORS.peachSoft, borderRadius: '50%', width: 42, height: 42,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                animation: streakPulse ? 'streakBounce 0.6s ease-out' : 'none',
              }}>🔥</div>
              <div>
                <p style={{fontSize:22,fontWeight:700,color:'#B88968',margin:0,lineHeight:1}}>{p.streak}</p>
                <p style={{fontSize:11,color:COLORS.textMuted,margin:'2px 0 0'}}>ימים רצופים</p>
              </div>
            </div>
            <div style={{...S.card,borderColor:COLORS.sky,padding:14}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                <span>💧</span>
                <span style={{fontSize:11,color:COLORS.textMuted}}>{water}/{p.dailyWaterGoalMl}</span>
              </div>
              <div style={{height:6,background:COLORS.skySoft,borderRadius:99,overflow:'hidden',marginBottom:8}}>
                <div style={{height:'100%',width:`${wPct}%`,background:COLORS.sky,transition:'width 0.3s'}}/>
              </div>
              <div style={{display:'flex',gap:4}}>
                {[200,330,500].map(ml=>(
                  <button key={ml} onClick={()=>addWater(ml)}
                    style={{flex:1,background:COLORS.skySoft,color:'#4A7A94',border:'none',padding:'4px 2px',borderRadius:6,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>+{ml}</button>
                ))}
              </div>
            </div>
          </div>

          <BadgesCard clientId={profile.id} />

          {/* 📸 תזכורת תמונת התקדמות (כל שבועיים) */}
          <PhotoReminderBanner clientId={profile.id} onTakePhoto={() => setShowPhotoGallery(true)} />

          {/* 📝 טופס משוב ממתין */}
          <FeedbackBanner clientId={profile.id} onOpen={(form) => setActiveFeedback(form)} />

          {/* ✨ תובנות מבוססות דפוסים */}
          <PatternInsights clientId={profile.id} />

          {/* 🏆 אתגרים פעילים */}
          <ClientChallengesList clientId={profile.id} />

          {/* today's meals */}
          <section style={S.card}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <h3 style={{margin:0,fontSize:14,fontWeight:700,color:COLORS.primaryDark}}>🍽️ מה אכלתי היום</h3>
              <div style={{display:'flex',gap:6}}>
                <button onClick={()=>setShowAILogger(true)} title="רישום מהיר עם AI" style={{height:28,padding:'0 10px',borderRadius:14,background:'linear-gradient(135deg,#B19CD9 0%,#F4C2C2 100%)',color:'white',border:'none',fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>✨ AI</button>
                <button onClick={()=>setTab('eat')} style={{width:28,height:28,borderRadius:'50%',background:COLORS.primary,color:'white',border:'none',fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'inherit',lineHeight:1}}>+</button>
              </div>
            </div>
            {meals.length===0
              ?<div style={{textAlign:'center',padding:'20px 0',color:COLORS.textMuted,fontSize:13}}>🍽️ עדיין לא רשמת אוכל<br/><span style={{fontSize:11}}>לחצי + להתחיל</span></div>
              :meals.map(m=>(
                <div key={m.id} style={{display:'flex',alignItems:'center',gap:10,padding:8,background:COLORS.mintSoft,borderRadius:10,marginBottom:6}}>
                  <span style={{fontSize:18}}>{m.planKey==='breakfast'?'☀️':m.planKey==='lunch'?'🍽️':m.planKey==='dinner'?'🌙':'🍪'}</span>
                  <div style={{flex:1}}>
                    <p style={{margin:0,fontSize:13,fontWeight:600}}>{m.name}</p>
                    <p style={{margin:'1px 0 0',fontSize:11,color:COLORS.textMuted}}>{m.cal} קק״ל · {m.time}</p>
                  </div>
                  <button onClick={()=>removeMeal(m.id)} style={{background:'transparent',border:'none',cursor:'pointer',fontSize:16,color:COLORS.accentDark}}>🗑️</button>
                </div>
              ))
            }
          </section>

          {/* quick actions */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <button onClick={()=>setTab('workout')} style={{...S.card,cursor:'pointer',textAlign:'center',fontFamily:'inherit',border:`1px solid ${COLORS.border}`}}>
              <div style={{fontSize:24,marginBottom:4}}>{done===exs.length?'✅':'💪'}</div>
              <div style={{fontSize:13,fontWeight:600,color:COLORS.primaryDark}}>אימון היום</div>
              <div style={{fontSize:11,color:COLORS.textMuted}}>{done}/{exs.length} תרגילים</div>
            </button>
            <button onClick={()=>setTab('stats')} style={{...S.card,cursor:'pointer',textAlign:'center',fontFamily:'inherit',border:`1px solid ${COLORS.border}`}}>
              <div style={{fontSize:24,marginBottom:4}}>📊</div>
              <div style={{fontSize:13,fontWeight:600,color:COLORS.primaryDark}}>סטטיסטיקות</div>
              <div style={{fontSize:11,color:COLORS.textMuted}}>↓{(p.startWeight-p.weight).toFixed(1)} ק״ג</div>
            </button>
          </div>
        </main>
        </AnimatedTab>
      )}

      {tab==='eat'&&<AnimatedTab tabId="eat"><LogScreen profile={p} meals={meals} cal={cal} prot={prot} carb={carb} fat={fat} todayPlan={todayPlan} onPlan={(key,meal)=>addMeal({...meal,planKey:key})} onCustom={addMeal} onRemove={removeMeal}/></AnimatedTab>}
      {tab==='workout'&&<AnimatedTab tabId="workout"><ClientWorkoutPicker clientId={profile.id} onComplete={() => loadAll()} /></AnimatedTab>}
      {tab==='stats'&&<AnimatedTab tabId="stats"><StatsScreen weights={weights} profile={p} onLog={logWeight} onDel={deleteWeight} onOpenPhotos={()=>setShowPhotoGallery(true)}/></AnimatedTab>}
      {tab==='messages'&&<AnimatedTab tabId="messages"><MessagesScreen messages={messages} onSend={sendMessage} userId={profile.id}/></AnimatedTab>}
      {tab==='settings'&&<AnimatedTab tabId="settings"><SettingsScreen profile={profile} showToast={showToast} onLogout={onLogout}/></AnimatedTab>}

      {/* Toast — Rich version */}
      {clientToast && <ClientRichToast key={clientToast.id} message={clientToast.message} type={clientToast.type} onDone={() => setClientToast(null)} />}

      {/* 🎙️ הקלטות חיזוק מהמאמנת */}
      {profile?.id && <BroadcastPlayer clientId={profile.id} />}

      {/* 📝 טופס משוב */}
      {activeFeedback && (
        <FeedbackForm
          form={activeFeedback}
          onClose={() => setActiveFeedback(null)}
          onSubmit={() => showToast('💜 תודה על המשוב!')}
        />
      )}

      {/* 🏋️ אימון פעיל */}
      {activeWorkout && (
        <ActiveWorkout
          workout={activeWorkout.workout}
          exercises={activeWorkout.exercises}
          clientId={profile.id}
          onClose={() => setActiveWorkout(null)}
          onComplete={(stats) => {
            setActiveWorkout(null);
            setCompletedStats(stats);
          }}
        />
      )}

      {/* 🎉 סיום אימון */}
      {completedStats && (
        <WorkoutCompleteModal
          stats={completedStats}
          onClose={() => setCompletedStats(null)}
        />
      )}

      {/* 🎉 חגיגת תגים חדשים */}
      {celebrationBadges.length > 0 && (
        <BadgeCelebration
          badgeCodes={celebrationBadges}
          onClose={() => setCelebrationBadges([])}
        />
      )}

      {/* ✨ AI Meal Logger */}
      {showAILogger && (
        <AIMealLogger
          clientId={profile.id}
          onSave={() => { loadAll(); }}
          onClose={() => setShowAILogger(false)}
        />
      )}

      {/* 📷 סורק ברקוד מההדר */}
      {showHeaderScanner && (
        <BarcodeScanner
          onDetect={async (barcode) => {
            setShowHeaderScanner(false);
            setScannerLookingUp(true);
            setScannerError('');
            try {
              // חיפוש במאגר המקומי
              const { data: local } = await supabase
                .from('food_database')
                .select('*')
                .eq('barcode', barcode)
                .limit(1);
              let food = local && local.length > 0 ? local[0] : null;

              // אם לא נמצא - חיפוש ב-Open Food Facts
              if (!food) {
                const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
                if (res.ok) {
                  const json = await res.json();
                  if (json.status === 1 && json.product) {
                    const prod = json.product;
                    const n = prod.nutriments || {};
                    const productName = prod.product_name_he || prod.product_name || prod.product_name_en;
                    if (productName) {
                      food = {
                        name: productName + (prod.brands ? ` (${prod.brands})` : ''),
                        kcal_per_100g: parseFloat(n['energy-kcal_100g']) || 0,
                        protein_per_100g: parseFloat(n.proteins_100g) || 0,
                        carbs_per_100g: parseFloat(n.carbohydrates_100g) || 0,
                        fat_per_100g: parseFloat(n.fat_100g) || 0,
                      };
                      try {
                        await supabase.from('food_database').upsert({
                          source: 'off', source_id: barcode, barcode,
                          name: productName, brand: prod.brands || null,
                          image_url: prod.image_thumb_url || null,
                          kcal_per_100g: food.kcal_per_100g,
                          protein_per_100g: food.protein_per_100g,
                          carbs_per_100g: food.carbs_per_100g,
                          fat_per_100g: food.fat_per_100g,
                        }, { onConflict: 'source,source_id' });
                      } catch {}
                    }
                  }
                }
              }

              if (!food) {
                setScannerError(`לא נמצא מוצר עם ברקוד ${barcode}`);
                setTimeout(() => setScannerError(''), 4000);
                return;
              }

              // רשמי ארוחה אוטומטית עם כמות 100ג
              await addMeal({
                type: 'snack',
                name: food.name,
                cal: Math.round(food.kcal_per_100g || 0),
                p: Math.round(food.protein_per_100g || 0),
                c: Math.round(food.carbs_per_100g || 0),
                f: Math.round(food.fat_per_100g || 0),
              });
            } catch (e) {
              setScannerError('שגיאה: ' + (e.message || 'נסי שוב'));
              setTimeout(() => setScannerError(''), 4000);
            } finally {
              setScannerLookingUp(false);
            }
          }}
          onClose={() => setShowHeaderScanner(false)}
        />
      )}

      {/* טוסטים של סריקת ברקוד */}
      {scannerLookingUp && (
        <div style={{
          position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)',
          background: COLORS.primary, color: 'white', padding: '10px 18px',
          borderRadius: 24, fontSize: 13, fontWeight: 600, zIndex: 1500,
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        }}>🔍 מחפשת מוצר...</div>
      )}
      {scannerError && (
        <div style={{
          position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)',
          background: '#C88A8A', color: 'white', padding: '10px 18px',
          borderRadius: 24, fontSize: 13, fontWeight: 600, zIndex: 1500,
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)', maxWidth: '90vw',
        }}>{scannerError}</div>
      )}

      {/* 📸 גלריית תמונות התקדמות */}
      {showPhotoGallery && (
        <div style={{
          position: 'fixed', inset: 0, background: 'white',
          zIndex: 200, overflowY: 'auto', padding: 14,
          direction: 'rtl', fontFamily: 'system-ui, sans-serif',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: COLORS.primaryDark }}>
              📸 תמונות התקדמות
            </h2>
            <button onClick={() => setShowPhotoGallery(false)} style={{
              background: 'transparent', border: 'none', fontSize: 22,
              cursor: 'pointer', color: COLORS.textMuted,
            }}>✕</button>
          </div>
          <ProgressPhotosGallery clientId={profile.id} />
        </div>
      )}

      {!chat&&tab==='home'&&(
        <>
          <div style={{position:'fixed',bottom:148,left:16,background:'white',padding:'8px 14px',borderRadius:14,fontSize:12,fontWeight:600,color:COLORS.primaryDark,boxShadow:'0 4px 12px rgba(155,127,191,0.25)',border:`1px solid ${COLORS.primary}`,zIndex:29,animation:'tooltipPulse 12s ease-in-out 2s infinite',opacity:0}}>
            💜 שאלי אותי
            <div style={{position:'absolute',bottom:-6,right:20,width:12,height:12,background:'white',transform:'rotate(45deg)',borderBottom:`1px solid ${COLORS.primary}`,borderRight:`1px solid ${COLORS.primary}`}}/>
          </div>
          <button onClick={()=>setChat(true)} style={{position:'fixed',bottom:84,left:16,width:60,height:60,borderRadius:'50%',background:COLORS.primary,color:'white',border:'none',fontSize:26,cursor:'pointer',boxShadow:'0 4px 14px rgba(155,127,191,0.5)',zIndex:30,fontFamily:'inherit',animation:'botShake 12s ease-in-out 2s infinite',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <span style={{display:'inline-block',animation:'emojiWobble 12s ease-in-out 2s infinite'}}>💜</span>
          </button>
          <style>{`
            @keyframes botShake {
              0%, 85%, 100% { transform: translateX(0) rotate(0deg) scale(1); }
              86% { transform: translateX(0) rotate(0deg) scale(1.1); }
              88% { transform: translateX(-3px) rotate(-12deg) scale(1.1); }
              90% { transform: translateX(4px) rotate(12deg) scale(1.1); }
              92% { transform: translateX(-3px) rotate(-10deg) scale(1.1); }
              94% { transform: translateX(3px) rotate(8deg) scale(1.1); }
              96% { transform: translateX(-2px) rotate(-5deg) scale(1.05); }
              98% { transform: translateX(1px) rotate(2deg) scale(1); }
            }
            @keyframes emojiWobble {
              0%, 85%, 100% { transform: rotate(0deg); }
              88% { transform: rotate(-15deg); }
              91% { transform: rotate(15deg); }
              94% { transform: rotate(-10deg); }
              97% { transform: rotate(5deg); }
            }
            @keyframes tooltipPulse {
              0%, 83%, 100% { opacity: 0; transform: translateY(8px) scale(0.95); }
              87%, 96% { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>
        </>
      )}
      {chat&&<AIChat profile={p} onClose={()=>setChat(false)}/>}

      <nav style={{position:'fixed',bottom:0,left:0,right:0,maxWidth:420,margin:'0 auto',background:'white',borderTop:`1px solid ${COLORS.border}`,display:'flex',justifyContent:'space-around',padding:'8px 0 10px',zIndex:25}}>
        {NAV.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{background:'transparent',border:'none',cursor:'pointer',fontFamily:'inherit',padding:4,display:'flex',flexDirection:'column',alignItems:'center',gap:3,minWidth:48}}>
            <NavIcon name={t.icon} active={tab===t.id}/>
            <span style={{fontSize:10,color:tab===t.id?COLORS.primaryDark:'#9B9B9B',fontWeight:tab===t.id?600:500}}>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

/* ══ 🔔 REMINDER BANNER - התראות חכמות ══ */
function ReminderBanner({ meals, water, weights, plan, onTabChange }) {
  const [dismissed, setDismissed] = useState([]);
  const now = new Date();
  const hour = now.getHours();
  
  const reminders = [];
  
  // 🍳 שכחת לרשום ארוחת בוקר (אחרי 10:00)
  if (hour >= 10 && hour < 14) {
    const hasBreakfast = meals.some(m => {
      if (!m.time) return false;
      const [h] = m.time.split(':').map(Number);
      return h >= 5 && h < 11;
    });
    if (!hasBreakfast && !dismissed.includes('breakfast')) {
      reminders.push({
        id: 'breakfast',
        icon: '🍳',
        text: 'שכחת לרשום ארוחת בוקר?',
        action: 'רשמי עכשיו',
        color: '#FFF3CD',
        textColor: '#856404',
        onClick: () => onTabChange('log'),
      });
    }
  }
  
  // 🥗 שכחת לרשום ארוחת צהריים (אחרי 15:00)
  if (hour >= 15 && hour < 18) {
    const hasLunch = meals.some(m => {
      if (!m.time) return false;
      const [h] = m.time.split(':').map(Number);
      return h >= 11 && h < 16;
    });
    if (!hasLunch && !dismissed.includes('lunch')) {
      reminders.push({
        id: 'lunch',
        icon: '🥗',
        text: 'שכחת לרשום ארוחת צהריים?',
        action: 'רשמי',
        color: '#FFF3CD',
        textColor: '#856404',
        onClick: () => onTabChange('log'),
      });
    }
  }
  
  // 💧 שתייה נמוכה
  if (hour >= 14 && water < 1000 && !dismissed.includes('water')) {
    reminders.push({
      id: 'water',
      icon: '💧',
      text: `שתית רק ${water} מ״ל היום. זמן למים!`,
      action: '+ 250 מ״ל',
      color: '#D1ECF1',
      textColor: '#0C5460',
      onClick: () => onTabChange('log'),
    });
  }
  
  // ⚖️ לא עדכנת משקל השבוע
  const lastWeight = weights[weights.length - 1];
  if (lastWeight) {
    // משקל אחרון - בדוק אם יותר משבוע (אם יש תאריך עם שנה זה אמין יותר)
    const weekInMs = 7 * 24 * 60 * 60 * 1000;
    const lastWeightTime = new Date(lastWeight.date + '/' + now.getFullYear()).getTime();
    if (!isNaN(lastWeightTime) && (now.getTime() - lastWeightTime) > weekInMs && !dismissed.includes('weight')) {
      reminders.push({
        id: 'weight',
        icon: '⚖️',
        text: 'לא עדכנת משקל השבוע',
        action: 'עדכני',
        color: '#E8DFF5',
        textColor: '#5D4B85',
        onClick: () => onTabChange('stats'),
      });
    }
  }
  
  // 🎉 עידוד חיובי - שמרה על כל הארוחות
  if (plan?.meals?.length > 0 && meals.length >= plan.meals.length && !dismissed.includes('great')) {
    reminders.push({
      id: 'great',
      icon: '🎉',
      text: 'כל הכבוד! סימנת את כל הארוחות היום!',
      action: null,
      color: '#D4EDDA',
      textColor: '#155724',
    });
  }
  
  if (reminders.length === 0) return null;
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {reminders.map(r => (
        <div
          key={r.id}
          onClick={r.onClick}
          style={{
            background: r.color,
            border: `1px solid ${r.textColor}33`,
            borderRadius: 12,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: r.onClick ? 'pointer' : 'default',
          }}
        >
          <span style={{ fontSize: 20 }}>{r.icon}</span>
          <p style={{ flex: 1, margin: 0, fontSize: 12, fontWeight: 600, color: r.textColor }}>
            {r.text}
          </p>
          {r.action && (
            <span style={{ fontSize: 11, fontWeight: 700, color: r.textColor }}>
              {r.action} ←
            </span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setDismissed(prev => [...prev, r.id]); }}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14, color: r.textColor, opacity: 0.6, padding: 2 }}
          >✕</button>
        </div>
      ))}
    </div>
  );
}

/* ══ LOG SCREEN ══ */
function LogScreen({profile,meals,cal,prot,carb,fat,todayPlan,onPlan,onCustom,onRemove}){
  const[mode,setMode]=useState('plan');
  const[basket,setBasket]=useState([]);
  const bRefs=useRef([]);
  const dnd=useDnd(basket,setBasket);

  const addToBasket=food=>{if(basket.find(f=>f.id===food.id))return;setBasket(p=>[...p,food]);};
  const confirmBasket=()=>{
    if(!basket.length)return;
    const tot=basket.reduce((s,f)=>({cal:s.cal+f.cal,p:s.p+f.p,c:s.c+f.c,f:s.f+f.f}),{cal:0,p:0,c:0,f:0});
    onCustom({name:basket.map(f=>f.name).join(' + '),...tot,type:'snack'});
    setBasket([]);
  };

  return(
    <main style={{padding:14,display:'flex',flexDirection:'column',gap:12}}>
      <h2 style={{margin:0,fontSize:18,fontWeight:700,color:COLORS.primaryDark}}>🥗 יומן תזונה</h2>
      <section style={S.card}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:8,textAlign:'center'}}>
          {[['קק״ל',cal,profile.dailyCalorieGoal,COLORS.primaryDark],['חלבון',prot,profile.dailyProteinGoal,'#B88968'],['פחמ׳',carb,profile.dailyCarbGoal,COLORS.primaryDark],['שומן',fat,profile.dailyFatGoal,COLORS.sky]].map(([l,v,g,c])=>(
            <div key={l}>
              <p style={{margin:0,fontSize:12,fontWeight:700,color:c,lineHeight:1.2}}>{v}/{g}{l!=='קק״ל'?'g':''}</p>
              <p style={{margin:'2px 0 0',fontSize:10,color:COLORS.textMuted}}>{l}</p>
            </div>
          ))}
        </div>
      </section>

      <div style={{display:'flex',gap:4,background:'white',border:`1px solid ${COLORS.border}`,borderRadius:10,padding:4}}>
        {[['plan','📋 תפריט'],['drag','👆 גרירה'],['custom','✏️ ידני']].map(([id,lbl])=>(
          <button key={id} onClick={()=>setMode(id)} style={{flex:1,background:mode===id?COLORS.primary:'transparent',color:mode===id?'white':COLORS.text,border:'none',borderRadius:8,padding:'8px 4px',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>{lbl}</button>
        ))}
      </div>

      {mode==='plan'&&(
        <ClientMealPlanView
          clientId={profile.id}
          onLogMeal={() => {
            // טריגר רענון ארוחות אחרי לוג
            window.location.hash = '#refreshMeals';
            setTimeout(() => { window.location.hash = ''; }, 100);
          }}
        />
      )}

      {mode==='drag'&&(
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <FoodSearchAndLibrary basket={basket} addToBasket={addToBasket} />
          <section onDragOver={e=>e.preventDefault()} onDrop={e=>{const food=FOOD_LIB.find(f=>f.id===e.dataTransfer.getData('fid'));if(food)addToBasket(food);}}
            style={{...S.card,minHeight:110,borderStyle:'dashed',borderColor:COLORS.primary,background:COLORS.primarySoft}}>
            <h4 style={{margin:'0 0 8px',fontSize:13,fontWeight:700,color:COLORS.primaryDark}}>🍽️ הארוחה שלי</h4>
            {basket.length===0
              ?<p style={{textAlign:'center',color:COLORS.textMuted,fontSize:12,padding:'16px 0'}}>גרורי פריטים לכאן</p>
              :(
                <>
                  {basket.map((food,i)=>(
                    <div key={food.id} ref={el=>bRefs.current[i]=el} draggable onDragStart={()=>dnd.onDragStart(i)} onDragOver={e=>dnd.onDragOver(e,i)} onDrop={dnd.onDrop} onTouchStart={e=>dnd.onTouchStart(e,i)} onTouchMove={e=>dnd.onTouchMove(e,bRefs)} onTouchEnd={dnd.onTouchEnd}
                      style={{display:'flex',alignItems:'center',gap:8,padding:'6px 8px',background:'white',borderRadius:8,marginBottom:6,cursor:'grab'}}>
                      <span style={{fontSize:14,color:COLORS.textMuted}}>⠿</span><span>{food.icon}</span>
                      <p style={{margin:0,fontSize:12,fontWeight:600,flex:1}}>{food.name}</p>
                      <span style={{fontSize:11,color:COLORS.textMuted}}>{food.cal} קק״ל</span>
                      <button onClick={()=>setBasket(p=>p.filter(f=>f.id!==food.id))} style={{background:'transparent',border:'none',cursor:'pointer',fontSize:14,color:COLORS.accentDark}}>✕</button>
                    </div>
                  ))}
                  <div style={{borderTop:`1px dashed ${COLORS.border}`,marginTop:8,paddingTop:8,fontSize:12,color:COLORS.textMuted,display:'flex',justifyContent:'space-between'}}>
                    <span>סה״כ: {basket.reduce((s,f)=>s+f.cal,0)} קק״ל</span>
                    <span>חלבון: {basket.reduce((s,f)=>s+f.p,0)}g</span>
                  </div>
                  <button onClick={confirmBasket} style={{...S.btn,marginTop:10,fontSize:13}}>✅ רשמי ארוחה זו</button>
                </>
              )
            }
          </section>
        </div>
      )}

      {mode==='custom'&&<CustomMealForm onLog={onCustom}/>}

      {meals.length>0&&(
        <section style={S.card}>
          <h4 style={{margin:'0 0 10px',fontSize:13,fontWeight:700,color:COLORS.primaryDark}}>✅ רשמתי היום ({meals.length})</h4>
          {meals.map(m=>(
            <div key={m.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:`1px solid ${COLORS.border}`}}>
              <div>
                <p style={{margin:0,fontSize:13,fontWeight:600}}>{m.name}</p>
                <p style={{margin:'2px 0 0',fontSize:10,color:COLORS.textMuted}}>{m.time} · {m.cal} קק״ל</p>
              </div>
              <button onClick={()=>onRemove(m.id)} style={{background:'transparent',border:'none',cursor:'pointer',fontSize:16,color:COLORS.accentDark}}>🗑️</button>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}

/* ══ WORKOUT SCREEN ══ */
function WorkoutScreen({exs,setExs,onToggle,onFinish,done,showToast,onStartGuided}){
  const[timer,setTimer]=useState(0);
  const[timerOn,setTimerOn]=useState(false);
  const[activeEx,setActiveEx]=useState(null);
  const[showLib,setShowLib]=useState(false);
  const[exFavorites,setExFavorites]=useState([]);
  const[showFavsOnly,setShowFavsOnly]=useState(false);
  const iRef=useRef(null);
  const eRefs=useRef([]);
  const dnd=useDnd(exs,setExs);
  const total=exs.length;
  const pct=total?Math.round(done/total*100):0;
  
  // טען מועדפים מ-localStorage
  useEffect(()=>{
    try{
      const saved=localStorage.getItem('sappir_ex_favorites');
      if(saved)setExFavorites(JSON.parse(saved));
    }catch(e){}
  },[]);
  
  const toggleExFav=(exId,e)=>{
    e?.stopPropagation();
    const isFav=exFavorites.includes(exId);
    const newFavs=isFav?exFavorites.filter(id=>id!==exId):[...exFavorites,exId];
    setExFavorites(newFavs);
    try{localStorage.setItem('sappir_ex_favorites',JSON.stringify(newFavs));}catch(e){}
  };
  
  const filteredLib=showFavsOnly?EX_LIB.filter(ex=>exFavorites.includes(ex.id)):EX_LIB;

  useEffect(()=>{
    if(timerOn&&timer>0)iRef.current=setInterval(()=>setTimer(t=>t-1),1000);
    else if(timer===0&&timerOn)setTimerOn(false);
    return()=>clearInterval(iRef.current);
  },[timerOn,timer]);

  const addEx=ex=>{
    if(exs.find(e=>e.name===ex.name))return;
    setExs(p=>[...p,{...ex,id:Date.now(),done:false}]);
    setShowLib(false);
  };

  return(
    <main style={{padding:14,display:'flex',flexDirection:'column',gap:12}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <h2 style={{margin:0,fontSize:18,fontWeight:700,color:COLORS.primaryDark}}>💪 אימון היום</h2>
          <p style={{margin:'2px 0 0',fontSize:12,color:COLORS.textMuted}}>גרורי לשינוי סדר · ⠿ = גרור</p>
        </div>
        <button onClick={()=>setShowLib(s=>!s)} style={{background:COLORS.primary,color:'white',border:'none',padding:'8px 14px',borderRadius:10,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
          {showLib?'✕ סגור':'+ תרגיל'}
        </button>
      </div>

      {/* 🏋️ כפתור אימון מובנה עם טיימר */}
      {exs.length > 0 && onStartGuided && (
        <button onClick={onStartGuided} style={{
          width: '100%',
          background: 'linear-gradient(135deg, #B19CD9 0%, #8B72B5 100%)',
          color: 'white', border: 'none', padding: '14px',
          borderRadius: '12px', fontSize: '14px', fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: '0 4px 12px rgba(139, 114, 181, 0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 18 }}>🏋️</span>
          התחילי אימון מובנה (עם טיימר מנוחה)
        </button>
      )}

      <section style={S.card}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
          <span style={{fontSize:13,fontWeight:600}}>התקדמות</span>
          <span style={{fontSize:13,fontWeight:700,color:COLORS.primaryDark}}>{done}/{total}</span>
        </div>
        <div style={{height:10,background:COLORS.primarySoft,borderRadius:99,overflow:'hidden'}}>
          <div style={{height:'100%',width:`${pct}%`,background:done===total?COLORS.mint:COLORS.primary,transition:'width 0.3s'}}/>
        </div>
      </section>

      {timerOn&&(
        <section style={{...S.card,background:COLORS.amberSoft,borderColor:COLORS.amber,textAlign:'center'}}>
          <p style={{margin:'0 0 4px',fontSize:11,color:'#8B6914',fontWeight:600}}>⏱️ מנוחה</p>
          <p style={{margin:0,fontSize:36,fontWeight:700,color:'#8B6914',fontFamily:'monospace'}}>
            {String(Math.floor(timer/60)).padStart(2,'0')}:{String(timer%60).padStart(2,'0')}
          </p>
          <button onClick={()=>{setTimerOn(false);setTimer(0);}} style={{marginTop:6,background:'transparent',border:'1px solid #8B6914',color:'#8B6914',padding:'4px 14px',borderRadius:8,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>דלגי</button>
        </section>
      )}

      {showLib&&(
        <section style={S.card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <h4 style={{margin:0,fontSize:13,fontWeight:700,color:COLORS.primaryDark}}>📚 הוסיפי תרגיל</h4>
            <button onClick={()=>setShowFavsOnly(s=>!s)} style={{background:showFavsOnly?'#F5D76E':COLORS.bg,color:showFavsOnly?COLORS.text:COLORS.textMuted,border:`1px solid ${COLORS.border}`,borderRadius:999,padding:'4px 10px',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
              {showFavsOnly?'★ מועדפים':'☆ כל התרגילים'}
            </button>
          </div>
          {filteredLib.length===0?(
            <p style={{textAlign:'center',color:COLORS.textMuted,fontSize:12,padding:'12px 0'}}>אין תרגילים מועדפים עדיין</p>
          ):filteredLib.map(ex=>{
            const isFav=exFavorites.includes(ex.id);
            return(
              <div key={ex.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:`1px solid ${COLORS.border}`}}>
                <button onClick={e=>toggleExFav(ex.id,e)} style={{background:'transparent',border:'none',cursor:'pointer',fontSize:18,padding:4,color:isFav?'#F5D76E':'#D0D0D0',fontFamily:'inherit',lineHeight:1}}>
                  {isFav?'★':'☆'}
                </button>
                <span style={{fontSize:20}}>{ex.icon}</span>
                <div style={{flex:1}}>
                  <p style={{margin:0,fontSize:13,fontWeight:600}}>{ex.name}</p>
                  <p style={{margin:0,fontSize:11,color:COLORS.textMuted}}>{ex.sets}×{ex.reps}</p>
                </div>
                <button onClick={()=>addEx(ex)} style={{background:COLORS.primary,color:'white',border:'none',padding:'5px 12px',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>+ הוסף</button>
              </div>
            );
          })}
        </section>
      )}

      {exs.map((ex,i)=>(
        <section key={ex.id} ref={el=>eRefs.current[i]=el} draggable
          onDragStart={()=>dnd.onDragStart(i)} onDragOver={e=>dnd.onDragOver(e,i)} onDrop={dnd.onDrop}
          onTouchStart={e=>dnd.onTouchStart(e,i)} onTouchMove={e=>dnd.onTouchMove(e,eRefs)} onTouchEnd={dnd.onTouchEnd}
          style={{...S.card,borderColor:ex.done?COLORS.mint:COLORS.border,background:ex.done?COLORS.mintSoft:'white',cursor:'grab'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:16,color:COLORS.textMuted}}>⠿</span>
            <button onClick={()=>onToggle(ex.id)} style={{background:ex.done?COLORS.mint:'white',border:`2px solid ${ex.done?COLORS.mint:COLORS.border}`,borderRadius:'50%',width:32,height:32,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,color:'white',fontFamily:'inherit',flexShrink:0}}>
              {ex.done?'✓':''}
            </button>
            <div style={{flex:1}}>
              <p style={{margin:0,fontSize:14,fontWeight:700,textDecoration:ex.done?'line-through':'none',color:COLORS.text}}>{ex.icon} {ex.name}</p>
              <p style={{margin:'2px 0 0',fontSize:11,color:COLORS.textMuted}}>{ex.sets} סטים × {ex.reps} · מנוחה {ex.rest} שנ׳</p>
            </div>
            <button onClick={()=>setExs(p=>p.filter(e=>e.id!==ex.id))} style={{background:'transparent',border:'none',cursor:'pointer',fontSize:14,color:COLORS.accentDark}}>🗑️</button>
          </div>
          <div style={{display:'flex',gap:6,marginTop:10}}>
            {ex.videoUrl && <button onClick={()=>setActiveEx(activeEx===ex.id?null:ex.id)} style={{flex:1,background:COLORS.primarySoft,color:COLORS.primaryDark,border:`1px solid ${COLORS.border}`,padding:8,borderRadius:8,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>📺 {activeEx===ex.id?'סגור':'סרטון'}</button>}
            <button onClick={()=>{setTimer(ex.rest);setTimerOn(true);}} style={{flex:1,background:COLORS.amberSoft,color:'#8B6914',border:`1px solid ${COLORS.amber}`,padding:8,borderRadius:8,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>⏱️ טיימר</button>
          </div>
          {ex.notes && <p style={{margin:'8px 0 0',padding:8,background:COLORS.primarySoft,borderRadius:8,fontSize:11,color:COLORS.text,fontStyle:'italic'}}>💡 {ex.notes}</p>}
          {activeEx===ex.id&&ex.videoUrl&&(
            <div style={{marginTop:10,background:'black',borderRadius:10,overflow:'hidden',position:'relative'}}>
              {(()=>{
                const url = ex.videoUrl;
                // YouTube
                let videoId = '';
                if (url.includes('youtube.com/watch?v=')) videoId = url.split('v=')[1]?.split('&')[0];
                else if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1]?.split('?')[0];
                else if (url.includes('youtube.com/shorts/')) videoId = url.split('shorts/')[1]?.split('?')[0];
                
                if (videoId) {
                  return <iframe width="100%" height="220" src={`https://www.youtube.com/embed/${videoId}`} title={ex.name} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{display:'block'}}></iframe>;
                }
                // Direct video (mp4)
                if (url.match(/\.(mp4|webm|mov)$/i)) {
                  return <video controls width="100%" style={{display:'block',maxHeight:240}}><source src={url} /></video>;
                }
                // Fallback - open in new tab
                return (
                  <div style={{padding:20,textAlign:'center',color:'white'}}>
                    <a href={url} target="_blank" rel="noopener noreferrer" style={{color:'white',textDecoration:'underline',fontSize:13}}>
                      ▶️ פתחי את הסרטון בכרטיסייה חדשה
                    </a>
                  </div>
                );
              })()}
            </div>
          )}
        </section>
      ))}

      <ClientSpringButton onClick={onFinish} haptic="success" style={{...S.btn,background:done===total?COLORS.mint:COLORS.primary}}>
        {done===total?'🎉 סיימתי אימון!':`סיימתי (${done}/${total})`}
      </ClientSpringButton>
    </main>
  );
}

/* ══ STATS SCREEN ══ */
function StatsScreen({weights,profile,onLog,onDel,onOpenPhotos}){
  const[nw,setNw]=useState('');
  const[photos,setPhotos]=useState([]);
  const[uploading,setUploading]=useState(false);
  const[photoLabel,setPhotoLabel]=useState('');
  const fileInputRef=useRef(null);
  const sorted=[...weights].sort((a,b)=>a.id-b.id);
  const minW=sorted.length?Math.min(...sorted.map(w=>w.w),profile.target)-1:60;
  const maxW=sorted.length?Math.max(...sorted.map(w=>w.w))+1:80;
  const range=maxW-minW||1;
  const W=310,H=120,pad={t:14,r:8,b:20,l:24};
  const pW=W-pad.l-pad.r,pH=H-pad.t-pad.b;
  const xS=sorted.length>1?pW/(sorted.length-1):pW;
  const yF=w=>pad.t+pH-((w-minW)/range)*pH;
  const pathD=sorted.map((p,i)=>`${i===0?'M':'L'} ${pad.l+i*xS} ${yF(p.w)}`).join(' ');

  // טען תמונות קיימות
  useEffect(()=>{
    loadPhotos();
  },[]);

  const loadPhotos=async()=>{
    const{data:{user}}=await supabase.auth.getUser();
    if(!user)return;
    const{data}=await supabase.from('progress_photos').select('*').eq('client_id',user.id).order('created_at',{ascending:false});
    if(data)setPhotos(data);
  };

  // העלאת תמונה ל-Supabase Storage
  const handleFileUpload=async(e)=>{
    const file=e.target.files?.[0];
    if(!file)return;
    
    // בדוק גודל - מקסימום 5MB
    if(file.size>5*1024*1024){
      alert('התמונה גדולה מדי (מקסימום 5MB)');
      return;
    }

    setUploading(true);
    const{data:{user}}=await supabase.auth.getUser();
    if(!user){setUploading(false);return;}

    // שם ייחודי לקובץ
    const ext=file.name.split('.').pop();
    const fileName=`${user.id}/${Date.now()}.${ext}`;

    // העלה ל-storage
    const{error:upErr}=await supabase.storage
      .from('progress-photos')
      .upload(fileName,file,{cacheControl:'3600',upsert:false});

    if(upErr){
      console.error('Upload error:',upErr);
      alert('שגיאה בהעלאה: '+upErr.message);
      setUploading(false);
      return;
    }

    // קבל URL ציבורי
    const{data:urlData}=supabase.storage.from('progress-photos').getPublicUrl(fileName);

    // שמור רשומה ב-DB
    const{data:newPhoto,error:dbErr}=await supabase.from('progress_photos').insert({
      client_id:user.id,
      photo_url:urlData.publicUrl,
      storage_path:fileName,
      label:photoLabel.trim()||null,
    }).select();

    if(dbErr){
      console.error('DB error:',dbErr);
      alert('שגיאה בשמירה: '+dbErr.message);
    }else if(newPhoto?.[0]){
      setPhotos(prev=>[newPhoto[0],...prev]);
      setPhotoLabel('');
    }

    setUploading(false);
    if(fileInputRef.current)fileInputRef.current.value='';
  };

  // מחיקת תמונה
  const deletePhoto=async(photo)=>{
    if(!confirm('למחוק את התמונה?'))return;
    
    // מחק מ-storage
    if(photo.storage_path){
      await supabase.storage.from('progress-photos').remove([photo.storage_path]);
    }
    // מחק מ-DB
    await supabase.from('progress_photos').delete().eq('id',photo.id);
    setPhotos(prev=>prev.filter(p=>p.id!==photo.id));
  };

  return(
    <main style={{padding:14,display:'flex',flexDirection:'column',gap:12}}>
      <h2 style={{margin:0,fontSize:18,fontWeight:700,color:COLORS.primaryDark}}>📊 התקדמות</h2>
      <section style={S.card}>
        <h4 style={{margin:'0 0 10px',fontSize:14,fontWeight:700}}>⚖️ עדכן משקל</h4>
        <div style={{display:'flex',gap:10}}>
          <input type="number" value={nw} onChange={e=>setNw(e.target.value)} placeholder={`${profile.weight}`} style={{...S.inp,flex:1,direction:'ltr',textAlign:'right'}}/>
          <ClientSpringButton onClick={()=>{if(nw){onLog(nw);setNw('');}}} haptic="success" style={{background:COLORS.primary,color:'white',border:'none',padding:'10px 20px',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>שמור</ClientSpringButton>
        </div>
        <p style={{margin:'6px 0 0',fontSize:11,color:COLORS.textMuted}}>נוכחי: {profile.weight} ק״ג · יעד: {profile.target} ק״ג</p>
      </section>

      {/* 📊 דוח שבועי */}
      <WeeklyReportCard clientId={profile.id} />

      {/* 📸 כפתור גלריית תמונות */}
      <button onClick={onOpenPhotos} style={{
        width: '100%', background: 'linear-gradient(135deg, #B19CD9 0%, #F4C2C2 100%)',
        color: 'white', border: 'none', padding: 14, borderRadius: 12,
        fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        boxShadow: '0 4px 12px rgba(139, 114, 181, 0.3)',
      }}>
        📸 תמונות התקדמות
      </button>

      {sorted.length>=2&&(
        <section style={S.card}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
            <h4 style={{margin:0,fontSize:14,fontWeight:700}}>גרף משקל</h4>
            <span style={{fontSize:13,fontWeight:700,color:COLORS.primary}}>↓ {(sorted[0].w-sorted[sorted.length-1].w).toFixed(1)} ק״ג</span>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:'auto'}}>
            <line x1={pad.l} y1={yF(profile.target)} x2={W-pad.r} y2={yF(profile.target)} stroke={COLORS.primarySoft} strokeDasharray="4 4" strokeWidth="1.5"/>
            <path d={pathD} stroke={COLORS.primaryDark} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            {sorted.map((p,i)=>(
              <g key={i}>
                <circle cx={pad.l+i*xS} cy={yF(p.w)} r="5" fill="white" stroke={COLORS.primaryDark} strokeWidth="2.5"/>
                <text x={pad.l+i*xS} y={H-4} fontSize="8" fill={COLORS.textMuted} textAnchor="middle">{p.date}</text>
              </g>
            ))}
          </svg>
        </section>
      )}

      <section style={S.card}>
        <h4 style={{margin:'0 0 10px',fontSize:13,fontWeight:700}}>היסטוריה</h4>
        {[...sorted].reverse().map((w,i,arr)=>{
          const prev=arr[i+1];
          const diff=prev?+(w.w-prev.w).toFixed(1):null;
          return(
            <div key={w.id} style={{display:'flex',alignItems:'center',gap:10,padding:10,background:i===0?COLORS.primarySoft:'white',borderRadius:10,marginBottom:6,border:`1px solid ${COLORS.border}`}}>
              <button onClick={()=>onDel(w.id)} style={{background:'transparent',border:'none',cursor:'pointer',fontSize:16,color:COLORS.textMuted}}>🗑️</button>
              <p style={{margin:0,fontSize:11,color:COLORS.textMuted,flex:1}}>{w.date}</p>
              <p style={{margin:0,fontSize:16,fontWeight:700}}>{w.w} ק״ג</p>
              {diff!==null&&<span style={{fontSize:11,color:diff<0?COLORS.primaryDark:COLORS.accentDark,fontWeight:600}}>{diff>0?'+':''}{diff}</span>}
            </div>
          );
        })}
      </section>

      {/* 📸 תמונות התקדמות */}
      <section style={S.card}>
        <h4 style={{margin:'0 0 10px',fontSize:14,fontWeight:700}}>📸 תמונות התקדמות</h4>
        
        <input 
          value={photoLabel} 
          onChange={e=>setPhotoLabel(e.target.value)} 
          placeholder="תווית (אופציונלי) - למשל: לפני, אחרי, חודש 1" 
          style={{...S.inp,marginBottom:8,fontSize:12}}
        />
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleFileUpload}
          style={{display:'none'}}
        />
        <button 
          onClick={()=>fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            width:'100%',
            background:uploading?COLORS.primarySoft:COLORS.primary,
            color:uploading?COLORS.primaryDark:'white',
            border:'none',padding:12,borderRadius:10,fontSize:13,fontWeight:700,
            cursor:uploading?'default':'pointer',fontFamily:'inherit',marginBottom:12
          }}
        >
          {uploading?'מעלה...':'📸 הוסיפי תמונה'}
        </button>

        {photos.length===0?(
          <p style={{textAlign:'center',color:COLORS.textMuted,fontSize:12,padding:'20px 0'}}>
            עדיין אין תמונות. הוסיפי תמונה ראשונה למעקב 💜
          </p>
        ):(
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            {photos.map(p=>(
              <div key={p.id} style={{position:'relative',aspectRatio:'3/4',borderRadius:10,overflow:'hidden',border:`1px solid ${COLORS.border}`}}>
                <img 
                  src={p.photo_url} 
                  alt={p.label||'תמונה'}
                  style={{width:'100%',height:'100%',objectFit:'cover',display:'block',cursor:'pointer'}}
                  onClick={()=>window.open(p.photo_url,'_blank')}
                />
                <button 
                  onClick={()=>deletePhoto(p)}
                  style={{position:'absolute',top:4,left:4,background:'rgba(0,0,0,0.5)',color:'white',border:'none',width:26,height:26,borderRadius:'50%',cursor:'pointer',fontSize:12}}
                >🗑️</button>
                {p.label&&(
                  <span style={{position:'absolute',top:4,right:4,background:'white',fontSize:10,fontWeight:600,padding:'2px 6px',borderRadius:4,color:COLORS.primaryDark}}>
                    {p.label}
                  </span>
                )}
                <span style={{position:'absolute',bottom:4,left:4,right:4,background:'rgba(0,0,0,0.6)',color:'white',fontSize:10,padding:'2px 4px',borderRadius:4,textAlign:'center'}}>
                  {new Date(p.created_at).toLocaleDateString('he-IL',{day:'numeric',month:'numeric',year:'2-digit'})}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

/* ══ MESSAGES SCREEN ══ */
function MessagesScreen({messages,onSend,userId}){
  const[txt,setTxt]=useState('');
  const ref=useRef(null);
  useEffect(()=>{ref.current?.scrollTo(0,ref.current.scrollHeight);},[messages]);
  const send=()=>{if(!txt.trim())return;onSend(txt.trim());setTxt('');};
  const sendVoice = (voice) => onSend(null, voice);
  return(
    <main style={{padding:14,display:'flex',flexDirection:'column',height:'calc(100vh - 160px)',gap:12}}>
      <h2 style={{margin:0,fontSize:18,fontWeight:700,color:COLORS.primaryDark}}>💬 שיחה עם ספיר</h2>
      <section ref={ref} style={{...S.card,flex:1,overflowY:'auto',padding:12,display:'flex',flexDirection:'column',gap:8}}>
        {messages.length===0&&<p style={{textAlign:'center',color:COLORS.textMuted,fontSize:13,margin:'auto 0'}}>עדיין אין הודעות</p>}
        {messages.map(m=>{
          const isMe = m.from === 'client';
          const isVoice = m.message_type === 'voice' || m.audio_url;
          return (
            <div key={m.id} style={{maxWidth:'82%',padding:'9px 12px',borderRadius:14,fontSize:13,lineHeight:1.5,alignSelf:isMe?'flex-end':'flex-start',background:isMe?COLORS.primary:COLORS.primarySoft,color:isMe?'white':COLORS.text}}>
              {isVoice
                ? <VoiceMessagePlayer url={m.audio_url} duration={m.audio_duration_sec} isFromMe={isMe}/>
                : <p style={{margin:0}}>{m.text}</p>
              }
              <p style={{margin:'3px 0 0',fontSize:10,opacity:0.7}}>{m.time}</p>
            </div>
          );
        })}
      </section>
      <div style={{display:'flex',gap:6}}>
        <VoiceRecorderButton userId={userId} onSend={sendVoice} />
        <input value={txt} onChange={e=>setTxt(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="כתבי הודעה..." style={{...S.inp,flex:1}}/>
        <ClientSpringButton onClick={send} haptic="success" disabled={!txt.trim()} style={{background:COLORS.primary,color:'white',border:'none',padding:'10px 18px',borderRadius:10,fontSize:13,fontWeight:600,cursor:txt.trim()?'pointer':'default',opacity:txt.trim()?1:0.4,fontFamily:'inherit'}}>שלחי</ClientSpringButton>
      </div>
    </main>
  );
}

/* ══ SETTINGS SCREEN ══ */
function SettingsScreen({profile,showToast,onLogout}){
  const [name, setName] = useState(profile.full_name || '');
  const [kosher, setKosher] = useState(profile.kosher || false);
  const [saving, setSaving] = useState(false);
  const [isDark, setIsDark] = React.useState(
    () => document.documentElement.getAttribute('data-theme') === 'dark'
  );

  const toggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    try { localStorage.setItem('sappir-theme', next ? 'dark' : 'light'); } catch {}
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('clients')
      .update({ full_name: name, kosher })
      .eq('id', profile.id);
    setSaving(false);
    if (error) {
      showToast('❌ שגיאה בשמירה');
    } else {
      showToast('💾 שינויים נשמרו');
    }
  };

  const handleKosherToggle = async () => {
    const newVal = !kosher;
    setKosher(newVal);
    await supabase.from('clients').update({ kosher: newVal }).eq('id', profile.id);
  };

  return(
    <main style={{padding:14,display:'flex',flexDirection:'column',gap:12}}>
      <h2 style={{margin:0,fontSize:18,fontWeight:700,color:COLORS.primaryDark}}>⚙️ הגדרות</h2>
      <section style={S.card}>
        <h4 style={{margin:'0 0 14px',fontSize:14,fontWeight:700}}>פרטים אישיים</h4>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
          <div>
            <p style={{margin:'0 0 4px',fontSize:12,fontWeight:600}}>שם</p>
            <input value={name} onChange={(e)=>setName(e.target.value)} style={S.inp}/>
          </div>
          <div>
            <p style={{margin:'0 0 4px',fontSize:12,fontWeight:600}}>אימייל</p>
            <input value={profile.email||''} disabled style={{...S.inp,direction:'ltr',textAlign:'right',background:'#F8F6FB',color:COLORS.textMuted}}/>
          </div>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:`1px solid ${COLORS.border}`}}>
          <div>
            <p style={{margin:0,fontSize:14,fontWeight:700}}>כשר</p>
            <p style={{margin:'2px 0 0',fontSize:11,color:COLORS.textMuted}}>מתכונים כשרים בלבד</p>
          </div>
          <button onClick={handleKosherToggle} style={{width:48,height:28,borderRadius:14,border:'none',cursor:'pointer',background:kosher?COLORS.primary:COLORS.border,position:'relative',transition:'background 0.2s'}}>
            <div style={{width:22,height:22,borderRadius:'50%',background:'white',position:'absolute',top:3,transition:'all 0.2s',...(kosher?{left:3,right:'auto'}:{right:3,left:'auto'})}}/>
          </button>
        </div>

        {/* 🌙 Dark Mode Toggle */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:`1px solid ${COLORS.border}`}}>
          <div>
            <p style={{margin:0,fontSize:14,fontWeight:700}}>{isDark ? '🌙 מצב כהה' : '☀️ מצב בהיר'}</p>
            <p style={{margin:'2px 0 0',fontSize:11,color:COLORS.textMuted}}>לחצי לשינוי מצב תצוגה</p>
          </div>
          <button onClick={toggleDark} style={{width:48,height:28,borderRadius:14,border:'none',cursor:'pointer',background:isDark?COLORS.primaryDark:'#C0B0D8',position:'relative',transition:'background 0.25s'}}>
            <div style={{width:22,height:22,borderRadius:'50%',background:'white',position:'absolute',top:3,transition:'left 0.25s cubic-bezier(0.34,1.56,0.64,1)',left:isDark?22:3}}/>
          </button>
        </div>

        <button onClick={handleSave} disabled={saving} style={{...S.btn,marginTop:14,opacity:saving?0.6:1}}>
          {saving?'שומרת...':'שמור שינויים'}
        </button>
      </section>

      {/* 🔔 הגדרות תזכורות */}
      <NotificationSettings />

      <section style={S.card}>
        <button onClick={onLogout} style={{width:'100%',background:'white',color:'#C88A8A',border:'1px solid #E8A5A5',padding:12,borderRadius:12,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>🚪 התנתקי</button>
      </section>
    </main>
  );
}

/* ══ CUSTOM MEAL FORM ══ */
function CustomMealForm({onLog}){
  const[name,setName]=useState('');
  const[cal,setCal]=useState('');
  const[p,setP]=useState('');
  const[c,setC]=useState('');
  const[f,setF]=useState('');
  const[type,setType]=useState('snack');
  const[showScanner,setShowScanner]=useState(false);
  const[showPhotoAI,setShowPhotoAI]=useState(false);
  const[lookingUp,setLookingUp]=useState(false);
  const[lookupError,setLookupError]=useState('');
  const[lookupSuccess,setLookupSuccess]=useState(false);
  const ok=name.trim()&&cal;

  const submit=()=>{
    onLog({type,name:name.trim(),cal:+cal,p:+p||0,c:+c||0,f:+f||0});
    setName('');setCal('');setP('');setC('');setF('');
    setLookupSuccess(false);
  };

  const handleBarcodeDetected = async (barcode) => {
    setShowScanner(false);
    setLookingUp(true);
    setLookupError('');
    setLookupSuccess(false);

    try {
      // נסה קודם במאגר המקומי
      const { data: local } = await supabase
        .from('food_database')
        .select('*')
        .eq('barcode', barcode)
        .limit(1);

      let food = local && local.length > 0 ? local[0] : null;

      // אם לא נמצא - חפש ב-Open Food Facts
      if (!food) {
        const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
        if (res.ok) {
          const json = await res.json();
          if (json.status === 1 && json.product) {
            const prod = json.product;
            const n = prod.nutriments || {};
            const productName = prod.product_name_he || prod.product_name || prod.product_name_en;
            if (productName) {
              food = {
                name: productName + (prod.brands ? ` (${prod.brands})` : ''),
                kcal_per_100g: parseFloat(n['energy-kcal_100g']) || 0,
                protein_per_100g: parseFloat(n.proteins_100g) || 0,
                carbs_per_100g: parseFloat(n.carbohydrates_100g) || 0,
                fat_per_100g: parseFloat(n.fat_100g) || 0,
              };

              // שמור למטמון
              try {
                await supabase.from('food_database').upsert({
                  source: 'off',
                  source_id: barcode,
                  barcode,
                  name: productName,
                  brand: prod.brands || null,
                  image_url: prod.image_thumb_url || null,
                  kcal_per_100g: food.kcal_per_100g,
                  protein_per_100g: food.protein_per_100g,
                  carbs_per_100g: food.carbs_per_100g,
                  fat_per_100g: food.fat_per_100g,
                }, { onConflict: 'source,source_id' });
              } catch {}
            }
          }
        }
      }

      if (!food) {
        setLookupError(`לא נמצא מוצר עם ברקוד ${barcode}. הזיני ידנית.`);
        return;
      }

      setName(food.name);
      setCal(String(Math.round(food.kcal_per_100g || 0)));
      setP(String(Math.round(food.protein_per_100g || 0)));
      setC(String(Math.round(food.carbs_per_100g || 0)));
      setF(String(Math.round(food.fat_per_100g || 0)));
      setLookupSuccess(true);
    } catch (e) {
      setLookupError('שגיאה: ' + (e.message || 'נסי שוב'));
    } finally {
      setLookingUp(false);
    }
  };

  return(
    <section style={S.card}>
      <p style={{fontSize:12,color:COLORS.textMuted,margin:'0 0 12px'}}>רשמי ארוחה שאינה בתפריט:</p>

      {/* כפתורי AI ו-ברקוד */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
        <button
          onClick={()=>setShowPhotoAI(true)}
          disabled={lookingUp}
          style={{
            background:'linear-gradient(135deg,#F4C2C2 0%,#B19CD9 100%)',
            color:'white',border:'none',padding:14,borderRadius:12,
            fontSize:13,fontWeight:700,cursor:lookingUp?'default':'pointer',
            fontFamily:'inherit',
            display:'flex',alignItems:'center',justifyContent:'center',gap:6,
            opacity:lookingUp?0.6:1,
          }}
        >
          <span style={{fontSize:18}}>✨</span>
          <span>צלמי ארוחה</span>
        </button>

        <button
          onClick={()=>setShowScanner(true)}
          disabled={lookingUp}
          style={{
            background:'linear-gradient(135deg,#B19CD9 0%,#8B72B5 100%)',
            color:'white',border:'none',padding:14,borderRadius:12,
            fontSize:13,fontWeight:700,cursor:lookingUp?'default':'pointer',
            fontFamily:'inherit',
            display:'flex',alignItems:'center',justifyContent:'center',gap:6,
            opacity:lookingUp?0.6:1,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
            <line x1="4" y1="6" x2="4" y2="18" />
            <line x1="7" y1="6" x2="7" y2="18" />
            <line x1="10" y1="6" x2="10" y2="18" strokeWidth="3" />
            <line x1="14" y1="6" x2="14" y2="18" />
            <line x1="17" y1="6" x2="17" y2="18" strokeWidth="3" />
            <line x1="20" y1="6" x2="20" y2="18" />
          </svg>
          <span>{lookingUp?'מחפשת...':'ברקוד'}</span>
        </button>
      </div>

      {lookupError && (
        <div style={{
          background:'#FADDDD',borderRadius:8,padding:10,
          marginBottom:10,fontSize:12,color:'#8B4040',
        }}>{lookupError}</div>
      )}

      {lookupSuccess && (
        <div style={{
          background:'#E0F2EB',borderRadius:8,padding:10,
          marginBottom:10,fontSize:12,color:'#3D7A5E',fontWeight:600,
        }}>✅ נמצא מוצר! בדקי את הפרטים ולחצי על "+ רשמי ארוחה"</div>
      )}

      <div style={{marginBottom:10}}>
        <label style={{fontSize:11,fontWeight:600,display:'block',marginBottom:4}}>שם האוכל</label>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="לדוגמה: תפוח" style={S.inp}/>
      </div>
      <div style={{marginBottom:10}}>
        <label style={{fontSize:11,fontWeight:600,display:'block',marginBottom:4}}>סוג ארוחה</label>
        <div style={{display:'flex',gap:4}}>
          {[['breakfast','🌅'],['lunch','🌞'],['dinner','🌙'],['snack','🍎']].map(([id,icon])=>(
            <button key={id} onClick={()=>setType(id)} style={{flex:1,background:type===id?COLORS.primary:COLORS.primarySoft,color:type===id?'white':COLORS.text,border:'none',borderRadius:8,padding:10,fontSize:18,cursor:'pointer',fontFamily:'inherit'}}>{icon}</button>
          ))}
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
        {[['קלוריות',cal,setCal,'200'],['חלבון (g)',p,setP,'10']].map(([l,v,s,ph])=>(
          <div key={l}><label style={{fontSize:11,fontWeight:600,display:'block',marginBottom:4}}>{l}</label>
            <input type="number" value={v} onChange={e=>s(e.target.value)} placeholder={ph} style={{...S.inp,direction:'ltr',textAlign:'right'}}/></div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
        {[['פחמימות (g)',c,setC,'25'],['שומן (g)',f,setF,'5']].map(([l,v,s,ph])=>(
          <div key={l}><label style={{fontSize:11,fontWeight:600,display:'block',marginBottom:4}}>{l}</label>
            <input type="number" value={v} onChange={e=>s(e.target.value)} placeholder={ph} style={{...S.inp,direction:'ltr',textAlign:'right'}}/></div>
        ))}
      </div>
      <button onClick={submit} disabled={!ok} style={{...S.btn,opacity:ok?1:0.4,cursor:ok?'pointer':'default'}}>+ רשמי ארוחה</button>

      {showScanner && (
        <BarcodeScanner
          onDetect={handleBarcodeDetected}
          onClose={()=>setShowScanner(false)}
        />
      )}

      {showPhotoAI && (
        <MealPhotoAnalyzer
          onConfirm={(meal)=>{
            onLog(meal);
            setShowPhotoAI(false);
          }}
          onClose={()=>setShowPhotoAI(false)}
        />
      )}
    </section>
  );
}

/* ══ AI CHAT ══ */
function AIChat({profile,onClose}){
  const GREETING = {role:'bot',text:`היי ${profile.firstName}! אני תמר. מתמחה בתזונה וכושר, איך אוכל לעזור? 💜`};
  const CHAT_KEY = 'sappir_tamar_chat';
  const CHAT_TIME_KEY = 'sappir_tamar_chat_time';
  const CHAT_EXPIRE_MS = 24 * 60 * 60 * 1000; // 24 שעות
  
  const[msgs,setMsgs]=useState(()=>{
    try {
      const savedTime = localStorage.getItem(CHAT_TIME_KEY);
      if (savedTime && (Date.now() - parseInt(savedTime)) < CHAT_EXPIRE_MS) {
        const saved = localStorage.getItem(CHAT_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } else {
        // פג תוקף
        localStorage.removeItem(CHAT_KEY);
        localStorage.removeItem(CHAT_TIME_KEY);
      }
    } catch(e) {}
    return [GREETING];
  });
  
  const[input,setInput]=useState('');
  const[loading,setLoading]=useState(false);
  const ref=useRef(null);
  
  // שמור שיחה ב-localStorage
  useEffect(()=>{
    if (msgs.length > 1) { // אל תשמור רק ברכה
      try {
        localStorage.setItem(CHAT_KEY, JSON.stringify(msgs));
        localStorage.setItem(CHAT_TIME_KEY, Date.now().toString());
      } catch(e) {}
    }
  },[msgs]);
  
  useEffect(()=>{ref.current?.scrollTo(0,ref.current.scrollHeight);},[msgs,loading]);
  const SUGG=['כמה חלבון לאחר אימון?','מה לאכול לפני אימון?','מזונות עשירים באומגה 3'];
  // חיפוש אוטומטי של מזון אם השאלה מזכירה מאכל
  const detectFoodInQuery = async (query) => {
    const foodKeywords = ['קלוריות', 'חלבון', 'פחמימה', 'שומן', 'ערכים תזונתיים', 'כמה יש', 'מה יש ב', 'מכיל', 'של'];
    const hasKeyword = foodKeywords.some(kw => query.includes(kw));
    if (!hasKeyword) return null;
    
    // חפש את שם המאכל - נסה להוציא את המילה או הביטוי המהותי
    // מחק מילות שאלה נפוצות
    const cleaned = query
      .replace(/כמה|קלוריות|יש|של|חלבון|פחמימות|שומן|מה|\?|,|\./g, ' ')
      .trim();
    
    if (cleaned.length < 2) return null;
    
    try {
      const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(cleaned)}&search_simple=1&action=process&json=1&page_size=3&fields=product_name,product_name_he,brands,nutriments`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      const products = (data.products || []).filter(p => {
        const n = p.nutriments || {};
        return (p.product_name_he || p.product_name) && (n['energy-kcal_100g'] || n.energy_100g);
      }).slice(0, 3);
      
      if (products.length === 0) return null;
      
      const info = products.map(p => {
        const n = p.nutriments || {};
        const cal = Math.round(n['energy-kcal_100g'] || (n.energy_100g ? n.energy_100g / 4.184 : 0));
        const prot = Math.round((n.proteins_100g || 0) * 10) / 10;
        const carbs = Math.round((n.carbohydrates_100g || 0) * 10) / 10;
        const fat = Math.round((n.fat_100g || 0) * 10) / 10;
        const brand = p.brands ? ` (${p.brands.split(',')[0]})` : '';
        return `${p.product_name_he || p.product_name}${brand}: ${cal} קק״ל, חלבון ${prot}g, פחמימות ${carbs}g, שומן ${fat}g (ל-100g)`;
      }).join('\n');
      
      return info;
    } catch(e) {
      console.error('Food lookup error:', e);
      return null;
    }
  };

  const send = async text => {
    const t = (text || input).trim();
    if (!t || loading) return;
    setInput('');
    const next = [...msgs, { role: 'user', text: t }];
    setMsgs(next);
    setLoading(true);
    
    try {
      // נסה לזהות שאלה על מזון ולחפש ב-Open Food Facts
      const foodInfo = await detectFoodInQuery(t);
      
      // הכן את ההודעה - אם מצאנו מידע על מזון, הוסף אותו כ-context
      let systemMsg = AI_SYS;
      if (foodInfo) {
        systemMsg += `\n\nמידע ממאגר Open Food Facts (השתמשי בזה אם רלוונטי):\n${foodInfo}`;
      }
      
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: systemMsg,
          messages: next.filter(m => m.role !== 'error').map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.text
          }))
        })
      });
      
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMsgs([...next, { role: 'bot', text: data.content?.[0]?.text || 'מצטערת, שגיאה.' }]);
    } catch {
      setMsgs([...next, { role: 'error', text: '⚠️ שגיאה. נסי שוב.' }]);
    } finally {
      setLoading(false);
    }
  };
  return(
    <div style={{position:'fixed',bottom:84,left:16,right:16,maxWidth:380,margin:'0 auto',height:460,background:'white',borderRadius:18,display:'flex',flexDirection:'column',zIndex:50,boxShadow:'0 10px 30px rgba(0,0,0,0.2)',border:`1px solid ${COLORS.border}`,direction:'rtl'}}>
      <header style={{background:COLORS.primary,color:'white',padding:'12px 14px',borderRadius:'18px 18px 0 0',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <p style={{fontSize:14,fontWeight:600,margin:0}}>💜 תמר · AI</p>
          <p style={{fontSize:10,opacity:0.75,margin:'2px 0 0'}}>זמינה 24/7 · שיחות ימחקו אחרי 24 שעות</p>
        </div>
        <button onClick={onClose} style={{background:'rgba(255,255,255,0.25)',border:'none',color:'white',width:26,height:26,borderRadius:6,cursor:'pointer',fontSize:13,fontFamily:'inherit'}}>✕</button>
      </header>
      <div ref={ref} style={{flex:1,overflowY:'auto',padding:12,display:'flex',flexDirection:'column',gap:8}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{maxWidth:'85%',padding:'9px 12px',borderRadius:12,fontSize:13,lineHeight:1.6,alignSelf:m.role==='user'?'flex-end':'flex-start',background:m.role==='user'?COLORS.primary:m.role==='error'?'#FFF0F0':'#EFF5F1',color:m.role==='user'?'white':COLORS.text}}>{m.text}</div>
        ))}
        {loading&&<div style={{display:'flex',gap:4,padding:'10px 12px',background:'#EFF5F1',borderRadius:12,alignSelf:'flex-start'}}>{[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:'50%',background:COLORS.primary,animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}</div>}
        {msgs.length===1&&!loading&&<div style={{display:'flex',flexDirection:'column',gap:6,marginTop:4}}>{SUGG.map((s,i)=><button key={i} onClick={()=>send(s)} style={{background:COLORS.primarySoft,border:`1px solid ${COLORS.border}`,borderRadius:20,padding:'7px 12px',fontSize:12,color:COLORS.primaryDark,cursor:'pointer',fontFamily:'inherit',textAlign:'right'}}>{s}</button>)}</div>}
      </div>
      <div style={{padding:10,borderTop:`1px solid ${COLORS.border}`,display:'flex',gap:8}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="שאלי על תזונה..." disabled={loading} style={S.inp}/>
        <button onClick={()=>send()} disabled={!input.trim()||loading} style={{background:COLORS.primary,color:'white',border:'none',padding:'8px 14px',borderRadius:10,fontSize:13,fontWeight:600,cursor:(!input.trim()||loading)?'default':'pointer',opacity:(!input.trim()||loading)?0.4:1,fontFamily:'inherit'}}>שלחי</button>
      </div>
      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`}</style>
    </div>
  );
}

/* ══ FOOD SEARCH & LIBRARY COMPONENT (עם מועדפים + גרירה משופרת) ══ */
function FoodSearchAndLibrary({ basket, addToBasket }) {
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [activeCat, setActiveCat] = useState('הכל');
  const [favorites, setFavorites] = useState([]);
  const [favoriteFoods, setFavoriteFoods] = useState([]); // for OFF products saved as favs
  const searchTimer = useRef(null);

  // טען מועדפים מ-localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sappir_favorites');
      if (saved) setFavorites(JSON.parse(saved));
      const savedFoods = localStorage.getItem('sappir_favorite_foods');
      if (savedFoods) setFavoriteFoods(JSON.parse(savedFoods));
    } catch(e) {}
  }, []);

  // שמור מועדפים ב-localStorage
  const toggleFavorite = (food, e) => {
    e?.stopPropagation();
    const isFav = favorites.includes(food.id);
    let newFavs;
    let newFavFoods;
    if (isFav) {
      newFavs = favorites.filter(id => id !== food.id);
      newFavFoods = favoriteFoods.filter(f => f.id !== food.id);
    } else {
      newFavs = [...favorites, food.id];
      newFavFoods = [...favoriteFoods.filter(f => f.id !== food.id), food];
    }
    setFavorites(newFavs);
    setFavoriteFoods(newFavFoods);
    try {
      localStorage.setItem('sappir_favorites', JSON.stringify(newFavs));
      localStorage.setItem('sappir_favorite_foods', JSON.stringify(newFavFoods));
    } catch(e) {}
  };

  const categories = ['הכל', '⭐ מועדפים', 'חלבון', 'חלב', 'פחמימה', 'קטנית', 'פרי', 'ירק', 'שומן', 'חטיף'];

  // חיפוש במאגר המקומי + מועדפים
  const favoriteList = favoriteFoods;
  const localResults = search.trim()
    ? [...FOOD_LIB, ...favoriteFoods].filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
    : activeCat === '⭐ מועדפים'
      ? favoriteList
      : FOOD_LIB.filter(f => activeCat === 'הכל' || f.cat === activeCat);

  // חיפוש ב-Open Food Facts (debounced)
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!search.trim() || search.trim().length < 3) {
      setSearchResults([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      const results = await searchOpenFoodFacts(search.trim());
      setSearchResults(results);
      setSearching(false);
    }, 600);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [search]);

  // גרירה מתקדמת - עם visual feedback לנייד
  const handleTouchStart = (e, food) => {
    const touch = e.touches[0];
    const startY = touch.clientY;
    const startX = touch.clientX;
    const el = e.currentTarget;
    
    // שמור reference
    window._draggedFood = food;
    window._dragStartY = startY;
    
    // תן פידבק ויזואלי
    el.style.opacity = '0.6';
    el.style.transform = 'scale(0.95)';
  };

  const handleTouchEnd = (e, food) => {
    const el = e.currentTarget;
    el.style.opacity = '';
    el.style.transform = '';
    
    // אם הייתה גרירה אמיתית (move של 20+ פיקסלים), הוסף לסל
    const touch = e.changedTouches[0];
    if (window._dragStartY && Math.abs(touch.clientY - window._dragStartY) > 20) {
      addToBasket(food);
    } else {
      // לחיצה פשוטה
      addToBasket(food);
    }
    window._draggedFood = null;
    window._dragStartY = null;
  };

  const renderFoodItem = (food) => {
    const isFav = favorites.includes(food.id);
    const inBasket = basket.find(f => f.id === food.id);
    
    return (
      <div 
        key={food.id} 
        draggable 
        onDragStart={e => e.dataTransfer.setData('fid', food.id)}
        onTouchStart={e => handleTouchStart(e, food)}
        onTouchEnd={e => handleTouchEnd(e, food)}
        onClick={() => addToBasket(food)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 10px',
          background: inBasket ? COLORS.mintSoft : COLORS.bg,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          cursor: 'grab',
          marginBottom: 6,
          opacity: inBasket ? 0.5 : 1,
          touchAction: 'none',
          userSelect: 'none',
          transition: 'all 0.15s',
        }}
      >
        {/* כוכב מועדפים */}
        <button
          onClick={e => toggleFavorite(food, e)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            fontSize: 18,
            lineHeight: 1,
            color: isFav ? '#F5D76E' : '#D0D0D0',
            fontFamily: 'inherit',
          }}
          aria-label="מועדפים"
        >
          {isFav ? '★' : '☆'}
        </button>
        
        {food.image ? (
          <img src={food.image} alt="" style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 6 }} />
        ) : (
          <span style={{ fontSize: 20 }}>{food.icon}</span>
        )}
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{food.name}</p>
          <p style={{ margin: 0, fontSize: 10, color: COLORS.textMuted }}>
            {food.brand && <span>{food.brand} · </span>}
            {food.cal} קק״ל · {food.p}g P · {food.c}g C · {food.f}g F
          </p>
        </div>
        <span style={{ fontSize: 16, color: COLORS.textMuted }}>⠿</span>
      </div>
    );
  };

  return (
    <>
      <section style={S.card}>
        <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: COLORS.primaryDark }}>
          🔍 חיפוש מזון
        </h4>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חפשי מוצר (שופרסל, אסם, וכו׳)..."
          style={{ ...S.inp, marginBottom: 8 }}
        />
        <p style={{ fontSize: 10, color: COLORS.textMuted, margin: '4px 0 0' }}>
          💡 הקלידי 3+ אותיות לחיפוש ברשת · ⭐ לשמירה למועדפים · גררי או הקישי להוסיף
        </p>
      </section>

      {/* תוצאות חיפוש מהרשת */}
      {search.trim().length >= 3 && (
        <section style={S.card}>
          <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: COLORS.primaryDark }}>
            🛒 מוצרים ממאגר Open Food Facts
          </h4>
          {searching ? (
            <p style={{ textAlign: 'center', color: COLORS.textMuted, fontSize: 12, padding: '12px 0' }}>
              מחפשת ברשת...
            </p>
          ) : searchResults.length === 0 ? (
            <p style={{ textAlign: 'center', color: COLORS.textMuted, fontSize: 12, padding: '8px 0' }}>
              לא נמצאו מוצרים - נסי חיפוש אחר
            </p>
          ) : (
            searchResults.map(renderFoodItem)
          )}
        </section>
      )}

      {/* ספריה מקומית */}
      <section style={S.card}>
        <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: COLORS.primaryDark }}>
          📚 המאגר שלי ({localResults.length})
        </h4>
        
        {/* קטגוריות */}
        {!search.trim() && (
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 8, marginBottom: 8 }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                style={{
                  background: activeCat === cat ? COLORS.primary : COLORS.bg,
                  color: activeCat === cat ? 'white' : COLORS.text,
                  border: `1px solid ${activeCat === cat ? COLORS.primary : COLORS.border}`,
                  borderRadius: 999,
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
        
        {localResults.length === 0 ? (
          <p style={{ textAlign: 'center', color: COLORS.textMuted, fontSize: 12, padding: '8px 0' }}>
            {activeCat === '⭐ מועדפים' ? 'עדיין אין מועדפים - לחצי על ☆ כדי להוסיף' : 'אין פריטים'}
          </p>
        ) : (
          localResults.map(renderFoodItem)
        )}
      </section>
    </>
  );
}

/* ══ NAV ICON COMPONENT ══ */
function NavIcon({name, active}) {
  const color = active ? '#9B7FBF' : '#B0B0B0';
  const size = 22;
  
  const icons = {
    home: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M12 3l-9 7.5V20a1 1 0 0 0 1 1h5v-6h6v6h5a1 1 0 0 0 1-1v-9.5L12 3z"/>
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
    chart: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z"/>
      </svg>
    ),
    settings: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94 0 .31.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
      </svg>
    ),
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
  };
  
  return icons[name] || icons.home;
}

