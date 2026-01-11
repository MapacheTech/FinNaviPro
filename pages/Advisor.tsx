import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { getFinancialAdvice } from '../services/geminiService';
import { ChatMessage } from '../types';
import { MOCK_USER, MOCK_DEBTS } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';

export const Advisor: React.FC = () => {
  const { t, language } = useLanguage();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const initialMessage = language === 'en' 
    ? t('advisor.intro').replace('{name}', MOCK_USER.name).replace('${amount}', MOCK_USER.freeSpendingPower.toString())
    : t('advisor.intro_es').replace('{name}', MOCK_USER.name).replace('${amount}', MOCK_USER.freeSpendingPower.toString());

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Reset messages when language changes
  useEffect(() => {
    setMessages([{
        id: 'init',
        role: 'model',
        text: initialMessage,
        timestamp: new Date()
    }]);
  }, [language]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const context = `
      User Profile: ${JSON.stringify(MOCK_USER)}
      Debts: ${JSON.stringify(MOCK_DEBTS)}
      IMPORTANT: Reply in ${language === 'es' ? 'Spanish (Latin American)' : 'English'}.
    `;

    const responseText = await getFinancialAdvice(
        [...messages, userMsg].map(m => ({ role: m.role, text: m.text })), 
        context
    );

    const botMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMsg]);
    setLoading(false);
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      <div className="flex items-center gap-3 mb-4 p-2">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center shadow-neon-green">
           <Bot size={24} className="text-black" />
        </div>
        <div>
           <h1 className="text-xl font-bold text-white">{t('advisor.title')}</h1>
           <p className="text-xs text-primary">{t('advisor.subtitle')}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-2">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-white text-black rounded-tr-sm' 
                  : 'bg-surfaceHighlight text-white border border-white/5 rounded-tl-sm'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-surfaceHighlight px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1 items-center border border-white/5">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-75"></span>
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-150"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="mt-4 relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={t('advisor.placeholder')}
          className="w-full bg-surfaceHighlight border border-white/10 rounded-full py-4 pl-5 pr-14 text-sm focus:outline-none focus:border-primary transition-colors text-white placeholder-gray-500"
        />
        <button 
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="absolute right-2 top-2 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-black disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
        >
          <Send size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};