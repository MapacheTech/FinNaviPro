import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Car, Home, GraduationCap, DollarSign, Calendar, Percent, Calculator, HelpCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { PaymentType } from '../types';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

type DebtCategory = 'credit_card' | 'loan' | 'mortgage' | 'auto';

interface DebtFormData {
  name: string;
  category: DebtCategory;
  paymentType: PaymentType;
  originalAmount: string;
  apr: string;
  totalMonths: string;
  monthlyPayment: string;
  cutOffDay: string;
  paymentDueDay: string;
}

const CATEGORY_ICONS: Record<DebtCategory, React.ReactNode> = {
  credit_card: <CreditCard size={20} />,
  loan: <GraduationCap size={20} />,
  mortgage: <Home size={20} />,
  auto: <Car size={20} />,
};

const CATEGORY_LABELS: Record<DebtCategory, string> = {
  credit_card: 'Tarjeta de Crédito',
  loan: 'Préstamo Personal',
  mortgage: 'Hipoteca',
  auto: 'Auto',
};

export const AddDebt: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<DebtFormData>({
    name: '',
    category: 'credit_card',
    paymentType: 'lump_sum',
    originalAmount: '',
    apr: '',
    totalMonths: '',
    monthlyPayment: '',
    cutOffDay: '',
    paymentDueDay: '',
  });
  
  const [calculatedInterest, setCalculatedInterest] = useState<number | null>(null);
  const [calculatedAPR, setCalculatedAPR] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAPRHelp, setShowAPRHelp] = useState(false);

  // Calculate total interest when inputs change
  useEffect(() => {
    const amount = parseFloat(formData.originalAmount) || 0;
    const months = parseInt(formData.totalMonths) || 0;
    const monthly = parseFloat(formData.monthlyPayment) || 0;
    const apr = parseFloat(formData.apr) || 0;

    if (formData.paymentType === 'installments_no_interest' && amount > 0 && months > 0) {
      // Simple division - no interest
      setCalculatedInterest(0);
      setCalculatedAPR(null);
    } else if (formData.paymentType === 'installments_with_interest') {
      if (amount > 0 && months > 0 && monthly > 0 && !apr) {
        // Calculate APR from monthly payment (Newton-Raphson approximation)
        const totalPaid = monthly * months;
        const interestPaid = totalPaid - amount;
        setCalculatedInterest(interestPaid);
        
        // Rough APR estimate
        const monthlyRate = (interestPaid / amount) / months;
        const estimatedAPR = monthlyRate * 12 * 100;
        setCalculatedAPR(Math.round(estimatedAPR * 100) / 100);
      } else if (amount > 0 && months > 0 && apr > 0) {
        // Calculate interest from APR
        const monthlyRate = apr / 100 / 12;
        const payment = (amount * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                       (Math.pow(1 + monthlyRate, months) - 1);
        const totalPaid = payment * months;
        setCalculatedInterest(Math.round((totalPaid - amount) * 100) / 100);
        setCalculatedAPR(null);
      } else {
        setCalculatedInterest(null);
        setCalculatedAPR(null);
      }
    } else {
      setCalculatedInterest(null);
      setCalculatedAPR(null);
    }
  }, [formData]);

  const handleChange = (field: keyof DebtFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    const amount = parseFloat(formData.originalAmount) || 0;
    const months = parseInt(formData.totalMonths) || null;
    const monthly = parseFloat(formData.monthlyPayment) || null;
    const apr = parseFloat(formData.apr) || calculatedAPR || null;
    
    // Calculate monthly payment for no-interest installments
    let finalMonthly = monthly;
    if (formData.paymentType === 'installments_no_interest' && months && amount) {
      finalMonthly = amount / months;
    }

    const debtData = {
      user_id: user.id,
      name: formData.name,
      amount: amount, // Current balance = original for new debt
      original_amount: amount,
      apr: apr,
      min_payment: finalMonthly,
      monthly_payment: finalMonthly,
      payment_type: formData.paymentType,
      total_months: months,
      total_interest: calculatedInterest || 0,
      cut_off_day: parseInt(formData.cutOffDay) || null,
      payment_due_day: parseInt(formData.paymentDueDay) || null,
      months_paid: 0,
      due_date: null, // Will use payment_due_day for recurring
    };

    const { error } = await supabase.from('debts').insert(debtData);
    
    setIsSubmitting(false);
    
    if (error) {
      console.error('Error saving debt:', error);
      alert('Error al guardar la deuda. Intenta de nuevo.');
    } else {
      navigate('/debts');
    }
  };

  const isValid = formData.name && formData.originalAmount && 
    (formData.paymentType === 'lump_sum' || formData.totalMonths);

  return (
    <div className="min-h-full pb-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 pt-2">
        <button onClick={() => navigate(-1)} className="p-2 bg-surfaceHighlight rounded-full text-textMuted hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">Agregar Deuda</h1>
      </div>

      {/* Category Selection */}
      <div className="mb-6">
        <label className="text-xs font-bold text-textMuted uppercase tracking-wider ml-1 mb-2 block">
          Tipo de Deuda
        </label>
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(CATEGORY_ICONS) as DebtCategory[]).map(cat => (
            <button
              key={cat}
              onClick={() => handleChange('category', cat)}
              className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                formData.category === cat 
                  ? 'bg-primary text-black' 
                  : 'bg-surfaceHighlight text-textMuted hover:text-white'
              }`}
            >
              {CATEGORY_ICONS[cat]}
              <span className="text-[10px] font-bold">{CATEGORY_LABELS[cat].split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Name Input */}
      <div className="mb-4">
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Nombre de la deuda (ej: Visa Oro)"
          className="w-full bg-surfaceHighlight border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:border-primary placeholder-white/20"
        />
      </div>

      {/* Payment Type Selection */}
      <div className="mb-6">
        <label className="text-xs font-bold text-textMuted uppercase tracking-wider ml-1 mb-2 block">
          Tipo de Pago
        </label>
        <div className="bg-surfaceHighlight p-1.5 rounded-2xl flex">
          <button
            onClick={() => handleChange('paymentType', 'lump_sum')}
            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${
              formData.paymentType === 'lump_sum' ? 'bg-secondary text-white' : 'text-textMuted'
            }`}
          >
            Pago Único
          </button>
          <button
            onClick={() => handleChange('paymentType', 'installments_no_interest')}
            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${
              formData.paymentType === 'installments_no_interest' ? 'bg-primary text-black' : 'text-textMuted'
            }`}
          >
            MSI
          </button>
          <button
            onClick={() => handleChange('paymentType', 'installments_with_interest')}
            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${
              formData.paymentType === 'installments_with_interest' ? 'bg-accent text-white' : 'text-textMuted'
            }`}
          >
            Con Interés
          </button>
        </div>
      </div>

      {/* Amount */}
      <div className="relative mb-4">
        <span className="absolute left-4 top-4 text-textMuted">
          <DollarSign size={20} />
        </span>
        <input
          type="number"
          value={formData.originalAmount}
          onChange={(e) => handleChange('originalAmount', e.target.value)}
          placeholder="0.00"
          className="w-full bg-surfaceHighlight border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-2xl font-bold text-white focus:outline-none focus:border-primary placeholder-white/10"
        />
        <span className="absolute right-4 top-5 text-xs font-bold text-textMuted">Monto Total</span>
      </div>

      {/* Installment Fields */}
      {formData.paymentType !== 'lump_sum' && (
        <div className="space-y-4 mb-6 animate-in slide-in-from-top-2">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <span className="absolute left-4 top-3.5 text-textMuted">
                <Calendar size={18} />
              </span>
              <input
                type="number"
                value={formData.totalMonths}
                onChange={(e) => handleChange('totalMonths', e.target.value)}
                placeholder="12"
                className="w-full bg-surfaceHighlight border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-white focus:outline-none focus:border-primary"
              />
              <span className="absolute right-4 top-3.5 text-xs text-textMuted">Meses</span>
            </div>

            {formData.paymentType === 'installments_with_interest' && (
              <div className="flex-1 relative">
                <span className="absolute left-4 top-3.5 text-textMuted">
                  <DollarSign size={18} />
                </span>
                <input
                  type="number"
                  value={formData.monthlyPayment}
                  onChange={(e) => handleChange('monthlyPayment', e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-surfaceHighlight border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-white focus:outline-none focus:border-primary"
                />
                <span className="absolute right-4 top-3.5 text-xs text-textMuted">Mensual</span>
              </div>
            )}
          </div>

          {formData.paymentType === 'installments_with_interest' && (
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-textMuted">
                <Percent size={18} />
              </span>
              <input
                type="number"
                value={formData.apr}
                onChange={(e) => handleChange('apr', e.target.value)}
                placeholder="Sin APR? Ingresa el pago mensual arriba"
                className="w-full bg-surfaceHighlight border border-white/10 rounded-2xl py-3.5 pl-11 pr-10 text-white focus:outline-none focus:border-primary placeholder-white/20"
              />
              <button 
                onClick={() => setShowAPRHelp(!showAPRHelp)}
                className="absolute right-4 top-3.5 text-textMuted hover:text-white"
              >
                <HelpCircle size={18} />
              </button>
              <span className="absolute right-12 top-3.5 text-xs text-textMuted">% APR</span>
            </div>
          )}

          {showAPRHelp && (
            <div className="bg-secondary/20 border border-secondary/30 rounded-xl p-3 text-xs text-white">
              <p className="font-bold mb-1">¿No conoces el APR?</p>
              <p className="text-textMuted">
                Ingresa solo el monto total, meses y pago mensual. 
                Calcularemos el APR aproximado automáticamente.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Calculated Interest Display */}
      {calculatedInterest !== null && calculatedInterest > 0 && (
        <div className="bg-accent/10 border border-accent/30 rounded-2xl p-4 mb-6 animate-in fade-in">
          <div className="flex items-center gap-2 mb-2">
            <Calculator size={18} className="text-accent" />
            <span className="text-xs font-bold text-accent uppercase">Cálculo de Interés</span>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-textMuted text-xs">Pagarás en total de interés:</p>
              <p className="text-2xl font-bold text-white">${calculatedInterest.toLocaleString()}</p>
            </div>
            {calculatedAPR && (
              <div className="text-right">
                <p className="text-textMuted text-xs">APR estimado:</p>
                <p className="text-lg font-bold text-accent">{calculatedAPR}%</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cut-off and Due Dates */}
      <div className="mb-6">
        <label className="text-xs font-bold text-textMuted uppercase tracking-wider ml-1 mb-2 block">
          Fechas de Corte y Pago
        </label>
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <input
              type="number"
              min="1"
              max="31"
              value={formData.cutOffDay}
              onChange={(e) => handleChange('cutOffDay', e.target.value)}
              placeholder="15"
              className="w-full bg-surfaceHighlight border border-white/10 rounded-2xl py-3.5 px-4 text-white focus:outline-none focus:border-primary"
            />
            <span className="absolute right-4 top-3.5 text-xs text-textMuted">Día Corte</span>
          </div>
          <div className="flex-1 relative">
            <input
              type="number"
              min="1"
              max="31"
              value={formData.paymentDueDay}
              onChange={(e) => handleChange('paymentDueDay', e.target.value)}
              placeholder="5"
              className="w-full bg-surfaceHighlight border border-white/10 rounded-2xl py-3.5 px-4 text-white focus:outline-none focus:border-primary"
            />
            <span className="absolute right-4 top-3.5 text-xs text-textMuted">Día Pago</span>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!isValid || isSubmitting}
        className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all transform active:scale-95 ${
          isValid && !isSubmitting
            ? 'bg-white text-black hover:bg-gray-200'
            : 'bg-white/20 text-textMuted cursor-not-allowed'
        }`}
      >
        {isSubmitting ? 'Guardando...' : 'Agregar Deuda'}
      </button>
    </div>
  );
};
