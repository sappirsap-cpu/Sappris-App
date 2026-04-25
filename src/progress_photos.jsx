// ═══════════════════════════════════════════════════════════════
// src/progress_photos.jsx
// תמונות התקדמות — צילום, השוואה, תזכורות דו-שבועיות
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';

const COLORS = {
  bg: '#F5F2FA', primary: '#B19CD9', primaryDark: '#8B72B5',
  primarySoft: '#E8DFF5', text: '#2E2A3D', textMuted: '#756B85',
  border: '#DDD0EB',
};

const card = {
  background: 'white', border: `1px solid ${COLORS.border}`,
  borderRadius: 16, padding: 16,
};

/* ═══════════════════════════════════════════════════════════
   API
═══════════════════════════════════════════════════════════ */

export async function uploadProgressPhoto(clientId, file, label = '', weight = null) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${clientId}_${Date.now()}.${fileExt}`;
  const filePath = `${clientId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('progress-photos')
    .upload(filePath, file);

  if (uploadError) return { error: uploadError };

  const { data: urlData } = supabase.storage
    .from('progress-photos')
    .getPublicUrl(filePath);

  const { data, error } = await supabase
    .from('progress_photos')
    .insert({
      client_id: clientId,
      photo_url: urlData.publicUrl,
      label,
      weight_at: weight,
      taken_at: new Date().toISOString().slice(0, 10),
    })
    .select()
    .single();

  return { data, error };
}

export async function listProgressPhotos(clientId) {
  const { data } = await supabase
    .from('progress_photos')
    .select('*')
    .eq('client_id', clientId)
    .order('taken_at', { ascending: true });
  return data || [];
}

export async function deleteProgressPhoto(id) {
  return supabase.from('progress_photos').delete().eq('id', id);
}

/* ═══════════════════════════════════════════════════════════
   האם הגיע הזמן לתזכורת תמונה? (כל 14 יום)
═══════════════════════════════════════════════════════════ */

export async function shouldRemindPhoto(clientId) {
  const { data: photos } = await supabase
    .from('progress_photos')
    .select('taken_at')
    .eq('client_id', clientId)
    .order('taken_at', { ascending: false })
    .limit(1);

  if (!photos || photos.length === 0) return true; // אף תמונה
  const last = new Date(photos[0].taken_at);
  const days = Math.floor((new Date() - last) / 86400000);
  return days >= 14;
}

/* ═══════════════════════════════════════════════════════════
   קומפוננטה: באנר תזכורת תמונה
═══════════════════════════════════════════════════════════ */

export function PhotoReminderBanner({ clientId, onTakePhoto }) {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!clientId) return;
    // נבדוק רק פעם ביום
    const lastCheck = localStorage.getItem('photo_reminder_check');
    const today = new Date().toISOString().slice(0, 10);
    if (lastCheck === today) {
      const stored = localStorage.getItem('photo_reminder_show');
      setShow(stored === '1');
      return;
    }
    shouldRemindPhoto(clientId).then(should => {
      setShow(should);
      localStorage.setItem('photo_reminder_check', today);
      localStorage.setItem('photo_reminder_show', should ? '1' : '0');
    });
  }, [clientId]);

  if (!show || dismissed) return null;

  return (
    <section style={{
      ...card,
      background: 'linear-gradient(135deg, #E8DFF5 0%, #F5D0B5 100%)',
      border: 'none', position: 'relative',
    }}>
      <button onClick={() => { setDismissed(true); localStorage.setItem('photo_reminder_show', '0'); }}
        style={{
          position: 'absolute', top: 8, left: 8,
          background: 'transparent', border: 'none',
          fontSize: 16, cursor: 'pointer', color: COLORS.textMuted,
        }}>✕</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 36 }}>📸</span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: COLORS.text }}>
            הגיע הזמן לתמונת התקדמות!
          </p>
          <p style={{ margin: '4px 0 8px', fontSize: 11, color: COLORS.text, lineHeight: 1.4 }}>
            עברו שבועיים מאז התמונה האחרונה. בואי נתעד את הדרך 💜
          </p>
          <button
            onClick={onTakePhoto}
            style={{
              background: COLORS.primaryDark, color: 'white',
              border: 'none', padding: '8px 16px', borderRadius: 8,
              fontSize: 12, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            📷 צלמי עכשיו
          </button>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   קומפוננטה: גלריית תמונות התקדמות
═══════════════════════════════════════════════════════════ */

export function ProgressPhotosGallery({ clientId, viewOnly = false }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [comparing, setComparing] = useState(null); // { left, right }
  const [label, setLabel] = useState('');
  const fileInputRef = useRef(null);

  const load = async () => {
    setLoading(true);
    const data = await listProgressPhotos(clientId);
    setPhotos(data);
    setLoading(false);
  };

  useEffect(() => { if (clientId) load(); }, [clientId]);

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    const { error } = await uploadProgressPhoto(clientId, file, label);
    setUploading(false);
    if (error) {
      alert('שגיאה: ' + error.message);
    } else {
      setLabel('');
      load();
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('למחוק את התמונה?')) return;
    await deleteProgressPhoto(id);
    load();
  };

  const handleStartCompare = (photo) => {
    if (!comparing) setComparing({ left: photo });
    else if (!comparing.right && comparing.left.id !== photo.id) {
      setComparing({ ...comparing, right: photo });
    }
  };

  if (loading) return <p style={{ textAlign: 'center', color: COLORS.textMuted }}>טוענת...</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* תצוגת השוואה */}
      {comparing && comparing.right && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(46,42,61,0.95)',
          zIndex: 200, display: 'flex', flexDirection: 'column',
        }} onClick={() => setComparing(null)}>
          <div style={{ padding: 14, color: 'white', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>השוואה</p>
            <p style={{ margin: '4px 0 0', fontSize: 11, opacity: 0.7 }}>לחצי בכל מקום לסגירה</p>
          </div>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, padding: 4 }}>
            {[comparing.left, comparing.right].map((p, idx) => (
              <div key={idx} style={{ position: 'relative' }}>
                <img src={p.photo_url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                <div style={{
                  position: 'absolute', bottom: 8, right: 8,
                  background: 'rgba(0,0,0,0.6)', color: 'white',
                  padding: '4px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                }}>
                  {p.taken_at}{p.weight_at ? ` · ${p.weight_at}ק"ג` : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!viewOnly && (
        <>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="תווית (לדוגמה: 'לפני', 'חודש 2')"
            style={{
              padding: 10, border: `1px solid ${COLORS.border}`, borderRadius: 10,
              fontSize: 12, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              background: COLORS.primary, color: 'white', border: 'none',
              padding: 12, borderRadius: 10, fontSize: 13, fontWeight: 700,
              cursor: uploading ? 'default' : 'pointer', fontFamily: 'inherit',
              opacity: uploading ? 0.6 : 1,
            }}
          >
            {uploading ? 'מעלה...' : '📷 הוסיפי תמונה'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={(e) => handleUpload(e.target.files?.[0])}
          />
        </>
      )}

      {photos.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: 30 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📸</div>
          <p style={{ margin: 0, fontSize: 13, color: COLORS.textMuted }}>
            עוד אין תמונות התקדמות
          </p>
        </div>
      ) : (
        <>
          {comparing?.left && !comparing?.right && (
            <p style={{ margin: 0, fontSize: 12, color: COLORS.primaryDark, textAlign: 'center', fontWeight: 700 }}>
              ✋ בחרי תמונה שנייה להשוואה
            </p>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {photos.map(p => (
              <div
                key={p.id}
                onClick={() => handleStartCompare(p)}
                style={{
                  position: 'relative', cursor: 'pointer',
                  borderRadius: 12, overflow: 'hidden',
                  border: comparing?.left?.id === p.id ? `3px solid ${COLORS.primary}` : 'none',
                }}>
                <img src={p.photo_url} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }} />
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                  color: 'white', padding: 6, fontSize: 10,
                }}>
                  <p style={{ margin: 0, fontWeight: 700 }}>{p.label || 'ללא תווית'}</p>
                  <p style={{ margin: 0, opacity: 0.85 }}>{p.taken_at}</p>
                </div>
                {!viewOnly && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                    style={{
                      position: 'absolute', top: 6, left: 6,
                      background: 'rgba(0,0,0,0.5)', color: 'white',
                      border: 'none', borderRadius: '50%',
                      width: 24, height: 24, fontSize: 12,
                      cursor: 'pointer',
                    }}>🗑</button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
