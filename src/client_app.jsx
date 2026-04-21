import React, { useState, useRef, useEffect } from 'react';
import { supabase } from './supabase';

const COLORS = {
  bg:'#F5F2FA',primary:'#B19CD9',primaryDark:'#8B72B5',primarySoft:'#E8DFF5',
  accent:'#F4C2C2',accentDark:'#C88A8A',mint:'#C5B3E0',mintSoft:'#EDE3F5',
  peach:'#F5D0B5',peachSoft:'#FBE8D7',sky:'#A495C5',skySoft:'#E0D4EB',
  amber:'#E8C96A',amberSoft:'#F5EECD',text:'#2E2A3D',textMuted:'#756B85',border:'#DDD0EB',
};

const FOOD_LIB=[
  {id:'f1',name:'חזה עוף 100g',   cal:165,p:31,c:0, f:3, icon:'🍗',cat:'חלבון'},
  {id:'f2',name:'חזה הודו 100g',  cal:135,p:30,c:0, f:1, icon:'🦃',cat:'חלבון'},
  {id:'f3',name:'בשר בקר רזה 100g',cal:200,p:26,c:0, f:10,icon:'🥩',cat:'חלבון'},
  {id:'f4',name:'סלמון 120g',     cal:250,p:25,c:0, f:15,icon:'🐟',cat:'חלבון'},
  {id:'f5',name:'טונה במים 100g', cal:110,p:25,c:0, f:1, icon:'🥫',cat:'חלבון'},
  {id:'f6',name:'ביצה גדולה',     cal:70, p:6, c:0, f:5, icon:'🥚',cat:'חלבון'},
  {id:'f7',name:'קוטג 1% 100g',   cal:70, p:11,c:2, f:1, icon:'🥛',cat:'חלבון'},
  {id:'f8',name:'יוגורט חלבון',    cal:120,p:20,c:6, f:0, icon:'🍦',cat:'חלבון'},
  {id:'f9',name:'אורז מבושל 100g', cal:130,p:2, c:28,f:0, icon:'🍚',cat:'פחמימה'},
  {id:'f10',name:'בטטה בתנור 100g',cal:90, p:2, c:20,f:0, icon:'🍠',cat:'פחמימה'},
];

const Icon = ({ name, size = 20, color = 'currentColor' }) => {
  const icons = {
    send: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>,
    menu: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>,
    user: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
    chat: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>,
    stats: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>,
    settings: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
    x: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
  };
  return icons[name] || null;
};

const ClientApp = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'היי ספיר! אני כאן לעזור לך לעקוב אחרי התזונה. מה אכלת היום?' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    const userMessage = userInput.trim();
    setUserInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // התיקון שמונע את קריסת ה-Build:
      const cleanQuery = userMessage.replace(/כמה|קלוריות|יש|ב|של|חלבון|פחמימות|שומן|מה|ה|\?|\?|,|\./g, '').trim();
      
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, cleanQuery }),
      });

      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'הנתונים נרשמו.' }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'שגיאה בחיבור.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen text-right" dir="rtl" style={{backgroundColor: COLORS.bg, fontFamily: 'sans-serif'}}>
      <header className="bg-white border-b px-4 py-3 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <button onClick={() => setIsMenuOpen(true)} className="p-1"><Icon name="menu" color="#4B5563" /></button>
        <span className="font-bold text-xl" style={{color: '#DB2777'}}>SappirBarak</span>
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{backgroundColor: '#FCE7F3'}}><Icon name="user" color="#DB2777" size={18} /></div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-24">
        {activeTab === 'chat' ? (
          <div className="max-w-md mx-auto flex flex-col gap-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl ${msg.role === 'user' ? 'text-white rounded-tr-none' : 'bg-white border text-gray-800 rounded-tl-none shadow-sm'}`} 
                     style={msg.role === 'user' ? {backgroundColor: '#DB2777'} : {}}>
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="max-w-md mx-auto space-y-6 text-center pt-10">
             <Icon name="stats" color="#DB2777" size={48} />
             <h2 className="text-xl font-bold">המדדים שלך</h2>
             <p className="text-gray-500">יופיעו כאן בקרוב...</p>
          </div>
        )}
      </main>

      {activeTab === 'chat' && (
        <div className="fixed bottom-16 left-0 right-0 p-4 bg-white border-t">
          <form onSubmit={handleSubmit} className="max-w-md mx-auto flex gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="מה אכלת היום?"
              className="flex-1 bg-gray-100 border-none rounded-full px-4 py-3 text-sm outline-none"
            />
            <button type="submit" disabled={isLoading} className="text-white p-3 rounded-full shadow-md" style={{backgroundColor: '#DB2777'}}>
              <Icon name="send" color="white" />
            </button>
          </form>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-3 z-20">
        <button onClick={() => setActiveTab('chat')} className="flex flex-col items-center gap-1" style={{color: activeTab === 'chat' ? '#DB2777' : '#9CA3AF'}}>
          <Icon name="chat" /><span className="text-[10px]">צ'אט</span>
        </button>
        <button onClick={() => setActiveTab('stats')} className="flex flex-col items-center gap-1" style={{color: activeTab === 'stats' ? '#DB2777' : '#9CA3AF'}}>
          <Icon name="stats" /><span className="text-[10px]">מדדים</span>
        </button>
      </nav>

      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-end" onClick={() => setIsMenuOpen(false)}>
          <div className="bg-white w-64 h-full p-6" onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsMenuOpen(false)} className="mb-8"><Icon name="x" color="#4B5563" /></button>
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-gray-700 font-medium"><Icon name="settings" /> הגדרות</div>
              <div className="pt-6 border-t text-red-500 font-medium">התנתקות</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientApp;
