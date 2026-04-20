import React, { useState, useMemo, useEffect, useRef } from 'react';
import { supabase } from './supabase';


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

/* ========== MAIN APP ========== */

export default function App({ onLogout }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coachProfile, setCoachProfile] = useState(null);
  const [tab, setTab] = useState('dashboard');
  const [subView, setSubView] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [toast, setToast] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [chatMessages, setChatMessages] = useState({}); // { clientId: [messages] }

  // טען נתונים מ-Supabase
  useEffect(() => {
    loadAll();
    // רענן הודעות כל 10 שניות
    const interval = setInterval(() => loadMessages(), 10000);
    return () => clearInterval(interval);
  }, []);

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // טען פרופיל מאמנת
    const { data: coaches } = await supabase.from('coaches').select('*').eq('id', user.id).limit(1);
    if (coaches?.[0]) setCoachProfile(coaches[0]);

    // טען לקוחות
    const { data: clientsData } = await supabase
      .from('clients')
      .select('*')
      .eq('coach_id', user.id)
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
    setLoading(false);
    
    // טען הודעות בטעינה ראשונית
    await loadMessages();
  };

  const showToast = (text) => {
    setToast(text);
    setTimeout(() => setToast(null), 2000);
  };

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

  const sendMessageToClient = async (text) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !selectedClient || !text.trim()) return;
    await supabase.from('messages').insert({
      from_id: user.id,
      to_id: selectedClient.id,
      content: text.trim(),
    });
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

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLORS.bg }}>
        <div style={{ textAlign: 'center' }}>
          <img src="/logo.png" alt="" style={{ width: 120, marginBottom: 16 }} />
          <p style={{ color: COLORS.textMuted, fontSize: 14 }}>טוענת לקוחות...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ direction: 'rtl', fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif', background: COLORS.bg, minHeight: '100vh', paddingBottom: '72px', maxWidth: '440px', margin: '0 auto', position: 'relative', color: COLORS.text }}>

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

      {/* Sub-views override tabs */}
      {subView === 'clientProfile' && selectedClient && <ClientProfile client={selectedClient} onBack={goBack} onMessage={() => { markMessagesRead(selectedClient.id); setSubView('chat'); }} onEditGoals={() => setSubView('macro')} onEdit={() => setSubView('editClient')} onNutrition={() => setSubView('nutritionPlan')} onWorkout={() => setSubView('workoutPlan')} onProgress={() => setSubView('progress')} />}
      {subView === 'nutritionPlan' && selectedClient && <NutritionPlanCreator client={selectedClient} onBack={() => setSubView('clientProfile')} showToast={showToast} />}
      {subView === 'workoutPlan' && selectedClient && <WorkoutPlanCreator client={selectedClient} onBack={() => setSubView('clientProfile')} showToast={showToast} />}
      {subView === 'progress' && selectedClient && <ClientProgress client={selectedClient} onBack={() => setSubView('clientProfile')} />}
      {subView === 'addClient' && <AddClientModal onBack={goBack} showToast={showToast} onCreated={() => { loadAll(); goBack(); }} />}
      {subView === 'editClient' && selectedClient && <EditClientDetails client={selectedClient} onBack={() => setSubView('clientProfile')} onSave={(patch) => { updateClient(selectedClient.id, patch); showToast(`💾 פרטים נשמרו`); setSubView('clientProfile'); }} />}
      {subView === 'macro' && selectedClient && <MacroCalc client={selectedClient} onBack={goBack} onSave={(patch) => { updateClient(selectedClient.id, patch); showToast(`💾 יעדים נשמרו ל${selectedClient.name.split(' ')[0]}`); goBack(); }} />}
      {subView === 'macroPicker' && <MacroClientPicker clients={clients} onBack={goBack} onPick={(c) => openMacro(c)} />}
      {subView === 'message' && selectedClient && <MessageCompose client={selectedClient} text={messageText} setText={setMessageText} onBack={goBack} onSend={() => showToast('💜 הודעה נשלחה')} />}
      {subView === 'newClient' && <AddClientModal onBack={goBack} showToast={showToast} onCreated={() => { loadAll(); goBack(); }} />}
      {subView === 'chat' && selectedClient && <CoachChat client={selectedClient} messages={chatMessages[selectedClient.id] || []} onBack={goBack} onSend={sendMessageToClient} />}

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

      {/* Tab content — only if no subView */}
      {!subView && tab === 'dashboard' && (
        <DashboardTab
          clients={clients}
          loggedToday={loggedToday}
          activeCount={activeCount}
          needsAttention={needsAttention}
          onOpenClient={openClient}
          onOpenMessage={openMessage}
          onOpenMacro={() => setSubView('macroPicker')}
          onNewClient={() => setSubView('newClient')}
          showToast={showToast}
        />
      )}
      {!subView && tab === 'clients' && (
        <ClientsTab clients={clients} onOpenClient={openClient} onOpenMessage={openMessage} onNewClient={() => setSubView('newClient')} />
      )}
      {!subView && tab === 'meals' && <MealsTab showToast={showToast} />}
      {!subView && tab === 'workouts' && <WorkoutsTab showToast={showToast} />}
      {!subView && tab === 'settings' && <SettingsTab showToast={showToast} onLogout={onLogout} />}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '84px', left: '50%', transform: 'translateX(-50%)', background: COLORS.text, color: 'white', padding: '10px 18px', borderRadius: '999px', fontSize: '13px', fontWeight: 500, zIndex: 60, boxShadow: '0 4px 12px rgba(0,0,0,0.2)', whiteSpace: 'nowrap' }}>{toast}</div>
      )}

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
    { id: 'meals', label: 'מנות', icon: 'food' },
    { id: 'workouts', label: 'אימונים', icon: 'workout' },
    { id: 'settings', label: 'הגדרות', icon: 'settings' },
  ];
  return (
    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: '440px', margin: '0 auto', background: 'white', borderTop: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'space-around', padding: '8px 0 10px 0', zIndex: 25 }}>
      {tabs.map((t) => (
        <button key={t.id} onClick={() => setTab(t.id)}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '4px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', minWidth: '56px' }}>
          <CoachNavIcon name={t.icon} active={tab === t.id} />
          <span style={{ fontSize: '10px', color: tab === t.id ? COLORS.primaryDark : '#9B9B9B', fontWeight: tab === t.id ? 600 : 500 }}>{t.label}</span>
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
  };
  
  return icons[name] || icons.dashboard;
}

/* ===================== DASHBOARD TAB ===================== */
function DashboardTab({ clients, loggedToday, activeCount, needsAttention, onOpenClient, onOpenMessage, onOpenMacro, onNewClient, showToast }) {
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

/* ===================== MEALS TAB — IMPROVEMENT #3 ===================== */
function MealsTab({ showToast }) {
  const [mealFilter, setMealFilter] = useState('all');
  const [customMeals, setCustomMeals] = useState([]);
  const [showAIModal, setShowAIModal] = useState(false);
  const [mealFavorites, setMealFavorites] = useState([]);
  
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sappir_coach_meal_favs');
      if (saved) setMealFavorites(JSON.parse(saved));
    } catch(e) {}
  }, []);
  
  const toggleMealFav = (mealId, e) => {
    e?.stopPropagation();
    const isFav = mealFavorites.includes(mealId);
    const newFavs = isFav ? mealFavorites.filter(id => id !== mealId) : [...mealFavorites, mealId];
    setMealFavorites(newFavs);
    try { localStorage.setItem('sappir_coach_meal_favs', JSON.stringify(newFavs)); } catch(e) {}
  };

  const allMeals = [...MEAL_LIBRARY, ...customMeals];
  const filters = [
    { id: 'all', label: `הכל ${allMeals.length}` },
    { id: 'favorites', label: `⭐ מועדפים ${mealFavorites.length}` },
    { id: 'breakfast', label: `בוקר ${allMeals.filter(m => m.type === 'breakfast').length}` },
    { id: 'lunch', label: `צהריים ${allMeals.filter(m => m.type === 'lunch').length}` },
    { id: 'dinner', label: `ערב ${allMeals.filter(m => m.type === 'dinner').length}` },
    { id: 'snack', label: `נשנוש ${allMeals.filter(m => m.type === 'snack').length}` },
  ];
  const filtered = mealFilter === 'all' ? allMeals 
    : mealFilter === 'favorites' ? allMeals.filter(m => mealFavorites.includes(m.id))
    : allMeals.filter((m) => m.type === mealFilter);
  const mealTypeLabel = { breakfast: 'בוקר', lunch: 'צהריים', dinner: 'ערב', snack: 'נשנוש' };

  return (
    <>
      {showAIModal && (
        <AIMealModal
          onClose={() => setShowAIModal(false)}
          onAdd={(meal) => {
            setCustomMeals(prev => [...prev, { ...meal, id: 'ai-' + Date.now() }]);
            showToast('✅ מנה נוספה לספרייה!');
          }}
        />
      )}
      <main style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: COLORS.primaryDark }}>ספריית מנות</h2>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => setShowAIModal(true)} style={{ background: COLORS.primary, color: 'white', border: 'none', padding: '8px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ✨ צור עם AI
            </button>
            <button onClick={() => showToast('+ מנה ידנית')} style={{ background: 'white', color: COLORS.text, border: `1px solid ${COLORS.border}`, padding: '8px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              + ידני
            </button>
          </div>
        </div>

        <p style={{ fontSize: '12px', color: COLORS.textMuted, margin: 0 }}>{allMeals.length} מנות</p>

      {/* Meal type filter — IMPROVEMENT #3 */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
        {filters.map((f) => (
          <button key={f.id} onClick={() => setMealFilter(f.id)} style={{
            background: mealFilter === f.id ? COLORS.primary : 'white',
            color: mealFilter === f.id ? 'white' : COLORS.text,
            border: `1px solid ${mealFilter === f.id ? COLORS.primary : COLORS.border}`,
            borderRadius: '999px', padding: '6px 14px', fontSize: '12px', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
          }}>{f.label}</button>
        ))}
      </div>

      {/* Meal cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filtered.length === 0 ? (
          <p style={{ textAlign: 'center', color: COLORS.textMuted, fontSize: '12px', padding: '20px 0' }}>
            {mealFilter === 'favorites' ? 'עדיין אין מנות מועדפות - לחצי על ☆' : 'אין מנות בקטגוריה זו'}
          </p>
        ) : filtered.map((m) => {
          const isFav = mealFavorites.includes(m.id);
          return (
          <div key={m.id} style={{ background: 'white', border: `1px solid ${COLORS.border}`, borderRadius: '14px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px', gap: '8px' }}>
              <button onClick={(e) => toggleMealFav(m.id, e)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '20px', padding: '2px 4px', color: isFav ? '#F5D76E' : '#D0D0D0', fontFamily: 'inherit', lineHeight: 1, flexShrink: 0 }}>
                {isFav ? '★' : '☆'}
              </button>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: COLORS.text }}>{m.name}</p>
                <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: COLORS.textMuted }}>{m.desc}</p>
              </div>
              <span style={{ background: COLORS.primarySoft, color: COLORS.primaryDark, fontSize: '10px', fontWeight: 600, padding: '3px 10px', borderRadius: '999px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                ⚙️ {mealTypeLabel[m.type]}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: COLORS.textMuted }}>
              <span>kcal <strong style={{ color: COLORS.text }}>{m.cal}</strong></span>
              <span style={{ color: COLORS.peach }}>F <strong>{m.f}g</strong></span>
              <span style={{ color: COLORS.primary }}>C <strong>{m.c}g</strong></span>
              <span style={{ color: COLORS.sky }}>P <strong>{m.p}g</strong></span>
            </div>
          </div>
          );
        })}
      </div>
      </main>
    </>
  );
}

/* ===================== AI MEAL GENERATOR ===================== */
function AIMealModal({ onClose, onAdd }) {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const systemPrompt = `אתה תזונאית מקצועית. המשתמשת מבקשת ממך ליצור מנת אוכל.
ענה אך ורק ב-JSON תקני ללא מרכאות backtick ובלי טקסט נוסף, בדיוק בפורמט הבא:
{"name":"שם המנה","type":"breakfast","desc":"תיאור קצר","cal":320,"p":18,"c":40,"f":8}
type חייב להיות אחד מ: breakfast, lunch, dinner, snack`;

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: 'user', content: `צרי מנה: ${prompt}` }],
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const text = data.content?.[0]?.text || '';
      const parsed = JSON.parse(text.trim());
      setResult(parsed);
    } catch {
      setError('לא הצלחתי ליצור מנה. נסי שוב עם תיאור אחר.');
    } finally {
      setLoading(false);
    }
  };

  const typeLabel = { breakfast: 'בוקר', lunch: 'צהריים', dinner: 'ערב', snack: 'נשנוש' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: 'white', borderRadius: '20px 20px 0 0', padding: '20px', width: '100%', maxWidth: '440px', direction: 'rtl' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: COLORS.primaryDark }}>✨ יצירת מנה עם AI</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <input
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && generate()}
            placeholder="למשל: ארוחת בוקר עשירה בחלבון עם 300 קלוריות"
            style={inputStyle}
            disabled={loading}
          />
          <button onClick={generate} disabled={!prompt.trim() || loading} style={{ background: COLORS.primary, color: 'white', border: 'none', padding: '0 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: (!prompt.trim() || loading) ? 'default' : 'pointer', opacity: (!prompt.trim() || loading) ? 0.5 : 1, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
            {loading ? '...' : 'צור'}
          </button>
        </div>

        {/* Suggestions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
          {['ארוחת בוקר 300 קק״ל', 'נשנוש חלבון 150 קק״ל', 'ארוחת צהריים ים תיכונית'].map((s, i) => (
            <button key={i} onClick={() => setPrompt(s)} style={{ background: COLORS.primarySoft, border: `1px solid ${COLORS.border}`, borderRadius: '999px', padding: '5px 12px', fontSize: '11px', color: COLORS.primaryDark, cursor: 'pointer', fontFamily: 'inherit' }}>{s}</button>
          ))}
        </div>

        {error && <p style={{ color: '#E53E3E', fontSize: '13px', margin: '0 0 12px 0' }}>{error}</p>}

        {result && (
          <div style={{ background: COLORS.primarySoft, border: `1px solid ${COLORS.primary}`, borderRadius: '14px', padding: '14px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: COLORS.text }}>{result.name}</p>
                <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: COLORS.textMuted }}>{result.desc}</p>
              </div>
              <span style={{ background: COLORS.primary, color: 'white', fontSize: '10px', fontWeight: 600, padding: '3px 10px', borderRadius: '999px' }}>{typeLabel[result.type] || result.type}</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: COLORS.textMuted }}>
              <span>kcal <strong style={{ color: COLORS.text }}>{result.cal}</strong></span>
              <span style={{ color: COLORS.sky }}>P <strong>{result.p}g</strong></span>
              <span style={{ color: COLORS.primary }}>C <strong>{result.c}g</strong></span>
              <span style={{ color: COLORS.peach }}>F <strong>{result.f}g</strong></span>
            </div>
            <button onClick={() => { onAdd(result); onClose(); }} style={{ ...primaryBtnStyle, marginTop: '10px', fontSize: '13px', padding: '10px' }}>
              ✅ הוסיפי לספרייה
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===================== WORKOUTS TAB — IMPROVEMENT #4 ===================== */
function WorkoutsTab({ showToast }) {
  const [workoutFavs, setWorkoutFavs] = useState([]);
  const [showFavsOnly, setShowFavsOnly] = useState(false);
  
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sappir_coach_workout_favs');
      if (saved) setWorkoutFavs(JSON.parse(saved));
    } catch(e) {}
  }, []);
  
  const toggleFav = (id, e) => {
    e?.stopPropagation();
    const isFav = workoutFavs.includes(id);
    const newFavs = isFav ? workoutFavs.filter(w => w !== id) : [...workoutFavs, id];
    setWorkoutFavs(newFavs);
    try { localStorage.setItem('sappir_coach_workout_favs', JSON.stringify(newFavs)); } catch(e) {}
  };
  
  const filteredWorkouts = showFavsOnly ? WORKOUT_LIBRARY.filter(w => workoutFavs.includes(w.id)) : WORKOUT_LIBRARY;
  
  return (
    <main style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: COLORS.primaryDark }}>ספריית אימונים</h2>
          <p style={{ fontSize: '12px', color: COLORS.textMuted, margin: '2px 0 0 0' }}>צרי תוכניות אימון להקצות ללקוחות</p>
        </div>
        <button onClick={() => showToast('+ תוכנית חדשה')} style={{ background: COLORS.primary, color: 'white', border: 'none', padding: '10px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          + תוכנית חדשה
        </button>
      </div>

      <div style={{ display: 'flex', gap: '6px' }}>
        <button onClick={() => setShowFavsOnly(false)} style={{ background: !showFavsOnly ? COLORS.primary : 'white', color: !showFavsOnly ? 'white' : COLORS.text, border: `1px solid ${!showFavsOnly ? COLORS.primary : COLORS.border}`, borderRadius: '999px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          כל האימונים
        </button>
        <button onClick={() => setShowFavsOnly(true)} style={{ background: showFavsOnly ? '#F5D76E' : 'white', color: COLORS.text, border: `1px solid ${showFavsOnly ? '#F5D76E' : COLORS.border}`, borderRadius: '999px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          ⭐ מועדפים ({workoutFavs.length})
        </button>
      </div>

      {/* Workout cards — IMPROVEMENT #4 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredWorkouts.length === 0 ? (
          <p style={{ textAlign: 'center', color: COLORS.textMuted, fontSize: '12px', padding: '20px 0' }}>
            {showFavsOnly ? 'עדיין אין אימונים מועדפים - לחצי על ☆' : 'אין אימונים'}
          </p>
        ) : filteredWorkouts.map((w) => {
          const isFav = workoutFavs.includes(w.id);
          return (
          <div key={w.id} style={{ background: 'white', border: `1px solid ${COLORS.border}`, borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button onClick={(e) => toggleFav(w.id, e)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '20px', padding: '2px 4px', color: isFav ? '#F5D76E' : '#D0D0D0', fontFamily: 'inherit', lineHeight: 1, flexShrink: 0 }}>
              {isFav ? '★' : '☆'}
            </button>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: COLORS.peachSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
              💪
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: COLORS.text }}>{w.name}</p>
              <p style={{ margin: '2px 0 8px 0', fontSize: '11px', color: COLORS.textMuted }}>{w.desc}</p>
              <div style={{ display: 'flex', gap: '16px', fontSize: '11px' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, color: COLORS.primaryDark }}>{w.days}</p>
                  <p style={{ margin: 0, color: COLORS.textMuted }}>ימים/שבוע</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, color: COLORS.primaryDark }}>{w.sessions}</p>
                  <p style={{ margin: 0, color: COLORS.textMuted }}>אימונים</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, color: COLORS.primaryDark }}>{w.exercises}</p>
                  <p style={{ margin: 0, color: COLORS.textMuted }}>תרגילים</p>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button onClick={() => {}} style={{ background: COLORS.primarySoft, border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}>✏️</button>
              <button onClick={() => {}} style={{ background: COLORS.redSoft, border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}>🗑️</button>
            </div>
          </div>
          );
        })}
      </div>
    </main>
  );
}

/* ===================== SETTINGS TAB ===================== */
function SettingsTab({ showToast, onLogout }) {
  return (
    <main style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: COLORS.primaryDark }}>הגדרות</h2>

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

      <section style={cardStyle}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px 0', color: COLORS.text }}>קודי לקוח</h3>
        <p style={{ fontSize: '12px', color: COLORS.textMuted, margin: '0 0 10px 0' }}>3 מתוך 5 בשימוש</p>
        <div style={{ height: '6px', background: COLORS.primarySoft, borderRadius: '999px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '60%', background: COLORS.primary }} />
        </div>
        <p style={{ fontSize: '11px', color: COLORS.textMuted, margin: '8px 0 0 0' }}>הגעת למגבלת הקודים. צריכים עוד? צרו קשר →</p>
      </section>

      <section style={cardStyle}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 8px 0', color: COLORS.text }}>כיוון האפליקציה</h3>
        <p style={{ fontSize: '12px', color: COLORS.textMuted, margin: '0 0 10px 0' }}>קובע את כיוון האפליקציה (RTL לעברית) ושפת הממשק</p>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button style={{ flex: 1, background: COLORS.primary, color: 'white', border: 'none', padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>עברית (RTL)</button>
          <button style={{ flex: 1, background: 'white', color: COLORS.text, border: `1px solid ${COLORS.border}`, padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>English</button>
        </div>
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
function ClientProfile({ client, onBack, onMessage, onEditGoals, onEdit, onNutrition, onWorkout, onProgress }) {
  const [tab, setTab] = useState('overview');
  const c = client;
  const weightSeries = [
    { date: '1.2', w: c.startWeight },
    { date: '15.2', w: c.startWeight - 1 },
    { date: '1.3', w: c.startWeight - 2 },
    { date: '15.3', w: c.startWeight - 3.5 },
    { date: '1.4', w: c.startWeight - 5 },
    { date: '15.4', w: c.weight },
  ];
  const minW = Math.min(...weightSeries.map(p => p.w), c.target) - 1;
  const maxW = Math.max(...weightSeries.map(p => p.w)) + 1;
  const range = maxW - minW;
  const chartW = 380, chartH = 140;
  const pad = { top: 20, right: 12, bottom: 24, left: 32 };
  const plotW = chartW - pad.left - pad.right, plotH = chartH - pad.top - pad.bottom;
  const xStep = plotW / (weightSeries.length - 1);
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
      
      {/* Action buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
        <button onClick={onNutrition} style={{ background: 'white', color: COLORS.primaryDark, border: `1px solid ${COLORS.border}`, padding: '10px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '20px' }}>🍽️</span>
          תוכנית תזונה
        </button>
        <button onClick={onWorkout} style={{ background: 'white', color: COLORS.primaryDark, border: `1px solid ${COLORS.border}`, padding: '10px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '20px' }}>💪</span>
          תוכנית אימון
        </button>
        <button onClick={onProgress} style={{ background: 'white', color: COLORS.primaryDark, border: `1px solid ${COLORS.border}`, padding: '10px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '20px' }}>📊</span>
          התקדמות
        </button>
      </div>

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
          {[
            { date: 'היום 8:30', type: '🥗', text: 'שייק חלבון — 320 קק״ל' },
            { date: 'היום 13:00', type: '🥗', text: 'סלט קינואה עם טונה — 450 קק״ל' },
            { date: 'אתמול 18:00', type: '🏋️', text: 'אימון רגליים · 4/4 תרגילים' },
            { date: 'אתמול 7:00', type: '⚖️', text: 'משקל: 68.2 ק״ג' },
            { date: 'לפני יומיים', type: '💧', text: 'שתייה: 2,400 מ״ל' },
          ].map((l, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', padding: '10px 0', borderBottom: i < 4 ? `1px solid ${COLORS.border}` : 'none' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[{ date: '1.2', label: 'לפני' }, { date: '15.4', label: 'אחרי' }, { date: '1.3', label: 'חודש 1' }, { date: '15.3', label: 'חודש 2' }].map((p, i) => (
              <div key={i} style={{ background: COLORS.primarySoft, aspectRatio: '3/4', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', border: `1px solid ${COLORS.border}` }}>
                <span style={{ fontSize: '32px', opacity: 0.5 }}>👤</span>
                <span style={{ fontSize: '10px', color: COLORS.textMuted, marginTop: '4px' }}>{p.date}</span>
                <span style={{ position: 'absolute', top: '4px', right: '4px', background: 'white', fontSize: '9px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', color: COLORS.primaryDark }}>{p.label}</span>
              </div>
            ))}
          </div>
        </section>
      )}
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
        {loading && <p style={{ textAlign: 'center', color: COLORS.textMuted, fontSize: '13px' }}>טוענת...</p>}
        {!loading && messages.length === 0 && (
          <p style={{ textAlign: 'center', color: COLORS.textMuted, fontSize: '13px', margin: 'auto 0' }}>
            עדיין אין הודעות.<br/>שלחי הודעה ראשונה 💜
          </p>
        )}
        {messages.map(m => (
          <div key={m.id} style={{
            maxWidth: '82%',
            padding: '9px 12px',
            borderRadius: '14px',
            fontSize: '13px',
            lineHeight: 1.5,
            alignSelf: m.from === 'coach' ? 'flex-end' : 'flex-start',
            background: m.from === 'coach' ? COLORS.primary : COLORS.primarySoft,
            color: m.from === 'coach' ? 'white' : COLORS.text,
          }}>
            <p style={{ margin: 0 }}>{m.text}</p>
            <p style={{ margin: '3px 0 0', fontSize: '10px', opacity: 0.7 }}>{m.time}</p>
          </div>
        ))}
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
        <BackHeader onBack={() => setStep(1)} title="הזמנה חדשה" />
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
function CoachChat({ client, messages, onBack, onSend }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
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

  const templates = [
    `${client.name.split(' ')[0]}, כבוד! המשיכי ככה 💜`,
    'איך ההרגשה היום?',
    'בוקר טוב! זוכרת שיש לך אימון היום',
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
        {messages.map(m => (
          <div key={m.id} style={{
            maxWidth: '82%',
            padding: '9px 13px',
            borderRadius: 14,
            fontSize: 13,
            lineHeight: 1.5,
            alignSelf: m.from === 'coach' ? 'flex-end' : 'flex-start',
            background: m.from === 'coach' ? COLORS.primary : 'white',
            color: m.from === 'coach' ? 'white' : COLORS.text,
            border: m.from === 'coach' ? 'none' : `1px solid ${COLORS.border}`,
            boxShadow: m.from === 'coach' ? 'none' : '0 1px 2px rgba(0,0,0,0.04)',
          }}>
            <p style={{ margin: 0 }}>{m.text}</p>
            <p style={{ margin: '3px 0 0', fontSize: 10, opacity: 0.7 }}>{m.time}</p>
          </div>
        ))}
      </div>

      <div style={{ padding: '10px 14px', background: 'white', borderTop: `1px solid ${COLORS.border}` }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {templates.map((t, i) => (
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
        <div style={{ display: 'flex', gap: 8 }}>
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
    </main>
  );
}

/* ═══════════════════════════════════════════════════════════
   NUTRITION PLAN CREATOR — יוצרת תוכנית תזונה ללקוחה
═══════════════════════════════════════════════════════════ */
function NutritionPlanCreator({ client, onBack, showToast }) {
  const [breakfastCal, setBreakfastCal] = useState(350);
  const [breakfastItems, setBreakfastItems] = useState('');
  const [lunchCal, setLunchCal] = useState(520);
  const [lunchItems, setLunchItems] = useState('');
  const [snackCal, setSnackCal] = useState(200);
  const [snackItems, setSnackItems] = useState('');
  const [dinnerCal, setDinnerCal] = useState(400);
  const [dinnerItems, setDinnerItems] = useState('');
  const [saving, setSaving] = useState(false);
  const [existingPlan, setExistingPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExisting();
  }, [client.id]);

  const loadExisting = async () => {
    const { data } = await supabase
      .from('nutrition_plans')
      .select('*')
      .eq('client_id', client.id)
      .eq('active', true)
      .limit(1);

    if (data && data[0]) {
      const p = data[0];
      setExistingPlan(p);
      setBreakfastCal(p.breakfast_cal || 350);
      setBreakfastItems((p.breakfast_items || []).join('\n'));
      setLunchCal(p.lunch_cal || 520);
      setLunchItems((p.lunch_items || []).join('\n'));
      setSnackCal(p.snack_cal || 200);
      setSnackItems((p.snack_items || []).join('\n'));
      setDinnerCal(p.dinner_cal || 400);
      setDinnerItems((p.dinner_items || []).join('\n'));
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);

    const planData = {
      client_id: client.id,
      active: true,
      breakfast_cal: parseInt(breakfastCal) || 0,
      breakfast_items: breakfastItems.split('\n').filter(s => s.trim()),
      lunch_cal: parseInt(lunchCal) || 0,
      lunch_items: lunchItems.split('\n').filter(s => s.trim()),
      snack_cal: parseInt(snackCal) || 0,
      snack_items: snackItems.split('\n').filter(s => s.trim()),
      dinner_cal: parseInt(dinnerCal) || 0,
      dinner_items: dinnerItems.split('\n').filter(s => s.trim()),
    };

    if (existingPlan) {
      // עדכן קיים
      await supabase.from('nutrition_plans').update(planData).eq('id', existingPlan.id);
    } else {
      // צור חדש
      await supabase.from('nutrition_plans').insert(planData);
    }

    setSaving(false);
    showToast('💾 תוכנית תזונה נשמרה');
    onBack();
  };

  const total = parseInt(breakfastCal || 0) + parseInt(lunchCal || 0) + parseInt(snackCal || 0) + parseInt(dinnerCal || 0);

  if (loading) {
    return <main style={{ padding: '14px', textAlign: 'center', color: COLORS.textMuted }}>טוענת...</main>;
  }

  const mealInput = (label, icon, cal, setCal, items, setItems, color) => (
    <section style={{ ...cardStyle, borderRight: `4px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: COLORS.text }}>{icon} {label}</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input 
            type="number" 
            value={cal} 
            onChange={(e) => setCal(e.target.value)}
            style={{ width: '70px', ...inputStyle, textAlign: 'center', padding: '6px 8px' }}
          />
          <span style={{ fontSize: '12px', color: COLORS.textMuted }}>קק״ל</span>
        </div>
      </div>
      <textarea
        value={items}
        onChange={(e) => setItems(e.target.value)}
        placeholder={`לדוגמה:\nחזה עוף 150g\nאורז מלא 150g\nסלט ירוק`}
        rows={4}
        style={{ ...inputStyle, resize: 'vertical', direction: 'rtl' }}
      />
      <p style={{ fontSize: '10px', color: COLORS.textMuted, margin: '4px 0 0' }}>שורה לכל פריט</p>
    </section>
  );

  return (
    <main style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <BackHeader onBack={onBack} title={`תוכנית תזונה: ${client.name.split(' ')[0]}`} />
      
      <div style={{ ...cardStyle, background: COLORS.primarySoft, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: COLORS.primaryDark }}>סה״כ יומי:</span>
        <span style={{ fontSize: '20px', fontWeight: 700, color: COLORS.primaryDark }}>{total} קק״ל</span>
      </div>

      {mealInput('ארוחת בוקר', '☀️', breakfastCal, setBreakfastCal, breakfastItems, setBreakfastItems, '#F4A460')}
      {mealInput('ארוחת צהריים', '🌞', lunchCal, setLunchCal, lunchItems, setLunchItems, COLORS.primary)}
      {mealInput('נשנוש', '🍎', snackCal, setSnackCal, snackItems, setSnackItems, '#E8A5A5')}
      {mealInput('ארוחת ערב', '🌙', dinnerCal, setDinnerCal, dinnerItems, setDinnerItems, '#9B7FBF')}

      <button onClick={handleSave} disabled={saving} style={{ 
        width: '100%', 
        background: COLORS.primary, 
        color: 'white', 
        border: 'none', 
        padding: '14px', 
        borderRadius: '12px', 
        fontSize: '14px', 
        fontWeight: 600, 
        cursor: saving ? 'default' : 'pointer', 
        fontFamily: 'inherit',
        opacity: saving ? 0.5 : 1,
      }}>
        {saving ? 'שומרת...' : existingPlan ? '💾 עדכני תוכנית' : '✨ צרי תוכנית'}
      </button>
    </main>
  );
}

/* ═══════════════════════════════════════════════════════════
   WORKOUT PLAN CREATOR — יוצרת תוכנית אימון ללקוחה
═══════════════════════════════════════════════════════════ */
function WorkoutPlanCreator({ client, onBack, showToast }) {
  const [planName, setPlanName] = useState('אימון רגליים');
  const [exercises, setExercises] = useState([]);
  const [newName, setNewName] = useState('');
  const [newSets, setNewSets] = useState(3);
  const [newReps, setNewReps] = useState('10');
  const [newRest, setNewRest] = useState(60);
  const [saving, setSaving] = useState(false);
  const [existingPlan, setExistingPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExisting();
  }, [client.id]);

  const loadExisting = async () => {
    const { data } = await supabase
      .from('workout_plans')
      .select('*, workout_exercises(*)')
      .eq('client_id', client.id)
      .eq('active', true)
      .limit(1);

    if (data && data[0]) {
      const p = data[0];
      setExistingPlan(p);
      setPlanName(p.name || 'אימון');
      if (p.workout_exercises) {
        setExercises(p.workout_exercises
          .sort((a, b) => a.order_index - b.order_index)
          .map(e => ({
            id: e.id,
            name: e.name,
            sets: e.sets,
            reps: e.reps,
            rest: e.rest,
            icon: e.icon || '💪',
          })));
      }
    }
    setLoading(false);
  };

  const addExercise = () => {
    if (!newName.trim()) return;
    setExercises(prev => [...prev, {
      id: Date.now(),
      name: newName.trim(),
      sets: parseInt(newSets) || 3,
      reps: newReps,
      rest: parseInt(newRest) || 60,
      icon: '💪',
      isNew: true,
    }]);
    setNewName('');
    setNewSets(3);
    setNewReps('10');
    setNewRest(60);
  };

  const removeExercise = (id) => {
    setExercises(prev => prev.filter(e => e.id !== id));
  };

  const handleSave = async () => {
    if (exercises.length === 0) {
      showToast('⚠️ הוסיפי לפחות תרגיל אחד');
      return;
    }

    setSaving(true);

    let planId;
    if (existingPlan) {
      // עדכן תוכנית קיימת
      await supabase.from('workout_plans').update({ name: planName }).eq('id', existingPlan.id);
      planId = existingPlan.id;
      // מחק את כל התרגילים הקיימים
      await supabase.from('workout_exercises').delete().eq('plan_id', planId);
    } else {
      // צור תוכנית חדשה
      const { data } = await supabase.from('workout_plans').insert({
        client_id: client.id,
        name: planName,
        active: true,
      }).select();
      
      if (data && data[0]) planId = data[0].id;
    }

    if (planId) {
      // הכנס את כל התרגילים
      const exToInsert = exercises.map((e, i) => ({
        plan_id: planId,
        name: e.name,
        sets: e.sets,
        reps: e.reps,
        rest: e.rest,
        icon: e.icon,
        order_index: i,
      }));
      
      await supabase.from('workout_exercises').insert(exToInsert);
    }

    setSaving(false);
    showToast('💾 תוכנית אימון נשמרה');
    onBack();
  };

  if (loading) {
    return <main style={{ padding: '14px', textAlign: 'center', color: COLORS.textMuted }}>טוענת...</main>;
  }

  return (
    <main style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <BackHeader onBack={onBack} title={`תוכנית אימון: ${client.name.split(' ')[0]}`} />

      <section style={cardStyle}>
        <Field label="שם התוכנית">
          <input value={planName} onChange={(e) => setPlanName(e.target.value)} style={inputStyle} />
        </Field>
      </section>

      {/* רשימת תרגילים */}
      <section style={cardStyle}>
        <h4 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 700, color: COLORS.primaryDark }}>
          💪 תרגילים ({exercises.length})
        </h4>
        {exercises.length === 0 && (
          <p style={{ textAlign: 'center', color: COLORS.textMuted, fontSize: '12px', padding: '16px 0' }}>
            עדיין לא הוספת תרגילים
          </p>
        )}
        {exercises.map((ex, i) => (
          <div key={ex.id} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            padding: '10px', 
            background: COLORS.bg, 
            borderRadius: '10px', 
            marginBottom: '6px',
            border: `1px solid ${COLORS.border}`
          }}>
            <span style={{ fontSize: '11px', color: COLORS.textMuted, minWidth: '20px' }}>{i + 1}.</span>
            <span style={{ fontSize: '18px' }}>{ex.icon}</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>{ex.name}</p>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: COLORS.textMuted }}>
                {ex.sets} סטים × {ex.reps} · מנוחה {ex.rest} שנ׳
              </p>
            </div>
            <button 
              onClick={() => removeExercise(ex.id)} 
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#C88A8A' }}
            >
              🗑️
            </button>
          </div>
        ))}
      </section>

      {/* הוספת תרגיל */}
      <section style={cardStyle}>
        <h4 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 700, color: COLORS.primaryDark }}>
          ➕ הוסיפי תרגיל
        </h4>
        <Field label="שם התרגיל">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="לדוגמה: סקוואט" style={inputStyle} />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '10px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>סטים</label>
            <input type="number" value={newSets} onChange={(e) => setNewSets(e.target.value)} style={{ ...inputStyle, textAlign: 'center' }} />
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>חזרות</label>
            <input value={newReps} onChange={(e) => setNewReps(e.target.value)} placeholder="10" style={{ ...inputStyle, textAlign: 'center' }} />
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>מנוחה (שנ׳)</label>
            <input type="number" value={newRest} onChange={(e) => setNewRest(e.target.value)} style={{ ...inputStyle, textAlign: 'center' }} />
          </div>
        </div>
        <button onClick={addExercise} disabled={!newName.trim()} style={{ 
          width: '100%', 
          background: COLORS.primarySoft, 
          color: COLORS.primaryDark, 
          border: `1px solid ${COLORS.border}`, 
          padding: '10px', 
          borderRadius: '10px', 
          fontSize: '13px', 
          fontWeight: 600, 
          cursor: newName.trim() ? 'pointer' : 'default', 
          fontFamily: 'inherit',
          opacity: newName.trim() ? 1 : 0.5,
        }}>
          + הוסיפי לרשימה
        </button>
      </section>

      <button onClick={handleSave} disabled={saving || exercises.length === 0} style={{ 
        width: '100%', 
        background: COLORS.primary, 
        color: 'white', 
        border: 'none', 
        padding: '14px', 
        borderRadius: '12px', 
        fontSize: '14px', 
        fontWeight: 600, 
        cursor: (saving || exercises.length === 0) ? 'default' : 'pointer', 
        fontFamily: 'inherit',
        opacity: (saving || exercises.length === 0) ? 0.5 : 1,
      }}>
        {saving ? 'שומרת...' : existingPlan ? '💾 עדכני תוכנית' : '✨ צרי תוכנית'}
      </button>
    </main>
  );
}

/* ═══════════════════════════════════════════════════════════
   CLIENT PROGRESS VIEWER — צפייה בהתקדמות הלקוחה
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
    return <main style={{ padding: '14px', textAlign: 'center', color: COLORS.textMuted }}>טוענת נתונים...</main>;
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

      // צור משתמש חדש ב-Supabase
      // שים לב: זה לא ייצור user ב-auth בלי admin API
      // במקום זאת, נציג הוראות לספיר ליצור אותו ידנית
      setResult({
        fullName,
        phone,
        email,
        password,
        height,
        age,
        startWeight,
        targetWeight,
        coachId: coach.id,
      });
      setStep(3);
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
        
        <section style={{ ...cardStyle, background: COLORS.primarySoft, border: `2px dashed ${COLORS.primary}` }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 12px', color: COLORS.primaryDark, textAlign: 'center' }}>
            📋 פרטי הלקוחה החדשה
          </h3>
          <p style={{ fontSize: '12px', color: COLORS.text, margin: '0 0 12px', lineHeight: 1.6 }}>
            כדי להשלים את יצירת הלקוחה, בצעי את השלבים הבאים ב-Supabase:
          </p>

          <div style={{ background: 'white', borderRadius: '8px', padding: '12px', marginBottom: '8px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: COLORS.primaryDark, margin: '0 0 6px' }}>🔐 שלב 1: Authentication → Users → Add user</p>
            <div style={{ fontSize: '12px', fontFamily: 'monospace', direction: 'ltr', textAlign: 'right' }}>
              <p style={{ margin: '2px 0' }}>Email: <strong>{result.email}</strong></p>
              <p style={{ margin: '2px 0' }}>Password: <strong>{result.password}</strong></p>
              <p style={{ margin: '2px 0', fontSize: '10px', color: COLORS.textMuted }}>✓ Auto Confirm User</p>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '8px', padding: '12px', marginBottom: '8px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: COLORS.primaryDark, margin: '0 0 6px' }}>📝 שלב 2: העתיקי את ה-UUID שנוצר</p>
          </div>

          <div style={{ background: 'white', borderRadius: '8px', padding: '12px', marginBottom: '10px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: COLORS.primaryDark, margin: '0 0 6px' }}>💾 שלב 3: SQL Editor — הדביקי:</p>
            <pre style={{ 
              fontSize: '10px', 
              background: COLORS.bg, 
              padding: '8px', 
              borderRadius: '6px', 
              direction: 'ltr', 
              textAlign: 'left',
              overflowX: 'auto',
              margin: 0,
              whiteSpace: 'pre-wrap'
            }}>
{`insert into clients (
  id, coach_id, full_name, email, phone,
  height_cm, age, start_weight, 
  current_weight, target_weight,
  goal, activity_level,
  daily_calorie_goal, daily_protein_goal, 
  daily_carb_goal, daily_fat_goal,
  daily_water_goal_ml
) values (
  'UUID_HERE',
  '${result.coachId}',
  '${result.fullName}',
  '${result.email}',
  '${result.phone || ''}',
  ${result.height || 'null'}, ${result.age || 'null'},
  ${result.startWeight}, ${result.startWeight}, ${result.targetWeight},
  'lose', 'moderate',
  1800, 113, 225, 50, 2500
);`}
            </pre>
          </div>

          <button 
            onClick={() => {
              const text = `אימייל: ${result.email}\nסיסמה: ${result.password}\nשם: ${result.fullName}`;
              if (navigator.clipboard) {
                navigator.clipboard.writeText(text);
                showToast('📋 הועתק!');
              }
            }}
            style={{ 
              width: '100%', 
              background: 'white', 
              color: COLORS.primaryDark, 
              border: `1px solid ${COLORS.border}`, 
              padding: '10px', 
              borderRadius: '10px', 
              fontSize: '13px', 
              fontWeight: 600, 
              cursor: 'pointer', 
              fontFamily: 'inherit',
              marginBottom: '6px'
            }}
          >
            📋 העתיקי פרטים
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
            סיימתי ✓
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

