import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../lib/store';
import Button from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { io, Socket } from 'socket.io-client';
import { motion } from 'framer-motion';

interface Suggestion {
  _id: string;
  content: string;
  type: string;
  subject: string;
  created_at: string;
  read_by_receiver: boolean;
  sender: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    user_id_number: string;
  };
}

export default function AdminSuggestionsPage() {
  const { user } = useAuthStore();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replying, setReplying] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Connect to socket.io server
  useEffect(() => {
    if (!user || !user._id || (user.role !== 'admin' && user.role !== 'super_admin')) return;
    
    // Extract base URL without any path
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const baseUrl = apiUrl.replace(/\/api$/, ''); // Remove '/api' if present
    
    console.log('Admin Suggestions connecting to socket server at:', baseUrl);
    
    // Connect to the socket server
    const socketInstance = io(baseUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      path: '/socket.io'
    });
    
    // Set up event listeners
    socketInstance.on('connect', () => {
      console.log('Admin Suggestions connected to socket server with ID:', socketInstance.id);
      // Authenticate with user ID
      socketInstance.emit('authenticate', user._id);
    });
    
    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
    
    socketInstance.on('newSuggestion', (suggestion: Suggestion) => {
      console.log('New suggestion received:', suggestion);
      // Add new suggestion to the list
      setSuggestions(prev => {
        // Check if suggestion already exists
        const exists = prev.some(s => s._id === suggestion._id);
        if (!exists) {
          return [suggestion, ...prev];
        }
        return prev;
      });
      
      // Show notification
      toast.success(`New suggestion from ${suggestion.sender.firstName} ${suggestion.sender.lastName}`);
      
      // Play notification sound if available
      const audio = new Audio('/notification.mp3');
      audio.play().catch(err => console.error('Error playing sound:', err));
    });
    
    // Save socket instance
    setSocket(socketInstance);
    
    // Clean up on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'super_admin')) {
      fetchSuggestions();
    }
  }, [user]);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      // Use the admin suggestions API endpoint - remove duplicate /api prefix
      const { data } = await api.get('/admin/suggestions');
      console.log('Fetched suggestions:', data);
      
      // Ensure we have valid data
      if (Array.isArray(data)) {
        setSuggestions(data);
      } else {
        console.error('Invalid suggestions data format:', data);
        toast.error('Invalid data format received');
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      toast.error('Failed to load suggestions');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (suggestionId: string) => {
    try {
      // For test data, just update the UI without calling the API
      if (suggestionId.startsWith('mock-')) {
        setSuggestions(prev => 
          prev.map(s => s._id === suggestionId ? { ...s, read_by_receiver: true } : s)
        );
        return;
      }
      
      // For real data, call the API
      await api.patch(`/messages/${suggestionId}/read`);
      setSuggestions(prev => 
        prev.map(s => s._id === suggestionId ? { ...s, read_by_receiver: true } : s)
      );
      
      // If socket is connected, emit the read event
      if (socket && socket.connected) {
        socket.emit('markAsRead', suggestionId);
      }
    } catch (error) {
      console.error('Error marking suggestion as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSuggestion || !replyContent.trim()) return;

    setReplying(true);
    try {
      if (socket && socket.connected) {
        // Use socket for real-time messaging
        socket.emit('sendMessage', {
          receiver: selectedSuggestion.sender._id,
          subject: `Re: ${selectedSuggestion.subject}`,
          content: replyContent
        });
        
        toast.success('Reply sent successfully');
        setReplyContent('');
        setSelectedSuggestion(null);
      } else {
        // Fallback to REST API
        await api.post('/messages', {
          receiver_id: selectedSuggestion.sender._id,
          subject: `Re: ${selectedSuggestion.subject}`,
          content: replyContent,
          type: 'general'
        });

        toast.success('Reply sent successfully');
        setReplyContent('');
        setSelectedSuggestion(null);
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setReplying(false);
    }
  };

  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800">Access Denied</h2>
          <p className="mt-2 text-gray-600">Only administrators can view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-indigo-800">Parent Suggestions & Questions</h1>
          <p className="text-gray-600 mt-1">Manage and respond to parent feedback</p>
        </div>
        <Button 
          variant="primary" 
          onClick={fetchSuggestions}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 transition-all duration-300 flex items-center gap-2 shadow-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </motion.div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : suggestions.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-8 text-center max-w-lg mx-auto border border-indigo-100"
        >
          <div className="text-indigo-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-gray-600 text-lg">No suggestions or questions have been submitted yet.</p>
          <p className="text-gray-500 mt-2">When parents submit feedback, it will appear here.</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suggestions.map((suggestion, index) => (
            <motion.div
              key={suggestion._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className={`hover:shadow-xl transition-all duration-300 border-l-4 ${suggestion.read_by_receiver ? 'border-gray-300' : 'border-indigo-500'} overflow-hidden`}>
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                      <h3 className="font-semibold text-lg text-gray-800 mr-2">{suggestion.subject}</h3>
                      {!suggestion.read_by_receiver && (
                        <Badge color="blue" className="animate-pulse">New</Badge>
                      )}
                    </div>
                    <Badge color={suggestion.type === 'suggestion' ? 'green' : 'purple'} className="capitalize px-3 py-1">
                      {suggestion.type}
                    </Badge>
                  </div>
                  
                  <p className="text-gray-700 mb-4 line-clamp-3 min-h-[4.5rem]">{suggestion.content}</p>
                  
                  <div className="text-sm text-gray-500 mb-4 flex items-center">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mr-2 font-bold">
                      {suggestion.sender.firstName.charAt(0)}{suggestion.sender.lastName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium">{suggestion.sender.firstName} {suggestion.sender.lastName}</div>
                      <div className="text-xs">{new Date(suggestion.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2 mt-2">
                    {!suggestion.read_by_receiver && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => markAsRead(suggestion._id)}
                        className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
                      >
                        Mark as Read
                      </Button>
                    )}
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => {
                        if (!suggestion.read_by_receiver) {
                          markAsRead(suggestion._id);
                        }
                        setSelectedSuggestion(suggestion);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      View & Reply
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal for viewing and replying to a suggestion */}
      {selectedSuggestion && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          >
            <div className="border-b border-gray-200 bg-indigo-50 p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-indigo-800">
                {selectedSuggestion.subject}
              </h2>
              <Badge color={selectedSuggestion.type === 'suggestion' ? 'green' : 'purple'} className="capitalize">
                {selectedSuggestion.type}
              </Badge>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="mb-4 flex items-center">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mr-3 font-bold">
                  {selectedSuggestion.sender.firstName.charAt(0)}{selectedSuggestion.sender.lastName.charAt(0)}
                </div>
                <div>
                  <div className="font-medium">{selectedSuggestion.sender.firstName} {selectedSuggestion.sender.lastName}</div>
                  <div className="text-xs text-gray-500">{selectedSuggestion.sender.email}</div>
                  <div className="text-xs text-gray-500">{new Date(selectedSuggestion.created_at).toLocaleString()}</div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-5 rounded-lg mb-6 whitespace-pre-wrap border border-gray-200 shadow-inner text-gray-700">
                {selectedSuggestion.content}
              </div>
              
              <form onSubmit={handleReply} className="space-y-4">
                <div>
                  <label htmlFor="reply" className="block text-sm font-medium text-gray-700 mb-1">
                    Reply to {selectedSuggestion.sender.firstName}
                  </label>
                  <textarea
                    id="reply"
                    rows={6}
                    className="w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    required
                    placeholder="Type your response here..."
                  ></textarea>
                </div>
                
                <div className="flex justify-end space-x-3 pt-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setSelectedSuggestion(null)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    variant="primary"
                    disabled={replying || !replyContent.trim()}
                    className={`${replying || !replyContent.trim() ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} transition-colors duration-300`}
                  >
                    {replying ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </span>
                    ) : 'Send Reply'}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
} 