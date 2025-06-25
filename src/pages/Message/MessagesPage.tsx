import React, { useState, useEffect, useRef } from 'react';
import { Send, Search, User, Paperclip, Clock, Check, CheckCheck } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { useAuthStore } from '../../lib/store';
import { Message } from '../../types';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { io, Socket } from 'socket.io-client';

// Define interfaces for our component
interface Contact {
  _id: string;
  firstName: string;
  lastName: string;
  role: string;
  email?: string;
  user_id_number?: string;
  lastMessage?: {
    content: string;
    timestamp: Date;
    unread: boolean;
  };
  unreadCount?: number;
  isOnline?: boolean;
  lastSeen?: string;
}

interface ChatMessage {
  _id: string;
  sender: {
    _id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  receiver: {
    _id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  content: string;
  subject: string;
  read_by_receiver: boolean;
  created_at: string;
  sending?: boolean; // Local state for message sending status
  sent?: boolean;    // Confirmation that message was sent
  delivered?: boolean; // Confirmation that message was delivered to server
}

export default function MessagesPage() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [lastSeenTimes, setLastSeenTimes] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Connect to socket.io server
  useEffect(() => {
    if (!user || !user._id) return;
    
    console.log("Attempting to connect to socket server...");
    
    // Extract base URL without any path
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const baseUrl = apiUrl.replace(/\/api$/, ''); // Remove '/api' if present
    
    console.log("Connecting to socket server at:", baseUrl);
    
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
      console.log('Connected to socket server with ID:', socketInstance.id);
      // Authenticate with user ID
      socketInstance.emit('authenticate', user._id);
    });
    
    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
    
    socketInstance.on('reconnect', (attemptNumber) => {
      console.log('Reconnected to socket server after', attemptNumber, 'attempts');
      socketInstance.emit('authenticate', user._id);
    });
    
    socketInstance.on('disconnect', (reason) => {
      console.log('Disconnected from socket server:', reason);
    });
    
    socketInstance.on('authenticated', (data) => {
      console.log('Authentication confirmed:', data);
      // Start sending heartbeats
      const heartbeatInterval = setInterval(() => {
        if (socketInstance.connected) {
          socketInstance.emit('heartbeat');
        }
      }, 30000); // Every 30 seconds
      
      // Clean up interval on unmount
      return () => clearInterval(heartbeatInterval);
    });
    
    socketInstance.on('onlineUsers', (userIds: string[]) => {
      console.log('Received online users:', userIds);
      setOnlineUsers(userIds);
    });
    
    socketInstance.on('offlineUsersLastSeen', (data: Record<string, string>) => {
      console.log('Received last seen times:', data);
      setLastSeenTimes(data);
    });
    
    socketInstance.on('userStatusChange', (data: { userId: string, isOnline: boolean, lastSeen: string | null }) => {
      console.log('User status change:', data);
      if (data.isOnline) {
        setOnlineUsers(prev => [...prev, data.userId]);
      } else {
        setOnlineUsers(prev => prev.filter(id => id !== data.userId));
        if (data.lastSeen) {
          setLastSeenTimes(prev => ({ ...prev, [data.userId]: data.lastSeen as string }));
        }
      }
    });
    
    socketInstance.on('newMessage', (message: ChatMessage) => {
      console.log('Received new message:', message);
      
      // Handle incoming message
      if (selectedContact === message.sender._id) {
        // If we're currently chatting with this sender, check if message exists before adding
        setMessages(prev => {
          // Check if this message already exists to avoid duplicates
          const exists = prev.some(msg => 
            msg._id === message._id || 
            (msg.content === message.content && 
             msg.sender._id === message.sender._id &&
             Math.abs(new Date(msg.created_at).getTime() - new Date(message.created_at).getTime()) < 5000)
          );
          
          if (exists) {
            console.log('Duplicate message detected, not adding:', message._id);
            return prev;
          } else {
            console.log('Adding new message to conversation:', message._id);
            markMessageAsRead(message._id);
            return [...prev, message];
          }
        });
      } else {
        // Otherwise just update the contacts list with new unread message
        fetchContacts();
      }
      
      // Update notification in header
      updateUnreadCount();
    });
    
    socketInstance.on('messageRead', ({ messageId }) => {
      // Update message read status in the UI
      setMessages(prev => 
        prev.map(msg => 
          msg._id === messageId ? { ...msg, read_by_receiver: true } : msg
        )
      );
    });
    
    socketInstance.on('error', (error) => {
      console.error('Socket error:', error);
      toast.error(error.message || 'An error occurred');
    });
    
    // Save socket instance
    setSocket(socketInstance);
    
    // Clean up on unmount
    return () => {
      console.log('Disconnecting socket...');
      socketInstance.disconnect();
    };
  }, [user]);
  
  // Fetch contacts and messages on component mount
  useEffect(() => {
    if (user && user._id) {
      fetchContacts();
    }
  }, [user]);
  
  // Fetch messages when selected contact changes
  useEffect(() => {
    if (selectedContact) {
      fetchConversation(selectedContact);
    }
  }, [selectedContact]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Log message state changes for debugging
  useEffect(() => {
    console.log('Messages state updated, count:', messages.length);
    
    // Log potential duplicates
    const contentCounts = new Map<string, number>();
    messages.forEach(msg => {
      const key = `${msg.content}-${msg.sender._id}`;
      contentCounts.set(key, (contentCounts.get(key) || 0) + 1);
    });
    
    // Find duplicates
    contentCounts.forEach((count, key) => {
      if (count > 1) {
        console.warn(`Potential duplicate detected: "${key}" appears ${count} times`);
        
        // Find the duplicates
        const duplicates = messages.filter(msg => {
          const msgKey = `${msg.content}-${msg.sender._id}`;
          return msgKey === key;
        });
        
        // Log details about each duplicate
        duplicates.forEach((msg, index) => {
          console.log(`Duplicate #${index + 1}:`, {
            id: msg._id,
            content: msg.content,
            sender: msg.sender._id,
            time: msg.created_at,
            sending: msg.sending,
            sent: msg.sent,
            delivered: msg.delivered
          });
        });
      }
    });
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const fetchContacts = async () => {
    try {
      setLoading(true);
      
      console.log("Fetching contacts...");
      
      // Get available contacts based on role
      try {
        const { data: availableContacts } = await api.get('/users/chat-contacts');
        console.log("Available contacts:", availableContacts);
        
        if (!availableContacts || availableContacts.length === 0) {
          console.log("No available contacts returned");
          setContacts([]);
          return;
        }
        
        // Process contacts to add unread counts
        let contactsWithUnread = [...availableContacts];
        
        try {
          // Try to get message history to add unread counts
          const { data: inboxMessages } = await api.get('/messages/inbox');
          
          // Count unread messages by sender
          const unreadCounts: Record<string, number> = {};
          inboxMessages.forEach((msg: ChatMessage) => {
            if (!msg.read_by_receiver) {
              const senderId = msg.sender._id;
              unreadCounts[senderId] = (unreadCounts[senderId] || 0) + 1;
            }
          });
          
          // Add unread counts to contacts
          contactsWithUnread = availableContacts.map((contact: Contact) => ({
            ...contact,
            unreadCount: unreadCounts[contact._id] || 0
          }));
          
        } catch (error) {
          console.warn("Could not fetch inbox messages for unread counts:", error);
          // Continue with contacts without unread counts
        }
        
        setContacts(contactsWithUnread);
        
        // Select first contact if none selected
        if (contactsWithUnread.length > 0 && !selectedContact) {
          setSelectedContact(contactsWithUnread[0]._id);
        }
      } catch (error) {
        console.error('Error fetching available contacts:', error);
        toast.error('Failed to load contacts');
        setContacts([]);
      }
    } catch (error) {
      console.error('Error in fetchContacts:', error);
      toast.error('Failed to load contacts');
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchConversation = async (contactId: string) => {
    try {
      setLoading(true);
      const { data } = await api.get(`/messages/conversation/${contactId}`);
      
      // Deduplicate messages before setting state
      const uniqueMessages = removeDuplicateMessages(data);
      console.log(`Fetched ${data.length} messages, ${uniqueMessages.length} after deduplication`);
      
      setMessages(uniqueMessages);
      
      // Mark all unread messages from this contact as read
      const unreadMessages = uniqueMessages.filter((msg: ChatMessage) => !msg.read_by_receiver && msg.sender._id === contactId);
      if (unreadMessages.length > 0) {
        console.log(`Marking ${unreadMessages.length} messages as read from ${contactId}`);
        await api.put(`/messages/read-all/${contactId}`);
        
        // Update unread counts in the header
        updateUnreadCount();
        
        // Also emit socket events for each message
        if (socket) {
          unreadMessages.forEach((msg: ChatMessage) => {
            socket.emit('markAsRead', msg._id);
          });
        }
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
      toast.error('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to remove duplicate messages
  const removeDuplicateMessages = (messages: ChatMessage[]): ChatMessage[] => {
    const uniqueMessages: ChatMessage[] = [];
    const seenIds = new Set<string>();
    const contentTimeMap = new Map<string, Date>();
    
    // Sort by creation time to ensure we keep the earliest message when duplicates exist
    const sortedMessages = [...messages].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    for (const message of sortedMessages) {
      // Skip if we've seen this ID before
      if (seenIds.has(message._id)) continue;
      
      // Create a content+sender key to detect semantic duplicates
      const contentKey = `${message.content}-${message.sender._id}`;
      const messageTime = new Date(message.created_at);
      
      // Check if we have a similar message within 5 seconds
      if (contentTimeMap.has(contentKey)) {
        const existingTime = contentTimeMap.get(contentKey)!;
        const timeDiff = Math.abs(messageTime.getTime() - existingTime.getTime());
        
        // If messages are within 5 seconds, consider them duplicates
        if (timeDiff < 5000) {
          console.log('Skipping duplicate message:', message._id, message.content);
          continue;
        }
      }
      
      // Add to our tracking collections
      seenIds.add(message._id);
      contentTimeMap.set(contentKey, messageTime);
      uniqueMessages.push(message);
    }
    
    return uniqueMessages;
  };
  
  const markMessageAsRead = async (messageId: string) => {
    try {
      await api.put(`/messages/${messageId}/read`);
      
      // Update local state
      setMessages(prev => 
        prev.map(msg => 
          msg._id === messageId ? { ...msg, read_by_receiver: true } : msg
        )
      );
      
      // Update socket
      if (socket) {
        socket.emit('markAsRead', messageId);
      }
      
      // Update unread count in header
      updateUnreadCount();
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };
  
  const updateUnreadCount = async () => {
    try {
      const { data: inboxMessages } = await api.get('/messages/inbox');
      const unreadCount = inboxMessages.filter((msg: ChatMessage) => !msg.read_by_receiver).length;
      
      // Dispatch a custom event to update the header
      const event = new CustomEvent('unread-messages-changed', { 
        detail: { count: unreadCount }
      });
      window.dispatchEvent(event);
      
      console.log('Updated unread message count:', unreadCount);
    } catch (error) {
      console.error('Error updating unread count:', error);
    }
  };
  
  const handleSendMessage = async () => {
    if (newMessage.trim() === '' || !selectedContact || !user) return;
    
    // Generate a unique temporary ID
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const messageContent = newMessage.trim();
    
    try {
      const messageData = {
        receiver_id: selectedContact,
        content: messageContent,
        subject: 'Chat Message'
      };
      
      // Create a temporary message to show immediately
      const tempMessage: ChatMessage = {
        _id: tempId, // Temporary ID to track this message
        sender: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        receiver: {
          _id: selectedContact,
          firstName: selectedContactDetails?.firstName || '',
          lastName: selectedContactDetails?.lastName || '',
          role: selectedContactDetails?.role || ''
        },
        content: messageContent,
        subject: 'Chat Message',
        read_by_receiver: false,
        created_at: new Date().toISOString(),
        sending: true // Mark as currently sending
      };
      
      // Add to messages immediately for better UX
      setMessages(prev => [...prev, tempMessage]);
      
      // Clear input
      setNewMessage('');
      
      // Scroll to bottom
      scrollToBottom();
      
      // Flag to track if we've received socket confirmation
      let socketConfirmed = false;
      
      // Set up a one-time socket listener for this specific message
      const messageConfirmListener = (confirmedMessage: ChatMessage) => {
        if (confirmedMessage.content === messageContent && 
            confirmedMessage.sender._id === user._id &&
            confirmedMessage.receiver._id === selectedContact) {
          
          console.log('Received socket confirmation for message:', confirmedMessage._id);
          socketConfirmed = true;
          
          // Replace temp message with confirmed one
          setMessages(prev => 
            prev.map(msg => 
              msg._id === tempId
                ? { ...confirmedMessage, sent: true, delivered: true }
                : msg
            )
          );
          
          // Remove this listener after confirmation
          if (socket) {
            socket.off('messageSent', messageConfirmListener);
          }
        }
      };
      
      // Add the one-time listener
      if (socket) {
        socket.on('messageSent', messageConfirmListener);
      }
      
      // Send via REST API
      const { data } = await api.post('/messages', messageData);
      console.log('Message sent via REST API:', data._id);
      
      // Also send via socket for real-time delivery
      if (socket) {
        socket.emit('sendMessage', {
        receiver: selectedContact,
          content: messageContent,
          subject: 'Chat Message'
        });
      }
      
      // If we don't receive a socket confirmation within 3 seconds, use the REST API response
      setTimeout(() => {
        if (!socketConfirmed) {
          console.log('No socket confirmation received, using REST API response');
          setMessages(prev => 
            prev.map(msg => 
              msg._id === tempId
                ? { ...data, sent: true, delivered: true }
                : msg
            )
          );
          
          // Clean up listener
          if (socket) {
            socket.off('messageSent', messageConfirmListener);
          }
        }
      }, 3000);
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      
      // Mark the temporary message as failed
      setMessages(prev => 
        prev.map(msg => 
          msg._id === tempId
            ? { ...msg, sending: false, sent: false }
            : msg
        )
      );
    }
  };
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatLastSeen = (lastSeen: string) => {
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  };
  
  const filteredContacts = contacts.filter(contact => 
    `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const selectedContactDetails = contacts.find(contact => contact._id === selectedContact);
  
  return (
    <div className="h-[calc(100vh-140px)]">
      <div className="flex h-full border rounded-lg overflow-hidden">
        {/* Contacts sidebar */}
        <div className="w-full sm:w-80 border-r bg-white flex flex-col">
          <div className="p-4 border-b">
            <Input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              className="bg-gray-50"
            />
          </div>
          
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading contacts...</div>
            ) : filteredContacts.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-gray-500 mb-2">No contacts found</p>
                <p className="text-sm text-gray-400">
                  {user?.role === 'parent' ? 
                    "As a parent, you can message teachers." :
                    user?.role === 'teacher' ? 
                    "As a teacher, you can message parents and administrators." :
                    user?.role === 'admin' || user?.role === 'super_admin' ? 
                    "As an administrator, you can message teachers." :
                    "No messaging permissions for your role."}
                </p>
              </div>
            ) : (
              filteredContacts.map((contact) => {
                const unreadCount = contact.unreadCount || 0;
                const isOnline = onlineUsers.includes(contact._id);
                return (
                  <div
                    key={contact._id}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                      selectedContact === contact._id ? 'bg-blue-50' : ''
                }`}
                    onClick={() => setSelectedContact(contact._id)}
              >
                <div className="flex items-center">
                      <div className="relative h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                    <User size={20} className="text-gray-500" />
                        {isOnline && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></span>
                        )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900">
                            {contact.firstName} {contact.lastName}
                          </h3>
                          {unreadCount > 0 && (
                        <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 font-bold">
                              {unreadCount}
                        </span>
                      )}
                    </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-500 capitalize">
                            {contact.role}
                          </p>
                          {isOnline ? (
                            <span className="text-xs text-green-500">Online</span>
                          ) : lastSeenTimes[contact._id] ? (
                            <span className="text-xs text-gray-400">
                              {formatLastSeen(lastSeenTimes[contact._id])}
                            </span>
                          ) : null}
                        </div>
                        {contact.lastMessage && (
                          <p className="text-xs text-gray-400 truncate mt-1">
                            {contact.lastMessage.content}
                          </p>
                        )}
                  </div>
                </div>
              </div>
                );
              })
            )}
          </div>
        </div>
        
        {/* Chat area */}
        <div className="hidden sm:flex flex-col flex-1 bg-gray-50">
          {selectedContact && selectedContactDetails ? (
            <>
              {/* Chat header */}
              <div className="p-4 border-b bg-white flex items-center justify-between">
                <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                  <User size={20} className="text-gray-500" />
                </div>
                <div>
                    <h3 className="font-medium text-gray-900">
                      {selectedContactDetails.firstName} {selectedContactDetails.lastName}
                    </h3>
                    <div className="flex items-center">
                      <p className="text-sm text-gray-500 capitalize mr-2">
                        {selectedContactDetails.role}
                      </p>
                      {onlineUsers.includes(selectedContactDetails._id) ? (
                        <span className="text-xs text-green-500 flex items-center">
                          <span className="h-2 w-2 bg-green-500 rounded-full mr-1"></span>
                          Online
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">
                          {lastSeenTimes[selectedContactDetails._id] ? 
                            `Last seen ${formatLastSeen(lastSeenTimes[selectedContactDetails._id])}` : 
                            'Offline'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                  <div className="text-center text-gray-500">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-500">No messages yet. Start a conversation!</div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={message._id || `temp-${index}`}
                      className={`flex ${message.sender._id === user?._id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                          message.sender._id === user?._id
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-800'
                      }`}
                    >
                      <p>{message.content}</p>
                      <div
                        className={`text-xs mt-1 flex items-center ${
                            message.sender._id === user?._id ? 'text-blue-100 justify-end' : 'text-gray-500'
                        }`}
                      >
                        <Clock size={12} className="mr-1" />
                          {formatTime(message.created_at)}
                          {message.sender._id === user?._id && (
                            <span className="ml-1">
                              {message.sending ? (
                                <Clock size={12} className="text-blue-100 animate-pulse" />
                              ) : message.read_by_receiver ? (
                                <CheckCheck size={12} className="text-blue-100" />
                              ) : message.sent || message.delivered ? (
                                <Check size={12} className="text-blue-100" />
                              ) : (
                                <Clock size={12} className="text-blue-100" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Message input */}
              <div className="p-4 border-t bg-white">
                <div className="flex">
                  <Input
                    type="text"
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    fullWidth
                    className="mr-2"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendMessage();
                    }}
                  />
                  <Button
                    variant="primary"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                  >
                    <Send size={20} />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-4">
              <User size={48} className="text-gray-300 mb-4" />
              <p className="text-gray-500 mb-2">Select a contact to start messaging</p>
              {filteredContacts.length === 0 && !loading && (
                <p className="text-sm text-gray-400 text-center max-w-md">
                  No contacts available for messaging. 
                  {user?.role === 'parent' ? 
                    " Parents can message teachers." :
                    user?.role === 'teacher' ? 
                    " Teachers can message parents and administrators." :
                    user?.role === 'admin' || user?.role === 'super_admin' ? 
                    " Administrators can message teachers." :
                    " Your role doesn't have messaging permissions."}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}