import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calculator, DollarSign, Percent, Calendar, ChevronDown, ChevronUp, TrendingUp, Wallet } from 'lucide-react';

interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export const InterestCalculator: React.FC = () => {
  const navigate = useNavigate();
  
  const [calcMode, setCalcMode] = useState<'apr_known' | 'apr_unknown'>('apr_known');
  const [principal, setPrincipal] = useState('');
  const [apr, setApr] = useState('');
  const [months, setMonths] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);

  const calculations = useMemo(() => {
    const P = parseFloat(principal) || 0;
    const n = parseInt(months) || 0;
    const r = (parseFloat(apr) || 0) / 100 / 12; // Monthly rate
    const M = parseFloat(monthlyPayment) || 0;

    if (P <= 0 || n <= 0) return null;

    let calculatedMonthlyPayment: number;
    let calculatedAPR: number | null = null;
    let totalPaid: number;
    let totalInterest: number;
    let schedule: AmortizationRow[] = [];

    if (calcMode === 'apr_known') {
      if (r <= 0) {
        // No interest loan
        calculatedMonthlyPayment = P / n;
        totalPaid = P;
        totalInterest = 0;
        
        // Simple schedule for no interest
        let balance = P;
        for (let i = 1; i <= n; i++) {
          const payment = calculatedMonthlyPayment;
          balance = Math.max(0, balance - payment);
          schedule.push({
            month: i,
            payment: payment,
            principal: payment,
            interest: 0,
            balance: Math.round(balance * 100) / 100,
          });
        }
      } else {
        // Standard amortization formula
        calculatedMonthlyPayment = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        totalPaid = calculatedMonthlyPayment * n;
        totalInterest = totalPaid - P;

        // Build amortization schedule
        let balance = P;
        for (let i = 1; i <= n; i++) {
          const interestPayment = balance * r;
          const principalPayment = calculatedMonthlyPayment - interestPayment;
          balance = Math.max(0, balance - principalPayment);
          schedule.push({
            month: i,
            payment: calculatedMonthlyPayment,
            principal: principalPayment,
            interest: interestPayment,
            balance: Math.round(balance * 100) / 100,
          });
        }
      }
    } else {
      // APR unknown - calculate from monthly payment
      if (M <= 0 || M <= P / n) return null;

      totalPaid = M * n;
      totalInterest = totalPaid - P;
      calculatedMonthlyPayment = M;

      // Rough APR estimation using Newton-Raphson approximation
      const simpleMonthlyRate = (totalInterest / P) / n;
      calculatedAPR = Math.round(simpleMonthlyRate * 12 * 100 * 100) / 100;

      // Simplified schedule (without exact interest breakdown for estimated APR)
      let balance = P;
      const estMonthlyRate = simpleMonthlyRate;
      for (let i = 1; i <= n; i++) {
        const interestPayment = balance * estMonthlyRate;
        const principalPayment = M - interestPayment;
        balance = Math.max(0, balance - principalPayment);
        schedule.push({
          month: i,
          payment: M,
          principal: Math.max(0, principalPayment),
          interest: Math.max(0, interestPayment),
          balance: Math.round(balance * 100) / 100,
        });
      }
    }

    return {
      monthlyPayment: Math.round(calculatedMonthlyPayment * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      calculatedAPR,
      schedule,
    };
  }, [principal, apr, months, monthlyPayment, calcMode]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="min-h-full pb-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 pt-2">
        <button onClick={() => navigate(-1)} className="p-2 bg-surfaceHighlight rounded-full text-textMuted hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Calculator size={22} className="text-primary" />
            Calculadora de Interés
          </h1>
          <p className="text-xs text-textMuted">Calcula pagos y amortización</p>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="bg-surfaceHighlight p-1.5 rounded-2xl flex mb-6">
        <button
          onClick={() => setCalcMode('apr_known')}
          className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${
            calcMode === 'apr_known' ? 'bg-primary text-black' : 'text-textMuted'
          }`}
        >
          Conozco el APR
        </button>
        <button
          onClick={() => setCalcMode('apr_unknown')}
          className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${
            calcMode === 'apr_unknown' ? 'bg-secondary text-white' : 'text-textMuted'
          }`}
        >
          Conozco el Pago Mensual
        </button>
      </div>

      {/* Input Form */}
      <div className="space-y-4 mb-6">
        {/* Principal */}
        <div className="relative">
          <span className="absolute left-4 top-4 text-textMuted">
            <DollarSign size={20} />
          </span>
          <input
            type="number"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            placeholder="0.00"
            className="w-full bg-surfaceHighlight border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-2xl font-bold text-white focus:outline-none focus:border-primary placeholder-white/10"
          />
          <span className="absolute right-4 top-5 text-xs font-bold text-textMuted">Monto Original</span>
        </div>

        <div className="flex gap-4">
          {/* APR or Monthly Payment */}
          {calcMode === 'apr_known' ? (
            <div className="flex-1 relative">
              <span className="absolute left-4 top-3.5 text-textMuted">
                <Percent size={18} />
              </span>
              <input
                type="number"
                value={apr}
                onChange={(e) => setApr(e.target.value)}
                placeholder="0"
                className="w-full bg-surfaceHighlight border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-white focus:outline-none focus:border-primary"
              />
              <span className="absolute right-4 top-3.5 text-xs text-textMuted">% APR</span>
            </div>
          ) : (
            <div className="flex-1 relative">
              <span className="absolute left-4 top-3.5 text-textMuted">
                <DollarSign size={18} />
              </span>
              <input
                type="number"
                value={monthlyPayment}
                onChange={(e) => setMonthlyPayment(e.target.value)}
                placeholder="0.00"
                className="w-full bg-surfaceHighlight border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-white focus:outline-none focus:border-primary"
              />
              <span className="absolute right-4 top-3.5 text-xs text-textMuted">Mensual</span>
            </div>
          )}

          {/* Months */}
          <div className="flex-1 relative">
            <span className="absolute left-4 top-3.5 text-textMuted">
              <Calendar size={18} />
            </span>
            <input
              type="number"
              value={months}
              onChange={(e) => setMonths(e.target.value)}
              placeholder="12"
              className="w-full bg-surfaceHighlight border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-white focus:outline-none focus:border-primary"
            />
            <span className="absolute right-4 top-3.5 text-xs text-textMuted">Meses</span>
          </div>
        </div>
      </div>

      {/* Results */}
      {calculations && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface/60 rounded-2xl p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Wallet size={16} className="text-primary" />
                <span className="text-xs text-textMuted">Pago Mensual</span>
              </div>
              <p className="text-2xl font-bold text-white">
                ${formatCurrency(calculations.monthlyPayment)}
              </p>
            </div>

            <div className="bg-surface/60 rounded-2xl p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-accent" />
                <span className="text-xs text-textMuted">Total Interés</span>
              </div>
              <p className="text-2xl font-bold text-accent">
                ${formatCurrency(calculations.totalInterest)}
              </p>
            </div>
          </div>

          {/* Total Card */}
          <div className="bg-gradient-to-br from-surfaceHighlight to-black rounded-2xl p-5 border border-white/5">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-textMuted mb-1">Pagarás en Total</p>
                <p className="text-3xl font-bold text-white">${formatCurrency(calculations.totalPaid)}</p>
              </div>
              {calculations.calculatedAPR && (
                <div className="text-right">
                  <p className="text-xs text-textMuted mb-1">APR Estimado</p>
                  <p className="text-xl font-bold text-secondary">{calculations.calculatedAPR}%</p>
                </div>
              )}
            </div>
            
            {/* Interest percentage indicator */}
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-textMuted">Capital</span>
                <span className="text-textMuted">Interés</span>
              </div>
              <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-primary"
                  style={{ width: `${(parseFloat(principal) / calculations.totalPaid) * 100}%` }}
                />
                <div 
                  className="h-full bg-accent"
                  style={{ width: `${(calculations.totalInterest / calculations.totalPaid) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-primary font-bold">
                  {Math.round((parseFloat(principal) / calculations.totalPaid) * 100)}%
                </span>
                <span className="text-accent font-bold">
                  {Math.round((calculations.totalInterest / calculations.totalPaid) * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Amortization Schedule Toggle */}
          <button
            onClick={() => setShowSchedule(!showSchedule)}
            className="w-full flex items-center justify-between p-4 bg-surfaceHighlight rounded-2xl border border-white/5 hover:bg-surfaceHighlight/80 transition-colors"
          >
            <span className="text-sm font-bold text-white">Tabla de Amortización</span>
            {showSchedule ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          {/* Amortization Table */}
          {showSchedule && (
            <div className="bg-surface/40 rounded-2xl border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-surfaceHighlight/50">
                      <th className="py-3 px-3 text-left text-textMuted font-bold">Mes</th>
                      <th className="py-3 px-3 text-right text-textMuted font-bold">Pago</th>
                      <th className="py-3 px-3 text-right text-textMuted font-bold">Capital</th>
                      <th className="py-3 px-3 text-right text-textMuted font-bold">Interés</th>
                      <th className="py-3 px-3 text-right text-textMuted font-bold">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculations.schedule.slice(0, showSchedule ? 50 : 6).map((row, i) => (
                      <tr key={row.month} className={i % 2 === 0 ? 'bg-black/20' : ''}>
                        <td className="py-2 px-3 text-white font-bold">{row.month}</td>
                        <td className="py-2 px-3 text-right text-white">${formatCurrency(row.payment)}</td>
                        <td className="py-2 px-3 text-right text-primary">${formatCurrency(row.principal)}</td>
                        <td className="py-2 px-3 text-right text-accent">${formatCurrency(row.interest)}</td>
                        <td className="py-2 px-3 text-right text-textMuted">${formatCurrency(row.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {calculations.schedule.length > 50 && (
                <p className="text-center text-xs text-textMuted py-3 border-t border-white/5">
                  Mostrando primeros 50 de {calculations.schedule.length} meses
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
