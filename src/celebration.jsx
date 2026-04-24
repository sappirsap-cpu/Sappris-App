// ═══════════════════════════════════════════════════════════════
// src/celebration.jsx
// Modal חגיגי + קונפטי צבעוני כשמקבלים תג חדש
// ═══════════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import { BADGES } from './wellness';

const COLORS = {
  primary: '#B19CD9', primaryDark: '#8B72B5', primarySoft: '#E8DFF5',
  accent: '#F4C2C2', mint: '#C5B3E0', peach: '#F5D0B5',
  amber: '#E8C96A', sky: '#A495C5',
  text: '#2E2A3D', textMuted: '#756B85',
};

// צבעי הקונפטי
const CONFETTI_COLORS = [
  '#B19CD9', '#F4C2C2', '#F5D0B5', '#E8C96A',
  '#A495C5', '#C5B3E0', '#8B72B5', '#FADDDD',
];

/* ═══════════════════════════════════════════════════════════
   קומפוננטת קונפטי — 80 חלקיקים נופלים מלמעלה
═══════════════════════════════════════════════════════════ */
function ConfettiPieces({ count = 80 }) {
  // צור פעם אחת בלבד — החלקיקים קבועים לכל ריצה
  const [pieces] = useState(() =>
    Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,               // % רוחב
      delay: Math.random() * 0.5,              // שנ׳ עיכוב
      duration: 2 + Math.random() * 2,         // 2-4 שנ׳ נפילה
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 8 + Math.random() * 6,             // 8-14 פיקסלים
      rotate: Math.random() * 360,
      shape: Math.random() > 0.5 ? 'square' : 'circle',
      drift: (Math.random() - 0.5) * 100,      // סטייה אופקית
    }))
  );

  return (
    <div style={{
      position: 'fixed', inset: 0,
      pointerEvents: 'none',
      zIndex: 9998,
      overflow: 'hidden',
    }}>
      {pieces.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            top: -20,
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
            animation: `confetti-fall-${p.id} ${p.duration}s ${p.delay}s ease-in forwards`,
            opacity: 0,
          }}
        />
      ))}

      <style>{pieces.map(p => `
        @keyframes confetti-fall-${p.id} {
          0% {
            opacity: 0;
            transform: translate(0, 0) rotate(${p.rotate}deg);
          }
          10% {
            opacity: 1;
          }
          100% {
            opacity: 0.8;
            transform: translate(${p.drift}px, 110vh) rotate(${p.rotate + 720}deg);
          }
        }
      `).join('\n')}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Modal חגיגי להצגת תג חדש שזכיתי בו
═══════════════════════════════════════════════════════════ */
export function BadgeCelebration({ badgeCodes, onClose }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // אנימציית כניסה
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, [currentIdx]);

  if (!badgeCodes || badgeCodes.length === 0) return null;

  const code = badgeCodes[currentIdx];
  const meta = BADGES[code];
  if (!meta) return null;

  const isLast = currentIdx === badgeCodes.length - 1;
  const total = badgeCodes.length;

  const handleNext = () => {
    if (isLast) {
      setVisible(false);
      setTimeout(onClose, 300);
    } else {
      setCurrentIdx(i => i + 1);
    }
  };

  return (
    <>
      <ConfettiPieces count={80} />

      {/* Backdrop */}
      <div
        onClick={handleNext}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(46, 42, 61, 0.5)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s',
          cursor: 'pointer',
        }}
      >
        {/* Modal */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: `linear-gradient(145deg, white 0%, ${COLORS.primarySoft} 100%)`,
            borderRadius: 28,
            padding: '36px 28px 24px',
            maxWidth: 340,
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(139, 114, 181, 0.4)',
            border: `2px solid ${COLORS.primary}`,
            direction: 'rtl',
            fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
            transform: visible ? 'scale(1)' : 'scale(0.7)',
            transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            cursor: 'default',
          }}
        >
          {/* אינדיקטור תגים מרובים */}
          {total > 1 && (
            <div style={{
              display: 'flex', justifyContent: 'center', gap: 6,
              marginBottom: 16,
            }}>
              {badgeCodes.map((_, i) => (
                <div key={i} style={{
                  width: i === currentIdx ? 24 : 8,
                  height: 8, borderRadius: 4,
                  background: i === currentIdx ? COLORS.primary : COLORS.primarySoft,
                  transition: 'all 0.3s',
                }} />
              ))}
            </div>
          )}

          {/* טקסט "זכית בתג חדש!" */}
          <p style={{
            margin: '0 0 4px',
            fontSize: 13, fontWeight: 600,
            color: COLORS.primaryDark,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
          }}>
            ✨ הישג חדש ✨
          </p>

          {/* אייקון התג הגדול */}
          <div style={{
            width: 120, height: 120,
            margin: '16px auto 20px',
            borderRadius: '50%',
            background: `radial-gradient(circle at 30% 30%, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 64,
            boxShadow: `0 8px 32px rgba(139, 114, 181, 0.5),
                        inset 0 -4px 12px rgba(0,0,0,0.1),
                        inset 0 4px 12px rgba(255,255,255,0.3)`,
            animation: 'badgeBounce 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both',
          }}>
            {meta.icon}
          </div>

          {/* שם התג */}
          <h2 style={{
            margin: '0 0 8px',
            fontSize: 24, fontWeight: 800,
            color: COLORS.text,
            animation: 'fadeSlideUp 0.5s ease-out 0.4s both',
          }}>
            {meta.label}
          </h2>

          {/* תיאור */}
          <p style={{
            margin: '0 0 28px',
            fontSize: 14, color: COLORS.textMuted,
            lineHeight: 1.5,
            animation: 'fadeSlideUp 0.5s ease-out 0.5s both',
          }}>
            {meta.desc}
          </p>

          {/* כפתור */}
          <button
            onClick={handleNext}
            style={{
              width: '100%',
              background: COLORS.primary,
              color: 'white',
              border: 'none',
              padding: '14px',
              borderRadius: 14,
              fontSize: 15, fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 4px 14px rgba(139, 114, 181, 0.4)',
              animation: 'fadeSlideUp 0.5s ease-out 0.6s both',
              transition: 'transform 0.15s',
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {isLast
              ? (total > 1 ? `סיימתי — ${total} תגים! 🎉` : 'תודה! 💜')
              : `הבא (${currentIdx + 1}/${total}) →`}
          </button>
        </div>

        <style>{`
          @keyframes badgeBounce {
            0% { transform: scale(0) rotate(-180deg); }
            60% { transform: scale(1.15) rotate(10deg); }
            80% { transform: scale(0.95) rotate(-5deg); }
            100% { transform: scale(1) rotate(0deg); }
          }
          @keyframes fadeSlideUp {
            from { opacity: 0; transform: translateY(16px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </>
  );
}
