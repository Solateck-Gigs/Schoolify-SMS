import React from 'react';
import { useAuthStore } from '../../lib/store';
import AdminDashboard from './AdminDashboard';
import TeacherDashboard from './TeacherDashboard';
import ParentDashboard from './ParentDashboard';

export default function DashboardPage() {
  const { user } = useAuthStore();
  
  if (!user) {
    return <div>Loading...</div>;
  }
  
  // Render appropriate dashboard based on user role
  switch (user.role) {
    case 'super_admin':
      return <AdminDashboard />;
    case 'admin':
      return <AdminDashboard />;
    case 'teacher':
      return <TeacherDashboard />;
    case 'parent':
      return <ParentDashboard />;
    default:
      return <div>Invalid user role</div>;
  }
}