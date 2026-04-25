// ═══════════════════════════════════════════════════════════════
// src/challenges.jsx
// אתגרים בין מתאמנות — יצירה, השתתפות, leaderboard
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

const COLORS = {
  bg: '#F5F2FA', primary: '#B19CD9', primaryDark: '#8B72B5',
  primarySoft: '#E8DFF5', mint: '#C5B3E0', peach: '#F5D0B5',
  text: '#2E2A3D', textMuted: '#756B85', border: '#DDD0EB',
  green: '#6B9B6B', amber: '#E8C96A',
};

const card = {
  background: 'white', border: `1px solid ${COLORS.border}`,
  borderRadius: 16, padding: 16,
};

/* ═══════════════════════════════════════════════════════════
   טיפוסי אתגרים
═══════════════════════════════════════════════════════════ */

export const CHALLENGE_TYPES = {
  protein_goal: { label: 'יעד חלבון יומי', icon: '🥩', unit: 'g', desc: 'מספר ימים שהשגתי יעד חלבון' },
  water_goal:   { label: 'יעד שתייה',     icon: '💧', unit: 'ml', desc: 'מספר ימים שהשגתי יעד מים' },
  workout_count:{ label: 'אימונים',        icon: '💪', unit: 'workouts', desc: 'מספר אימונים שהושלמו' },
  streak:       { label: 'streak',         icon: '🔥', unit: 'days', desc: 'מספר ימים רצופים פעילים' },
  steps:        { label: 'צעדים',          icon: '👟', unit: 'steps', desc: 'סך כל הצעדים בתקופה' },
  daily_score:  { label: 'ציון יומי',      icon: '⭐', unit: 'score', desc: 'ממוצע ציון יומי' },
};

/* ═══════════════════════════════════════════════════════════
   API
═══════════════════════════════════════════════════════════ */

export async function listActiveChallenges(coachId) {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from('challenges')
    .select('*')
    .eq('coach_id', coachId)
    .gte('end_date', today)
    .order('end_date', { ascending: true });
  return data || [];
}

export async function getClientChallenges(clientId) {
  // אתגרים שהלקוחה הזו משתתפת בהם
  const { data: parts } = await supabase
    .from('challenge_participants')
    .select('*, challenges!inner(*)')
    .eq('client_id', clientId);
  return (parts || []).filter(p => {
    const today = new Date().toISOString().slice(0, 10);
    return p.challenges.end_date >= today;
  });
}

export async function createChallenge(coachId, params) {
  const { data, error } = await supabase
    .from('challenges')
    .insert({
      coach_id: coachId,
      name: params.name,
      description: params.description,
      challenge_type: params.type,
      target_value: params.targetValue,
      target_unit: CHALLENGE_TYPES[params.type]?.unit || '',
      start_date: params.startDate,
      end_date: params.endDate,
      icon: CHALLENGE_TYPES[params.type]?.icon || '🏆',
    })
    .select()
    .single();

  // הוסף את כל המשתתפות
  if (data && params.clientIds && params.clientIds.length > 0) {
    const inserts = params.clientIds.map((cid, idx) => ({
      challenge_id: data.id,
      client_id: cid,
      display_name: `משתתפת ${idx + 1}`, // אנונימי
    }));
    await supabase.from('challenge_participants').insert(inserts);
  }

  return { data, error };
}

export async function getLeaderboard(challengeId) {
  const { data } = await supabase
    .from('challenge_participants')
    .select('*')
    .eq('challenge_id', challengeId)
    .order('current_value', { ascending: false });
  return data || [];
}

// חישוב התקדמות בכל אתגר ועדכון current_value
export async function refreshChallengeProgress(challengeId) {
  const { data: challenge } = await supabase
    .from('challenges').select('*').eq('id', challengeId).single();
  if (!challenge) return;

  const { data: parts } = await supabase
    .from('challenge_participants').select('client_id').eq('challenge_id', challengeId);
  if (!parts) return;

  for (const p of parts) {
    const value = await calcParticipantValue(p.client_id, challenge);
    await supabase.from('challenge_participants')
      .update({ current_value: value })
      .eq('challenge_id', challengeId)
      .eq('client_id', p.client_id);
  }
}

async function calcParticipantValue(clientId, challenge) {
  const { challenge_type, start_date, end_date, target_value } = challenge;

  if (challenge_type === 'streak') {
    const { data } = await supabase
      .from('clients').select('streak').eq('id', clientId).maybeSingle();
    return data?.streak || 0;
  }

  if (challenge_type === 'protein_goal') {
    // מספר ימים שהציון של חלבון היה 20 (כלומר השגתי 100% מהיעד)
    const { data } = await supabase
      .from('daily_scores').select('protein_pts')
      .eq('client_id', clientId)
      .gte('score_date', start_date).lte('score_date', end_date);
    return (data || []).filter(d => d.protein_pts === 20).length;
  }

  if (challenge_type === 'water_goal') {
    const { data } = await supabase
      .from('daily_scores').select('water_pts')
      .eq('client_id', clientId)
      .gte('score_date', start_date).lte('score_date', end_date);
    return (data || []).filter(d => d.water_pts === 20).length;
  }

  if (challenge_type === 'workout_count') {
    const { data } = await supabase
      .from('daily_scores').select('workout_pts')
      .eq('client_id', clientId)
      .gte('score_date', start_date).lte('score_date', end_date);
    return (data || []).filter(d => d.workout_pts >= 18).length;
  }

  if (challenge_type === 'steps') {
    const { data } = await supabase
      .from('steps_logs').select('steps')
      .eq('client_id', clientId)
      .gte('logged_for', start_date).lte('logged_for', end_date);
    return (data || []).reduce((s, d) => s + d.steps, 0);
  }

  if (challenge_type === 'daily_score') {
    const { data } = await supabase
      .from('daily_scores').select('total_score')
      .eq('client_id', clientId)
      .gte('score_date', start_date).lte('score_date', end_date);
    if (!data || data.length === 0) return 0;
    return Math.round(data.reduce((s, d) => s + d.total_score, 0) / data.length);
  }

  return 0;
}

/* ═══════════════════════════════════════════════════════════
   קומפוננטה: כרטיס אתגר עם leaderboard למתאמנת
═══════════════════════════════════════════════════════════ */

export function ChallengeCard({ challenge, clientId }) {
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!challenge?.id) return;
    refreshChallengeProgress(challenge.id).then(() => {
      getLeaderboard(challenge.id).then(b => {
        setBoard(b);
        setLoading(false);
      });
    });
  }, [challenge?.id]);

  if (loading) return null;

  const meta = CHALLENGE_TYPES[challenge.challenge_type] || {};
  const myEntry = board.find(b => b.client_id === clientId);
  const myRank = board.findIndex(b => b.client_id === clientId) + 1;

  const daysLeft = Math.max(0,
    Math.ceil((new Date(challenge.end_date) - new Date()) / 86400000)
  );

  const myProgress = myEntry?.current_value || 0;
  const targetValue = challenge.target_value || 0;
  const percent = targetValue > 0 ? Math.min((myProgress / targetValue) * 100, 100) : 0;

  return (
    <section style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 28 }}>{challenge.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: COLORS.text }}>
            {challenge.name}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: COLORS.textMuted }}>
            {daysLeft} ימים נותרו · {board.length} משתתפות
          </p>
        </div>
        {myRank > 0 && (
          <div style={{
            background: myRank === 1 ? '#FFD700' : myRank === 2 ? '#C0C0C0' : myRank === 3 ? '#CD7F32' : COLORS.primary,
            color: 'white', borderRadius: '50%',
            width: 32, height: 32, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800,
          }}>
            #{myRank}
          </div>
        )}
      </div>

      {/* התקדמות אישית */}
      {targetValue > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: COLORS.textMuted }}>היעד שלי</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.text }}>
              {myProgress} / {targetValue} {meta.unit || ''}
            </span>
          </div>
          <div style={{
            height: 8, background: COLORS.primarySoft,
            borderRadius: 99, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', width: `${percent}%`,
              background: percent >= 100 ? COLORS.green : COLORS.primary,
              transition: 'width 0.4s',
            }} />
          </div>
        </div>
      )}

      {/* Leaderboard מקוצר */}
      <div style={{
        background: COLORS.bg, borderRadius: 10, padding: 8,
      }}>
        <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textAlign: 'center' }}>
          🏆 LEADERBOARD
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {board.slice(0, 5).map((p, idx) => {
            const isMe = p.client_id === clientId;
            return (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: 6, borderRadius: 6,
                background: isMe ? COLORS.primarySoft : 'transparent',
                border: isMe ? `1px solid ${COLORS.primary}` : 'none',
              }}>
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  width: 18, textAlign: 'center',
                  color: idx === 0 ? '#D4A017' : idx === 1 ? '#888' : idx === 2 ? '#B87333' : COLORS.textMuted,
                }}>
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                </span>
                <span style={{ flex: 1, fontSize: 11, color: COLORS.text, fontWeight: isMe ? 700 : 500 }}>
                  {isMe ? 'את 💜' : p.display_name || `משתתפת ${idx + 1}`}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.primaryDark }}>
                  {p.current_value || 0} {meta.unit || ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   קומפוננטה: רשימת אתגרים פעילים למתאמנת
═══════════════════════════════════════════════════════════ */

export function ClientChallengesList({ clientId }) {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    getClientChallenges(clientId).then(c => {
      setChallenges(c);
      setLoading(false);
    });
  }, [clientId]);

  if (loading || challenges.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: COLORS.primaryDark }}>
        🏆 האתגרים הפעילים שלי
      </p>
      {challenges.map(p => (
        <ChallengeCard key={p.challenges.id} challenge={p.challenges} clientId={clientId} />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   קומפוננטה: ניהול אתגרים למאמנת
═══════════════════════════════════════════════════════════ */

export function CoachChallengesManager({ coachId }) {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // טופס יצירה
  const [name, setName] = useState('');
  const [type, setType] = useState('protein_goal');
  const [targetValue, setTargetValue] = useState(7);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [selectedClients, setSelectedClients] = useState([]);
  const [allClients, setAllClients] = useState([]);

  const load = async () => {
    setLoading(true);
    const list = await listActiveChallenges(coachId);
    setChallenges(list);
    const { data: cs } = await supabase
      .from('clients').select('id, full_name')
      .eq('coach_id', coachId)
      .or('is_archived.is.null,is_archived.eq.false');
    setAllClients(cs || []);
    setLoading(false);
  };

  useEffect(() => { if (coachId) load(); }, [coachId]);

  const handleCreate = async () => {
    if (!name.trim() || selectedClients.length === 0) {
      alert('צריך שם ולפחות משתתפת אחת');
      return;
    }
    const { error } = await createChallenge(coachId, {
      name, type, targetValue, startDate, endDate,
      clientIds: selectedClients,
    });
    if (error) alert('שגיאה: ' + error.message);
    else {
      setCreating(false);
      setName(''); setSelectedClients([]);
      load();
    }
  };

  const toggleClient = (id) => {
    setSelectedClients(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  if (loading) return <p style={{ textAlign: 'center', color: COLORS.textMuted }}>טוענת...</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: COLORS.text }}>
          🏆 אתגרים פעילים ({challenges.length})
        </p>
        {!creating && (
          <button onClick={() => setCreating(true)} style={{
            padding: '6px 12px', background: COLORS.primary, color: 'white',
            border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            + אתגר חדש
          </button>
        )}
      </div>

      {creating && (
        <div style={{ ...card, background: COLORS.primarySoft }}>
          <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: COLORS.primaryDark }}>
            יצירת אתגר חדש
          </p>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="שם האתגר (למשל: 30 יום של חלבון)"
            style={{
              width: '100%', padding: 10,
              border: `1px solid ${COLORS.border}`, borderRadius: 8,
              fontSize: 13, fontFamily: 'inherit', marginBottom: 8,
              boxSizing: 'border-box', outline: 'none',
            }}
          />

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={{
              width: '100%', padding: 10,
              border: `1px solid ${COLORS.border}`, borderRadius: 8,
              fontSize: 13, fontFamily: 'inherit', marginBottom: 8,
              boxSizing: 'border-box', outline: 'none', background: 'white',
            }}
          >
            {Object.entries(CHALLENGE_TYPES).map(([key, m]) => (
              <option key={key} value={key}>{m.icon} {m.label}</option>
            ))}
          </select>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <input
              type="number" value={targetValue}
              onChange={(e) => setTargetValue(parseInt(e.target.value) || 0)}
              placeholder="ערך יעד"
              style={{
                padding: 10, border: `1px solid ${COLORS.border}`, borderRadius: 8,
                fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
              }}
            />
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: COLORS.textMuted }}>
              {CHALLENGE_TYPES[type]?.unit}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              style={{ padding: 8, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 12, fontFamily: 'inherit', direction: 'ltr', boxSizing: 'border-box' }} />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              style={{ padding: 8, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 12, fontFamily: 'inherit', direction: 'ltr', boxSizing: 'border-box' }} />
          </div>

          <p style={{ margin: '8px 0', fontSize: 11, fontWeight: 700, color: COLORS.text }}>
            בחרי משתתפות ({selectedClients.length}):
          </p>
          <div style={{ maxHeight: 150, overflowY: 'auto', background: 'white', borderRadius: 8, padding: 6 }}>
            {allClients.map(c => (
              <div key={c.id} onClick={() => toggleClient(c.id)} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: 6, borderRadius: 6, cursor: 'pointer',
                background: selectedClients.includes(c.id) ? COLORS.primarySoft : 'transparent',
              }}>
                <input type="checkbox" checked={selectedClients.includes(c.id)} readOnly />
                <span style={{ fontSize: 12, color: COLORS.text }}>{c.full_name}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
            <button onClick={handleCreate} style={{
              flex: 1, background: COLORS.primary, color: 'white',
              border: 'none', padding: 10, borderRadius: 8,
              fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              ✓ צרי אתגר
            </button>
            <button onClick={() => setCreating(false)} style={{
              background: 'white', color: COLORS.textMuted,
              border: `1px solid ${COLORS.border}`, padding: 10, borderRadius: 8,
              fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
            }}>ביטול</button>
          </div>
        </div>
      )}

      {challenges.length === 0 && !creating ? (
        <div style={{ ...card, textAlign: 'center', padding: 30 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🏆</div>
          <p style={{ margin: 0, fontSize: 13, color: COLORS.textMuted }}>אין אתגרים פעילים</p>
        </div>
      ) : (
        challenges.map(ch => (
          <CoachChallengeCard key={ch.id} challenge={ch} onRefresh={load} />
        ))
      )}
    </div>
  );
}

function CoachChallengeCard({ challenge, onRefresh }) {
  const [board, setBoard] = useState([]);
  const meta = CHALLENGE_TYPES[challenge.challenge_type] || {};
  const daysLeft = Math.max(0, Math.ceil((new Date(challenge.end_date) - new Date()) / 86400000));

  useEffect(() => {
    refreshChallengeProgress(challenge.id).then(() => {
      getLeaderboard(challenge.id).then(setBoard);
    });
  }, [challenge.id]);

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 28 }}>{challenge.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: COLORS.text }}>
            {challenge.name}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: COLORS.textMuted }}>
            {meta.label} · יעד {challenge.target_value} {meta.unit} · {daysLeft} ימים נותרו
          </p>
        </div>
      </div>

      <div style={{ background: COLORS.bg, borderRadius: 10, padding: 10 }}>
        {board.length === 0 ? (
          <p style={{ margin: 0, fontSize: 11, textAlign: 'center', color: COLORS.textMuted }}>
            אין נתונים עדיין
          </p>
        ) : (
          board.slice(0, 10).map((p, idx) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
              <span style={{ fontSize: 11, fontWeight: 700, width: 24, color: COLORS.textMuted }}>
                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
              </span>
              <span style={{ flex: 1, fontSize: 11, color: COLORS.text }}>
                {p.display_name}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.primaryDark }}>
                {p.current_value || 0} {meta.unit}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
