import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Send, History, User, Settings, Info, 
  ChevronRight, Apple, Activity, Target, Flame, 
  Menu, X, MessageSquare, LogOut, Search, Clock
} from 'lucide-react';

// --- קוד ה-JSX המתוקן של האפליקציה ---

const ClientApp = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'היי ספיר! אני כאן לעזור לך לעקוב אחרי התזונה. מה אכלת היום?' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- הפונקציה שגרמה לשגיאה (מתוקנת למטה) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    const userMessage = userInput.trim();
    setUserInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // התיקון בשורה הבאה: הוספתי \ לפני סימן השאלה הראשון
      const cleanQuery = userMessage.replace(/כמה|קלוריות|יש|ב|של|חלבון|פחמימות|שומן|מה|ה|\?|\?|,|\./g, '').trim();
      
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          cleanQuery: cleanQuery
        }),
      });

      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'מצטער, חלה שגיאה בחיבור. נסי שוב מאוחר יותר.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans text-right" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex justify-between items-center sticky top-0 z-10">
        <button onClick={() => setIsMenuOpen(true)} className="p-1">
          <Menu className="w-6 h-6 text-gray-600" />
        </button>
        <div className="flex items-center gap-2">
          <span className="font-bold text-xl text-pink-600">SappirBarak</span>
        </div>
        <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-pink-600" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-20">
        {activeTab === 'chat' && (
          <div className="max-w-md mx-auto flex flex-col gap-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-pink-600 text-white rounded-tr-none' 
                    : 'bg-white border text-gray-800 rounded-tl-none'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-end">
                <div className="bg-gray-100 p-3 rounded-2xl rounded-tl-none animate-pulse text-gray-500">
                  מנתח נתונים...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="max-w-md mx-auto space-y-6">
            <h2 className="text-xl font-bold">סיכום יומי</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-2xl border flex flex-col items-center shadow-sm">
                <Flame className="w-6 h-6 text-orange-500 mb-2" />
                <span className="text-2xl font-bold">1,450</span>
                <span className="text-sm text-gray-500">קלוריות</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border flex flex-col items-center shadow-sm">
                <Target className="w-6 h-6 text-blue-500 mb-2" />
                <span className="text-2xl font-bold">110</span>
                <span className="text-sm text-gray-500">גרם חלבון</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Input Area (Visible only on Chat tab) */}
      {activeTab === 'chat' && (
        <div className="fixed bottom-16 left-0 right-0 p-4 bg-white border-t">
          <form onSubmit={handleSubmit} className="max-w-md mx-auto flex gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="מה אכלת עכשיו? (למשל: סלט חלימי)"
              className="flex-1 bg-gray-100 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-pink-500 outline-none"
            />
            <button 
              type="submit" 
              disabled={isLoading}
              className="bg-pink-600 text-white p-2 rounded-full disabled:opacity-50"
            >
              <Send className="w-5 h-5 rotate-180" />
            </button>
          </form>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-3 px-2 z-10">
        <button 
          onClick={() => setActiveTab('chat')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'chat' ? 'text-pink-600' : 'text-gray-400'}`}
        >
          <MessageSquare className="w-6 h-6" />
          <span className="text-xs">צ'אט</span>
        </button>
        <button 
          onClick={() => setActiveTab('stats')}
          className={`flex flex-col items-center gap-1 ${activeTab ===
