import { useAuthStore } from '../../lib/store';
import AdminDashboard from './AdminDashboard';
import TeacherDashboard from './TeacherDashboard';
import ParentDashboard from './ParentDashboard';
import StudentDashboard from './StudentDashboard';

export default function DashboardPage() {
  const { user, isLoading } = useAuthStore();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Loading dashboard...</p>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Authentication Required</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>Please log in to access the dashboard.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Render appropriate dashboard based on user role
  switch (user.role) {
    case 'super_admin':
    case 'admin':
      return <AdminDashboard />;
    case 'teacher':
      return <TeacherDashboard />;
    case 'parent':
      return <ParentDashboard />;
    case 'student':
      return <StudentDashboard />;
    default:
      return (
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Invalid User Role</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>Your account has an invalid role: {user.role}. Please contact the administrator.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
  }
}