import React, { useState, useEffect } from 'react';
import { X, Bell, Calendar, Zap, Globe, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { profileService } from '../services/profileService';
import { NotificationPreferences } from '../types';

interface ReminderSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const defaultPreferences: NotificationPreferences = {
  enableSmartNudges: true,
  reminderDaysBeforeDue: 3,
  paydayDayOfMonth: 15
};

export const ReminderSettings: React.FC<ReminderSettingsProps> = ({ isOpen, onClose }) => {
  const { language, setLanguage, t } = useLanguage();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPreferences();
    }
  }, [isOpen]);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const profile = await profileService.getProfile();
      if (profile?.notificationPreferences) {
        setPreferences(profile.notificationPreferences);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await profileService.updateProfile({
        notification_preferences: preferences
      });
      onClose();
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-surface border border-white/10 rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300">

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Bell size={20} className="text-primary" />
            {t('settings.title')}
          </h2>
          <button onClick={onClose} className="p-2 bg-surfaceHighlight rounded-full text-textMuted hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">

              {/* Language Selector */}
              <div className="space-y-2">
                  <label className="text-xs font-bold text-textMuted uppercase tracking-wider flex items-center gap-2">
                      <Globe size={14} /> {t('settings.language')}
                  </label>
                  <div className="bg-surfaceHighlight p-1 rounded-xl flex relative">
                     <button
                       onClick={() => setLanguage('en')}
                       className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all z-10 ${language === 'en' ? 'text-black' : 'text-textMuted hover:text-white'}`}
                     >
                       {t('settings.english')}
                     </button>
                     <button
                       onClick={() => setLanguage('es')}
                       className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all z-10 ${language === 'es' ? 'text-black' : 'text-textMuted hover:text-white'}`}
                     >
                       {t('settings.spanish')}
                     </button>
                     <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-primary rounded-lg shadow-sm transition-all duration-300 ${language === 'en' ? 'left-1' : 'left-[calc(50%+4px)]'}`}></div>
                  </div>
              </div>

              {/* Smart Nudges Toggle */}
              <div className="flex items-center justify-between p-4 bg-surfaceHighlight/50 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center text-secondary">
                          <Zap size={20} fill="currentColor" />
                      </div>
                      <div>
                          <p className="font-bold text-sm">{t('settings.smart_nudges')}</p>
                          <p className="text-xs text-textMuted">{t('settings.alert_paid')}</p>
                      </div>
                  </div>
                  <div
                      onClick={() => setPreferences(p => ({...p, enableSmartNudges: !p.enableSmartNudges}))}
                      className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-colors ${preferences.enableSmartNudges ? 'bg-secondary' : 'bg-surfaceHighlight border border-white/20'}`}
                  >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${preferences.enableSmartNudges ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
              </div>

              {/* Payday Selector */}
              {preferences.enableSmartNudges && (
                  <div className="space-y-2">
                      <label className="text-xs font-bold text-textMuted uppercase tracking-wider flex items-center gap-2">
                          <Calendar size={14} /> {t('settings.payday')}
                      </label>
                      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                          {[1, 5, 15, 25, 30].map(day => (
                              <button
                                  key={day}
                                  onClick={() => setPreferences(p => ({...p, paydayDayOfMonth: day}))}
                                  className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all whitespace-nowrap ${
                                      preferences.paydayDayOfMonth === day
                                      ? 'bg-primary text-black border-primary'
                                      : 'bg-surfaceHighlight text-textMuted border-white/5 hover:border-white/20'
                                  }`}
                              >
                                  {day}th
                              </button>
                          ))}
                      </div>
                  </div>
              )}

              {/* Due Date Threshold */}
              <div className="space-y-3">
                  <div className="flex justify-between text-xs font-bold text-textMuted uppercase tracking-wider">
                      <span>{t('settings.remind_before')}</span>
                      <span className="text-white">{preferences.reminderDaysBeforeDue} {t('settings.days')}</span>
                  </div>
                  <input
                      type="range"
                      min="1"
                      max="14"
                      step="1"
                      value={preferences.reminderDaysBeforeDue}
                      onChange={(e) => setPreferences(p => ({...p, reminderDaysBeforeDue: parseInt(e.target.value)}))}
                      className="w-full h-2 bg-surfaceHighlight rounded-lg appearance-none cursor-pointer accent-primary"
                  />
              </div>

              <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:scale-[1.02] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
              >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    t('settings.save')
                  )}
              </button>

          </div>
        )}
      </div>
    </div>
  );
};
