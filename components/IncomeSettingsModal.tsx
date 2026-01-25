import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, Loader2, Wallet, Receipt } from 'lucide-react';
import { profileService } from '../services/profileService';

interface IncomeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  currentIncome?: number;
  currentExpenses?: number;
  currentPayday?: number;
}

type PayFrequency = 'monthly' | 'biweekly' | 'weekly' | 'custom';

export const IncomeSettingsModal: React.FC<IncomeSettingsModalProps> = ({
  isOpen,
  onClose,
  onUpdate,
  currentIncome = 0,
  currentExpenses = 0,
  currentPayday = 15
}) => {
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [fixedExpenses, setFixedExpenses] = useState('');
  const [payFrequency, setPayFrequency] = useState<PayFrequency>('monthly');
  const [paydayFirst, setPaydayFirst] = useState('15');
  const [paydaySecond, setPaydaySecond] = useState('30');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMonthlyIncome(currentIncome > 0 ? currentIncome.toString() : '');
      setFixedExpenses(currentExpenses > 0 ? currentExpenses.toString() : '');
      // Determine frequency based on payday
      if (currentPayday === 15) {
        setPayFrequency('biweekly');
        setPaydayFirst('15');
        setPaydaySecond('30');
      } else {
        setPayFrequency('monthly');
        setPaydayFirst(currentPayday.toString());
      }
    }
  }, [isOpen, currentIncome, currentExpenses, currentPayday]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const income = parseFloat(monthlyIncome) || 0;
      const expenses = parseFloat(fixedExpenses) || 0;

      // Determine payday based on frequency
      let payday = parseInt(paydayFirst) || 15;
      if (payFrequency === 'biweekly') {
        payday = parseInt(paydayFirst) || 15; // Use first payday for notifications
      }

      await profileService.updateProfile({
        monthly_income: income,
        fixed_expenses: expenses,
        notification_preferences: {
          enableSmartNudges: true,
          reminderDaysBeforeDue: 3,
          paydayDayOfMonth: payday
        }
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error saving income settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const calculateFreeSpending = () => {
    const income = parseFloat(monthlyIncome) || 0;
    const expenses = parseFloat(fixedExpenses) || 0;
    return Math.max(0, income - expenses);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-surface border border-white/10 rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Wallet size={24} className="text-primary" />
            Income Settings
          </h2>
          <button onClick={onClose}>
            <X size={20} className="text-textMuted hover:text-white" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Monthly Income */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-textMuted uppercase tracking-wider flex items-center gap-2">
              <DollarSign size={14} /> Monthly Income
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-textMuted">$</span>
              <input
                type="number"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                placeholder="0.00"
                className="w-full bg-surfaceHighlight border border-white/10 rounded-xl p-3.5 pl-8 text-lg font-bold text-white focus:outline-none focus:border-primary placeholder-white/20"
              />
            </div>
            <p className="text-[10px] text-textMuted">Your total monthly income after taxes</p>
          </div>

          {/* Pay Frequency */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-textMuted uppercase tracking-wider flex items-center gap-2">
              <Calendar size={14} /> Pay Frequency
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'monthly', label: 'Monthly', desc: '1x per month' },
                { value: 'biweekly', label: 'Biweekly', desc: '2x per month' },
                { value: 'weekly', label: 'Weekly', desc: '4x per month' },
                { value: 'custom', label: 'Custom', desc: 'Set your own' },
              ].map((freq) => (
                <button
                  key={freq.value}
                  onClick={() => setPayFrequency(freq.value as PayFrequency)}
                  className={`flex flex-col items-start p-3 rounded-xl border transition-all ${
                    payFrequency === freq.value
                      ? 'bg-primary/20 border-primary text-white'
                      : 'bg-surfaceHighlight border-white/10 text-textMuted hover:text-white hover:border-white/20'
                  }`}
                >
                  <span className="text-sm font-bold">{freq.label}</span>
                  <span className="text-[10px] opacity-70">{freq.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Payday Selector */}
          {payFrequency === 'monthly' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-textMuted uppercase tracking-wider">
                Payday (Day of Month)
              </label>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                {[1, 5, 10, 15, 20, 25, 30].map(day => (
                  <button
                    key={day}
                    onClick={() => setPaydayFirst(day.toString())}
                    className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all whitespace-nowrap ${
                      parseInt(paydayFirst) === day
                        ? 'bg-primary text-black border-primary'
                        : 'bg-surfaceHighlight text-textMuted border-white/5 hover:border-white/20'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}

          {payFrequency === 'biweekly' && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-textMuted uppercase tracking-wider">
                Paydays (Days of Month)
              </label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <p className="text-[10px] text-textMuted mb-1">First Payday</p>
                  <select
                    value={paydayFirst}
                    onChange={(e) => setPaydayFirst(e.target.value)}
                    className="w-full bg-surfaceHighlight border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary"
                  >
                    {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-textMuted mb-1">Second Payday</p>
                  <select
                    value={paydaySecond}
                    onChange={(e) => setPaydaySecond(e.target.value)}
                    className="w-full bg-surfaceHighlight border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary"
                  >
                    {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {payFrequency === 'weekly' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-textMuted uppercase tracking-wider">
                Payday (Day of Week)
              </label>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, index) => (
                  <button
                    key={day}
                    onClick={() => setPaydayFirst((index + 1).toString())}
                    className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all whitespace-nowrap ${
                      parseInt(paydayFirst) === index + 1
                        ? 'bg-primary text-black border-primary'
                        : 'bg-surfaceHighlight text-textMuted border-white/5 hover:border-white/20'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}

          {payFrequency === 'custom' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-textMuted uppercase tracking-wider">
                Custom Payday
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={paydayFirst}
                onChange={(e) => setPaydayFirst(e.target.value)}
                placeholder="Day of month (1-31)"
                className="w-full bg-surfaceHighlight border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary placeholder-white/20"
              />
            </div>
          )}

          {/* Fixed Expenses */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-textMuted uppercase tracking-wider flex items-center gap-2">
              <Receipt size={14} /> Fixed Monthly Expenses
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-textMuted">$</span>
              <input
                type="number"
                value={fixedExpenses}
                onChange={(e) => setFixedExpenses(e.target.value)}
                placeholder="0.00"
                className="w-full bg-surfaceHighlight border border-white/10 rounded-xl p-3.5 pl-8 text-lg font-bold text-white focus:outline-none focus:border-primary placeholder-white/20"
              />
            </div>
            <p className="text-[10px] text-textMuted">Rent, utilities, subscriptions, etc.</p>
          </div>

          {/* Free Spending Preview */}
          <div className="bg-surfaceHighlight/50 rounded-2xl p-4 border border-white/5">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-textMuted font-bold uppercase tracking-wider">Free Spending Power</p>
                <p className="text-[10px] text-textMuted mt-0.5">After bills & before savings</p>
              </div>
              <p className={`text-2xl font-extrabold ${calculateFreeSpending() > 0 ? 'text-primary' : 'text-red-500'}`}>
                ${calculateFreeSpending().toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-6 py-4 bg-white text-black font-bold rounded-2xl hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Settings'
          )}
        </button>
      </div>
    </div>
  );
};
