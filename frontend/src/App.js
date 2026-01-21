import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import BudgetPage from "./pages/BudgetPage";
import ExpensesPage from "./pages/ExpensesPage";
import IncomesPage from "./pages/IncomesPage";
import LoansPage from "./pages/LoansPage";
import SavingsPage from "./pages/SavingsPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import PaymentCancelPage from "./pages/PaymentCancelPage";
import "./App.css";

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Public Route wrapper (redirect to dashboard if logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      
      {/* Payment routes */}
      <Route path="/payment/success" element={<PaymentSuccessPage />} />
      <Route path="/payment/cancel" element={<PaymentCancelPage />} />
      
      {/* Protected dashboard routes */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="budget" element={<BudgetPage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="incomes" element={<IncomesPage />} />
        <Route path="loans" element={<LoansPage />} />
        <Route path="savings" element={<SavingsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      
      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <AppRoutes />
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;
