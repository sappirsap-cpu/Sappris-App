// ═══════════════════════════════════════════════════════════════
// src/voice_broadcasts.jsx
// הקלטות חיזוק יומיות — המאמנת מקליטה, מתזמנת, בוחרת נמענות
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';
import { uploadVoiceMessage, VoiceMessagePlayer } from './voice_messages';

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
   API
═══════════════════════════════════════════════════════════ */

export async function createBroadcast(coachId, audioUrl, durationSec, scheduledFor, preview, clientIds) {
  const { data: broadcast, error } = await supabase
    .from('voice_broadcasts')
    .insert({
      coach_id: coachId,
      audio_url: audioUrl,
      duration_sec: durationSec,
      scheduled_for: scheduledFor,
      message_preview: preview,
      status: 'pending',
    })
    .select()
    .single();

  if (error || !broadcast) return { error };

  const recipients = clientIds.map(cid => ({
    broadcast_id: broadcast.id,
    client_id: cid,
  }));
  const { error: recErr } = await supabase.from('broadcast_recipients').insert(recipients);
  if (recErr) return { error: recErr };

  return { data: broadcast };
}

export async function listCoachBroadcasts(coachId) {
  const { data } = await supabase
    .from('voice_broadcasts')
    .select('*, broadcast_recipients(client_id, listened_at)')
    .eq('coach_id', coachId)
    .order('scheduled_for', { ascending: false })
    .limit(50);
  return data || [];
}

export async function cancelBroadcast(id) {
  return supabase
    .from('voice_broadcasts')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('status', 'pending');
}

export async function getDueBroadcastsForClient(clientId) {
  const now = new Date().toISOString();
  const { data } = await supabase
    .from('broadcast_recipients')
    .select('*, voice_broadcasts!inner(*)')
    .eq('client_id', clientId)
    .is('listened_at', null);

  // סנן רק ברודקאסטים ש-scheduled_for <= now ושעדיין pending/sent
  return (data || []).filter(r =>
    r.voice_broadcasts &&
    r.voice_broadcasts.scheduled_for <= now &&
    r.voice_broadcasts.status !== 'cancelled'
  );
}

export async function markAsListened(recipientId) {
  return supabase
    .from('broadcast_recipients')
    .update({ listened_at: new Date().toISOString() })
    .eq('id', recipientId);
}

/* ═══════════════════════════════════════════════════════════
   קומפוננטה: יצירת ברודקאסט
═══════════════════════════════════════════════════════════ */

export function CreateBroadcast({ coachId, onClose, onCreated }) {
  const [step, setStep] = useState('record'); // record | schedule | recipients
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const [uploading, setUploading] = useState(false);

  const [preview, setPreview] = useState('');
  const [scheduledDate, setScheduledDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
  });
  const [scheduledTime, setScheduledTime] = useState('07:30');

  const [allClients, setAllClients] = useState([]);
  const [selectedClients, setSelectedClients] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(0);

  useEffect(() => {
    if (step === 'recipients') {
      supabase.from('clients')
        .select('id, full_name')
        .eq('coach_id', coachId)
        .or('is_archived.is.null,is_archived.eq.false')
        .then(({ data }) => setAllClients(data || []));
    }
  }, [step, coachId]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        clearInterval(timerRef.current);
        streamRef.current?.getTracks().forEach(t => t.stop());
        const dur = Math.round((Date.now() - startTimeRef.current) / 1000);
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setDuration(dur);
      };

      recorder.start();
      startTimeRef.current = Date.now();
      setRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed(Math.round((Date.now() - startTimeRef.current) / 1000));
      }, 200);

      // עצירה אוטומטית אחרי 3 דקות
      setTimeout(() => {
        if (recorderRef.current?.state === 'recording') stopRecording();
      }, 180000);
    } catch (e) {
      alert('שגיאת מיקרופון: ' + e.message);
    }
  };

  const stopRecording = () => {
    setRecording(false);
    recorderRef.current?.stop();
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
  };

  const handleSubmit = async () => {
    if (!audioBlob || selectedClients.length === 0) return;
    setSubmitting(true);

    const { url, error: upErr } = await uploadVoiceMessage(coachId, audioBlob, duration);
    if (upErr || !url) {
      alert('שגיאה בהעלאה: ' + (upErr?.message || 'לא ידוע'));
      setSubmitting(false);
      return;
    }

    const scheduledFor = new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString();
    const { error } = await createBroadcast(
      coachId, url, duration, scheduledFor, preview, selectedClients
    );

    setSubmitting(false);
    if (error) {
      alert('שגיאה: ' + error.message);
    } else {
      onCreated && onCreated();
      onClose();
    }
  };

  const toggleClient = (id) => {
    setSelectedClients(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedClients(allClients.map(c => c.id));
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(46,42,61,0.5)',
      backdropFilter: 'blur(6px)', zIndex: 200,
      display: 'flex', alignItems: 'flex-end',
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: COLORS.bg, width: '100%',
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        padding: 16, maxHeight: '90vh', overflowY: 'auto',
        direction: 'rtl', fontFamily: 'system-ui, sans-serif',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: COLORS.primaryDark }}>
            🎙️ הקלטת חיזוק לקבוצה
          </p>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', fontSize: 20,
            cursor: 'pointer', color: COLORS.textMuted,
          }}>✕</button>
        </div>

        {/* פסקאות שלבים */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {['record', 'schedule', 'recipients'].map((s, idx) => (
            <div key={s} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: step === s ? COLORS.primary : COLORS.primarySoft,
            }} />
          ))}
        </div>

        {/* שלב 1: הקלטה */}
        {step === 'record' && (
          <div style={{ ...card, textAlign: 'center', padding: 24 }}>
            {!audioUrl ? (
              <>
                <div style={{
                  width: 100, height: 100, borderRadius: '50%',
                  margin: '0 auto 16px',
                  background: recording ? '#FF4444' : COLORS.primary,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 40, color: 'white',
                  animation: recording ? 'pulse 1.2s infinite' : 'none',
                  boxShadow: '0 8px 24px rgba(139,114,181,0.3)',
                }}>
                  🎙️
                </div>
                {recording ? (
                  <>
                    <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: COLORS.text }}>
                      {String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}
                    </p>
                    <p style={{ margin: '4px 0 16px', fontSize: 11, color: COLORS.textMuted }}>
                      מקסימום 3 דקות
                    </p>
                    <button onClick={stopRecording} style={{
                      background: '#FF4444', color: 'white',
                      border: 'none', padding: '12px 30px', borderRadius: 999,
                      fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                      ⬛ עצרי הקלטה
                    </button>
                  </>
                ) : (
                  <>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: COLORS.text }}>
                      מוכנה להקליט?
                    </p>
                    <p style={{ margin: '4px 0 16px', fontSize: 12, color: COLORS.textMuted }}>
                      לחצי על הכפתור ודברי 💜
                    </p>
                    <button onClick={startRecording} style={{
                      background: COLORS.primary, color: 'white',
                      border: 'none', padding: '12px 30px', borderRadius: 999,
                      fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                      🎙️ התחילי
                    </button>
                  </>
                )}
              </>
            ) : (
              <>
                <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: COLORS.text }}>
                  ההקלטה מוכנה ({duration} שנ׳)
                </p>
                <audio src={audioUrl} controls style={{ width: '100%', marginBottom: 12 }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={resetRecording} style={{
                    flex: 1, background: 'white', color: COLORS.textMuted,
                    border: `1px solid ${COLORS.border}`,
                    padding: 12, borderRadius: 10,
                    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    🔄 הקליטי שוב
                  </button>
                  <button onClick={() => setStep('schedule')} style={{
                    flex: 2, background: COLORS.primary, color: 'white',
                    border: 'none', padding: 12, borderRadius: 10,
                    fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    הבא ←
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* שלב 2: תזמון */}
        {step === 'schedule' && (
          <div style={card}>
            <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: COLORS.text }}>
              מתי לשלוח?
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 11, color: COLORS.textMuted }}>תאריך</p>
                <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  style={{
                    width: '100%', padding: 10, border: `1px solid ${COLORS.border}`,
                    borderRadius: 8, fontSize: 13, fontFamily: 'inherit',
                    direction: 'ltr', boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 11, color: COLORS.textMuted }}>שעה</p>
                <input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)}
                  style={{
                    width: '100%', padding: 10, border: `1px solid ${COLORS.border}`,
                    borderRadius: 8, fontSize: 13, fontFamily: 'inherit',
                    direction: 'ltr', boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <p style={{ margin: '0 0 4px', fontSize: 11, color: COLORS.textMuted }}>תיאור (אופציונלי)</p>
            <input value={preview} onChange={(e) => setPreview(e.target.value)}
              placeholder="לדוגמה: בוקר מוטיבציה לקראת השבוע"
              style={{
                width: '100%', padding: 10, border: `1px solid ${COLORS.border}`,
                borderRadius: 8, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={() => setStep('record')} style={{
                flex: 1, background: 'white', color: COLORS.textMuted,
                border: `1px solid ${COLORS.border}`, padding: 12, borderRadius: 10,
                fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              }}>← חזרה</button>
              <button onClick={() => setStep('recipients')} style={{
                flex: 2, background: COLORS.primary, color: 'white',
                border: 'none', padding: 12, borderRadius: 10,
                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}>הבא ←</button>
            </div>
          </div>
        )}

        {/* שלב 3: נמענות */}
        {step === 'recipients' && (
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: COLORS.text }}>
                בחרי נמענות ({selectedClients.length}/{allClients.length})
              </p>
              <button onClick={selectAll} style={{
                background: COLORS.primarySoft, color: COLORS.primaryDark,
                border: 'none', padding: '4px 10px', borderRadius: 999,
                fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}>בחרי הכל</button>
            </div>

            <div style={{ maxHeight: 250, overflowY: 'auto', background: COLORS.bg, borderRadius: 8, padding: 6 }}>
              {allClients.map(c => {
                const sel = selectedClients.includes(c.id);
                return (
                  <div key={c.id} onClick={() => toggleClient(c.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: 8, borderRadius: 6, cursor: 'pointer',
                    background: sel ? COLORS.primarySoft : 'transparent',
                    marginBottom: 2,
                  }}>
                    <input type="checkbox" checked={sel} readOnly />
                    <span style={{ fontSize: 12, color: COLORS.text }}>{c.full_name}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={() => setStep('schedule')} style={{
                flex: 1, background: 'white', color: COLORS.textMuted,
                border: `1px solid ${COLORS.border}`, padding: 12, borderRadius: 10,
                fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              }}>← חזרה</button>
              <button
                onClick={handleSubmit}
                disabled={submitting || selectedClients.length === 0}
                style={{
                  flex: 2, background: COLORS.primary, color: 'white',
                  border: 'none', padding: 12, borderRadius: 10,
                  fontSize: 13, fontWeight: 700,
                  cursor: submitting ? 'default' : 'pointer', fontFamily: 'inherit',
                  opacity: submitting || selectedClients.length === 0 ? 0.6 : 1,
                }}
              >
                {submitting ? '⏳ שולחת...' : `📤 תזמני ל-${selectedClients.length} נמענות`}
              </button>
            </div>
          </div>
        )}

        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.05); } }`}</style>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   קומפוננטה: ניהול ברודקאסטים למאמנת
═══════════════════════════════════════════════════════════ */

export function BroadcastsManager({ coachId }) {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    const list = await listCoachBroadcasts(coachId);
    setBroadcasts(list);
    setLoading(false);
  };

  useEffect(() => { if (coachId) load(); }, [coachId]);

  const handleCancel = async (id) => {
    if (!confirm('לבטל את הברודקאסט הזה?')) return;
    await cancelBroadcast(id);
    load();
  };

  if (loading) return <p style={{ textAlign: 'center', color: COLORS.textMuted }}>טוענת...</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: COLORS.text }}>
          🎙️ הקלטות חיזוק
        </p>
        <button onClick={() => setCreating(true)} style={{
          padding: '6px 12px', background: COLORS.primary, color: 'white',
          border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>
          + הקלטה חדשה
        </button>
      </div>

      {creating && (
        <CreateBroadcast
          coachId={coachId}
          onClose={() => setCreating(false)}
          onCreated={load}
        />
      )}

      {broadcasts.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: 30 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🎙️</div>
          <p style={{ margin: 0, fontSize: 13, color: COLORS.textMuted }}>
            אין עדיין הקלטות חיזוק
          </p>
        </div>
      ) : (
        broadcasts.map(b => {
          const total = b.broadcast_recipients?.length || 0;
          const listened = b.broadcast_recipients?.filter(r => r.listened_at)?.length || 0;
          const dt = new Date(b.scheduled_for);
          const isPast = dt <= new Date();
          const statusLabel =
            b.status === 'cancelled' ? { lbl: 'בוטל', color: COLORS.textMuted, bg: '#F0F0F0' } :
            isPast ? { lbl: 'נשלח', color: COLORS.green, bg: '#E8F5E9' } :
            { lbl: 'מתוזמן', color: '#8B6914', bg: '#FFF4E5' };

          return (
            <div key={b.id} style={card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 22 }}>🎙️</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: COLORS.text }}>
                    {b.message_preview || 'הקלטת חיזוק'}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 10, color: COLORS.textMuted }}>
                    {dt.toLocaleString('he-IL')} · {b.duration_sec}שנ׳
                  </p>
                </div>
                <span style={{
                  fontSize: 9, padding: '3px 8px', borderRadius: 999, fontWeight: 700,
                  background: statusLabel.bg, color: statusLabel.color,
                }}>
                  {statusLabel.lbl}
                </span>
              </div>

              <audio src={b.audio_url} controls style={{ width: '100%', marginBottom: 8, height: 32 }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ margin: 0, fontSize: 11, color: COLORS.textMuted }}>
                  {total} נמענות · {listened} האזינו
                </p>
                {b.status === 'pending' && !isPast && (
                  <button onClick={() => handleCancel(b.id)} style={{
                    background: 'transparent', color: COLORS.red,
                    border: `1px solid ${COLORS.red}`, padding: '4px 10px',
                    borderRadius: 6, fontSize: 10, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    ✕ בטלי
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   קומפוננטה: הצגת ברודקאסט חדש למתאמנת (popup)
═══════════════════════════════════════════════════════════ */

export function BroadcastPlayer({ clientId }) {
  const [broadcast, setBroadcast] = useState(null);
  const [recipientId, setRecipientId] = useState(null);

  useEffect(() => {
    if (!clientId) return;
    let mounted = true;
    getDueBroadcastsForClient(clientId).then(due => {
      if (!mounted || due.length === 0) return;
      const first = due[0];
      setBroadcast(first.voice_broadcasts);
      setRecipientId(first.id);
    });
    return () => { mounted = false; };
  }, [clientId]);

  if (!broadcast) return null;

  const handleClose = async () => {
    if (recipientId) await markAsListened(recipientId);
    setBroadcast(null);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(46,42,61,0.6)',
      backdropFilter: 'blur(8px)', zIndex: 250,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: 'white', borderRadius: 24, padding: 24,
        maxWidth: 360, width: '100%',
        textAlign: 'center', direction: 'rtl',
        fontFamily: 'system-ui, sans-serif',
        animation: 'popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        <div style={{
          width: 80, height: 80, margin: '0 auto 14px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 40, boxShadow: '0 8px 20px rgba(139,114,181,0.4)',
        }}>
          🎙️
        </div>

        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: COLORS.primaryDark, letterSpacing: '0.5px' }}>
          ✨ הודעה אישית מספיר
        </p>
        <p style={{ margin: '6px 0 14px', fontSize: 16, fontWeight: 700, color: COLORS.text }}>
          {broadcast.message_preview || 'הקלטה לבוקר טוב 💜'}
        </p>

        <audio src={broadcast.audio_url} controls autoPlay style={{ width: '100%', marginBottom: 16 }} />

        <button onClick={handleClose} style={{
          width: '100%', background: COLORS.primary, color: 'white',
          border: 'none', padding: 12, borderRadius: 12,
          fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          האזנתי 💜
        </button>

        <style>{`@keyframes popIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }`}</style>
      </div>
    </div>
  );
}
