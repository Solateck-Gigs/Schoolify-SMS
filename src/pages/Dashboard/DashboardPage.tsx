import { useAuthStore } from '../../lib/store';
import AdminDashboard from './AdminDashboard';
import TeacherDashboard from './TeacherDashboard';
import ParentDashboard from './ParentDashboard';
import StudentDashboard from './StudentDashboard';
import { CircularProgress, Alert, Box } from '@mui/material';

export default function DashboardPage() {
  const { user, isLoading } = useAuthStore();
  
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }
  
  if (!user) {
    return (
      <Box p={3}>
        <Alert severity="error">Please log in to access the dashboard</Alert>
      </Box>
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
        <Box p={3}>
          <Alert severity="error">Invalid user role: {user.role}</Alert>
        </Box>
      );
  }
}