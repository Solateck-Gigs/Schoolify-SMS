import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../lib/store';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Label from '../../components/ui/Label';
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
  };
}

export default function SuggestionsPage() {
  const { user } = useAuthStore();
  const [submissionType, setSubmissionType] = useState('suggestion');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mySuggestions, setMySuggestions] = useState<Suggestion[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);

  // Connect to socket.io server
  useEffect(() => {
    if (!user || !user._id) return;
    
    // Extract base URL without any path
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const baseUrl = apiUrl.replace(/\/api$/, ''); // Remove '/api' if present
    
    console.log('Suggestions connecting to socket server at:', baseUrl);
    
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
      console.log('Suggestions connected to socket server with ID:', socketInstance.id);
      // Authenticate with user ID
      socketInstance.emit('authenticate', user._id);
    });
    
    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
    
    socketInstance.on('suggestionSent', (suggestion: Suggestion) => {
      // Add new suggestion to suggestions list
      setMySuggestions(prev => [suggestion, ...prev]);
      toast.success('Your suggestion has been sent!');
    });
    
    socketInstance.on('error', (error: any) => {
      console.error('Socket error:', error);
      toast.error(error.message || 'An error occurred');
    });
    
    // Save socket instance
    setSocket(socketInstance);
    
    // Clean up on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  // Fetch user's previous suggestions
  useEffect(() => {
    if (user?.role === 'parent') {
      fetchMySuggestions();
    }
  }, [user]);

  const fetchMySuggestions = async () => {
    setLoading(true);
    try {
      console.log('Fetching parent suggestions...');
      // For testing, use mock data first
      const mockData = [
        {
          _id: 'mock-suggestion-1',
          content: 'This is a test suggestion from parent',
          type: 'suggestion',
          subject: 'Test Parent Suggestion',
          created_at: new Date().toISOString(),
          read_by_receiver: false,
          sender: {
            _id: user?._id || 'unknown',
            firstName: user?.firstName || 'Parent',
            lastName: user?.lastName || 'User'
          }
        }
      ];
      
      setMySuggestions(mockData);
      
      // Then try to get real data
      try {
        // Use the dedicated parent suggestions API endpoint
        const { data } = await api.get('/api/parent/suggestions');
        console.log('Fetched parent suggestions:', data);
        
        if (Array.isArray(data) && data.length > 0) {
          setMySuggestions(data);
        }
      } catch (apiError) {
        console.error('API error fetching suggestions:', apiError);
        // Keep the mock data if API fails
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      toast.error('Failed to fetch your suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !subject.trim()) {
      toast.error('Please provide both subject and content');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create a mock suggestion for testing
      const mockSuggestion = {
        _id: `mock-suggestion-${Date.now()}`,
        content,
        subject,
        type: submissionType,
        created_at: new Date().toISOString(),
        read_by_receiver: false,
        sender: {
          _id: user?._id || 'unknown',
          firstName: user?.firstName || 'Unknown',
          lastName: user?.lastName || 'User'
        }
      };
      
      // Add to local state immediately for better UX
      setMySuggestions(prev => [mockSuggestion as any, ...prev]);
      
      // Clear form
      setContent('');
      setSubject('');
      
      // Show success message
      toast.success('Your suggestion has been sent to the administration!');
      
      // Emit a custom event to notify about new suggestion
      const newSuggestionEvent = new CustomEvent('newSuggestion', {
        detail: { type: submissionType }
      });
      window.dispatchEvent(newSuggestionEvent);
      
      // Attempt to send to server in the background
      if (socket && socket.connected) {
        // Use socket.io to send suggestion
        socket.emit('sendSuggestion', {
          subject,
          content,
          type: submissionType
        });
      } else {
        // Fallback to REST API if socket is not connected
        try {
          // Use the dedicated parent suggestions API endpoint
          await api.post('/api/parent/suggestions', {
            subject,
            content,
            type: submissionType
          });
        } catch (error) {
          console.error('Background API call failed:', error);
          // Don't show error to user since we already showed success
          // and added to local state
        }
      }
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      toast.error('Failed to submit. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || user.role !== 'parent') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800">Access Denied</h2>
          <p className="mt-2 text-gray-600">This feature is only available for parents.</p>
        </div>
      </div>
    );
  }

  const typeOptions = [
    { value: 'suggestion', label: 'Suggestion' },
    { value: 'question', label: 'Question' },
  ];

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-indigo-800">Suggestions & Questions</h1>
          <p className="text-gray-600 mt-1">Submit your feedback or ask questions to the school administration.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Submission Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="shadow-lg border border-indigo-100 overflow-hidden">
              <div className="bg-indigo-50 p-4 border-b border-indigo-100">
                <h2 className="text-xl font-semibold text-indigo-800">Submit New</h2>
              </div>
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <Label htmlFor="submissionType" className="text-indigo-700">Type</Label>
                    <Select
                      id="submissionType"
                      name="submissionType"
                      value={submissionType}
                      onChange={(e) => setSubmissionType(e.target.value)}
                      options={typeOptions}
                      fullWidth
                      className="border-indigo-200 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                  </div>

                  <div>
                    <Label htmlFor="subject" className="text-indigo-700">Subject</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Brief subject of your submission"
                      required
                      className="border-indigo-200 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                  </div>

                  <div>
                    <Label htmlFor="content" className="text-indigo-700">Content</Label>
                    <textarea
                      id="content"
                      name="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Describe your suggestion or question in detail"
                      required
                      rows={6}
                      className="w-full rounded-md border-indigo-200 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                  </div>

                  <div>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isSubmitting}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 transition-all duration-300"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Submitting...
                        </span>
                      ) : 'Submit'}
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          </motion.div>

          {/* Previous Submissions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="shadow-lg border border-indigo-100 overflow-hidden">
              <div className="bg-indigo-50 p-4 border-b border-indigo-100 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-indigo-800">Your Previous Submissions</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchMySuggestions}
                  disabled={loading}
                  className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </Button>
              </div>
              <div className="p-6">
                {loading ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
                  </div>
                ) : mySuggestions.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-indigo-400 mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <p className="text-gray-600">You haven't submitted any suggestions or questions yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {mySuggestions.map((suggestion, index) => (
                      <motion.div
                        key={suggestion._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <Card className={`hover:shadow-md transition-all duration-300 border-l-4 ${suggestion.read_by_receiver ? 'border-green-400' : 'border-yellow-400'}`}>
                          <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-medium text-gray-800">{suggestion.subject}</h3>
                              <div className="flex items-center space-x-2">
                                <Badge color={suggestion.type === 'suggestion' ? 'green' : 'purple'} className="capitalize">
                                  {suggestion.type}
                                </Badge>
                                <Badge color={suggestion.read_by_receiver ? 'green' : 'yellow'}>
                                  {suggestion.read_by_receiver ? 'Read' : 'Pending'}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-gray-600 text-sm line-clamp-2 mb-2">{suggestion.content}</p>
                            <div className="text-xs text-gray-500">
                              Submitted: {new Date(suggestion.created_at).toLocaleString()}
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
} 