import React, { useState, useRef, useEffect } from 'react';

const COLORS = {
  bg:'#F0F7F2',primary:'#7BB892',primaryDark:'#5A9A70',primarySoft:'#D6EDDE',
  accent:'#F4C2C2',accentDark:'#C88A8A',mint:'#A8D5BA',mintSoft:'#D7EDE0',
  peach:'#F5D0B5',peachSoft:'#FBE8D7',sky:'#9CC5B5',skySoft:'#D4E8DF',
  amber:'#E8C96A',amberSoft:'#F5EECD',text:'#2D3E33',textMuted:'#6B8574',border:'#D0E3D6',
};

const PROFILES=[
  {id:1,firstName:'דניאל',weight:68,startWeight:74,target:62,streak:14,
   dailyCalorieGoal:1800,dailyProteinGoal:113,dailyCarbGoal:225,dailyFatGoal:50,
   dailyWaterGoalMl:2500,age:34,sex:'female',height:165,activity:'moderate',goal:'lose'},
  {id:2,firstName:'מיכל',weight:74,startWeight:79,target:68,streak:7,
   dailyCalorieGoal:1750,dailyProteinGoal:131,dailyCarbGoal:197,dailyFatGoal:49,
   dailyWaterGoalMl:2200,age:38,sex:'female',height:170,activity:'light',goal:'lose'},
];

const PLAN={
  breakfast:{name:'ארוחת בוקר',cal:350,p:20,c:40,f:10,items:['חביתה מ-2 ביצים','לחם מלא','ירקות']},
  lunch:    {name:'ארוחת צהריים',cal:520,p:38,c:55,f:8, items:['חזה עוף 150g','אורז מלא 150g','סלט']},
  snack:    {name:'נשנוש',cal:200,p:10,c:20,f:6, items:['יוגורט יווני','שקדים 30g']},
  dinner:   {name:'ארוחת ערב',cal:400,p:30,c:30,f:14,items:['סלמון 120g','בטטה 200g','ברוקולי']},
};

const FOOD_LIB=[
  {id:'f1',name:'חזה עוף 100g',   cal:165,p:31,c:0, f:3, icon:'🍗'},
  {id:'f2',name:'אורז מלא 100g',  cal:216,p:5, c:45,f:2, icon:'🍚'},
  {id:'f3',name:'ביצה אחת',       cal:72, p:6, c:0, f:5, icon:'🥚'},
  {id:'f4',name:'בננה',           cal:89, p:1, c:23,f:0, icon:'🍌'},
  {id:'f5',name:'יוגורט יווני 150g',cal:130,p:17,c:7,f:4,icon:'🥛'},
  {id:'f6',name:'שקדים 30g',      cal:173,p:6, c:6, f:15,icon:'🌰'},
  {id:'f7',name:'סלמון 120g',     cal:250,p:25,c:0, f:16,icon:'🐟'},
  {id:'f8',name:'אבוקדו חצי',     cal:120,p:1, c:6, f:11,icon:'🥑'},
  {id:'f9',name:'בטטה 150g',      cal:129,p:3, c:30,f:0, icon:'🍠'},
  {id:'f10',name:'קוטג׳ 200g',    cal:142,p:16,c:6, f:6, icon:'🧀'},
];

const EX_INITIAL=[
  {id:1,name:'סקוואט עם מוט', sets:4,reps:'10',rest:90,icon:'🏋️‍♀️',done:false},
  {id:2,name:'היפ תראסט',     sets:4,reps:'12',rest:60,icon:'🍑',   done:false},
  {id:3,name:'דדליפט רומני',  sets:3,reps:'10',rest:90,icon:'💪',   done:false},
  {id:4,name:'לאנג׳ הליכה',   sets:3,reps:'12',rest:60,icon:'🚶‍♀️',done:false},
  {id:5,name:'קפיצות קופסה',  sets:3,reps:'15',rest:45,icon:'📦',   done:false},
];

const EX_LIB=[
  {id:'e1',name:'פלאנק',           sets:3,reps:'45 שנ׳',rest:30,icon:'🧘‍♀️'},
  {id:'e2',name:'כפיפות בטן',      sets:3,reps:'20',    rest:30,icon:'💪'},
  {id:'e3',name:'שכיבות שמיכה',    sets:4,reps:'12',    rest:60,icon:'🤸‍♀️'},
  {id:'e4',name:'מתח',             sets:3,reps:'8',     rest:90,icon:'🏋️'},
  {id:'e5',name:'חתירה עם משקולת', sets:4,reps:'12',    rest:60,icon:'🚣'},
  {id:'e6',name:'כפות רגליים',     sets:4,reps:'20',    rest:30,icon:'🦵'},
];

const MSGS_INIT=[
  {id:1,from:'coach',text:'היי, איך ההרגשה אחרי האימון? 💚',time:'אתמול 20:14'},
  {id:2,from:'coach',text:'זכרי לשתות הרבה מים היום 💧',time:'היום 09:02'},
  {id:3,from:'coach',text:'סיכום שבועי: 6/7 ימי רישום, 3 אימונים. מעולה!',time:'היום 12:30'},
];

const AI_SYS=`אתה עוזרת תזונה של המאמנת ספיר ברק. עני בעברית, גוף נקבה, קצר וברור.
ענה רק על שאלות תזונה — מאקרו, קלוריות, ויטמינים, תזמון ארוחות.
לשאלות רפואיות — הפני לרופא. לתרגילים — הפני למאמנת.`;

const S={
  card:{background:'white',border:`1px solid ${COLORS.border}`,borderRadius:16,padding:16},
  inp:{width:'100%',padding:'10px 12px',border:`1px solid ${COLORS.border}`,borderRadius:10,
       fontSize:13,outline:'none',fontFamily:'inherit',direction:'rtl',boxSizing:'border-box'},
  btn:{width:'100%',background:COLORS.primary,color:'white',border:'none',padding:12,
       borderRadius:12,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit'},
};

/* drag-and-drop helper */
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

/* ──────────────────────────────────────────
   MAIN APP
────────────────────────────────────────── */
export default function App(){
  const[pidx,setPidx]=useState(0);
  const p=PROFILES[pidx];
  const[tab,setTab]=useState('home');
  const[toast,setToast]=useState(null);
  const showToast=t=>{setToast(t);setTimeout(()=>setToast(null),2500);};

  const[meals,setMeals]=useState([]);
  const[water,setWater]=useState(1200);
  const[exs,setExs]=useState(EX_INITIAL);
  const[weights,setWeights]=useState([
    {id:1,date:'16.3',w:67},{id:2,date:'26.3',w:66.2},
    {id:3,date:'5.4', w:65.5},{id:4,date:'14.4',w:64.8},
  ]);
  const[unread,setUnread]=useState(3);
  const[chat,setChat]=useState(false);

  const cal=meals.reduce((s,m)=>s+(m.cal||0),0);
  const prot=meals.reduce((s,m)=>s+(m.p||0),0);
  const carb=meals.reduce((s,m)=>s+(m.c||0),0);
  const fat =meals.reduce((s,m)=>s+(m.f||0),0);
  const rem=Math.max(0,p.dailyCalorieGoal-cal);
  const calPct=Math.min(100,Math.round(cal/p.dailyCalorieGoal*100));
  const wPct=Math.min(100,Math.round(water/p.dailyWaterGoalMl*100));
  const done=exs.filter(e=>e.done).length;

  const addPlan=(key,meal)=>{
    if(meals.find(m=>m.planKey===key))return;
    setMeals(prev=>[...prev,{id:Date.now(),planKey:key,...meal,
      time:new Date().toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit'})}]);
    showToast(`✅ ${meal.name} נרשמה`);
  };
  const addCustom=meal=>{
    setMeals(prev=>[...prev,{id:Date.now(),...meal,
      time:new Date().toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit'})}]);
    showToast('✅ ארוחה נרשמה');
  };
  const removeMeal=id=>setMeals(prev=>prev.filter(m=>m.id!==id));
  const toggleEx=id=>setExs(prev=>prev.map(e=>e.id===id?{...e,done:!e.done}:e));
  const finishW=()=>{
    if(done===exs.length)showToast('🎉 אימון הושלם! סטריק +1');
    else{setExs(prev=>prev.map(e=>({...e,done:true})));showToast('🎉 מעולה!');}
  };
  const logWeight=w=>{
    const d=new Date();
    setWeights(prev=>[...prev,{id:Date.now(),date:`${d.getDate()}.${d.getMonth()+1}`,w:+w}]);
    showToast('⚖️ משקל נשמר');
  };

  const NAV=[
    {id:'home',label:'בית',icon:'🏠'},{id:'eat',label:'תזונה',icon:'🍽️'},
    {id:'workout',label:'אימון',icon:'💪'},{id:'stats',label:'סטטיסטיקות',icon:'📊'},
    {id:'settings',label:'הגדרות',icon:'⚙️'},
  ];

  return(
    <div style={{direction:'rtl',fontFamily:'system-ui,-apple-system,"Segoe UI",sans-serif',
      background:COLORS.bg,minHeight:'100vh',paddingBottom:72,maxWidth:420,margin:'0 auto',
      position:'relative',color:COLORS.text}}>

      {/* demo banner */}
      <div style={{background:COLORS.skySoft,padding:'6px 12px',fontSize:11,color:COLORS.primaryDark,textAlign:'center',borderBottom:`1px solid ${COLORS.border}`}}>
        💡 דמו —{' '}
        <button onClick={()=>setPidx(i=>(i+1)%PROFILES.length)}
          style={{background:'transparent',border:'none',color:COLORS.primaryDark,fontWeight:700,cursor:'pointer',textDecoration:'underline',fontSize:11,fontFamily:'inherit'}}>
          החלף מתאמנת
        </button>
      </div>

      {/* header */}
      <header style={{background:'white',padding:'14px 18px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:`1px solid ${COLORS.border}`,position:'sticky',top:0,zIndex:20}}>
        <div>
          <p style={{fontSize:12,color:COLORS.textMuted,margin:0}}>שלום,</p>
          <h1 style={{fontSize:18,fontWeight:700,color:COLORS.primaryDark,margin:0}}>{p.firstName} 💚</h1>
        </div>
        <button onClick={()=>{setTab('messages');setUnread(0);}}
          style={{background:COLORS.primarySoft,border:`1px solid ${COLORS.border}`,borderRadius:10,width:40,height:40,position:'relative',cursor:'pointer',fontSize:18,fontFamily:'inherit'}}>
          💬
          {unread>0&&<span style={{position:'absolute',top:-4,left:-4,background:COLORS.accentDark,color:'white',fontSize:10,fontWeight:700,borderRadius:999,width:18,height:18,display:'flex',alignItems:'center',justifyContent:'center'}}>{unread}</span>}
        </button>
      </header>

      {/* HOME */}
      {tab==='home'&&(
        <main style={{padding:14,display:'flex',flexDirection:'column',gap:14}}>
          {/* calorie ring */}
          <section style={{...S.card,display:'flex',flexDirection:'column',alignItems:'center',paddingTop:24,paddingBottom:24}}>
            <div style={{position:'relative',width:180,height:180,marginBottom:16}}>
              <svg viewBox="0 0 100 100" style={{width:'100%',height:'100%',transform:'rotate(-90deg)'}}>
                <circle cx="50" cy="50" r="44" fill="none" stroke={COLORS.primarySoft} strokeWidth="8"/>
                <circle cx="50" cy="50" r="44" fill="none" stroke={COLORS.primary} strokeWidth="8"
                  strokeDasharray={`${calPct*2.76} 276`} strokeLinecap="round"/>
              </svg>
              <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                <p style={{margin:0,fontSize:36,fontWeight:700,color:COLORS.text,lineHeight:1}}>{rem}</p>
                <p style={{margin:'4px 0 0',fontSize:12,color:COLORS.textMuted}}>קלוריות נותרו</p>
              </div>
            </div>
            <div style={{display:'flex',gap:32,textAlign:'center'}}>
              {[['יעד',p.dailyCalorieGoal,COLORS.text],['נצרך',cal,COLORS.primaryDark]].map(([l,v,c],i)=>(
                <React.Fragment key={l}>
                  {i>0&&<div style={{width:1,background:COLORS.border}}/>}
                  <div><p style={{margin:0,fontSize:20,fontWeight:700,color:c}}>{v}</p><p style={{margin:'2px 0 0',fontSize:11,color:COLORS.textMuted}}>{l}</p></div>
                </React.Fragment>
              ))}
            </div>
          </section>

          {/* macros */}
          <section style={S.card}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,textAlign:'center'}}>
              {[['חלבון',prot,p.dailyProteinGoal,'#B88968'],['פחמ׳',carb,p.dailyCarbGoal,COLORS.primaryDark],['שומן',fat,p.dailyFatGoal,COLORS.sky]].map(([l,v,g,c])=>(
                <div key={l}>
                  <p style={{margin:0,fontSize:15,fontWeight:700,color:c}}>{v}<span style={{fontSize:10,color:COLORS.textMuted}}>/{g}g</span></p>
                  <div style={{height:4,background:COLORS.primarySoft,borderRadius:99,overflow:'hidden',margin:'4px 0 2px'}}>
                    <div style={{height:'100%',width:`${Math.min(100,v/g*100)}%`,background:c}}/>
                  </div>
                  <p style={{margin:0,fontSize:10,color:COLORS.textMuted}}>{l}</p>
                </div>
              ))}
            </div>
          </section>

          {/* streak + water */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div style={{...S.card,borderColor:COLORS.peach,padding:14,display:'flex',alignItems:'center',gap:10}}>
              <div style={{background:COLORS.peachSoft,borderRadius:'50%',width:42,height:42,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>🔥</div>
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
                  <button key={ml} onClick={()=>{setWater(w=>Math.min(w+ml,5000));showToast(`💧 +${ml}`);}}
                    style={{flex:1,background:COLORS.skySoft,color:'#4A7A94',border:'none',padding:'4px 2px',borderRadius:6,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>+{ml}</button>
                ))}
              </div>
            </div>
          </div>

          {/* today's meals */}
          <section style={S.card}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <h3 style={{margin:0,fontSize:14,fontWeight:700,color:COLORS.primaryDark}}>🍽️ הרשומות של היום</h3>
              <button onClick={()=>setTab('eat')} style={{width:28,height:28,borderRadius:'50%',background:COLORS.primary,color:'white',border:'none',fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'inherit',lineHeight:1}}>+</button>
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
      )}

      {/* EAT */}
      {tab==='eat'&&<LogScreen profile={p} meals={meals} cal={cal} prot={prot} carb={carb} fat={fat} onPlan={addPlan} onCustom={addCustom} onRemove={removeMeal}/>}

      {/* WORKOUT */}
      {tab==='workout'&&<WorkoutScreen exs={exs} setExs={setExs} onToggle={toggleEx} onFinish={finishW} done={done} showToast={showToast}/>}

      {/* STATS */}
      {tab==='stats'&&<StatsScreen weights={weights} profile={p} onLog={logWeight} onDel={id=>{setWeights(w=>w.filter(x=>x.id!==id));showToast('🗑️ נמחק');}}/>}

      {/* MESSAGES */}
      {tab==='messages'&&<MessagesScreen profile={p}/>}

      {/* SETTINGS */}
      {tab==='settings'&&<SettingsScreen profile={p} showToast={showToast}/>}

      {/* toast */}
      {toast&&<div style={{position:'fixed',bottom:84,left:'50%',transform:'translateX(-50%)',background:COLORS.text,color:'white',padding:'10px 18px',borderRadius:999,fontSize:13,fontWeight:500,zIndex:60,boxShadow:'0 4px 12px rgba(0,0,0,0.2)',whiteSpace:'nowrap'}}>{toast}</div>}

      {/* AI chat FAB */}
      {!chat&&tab==='home'&&<button onClick={()=>setChat(true)} style={{position:'fixed',bottom:84,left:16,width:52,height:52,borderRadius:'50%',background:COLORS.primary,color:'white',border:'none',fontSize:22,cursor:'pointer',boxShadow:'0 4px 14px rgba(123,184,146,0.5)',zIndex:30,fontFamily:'inherit'}}>🤖</button>}
      {chat&&<AIChat profile={p} onClose={()=>setChat(false)}/>}

      {/* bottom nav */}
      <nav style={{position:'fixed',bottom:0,left:0,right:0,maxWidth:420,margin:'0 auto',background:'white',borderTop:`1px solid ${COLORS.border}`,display:'flex',justifyContent:'space-around',padding:'6px 0 10px',zIndex:25}}>
        {NAV.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{background:'transparent',border:'none',cursor:'pointer',fontFamily:'inherit',padding:6,display:'flex',flexDirection:'column',alignItems:'center',gap:2,minWidth:48}}>
            <span style={{fontSize:20,filter:tab===t.id?'none':'grayscale(0.4) opacity(0.55)'}}>{t.icon}</span>
            <span style={{fontSize:9,color:tab===t.id?COLORS.primaryDark:COLORS.textMuted,fontWeight:tab===t.id?700:500}}>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

/* ──────────────────── LOG SCREEN ──────────────────── */
function LogScreen({profile,meals,cal,prot,carb,fat,onPlan,onCustom,onRemove}){
  const[mode,setMode]=useState('plan');
  const[basket,setBasket]=useState([]);
  const bRefs=useRef([]);
  const dnd=useDnd(basket,setBasket);

  const addToBasket=food=>{
    if(basket.find(f=>f.id===food.id))return;
    setBasket(p=>[...p,food]);
  };
  const confirmBasket=()=>{
    if(!basket.length)return;
    const tot=basket.reduce((s,f)=>({cal:s.cal+f.cal,p:s.p+f.p,c:s.c+f.c,f:s.f+f.f}),{cal:0,p:0,c:0,f:0});
    onCustom({name:basket.map(f=>f.name).join(' + '),...tot});
    setBasket([]);
  };

  return(
    <main style={{padding:14,display:'flex',flexDirection:'column',gap:12}}>
      <h2 style={{margin:0,fontSize:18,fontWeight:700,color:COLORS.primaryDark}}>🥗 יומן תזונה</h2>

      {/* summary */}
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

      {/* mode tabs */}
      <div style={{display:'flex',gap:4,background:'white',border:`1px solid ${COLORS.border}`,borderRadius:10,padding:4}}>
        {[['plan','📋 תפריט'],['drag','👆 גרירה'],['custom','✏️ ידני']].map(([id,lbl])=>(
          <button key={id} onClick={()=>setMode(id)} style={{flex:1,background:mode===id?COLORS.primary:'transparent',color:mode===id?'white':COLORS.text,border:'none',borderRadius:8,padding:'8px 4px',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>{lbl}</button>
        ))}
      </div>

      {/* plan */}
      {mode==='plan'&&(
        <section style={S.card}>
          <p style={{fontSize:12,color:COLORS.textMuted,margin:'0 0 12px'}}>ספיר בנתה לך תפריט. לחצי לסמן.</p>
          {Object.entries(PLAN).map(([key,meal])=>{
            const logged=meals.find(m=>m.planKey===key);
            return(
              <div key={key} style={{border:`1px solid ${logged?COLORS.mint:COLORS.border}`,background:logged?COLORS.mintSoft:'white',borderRadius:12,padding:12,marginBottom:8}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                  <div>
                    <p style={{margin:0,fontSize:14,fontWeight:700}}>{meal.name}</p>
                    <p style={{margin:'2px 0 0',fontSize:11,color:COLORS.textMuted}}>{meal.cal} קק״ל · {meal.p}g חלבון</p>
                  </div>
                  {logged
                    ?<span style={{background:COLORS.mint,color:'white',fontSize:11,fontWeight:700,padding:'4px 10px',borderRadius:999}}>✓ אכלתי</span>
                    :<button onClick={()=>onPlan(key,meal)} style={{background:COLORS.primary,color:'white',border:'none',padding:'6px 14px',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>סמני</button>
                  }
                </div>
                <ul style={{margin:0,paddingRight:16,fontSize:11,color:COLORS.textMuted}}>
                  {meal.items.map((it,i)=><li key={i}>{it}</li>)}
                </ul>
              </div>
            );
          })}
        </section>
      )}

      {/* drag */}
      {mode==='drag'&&(
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <p style={{margin:0,fontSize:12,color:COLORS.textMuted}}>גרורי פריטים לתוך הארוחה (בנייד — לחצי):</p>

          <section style={S.card}>
            <h4 style={{margin:'0 0 10px',fontSize:13,fontWeight:700,color:COLORS.primaryDark}}>📚 ספריית מזון</h4>
            {FOOD_LIB.map(food=>(
              <div key={food.id} draggable
                onDragStart={e=>e.dataTransfer.setData('fid',food.id)}
                onTouchStart={()=>addToBasket(food)}
                style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',background:basket.find(f=>f.id===food.id)?COLORS.mintSoft:COLORS.bg,border:`1px solid ${COLORS.border}`,borderRadius:10,cursor:'grab',marginBottom:6,opacity:basket.find(f=>f.id===food.id)?0.5:1}}>
                <span style={{fontSize:20}}>{food.icon}</span>
                <div style={{flex:1}}>
                  <p style={{margin:0,fontSize:13,fontWeight:600}}>{food.name}</p>
                  <p style={{margin:0,fontSize:10,color:COLORS.textMuted}}>{food.cal} קק״ל · {food.p}g P · {food.c}g C · {food.f}g F</p>
                </div>
                <span style={{fontSize:14,color:COLORS.textMuted}}>⠿</span>
              </div>
            ))}
          </section>

          <section onDragOver={e=>e.preventDefault()} onDrop={e=>{const food=FOOD_LIB.find(f=>f.id===e.dataTransfer.getData('fid'));if(food)addToBasket(food);}}
            style={{...S.card,minHeight:110,borderStyle:'dashed',borderColor:COLORS.primary,background:COLORS.primarySoft}}>
            <h4 style={{margin:'0 0 8px',fontSize:13,fontWeight:700,color:COLORS.primaryDark}}>🍽️ הארוחה שלי</h4>
            {basket.length===0
              ?<p style={{textAlign:'center',color:COLORS.textMuted,fontSize:12,padding:'16px 0'}}>גרורי פריטים לכאן<br/><span style={{fontSize:10}}>(בנייד — לחצי על פריט)</span></p>
              :(
                <>
                  {basket.map((food,i)=>(
                    <div key={food.id} ref={el=>bRefs.current[i]=el} draggable
                      onDragStart={()=>dnd.onDragStart(i)}
                      onDragOver={e=>dnd.onDragOver(e,i)}
                      onDrop={dnd.onDrop}
                      onTouchStart={e=>dnd.onTouchStart(e,i)}
                      onTouchMove={e=>dnd.onTouchMove(e,bRefs)}
                      onTouchEnd={dnd.onTouchEnd}
                      style={{display:'flex',alignItems:'center',gap:8,padding:'6px 8px',background:'white',borderRadius:8,marginBottom:6,cursor:'grab'}}>
                      <span style={{fontSize:14,color:COLORS.textMuted}}>⠿</span>
                      <span>{food.icon}</span>
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

      {/* custom */}
      {mode==='custom'&&<CustomMealForm onLog={onCustom}/>}

      {/* logged */}
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

/* ──────────────────── WORKOUT SCREEN ──────────────────── */
function WorkoutScreen({exs,setExs,onToggle,onFinish,done,showToast}){
  const[timer,setTimer]=useState(0);
  const[timerOn,setTimerOn]=useState(false);
  const[activeEx,setActiveEx]=useState(null);
  const[showLib,setShowLib]=useState(false);
  const iRef=useRef(null);
  const eRefs=useRef([]);
  const dnd=useDnd(exs,setExs);
  const total=exs.length;
  const pct=total?Math.round(done/total*100):0;

  useEffect(()=>{
    if(timerOn&&timer>0)iRef.current=setInterval(()=>setTimer(t=>t-1),1000);
    else if(timer===0&&timerOn)setTimerOn(false);
    return()=>clearInterval(iRef.current);
  },[timerOn,timer]);

  const startTimer=s=>{setTimer(s);setTimerOn(true);};
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

      {/* progress */}
      <section style={S.card}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
          <span style={{fontSize:13,fontWeight:600}}>התקדמות</span>
          <span style={{fontSize:13,fontWeight:700,color:COLORS.primaryDark}}>{done}/{total}</span>
        </div>
        <div style={{height:10,background:COLORS.primarySoft,borderRadius:99,overflow:'hidden'}}>
          <div style={{height:'100%',width:`${pct}%`,background:done===total?COLORS.mint:COLORS.primary,transition:'width 0.3s'}}/>
        </div>
      </section>

      {/* timer */}
      {timerOn&&(
        <section style={{...S.card,background:COLORS.amberSoft,borderColor:COLORS.amber,textAlign:'center'}}>
          <p style={{margin:'0 0 4px',fontSize:11,color:'#8B6914',fontWeight:600}}>⏱️ מנוחה</p>
          <p style={{margin:0,fontSize:36,fontWeight:700,color:'#8B6914',fontFamily:'monospace'}}>
            {String(Math.floor(timer/60)).padStart(2,'0')}:{String(timer%60).padStart(2,'0')}
          </p>
          <button onClick={()=>{setTimerOn(false);setTimer(0);}} style={{marginTop:6,background:'transparent',border:'1px solid #8B6914',color:'#8B6914',padding:'4px 14px',borderRadius:8,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>דלגי</button>
        </section>
      )}

      {/* library */}
      {showLib&&(
        <section style={S.card}>
          <h4 style={{margin:'0 0 10px',fontSize:13,fontWeight:700,color:COLORS.primaryDark}}>📚 הוסיפי תרגיל</h4>
          {EX_LIB.map(ex=>(
            <div key={ex.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:`1px solid ${COLORS.border}`}}>
              <span style={{fontSize:20}}>{ex.icon}</span>
              <div style={{flex:1}}>
                <p style={{margin:0,fontSize:13,fontWeight:600}}>{ex.name}</p>
                <p style={{margin:0,fontSize:11,color:COLORS.textMuted}}>{ex.sets}×{ex.reps}</p>
              </div>
              <button onClick={()=>addEx(ex)} style={{background:COLORS.primary,color:'white',border:'none',padding:'5px 12px',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>+ הוסף</button>
            </div>
          ))}
        </section>
      )}

      {/* exercise list */}
      {exs.map((ex,i)=>(
        <section key={ex.id} ref={el=>eRefs.current[i]=el} draggable
          onDragStart={()=>dnd.onDragStart(i)}
          onDragOver={e=>dnd.onDragOver(e,i)}
          onDrop={dnd.onDrop}
          onTouchStart={e=>dnd.onTouchStart(e,i)}
          onTouchMove={e=>dnd.onTouchMove(e,eRefs)}
          onTouchEnd={dnd.onTouchEnd}
          style={{...S.card,borderColor:ex.done?COLORS.mint:COLORS.border,background:ex.done?COLORS.mintSoft:'white',cursor:'grab'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:16,color:COLORS.textMuted,cursor:'grab'}}>⠿</span>
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
            <button onClick={()=>setActiveEx(activeEx===ex.id?null:ex.id)} style={{flex:1,background:COLORS.primarySoft,color:COLORS.primaryDark,border:`1px solid ${COLORS.border}`,padding:8,borderRadius:8,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>📺 סרטון</button>
            <button onClick={()=>startTimer(ex.rest)} style={{flex:1,background:COLORS.amberSoft,color:'#8B6914',border:`1px solid ${COLORS.amber}`,padding:8,borderRadius:8,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>⏱️ טיימר</button>
          </div>
          {activeEx===ex.id&&(
            <div style={{marginTop:10,background:COLORS.text,borderRadius:10,height:120,display:'flex',alignItems:'center',justifyContent:'center',color:'white',flexDirection:'column',gap:4}}>
              <span style={{fontSize:32}}>▶️</span>
              <span style={{fontSize:11,opacity:0.7}}>סרטון הדגמה — {ex.name}</span>
            </div>
          )}
        </section>
      ))}

      <button onClick={onFinish} style={{...S.btn,background:done===total?COLORS.mint:COLORS.primary}}>
        {done===total?'🎉 סיימתי אימון!':`סיימתי (${done}/${total})`}
      </button>
    </main>
  );
}

/* ──────────────────── STATS SCREEN ──────────────────── */
function StatsScreen({weights,profile,onLog,onDel}){
  const[nw,setNw]=useState('');
  const sorted=[...weights].sort((a,b)=>a.id-b.id);
  const minW=Math.min(...sorted.map(w=>w.w),profile.target)-1;
  const maxW=Math.max(...sorted.map(w=>w.w))+1;
  const range=maxW-minW;
  const W=310,H=120,pad={t:14,r:8,b:20,l:24};
  const pW=W-pad.l-pad.r,pH=H-pad.t-pad.b;
  const xS=sorted.length>1?pW/(sorted.length-1):pW;
  const yF=w=>pad.t+pH-((w-minW)/range)*pH;
  const pathD=sorted.map((p,i)=>`${i===0?'M':'L'} ${pad.l+i*xS} ${yF(p.w)}`).join(' ');

  return(
    <main style={{padding:14,display:'flex',flexDirection:'column',gap:12}}>
      <h2 style={{margin:0,fontSize:18,fontWeight:700,color:COLORS.primaryDark}}>📊 התקדמות</h2>

      <section style={S.card}>
        <h4 style={{margin:'0 0 10px',fontSize:14,fontWeight:700}}>⚖️ עדכן משקל</h4>
        <div style={{display:'flex',gap:10}}>
          <input type="number" value={nw} onChange={e=>setNw(e.target.value)} placeholder={`${profile.weight}`}
            style={{...S.inp,flex:1,direction:'ltr',textAlign:'right'}}/>
          <button onClick={()=>{if(nw){onLog(nw);setNw('');}}} style={{background:COLORS.primary,color:'white',border:'none',padding:'10px 20px',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>שמור</button>
        </div>
        <p style={{margin:'6px 0 0',fontSize:11,color:COLORS.textMuted}}>נוכחי: {profile.weight} ק״ג · יעד: {profile.target} ק״ג</p>
      </section>

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
            <text x={pad.l-2} y={yF(profile.target)} fontSize="8" fill={COLORS.primary} textAnchor="end">{profile.target}</text>
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
    </main>
  );
}

/* ──────────────────── MESSAGES ──────────────────── */
function MessagesScreen({profile}){
  const[msgs,setMsgs]=useState(MSGS_INIT);
  const[txt,setTxt]=useState('');
  const ref=useRef(null);
  useEffect(()=>{ref.current?.scrollTo(0,ref.current.scrollHeight);},[msgs]);
  const send=()=>{
    if(!txt.trim())return;
    setMsgs(m=>[...m,{id:Date.now(),from:'client',text:txt.trim(),time:'עכשיו'}]);
    setTxt('');
    setTimeout(()=>setMsgs(m=>[...m,{id:Date.now()+1,from:'coach',text:'קיבלתי 💚',time:'עכשיו'}]),900);
  };
  return(
    <main style={{padding:14,display:'flex',flexDirection:'column',height:'calc(100vh - 160px)',gap:12}}>
      <h2 style={{margin:0,fontSize:18,fontWeight:700,color:COLORS.primaryDark}}>💬 שיחה עם ספיר</h2>
      <section ref={ref} style={{...S.card,flex:1,overflowY:'auto',padding:12,display:'flex',flexDirection:'column',gap:8}}>
        {msgs.map(m=>(
          <div key={m.id} style={{maxWidth:'82%',padding:'9px 12px',borderRadius:14,fontSize:13,lineHeight:1.5,alignSelf:m.from==='client'?'flex-end':'flex-start',background:m.from==='client'?COLORS.primary:COLORS.primarySoft,color:m.from==='client'?'white':COLORS.text}}>
            <p style={{margin:0}}>{m.text}</p>
            <p style={{margin:'3px 0 0',fontSize:10,opacity:0.7}}>{m.time}</p>
          </div>
        ))}
      </section>
      <div style={{display:'flex',gap:8}}>
        <input value={txt} onChange={e=>setTxt(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="כתבי הודעה..." style={S.inp}/>
        <button onClick={send} disabled={!txt.trim()} style={{background:COLORS.primary,color:'white',border:'none',padding:'10px 18px',borderRadius:10,fontSize:13,fontWeight:600,cursor:txt.trim()?'pointer':'default',opacity:txt.trim()?1:0.4,fontFamily:'inherit'}}>שלחי</button>
      </div>
    </main>
  );
}

/* ──────────────────── SETTINGS ──────────────────── */
function SettingsScreen({profile,showToast}){
  const[age,setAge]=useState(profile.age);
  const[height,setHeight]=useState(profile.height);
  const[weight,setWeight]=useState(profile.weight);
  const[activity,setActivity]=useState(3);
  const[goal,setGoal]=useState(profile.goal);
  const[notifs,setNotifs]=useState(true);
  const[kosher,setKosher]=useState(false);
  return(
    <main style={{padding:14,display:'flex',flexDirection:'column',gap:12}}>
      <h2 style={{margin:0,fontSize:18,fontWeight:700,color:COLORS.primaryDark}}>⚙️ הגדרות</h2>
      <section style={S.card}>
        <h4 style={{margin:'0 0 14px',fontSize:14,fontWeight:700}}>פרטים אישיים</h4>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
          {[['גיל',age,setAge],['גובה (ס״מ)',height,setHeight],['משקל (ק״ג)',weight,setWeight]].map(([l,v,s])=>(
            <div key={l}>
              <p style={{margin:'0 0 4px',fontSize:12,fontWeight:600}}>{l}</p>
              <input type="number" value={v} onChange={e=>s(e.target.value)} style={{...S.inp,direction:'ltr',textAlign:'right'}}/>
            </div>
          ))}
          <div>
            <p style={{margin:'0 0 4px',fontSize:12,fontWeight:600}}>מין</p>
            <div style={{display:'flex',gap:4}}>
              {[['female','נקבה'],['male','זכר']].map(([v,l])=>(
                <button key={v} style={{flex:1,background:profile.sex===v?COLORS.text:'white',color:profile.sex===v?'white':COLORS.text,border:`1px solid ${COLORS.border}`,borderRadius:8,padding:'8px 4px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>{l}</button>
              ))}
            </div>
          </div>
        </div>
        <p style={{margin:'0 0 6px',fontSize:12,fontWeight:600}}>רמת פעילות</p>
        <input type="range" min="1" max="5" value={activity} onChange={e=>setActivity(+e.target.value)} style={{width:'100%',accentColor:COLORS.primary,marginBottom:4}}/>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:COLORS.textMuted,marginBottom:14}}>
          {['ללא','קלה','בינונית','גבוהה','קיצונית'].map(l=><span key={l}>{l}</span>)}
        </div>
        <p style={{margin:'0 0 6px',fontSize:12,fontWeight:600}}>מטרה</p>
        <div style={{display:'flex',gap:6,marginBottom:14}}>
          {[['lose','ירידה'],['maintain','שמירה'],['gain','עלייה']].map(([v,l])=>(
            <button key={v} onClick={()=>setGoal(v)} style={{flex:1,background:goal===v?COLORS.text:'white',color:goal===v?'white':COLORS.text,border:`1px solid ${COLORS.border}`,borderRadius:8,padding:'8px 4px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>{l}</button>
          ))}
        </div>
        {[['התראות',notifs,setNotifs,'תזכורות יומיות'],['כשר',kosher,setKosher,'מתכונים כשרים בלבד']].map(([l,v,s,d])=>(
          <div key={l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:`1px solid ${COLORS.border}`}}>
            <div>
              <p style={{margin:0,fontSize:14,fontWeight:700}}>{l}</p>
              <p style={{margin:'2px 0 0',fontSize:11,color:COLORS.textMuted}}>{d}</p>
            </div>
            <button onClick={()=>s(x=>!x)} style={{width:48,height:28,borderRadius:14,border:'none',cursor:'pointer',background:v?COLORS.primary:COLORS.border,position:'relative',transition:'background 0.2s'}}>
              <div style={{width:22,height:22,borderRadius:'50%',background:'white',position:'absolute',top:3,transition:'all 0.2s',...(v?{left:3,right:'auto'}:{right:3,left:'auto'})}}/>
            </button>
          </div>
        ))}
        <button onClick={()=>showToast('💾 שינויים נשמרו')} style={{...S.btn,marginTop:14}}>שמור שינויים</button>
      </section>
      <p style={{fontSize:10,color:COLORS.textMuted,textAlign:'center',lineHeight:1.5,padding:'0 10px'}}>אפליקציה זו אינה תחליף לייעוץ תזונאי מקצועי.</p>
    </main>
  );
}

/* ──────────────────── CUSTOM MEAL FORM ──────────────────── */
function CustomMealForm({onLog}){
  const[name,setName]=useState('');
  const[cal,setCal]=useState('');
  const[p,setP]=useState('');
  const[c,setC]=useState('');
  const[f,setF]=useState('');
  const[type,setType]=useState('snack');
  const ok=name.trim()&&cal;
  const submit=()=>{
    onLog({type,name:name.trim(),cal:+cal,p:+p||0,c:+c||0,f:+f||0});
    setName('');setCal('');setP('');setC('');setF('');
  };
  return(
    <section style={S.card}>
      <p style={{fontSize:12,color:COLORS.textMuted,margin:'0 0 12px'}}>רשמי ארוחה שאינה בתפריט:</p>
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
    </section>
  );
}

/* ──────────────────── AI CHAT ──────────────────── */
function AIChat({profile,onClose}){
  const[msgs,setMsgs]=useState([{role:'bot',text:`היי ${profile.firstName}! 🥗 אני כאן לשאלות תזונה.`}]);
  const[input,setInput]=useState('');
  const[loading,setLoading]=useState(false);
  const ref=useRef(null);
  useEffect(()=>{ref.current?.scrollTo(0,ref.current.scrollHeight);},[msgs,loading]);

  const SUGG=['כמה חלבון לאחר אימון?','מה לאכול לפני אימון?','מזונות עשירים באומגה 3'];

  const send=async text=>{
    const t=(text||input).trim();
    if(!t||loading)return;
    setInput('');
    const next=[...msgs,{role:'user',text:t}];
    setMsgs(next);
    setLoading(true);
    try{
      const res=await fetch('/api/ai',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,system:AI_SYS,
          messages:next.filter(m=>m.role!=='error').map(m=>({role:m.role==='user'?'user':'assistant',content:m.text}))}),
      });
      if(!res.ok)throw new Error();
      const data=await res.json();
      setMsgs([...next,{role:'bot',text:data.content?.[0]?.text||'מצטערת, שגיאה.'}]);
    }catch{
      setMsgs([...next,{role:'error',text:'⚠️ שגיאה. נסי שוב.'}]);
    }finally{setLoading(false);}
  };

  return(
    <div style={{position:'fixed',bottom:84,left:16,right:16,maxWidth:380,margin:'0 auto',height:460,background:'white',borderRadius:18,display:'flex',flexDirection:'column',zIndex:50,boxShadow:'0 10px 30px rgba(0,0,0,0.2)',border:`1px solid ${COLORS.border}`,direction:'rtl'}}>
      <header style={{background:COLORS.primary,color:'white',padding:'12px 14px',borderRadius:'18px 18px 0 0',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <p style={{fontSize:14,fontWeight:600,margin:0}}>🥗 עוזרת תזונה AI</p>
          <p style={{fontSize:11,opacity:0.85,margin:'2px 0 0'}}>מחוברת · זמינה 24/7</p>
        </div>
        <button onClick={onClose} style={{background:'rgba(255,255,255,0.25)',border:'none',color:'white',width:26,height:26,borderRadius:6,cursor:'pointer',fontSize:13,fontFamily:'inherit'}}>✕</button>
      </header>
      <div ref={ref} style={{flex:1,overflowY:'auto',padding:12,display:'flex',flexDirection:'column',gap:8}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{maxWidth:'85%',padding:'9px 12px',borderRadius:12,fontSize:13,lineHeight:1.6,alignSelf:m.role==='user'?'flex-end':'flex-start',background:m.role==='user'?COLORS.primary:m.role==='error'?'#FFF0F0':'#EFF5F1',color:m.role==='user'?'white':COLORS.text}}>{m.text}</div>
        ))}
        {loading&&(
          <div style={{display:'flex',gap:4,padding:'10px 12px',background:'#EFF5F1',borderRadius:12,alignSelf:'flex-start'}}>
            {[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:'50%',background:COLORS.primary,animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}
          </div>
        )}
        {msgs.length===1&&!loading&&(
          <div style={{display:'flex',flexDirection:'column',gap:6,marginTop:4}}>
            {SUGG.map((s,i)=>(
              <button key={i} onClick={()=>send(s)} style={{background:COLORS.primarySoft,border:`1px solid ${COLORS.border}`,borderRadius:20,padding:'7px 12px',fontSize:12,color:COLORS.primaryDark,cursor:'pointer',fontFamily:'inherit',textAlign:'right'}}>{s}</button>
            ))}
          </div>
        )}
      </div>
      <div style={{padding:10,borderTop:`1px solid ${COLORS.border}`,display:'flex',gap:8}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="שאלי על תזונה..." disabled={loading} style={S.inp}/>
        <button onClick={()=>send()} disabled={!input.trim()||loading} style={{background:COLORS.primary,color:'white',border:'none',padding:'8px 14px',borderRadius:10,fontSize:13,fontWeight:600,cursor:(!input.trim()||loading)?'default':'pointer',opacity:(!input.trim()||loading)?0.4:1,fontFamily:'inherit'}}>שלחי</button>
      </div>
      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`}</style>
    </div>
  );
}
