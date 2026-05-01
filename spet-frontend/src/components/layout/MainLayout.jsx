// ============================================================
// SPET — Main Layout (wraps all authenticated pages)
// ============================================================

import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar  from './Topbar';
import ToastContainer from '@/components/ui/ToastContainer';
import { useAuth } from '@/contexts/AuthContext';

export default function MainLayout() {
  const { isAuthenticated, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* Main */}
      <main className="main-content">
        <Topbar onMenuClick={() => setMobileOpen(o => !o)} />
        <ToastContainer />

        <div className="page-content">
          <Outlet />
        </div>

        <footer className="app-footer">
          SPET © 2025-2026 · UFR Sciences et Technologies · Université Iba Der Thiam de Thiès
        </footer>
      </main>

    </div>
  );
}
