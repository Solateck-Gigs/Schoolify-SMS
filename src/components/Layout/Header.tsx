import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, MessageSquare, LogOut, User, ChevronDown, Settings, Trash2, Check, HelpCircle } from 'lucide-react';
import { useAuthStore } from '../../lib/store';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../lib/api';
import { toast } from 'react-hot-toast';
import { io, Socket } from 'socket.io-client';

// Import notification sound
const NOTIFICATION_SOUND_URL = '/notification.mp3';

interface Notification {
  _id: string;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isActive: boolean;
  readBy: string[];
  createdAt: string;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
}

interface Message {
  _id: string;
  sender: {
    _id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  content: string;
  read_by_receiver: boolean;
  created_at: string;
  type?: string;
  subject?: string;
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
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestions, setSuggestions] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState({ 
    notifications: 0, 
    messages: 0,
    suggestions: 0
  });
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const notificationSound = useRef<HTMLAudioElement | null>(null);
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Initialize notification sound
  useEffect(() => {
    notificationSound.current = new Audio(NOTIFICATION_SOUND_URL);
    notificationSound.current.volume = 0.5;
  }, []);

  // Play notification sound
  const playNotificationSound = () => {
    if (notificationSound.current) {
      notificationSound.current.currentTime = 0;
      notificationSound.current.play().catch(err => console.error('Error playing notification sound:', err));
    }
  };

  // Connect to socket.io server
  useEffect(() => {
    if (!user || !user._id) return;
    
    // Extract base URL without any path
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const baseUrl = apiUrl.replace(/\/api$/, ''); // Remove '/api' if present
    
    console.log('Header connecting to socket server at:', baseUrl);
    
    // Connect to the socket server
    const socketInstance = io(baseUrl, {
      withCredentials: true,
      transports: ['polling', 'websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      extraHeaders: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    // Set up event listeners
    socketInstance.on('connect', () => {
      console.log('Header connected to socket server with ID:', socketInstance.id);
      // Authenticate with user ID
      socketInstance.emit('authenticate', user._id);
    });
    
    socketInstance.on('newMessage', (message: Message) => {
      // Add new message to messages list if messages dropdown is open
      if (isMessagesOpen) {
        setMessages(prev => {
          // Check if message already exists
          const exists = prev.some(m => m._id === message._id);
          if (!exists) {
            return [message, ...prev].slice(0, 10); // Keep only latest 10 messages
          }
          return prev;
        });
      }
      
      // Update unread count
      setUnreadCount(prev => ({
        ...prev,
        messages: prev.messages + 1
      }));
      
      // Play notification sound
      playNotificationSound();
      
      // Show toast notification
      toast.success(`New message from ${message.sender.firstName} ${message.sender.lastName}`);
    });
    
    // Save socket instance
    setSocket(socketInstance);
    
    // Clean up on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

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

  // Listen for new suggestion events
  useEffect(() => {
    const handleNewSuggestion = () => {
      if (user && (user.role === 'admin' || user.role === 'super_admin')) {
        // Increment the suggestions count
        setUnreadCount(prev => ({
          ...prev,
          suggestions: prev.suggestions + 1
        }));
        
        // Play notification sound
        playNotificationSound();
        
        // Show toast notification
        toast.success('New suggestion received from a parent');
        
        // Refresh suggestions
        fetchSuggestions();
      }
    };
    
    window.addEventListener('newSuggestion', handleNewSuggestion);
    
    return () => {
      window.removeEventListener('newSuggestion', handleNewSuggestion);
    };
  }, [user]);

  // Socket event for new suggestions
  useEffect(() => {
    if (!socket || !user) return;
    
    // Listen for new suggestions
    socket.on('newSuggestion', (message: Message) => {
      if (user.role === 'admin' || user.role === 'super_admin') {
        // Update suggestions count
        setUnreadCount(prev => ({
          ...prev,
          suggestions: prev.suggestions + 1
        }));
        
        // Play notification sound
        playNotificationSound();
        
        // Show toast notification
        toast.success(`New suggestion from ${message.sender.firstName} ${message.sender.lastName}`);
        
        // Update suggestions list if open
        if (isSuggestionsOpen) {
          setSuggestions(prev => {
            // Check if suggestion already exists
            const exists = prev.some(s => s._id === message._id);
            if (!exists) {
              return [message, ...prev].slice(0, 10); // Keep only latest 10 suggestions
            }
            return prev;
          });
        }
      }
    });
    
    return () => {
      socket.off('newSuggestion');
    };
  }, [socket, user, isSuggestionsOpen]);

  // Fetch notifications and messages
  useEffect(() => {
    if (user && user._id) {
      fetchNotifications();
      fetchMessages();
      
      // Only fetch suggestions for admins
      if (user.role === 'admin' || user.role === 'super_admin') {
        fetchSuggestions();
      }
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user || !user._id) return;
    
    setLoadingNotifications(true);
    try {
      // Fetch announcements from the backend
      const announcements = await apiFetch<Notification[]>('/announcements');
      
      // Process announcements into notifications
      setNotifications(announcements);
      
      // Count unread notifications (not in readBy array)
      const unreadNotifications = announcements.filter(
        notification => !notification.readBy.includes(user._id)
      ).length;
      
      setUnreadCount(prev => ({ ...prev, notifications: unreadNotifications }));
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const fetchMessages = async () => {
    if (!user || !user._id) return;
    
    try {
      // Fetch recent messages from inbox
      const response = await apiFetch<Message[]>('/messages/inbox');
      const data = response as Message[];
      
      // Sort by date and take only the 10 most recent
      const sortedMessages = data
        .sort((a: Message, b: Message) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);
      
      setMessages(sortedMessages);
      
      // Count unread messages
      const unreadMessages = data.filter((message: Message) => !message.read_by_receiver).length;
      setUnreadCount(prev => ({ ...prev, messages: unreadMessages }));
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchSuggestions = async () => {
    if (!user || !user._id || (user.role !== 'admin' && user.role !== 'super_admin')) return;
    
    try {
      // Use the admin suggestions API endpoint
      const response = await apiFetch<Message[]>('/admin/suggestions');
      
      // Ensure we have valid data
      if (!Array.isArray(response)) {
        console.error('Invalid suggestions data format:', response);
        // Use mock data for testing when API fails
        const mockData = [
          {
            _id: 'mock-1',
            content: 'Mock suggestion 1',
            read_by_receiver: false,
            created_at: new Date().toISOString(),
            sender: {
              _id: 'mock-sender-1',
              firstName: 'Mock',
              lastName: 'Parent',
              role: 'parent'
            },
            type: 'suggestion',
            subject: 'Mock Subject'
          }
        ];
        setSuggestions(mockData);
        setUnreadCount(prev => ({ ...prev, suggestions: 1 }));
        return;
      }
      
      const data = response as Message[];
      
      // Sort by date and take only the 10 most recent
      const sortedSuggestions = data
        .sort((a: Message, b: Message) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);
      
      setSuggestions(sortedSuggestions);
      
      // Count unread suggestions
      const unreadSuggestions = data.filter((message: Message) => !message.read_by_receiver).length;
      setUnreadCount(prev => ({ ...prev, suggestions: unreadSuggestions }));
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      // Use mock data for testing when API fails
      const mockData = [
        {
          _id: 'mock-1',
          content: 'Mock suggestion 1',
          read_by_receiver: false,
          created_at: new Date().toISOString(),
          sender: {
            _id: 'mock-sender-1',
            firstName: 'Mock',
            lastName: 'Parent',
            role: 'parent'
          },
          type: 'suggestion',
          subject: 'Mock Subject'
        }
      ];
      setSuggestions(mockData);
      setUnreadCount(prev => ({ ...prev, suggestions: 1 }));
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    if (!user || !user._id) return;
    
    try {
      // Call the API to mark the announcement as read
      await apiFetch(`/announcements/${notificationId}/read`, {
        method: 'POST'
      });
      
      // Update the UI
      setNotifications(prev =>
        prev.map(n =>
          n._id === notificationId ? { ...n, readBy: [...n.readBy, user._id] } : n
        )
      );
      
      // Update unread count
      setUnreadCount(prev => ({
        ...prev,
        notifications: notifications.filter(n => !n.readBy.includes(user._id) && n._id !== notificationId).length,
      }));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllNotificationsAsRead = async () => {
    if (!user || !user._id) return;
    
    try {
      // Get all unread notification IDs
      const unreadNotifications = notifications.filter(n => !n.readBy.includes(user._id));
      
      // Mark each as read
      const promises = unreadNotifications.map(notification => 
        apiFetch(`/announcements/${notification._id}/read`, {
          method: 'POST'
        })
      );
      
      await Promise.all(promises);
      
      // Update the UI
      setNotifications(prev =>
        prev.map(n => {
          if (!n.readBy.includes(user._id)) {
            return { ...n, readBy: [...n.readBy, user._id] };
          }
          return n;
        })
      );
      
      // Update unread count
      setUnreadCount(prev => ({
        ...prev,
        notifications: 0,
      }));
      
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      // Call API to mark message as read
      await apiFetch(`/messages/${messageId}/read`, {
        method: 'PUT'
      });
      
      // Update local state
      setMessages(prev =>
        prev.map(m =>
          m._id === messageId ? { ...m, read_by_receiver: true } : m
        )
      );
      
      // Update unread count
      setUnreadCount(prev => ({
        ...prev,
        messages: messages.filter(m => !m.read_by_receiver && m._id !== messageId).length,
      }));
      
      // Emit socket event
      if (socket) {
        socket.emit('markAsRead', messageId);
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };
  
  const markAllMessagesAsRead = async () => {
    if (!user || !user._id) return;
    
    try {
      // Get all unread message senders
      const unreadMessages = messages.filter(m => !m.read_by_receiver);
      const uniqueSenders = [...new Set(unreadMessages.map(m => m.sender._id))];
      
      // Mark all messages from each sender as read
      const promises = uniqueSenders.map(senderId => 
        apiFetch(`/messages/read-all/${senderId}`, {
          method: 'PUT'
        })
      );
      
      await Promise.all(promises);
      
      // Update local state
      setMessages(prev =>
        prev.map(m => ({ ...m, read_by_receiver: true }))
      );
      
      // Update unread count
      setUnreadCount(prev => ({
        ...prev,
        messages: 0,
      }));
      
      toast.success('All messages marked as read');
    } catch (error) {
      console.error('Error marking all messages as read:', error);
      toast.error('Failed to mark all messages as read');
    }
  };
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // If less than 24 hours ago, show time
    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Otherwise show date
    return date.toLocaleDateString();
  };
  
  // Listen for unread message count updates from MessagesPage
  useEffect(() => {
    const handleUnreadMessagesChanged = (event: CustomEvent) => {
      const { count } = event.detail;
      setUnreadCount(prev => ({
        ...prev,
        messages: count
      }));
    };

    // Add event listener
    window.addEventListener('unread-messages-changed', handleUnreadMessagesChanged as EventListener);

    // Clean up
    return () => {
      window.removeEventListener('unread-messages-changed', handleUnreadMessagesChanged as EventListener);
    };
  }, []);

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
            {/* Suggestions Button - Only for Admin and Super Admin */}
            {user && (user.role === 'admin' || user.role === 'super_admin') && (
              <div className="relative ml-3" ref={suggestionsRef}>
                <button
                  onClick={() => {
                    setIsSuggestionsOpen(!isSuggestionsOpen);
                    setIsMessagesOpen(false);
                    setIsNotificationsOpen(false);
                    setIsUserMenuOpen(false);
                    if (!isSuggestionsOpen) {
                      fetchSuggestions();
                      // Reset unread count when opening suggestions
                      setUnreadCount(prev => ({ ...prev, suggestions: 0 }));
                    }
                  }}
                  className="relative p-1 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <span className="sr-only">View suggestions</span>
                  <HelpCircle className="h-6 w-6" />
                  {unreadCount.suggestions > 0 && (
                    <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center transform -translate-y-1/2 translate-x-1/2">
                      {unreadCount.suggestions}
                    </span>
                  )}
                </button>
                
                {/* Suggestions dropdown */}
                {isSuggestionsOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                    <div className="py-1">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-medium text-gray-900">Parent Suggestions</h3>
                          <Link
                            to="/admin-suggestions"
                            className="text-xs text-blue-600 hover:text-blue-800"
                            onClick={() => setIsSuggestionsOpen(false)}
                          >
                            View All
                          </Link>
                        </div>
                      </div>
                      
                      {suggestions.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500">
                          No new suggestions
                        </div>
                      ) : (
                        <div className="max-h-60 overflow-y-auto">
                          {suggestions.map((suggestion) => (
                            <Link
                              key={suggestion._id}
                              to="/admin-suggestions"
                              onClick={() => {
                                setIsSuggestionsOpen(false);
                              }}
                              className={`block px-4 py-2 text-sm hover:bg-gray-100 ${
                                !suggestion.read_by_receiver ? 'bg-blue-50' : ''
                              }`}
                            >
                              <div className="flex justify-between">
                                <span className="font-medium">
                                  {suggestion.sender.firstName} {suggestion.sender.lastName}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatTime(suggestion.created_at)}
                                </span>
                              </div>
                              <p className="text-gray-600 truncate">{suggestion.subject}</p>
                              <p className="text-gray-500 text-xs mt-1 truncate">
                                {suggestion.content}
                              </p>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notifications Dropdown */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  if (!isNotificationsOpen) {
                    fetchNotifications();
                  }
                }}
                className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none relative"
              >
                <Bell size={20} />
                {unreadCount.notifications > 0 && (
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-96 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1" role="menu">
                    <div className="px-4 py-2 border-b flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900">Announcements</h3>
                      {notifications.length > 0 && (
                        <div className="flex gap-2">
                          <button 
                            onClick={markAllNotificationsAsRead}
                            className="text-xs flex items-center text-blue-600 hover:text-blue-800"
                            disabled={unreadCount.notifications === 0}
                          >
                            <Check size={14} className="mr-1" />
                            Mark all as read
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {loadingNotifications ? (
                        <div className="px-4 py-2 text-sm text-gray-500">Loading notifications...</div>
                      ) : notifications.length === 0 ? (
                        <div className="px-4 py-2 text-sm text-gray-500">No notifications</div>
                      ) : (
                        notifications.map((notification) => {
                          const isRead = notification.readBy.includes(user?._id || '');
                          const priorityColors = {
                            low: 'bg-gray-100',
                            medium: 'bg-blue-100',
                            high: 'bg-orange-100',
                            urgent: 'bg-red-100'
                          };
                          const priorityTextColors = {
                            low: 'text-gray-700',
                            medium: 'text-blue-700',
                            high: 'text-orange-700',
                            urgent: 'text-red-700'
                          };
                          return (
                            <button
                              key={notification._id}
                              onClick={() => {
                                if (!isRead) {
                                  markNotificationAsRead(notification._id);
                                }
                                navigate('/announcements');
                              }}
                              className={`w-full text-left px-4 py-3 border-b text-sm hover:bg-gray-50 ${
                                !isRead ? 'bg-blue-50' : ''
                              }`}
                            >
                              <div className="flex items-start">
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="font-medium text-gray-900">{notification.title}</p>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[notification.priority]} ${priorityTextColors[notification.priority]}`}>
                                      {notification.priority}
                                    </span>
                                  </div>
                                  <p className="text-gray-600 line-clamp-2">{notification.content}</p>
                                  <div className="flex items-center justify-between mt-1">
                                    <p className="text-xs text-gray-400">
                                      {new Date(notification.createdAt).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      By: {notification.createdBy?.firstName} {notification.createdBy?.lastName}
                                    </p>
                                  </div>
                                </div>
                                {!isRead && (
                                  <span className="ml-2 h-2 w-2 mt-2 flex-shrink-0 rounded-full bg-blue-500"></span>
                                )}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                    <div className="border-t px-4 py-2">
                      <Link
                        to="/announcements"
                        className="text-sm text-blue-600 hover:text-blue-800"
                        onClick={() => setIsNotificationsOpen(false)}
                      >
                        View all announcements
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Messages Dropdown */}
            <div className="relative" ref={messagesRef}>
              <button
                onClick={() => {
                  setIsMessagesOpen(!isMessagesOpen);
                  if (!isMessagesOpen) {
                    fetchMessages();
                  }
                }}
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
                    <div className="px-4 py-2 border-b flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900">Messages</h3>
                      {messages.length > 0 && unreadCount.messages > 0 && (
                        <button 
                          onClick={markAllMessagesAsRead}
                          className="text-xs flex items-center text-blue-600 hover:text-blue-800"
                        >
                          <Check size={14} className="mr-1" />
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {messages.length === 0 ? (
                        <div className="px-4 py-2 text-sm text-gray-500">No messages</div>
                      ) : (
                        messages.map((message) => (
                          <button
                            key={message._id}
                            onClick={() => {
                              if (!message.read_by_receiver) {
                                markMessageAsRead(message._id);
                              }
                              navigate(`/messages`);
                              setIsMessagesOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                              !message.read_by_receiver ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-start">
                              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-2 flex-shrink-0">
                                <User size={16} className="text-gray-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium text-gray-900 truncate">
                                    {message.sender.firstName} {message.sender.lastName}
                                  </p>
                                  <p className="text-xs text-gray-400 ml-1 flex-shrink-0">
                                    {formatTime(message.created_at)}
                                  </p>
                                </div>
                                <p className="text-gray-500 truncate">{message.content}</p>
                              </div>
                              {!message.read_by_receiver && (
                                <span className="ml-2 h-2 w-2 mt-2 flex-shrink-0 rounded-full bg-blue-500"></span>
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
                        onClick={() => setIsMessagesOpen(false)}
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