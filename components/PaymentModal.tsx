import React, { useState } from 'react';
import { X, DollarSign, FileText, Check, Loader2 } from 'lucide-react';
import { Debt } from '../types';
import { debtService } from '../services/debtService';

interface PaymentModalProps {
  debt: Debt;
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ 
  debt, 
  isOpen, 
  onClose,
  onPaymentComplete 
}) => {
  const [amount, setAmount] = useState(debt.minPayment?.toString() || '');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    const paymentAmount = parseFloat(amount);
    if (!paymentAmount || paymentAmount <= 0) return;

    setIsSubmitting(true);
    
    const result = await debtService.recordPayment(debt.id, paymentAmount, note || undefined);
    
    if (result) {
      setSuccess(true);
      setTimeout(() => {
        onPaymentComplete();
        onClose();
        setSuccess(false);
        setAmount(debt.minPayment?.toString() || '');
        setNote('');
      }, 1000);
    } else {
      alert('Error al registrar el pago. Intenta de nuevo.');
    }
    
    setIsSubmitting(false);
  };

  const quickAmounts = [
    { label: 'Mínimo', value: debt.minPayment || 0 },
    { label: 'Mensual', value: debt.monthlyPayment || debt.minPayment || 0 },
    { label: 'Total', value: debt.balance },
  ].filter(q => q.value > 0);

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[80]"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-surface border border-white/10 rounded-3xl z-[90] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-white/10">
          <div>
            <h2 className="text-lg font-bold text-white">Registrar Pago</h2>
            <p className="text-xs text-textMuted">{debt.name}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={20} className="text-textMuted" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Balance Display */}
          <div className="bg-surfaceHighlight rounded-2xl p-4 flex justify-between items-center">
            <span className="text-sm text-textMuted">Balance Actual</span>
            <span className="text-xl font-bold text-white">${debt.balance.toLocaleString()}</span>
          </div>

          {/* Quick Amount Buttons */}
          <div className="flex gap-2">
            {quickAmounts.map((q, i) => (
              <button
                key={i}
                onClick={() => setAmount(q.value.toString())}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  parseFloat(amount) === q.value
                    ? 'bg-primary text-black'
                    : 'bg-white/5 text-textMuted hover:bg-white/10'
                }`}
              >
                {q.label}
                <br />
                <span className="text-[10px] opacity-70">${q.value.toLocaleString()}</span>
              </button>
            ))}
          </div>

          {/* Amount Input */}
          <div className="relative">
            <span className="absolute left-4 top-4 text-textMuted">
              <DollarSign size={20} />
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-surfaceHighlight border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-2xl font-bold text-white focus:outline-none focus:border-primary placeholder-white/10"
            />
            <span className="absolute right-4 top-5 text-xs font-bold text-textMuted">Monto</span>
          </div>

          {/* Note Input */}
          <div className="relative">
            <span className="absolute left-4 top-3.5 text-textMuted">
              <FileText size={18} />
            </span>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nota (opcional)"
              className="w-full bg-surfaceHighlight border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-primary placeholder-white/20"
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!amount || parseFloat(amount) <= 0 || isSubmitting}
            className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 ${
              success 
                ? 'bg-green-500 text-white'
                : parseFloat(amount) > 0 && !isSubmitting
                  ? 'bg-primary text-black hover:bg-primary/90'
                  : 'bg-white/20 text-textMuted cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <Loader2 size={24} className="animate-spin" />
            ) : success ? (
              <>
                <Check size={24} />
                ¡Pago Registrado!
              </>
            ) : (
              `Pagar $${parseFloat(amount || '0').toLocaleString()}`
            )}
          </button>
        </div>
      </div>
    </>
  );
};
