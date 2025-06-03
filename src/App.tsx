import  { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout/Layout';
import AuthPage from './pages/Auth/AuthPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import StudentsPage from './pages/Student/StudentsPage';
import FeesPage from './pages/Fee/FeesPage';
import TimetablePage from './pages/Timetable/TimetablePage';
import MessagesPage from './pages/Message/MessagesPage';
import MarksPage from './pages/Marks/MarksPage';
import { useAuthStore } from './lib/store';

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, isLoading } = useAuthStore();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
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
  const { checkAuth } = useAuthStore();
  
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        
        <Route element={<Layout />}>
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
                <RoleRoute allowedRoles={['admin', 'teacher']}>
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
                <RoleRoute allowedRoles={['admin', 'teacher']}>
                  <MarksPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
        </Route>
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;