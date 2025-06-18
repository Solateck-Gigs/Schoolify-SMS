import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout/Layout';
import AuthPage from './pages/Auth/AuthPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import StudentsPage from './pages/Student/StudentsPage';
import FeesPage from './pages/Fee/FeesPage';
import TimetablePage from './pages/Timetable/TimetablePage';
import MessagesPage from './pages/Message/MessagesPage';
import MarksPage from './pages/Marks/MarksPage';
import AttendancePage from './pages/Attendance/AttendancePage';
import { useAuthStore } from './lib/store';
import AnnouncementsPage from './pages/Announcements/AnnouncementsPage';
import CreateUserPage from './pages/CreateUsers/CreateUsers';
import SuggestionsPage from './pages/Suggestions/SuggestionsPage';
import ProfileSettings from './pages/Settings/ProfileSettings';
import TeachersPage from './pages/Teachers/TeachersPage';
import ClassesPage from './pages/Classes/ClassesPage';
import { UNSAFE_DataRouterContext, UNSAFE_DataRouterStateContext } from 'react-router-dom';

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
        <Route path="/login" element={<AuthPage />} />
        
        <Route element={<Layout />}>
          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          
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
          
          <Route
            path="/children"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['parent']}>
                  <StudentsPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/fees"
            element={
              <ProtectedRoute>
                <FeesPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/timetable"
            element={
              <ProtectedRoute>
                <TimetablePage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <MessagesPage />
              </ProtectedRoute>
            }
          />
          
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
          
          <Route
            path="/attendance"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['super_admin', 'admin', 'teacher']}>
                  <AttendancePage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/announcements"
            element={
              <ProtectedRoute>
                <AnnouncementsPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/create-users"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['super_admin', 'admin']}>
                  <CreateUserPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/suggestions"
            element={
              <ProtectedRoute>
                <SuggestionsPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <ProfileSettings />
              </ProtectedRoute>
            }
          />
          
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
        </Route>
      </Routes>
    </Router>
  );
}

export default App;