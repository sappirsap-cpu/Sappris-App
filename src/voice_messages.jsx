// ═══════════════════════════════════════════════════════════════
// src/voice_messages.jsx
// הקלטות קוליות בצ'אט — הקלטה, נגינה, העלאה ל-Storage
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';

const COLORS = {
  primary: '#B19CD9', primaryDark: '#8B72B5',
  primarySoft: '#E8DFF5', text: '#2E2A3D',
  textMuted: '#756B85', border: '#DDD0EB',
  red: '#C88A8A',
};

/* ═══════════════════════════════════════════════════════════
   העלאה ל-Storage
═══════════════════════════════════════════════════════════ */

export async function uploadVoiceMessage(userId, blob, durationSec) {
  const fileName = `${userId}_${Date.now()}.webm`;
  const filePath = `${userId}/${fileName}`;

  const { error: upErr } = await supabase.storage
    .from('voice-messages')
    .upload(filePath, blob, { contentType: 'audio/webm' });

  if (upErr) return { error: upErr };

  const { data: urlData } = supabase.storage
    .from('voice-messages')
    .getPublicUrl(filePath);

  return { url: urlData.publicUrl, duration: durationSec };
}

/* ═══════════════════════════════════════════════════════════
   כפתור הקלטה — לחץ-החזק להקליט, שחרר לשלוח
═══════════════════════════════════════════════════════════ */

export function VoiceRecorderButton({ userId, onSend, disabled }) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [uploading, setUploading] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(0);
  const cancelledRef = useRef(false);

  const startRecording = async () => {
    if (recording || disabled) return;
    cancelledRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        clearInterval(timerRef.current);
        streamRef.current?.getTracks().forEach(t => t.stop());

        if (cancelledRef.current) {
          chunksRef.current = [];
          return;
        }

        const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
        if (duration < 1) return; // מינימום שנייה

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setUploading(true);
        const { url, error } = await uploadVoiceMessage(userId, blob, duration);
        setUploading(false);

        if (error) {
          alert('שגיאה: ' + error.message);
          return;
        }
        onSend({ audio_url: url, audio_duration_sec: duration });
      };

      recorder.start();
      startTimeRef.current = Date.now();
      setRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed(Math.round((Date.now() - startTimeRef.current) / 1000));
      }, 200);

      // עצור אוטומטית אחרי 60 שניות
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') stopRecording();
      }, 60000);
    } catch (e) {
      alert('לא הצלחתי לגשת למיקרופון: ' + e.message);
      setRecording(false);
    }
  };

  const stopRecording = () => {
    if (!recording) return;
    setRecording(false);
    mediaRecorderRef.current?.stop();
  };

  const cancelRecording = () => {
    cancelledRef.current = true;
    setRecording(false);
    mediaRecorderRef.current?.stop();
  };

  if (uploading) {
    return (
      <button disabled style={{
        background: COLORS.primarySoft, color: COLORS.primaryDark,
        border: 'none', padding: '0 16px', borderRadius: 10,
        fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
        height: 38,
      }}>
        ⏳ מעלה...
      </button>
    );
  }

  if (recording) {
    return (
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={cancelRecording} style={{
          background: COLORS.red, color: 'white',
          border: 'none', padding: '0 10px', borderRadius: 10,
          fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', height: 38,
        }}>
          🗑
        </button>
        <button onClick={stopRecording} style={{
          background: '#FF4444', color: 'white',
          border: 'none', padding: '0 14px', borderRadius: 10,
          fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          height: 38, animation: 'pulse 1.2s ease-in-out infinite',
        }}>
          ⬛ {String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}
        </button>
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }`}</style>
      </div>
    );
  }

  return (
    <button
      onClick={startRecording}
      disabled={disabled}
      style={{
        background: COLORS.primarySoft, color: COLORS.primaryDark,
        border: `1px solid ${COLORS.border}`,
        padding: '0 14px', borderRadius: 10,
        fontSize: 18, cursor: disabled ? 'default' : 'pointer',
        fontFamily: 'inherit', height: 38,
        opacity: disabled ? 0.5 : 1,
      }}
      title="הקלטה קולית"
    >
      🎙️
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════
   נגן הודעה קולית בתוך בועת צ'אט
═══════════════════════════════════════════════════════════ */

export function VoiceMessagePlayer({ url, duration, isFromMe }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    const a = new Audio(url);
    audioRef.current = a;
    a.addEventListener('timeupdate', () => {
      setProgress((a.currentTime / a.duration) * 100 || 0);
    });
    a.addEventListener('ended', () => {
      setPlaying(false);
      setProgress(0);
    });
    return () => { a.pause(); audioRef.current = null; };
  }, [url]);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '6px 4px', minWidth: 180,
    }}>
      <button onClick={toggle} style={{
        background: isFromMe ? 'white' : COLORS.primary,
        color: isFromMe ? COLORS.primaryDark : 'white',
        border: 'none', borderRadius: '50%',
        width: 36, height: 36, fontSize: 14,
        cursor: 'pointer', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {playing ? '⏸' : '▶'}
      </button>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <div style={{
          height: 3, borderRadius: 99,
          background: isFromMe ? 'rgba(255,255,255,0.4)' : COLORS.primarySoft,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: isFromMe ? 'white' : COLORS.primary,
            transition: 'width 0.1s linear',
          }} />
        </div>
        <span style={{
          fontSize: 10,
          color: isFromMe ? 'rgba(255,255,255,0.85)' : COLORS.textMuted,
        }}>
          🎙️ {fmt(duration || 0)}
        </span>
      </div>
    </div>
  );
}
