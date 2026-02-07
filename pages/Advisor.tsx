import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Crown, Lock } from 'lucide-react';
import { n8nService } from '../services/n8nService';
import { profileService } from '../services/profileService';
import { aiUsageService } from '../services/aiUsageService';
import { ChatMessage, UserProfile } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

export const Advisor: React.FC = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth(); // Get current user for personalized queries
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [aiUsage, setAiUsage] = useState({ allowed: true, remaining: 10, used: 0, limit: 10 });
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Load profile data and AI usage
  useEffect(() => {
    const loadProfile = async () => {
      setProfileLoading(true);
      try {
        const profileData = await profileService.getProfile();
        setProfile(profileData);
        // Load AI usage status
        if (profileData) {
          const usage = await aiUsageService.canUseAI(profileData.subscriptionStatus);
          setAiUsage(usage);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };
    loadProfile();
  }, []);

  // Reset messages when language or profile changes
  useEffect(() => {
    if (!profile) return;

    const initialMessage = language === 'en'
      ? t('advisor.intro').replace('{name}', profile.name).replace('${amount}', profile.freeSpendingPower.toString())
      : t('advisor.intro_es').replace('{name}', profile.name).replace('${amount}', profile.freeSpendingPower.toString());

    setMessages([{
        id: 'init',
        role: 'model',
        text: initialMessage,
        timestamp: new Date()
    }]);
  }, [language, profile]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // Check AI usage limit
    if (!aiUsage.allowed) {
      setShowUpgrade(true);
      return;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Build conversation history for context
    const conversationHistory = [...messages, userMsg]
      .slice(-5) // Keep last 5 messages for context
      .map(m => `${m.role}: ${m.text}`)
      .join('\n');

    // Note: Don't send debts - n8n fetches real debts from Supabase using userId
    const fullPrompt = `
      User name: ${profile?.name || 'User'}
      Language: ${language === 'es' ? 'Spanish (Latin American)' : 'English'}

      User message: ${input}

      Recent conversation:
      ${conversationHistory}
    `;

    try {
      // Send user message with userId for personalized debt data
      const responseText = await n8nService.chat(fullPrompt, user?.id);

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMsg]);

      // Track usage after successful send
      await aiUsageService.incrementUsage();
      if (profile) {
        const updatedUsage = await aiUsageService.canUseAI(profile.subscriptionStatus);
        setAiUsage(updatedUsage);
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "Connection error. Please ensure n8n is running.",
        timestamp: new Date()
      }]);
    }
    setLoading(false);
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      <div className="flex items-center justify-between mb-4 p-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center shadow-neon-green">
             <Bot size={24} className="text-black" />
          </div>
          <div>
             <h1 className="text-xl font-bold text-white">{t('advisor.title')}</h1>
             <p className="text-xs text-primary">{t('advisor.subtitle')}</p>
          </div>
        </div>
        {/* Usage Counter */}
        {profile?.subscriptionStatus !== 'pro' && (
          <div className="text-right">
            <p className={`text-xs font-bold ${aiUsage.remaining <= 3 ? 'text-red-500' : 'text-textMuted'}`}>
              {aiUsage.remaining}/{aiUsage.limit}
            </p>
            <p className="text-[10px] text-textMuted">mensajes</p>
          </div>
        )}
        {profile?.subscriptionStatus === 'pro' && (
          <div className="flex items-center gap-1 bg-secondary/20 px-3 py-1 rounded-full">
            <Crown size={14} className="text-secondary" />
            <span className="text-xs font-bold text-secondary">PRO</span>
          </div>
        )}
      </div>

      {/* Upgrade Banner when limit reached */}
      {(!aiUsage.allowed || showUpgrade) && profile?.subscriptionStatus !== 'pro' && (
        <div className="bg-gradient-to-r from-secondary/20 to-purple-900/30 border border-secondary/40 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock size={16} className="text-secondary" />
            <span className="font-bold text-sm text-white">Limite de mensajes alcanzado</span>
          </div>
          <p className="text-xs text-textMuted mb-3">
            Has usado {aiUsage.used}/{aiUsage.limit} mensajes este mes. Actualiza a Pro para mensajes ilimitados.
          </p>
          <button
            onClick={() => {
              // Navigate to profile to trigger upgrade modal
              window.location.hash = '#/profile';
            }}
            className="w-full py-2.5 bg-secondary text-white rounded-xl font-bold text-sm hover:bg-secondary/90 transition-colors flex items-center justify-center gap-2"
          >
            <Crown size={16} /> Upgrade a Pro
          </button>
        </div>
      )}

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
          placeholder={!aiUsage.allowed && profile?.subscriptionStatus !== 'pro' ? 'Upgrade a Pro para seguir chateando...' : t('advisor.placeholder')}
          disabled={!aiUsage.allowed && profile?.subscriptionStatus !== 'pro'}
          className="w-full bg-surfaceHighlight border border-white/10 rounded-full py-4 pl-5 pr-14 text-sm focus:outline-none focus:border-primary transition-colors text-white placeholder-gray-500 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim() || (!aiUsage.allowed && profile?.subscriptionStatus !== 'pro')}
          className="absolute right-2 top-2 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-black disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
        >
          <Send size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};