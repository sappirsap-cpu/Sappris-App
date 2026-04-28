// ═══════════════════════════════════════════════════════════════
// src/barcode_scanner.jsx
// סורק ברקודים עם המצלמה (Barcode Detection API נטיב)
// ═══════════════════════════════════════════════════════════════
//
// שימוש:
//   <BarcodeScanner onDetect={(barcode) => ...} onClose={() => ...} />
//
// תומך באוטומטי ב-Chrome / Edge / Samsung Browser (כולל Android).
// ב-iOS Safari ובדפדפנים שלא תומכים — פותח אופציה להזנה ידנית.
//
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef } from 'react';

const COLORS = {
  primary: '#B19CD9', primaryDark: '#8B72B5',
  text: '#2E2A3D', textMuted: '#756B85',
  border: '#DDD0EB', red: '#C88A8A', green: '#6BAF8A',
};

// בדיקה: האם הדפדפן תומך ב-Barcode Detection API?
function isBarcodeDetectorSupported() {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window;
}

export function BarcodeScanner({ onDetect, onClose }) {
  const [supported] = useState(isBarcodeDetectorSupported());
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [manualMode, setManualMode] = useState(!isBarcodeDetectorSupported());
  const [manualBarcode, setManualBarcode] = useState('');
  const [torchOn, setTorchOn] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const intervalRef = useRef(null);
  const trackRef = useRef(null);

  // התחלת סריקה
  const startScanning = async () => {
    setError('');
    setScanning(true);

    try {
      // יצירת BarcodeDetector
      detectorRef.current = new window.BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
      });

      // בקשת מצלמה אחורית (במובייל)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      trackRef.current = stream.getVideoTracks()[0];

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // סריקה כל 250ms
      intervalRef.current = setInterval(async () => {
        if (!videoRef.current || !detectorRef.current) return;

        try {
          const codes = await detectorRef.current.detect(videoRef.current);
          if (codes && codes.length > 0) {
            const barcode = codes[0].rawValue;
            stopScanning();
            onDetect(barcode);
          }
        } catch (e) {
          // התעלם משגיאות פר-frame
        }
      }, 250);
    } catch (e) {
      console.error('Scanner error:', e);
      let msg = e.message;
      if (e.name === 'NotAllowedError') msg = 'לא ניתנה הרשאה למצלמה';
      else if (e.name === 'NotFoundError') msg = 'לא נמצאה מצלמה במכשיר';
      else if (e.name === 'NotReadableError') msg = 'המצלמה בשימוש על ידי אפליקציה אחרת';
      setError(msg);
      setScanning(false);
      setManualMode(true);
    }
  };

  // הפסקת סריקה
  const stopScanning = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  // החלפת פנס
  const toggleTorch = async () => {
    if (!trackRef.current) return;
    try {
      const capabilities = trackRef.current.getCapabilities?.();
      if (!capabilities?.torch) return;
      await trackRef.current.applyConstraints({
        advanced: [{ torch: !torchOn }],
      });
      setTorchOn(!torchOn);
    } catch (e) {
      console.warn('Torch error:', e);
    }
  };

  // התחל אוטומטי כשנפתח (אם נתמך)
  useEffect(() => {
    if (supported && !manualMode) {
      startScanning();
    }
    return () => stopScanning();
    // eslint-disable-next-line
  }, []);

  const handleManualSubmit = () => {
    if (manualBarcode.trim().length < 8) {
      setError('הברקוד קצר מדי');
      return;
    }
    onDetect(manualBarcode.trim());
  };

  const inp = {
    width: '100%', padding: '12px',
    border: `1px solid ${COLORS.border}`, borderRadius: 10,
    fontSize: 16, fontFamily: 'inherit', outline: 'none',
    boxSizing: 'border-box', textAlign: 'center', letterSpacing: 1,
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'black',
        zIndex: 2000, direction: 'rtl', display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{
        background: 'rgba(0,0,0,0.7)', padding: '14px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        color: 'white', zIndex: 10,
      }}>
        <button onClick={() => { stopScanning(); onClose(); }} style={{
          background: 'transparent', border: 'none',
          fontSize: 24, color: 'white', cursor: 'pointer',
          fontFamily: 'inherit', padding: 4,
        }}>✕</button>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
          📷 סריקת ברקוד
        </p>
        {scanning && trackRef.current?.getCapabilities?.()?.torch && (
          <button onClick={toggleTorch} style={{
            background: 'transparent', border: 'none',
            fontSize: 22, color: 'white', cursor: 'pointer',
            fontFamily: 'inherit', padding: 4,
          }}>{torchOn ? '🔦' : '💡'}</button>
        )}
        {(!scanning || !trackRef.current?.getCapabilities?.()?.torch) && <div style={{ width: 32 }} />}
      </div>

      {/* תוכן */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {!manualMode && supported ? (
          <>
            <video
              ref={videoRef}
              playsInline
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
              }}
            />

            {/* מסגרת חיפוש */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '80%', maxWidth: 320, aspectRatio: '4/3',
              border: '3px solid white', borderRadius: 16,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)',
              pointerEvents: 'none',
            }}>
              {/* מקפי פינה */}
              {['top: -3px; left: -3px; border-bottom: none; border-right: none;',
                'top: -3px; right: -3px; border-bottom: none; border-left: none;',
                'bottom: -3px; left: -3px; border-top: none; border-right: none;',
                'bottom: -3px; right: -3px; border-top: none; border-left: none;'
              ].map((s, i) => (
                <div key={i} style={Object.fromEntries(s.split(';').filter(Boolean).map(p => {
                  const [k, v] = p.split(':').map(x => x.trim());
                  return [k.replace(/-([a-z])/g, (_, l) => l.toUpperCase()), v.replace('px', 'px')];
                }))} />
              ))}
            </div>

            {/* טקסט הוראה */}
            <div style={{
              position: 'absolute', bottom: 30, left: 0, right: 0,
              textAlign: 'center', padding: '0 20px',
            }}>
              <p style={{
                color: 'white', fontSize: 14, margin: '0 0 12px',
                textShadow: '0 1px 4px rgba(0,0,0,0.8)',
              }}>
                כווני את המצלמה לברקוד
              </p>
              <button onClick={() => { stopScanning(); setManualMode(true); }} style={{
                background: 'rgba(255,255,255,0.95)', color: COLORS.text,
                border: 'none', padding: '10px 20px', borderRadius: 24,
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit',
              }}>⌨️ הזיני ידנית</button>
            </div>

            {error && (
              <div style={{
                position: 'absolute', top: '50%', left: 16, right: 16,
                transform: 'translateY(-50%)',
                background: 'rgba(200,138,138,0.95)', color: 'white',
                padding: 16, borderRadius: 12, textAlign: 'center',
              }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{error}</p>
              </div>
            )}
          </>
        ) : (
          // מצב הזנה ידנית
          <div style={{
            background: 'white', minHeight: '100%', padding: 20,
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
          }}>
            <div style={{ maxWidth: 400, margin: '0 auto', width: '100%' }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>📦</div>
                <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: COLORS.primaryDark }}>
                  הזיני את הברקוד
                </h3>
                <p style={{ fontSize: 12, color: COLORS.textMuted, margin: 0, lineHeight: 1.5 }}>
                  {!supported
                    ? 'הדפדפן שלך לא תומך בסריקה אוטומטית.'
                    : 'הקלידי את המספר שמתחת לברקוד'}
                </p>
              </div>

              <input
                autoFocus
                type="text"
                inputMode="numeric"
                value={manualBarcode}
                onChange={e => setManualBarcode(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="7290000000000"
                style={{ ...inp, marginBottom: 12, fontSize: 18 }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleManualSubmit(); }}
              />

              {error && (
                <div style={{
                  background: '#FADDDD', borderRadius: 8, padding: 8,
                  marginBottom: 10, fontSize: 12, color: '#8B4040', textAlign: 'center',
                }}>{error}</div>
              )}

              <button onClick={handleManualSubmit} style={{
                width: '100%', background: COLORS.primary, color: 'white',
                border: 'none', padding: 14, borderRadius: 12, fontSize: 15,
                fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                marginBottom: 8,
              }}>חפשי מוצר</button>

              {supported && (
                <button onClick={() => { setManualMode(false); setError(''); startScanning(); }} style={{
                  width: '100%', background: 'transparent', color: COLORS.primaryDark,
                  border: `1px solid ${COLORS.border}`, padding: 12,
                  borderRadius: 12, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>📷 חזרי לסריקה</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
