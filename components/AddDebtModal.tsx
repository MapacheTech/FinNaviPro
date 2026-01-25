import React, { useState, useEffect } from 'react';
import { X, CreditCard, Loader2, Percent, Calendar, DollarSign, Building2, Car, Home, GraduationCap, Wallet } from 'lucide-react';
import { debtService, DebtCategory, DebtInput } from '../services/debtService';
import { Debt, PaymentType } from '../types';

interface AddDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  editDebt?: Debt | null;
}

const DEBT_CATEGORIES: { value: DebtCategory; label: string; icon: React.ReactNode }[] = [
  { value: 'credit_card', label: 'Credit Card', icon: <CreditCard size={18} /> },
  { value: 'loan', label: 'Personal Loan', icon: <Wallet size={18} /> },
  { value: 'mortgage', label: 'Mortgage', icon: <Home size={18} /> },
  { value: 'auto', label: 'Auto Loan', icon: <Car size={18} /> },
  { value: 'student', label: 'Student Loan', icon: <GraduationCap size={18} /> },
  { value: 'other', label: 'Other', icon: <Building2 size={18} /> },
];

const PAYMENT_TYPES: { value: PaymentType; label: string; description: string }[] = [
  { value: 'lump_sum', label: 'Variable', description: 'Pay any amount' },
  { value: 'installments_no_interest', label: 'Fixed (0%)', description: 'No interest' },
  { value: 'installments_with_interest', label: 'Fixed (APR)', description: 'With interest' },
];

export const AddDebtModal: React.FC<AddDebtModalProps> = ({ isOpen, onClose, onUpdate, editDebt }) => {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [apr, setApr] = useState('');
  const [minPayment, setMinPayment] = useState('');
  const [category, setCategory] = useState<DebtCategory>('credit_card');
  const [paymentType, setPaymentType] = useState<PaymentType>('lump_sum');
  const [totalMonths, setTotalMonths] = useState('');
  const [paymentDueDay, setPaymentDueDay] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editDebt) {
        setName(editDebt.name);
        setBalance(editDebt.balance.toString());
        setApr(editDebt.apr.toString());
        setMinPayment(editDebt.minPayment.toString());
        setCategory((editDebt.category as DebtCategory) || 'credit_card');
        setPaymentType(editDebt.paymentType || 'lump_sum');
        setTotalMonths(editDebt.totalMonths?.toString() || '');
        setPaymentDueDay(editDebt.paymentDueDay?.toString() || '');
      } else {
        resetForm();
      }
    }
  }, [isOpen, editDebt]);

  const resetForm = () => {
    setName('');
    setBalance('');
    setApr('');
    setMinPayment('');
    setCategory('credit_card');
    setPaymentType('lump_sum');
    setTotalMonths('');
    setPaymentDueDay('');
  };

  const handleSave = async () => {
    if (!name.trim() || !balance) return;

    setSaving(true);
    try {
      const input: DebtInput = {
        name: name.trim(),
        balance: parseFloat(balance),
        apr: parseFloat(apr) || 0,
        minPayment: parseFloat(minPayment) || 0,
        category,
        paymentType,
        totalMonths: totalMonths ? parseInt(totalMonths) : undefined,
        originalAmount: parseFloat(balance),
        paymentDueDay: paymentDueDay ? parseInt(paymentDueDay) : undefined,
      };

      if (editDebt) {
        await debtService.updateDebt(editDebt.id, input);
      } else {
        await debtService.createDebt(input);
      }

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error saving debt:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editDebt) return;

    setDeleting(true);
    try {
      await debtService.deleteDebt(editDebt.id);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error deleting debt:', error);
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-surface border border-white/10 rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CreditCard size={24} className="text-accent" />
            {editDebt ? 'Edit Debt' : 'Add Debt'}
          </h2>
          <button onClick={onClose}>
            <X size={20} className="text-textMuted hover:text-white" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-textMuted uppercase tracking-wider">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Chase Sapphire, Car Loan"
              className="w-full bg-surfaceHighlight border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-accent placeholder-white/20"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-textMuted uppercase tracking-wider">
              Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {DEBT_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                    category === cat.value
                      ? 'bg-accent/20 border-accent text-accent'
                      : 'bg-surfaceHighlight border-white/10 text-textMuted hover:text-white hover:border-white/20'
                  }`}
                >
                  {cat.icon}
                  <span className="text-[10px] font-bold">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Balance & APR */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-bold text-textMuted uppercase tracking-wider flex items-center gap-1">
                <DollarSign size={12} /> Balance
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-textMuted">$</span>
                <input
                  type="number"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-surfaceHighlight border border-white/10 rounded-xl p-3 pl-8 text-sm text-white focus:outline-none focus:border-accent placeholder-white/20"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-textMuted uppercase tracking-wider flex items-center gap-1">
                <Percent size={12} /> APR
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={apr}
                  onChange={(e) => setApr(e.target.value)}
                  placeholder="0"
                  step="0.1"
                  className="w-full bg-surfaceHighlight border border-white/10 rounded-xl p-3 pr-8 text-sm text-white focus:outline-none focus:border-accent placeholder-white/20"
                />
                <span className="absolute right-3 top-3 text-textMuted">%</span>
              </div>
            </div>
          </div>

          {/* Payment Type */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-textMuted uppercase tracking-wider">
              Payment Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setPaymentType(type.value)}
                  className={`flex flex-col items-start p-3 rounded-xl border transition-all ${
                    paymentType === type.value
                      ? 'bg-accent/20 border-accent text-white'
                      : 'bg-surfaceHighlight border-white/10 text-textMuted hover:text-white hover:border-white/20'
                  }`}
                >
                  <span className="text-xs font-bold">{type.label}</span>
                  <span className="text-[10px] opacity-70">{type.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Min Payment & Due Day */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-bold text-textMuted uppercase tracking-wider">
                Min Payment
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-textMuted">$</span>
                <input
                  type="number"
                  value={minPayment}
                  onChange={(e) => setMinPayment(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-surfaceHighlight border border-white/10 rounded-xl p-3 pl-8 text-sm text-white focus:outline-none focus:border-accent placeholder-white/20"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-textMuted uppercase tracking-wider flex items-center gap-1">
                <Calendar size={12} /> Due Day
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={paymentDueDay}
                onChange={(e) => setPaymentDueDay(e.target.value)}
                placeholder="15"
                className="w-full bg-surfaceHighlight border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-accent placeholder-white/20"
              />
            </div>
          </div>

          {/* Total Months (for installments) */}
          {paymentType !== 'lump_sum' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-textMuted uppercase tracking-wider">
                Total Installments
              </label>
              <input
                type="number"
                value={totalMonths}
                onChange={(e) => setTotalMonths(e.target.value)}
                placeholder="12"
                className="w-full bg-surfaceHighlight border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-accent placeholder-white/20"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          {editDebt && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 py-4 bg-red-500/10 border border-red-500/20 text-red-500 font-bold rounded-2xl hover:bg-red-500/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {deleting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Delete'}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!name.trim() || !balance || saving}
            className="flex-[2] py-4 bg-white text-black font-bold rounded-2xl hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              editDebt ? 'Update Debt' : 'Add Debt'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
