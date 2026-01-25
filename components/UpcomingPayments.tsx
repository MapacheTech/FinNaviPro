import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ChevronRight, AlertCircle, Clock } from 'lucide-react';
import { Debt } from '../types';
import { getUpcomingPayments, formatPaymentDate } from '../services/notificationService';

interface UpcomingPaymentsProps {
  debts: Debt[];
  maxItems?: number;
}

export const UpcomingPayments: React.FC<UpcomingPaymentsProps> = ({ debts, maxItems = 3 }) => {
  const upcomingPayments = getUpcomingPayments(debts).slice(0, maxItems);

  if (upcomingPayments.length === 0) {
    return null;
  }

  const getUrgencyStyle = (daysUntil: number) => {
    if (daysUntil === 0) return 'bg-red-500/20 border-red-500/30 text-red-400';
    if (daysUntil <= 3) return 'bg-amber-500/20 border-amber-500/30 text-amber-400';
    return 'bg-primary/10 border-primary/20 text-primary';
  };

  const getUrgencyIcon = (daysUntil: number) => {
    if (daysUntil === 0) return <AlertCircle size={14} className="text-red-400" />;
    if (daysUntil <= 3) return <Clock size={14} className="text-amber-400" />;
    return <Calendar size={14} className="text-primary" />;
  };

  const getUrgencyLabel = (daysUntil: number) => {
    if (daysUntil === 0) return '¡HOY!';
    if (daysUntil === 1) return 'Mañana';
    return `${daysUntil} días`;
  };

  return (
    <div className="bg-surface/60 rounded-3xl p-5 border border-white/5 mb-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-primary" />
          <h3 className="font-bold text-white">Próximos Pagos</h3>
        </div>
        <Link 
          to="/debts" 
          className="text-xs text-textMuted hover:text-white flex items-center gap-1 transition-colors"
        >
          Ver todo <ChevronRight size={14} />
        </Link>
      </div>

      <div className="space-y-3">
        {upcomingPayments.map((payment) => (
          <div 
            key={payment.id}
            className="flex items-center justify-between p-3 rounded-2xl bg-surfaceHighlight/50 border border-white/5"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getUrgencyStyle(payment.daysUntil)}`}>
                {getUrgencyIcon(payment.daysUntil)}
              </div>
              <div>
                <p className="font-bold text-white text-sm">{payment.name}</p>
                <p className="text-xs text-textMuted">
                  {formatPaymentDate(payment.nextPaymentDate)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-white">
                ${(payment.monthlyPayment || payment.minPayment || 0).toLocaleString()}
              </p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getUrgencyStyle(payment.daysUntil)}`}>
                {getUrgencyLabel(payment.daysUntil)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {upcomingPayments.some(p => p.daysUntil <= 3) && (
        <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2">
          <AlertCircle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-200">
            Tienes pagos próximos. ¡No olvides pagar a tiempo para mantener tu historial!
          </p>
        </div>
      )}
    </div>
  );
};
