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
  Bell
} from 'lucide-react';
import { useAuthStore } from '../../lib/store';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

function NavItem({ to, icon, label }: NavItemProps) {
  return (
    <NavLink
      to={to}
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

export default function Sidebar() {
  const { user } = useAuthStore();
  
  // Define navigation items based on user role
  const getNavItems = () => {
    const adminItems = [
      { to: '/dashboard', icon: <BarChart3 size={20} />, label: 'Dashboard' },
      { to: '/dashboard', icon: <GraduationCap size={20} />, label: 'Students' },
      { to: '/teachers', icon: <Users size={20} />, label: 'Teachers' },
      { to: '/classes', icon: <BookOpen size={20} />, label: 'Classes' },
      { to: '/attendance', icon: <ClipboardCheck size={20} />, label: 'Attendance' },
      { to: '/fees', icon: <DollarSign size={20} />, label: 'Fees' },
      { to: '/timetable', icon: <Calendar size={20} />, label: 'Timetable' },
      { to: '/messages', icon: <MessageCircle size={20} />, label: 'Messages' },
      { to: '/announcements', icon: <Bell size={20} />, label: 'Announcements' },
      { to: '/settings', icon: <Settings size={20} />, label: 'Settings' },
      { to: '/create-users', icon: <Users size={20} />, label: 'Create Users' }
    ];
    
    const teacherItems = [
      { to: '/dashboard', icon: <BarChart3 size={20} />, label: 'Dashboard' },
      { to: '/students', icon: <GraduationCap size={20} />, label: 'Students' },
      { to: '/attendance', icon: <ClipboardCheck size={20} />, label: 'Attendance' },
      { to: '/dashboard', icon: <BookOpen size={20} />, label: 'Marks' },
      { to: '/timetable', icon: <Calendar size={20} />, label: 'Timetable' },
      { to: '/messages', icon: <MessageCircle size={20} />, label: 'Messages' },
      { to: '/announcements', icon: <Bell size={20} />, label: 'Announcements' }
    ];
    
    const parentItems = [
      { to: '/dashboard', icon: <BarChart3 size={20} />, label: 'Dashboard' },
      { to: '/children', icon: <GraduationCap size={20} />, label: 'My Children' },
      { to: '/attendance', icon: <ClipboardCheck size={20} />, label: 'Attendance' },
      { to: '/fees', icon: <DollarSign size={20} />, label: 'Fees' },
      { to: '/timetable', icon: <Calendar size={20} />, label: 'Timetable' },
      { to: '/messages', icon: <MessageCircle size={20} />, label: 'Messages' },
      { to: '/suggestions', icon: <HelpCircle size={20} />, label: 'Suggestions/Questions' },
      { to: '/announcements', icon: <Bell size={20} />, label: 'Announcements' }
    ];
    
    const superAdminItems = [
      { to: '/dashboard', icon: <BarChart3 size={20} />, label: 'Dashboard' },
      { to: '/students', icon: <GraduationCap size={20} />, label: 'Students' },
      { to: '/marks', icon: <BookOpen size={20} />, label: 'Marks' },
      { to: '/teachers', icon: <Users size={20} />, label: 'Teachers' },
      { to: '/children', icon: <GraduationCap size={20} />, label: 'My Children' },
      { to: '/classes', icon: <BookOpen size={20} />, label: 'Classes' },
      { to: '/attendance', icon: <ClipboardCheck size={20} />, label: 'Attendance' },
      { to: '/fees', icon: <DollarSign size={20} />, label: 'Fees' },
      { to: '/timetable', icon: <Calendar size={20} />, label: 'Timetable' },
      { to: '/messages', icon: <MessageCircle size={20} />, label: 'Messages' },
      { to: '/announcements', icon: <Bell size={20} />, label: 'Announcements' },
      { to: '/settings', icon: <Settings size={20} />, label: 'Settings' },
      { to: '/create-users', icon: <Users size={20} />, label: 'Create Users' }
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
      default:
        return [];
    }
  };
  
  return (
    <aside className="hidden md:flex md:flex-col md:w-64 bg-blue-900 text-white">
      <div className="flex flex-col h-full">
        <div className="h-16 flex items-center px-4 border-b border-blue-800">
          <h1 className="text-xl font-bold">SchoolSync</h1>
        </div>
        
        <div className="flex-1 flex flex-col overflow-y-auto pt-5 pb-4">
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {getNavItems().map((item) => (
              <NavItem
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
              />
            ))}
          </nav>
        </div>
        
        <div className="px-4 py-4 border-t border-blue-800">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-blue-800 flex items-center justify-center">
              {user?.profileImage ? (
                <img
                  className="h-10 w-10 rounded-full"
                  src={user.profileImage}
                  alt={`${user.firstName} ${user.lastName}`}
                />
              ) : (
                <span className="text-white font-medium">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </span>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-blue-200 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}