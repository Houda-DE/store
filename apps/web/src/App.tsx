import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { DevLoginSwitcher } from './components/DevLoginSwitcher';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { BrowsePage } from './pages/BrowsePage';
import { ItemDetailPage } from './pages/ItemDetailPage';
import { SellPage } from './pages/SellPage';
import { EditItemPage } from './pages/EditItemPage';
import { ProfilePage } from './pages/ProfilePage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-loading">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireSeller({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== 'seller') return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { loading } = useAuth();
  if (loading) return <div className="app-loading">Loading…</div>;

  return (
    <>
      <Navbar />
      {import.meta.env.DEV && <DevLoginSwitcher />}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<RequireAuth><BrowsePage /></RequireAuth>} />
        <Route path="/items/:id" element={<ItemDetailPage />} />
        <Route path="/items/:id/edit" element={<RequireAuth><RequireSeller><EditItemPage /></RequireSeller></RequireAuth>} />
        <Route path="/sell" element={<RequireAuth><RequireSeller><SellPage /></RequireSeller></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
