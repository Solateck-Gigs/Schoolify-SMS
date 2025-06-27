import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout/Layout';
import AuthPage from './pages/Auth/AuthPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import MyChildrenPage from './pages/MyChildrenPage';
import CreateUsersPage from './pages/CreateUsersPage';
import FeesPage from './pages/Fee/FeesPage';
import TimetablePage from './pages/Timetable/TimetablePage';
import MessagesPage from './pages/Message/MessagesPage';
import MarksPage from './pages/Marks/MarksPage';
import ResultsPage from './pages/Marks/ResultsPage';
import AttendancePage from './pages/Attendance/AttendancePage';
import { useAuthStore } from './lib/store';
import AnnouncementsPage from './pages/AnnouncementsPage';
import SuggestionsPage from './pages/Suggestions/SuggestionsPage';
import AdminSuggestionsPage from './pages/Suggestions/AdminSuggestionsPage';
import ProfileSettings from './pages/Settings/ProfileSettings';
import TeachersPage from './pages/Teachers/TeachersPage';
import ParentsPage from './pages/Parents/ParentsPage';
import ClassesPage from './pages/Classes/ClassesPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfileCompletionPage from './pages/ProfileCompletionPage';

// Configure React Router future flags
const router = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token && !isLoading) {
      navigate('/login', { state: { from: location }, replace: true });
    }
  }, [user, isLoading, navigate, location]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }
  
  if (!user) {
    return null; // Let the useEffect handle the redirect
  }
  
  return children;
}

function RoleRoute({ children, allowedRoles }: { children: JSX.Element, allowedRoles: string[] }) {
  const { user, isLoading } = useAuthStore();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }
  
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}

function ProfileRoute({ children }: { children: React.ReactNode }) {
  const { user, isProfileComplete, isLoading } = useAuthStore();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (isProfileComplete) {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
}

function App() {
  const { checkAuth, isLoading } = useAuthStore();
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      checkAuth();
    }
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }
  
  return (
    <Router future={router.future}>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/complete-profile"
          element={
            <PrivateRoute>
              <ProfileCompletionPage />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" />} />
        
        <Route element={<Layout />}>
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />
          
          {/* Students Management - Admin, Teacher, Super Admin */}
          <Route
            path="/students"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['admin', 'teacher', 'super_admin']}>
                  <StudentsPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          
          {/* My Children - Parents Only */}
          <Route
            path="/my-children"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['parent']}>
                  <MyChildrenPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          
          {/* Teachers Management - Admin, Super Admin */}
          <Route
            path="/teachers"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['super_admin', 'admin']}>
                  <TeachersPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          
          {/* Parents Management - Admin, Super Admin */}
          <Route
            path="/parents"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['super_admin', 'admin']}>
                  <ParentsPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          
          {/* Classes Management - Admin, Super Admin, Teacher */}
          <Route
            path="/classes"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['super_admin', 'admin', 'teacher']}>
                  <ClassesPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          
          {/* Marks - Super Admin (view only), Admin, Teacher */}
          <Route
            path="/marks"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['super_admin', 'admin', 'teacher']}>
                  <MarksPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          
          {/* Results - Students Only */}
          <Route
            path="/results"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['student', 'parent']}>
                  <ResultsPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          
          {/* Attendance - All roles but with different permissions */}
          <Route
            path="/attendance"
            element={
              <ProtectedRoute>
                <AttendancePage />
              </ProtectedRoute>
            }
          />
          
          {/* Fees - All roles but with different permissions */}
          <Route
            path="/fees"
            element={
              <ProtectedRoute>
                <FeesPage />
              </ProtectedRoute>
            }
          />
          
          {/* Timetable - All roles */}
          <Route
            path="/timetable"
            element={
              <ProtectedRoute>
                <TimetablePage />
              </ProtectedRoute>
            }
          />
          
          {/* Messages - All roles */}
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <MessagesPage />
              </ProtectedRoute>
            }
          />
          
          {/* Announcements - All roles */}
          <Route
            path="/announcements"
            element={
              <ProtectedRoute>
                <AnnouncementsPage />
              </ProtectedRoute>
            }
          />
          
          {/* Suggestions - Parents Only */}
          <Route
            path="/suggestions"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['parent']}>
                  <SuggestionsPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          
          {/* Admin Suggestions - Admin and Super Admin Only */}
          <Route
            path="/admin-suggestions"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['admin', 'super_admin']}>
                  <AdminSuggestionsPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          
          {/* Settings - All roles */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <ProfileSettings />
              </ProtectedRoute>
            }
          />
          
          {/* Create Users - Super Admin and Admin only */}
          <Route
            path="/create-users"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['super_admin', 'admin']}>
                  <CreateUsersPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;