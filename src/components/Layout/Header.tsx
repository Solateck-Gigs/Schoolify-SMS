import React from 'react';
import { Menu, Bell, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../../lib/store';
import Button from '../ui/Button';

export default function Header() {
  const { user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <button
              type="button"
              className="md:hidden px-4 text-gray-500 focus:outline-none"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu size={24} />
            </button>
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-blue-900">SchoolSync</h1>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="hidden md:ml-4 md:flex md:items-center">
              <button
                type="button"
                className="p-2 text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <Bell size={20} />
              </button>
              <button
                type="button"
                className="ml-3 p-2 text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <MessageSquare size={20} />
              </button>
              
              <div className="ml-4 relative flex-shrink-0">
                <div className="flex items-center">
                  <div className="hidden md:block mr-3">
                    <p className="text-sm font-medium text-gray-700">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    {user?.profileImage ? (
                      <img
                        className="h-10 w-10 rounded-full"
                        src={user.profileImage}
                        alt={`${user.firstName} ${user.lastName}`}
                      />
                    ) : (
                      <span className="text-blue-800 font-medium">
                        {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="ml-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => logout()}
                    >
                      Logout
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}