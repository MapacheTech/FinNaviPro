import React, { useEffect, useState } from 'react';
import { Badge } from '../types';
import { Trophy, Star, X } from 'lucide-react';

interface RewardOverlayProps {
  pointsEarned: number;
  newBadge?: Badge;
  onClose: () => void;
}

export const RewardOverlay: React.FC<RewardOverlayProps> = ({ pointsEarned, newBadge, onClose }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
    // Auto close after 3 seconds if no badge, longer if badge
    const timer = setTimeout(() => {
        onClose();
    }, newBadge ? 4000 : 2500);
    return () => clearTimeout(timer);
  }, [onClose, newBadge]);

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md transition-opacity duration-500 ${show ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex flex-col items-center animate-in zoom-in-50 duration-500">
            
            {/* Points Animation */}
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary rounded-full blur-[60px] opacity-40 animate-pulse-slow"></div>
                <div className="relative text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-br from-white to-primary drop-shadow-[0_0_15px_rgba(19,236,19,0.8)] flex items-center gap-2 transform skew-x-[-10deg]">
                    <span>+{pointsEarned}</span>
                    <span className="text-4xl text-white">XP</span>
                </div>
            </div>

            <p className="text-xl font-bold text-white mb-8 animate-bounce">Payment Confirmed!</p>

            {/* Badge Reveal */}
            {newBadge && (
                <div className="bg-surfaceHighlight border border-primary/30 p-6 rounded-3xl flex flex-col items-center shadow-neon-purple animate-in slide-in-from-bottom-20 delay-300 duration-700">
                    <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-2">New Badge Unlocked</p>
                    <div className="text-6xl mb-4 animate-spin-slow-once">{newBadge.icon}</div>
                    <h3 className="text-2xl font-bold text-white">{newBadge.name}</h3>
                    <p className="text-sm text-textMuted mt-1">{newBadge.description}</p>
                </div>
            )}
            
            {/* Click to close hint */}
            <button onClick={onClose} className="mt-12 text-textMuted text-sm hover:text-white transition-colors">
                Tap to continue
            </button>
        </div>
    </div>
  );
};