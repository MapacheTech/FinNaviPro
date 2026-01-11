import React, { useMemo, useState } from 'react';
import { MOCK_USER, MOCK_ASSETS, MOCK_DEBTS, AVAILABLE_BADGES } from '../constants';
import { Wallet, Award, Settings, ChevronRight, Lock, Crown, Star, CheckCircle } from 'lucide-react';
import { ReminderSettings } from '../components/ReminderSettings';
import { ProUpgradeModal } from '../components/ProUpgradeModal';
import { useLanguage } from '../contexts/LanguageContext';

export const Profile: React.FC = () => {
  const { t } = useLanguage();
  const [showSettings, setShowSettings] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [refresh, setRefresh] = useState(0); 

  const totalAssets = useMemo(() => MOCK_ASSETS.reduce((acc, curr) => acc + curr.value, 0), []);
  const totalDebt = MOCK_USER.totalDebt;
  const netWorth = totalAssets - totalDebt;

  const allBadgesDisplay = AVAILABLE_BADGES.map(badge => {
      const isEarned = MOCK_USER.badges.some(b => b.id === badge.id);
      return { ...badge, isEarned };
  });

  return (
    <div className="space-y-6 pt-2">
      {/* Header */}
      <div className="flex flex-col items-center">
        <div className="w-24 h-24 rounded-full bg-surfaceHighlight border-4 border-surface relative mb-3">
             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${MOCK_USER.name}`} alt="Avatar" className="w-full h-full p-1" />
             <div className={`absolute bottom-0 right-0 text-black text-xs font-bold px-2 py-0.5 rounded-full border-2 border-background ${MOCK_USER.subscriptionStatus === 'pro' ? 'bg-secondary text-white' : 'bg-primary'}`}>
                {MOCK_USER.subscriptionStatus === 'pro' ? 'PRO' : `${t('profile.level')} ${MOCK_USER.level}`}
             </div>
        </div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
            {MOCK_USER.name}
            {MOCK_USER.subscriptionStatus === 'pro' && <Crown size={18} className="text-secondary" fill="currentColor" />}
        </h1>
        <div className="flex items-center gap-2 mt-1">
            <p className="text-textMuted text-sm">{t('profile.warrior')}</p>
            <span className="w-1 h-1 bg-textMuted rounded-full"></span>
            <p className="text-primary text-sm font-bold">{MOCK_USER.points} XP</p>
        </div>
      </div>

      {/* PRO Upgrade Card (If Not Pro) OR Pro Status Card (If Pro) */}
      {MOCK_USER.subscriptionStatus !== 'pro' ? (
          <div 
            onClick={() => setShowUpgradeModal(true)}
            className="bg-gradient-to-r from-secondary/20 to-purple-900/40 border border-secondary/50 rounded-3xl p-5 flex items-center justify-between cursor-pointer group hover:scale-[1.02] transition-transform"
          >
              <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Crown size={20} className="text-secondary" fill="currentColor" />
                      {t('profile.go_pro')}
                  </h3>
                  <p className="text-xs text-gray-300 mt-1">{t('profile.unlock_ai')}</p>
              </div>
              <div className="bg-white text-black font-bold text-xs px-4 py-2 rounded-xl group-hover:bg-secondary group-hover:text-white transition-colors">
                  {t('dash.upgrade')}
              </div>
          </div>
      ) : (
          <div className="bg-[#0f0f11] border border-white/10 rounded-3xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Star size={80} fill="currentColor" />
              </div>
              <div className="relative z-10 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
                          <Crown size={20} fill="currentColor" />
                      </div>
                      <div>
                          <h3 className="text-sm font-bold text-white">FinNavi Pro</h3>
                          <p className="text-[10px] text-textMuted flex items-center gap-1">
                              <CheckCircle size={10} className="text-green-500" /> Active Membership
                          </p>
                      </div>
                  </div>
                  <div className="text-right">
                       <p className="text-[10px] text-textMuted uppercase tracking-wider">Next Billing</p>
                       <p className="text-xs font-bold text-white">Oct 24, 2024</p>
                  </div>
              </div>
          </div>
      )}

      {/* Net Worth Card (The "Wealth" View) */}
      <div className="bg-surface rounded-3xl p-6 border border-white/5 relative overflow-hidden">
        <div className="relative z-10">
            <p className="text-xs font-bold text-textMuted uppercase tracking-wider mb-1">{t('profile.net_worth')}</p>
            <h2 className={`text-3xl font-extrabold ${netWorth >= 0 ? 'text-primary' : 'text-accent'}`}>
                {netWorth < 0 ? '-' : ''}${Math.abs(netWorth).toLocaleString()}
            </h2>
            <div className="w-full h-2 bg-black rounded-full mt-4 flex overflow-hidden">
                {/* Visualizing Assets vs Debt */}
                <div className="bg-primary h-full" style={{ width: '40%' }}></div>
                <div className="bg-accent h-full" style={{ width: '60%' }}></div>
            </div>
            <div className="flex justify-between text-[10px] mt-2 text-textMuted">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary"></span> {t('profile.assets')}: ${totalAssets.toLocaleString()}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent"></span> {t('profile.debts')}: ${totalDebt.toLocaleString()}</span>
            </div>
        </div>
      </div>

      {/* Assets List */}
      <section>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-lg">{t('profile.assets')}</h3>
            <button className="text-primary text-xs font-bold">{t('profile.add')}</button>
          </div>
          <div className="space-y-2">
              {MOCK_ASSETS.map(asset => (
                  <div key={asset.id} className="flex justify-between items-center bg-surface/50 p-4 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                             <Wallet size={20} />
                          </div>
                          <div>
                              <p className="font-bold text-sm">{asset.name}</p>
                              <p className="text-xs text-textMuted capitalize">{asset.type}</p>
                          </div>
                      </div>
                      <span className="font-bold text-emerald-500">+${asset.value.toLocaleString()}</span>
                  </div>
              ))}
          </div>
      </section>

      {/* Achievement Vault */}
      <section>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-lg">{t('profile.vault')}</h3>
            <span className="text-xs text-textMuted">{MOCK_USER.badges.length} {t('profile.unlocked')}</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
              {allBadgesDisplay.map((badge) => (
                  <div 
                    key={badge.id} 
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center border transition-all relative overflow-hidden group ${
                        badge.isEarned 
                        ? 'bg-surfaceHighlight border-primary/30 shadow-neon-green/5' 
                        : 'bg-surface/30 border-white/5 opacity-60'
                    }`}
                  >
                      {badge.isEarned ? (
                          <div className="text-3xl mb-2 filter drop-shadow-md">{badge.icon}</div>
                      ) : (
                          <Lock size={24} className="text-textMuted mb-2" />
                      )}
                      
                      <p className={`text-[10px] font-bold text-center leading-tight px-1 ${badge.isEarned ? 'text-white' : 'text-textMuted'}`}>
                          {badge.name}
                      </p>
                  </div>
              ))}
          </div>
      </section>

      <button 
        onClick={() => setShowSettings(true)}
        className="w-full flex justify-between items-center p-4 rounded-2xl bg-surfaceHighlight border border-white/5 mt-4 transition-colors hover:bg-surfaceHighlight/80"
      >
          <div className="flex items-center gap-3">
              <Settings size={20} />
              <span className="font-bold text-sm">{t('profile.settings')}</span>
          </div>
          <ChevronRight size={16} className="text-textMuted" />
      </button>

      <ReminderSettings isOpen={showSettings} onClose={() => setShowSettings(false)} />
      
      <ProUpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)}
        onSuccess={() => setRefresh(prev => prev + 1)} 
      />

      <div className="h-8"></div>
    </div>
  );
};