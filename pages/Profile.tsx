import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AVAILABLE_BADGES } from '../constants';
import { Wallet, Award, Settings, ChevronRight, Lock, Crown, Star, CheckCircle, Calculator, Loader2, Plus, DollarSign, Receipt, PieChart, Edit3 } from 'lucide-react';
import { ReminderSettings } from '../components/ReminderSettings';
import { ProUpgradeModal } from '../components/ProUpgradeModal';
import { AssetModal } from '../components/AssetModal';
import { IncomeSettingsModal } from '../components/IncomeSettingsModal';
import { EditProfileModal } from '../components/EditProfileModal';
import { useLanguage } from '../contexts/LanguageContext';
import { profileService } from '../services/profileService';
import { assetService } from '../services/assetService';
import { UserProfile, Asset } from '../types';

export const Profile: React.FC = () => {
  const { t } = useLanguage();
  const [showSettings, setShowSettings] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [profileData, assetsData] = await Promise.all([
          profileService.getProfile(),
          assetService.getAssets()
        ]);
        setProfile(profileData);
        setAssets(assetsData);
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [refresh]);

  const totalAssets = useMemo(() => assets.reduce((acc, curr) => acc + curr.value, 0), [assets]);
  const totalDebt = profile?.totalDebt || 0;
  const netWorth = totalAssets - totalDebt;

  const allBadgesDisplay = AVAILABLE_BADGES.map(badge => {
      const isEarned = profile?.badges?.some(b => b.id === badge.id) || false;
      return { ...badge, isEarned };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-textMuted">Error al cargar perfil</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2">
      {/* Header */}
      <div className="flex flex-col items-center">
        <div className="w-24 h-24 rounded-full bg-surfaceHighlight border-4 border-surface relative mb-3">
             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`} alt="Avatar" className="w-full h-full p-1" />
             <div className={`absolute bottom-0 right-0 text-black text-xs font-bold px-2 py-0.5 rounded-full border-2 border-background ${profile.subscriptionStatus === 'pro' ? 'bg-secondary text-white' : 'bg-primary'}`}>
                {profile.subscriptionStatus === 'pro' ? 'PRO' : `${t('profile.level')} ${profile.level}`}
             </div>
        </div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold flex items-center gap-2">
              {profile.name}
              {profile.subscriptionStatus === 'pro' && <Crown size={18} className="text-secondary" fill="currentColor" />}
          </h1>
          <button
            onClick={() => setShowEditProfileModal(true)}
            className="p-2 rounded-full bg-surfaceHighlight hover:bg-surface transition-colors"
          >
            <Edit3 size={16} className="text-textMuted hover:text-white" />
          </button>
        </div>
        <div className="flex items-center gap-2 mt-1">
            <p className="text-textMuted text-sm">{t('profile.warrior')}</p>
            <span className="w-1 h-1 bg-textMuted rounded-full"></span>
            <p className="text-primary text-sm font-bold">{profile.points} XP</p>
        </div>
      </div>

      {/* PRO Upgrade Card (If Not Pro) OR Pro Status Card (If Pro) */}
      {profile.subscriptionStatus !== 'pro' ? (
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
                {(() => {
                  const total = totalAssets + totalDebt;
                  const assetsPercent = total > 0 ? Math.round((totalAssets / total) * 100) : 50;
                  const debtPercent = 100 - assetsPercent;
                  return (
                    <>
                      <div className="bg-primary h-full" style={{ width: `${assetsPercent}%` }}></div>
                      <div className="bg-accent h-full" style={{ width: `${debtPercent}%` }}></div>
                    </>
                  );
                })()}
            </div>
            <div className="flex justify-between text-[10px] mt-2 text-textMuted">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary"></span> {t('profile.assets')}: ${totalAssets.toLocaleString()}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent"></span> {t('profile.debts')}: ${totalDebt.toLocaleString()}</span>
            </div>
        </div>
      </div>

      {/* Income Settings Card */}
      <div
        onClick={() => setShowIncomeModal(true)}
        className="bg-surface rounded-3xl p-5 border border-white/5 cursor-pointer hover:bg-surface/80 transition-colors"
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-textMuted uppercase tracking-wider">Ingreso Mensual</p>
              <p className="text-xl font-extrabold text-white">
                ${(profile?.monthlyIncome || 0).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-textMuted uppercase tracking-wider">Libre para Gastar</p>
            <p className={`text-lg font-bold ${(profile?.monthlyIncome || 0) - (profile?.fixedExpenses || 0) > 0 ? 'text-primary' : 'text-accent'}`}>
              ${Math.max(0, (profile?.monthlyIncome || 0) - (profile?.fixedExpenses || 0)).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-[10px] text-textMuted">
          <span>Gastos Fijos: ${(profile?.fixedExpenses || 0).toLocaleString()}</span>
          <span className="flex items-center gap-1">
            Configurar <ChevronRight size={12} />
          </span>
        </div>
      </div>

      {/* Assets List */}
      <section>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-lg">{t('profile.assets')}</h3>
            <button
              onClick={() => {
                setEditingAsset(null);
                setShowAssetModal(true);
              }}
              className="text-primary text-xs font-bold flex items-center gap-1 hover:underline"
            >
              <Plus size={14} /> {t('profile.add')}
            </button>
          </div>
          <div className="space-y-2">
              {assets.length === 0 ? (
                <div className="text-center py-8 text-textMuted">
                  <Wallet size={48} className="mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No assets yet</p>
                  <p className="text-xs mt-1">Add your first asset to track your net worth</p>
                </div>
              ) : (
                assets.map(asset => (
                  <div
                    key={asset.id}
                    onClick={() => {
                      setEditingAsset(asset);
                      setShowAssetModal(true);
                    }}
                    className="flex justify-between items-center bg-surface/50 p-4 rounded-2xl border border-white/5 cursor-pointer hover:bg-surface/70 transition-colors"
                  >
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
                ))
              )}
          </div>
      </section>

      {/* Achievement Vault */}
      <section>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-lg">{t('profile.vault')}</h3>
            <span className="text-xs text-textMuted">{profile.badges.length} {t('profile.unlocked')}</span>
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

      {/* Tools Section */}
      <section className="mt-2">
          <h3 className="font-bold text-lg mb-3">Herramientas</h3>
          <div className="space-y-2">
            <Link
              to="/transactions"
              className="w-full flex justify-between items-center p-4 rounded-2xl bg-surface/50 border border-white/5 transition-colors hover:bg-surface/80"
            >
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                    <Receipt size={20} />
                  </div>
                  <div>
                    <span className="font-bold text-sm">Historial de Gastos</span>
                    <p className="text-xs text-textMuted">Ver y filtrar transacciones</p>
                  </div>
              </div>
              <ChevronRight size={16} className="text-textMuted" />
            </Link>
            <Link
              to="/budget"
              className="w-full flex justify-between items-center p-4 rounded-2xl bg-surface/50 border border-white/5 transition-colors hover:bg-surface/80"
            >
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <PieChart size={20} />
                  </div>
                  <div>
                    <span className="font-bold text-sm">Presupuestos</span>
                    <p className="text-xs text-textMuted">Controla gastos por categoria</p>
                  </div>
              </div>
              <ChevronRight size={16} className="text-textMuted" />
            </Link>
            <Link
              to="/calculator"
              className="w-full flex justify-between items-center p-4 rounded-2xl bg-surface/50 border border-white/5 transition-colors hover:bg-surface/80"
            >
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Calculator size={20} />
                  </div>
                  <div>
                    <span className="font-bold text-sm">Calculadora de Interés</span>
                    <p className="text-xs text-textMuted">Calcula pagos y amortización</p>
                  </div>
              </div>
              <ChevronRight size={16} className="text-textMuted" />
            </Link>
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

      <AssetModal
        isOpen={showAssetModal}
        onClose={() => {
          setShowAssetModal(false);
          setEditingAsset(null);
        }}
        onUpdate={() => setRefresh(prev => prev + 1)}
        editAsset={editingAsset}
      />

      <IncomeSettingsModal
        isOpen={showIncomeModal}
        onClose={() => setShowIncomeModal(false)}
        onUpdate={() => setRefresh(prev => prev + 1)}
        currentIncome={profile?.monthlyIncome}
        currentExpenses={profile?.fixedExpenses}
        currentPayday={profile?.notificationPreferences?.paydayDayOfMonth}
      />

      <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        onUpdate={() => setRefresh(prev => prev + 1)}
        currentName={profile?.name || ''}
        currentCreditScore={profile?.creditScore || 700}
      />

      <div className="h-8"></div>
    </div>
  );
};