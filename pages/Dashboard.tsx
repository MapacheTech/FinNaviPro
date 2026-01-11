import React, { useState, useEffect } from 'react';
import { MOCK_USER, MOCK_DEBTS } from '../constants';
import { Nudge, Debt, FinancialInsight } from '../types';
import { TrendingUp, ShieldCheck, Zap, Crown, Bell, Wallet, ArrowRight, Sparkles, PiggyBank } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { generateDashboardInsights } from '../services/geminiService';
import { SavingsGoalModal } from '../components/SavingsGoalModal';
import { ProUpgradeModal } from '../components/ProUpgradeModal';
import { useLanguage } from '../contexts/LanguageContext';

export const Dashboard: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [aiInsights, setAiInsights] = useState<FinancialInsight[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(true);
  const [showSavingsModal, setShowSavingsModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0); 

  const totalAllocatedSavings = MOCK_USER.savingsGoals.reduce((sum, g) => sum + g.monthlyAllocation, 0);
  const effectiveSpendingPower = MOCK_USER.freeSpendingPower - totalAllocatedSavings;

  useEffect(() => {
    const generatedNudges: Nudge[] = [];
    const today = new Date();
    const currentDay = today.getDate();
    const prefs = MOCK_USER.notificationPreferences;

    MOCK_DEBTS.forEach((debt) => {
      const dueDateObj = new Date(debt.dueDate);
      const dueDay = dueDateObj.getDate();
      
      let daysRemaining = dueDay - currentDay;
      if (daysRemaining < 0) daysRemaining += 30;

      if (daysRemaining <= prefs.reminderDaysBeforeDue) {
        generatedNudges.push({
          id: `due-${debt.id}`,
          type: 'payment_due',
          title: `Payment Due: ${debt.name}`,
          message: daysRemaining === 0 
            ? "Due today! Pay now to maintain your streak." 
            : `Due in ${daysRemaining} days. Early payment boosts your score.`,
          actionLabel: `Pay $${debt.minPayment}`,
          priority: daysRemaining < 3 ? 'high' : 'medium',
          timestamp: new Date()
        });
      }
    });

    if (MOCK_USER.subscriptionStatus === 'trial' && MOCK_USER.trialDaysLeft < 3) {
        generatedNudges.push({
            id: 'trial-warn',
            type: 'warning',
            title: 'Trial Ending Soon',
            message: 'Your Pro features will expire in 2 days.',
            actionLabel: t('dash.upgrade'),
            priority: 'medium',
            timestamp: new Date()
        });
    }

    setNudges(prev => [...generatedNudges, ...prev]);
  }, [refreshTrigger, t]); 

  useEffect(() => {
    const fetchInsights = async () => {
        try {
            const insights = await generateDashboardInsights(MOCK_USER, MOCK_DEBTS);
            setAiInsights(insights);
        } catch (e) {
            console.error("Failed to fetch insights", e);
        } finally {
            setLoadingInsights(false);
        }
    };
    fetchInsights();
  }, []);

  const simulatePayday = () => {
    if (!MOCK_USER.notificationPreferences.enableSmartNudges) {
        alert("Enable Smart Nudges in Profile Settings to use this feature.");
        return;
    }

    const priorityDebt = [...MOCK_DEBTS].sort((a, b) => b.apr - a.apr)[0];
    
    const incomeNudge: Nudge = {
      id: `income-${Date.now()}`,
      type: 'income_event',
      title: '💸 Payday Detected!',
      message: `Great timing! Allocate $200 to ${priorityDebt.name} right now to save approx. $15 in future interest.`,
      actionLabel: 'Make Smart Payment',
      priority: 'high',
      timestamp: new Date()
    };

    setNudges(prev => [incomeNudge, ...prev]);
  };

  const removeNudge = (id: string) => {
    setNudges(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('dash.hello')}, {MOCK_USER.name}</h1>
          <p className="text-sm text-textMuted">{t('dash.subtitle')}</p>
        </div>
        <Link to="/profile">
            <div className="w-10 h-10 rounded-full bg-surfaceHighlight border border-white/10 flex items-center justify-center relative">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${MOCK_USER.name}`} alt="Avatar" className="w-8 h-8" />
                <div className="absolute -top-1 -right-1 bg-primary text-black text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-background">
                    {MOCK_USER.level}
                </div>
            </div>
        </Link>
      </div>

      {/* Trial Banner */}
      {MOCK_USER.subscriptionStatus === 'trial' && (
          <div className="bg-gradient-to-r from-secondary/20 to-primary/10 border border-secondary/30 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Crown size={16} className="text-secondary" />
                <span className="text-xs font-semibold text-white">{t('dash.trial_left').replace('{days}', MOCK_USER.trialDaysLeft.toString())}</span>
            </div>
            <button 
                onClick={() => setShowUpgradeModal(true)}
                className="text-[10px] font-bold bg-secondary text-white px-3 py-1.5 rounded-lg shadow-neon-purple hover:bg-secondary/80 transition-colors"
            >
                {t('dash.upgrade')}
            </button>
          </div>
      )}

      {/* Free Spending Power (The "Hero") */}
      <div className="relative w-full rounded-[2rem] p-6 flex flex-col justify-between overflow-hidden shadow-glass border border-white/5 bg-gradient-to-br from-surfaceHighlight to-black">
        <div className="absolute top-[-20%] right-[-20%] w-48 h-48 bg-primary/20 rounded-full blur-[60px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-32 h-32 bg-secondary/20 rounded-full blur-[50px]" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
             <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
             <p className="text-sm font-semibold text-textMuted uppercase tracking-wide">{t('dash.spending_power')}</p>
          </div>
          
          <div className="flex items-baseline gap-1 mt-1">
             <h2 className="text-5xl font-extrabold text-white tracking-tight">
               ${effectiveSpendingPower}
             </h2>
             {totalAllocatedSavings > 0 && (
                <span className="text-sm font-medium text-textMuted line-through opacity-50">
                    ${MOCK_USER.freeSpendingPower}
                </span>
             )}
          </div>
          
          <p className="text-xs text-textMuted mt-2 max-w-[90%]">
            {t('dash.safe_spend')} 
            {totalAllocatedSavings > 0 
                ? ` ${t('dash.includes_goals').replace('${amount}', totalAllocatedSavings.toString())}` 
                : ` ${t('dash.covered')}`}
          </p>
        </div>

        <div className="relative z-10 flex gap-2 mt-5 overflow-x-auto no-scrollbar pb-2">
            <button 
                onClick={() => setShowSavingsModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/10 hover:bg-white/20 transition-colors whitespace-nowrap"
            >
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-black text-[10px]">
                    <PiggyBank size={12} fill="currentColor" />
                </div>
                <span className="text-xs font-bold text-white">{t('dash.manage_goals')}</span>
            </button>
            
            {MOCK_USER.savingsGoals.map(goal => (
                 <div key={goal.id} className="flex items-center gap-2 px-3 py-1.5 bg-black/30 rounded-full border border-white/5 whitespace-nowrap">
                    <span className="text-xs">{goal.emoji}</span>
                    <span className="text-xs font-semibold text-textMuted">{goal.name}</span>
                    <span className="text-xs font-bold text-primary">${goal.monthlyAllocation}</span>
                </div>
            ))}
        </div>

        <div className="relative z-10 flex gap-4 mt-4 pt-4 border-t border-white/5">
             <div className="flex flex-col">
                <span className="text-[10px] text-textMuted font-bold uppercase">{t('dash.income')}</span>
                <span className="text-sm font-bold text-white">${MOCK_USER.monthlyIncome.toLocaleString()}</span>
             </div>
             <div className="w-[1px] h-8 bg-white/10"></div>
             <div className="flex flex-col">
                <span className="text-[10px] text-textMuted font-bold uppercase">{t('dash.fixed')}</span>
                <span className="text-sm font-bold text-white">${MOCK_USER.fixedExpenses.toLocaleString()}</span>
             </div>
        </div>
      </div>

      <SavingsGoalModal 
        isOpen={showSavingsModal} 
        onClose={() => setShowSavingsModal(false)} 
        onUpdate={() => setRefreshTrigger(prev => prev + 1)}
      />

      <ProUpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onSuccess={() => setRefreshTrigger(prev => prev + 1)}
      />

      <div className="flex items-center justify-between bg-surface/50 rounded-2xl p-4 border border-white/5">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                <Zap size={20} fill="currentColor" />
            </div>
            <div>
                <p className="text-sm font-bold text-white">{MOCK_USER.streakDays} {t('dash.streak')}</p>
                <p className="text-xs text-textMuted">{t('dash.momentum')}</p>
            </div>
        </div>
        <button className="text-xs font-bold bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors border border-white/5">
            {t('dash.claim_xp')}
        </button>
      </div>

      <div className="mb-2">
        <h3 className="text-lg font-bold flex items-center gap-2 mb-3">
            <Sparkles size={18} className="text-secondary" />
            {t('dash.insights')}
        </h3>
        
        {loadingInsights ? (
            <div className="space-y-3">
                <div className="h-24 bg-surfaceHighlight/30 rounded-2xl animate-pulse border border-white/5" />
                <div className="h-24 bg-surfaceHighlight/30 rounded-2xl animate-pulse border border-white/5" />
            </div>
        ) : (
            <div className="space-y-3">
                {aiInsights.map((insight, idx) => (
                    <div key={idx} className="bg-surface/60 border border-white/10 p-4 rounded-2xl backdrop-blur-sm relative overflow-hidden group hover:border-white/20 transition-all">
                        <div className={`absolute top-0 left-0 w-1 h-full ${
                            insight.type === 'warning' ? 'bg-red-500' : 
                            insight.type === 'opportunity' ? 'bg-primary' : 'bg-blue-500'
                        }`} />
                        <div className="pl-3">
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="font-bold text-sm text-white">{insight.title}</h4>
                                {insight.impact && (
                                    <span className="text-[10px] font-bold bg-white/5 px-2 py-0.5 rounded text-textMuted border border-white/5">
                                        {insight.impact}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-textMuted leading-relaxed">
                                {insight.description}
                            </p>
                        </div>
                    </div>
                ))}
                {aiInsights.length === 0 && (
                     <div className="p-4 text-center text-textMuted bg-surface/30 rounded-2xl border border-white/5">
                        <p className="text-xs">{t('dash.no_insights')}</p>
                     </div>
                )}
            </div>
        )}
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold flex items-center gap-2">
                <Bell size={18} /> {t('dash.action_plan')}
            </h3>
            <button 
                onClick={simulatePayday}
                className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded border border-white/10 text-textMuted"
            >
                {t('dash.demo_payday')}
            </button>
        </div>

        <div className="space-y-3">
             {nudges.length === 0 && (
                 <div className="p-6 text-center text-textMuted bg-surface/30 rounded-2xl border border-white/5 border-dashed">
                     <p>{t('dash.no_actions')}</p>
                 </div>
             )}

             {nudges.map((nudge) => (
                 <div 
                    key={nudge.id} 
                    className={`group flex items-start gap-4 rounded-2xl p-4 border transition-all cursor-pointer relative overflow-hidden ${
                        nudge.type === 'income_event' 
                        ? 'bg-gradient-to-r from-secondary/20 to-surface border-secondary/50' 
                        : nudge.priority === 'high' 
                            ? 'bg-surface border-primary/50 shadow-neon-green/10' 
                            : 'bg-surface border-white/5'
                    }`}
                 >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        nudge.type === 'income_event' ? 'bg-secondary/20 text-secondary' :
                        nudge.priority === 'high' ? 'bg-primary/10 text-primary' : 'bg-blue-500/10 text-blue-500'
                    }`}>
                        {nudge.type === 'income_event' ? <Wallet size={24} /> : 
                         nudge.type === 'payment_due' ? <TrendingUp size={24} /> : <ShieldCheck size={24} />}
                    </div>

                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                             <p className={`text-sm font-bold ${nudge.type === 'income_event' ? 'text-secondary' : 'text-white'}`}>
                                {nudge.title}
                             </p>
                             {nudge.type === 'income_event' && (
                                 <span className="text-[9px] font-bold uppercase tracking-wider bg-secondary text-white px-1.5 py-0.5 rounded">
                                     {t('dash.optimal_timing')}
                                 </span>
                             )}
                        </div>
                        <p className="text-xs text-textMuted mt-1 leading-relaxed">{nudge.message}</p>
                        
                        {nudge.actionLabel && (
                            <button 
                                onClick={() => {
                                    if(nudge.id.startsWith('due')) navigate('/debt');
                                    removeNudge(nudge.id);
                                }}
                                className={`mt-3 text-xs font-bold flex items-center gap-1 hover:gap-2 transition-all ${
                                    nudge.type === 'income_event' ? 'text-secondary' : 
                                    nudge.priority === 'high' ? 'text-primary' : 'text-white'
                                }`}
                            >
                                {nudge.actionLabel} <ArrowRight size={14} />
                            </button>
                        )}
                    </div>
                 </div>
             ))}
        </div>
      </div>
      
      <div className="h-8"></div>
    </div>
  );
};