import React, { useState } from 'react';
import { X, Check, Crown, CreditCard, ShieldCheck, Star } from 'lucide-react';
import { profileService } from '../services/profileService';

interface ProUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProUpgradeModal: React.FC<ProUpgradeModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<'plan' | 'payment' | 'success'>('plan');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvc: '' });

  const benefits = [
    "Unlimited AI Advisor chats",
    "Advanced 'What-If' Scenarios",
    "Smart Income Detection",
    "Custom Savings Goals",
    "Ad-free Experience"
  ];

  const handlePayment = async () => {
    if (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvc) return;

    setLoading(true);
    // Simulate payment processing, then upgrade subscription
    setTimeout(async () => {
        const success = await profileService.upgradeToPro();
        setLoading(false);
        if (success) {
          setStep('success');
          setTimeout(() => {
              onSuccess();
              onClose();
          }, 2000);
        }
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-[#0f0f11] border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 flex flex-col max-h-[90vh]">
        
        {/* Header Image / Gradient */}
        <div className="h-32 bg-gradient-to-br from-secondary via-purple-900 to-[#0f0f11] relative flex items-center justify-center">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
            <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center shadow-[0_0_30px_rgba(127,13,242,0.6)] border border-white/20">
                <Crown size={32} className="text-white" fill="currentColor" />
            </div>
            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/20 rounded-full hover:bg-black/40 text-white/70 hover:text-white transition-colors">
                <X size={20} />
            </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto no-scrollbar">
            {step === 'plan' && (
                <>
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-white mb-2">Unlock FinNavi Pro</h2>
                        <p className="text-sm text-textMuted">Supercharge your journey to financial freedom.</p>
                    </div>

                    <div className="space-y-3 mb-8">
                        {benefits.map((benefit, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center text-secondary shrink-0">
                                    <Check size={12} strokeWidth={3} />
                                </div>
                                <span className="text-sm text-gray-300">{benefit}</span>
                            </div>
                        ))}
                    </div>

                    <div className="bg-surfaceHighlight p-1 rounded-xl flex mb-6 relative">
                        <button 
                            onClick={() => setBillingCycle('monthly')}
                            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all z-10 ${billingCycle === 'monthly' ? 'text-white' : 'text-textMuted'}`}
                        >
                            Monthly
                        </button>
                        <button 
                            onClick={() => setBillingCycle('yearly')}
                            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all z-10 flex items-center justify-center gap-2 ${billingCycle === 'yearly' ? 'text-white' : 'text-textMuted'}`}
                        >
                            Yearly <span className="bg-primary text-black text-[9px] px-1.5 py-0.5 rounded uppercase">Save 20%</span>
                        </button>
                        
                        {/* Animated slider background */}
                        <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-surface border border-white/10 rounded-lg shadow-sm transition-all duration-300 ${billingCycle === 'monthly' ? 'left-1' : 'left-[calc(50%+4px)]'}`}></div>
                    </div>

                    <div className="text-center mb-6">
                        <span className="text-4xl font-extrabold text-white">
                            {billingCycle === 'monthly' ? '$9.99' : '$99.99'}
                        </span>
                        <span className="text-textMuted text-sm"> / {billingCycle === 'monthly' ? 'month' : 'year'}</span>
                    </div>

                    <button 
                        onClick={() => setStep('payment')}
                        className="w-full py-4 bg-secondary hover:bg-secondary/90 text-white font-bold rounded-2xl shadow-neon-purple transition-transform active:scale-95"
                    >
                        Start 14-Day Free Trial
                    </button>
                    <p className="text-[10px] text-center text-textMuted mt-3">Cancel anytime. No charge until trial ends.</p>
                </>
            )}

            {step === 'payment' && (
                <div className="animate-in slide-in-from-right-10">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <CreditCard size={20} className="text-secondary" /> Payment Details
                    </h3>
                    
                    <div className="space-y-4 mb-8">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-textMuted uppercase">Card Number</label>
                            <input 
                                type="text" 
                                placeholder="0000 0000 0000 0000"
                                className="w-full bg-surfaceHighlight border border-white/10 rounded-xl p-3 text-white focus:border-secondary focus:outline-none placeholder-white/20"
                                value={cardDetails.number}
                                onChange={e => setCardDetails({...cardDetails, number: e.target.value})}
                            />
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1 space-y-1">
                                <label className="text-xs font-bold text-textMuted uppercase">Expiry</label>
                                <input 
                                    type="text" 
                                    placeholder="MM/YY"
                                    className="w-full bg-surfaceHighlight border border-white/10 rounded-xl p-3 text-white focus:border-secondary focus:outline-none placeholder-white/20"
                                    value={cardDetails.expiry}
                                    onChange={e => setCardDetails({...cardDetails, expiry: e.target.value})}
                                />
                            </div>
                            <div className="flex-1 space-y-1">
                                <label className="text-xs font-bold text-textMuted uppercase">CVC</label>
                                <input 
                                    type="text" 
                                    placeholder="123"
                                    className="w-full bg-surfaceHighlight border border-white/10 rounded-xl p-3 text-white focus:border-secondary focus:outline-none placeholder-white/20"
                                    value={cardDetails.cvc}
                                    onChange={e => setCardDetails({...cardDetails, cvc: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-textMuted mb-6 bg-surfaceHighlight/50 p-3 rounded-lg">
                        <ShieldCheck size={16} className="text-green-500" />
                        <span>Secure encrypted transaction</span>
                    </div>

                    <div className="flex gap-3">
                        <button 
                            onClick={() => setStep('plan')}
                            className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-colors"
                        >
                            Back
                        </button>
                        <button 
                            onClick={handlePayment}
                            disabled={loading}
                            className="flex-[2] py-4 bg-white text-black font-bold rounded-2xl shadow-lg transition-transform active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                                    Processing...
                                </>
                            ) : (
                                `Pay ${billingCycle === 'monthly' ? '$9.99' : '$99.99'}`
                            )}
                        </button>
                    </div>
                </div>
            )}

            {step === 'success' && (
                <div className="flex flex-col items-center justify-center py-8 animate-in zoom-in-90">
                    <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-6 shadow-neon-purple animate-bounce">
                        <Star size={40} className="text-white" fill="currentColor" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Welcome to Pro!</h2>
                    <p className="text-textMuted text-center mb-8">You now have full access to all premium features.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};