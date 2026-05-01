// ============================================================
// SPET — App Router
// ============================================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ROLE_HIERARCHY } from '@/utils/constants';
import { GlobalTimetableStoreProvider } from '@/contexts/GlobalTimetableStore';
import MainLayout from '@/components/layout/MainLayout';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

// ── Auth ────────────────────────────────────────────────────
import Login          from '@/pages/auth/Login';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ResetPassword  from '@/pages/auth/ResetPassword';

// ── Admin ───────────────────────────────────────────────────
import AdminDashboard       from '@/pages/admin/Dashboard';
import AdminUsers           from '@/pages/admin/Users';
import AdminRooms           from '@/pages/admin/Rooms';
import AdminArchive         from '@/pages/admin/Archive';
import AdminFilieres        from '@/pages/admin/Filieres';
import MaquettePedagogique  from '@/pages/admin/MaquettePedagogique';

// ── Chef de Département ─────────────────────────────────────
import ChefDashboard   from '@/pages/chef/Dashboard';
import ChefCourses     from '@/pages/chef/CourseAssignment';
import ChefTimetables  from '@/pages/chef/Timetables';
import ChefValidation  from '@/pages/chef/Validation';
import ChefExport      from '@/pages/chef/Export';

// ── Responsable de Filière ──────────────────────────────────
import ResponsableDashboard    from '@/pages/responsable/Dashboard';
import EmploiDuTemps           from '@/pages/responsable/EmploiDuTemps';
import ValiderProfils          from '@/pages/responsable/ValiderProfils';

// ── Enseignant ──────────────────────────────────────────────
import EnseignantDashboard from '@/pages/enseignant/Dashboard';
import EnseignantProfile   from '@/pages/enseignant/Profile';
import EnseignantCourses   from '@/pages/enseignant/Courses';
import EnseignantSessions  from '@/pages/enseignant/Sessions';
import Availability        from '@/pages/enseignant/Availability';
import MyTimetable         from '@/pages/enseignant/MyTimetable';

// ── Shared ──────────────────────────────────────────────────
import Notifications from '@/pages/shared/Notifications';
import Settings      from '@/pages/shared/Settings';

// ── Role redirect ────────────────────────────────────────────
function RoleHome() {
  const { user } = useAuth();
  const homes = {
    ADMIN:      '/admin',
    CHEF_DEPT:  '/chef',
    RESP_FIL:   '/responsable',
    ENSEIGNANT: '/enseignant',
  };
  return <Navigate to={homes[user?.role] || '/login'} replace />;
}

// ── Profile redirect (role-aware) ────────────────────────────
function ProfileRedirect() {
  const { user } = useAuth();
  if (user?.role === 'ENSEIGNANT' || user?.role === 'RESP_FIL' || user?.role === 'CHEF_DEPT') {
    return <Navigate to="/enseignant/profile" replace />;
  }
  return <Navigate to="/settings" replace />;
}

// ── Role guard (hiérarchie) ──────────────────────────────────
function RoleGuard({ roles, children }) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const inherited = ROLE_HIERARCHY[user?.role] || [user?.role];
  if (!roles.some(r => inherited.includes(r))) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <GlobalTimetableStoreProvider>
      <NotificationProvider>
        <AuthProvider>
          <Routes>
            {/* ── Public ── */}
            <Route path="/login"           element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password"  element={<ResetPassword />} />

            {/* ── Protected ── */}
            <Route element={<MainLayout />}>
              <Route index element={<RoleHome />} />

              {/* ── Admin ── */}
              <Route path="admin" element={
                <RoleGuard roles={['ADMIN']}><AdminDashboard /></RoleGuard>
              } />
              <Route path="admin/users" element={
                <RoleGuard roles={['ADMIN']}><AdminUsers /></RoleGuard>
              } />
              <Route path="admin/rooms" element={
                <RoleGuard roles={['ADMIN']}><AdminRooms /></RoleGuard>
              } />
              <Route path="admin/filieres" element={
                <RoleGuard roles={['ADMIN']}><AdminFilieres /></RoleGuard>
              } />
              <Route path="admin/maquette" element={
                <RoleGuard roles={['ADMIN']}><MaquettePedagogique /></RoleGuard>
              } />
              <Route path="admin/archive" element={
                <RoleGuard roles={['ADMIN']}><AdminArchive /></RoleGuard>
              } />

              {/* ── Chef de Département ── */}
              <Route path="chef" element={
                <RoleGuard roles={['CHEF_DEPT','ADMIN']}><ChefDashboard /></RoleGuard>
              } />
              <Route path="chef/validation" element={
                <RoleGuard roles={['CHEF_DEPT','ADMIN']}><ChefValidation /></RoleGuard>
              } />
              <Route path="chef/timetables" element={
                <RoleGuard roles={['CHEF_DEPT','ADMIN']}><ChefTimetables /></RoleGuard>
              } />
              <Route path="chef/courses" element={
                <RoleGuard roles={['CHEF_DEPT','ADMIN']}><ChefCourses /></RoleGuard>
              } />
              <Route path="chef/exports" element={
                <RoleGuard roles={['CHEF_DEPT','ADMIN']}><ChefExport /></RoleGuard>
              } />
              {/* Legacy redirects */}
              <Route path="chef/teachers" element={<Navigate to="/chef/timetables" replace />} />
              <Route path="chef/stats"    element={<Navigate to="/chef/validation"  replace />} />

              {/* ── Responsable de Filière ── */}
              <Route path="responsable" element={
                <RoleGuard roles={['RESP_FIL','ADMIN']}><ResponsableDashboard /></RoleGuard>
              } />
              <Route path="responsable/edts" element={
                <RoleGuard roles={['RESP_FIL','ADMIN']}><EmploiDuTemps /></RoleGuard>
              } />
              <Route path="responsable/generate" element={<Navigate to="/responsable/edts" replace />} />
              <Route path="responsable/profils" element={
                <RoleGuard roles={['RESP_FIL','ADMIN']}><ValiderProfils /></RoleGuard>
              } />

              {/* ── Enseignant ── */}
              <Route path="enseignant" element={
                <RoleGuard roles={['ENSEIGNANT','ADMIN']}><EnseignantDashboard /></RoleGuard>
              } />
              <Route path="enseignant/profile" element={
                <RoleGuard roles={['ENSEIGNANT','ADMIN']}><EnseignantProfile /></RoleGuard>
              } />
              <Route path="enseignant/avail" element={
                <RoleGuard roles={['ENSEIGNANT','ADMIN']}><Availability /></RoleGuard>
              } />
              <Route path="enseignant/timetable" element={
                <RoleGuard roles={['ENSEIGNANT','ADMIN']}><MyTimetable /></RoleGuard>
              } />
              <Route path="enseignant/courses" element={
                <RoleGuard roles={['ENSEIGNANT','ADMIN']}><EnseignantCourses /></RoleGuard>
              } />
              <Route path="enseignant/sessions" element={
                <RoleGuard roles={['ENSEIGNANT','ADMIN']}><EnseignantSessions /></RoleGuard>
              } />

              {/* ── Shared ── */}
              <Route path="notifications" element={<Notifications />} />
              <Route path="settings"      element={<Settings />} />
              <Route path="profile"       element={<ProfileRedirect />} />

              {/* ── 404 ── */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>

          </Routes>
        </AuthProvider>
      </NotificationProvider>
      </GlobalTimetableStoreProvider>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
