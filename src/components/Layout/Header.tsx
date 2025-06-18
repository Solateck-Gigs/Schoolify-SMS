import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, MessageSquare, LogOut, User, ChevronDown, Settings } from 'lucide-react';
import { useAuthStore } from '../../lib/store';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'message' | 'announcement' | 'attendance' | 'fee';
  read: boolean;
  createdAt: string;
}

interface Message {
  id: string;
  sender: {
    id: string;
    name: string;
    role: string;
  };
  preview: string;
  unread: boolean;
  createdAt: string;
}

interface HeaderProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
}

export default function Header({ isMobileMenuOpen, setIsMobileMenuOpen }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState({ notifications: 0, messages: 0 });
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (messagesRef.current && !messagesRef.current.contains(event.target as Node)) {
        setIsMessagesOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications and messages
  useEffect(() => {
    const fetchNotifications = async () => {
      // TODO: Implement actual notification fetching
      const mockNotifications: Notification[] = [
        {
          id: '1',
          title: 'New Message',
          message: 'You have a new message from John Doe',
          type: 'message',
          read: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Fee Due',
          message: 'Your next fee payment is due in 3 days',
          type: 'fee',
          read: false,
          createdAt: new Date().toISOString(),
        },
      ];
      setNotifications(mockNotifications);
      setUnreadCount(prev => ({ ...prev, notifications: mockNotifications.filter(n => !n.read).length }));
    };

    const fetchMessages = async () => {
      // TODO: Implement actual message fetching
      const mockMessages: Message[] = [
        {
          id: '1',
          sender: {
            id: '1',
            name: 'John Doe',
            role: 'Teacher',
          },
          preview: 'Hello, I wanted to discuss...',
          unread: true,
          createdAt: new Date().toISOString(),
        },
      ];
      setMessages(mockMessages);
      setUnreadCount(prev => ({ ...prev, messages: mockMessages.filter(m => m.unread).length }));
    };

    fetchNotifications();
    fetchMessages();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    // TODO: Implement actual notification marking
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => ({
      ...prev,
      notifications: notifications.filter(n => !n.read && n.id !== notificationId).length,
    }));
  };

  const markMessageAsRead = async (messageId: string) => {
    // TODO: Implement actual message marking
    setMessages(prev =>
      prev.map(m =>
        m.id === messageId ? { ...m, unread: false } : m
      )
    );
    setUnreadCount(prev => ({
      ...prev,
      messages: messages.filter(m => m.unread && m.id !== messageId).length,
    }));
  };
  
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

          <div className="flex items-center gap-4">
            {/* Notifications Dropdown */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none relative"
              >
                <Bell size={20} />
                {unreadCount.notifications > 0 && (
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1" role="menu">
                    <div className="px-4 py-2 border-b">
                      <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-2 text-sm text-gray-500">No notifications</div>
                      ) : (
                        notifications.map((notification) => (
                          <button
                            key={notification.id}
                            onClick={() => markNotificationAsRead(notification.id)}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                              !notification.read ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-start">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{notification.title}</p>
                                <p className="text-gray-500">{notification.message}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(notification.createdAt).toLocaleString()}
                                </p>
                              </div>
                              {!notification.read && (
                                <span className="ml-2 h-2 w-2 rounded-full bg-blue-500"></span>
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Messages Dropdown */}
            <div className="relative" ref={messagesRef}>
              <button
                onClick={() => setIsMessagesOpen(!isMessagesOpen)}
                className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none relative"
              >
                <MessageSquare size={20} />
                {unreadCount.messages > 0 && (
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                )}
              </button>

              {isMessagesOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1" role="menu">
                    <div className="px-4 py-2 border-b">
                      <h3 className="text-sm font-medium text-gray-900">Messages</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {messages.length === 0 ? (
                        <div className="px-4 py-2 text-sm text-gray-500">No messages</div>
                      ) : (
                        messages.map((message) => (
                          <button
                            key={message.id}
                            onClick={() => {
                              markMessageAsRead(message.id);
                              navigate('/messages');
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                              message.unread ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-start">
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium text-gray-900">{message.sender.name}</p>
                                  <p className="text-xs text-gray-400">
                                    {new Date(message.createdAt).toLocaleString()}
                                  </p>
                                </div>
                                <p className="text-gray-500 truncate">{message.preview}</p>
                              </div>
                              {message.unread && (
                                <span className="ml-2 h-2 w-2 rounded-full bg-blue-500"></span>
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                    <div className="border-t px-4 py-2">
                      <Link
                        to="/messages"
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        View all messages
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-2 text-gray-700 hover:text-gray-900 focus:outline-none"
              >
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  {user?.firstName && user?.lastName && (
                    <span className="text-blue-600 font-medium">
                      {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                    </span>
                  )}
                </div>
                <span className="hidden md:block text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </span>
                <ChevronDown size={16} className={`transform transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b">
                      <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                      <p className="text-gray-500 capitalize">{user?.role}</p>
                    </div>
                    <Link
                      to="/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      <Settings size={16} className="mr-2" />
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      <LogOut size={16} className="mr-2" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {/* Add mobile menu items here if needed */}
          </div>
        </div>
      )}
    </header>
  );
}