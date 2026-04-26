// ═══════════════════════════════════════════════════════════════
// src/progress_photos.jsx — v2
// תמונות התקדמות + השוואה לפני/אחרי + גרפי מידות גוף
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';

const COLORS = {
  bg: '#F5F2FA', primary: '#B19CD9', primaryDark: '#8B72B5',
  primarySoft: '#E8DFF5', text: '#2E2A3D', textMuted: '#756B85',
  border: '#DDD0EB', green: '#6BAF8A', greenSoft: '#E0F2EB',
  amber: '#E8C96A', amberSoft: '#F5EECD', red: '#C88A8A',
};

const card = {
  background: 'white', border: `1px solid ${COLORS.border}`,
  borderRadius: 16, padding: 16,
};

/* ═══════════════════════════════════════════════════════════
   API — תמונות
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
   API — מידות גוף
═══════════════════════════════════════════════════════════ */

export async function saveMeasurement(clientId, measurements) {
  // measurements: { waist, hips, chest, arm, thigh, date? }
  const { data, error } = await supabase
    .from('body_measurements')
    .insert({
      client_id: clientId,
      waist_cm: measurements.waist || null,
      hips_cm: measurements.hips || null,
      chest_cm: measurements.chest || null,
      arm_cm: measurements.arm || null,
      thigh_cm: measurements.thigh || null,
      measured_at: measurements.date || new Date().toISOString().slice(0, 10),
    })
    .select()
    .single();
  return { data, error };
}

export async function listMeasurements(clientId) {
  const { data } = await supabase
    .from('body_measurements')
    .select('*')
    .eq('client_id', clientId)
    .order('measured_at', { ascending: true });
  return data || [];
}

export async function deleteMeasurement(id) {
  return supabase.from('body_measurements').delete().eq('id', id);
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

  if (!photos || photos.length === 0) return true;
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
        style={{ position: 'absolute', top: 8, left: 8, background: 'transparent', border: 'none', fontSize: 16, cursor: 'pointer', color: COLORS.textMuted }}>✕</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 36 }}>📸</span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: COLORS.text }}>הגיע הזמן לתמונת התקדמות!</p>
          <p style={{ margin: '4px 0 8px', fontSize: 11, color: COLORS.text, lineHeight: 1.4 }}>עברו שבועיים מאז התמונה האחרונה. בואי נתעד את הדרך 💜</p>
          <button onClick={onTakePhoto} style={{
            background: COLORS.primaryDark, color: 'white', border: 'none',
            padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>📷 צלמי עכשיו</button>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   קומפוננטה ראשית: גלריה + מידות (tabs)
═══════════════════════════════════════════════════════════ */

export function ProgressPhotosGallery({ clientId, viewOnly = false }) {
  const [tab, setTab] = useState('photos'); // 'photos' | 'compare' | 'measurements'
  const [photos, setPhotos] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [comparing, setComparing] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [label, setLabel] = useState('');
  const fileInputRef = useRef(null);

  // מצב הוספת מידות
  const [showAddMeasure, setShowAddMeasure] = useState(false);
  const [newMeasure, setNewMeasure] = useState({ waist: '', hips: '', chest: '', arm: '', thigh: '' });

  const load = async () => {
    setLoading(true);
    const [p, m] = await Promise.all([
      listProgressPhotos(clientId),
      listMeasurements(clientId),
    ]);
    setPhotos(p);
    setMeasurements(m);
    setLoading(false);
  };

  useEffect(() => { if (clientId) load(); }, [clientId]);

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    const { error } = await uploadProgressPhoto(clientId, file, label);
    setUploading(false);
    if (error) { alert('שגיאה: ' + error.message); } else { setLabel(''); load(); }
  };

  const handleDelete = async (id) => {
    if (!confirm('למחוק את התמונה?')) return;
    await deleteProgressPhoto(id);
    load();
  };

  const handleDeleteMeasure = async (id) => {
    if (!confirm('למחוק מדידה זו?')) return;
    await deleteMeasurement(id);
    load();
  };

  const handleSaveMeasure = async () => {
    const { error } = await saveMeasurement(clientId, newMeasure);
    if (error) { alert('שגיאה: ' + error.message); return; }
    setNewMeasure({ waist: '', hips: '', chest: '', arm: '', thigh: '' });
    setShowAddMeasure(false);
    load();
  };

  // בחירת תמונות להשוואה
  const handleSelectCompare = (photo) => {
    if (!comparing || (comparing.left && comparing.right)) {
      setComparing({ left: photo, right: null });
    } else if (!comparing.right && comparing.left.id !== photo.id) {
      setComparing({ ...comparing, right: photo });
    }
  };

  if (loading) return <p style={{ textAlign: 'center', color: COLORS.textMuted, padding: 20 }}>טוענת...</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* טאבים */}
      <div style={{ display: 'flex', gap: 4, background: '#F5F2FA', borderRadius: 10, padding: 4 }}>
        {[
          { id: 'photos', label: '📷 גלריה' },
          { id: 'compare', label: '↔️ השוואה' },
          { id: 'measurements', label: '📏 מידות' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, background: tab === t.id ? 'white' : 'transparent',
            border: 'none', borderRadius: 8, padding: '7px 4px',
            fontSize: 11, fontWeight: tab === t.id ? 700 : 500,
            color: tab === t.id ? COLORS.primaryDark : COLORS.textMuted,
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ═══ טאב גלריה ═══ */}
      {tab === 'photos' && (
        <>
          {!viewOnly && (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="תווית (לפני / חודש 2 / אחרי)"
                style={{ flex: 1, padding: '9px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 10, fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
              />
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{
                background: COLORS.primary, color: 'white', border: 'none',
                padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                cursor: uploading ? 'default' : 'pointer', fontFamily: 'inherit',
                opacity: uploading ? 0.6 : 1, whiteSpace: 'nowrap',
              }}>{uploading ? 'מעלה...' : '📷 הוסף'}</button>
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment"
                style={{ display: 'none' }} onChange={(e) => handleUpload(e.target.files?.[0])} />
            </div>
          )}

          {photos.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', padding: 30 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📸</div>
              <p style={{ margin: 0, fontSize: 13, color: COLORS.textMuted }}>עוד אין תמונות התקדמות</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {photos.map(p => (
                <div key={p.id} style={{
                  position: 'relative', borderRadius: 12, overflow: 'hidden',
                  border: `1px solid ${COLORS.border}`,
                }}>
                  <img src={p.photo_url} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }} />
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)',
                    color: 'white', padding: '18px 8px 8px',
                  }}>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 700 }}>{p.label || 'ללא תווית'}</p>
                    <p style={{ margin: '1px 0 0', fontSize: 9, opacity: 0.8 }}>{p.taken_at}{p.weight_at ? ` · ${p.weight_at}ק"ג` : ''}</p>
                  </div>
                  {!viewOnly && (
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                      style={{
                        position: 'absolute', top: 6, left: 6,
                        background: 'rgba(0,0,0,0.5)', color: 'white',
                        border: 'none', borderRadius: '50%', width: 24, height: 24,
                        fontSize: 12, cursor: 'pointer',
                      }}>🗑</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ═══ טאב השוואה לפני/אחרי ═══ */}
      {tab === 'compare' && (
        <BeforeAfterCompare photos={photos} />
      )}

      {/* ═══ טאב מידות גוף ═══ */}
      {tab === 'measurements' && (
        <MeasurementsTab
          measurements={measurements}
          viewOnly={viewOnly}
          showAdd={showAddMeasure}
          newMeasure={newMeasure}
          onNewMeasureChange={(field, val) => setNewMeasure(prev => ({ ...prev, [field]: val }))}
          onSave={handleSaveMeasure}
          onToggleAdd={() => setShowAddMeasure(v => !v)}
          onDelete={handleDeleteMeasure}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   קומפוננטת השוואה לפני/אחרי — Slider
═══════════════════════════════════════════════════════════ */

function BeforeAfterCompare({ photos }) {
  const [leftId, setLeftId] = useState(null);
  const [rightId, setRightId] = useState(null);
  const [sliderPos, setSliderPos] = useState(50); // אחוז
  const containerRef = useRef(null);
  const dragging = useRef(false);

  const leftPhoto = photos.find(p => p.id === leftId) || photos[0] || null;
  const rightPhoto = photos.find(p => p.id === rightId) || photos[photos.length - 1] || null;

  // Initialize defaults
  useEffect(() => {
    if (photos.length >= 2) {
      setLeftId(photos[0].id);
      setRightId(photos[photos.length - 1].id);
    }
  }, [photos]);

  const handleMouseDown = () => { dragging.current = true; };
  const handleMouseUp = () => { dragging.current = false; };
  const handleMouseMove = (e) => {
    if (!dragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const pct = Math.min(100, Math.max(0, (x / rect.width) * 100));
    setSliderPos(pct);
  };

  if (photos.length < 2) {
    return (
      <div style={{ ...card, textAlign: 'center', padding: 30 }}>
        <p style={{ margin: 0, fontSize: 13, color: COLORS.textMuted }}>צריך לפחות 2 תמונות להשוואה</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* בוחרי תמונות */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: COLORS.textMuted }}>תמונה שמאל (לפני)</p>
          <select value={leftId || ''} onChange={e => setLeftId(Number(e.target.value))}
            style={{ width: '100%', padding: '8px 10px', border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 12, fontFamily: 'inherit', background: 'white', color: COLORS.text }}>
            {photos.map(p => (
              <option key={p.id} value={p.id}>{p.label || p.taken_at}</option>
            ))}
          </select>
        </div>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: COLORS.textMuted }}>תמונה ימין (אחרי)</p>
          <select value={rightId || ''} onChange={e => setRightId(Number(e.target.value))}
            style={{ width: '100%', padding: '8px 10px', border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 12, fontFamily: 'inherit', background: 'white', color: COLORS.text }}>
            {photos.map(p => (
              <option key={p.id} value={p.id}>{p.label || p.taken_at}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Slider השוואה */}
      {leftPhoto && rightPhoto && (
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          {/* תוויות */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#F5F2FA' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.primaryDark }}>
              ← {leftPhoto.label || leftPhoto.taken_at}
              {leftPhoto.weight_at ? ` (${leftPhoto.weight_at}ק"ג)` : ''}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.green }}>
              {rightPhoto.label || rightPhoto.taken_at}
              {rightPhoto.weight_at ? ` (${rightPhoto.weight_at}ק"ג)` : ''} →
            </span>
          </div>

          {/* Slider container */}
          <div
            ref={containerRef}
            style={{ position: 'relative', width: '100%', aspectRatio: '3/4', cursor: 'ew-resize', userSelect: 'none' }}
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchMove={handleMouseMove}
            onTouchStart={handleMouseDown}
            onTouchEnd={handleMouseUp}
          >
            {/* תמונה ימין (אחרי) — רקע */}
            <img src={rightPhoto.photo_url} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />

            {/* תמונה שמאל (לפני) — clip */}
            <div style={{
              position: 'absolute', inset: 0,
              clipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
            }}>
              <img src={leftPhoto.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            {/* קו מפריד */}
            <div style={{
              position: 'absolute', top: 0, bottom: 0,
              left: `${sliderPos}%`,
              width: 3,
              background: 'white',
              boxShadow: '0 0 8px rgba(0,0,0,0.4)',
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
            }}>
              {/* כפתור slider */}
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 36, height: 36,
                background: 'white',
                borderRadius: '50%',
                boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, color: COLORS.primaryDark, fontWeight: 700,
              }}>⇔</div>
            </div>

            {/* תוויות "לפני/אחרי" על התמונה */}
            <div style={{
              position: 'absolute', top: 8, right: 8,
              background: 'rgba(107,175,138,0.9)', color: 'white',
              padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
            }}>אחרי</div>
            <div style={{
              position: 'absolute', top: 8, left: 8,
              background: 'rgba(177,156,217,0.9)', color: 'white',
              padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
            }}>לפני</div>
          </div>

          {/* הפרש משקל */}
          {leftPhoto.weight_at && rightPhoto.weight_at && (
            <div style={{ padding: '10px 14px', background: COLORS.greenSoft, display: 'flex', justifyContent: 'center', gap: 16 }}>
              <span style={{ fontSize: 12, color: COLORS.text }}>
                📉 ירידה: <strong style={{ color: COLORS.green }}>
                  {(leftPhoto.weight_at - rightPhoto.weight_at).toFixed(1)} ק"ג
                </strong>
              </span>
              <span style={{ fontSize: 12, color: COLORS.textMuted }}>
                {leftPhoto.taken_at} → {rightPhoto.taken_at}
              </span>
            </div>
          )}
        </div>
      )}

      <p style={{ margin: 0, fontSize: 11, color: COLORS.textMuted, textAlign: 'center' }}>
        גרירת הקו לסנכרון בין הצילומים
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   קומפוננטת מידות גוף + גרפים
═══════════════════════════════════════════════════════════ */

function MeasurementsTab({ measurements, viewOnly, showAdd, newMeasure, onNewMeasureChange, onSave, onToggleAdd, onDelete }) {
  const [selectedMetric, setSelectedMetric] = useState('waist');

  const METRICS = [
    { key: 'waist_cm', label: 'מותניים', icon: '🔵', color: COLORS.primary },
    { key: 'hips_cm', label: 'ירכיים', icon: '🟣', color: '#C5A3E0' },
    { key: 'chest_cm', label: 'חזה', icon: '🔴', color: '#E8A5A5' },
    { key: 'arm_cm', label: 'זרוע', icon: '🟡', color: COLORS.amber },
    { key: 'thigh_cm', label: 'ירך', icon: '🟢', color: COLORS.green },
  ];

  const FIELD_MAP = {
    waist: 'waist_cm', hips: 'hips_cm', chest: 'chest_cm', arm: 'arm_cm', thigh: 'thigh_cm',
  };

  const selectedKey = FIELD_MAP[selectedMetric] || 'waist_cm';
  const selectedMeta = METRICS.find(m => m.key === selectedKey) || METRICS[0];
  const seriesData = measurements.filter(m => m[selectedKey] != null);

  const latestMeasure = measurements[measurements.length - 1] || null;
  const firstMeasure = measurements[0] || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* כפתור הוסף מדידה */}
      {!viewOnly && (
        <button onClick={onToggleAdd} style={{
          background: showAdd ? '#F5F2FA' : COLORS.primary, color: showAdd ? COLORS.text : 'white',
          border: `1px solid ${COLORS.border}`, padding: '10px', borderRadius: 10,
          fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        }}>{showAdd ? '✕ ביטול' : '📏 הוסף מדידה חדשה'}</button>
      )}

      {/* טופס הוספת מדידה */}
      {showAdd && !viewOnly && (
        <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: COLORS.primaryDark }}>מדידה חדשה (ס"מ)</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { key: 'waist', label: 'מותניים' },
              { key: 'hips', label: 'ירכיים' },
              { key: 'chest', label: 'חזה' },
              { key: 'arm', label: 'זרוע' },
              { key: 'thigh', label: 'ירך' },
            ].map(f => (
              <div key={f.key}>
                <p style={{ margin: '0 0 3px', fontSize: 11, color: COLORS.textMuted }}>{f.label}</p>
                <input
                  type="number" value={newMeasure[f.key]}
                  onChange={e => onNewMeasureChange(f.key, e.target.value)}
                  placeholder="0"
                  style={{ width: '100%', padding: '8px 10px', border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', textAlign: 'center', outline: 'none' }}
                />
              </div>
            ))}
          </div>
          <button onClick={onSave} style={{
            background: COLORS.primary, color: 'white', border: 'none',
            padding: 12, borderRadius: 10, fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit', marginTop: 4,
          }}>💾 שמור מדידה</button>
        </div>
      )}

      {measurements.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: 30 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📏</div>
          <p style={{ margin: 0, fontSize: 13, color: COLORS.textMuted }}>עוד אין מדידות גוף</p>
          {!viewOnly && <p style={{ margin: '6px 0 0', fontSize: 11, color: COLORS.textMuted }}>לחצי על "הוסף מדידה חדשה" כדי להתחיל לעקוב</p>}
        </div>
      ) : (
        <>
          {/* סיכום שינויים */}
          {firstMeasure && latestMeasure && firstMeasure.id !== latestMeasure.id && (
            <div style={{ ...card, background: COLORS.greenSoft, border: `1px solid ${COLORS.green}20` }}>
              <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: COLORS.green }}>📉 שינוי מהמדידה הראשונה</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {METRICS.map(m => {
                  const first = firstMeasure[m.key];
                  const last = latestMeasure[m.key];
                  if (!first || !last) return null;
                  const diff = (last - first).toFixed(1);
                  const improved = diff < 0;
                  return (
                    <div key={m.key} style={{ background: 'white', borderRadius: 8, padding: '6px 10px', textAlign: 'center', minWidth: 60 }}>
                      <p style={{ margin: 0, fontSize: 11, color: COLORS.textMuted }}>{m.label}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 700, color: improved ? COLORS.green : COLORS.red }}>
                        {diff > 0 ? '+' : ''}{diff}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* בוחר מדד לגרף */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            {METRICS.map(m => {
              const haData = measurements.some(mes => mes[m.key] != null);
              if (!haData) return null;
              return (
                <button key={m.key}
                  onClick={() => setSelectedMetric(Object.keys(FIELD_MAP).find(k => FIELD_MAP[k] === m.key))}
                  style={{
                    background: selectedKey === m.key ? m.color : 'white',
                    color: selectedKey === m.key ? 'white' : COLORS.text,
                    border: `1px solid ${selectedKey === m.key ? m.color : COLORS.border}`,
                    borderRadius: 20, padding: '5px 12px', fontSize: 11, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0,
                  }}>{m.icon} {m.label}</button>
              );
            })}
          </div>

          {/* גרף SVG */}
          {seriesData.length >= 2 && (
            <div style={{ ...card }}>
              <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: COLORS.text }}>
                {selectedMeta.icon} גרף {selectedMeta.label} (ס"מ)
              </p>
              <MeasurementChart data={seriesData} metricKey={selectedKey} color={selectedMeta.color} />
            </div>
          )}

          {/* טבלת היסטוריה */}
          <div style={card}>
            <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: COLORS.text }}>📋 היסטוריית מדידות</p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${COLORS.border}` }}>
                    <th style={{ padding: '6px 8px', textAlign: 'right', color: COLORS.textMuted, fontWeight: 600 }}>תאריך</th>
                    {METRICS.map(m => (
                      <th key={m.key} style={{ padding: '6px 6px', textAlign: 'center', color: COLORS.textMuted, fontWeight: 600 }}>{m.label}</th>
                    ))}
                    {!viewOnly && <th style={{ padding: '6px 4px' }}></th>}
                  </tr>
                </thead>
                <tbody>
                  {[...measurements].reverse().map((mes, i) => (
                    <tr key={mes.id} style={{ borderBottom: `1px solid ${COLORS.border}`, background: i === 0 ? COLORS.primarySoft : 'transparent' }}>
                      <td style={{ padding: '8px 8px', fontWeight: i === 0 ? 700 : 400, color: COLORS.text }}>{mes.measured_at}</td>
                      {METRICS.map(m => (
                        <td key={m.key} style={{ padding: '8px 6px', textAlign: 'center', color: mes[m.key] ? COLORS.text : COLORS.border }}>
                          {mes[m.key] || '—'}
                        </td>
                      ))}
                      {!viewOnly && (
                        <td style={{ padding: '8px 4px', textAlign: 'center' }}>
                          <button onClick={() => onDelete(mes.id)} style={{
                            background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14, color: COLORS.textMuted,
                          }}>🗑</button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   גרף SVG למידות
═══════════════════════════════════════════════════════════ */

function MeasurementChart({ data, metricKey, color }) {
  const W = 340, H = 120;
  const pad = { t: 16, r: 16, b: 28, l: 40 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;

  const values = data.map(d => d[metricKey]).filter(Boolean);
  if (values.length < 2) return null;

  const minV = Math.min(...values) - 2;
  const maxV = Math.max(...values) + 2;
  const range = maxV - minV || 1;
  const xStep = plotW / (data.length - 1);
  const yFor = v => pad.t + plotH - ((v - minV) / range) * plotH;

  const pathD = data.map((d, i) => {
    const v = d[metricKey];
    if (!v) return '';
    return `${i === 0 ? 'M' : 'L'} ${pad.l + i * xStep} ${yFor(v)}`;
  }).filter(Boolean).join(' ');

  const fillD = pathD + ` L ${pad.l + (data.length - 1) * xStep} ${pad.t + plotH} L ${pad.l} ${pad.t + plotH} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
      {/* אזור מילוי */}
      <path d={fillD} fill={color} fillOpacity={0.1} />
      {/* קו */}
      <path d={pathD} stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* נקודות */}
      {data.map((d, i) => {
        const v = d[metricKey];
        if (!v) return null;
        const isLast = i === data.length - 1;
        return (
          <g key={d.id}>
            <circle cx={pad.l + i * xStep} cy={yFor(v)} r={isLast ? 5 : 3.5}
              fill="white" stroke={color} strokeWidth={isLast ? 2.5 : 1.5} />
            {isLast && (
              <text x={pad.l + i * xStep} y={yFor(v) - 9} fontSize="10" fill={color}
                textAnchor="middle" fontWeight="700">{v}</text>
            )}
            <text x={pad.l + i * xStep} y={H - 6} fontSize="8" fill={COLORS.textMuted}
              textAnchor="middle">{d.measured_at?.slice(5)}</text>
          </g>
        );
      })}
      {/* ציר Y */}
      {[minV + 2, (minV + maxV) / 2, maxV - 2].map((v, i) => (
        <text key={i} x={pad.l - 5} y={yFor(v) + 3} fontSize="8" fill={COLORS.textMuted} textAnchor="end">
          {Math.round(v)}
        </text>
      ))}
    </svg>
  );
}
