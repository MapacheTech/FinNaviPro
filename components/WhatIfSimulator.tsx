import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Debt } from '../types';

interface WhatIfProps {
  debts: Debt[];
  freeSpendingPower: number;
}

export const WhatIfSimulator: React.FC<WhatIfProps> = ({ debts, freeSpendingPower }) => {
  const [extraPayment, setExtraPayment] = useState(0);

  // Simplified projection logic for demo purposes
  const data = useMemo(() => {
    const totalBalance = debts.reduce((acc, d) => acc + d.balance, 0);
    const totalMinPayment = debts.reduce((acc, d) => acc + d.minPayment, 0);
    const effectivePayment = totalMinPayment + extraPayment;
    const averageApr = debts.reduce((acc, d) => acc + d.apr, 0) / debts.length / 100 / 12;

    let balance = totalBalance;
    const projection = [];
    let month = 0;

    // Simulate 24 months or until paid
    while (month <= 24 && balance > 0) {
      projection.push({
        month: `M${month}`,
        balance: Math.max(0, Math.round(balance)),
      });
      const interest = balance * averageApr;
      balance = balance + interest - effectivePayment;
      month++;
    }
    // Add final zero point if cleared
    if (balance <= 0) projection.push({ month: `M${month}`, balance: 0 });

    return projection;
  }, [debts, extraPayment]);

  const savedInterest = useMemo(() => {
    return Math.floor(extraPayment * 12 * 0.15); // Rough heuristic for visual feedback
  }, [extraPayment]);

  const timeSaved = useMemo(() => {
      return extraPayment > 50 ? "4 mo" : extraPayment > 100 ? "8 mo" : "0 mo";
  }, [extraPayment]);

  return (
    <div className="w-full mt-6 bg-surfaceHighlight/30 rounded-3xl p-5 border border-white/5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white">What If Simulator</h3>
        <span className="text-xs font-semibold text-secondary bg-secondary/10 px-2 py-1 rounded-full border border-secondary/20">
          Try it out
        </span>
      </div>

      <div className="h-40 w-full mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#13ec13" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#13ec13" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#333', borderRadius: '12px' }}
                itemStyle={{ color: '#13ec13' }}
            />
            <Area 
                type="monotone" 
                dataKey="balance" 
                stroke="#13ec13" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorBalance)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-textMuted">Simulate Extra Payment</span>
            <span className="font-bold text-primary">+${extraPayment}</span>
          </div>
          <input
            type="range"
            min="0"
            max={freeSpendingPower}
            step="10"
            value={extraPayment}
            onChange={(e) => setExtraPayment(Number(e.target.value))}
            className="w-full h-2 bg-surfaceHighlight rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-xs text-textMuted mt-1">
            <span>$0</span>
            <span>Max Safe: ${freeSpendingPower}</span>
          </div>
        </div>

        {extraPayment > 0 && (
           <div className="flex gap-3 animate-pulse-glow">
              <div className="flex-1 bg-surface p-3 rounded-2xl border border-white/5">
                <p className="text-[10px] text-textMuted uppercase tracking-wider font-bold">Time Saved</p>
                <p className="text-xl font-bold text-white">{timeSaved}</p>
              </div>
              <div className="flex-1 bg-surface p-3 rounded-2xl border border-white/5">
                <p className="text-[10px] text-textMuted uppercase tracking-wider font-bold">Interest Saved</p>
                <p className="text-xl font-bold text-primary">${savedInterest}</p>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};