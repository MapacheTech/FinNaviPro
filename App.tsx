import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { DebtCommandCenter } from './pages/DebtCommandCenter';
import { Advisor } from './pages/Advisor';
import { Social } from './pages/Social';
import { Profile } from './pages/Profile';
import { Login } from './pages/Login';
import { AddTransaction } from './pages/AddTransaction';
import { AddDebt } from './pages/AddDebt';
import { InterestCalculator } from './pages/InterestCalculator';
import { Transactions } from './pages/Transactions';
import { Budget } from './pages/Budget';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';

// Guard component to protect routes
const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/debt" element={<ProtectedRoute><DebtCommandCenter /></ProtectedRoute>} />
        <Route path="/social" element={<ProtectedRoute><Social /></ProtectedRoute>} />
        <Route path="/advisor" element={<ProtectedRoute><Advisor /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/add" element={<ProtectedRoute><AddTransaction /></ProtectedRoute>} />
        <Route path="/add-transaction" element={<ProtectedRoute><AddTransaction /></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
        <Route path="/add-debt" element={<ProtectedRoute><AddDebt /></ProtectedRoute>} />
        <Route path="/debts" element={<ProtectedRoute><DebtCommandCenter /></ProtectedRoute>} />
        <Route path="/calculator" element={<ProtectedRoute><InterestCalculator /></ProtectedRoute>} />
        <Route path="/budget" element={<ProtectedRoute><Budget /></ProtectedRoute>} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;