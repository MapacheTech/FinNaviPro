import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ShieldCheck, Fingerprint, Lock, ArrowRight, Wallet } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isBiometric, setIsBiometric] = useState(false);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    
    // Simulate network request
    setTimeout(() => {
      login();
      navigate('/');
    }, 1500);
  };

  const handleBiometric = () => {
      setIsBiometric(true);
      setTimeout(() => {
          handleLogin();
      }, 800);
  };

  return (
    <div className="flex flex-col h-full justify-between pt-12 pb-6">
      
      {/* Header / Logo */}
      <div className="flex flex-col items-center animate-in slide-in-from-top-10 duration-700">
        <div className="w-20 h-20 bg-gradient-to-br from-primary to-emerald-600 rounded-[2rem] flex items-center justify-center shadow-neon-green mb-6 transform rotate-3">
            <Wallet size={40} className="text-black" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">FinNavi</h1>
        <p className="text-textMuted text-sm">{t('auth.welcome')}</p>
      </div>

      {/* Login Form */}
      <div className="w-full space-y-4 px-2 animate-in slide-in-from-bottom-10 duration-700 delay-150">
          
          <div className="bg-surfaceHighlight/50 border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-sm">
             <form onSubmit={handleLogin} className="space-y-4">
                 <div className="space-y-1">
                     <label className="text-xs font-bold text-textMuted ml-1 uppercase">{t('auth.email')}</label>
                     <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="alex@example.com"
                        className="w-full bg-surface border border-white/10 rounded-xl p-4 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all placeholder-white/20"
                     />
                 </div>
                 
                 <div className="space-y-1 relative">
                     <label className="text-xs font-bold text-textMuted ml-1 uppercase">{t('auth.password')}</label>
                     <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-surface border border-white/10 rounded-xl p-4 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all placeholder-white/20"
                     />
                     <Lock size={16} className="absolute right-4 top-9 text-textMuted" />
                 </div>

                 <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-white text-black font-extrabold py-4 rounded-xl mt-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
                 >
                    {loading && !isBiometric ? (
                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                    ) : (
                        <>{t('auth.signin')} <ArrowRight size={18} strokeWidth={3} /></>
                    )}
                 </button>
             </form>

             <div className="relative my-6">
                 <div className="absolute inset-0 flex items-center">
                     <div className="w-full border-t border-white/10"></div>
                 </div>
                 <div className="relative flex justify-center text-xs uppercase">
                     <span className="bg-[#1d1d20] px-2 text-textMuted">{t('auth.or_secure')}</span>
                 </div>
             </div>

             <button 
                onClick={handleBiometric}
                className="w-full bg-surface border border-primary/30 text-primary font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/10 transition-colors"
             >
                 {isBiometric ? (
                     <div className="flex items-center gap-2 animate-pulse">
                         <ShieldCheck size={20} /> {t('auth.verifying')}
                     </div>
                 ) : (
                    <>
                        <Fingerprint size={24} /> {t('auth.faceid')}
                    </>
                 )}
             </button>
          </div>

          <div className="flex justify-center items-center gap-2 text-[10px] text-textMuted opacity-70">
              <ShieldCheck size={12} className="text-emerald-500" />
              <span>{t('auth.encryption')}</span>
          </div>

      </div>

      {/* Footer */}
      <div className="text-center pb-4">
          <p className="text-xs text-textMuted">
              {t('auth.create_account')} <span className="text-white font-bold cursor-pointer hover:underline">{t('auth.create_one')}</span>
          </p>
      </div>

    </div>
  );
};