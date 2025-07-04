import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  DollarSign, 
  Calendar, 
  MessageCircle, 
  BarChart3, 
  Settings,
  ClipboardCheck,
  HelpCircle,
  Bell,
  X,
  UserPlus,
  Award,
  LayoutDashboard,
  CalendarDays,
  MessageSquare,
  FileText
} from 'lucide-react';
import { useAuthStore } from '../../lib/store';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

interface SidebarProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
}

function NavItem({ to, icon, label, onClick }: NavItemProps) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
          isActive
            ? 'bg-blue-800 text-white'
            : 'text-gray-100 hover:bg-blue-800 hover:text-white'
        }`
      }
    >
      <span className="mr-3">{icon}</span>
      {label}
    </NavLink>
  );
}

export default function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen }: SidebarProps) {
  const { user } = useAuthStore();
  
  // Define navigation items based on user role
  const getNavItems = () => {
    const superAdminItems = [
      { to: '/dashboard', icon: <BarChart3 size={20} />, label: 'Dashboard' },
      { to: '/students', icon: <GraduationCap size={20} />, label: 'Students' },
      { to: '/marks', icon: <BookOpen size={20} />, label: 'Results' },
      { to: '/teachers', icon: <Users size={20} />, label: 'Teachers' },
      { to: '/parents', icon: <Users size={20} />, label: 'Parents' },
      { to: '/classes', icon: <BookOpen size={20} />, label: 'Classes' },
      { to: '/attendance', icon: <ClipboardCheck size={20} />, label: 'Attendance' },
      { to: '/fees', icon: <DollarSign size={20} />, label: 'Fees' },
      { to: '/timetable', icon: <Calendar size={20} />, label: 'Timetable' },
      { to: '/messages', icon: <MessageCircle size={20} />, label: 'Messages' },
      { to: '/admin-suggestions', icon: <HelpCircle size={20} />, label: 'Parent Suggestions' },
      { to: '/announcements', icon: <Bell size={20} />, label: 'Announcements' },
      { to: '/settings', icon: <Settings size={20} />, label: 'Settings' },
      { to: '/create-users', icon: <UserPlus size={20} />, label: 'Create Users' }
    ];
    
    const adminItems = [
      { to: '/dashboard', icon: <BarChart3 size={20} />, label: 'Dashboard' },
      { to: '/students', icon: <GraduationCap size={20} />, label: 'Students' },
      { to: '/teachers', icon: <Users size={20} />, label: 'Teachers' },
      { to: '/parents', icon: <Users size={20} />, label: 'Parents' },
      { to: '/classes', icon: <BookOpen size={20} />, label: 'Classes' },
      { to: '/attendance', icon: <ClipboardCheck size={20} />, label: 'Attendance' },
      { to: '/fees', icon: <DollarSign size={20} />, label: 'Fees' },
      { to: '/timetable', icon: <Calendar size={20} />, label: 'Timetable' },
      { to: '/messages', icon: <MessageCircle size={20} />, label: 'Messages' },
      { to: '/admin-suggestions', icon: <HelpCircle size={20} />, label: 'Parent Suggestions' },
      { to: '/announcements', icon: <Bell size={20} />, label: 'Announcements' },
      { to: '/settings', icon: <Settings size={20} />, label: 'Settings' },
      { to: '/create-users', icon: <UserPlus size={20} />, label: 'Create Users' },
      { to: '/report-cards', icon: <Award size={20} />, label: 'Report Cards' }
    ];
    
    const teacherItems = [
      { to: '/dashboard', icon: <BarChart3 size={20} />, label: 'Dashboard' },
      { to: '/students', icon: <GraduationCap size={20} />, label: 'Students' },
      { to: '/attendance', icon: <ClipboardCheck size={20} />, label: 'Attendance' },
      { to: '/marks', icon: <BookOpen size={20} />, label: 'Results' },
      { to: '/timetable', icon: <Calendar size={20} />, label: 'Timetable' },
      { to: '/messages', icon: <MessageCircle size={20} />, label: 'Messages' },
      { to: '/announcements', icon: <Bell size={20} />, label: 'Announcements' },
      { to: '/settings', icon: <Settings size={20} />, label: 'Settings' },
      { to: '/report-cards', icon: <Award size={20} />, label: 'Report Cards' }
    ];
    
    const parentItems = [
      { to: '/dashboard', icon: <BarChart3 size={20} />, label: 'Dashboard' },
      { to: '/my-children', icon: <GraduationCap size={20} />, label: 'My Children' },
      { to: '/attendance', icon: <ClipboardCheck size={20} />, label: 'Attendance' },
      { to: '/fees', icon: <DollarSign size={20} />, label: 'Fees' },
      { to: '/timetable', icon: <Calendar size={20} />, label: 'Timetable' },
      { to: '/results', icon: <Award size={20} />, label: 'Results' },
      { to: '/messages', icon: <MessageCircle size={20} />, label: 'Messages' },
      { to: '/suggestions', icon: <HelpCircle size={20} />, label: 'Suggestions/Questions' },
      { to: '/announcements', icon: <Bell size={20} />, label: 'Announcements' },
      { to: '/settings', icon: <Settings size={20} />, label: 'Settings' },
      { to: '/report-cards', icon: <Award size={20} />, label: 'Report Cards' }
    ];
    
    const studentItems = [
      { to: '/dashboard', icon: <BarChart3 size={20} />, label: 'Dashboard' },
      { to: '/results', icon: <Award size={20} />, label: 'My Results' },
      { to: '/attendance', icon: <ClipboardCheck size={20} />, label: 'Attendance' },
      { to: '/timetable', icon: <Calendar size={20} />, label: 'Timetable' },
      { to: '/messages', icon: <MessageCircle size={20} />, label: 'Messages' },
      { to: '/announcements', icon: <Bell size={20} />, label: 'Announcements' },
      { to: '/settings', icon: <Settings size={20} />, label: 'Settings' },
      { to: '/report-cards', icon: <Award size={20} />, label: 'Report Cards' }
    ];
    
    switch (user?.role) {
      case 'super_admin':
        return superAdminItems;
      case 'admin':
        return adminItems;
      case 'teacher':
        return teacherItems;
      case 'parent':
        return parentItems;
      case 'student':
        return studentItems;
      default:
        return [];
    }
  };

  const sidebarClasses = `${
    isMobileMenuOpen ? 'fixed inset-y-0 left-0 z-50' : 'hidden'
  } md:flex md:flex-col md:w-64 bg-blue-900 text-white`;
  
  return (
    <aside className={sidebarClasses}>
      <div className="flex flex-col h-full">
        <div className="h-16 flex items-center justify-between px-4 border-b border-blue-800">
          <h1 className="text-xl font-bold">SchoolSync</h1>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden text-white focus:outline-none"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 flex flex-col overflow-y-auto pt-5 pb-4">
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {getNavItems().map((item) => (
              <NavItem
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
                onClick={() => setIsMobileMenuOpen(false)}
              />
            ))}
          </nav>
        </div>
        
        <div className="px-4 py-4 border-t border-blue-800">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-blue-800 flex items-center justify-center">
              {user?.firstName && user?.lastName && (
                <span className="text-white font-medium">
                  {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                </span>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-blue-200 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}