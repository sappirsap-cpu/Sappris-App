import React, { useState, useRef, useEffect } from 'react';
import { supabase } from './supabase';
import { 
  Plus, Send, History, User, Settings, Info, 
  ChevronRight, Apple, Activity, Target, Flame, 
  Menu, X, MessageSquare, LogOut, Search, Clock
} from 'lucide-react';

const COLORS = {
  bg:'#F5F2FA',primary:'#B19CD9',primaryDark:'#8B72B5',primarySoft:'#E8DFF5',
  accent:'#F4C2C2',accentDark:'#C88A8A',mint:'#C5B3E0',mintSoft:'#EDE3F5',
  peach:'#F5D0B5',peachSoft:'#FBE8D7',sky:'#A495C5',skySoft:'#E0D4EB',
  amber:'#E8C96A',amberSoft:'#F5EECD',text:'#2E2A3D',textMuted:'#756B85',border:'#DDD0EB',
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
      // התיקון כאן: הוספת \ לפני סימני השאלה
      const cleanQuery = userMessage.replace(/כמה|קלוריות|יש|ב|של|חלבון|פחמימות|שומן|מה|ה|\?|\?|,|\./g, '').trim();
      
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, cleanQuery }),
      });

      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'ניתוח הנתונים הושלם.' }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'מצטער, חלה שגיאה בחיבור.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans text-right" dir="rtl" style={{backgroundColor: COLORS.bg}}>
      <header className="bg-white border-b px-4 py-3 flex justify-between items-center sticky top-0 z-10">
        <button onClick={() => setIsMenuOpen(true)} className="p-1"><Menu className="w-6 h-6" /></button>
        <span className="font-bold text-xl text-pink-600">SappirBarak</span>
        <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center"><User className="w-5 h-5" /></div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-20">
        {activeTab === 'chat' ? (
          <div className="max-w-md mx-auto flex flex-col gap-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-pink-600 text-white' : 'bg-white border'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="max-w-md mx-auto text-center">
            <h2 className="text-xl font-bold">המדדים שלי</h2>
            <p className="text-gray-500">בקרוב...</p>
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
              placeholder="מה אכלת?"
              className="flex-1 bg-gray-100 rounded-full px-4 py-2 outline-none"
            />
            <button type="submit" className="bg-pink-600 text-white p-2 rounded-full"><Send className="w-5 h-5 rotate-180" /></button>
          </form>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-3">
        <button onClick={() => setActiveTab('chat')} className={activeTab === 'chat' ? 'text-pink-600' : 'text-gray-400'}><MessageSquare /></button>
        <button onClick={() => setActiveTab('stats')} className={activeTab === 'stats' ? 'text-pink-600' : 'text-gray-400'}><Activity /></button>
      </nav>

      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-end">
          <div className="bg-white w-64 h-full p-6">
            <button onClick={() => setIsMenuOpen(false)}><X /></button>
            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-2"><Settings size={20} /> הגדרות</div>
              <div className="flex items-center gap-2 text-red-500"><LogOut size={20} /> התנתקות</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientApp;
