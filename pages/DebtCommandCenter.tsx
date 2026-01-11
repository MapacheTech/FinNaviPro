import React, { useState, useMemo } from 'react';
import { MOCK_DEBTS, MOCK_USER, AVAILABLE_BADGES } from '../constants';
import { Strategy, Debt, Badge } from '../types';
import { ArrowUpRight, Snowflake, Mountain } from 'lucide-react';
import { WhatIfSimulator } from '../components/WhatIfSimulator';
import { RewardOverlay } from '../components/RewardOverlay';
import { useLanguage } from '../contexts/LanguageContext';

const DebtCard: React.FC<{ debt: Debt; isTarget: boolean; onPay: () => void; t: (key: string) => string }> = ({ debt, isTarget, onPay, t }) => (
    <div 
        className={`relative p-6 rounded-3xl mb-4 transition-all duration-500 border overflow-hidden group ${
            isTarget 
            ? 'bg-gradient-to-br from-[#27272a] via-[#09090b] to-black border-primary shadow-[0_0_30px_rgba(19,236,19,0.15)] scale-[1.02] z-10' 
            : 'bg-surface/40 border-white/5 grayscale-[0.6] hover:grayscale-0 hover:bg-surface/60'
        }`}
    >
        {isTarget && (
             <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none mix-blend-screen"></div>
        )}

        {isTarget && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-black text-[10px] font-extrabold uppercase px-3 py-1 rounded-full shadow-lg tracking-wider z-20 flex items-center gap-1">
                 <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" />
                {t('debt.target')}
            </div>
        )}
        
        <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
                <h3 className={`font-bold text-lg ${isTarget ? 'text-white' : 'text-textMuted'}`}>{debt.name}</h3>
                <p className="text-xs text-textMuted">{debt.provider}</p>
            </div>
            <div className="text-right">
                <p className={`font-manrope font-extrabold text-2xl ${isTarget ? 'text-white' : 'text-textMuted'}`}>
                    ${debt.balance.toLocaleString()}
                </p>
                <p className="text-xs font-bold text-accent">{debt.apr}% APR</p>
            </div>
        </div>

        <div className="relative w-full">
            <div className="flex justify-between text-[10px] font-bold text-textMuted mb-1.5 uppercase tracking-wide">
                <span>{t('debt.progress')}</span>
                <span>{Math.round(100 - (debt.balance / 5000) * 100)}% {t('debt.paid')}</span>
            </div>
            <div className="w-full bg-black/60 h-4 rounded-full overflow-hidden mb-6 border border-white/10 relative z-10 shadow-inner">
                <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${
                        isTarget 
                        ? 'bg-gradient-to-r from-primaryDim via-primary to-emerald-300 shadow-[0_0_20px_rgba(19,236,19,0.4)]' 
                        : 'bg-white/10'
                    }`} 
                    style={{ width: `${Math.max(10, 100 - (debt.balance / 5000) * 100)}%` }} 
                >
                    {isTarget && (
                         <div className="absolute inset-0 w-full h-full bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[pulse_2s_linear_infinite] opacity-50" />
                    )}
                </div>
            </div>
        </div>

        <div className="flex justify-between items-center relative z-10">
            <span className="text-xs text-textMuted font-medium bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
                {t('debt.min')}: <span className="text-white font-bold">${debt.minPayment}</span>
            </span>
            {isTarget && (
                <button 
                    onClick={onPay}
                    className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-xl text-xs font-extrabold hover:bg-gray-200 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 group"
                >
                    {t('debt.pay_now')} <ArrowUpRight size={14} strokeWidth={3} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
            )}
        </div>
    </div>
);

export const DebtCommandCenter: React.FC = () => {
  const { t } = useLanguage();
  const [strategy, setStrategy] = useState<Strategy>(Strategy.SNOWBALL);
  const [rewardData, setRewardData] = useState<{ points: number, badge?: Badge } | null>(null);

  const sortedDebts = useMemo(() => {
    return [...MOCK_DEBTS].sort((a, b) => {
      if (strategy === Strategy.SNOWBALL) {
        return a.balance - b.balance; 
      } else {
        return b.apr - a.apr; 
      }
    });
  }, [strategy]);

  const handlePayment = () => {
    const pointsEarned = 25;
    MOCK_USER.points += pointsEarned;
    MOCK_USER.streakDays += 1;

    let newBadge: Badge | undefined = undefined;
    const unearnedBadges = AVAILABLE_BADGES.filter(b => !MOCK_USER.badges.find(ub => ub.id === b.id));
    
    if (unearnedBadges.length > 0 && Math.random() > 0.7) {
        newBadge = unearnedBadges[0];
        MOCK_USER.badges.push(newBadge);
    }

    setRewardData({ points: pointsEarned, badge: newBadge });
  };

  return (
    <div className="pt-2">
       {rewardData && (
           <RewardOverlay 
                pointsEarned={rewardData.points} 
                newBadge={rewardData.badge} 
                onClose={() => setRewardData(null)} 
           />
       )}

       <div className="flex justify-between items-end mb-6">
           <h1 className="text-2xl font-bold">{t('debt.title')}</h1>
           <div className="flex items-center gap-1 text-[10px] text-primary bg-primary/10 px-2 py-1 rounded-lg border border-primary/20">
               <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
               {t('debt.realtime')}
           </div>
       </div>

       <div className="bg-surfaceHighlight p-1.5 rounded-2xl flex mb-8">
           <button 
             onClick={() => setStrategy(Strategy.SNOWBALL)}
             className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${strategy === Strategy.SNOWBALL ? 'bg-secondary text-white shadow-neon-purple' : 'text-textMuted hover:text-white'}`}
           >
             <Snowflake size={16} /> {t('debt.snowball')}
           </button>
           <button 
             onClick={() => setStrategy(Strategy.AVALANCHE)}
             className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${strategy === Strategy.AVALANCHE ? 'bg-secondary text-white shadow-neon-purple' : 'text-textMuted hover:text-white'}`}
           >
             <Mountain size={16} /> {t('debt.avalanche')}
           </button>
       </div>

       <div className="space-y-2">
           {sortedDebts.map((debt, index) => (
               <DebtCard 
                    key={debt.id} 
                    debt={debt} 
                    isTarget={index === 0}
                    onPay={handlePayment} 
                    t={t}
               />
           ))}
       </div>

       {/* Pass t function or specific strings to Simulator if needed, or update Simulator to use useLanguage internally. For simplicity, we just leave it for now or wrap it. */}
       <div className="w-full mt-6 bg-surfaceHighlight/30 rounded-3xl p-5 border border-white/5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">{t('debt.simulator')}</h3>
            <span className="text-xs font-semibold text-secondary bg-secondary/10 px-2 py-1 rounded-full border border-secondary/20">
              {t('debt.try_it')}
            </span>
          </div>
          <WhatIfSimulator debts={sortedDebts} freeSpendingPower={MOCK_USER.freeSpendingPower} />
       </div>
       
       <div className="h-10"></div>
    </div>
  );
};