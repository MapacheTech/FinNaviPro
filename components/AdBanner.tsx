import React, { useState } from 'react';
import { X, Crown } from 'lucide-react';

interface AdBannerProps {
  placement?: 'dashboard' | 'transactions' | 'debts' | 'between-content';
  subscriptionStatus?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({
  placement = 'between-content',
  subscriptionStatus
}) => {
  const [dismissed, setDismissed] = useState(false);

  // Don't show ads for Pro users
  if (subscriptionStatus === 'pro' || dismissed) return null;

  // Placeholder ad - replace with real ad SDK (AdSense/AdMob) when ready
  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/5 my-4">
      {/* Ad Content - Placeholder promoting Pro upgrade */}
      <div className="bg-gradient-to-r from-surface via-surfaceHighlight to-surface p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center shrink-0">
              <Crown size={20} className="text-secondary" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                Disfruta FinNavi sin anuncios
              </p>
              <p className="text-[10px] text-textMuted">
                Actualiza a Pro y obtén AI ilimitada
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              window.location.hash = '#/profile';
            }}
            className="px-4 py-2 bg-secondary text-white text-xs font-bold rounded-xl shrink-0 hover:bg-secondary/90 transition-colors"
          >
            Pro
          </button>
        </div>
      </div>

      {/* Dismiss button */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center"
      >
        <X size={10} className="text-textMuted" />
      </button>

      {/* Ad label */}
      <div className="absolute top-2 left-2">
        <span className="text-[8px] text-textMuted/50 uppercase tracking-widest">AD</span>
      </div>
    </div>
  );
};
