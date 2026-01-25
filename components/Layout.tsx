import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Home, PieChart, MessageCircle, User, Plus, X, CreditCard, ArrowDownCircle, ArrowUpCircle, Calculator, Users } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

// Quick Action Menu Component
const QuickAddMenu: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleAction = (path: string, type?: string) => {
    onClose();
    if (type) {
      navigate(path, { state: { defaultType: type } });
    } else {
      navigate(path);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Menu */}
      <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[70] flex flex-col items-center gap-3 animate-in slide-in-from-bottom-4 duration-300">
        {/* Options */}
        <div className="flex gap-4">
          <button
            onClick={() => handleAction('/add', 'expense')}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 bg-red-500/90 rounded-2xl flex items-center justify-center shadow-lg group-active:scale-95 transition-transform">
              <ArrowDownCircle size={28} className="text-white" />
            </div>
            <span className="text-xs font-bold text-white">Gasto</span>
          </button>

          <button
            onClick={() => handleAction('/add', 'income')}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg group-active:scale-95 transition-transform">
              <ArrowUpCircle size={28} className="text-black" />
            </div>
            <span className="text-xs font-bold text-white">Ingreso</span>
          </button>

          <button
            onClick={() => handleAction('/add-debt')}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 bg-secondary rounded-2xl flex items-center justify-center shadow-lg group-active:scale-95 transition-transform">
              <CreditCard size={28} className="text-white" />
            </div>
            <span className="text-xs font-bold text-white">Deuda</span>
          </button>

          <button
            onClick={() => handleAction('/calculator')}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg group-active:scale-95 transition-transform">
              <Calculator size={28} className="text-white" />
            </div>
            <span className="text-xs font-bold text-white">Calc</span>
          </button>

          <button
            onClick={() => handleAction('/advisor')}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 bg-purple-500 rounded-2xl flex items-center justify-center shadow-lg group-active:scale-95 transition-transform">
              <MessageCircle size={28} className="text-white" />
            </div>
            <span className="text-xs font-bold text-white">AI</span>
          </button>
        </div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 active:scale-95 transition-transform"
        >
          <X size={24} className="text-white" />
        </button>
      </div>
    </>
  );
};

const BottomNav: React.FC<{ onAddClick: () => void }> = ({ onAddClick }) => {
  const location = useLocation();
  
  // Hide bottom nav on login page
  if (location.pathname === '/login') return null;

  const NavItem = ({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active: boolean }) => (
    <Link to={to} className={`flex flex-col items-center justify-center w-full h-full transition-colors ${active ? 'text-primary' : 'text-textMuted hover:text-white'}`}>
      <Icon size={22} strokeWidth={active ? 2.5 : 2} />
      <span className="text-[10px] mt-1 font-medium">{label}</span>
    </Link>
  );

  return (
    <nav className="fixed bottom-0 left-0 w-full h-[88px] glass-panel border-t border-white/5 pb-6 z-50">
      <div className="flex justify-between items-center h-full px-4">
        <NavItem to="/" icon={Home} label="Home" active={location.pathname === '/'} />
        <NavItem to="/debt" icon={PieChart} label="Debts" active={location.pathname === '/debt'} />
        
        <div className="relative -top-6 px-2">
           <button 
             onClick={onAddClick}
             className="flex items-center justify-center w-14 h-14 bg-primary rounded-full shadow-neon-green text-black transition-transform active:scale-95"
           >
             <Plus size={28} strokeWidth={3} />
           </button>
        </div>

        <NavItem to="/social" icon={Users} label="Social" active={location.pathname === '/social'} />
        <NavItem to="/profile" icon={User} label="Profile" active={location.pathname === '/profile'} />
      </div>
    </nav>
  );
};

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  return (
    <div className="min-h-screen w-full bg-background font-sans text-text flex justify-center overflow-hidden">
      {/* Mobile Frame Constraint - adjusted for Safe Area */}
      <div className="w-full max-w-md h-full min-h-screen relative flex flex-col">
        {/* Real Safe Area Spacer */}
        <div className="w-full safe-area-top bg-background z-40" />
        
        <main className="flex-1 overflow-y-auto no-scrollbar pb-24 px-5 pt-2">
          {children}
        </main>

        <BottomNav onAddClick={() => setIsQuickAddOpen(true)} />
        <QuickAddMenu isOpen={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)} />
      </div>
    </div>
  );
};
