import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Home, PieChart, MessageCircle, User, Plus, Trophy } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const BottomNav = () => {
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
           <Link to="/add" className="flex items-center justify-center w-14 h-14 bg-primary rounded-full shadow-neon-green text-black transition-transform active:scale-95">
             <Plus size={28} strokeWidth={3} />
           </Link>
        </div>

        <NavItem to="/social" icon={Trophy} label="Social" active={location.pathname === '/social'} />
        <NavItem to="/profile" icon={User} label="Profile" active={location.pathname === '/profile'} />
      </div>
    </nav>
  );
};

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen w-full bg-background font-sans text-text flex justify-center overflow-hidden">
      {/* Mobile Frame Constraint */}
      <div className="w-full max-w-md h-full min-h-screen relative flex flex-col">
        {/* Safe Area Top */}
        <div className="w-full h-2 sticky top-0 bg-background/0 z-40" />
        
        <main className="flex-1 overflow-y-auto no-scrollbar pb-24 px-5 pt-4">
          {children}
        </main>

        <BottomNav />
      </div>
    </div>
  );
};