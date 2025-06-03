import React, { useState, useEffect } from 'react';
import { Send, Search, User, Paperclip, Clock } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { useAuthStore } from '../../lib/store';
import { Message } from '../../types';

export default function MessagesPage() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    // Fetch contacts and messages from Supabase
    // This is a mock implementation
    const fetchData = async () => {
      // In a real app, this would be a Supabase query
      const mockContacts = [
        { id: 'contact1', name: 'John Smith', role: 'Teacher', subject: 'Mathematics', unread: 2 },
        { id: 'contact2', name: 'Mary Johnson', role: 'Parent', child: 'Emma Johnson', unread: 0 },
        { id: 'contact3', name: 'Robert Davis', role: 'Teacher', subject: 'Science', unread: 0 },
        { id: 'contact4', name: 'Lisa Chen', role: 'Parent', child: 'Michael Chen', unread: 1 },
      ];
      
      const mockMessages: Message[] = [
        {
          id: '1',
          senderId: 'contact1',
          receiverId: user?.id || '',
          content: 'Hello, I wanted to discuss Emma\'s progress in mathematics.',
          timestamp: '2023-05-15T14:30:00',
          isRead: true,
        },
        {
          id: '2',
          senderId: user?.id || '',
          receiverId: 'contact1',
          content: 'Hi, that sounds good. What aspects of her performance would you like to discuss?',
          timestamp: '2023-05-15T14:35:00',
          isRead: true,
        },
        {
          id: '3',
          senderId: 'contact1',
          receiverId: user?.id || '',
          content: 'She\'s been doing well on homework, but I noticed she struggled on the recent quiz. I\'d like to suggest some additional practice problems.',
          timestamp: '2023-05-15T14:40:00',
          isRead: true,
        },
        {
          id: '4',
          senderId: 'contact1',
          receiverId: user?.id || '',
          content: 'Would you be available for a meeting next week to discuss this further?',
          timestamp: '2023-05-15T14:42:00',
          isRead: false,
        },
      ];
      
      setContacts(mockContacts);
      setMessages(mockMessages);
      
      if (mockContacts.length > 0) {
        setSelectedContact(mockContacts[0].id);
      }
    };
    
    fetchData();
  }, [user]);
  
  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const currentMessages = messages.filter(message => 
    (message.senderId === selectedContact && message.receiverId === user?.id) ||
    (message.receiverId === selectedContact && message.senderId === user?.id)
  ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  const selectedContactDetails = contacts.find(contact => contact.id === selectedContact);
  
  const handleSendMessage = () => {
    if (newMessage.trim() === '' || !selectedContact || !user) return;
    
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      senderId: user.id,
      receiverId: selectedContact,
      content: newMessage,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    
    setMessages([...messages, newMsg]);
    setNewMessage('');
    
    // In a real app, you would also save this to Supabase
  };
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
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
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                  selectedContact === contact.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => setSelectedContact(contact.id)}
              >
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                    <User size={20} className="text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">{contact.name}</h3>
                      {contact.unread > 0 && (
                        <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 font-bold">
                          {contact.unread}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {contact.role === 'Teacher' 
                        ? `${contact.role} - ${contact.subject}` 
                        : `${contact.role} of ${contact.child}`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Chat area */}
        <div className="hidden sm:flex flex-col flex-1 bg-gray-50">
          {selectedContact ? (
            <>
              {/* Chat header */}
              <div className="p-4 border-b bg-white flex items-center">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                  <User size={20} className="text-gray-500" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{selectedContactDetails?.name}</h3>
                  <p className="text-sm text-gray-500">
                    {selectedContactDetails?.role === 'Teacher' 
                      ? `${selectedContactDetails.role} - ${selectedContactDetails.subject}` 
                      : `${selectedContactDetails?.role} of ${selectedContactDetails?.child}`}
                  </p>
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {currentMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.senderId === user?.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-800'
                      }`}
                    >
                      <p>{message.content}</p>
                      <div
                        className={`text-xs mt-1 flex items-center ${
                          message.senderId === user?.id ? 'text-blue-100 justify-end' : 'text-gray-500'
                        }`}
                      >
                        <Clock size={12} className="mr-1" />
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
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
                    variant="ghost"
                    className="mr-2"
                  >
                    <Paperclip size={20} />
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSendMessage}
                  >
                    <Send size={20} />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500">Select a contact to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}